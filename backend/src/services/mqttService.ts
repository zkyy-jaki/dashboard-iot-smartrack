/**
 * MQTT Service — Bridge between ESP32 hardware nodes and the backend.
 *
 * Subscribes to:  racks/+/telemetry           (from ESP32)
 * Publishes to:   racks/{rackId}/actuators    (to ESP32)
 *
 * On each telemetry message:
 *   1. Parse & validate JSON payload
 *   2. Compute temperature-compensated speed of sound
 *   3. Calculate estimated stock per row (with delta detection)
 *   4. If stock changed → insert InventoryLedger record (auto audit)
 *   5. Persist TelemetrySnapshot to SQLite
 *   6. Determine actuator state (LED + buzzer)
 *   7. Publish actuator command back to ESP32
 *   8. Emit `telemetryUpdate` Socket.IO event to all connected dashboard clients
 */

import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { Server as SocketServer } from 'socket.io';
import { prisma } from '../config/database';
import { config } from '../config';
import { calculateRowStock, determineActuatorState } from '../utils/stockCalculator';
import { generateTxId } from '../utils/helpers';
import type {
  MqttTelemetryPayload,
  ActuatorCommand,
  EnrichedRow,
  EnvironmentData,
  TelemetryUpdateEvent,
  LedState,
} from '../types';

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================
let mqttClient: MqttClient | null = null;
let socketIo: SocketServer | null = null;

// Track last known stock per row (for delta detection / ledger writes)
const lastKnownStock = new Map<string, number>(); // key: rowId, value: estimatedStock

// Track connectivity state
let isConnected = false;

// Track OTA update state
let latestOtaStatus = {
  status: 'IDLE',
  raw: '',
  timestamp: new Date().toISOString(),
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Initialise the MQTT client and bind Socket.IO for real-time push.
 */
export function initMqttService(io: SocketServer): void {
  socketIo = io;

  const options: IClientOptions = {
    clientId: `${config.mqtt.clientId}-${Math.floor(1000 + Math.random() * 9000)}`,
    clean: true,
    connectTimeout: 15_000,
    reconnectPeriod: config.mqtt.reconnectPeriodMs,
    keepalive: config.mqtt.keepaliveSecs,
    rejectUnauthorized: false,
  };

  // Only add credentials if they are configured
  if (config.mqtt.username) {
    options.username = config.mqtt.username;
    options.password = config.mqtt.password;
  }

  console.log(`[MQTT] Connecting to broker: ${config.mqtt.brokerUrl}`);
  mqttClient = mqtt.connect(config.mqtt.brokerUrl, options);

  mqttClient.on('connect', handleConnect);
  mqttClient.on('reconnect', () => console.log('[MQTT] Reconnecting…'));
  mqttClient.on('offline', () => {
    isConnected = false;
    console.warn('[MQTT] Client offline — broker unreachable. Entering graceful degradation mode.');
  });
  mqttClient.on('error', (err: Error) => {
    console.error('[MQTT] Connection error:', err.message);
    // Do NOT re-throw — allow reconnect loop to handle it
  });
  mqttClient.on('close', () => {
    isConnected = false;
    console.warn('[MQTT] Connection closed.');
  });
  mqttClient.on('message', handleMessage);
}

/**
 * Publish an actuator command to a specific rack.
 * Called both from the MQTT processing pipeline and REST API overrides.
 */
export function publishActuatorCommand(rackId: string, command: ActuatorCommand): boolean {
  if (!mqttClient || !isConnected) {
    console.warn(`[MQTT] Cannot publish to ${rackId}: client not connected.`);
    return false;
  }

  const topic = `${config.mqtt.actuatorTopicPrefix}/${rackId}/actuators`;
  
  // Format payload according to the 3-row RGB LED contract
  const payloadObject = {
    rackId: command.rackId,
    buzzerActive: command.buzzerActive,
    ledStates: command.ledStates,
    emergency: command.emergency,
    ...(command.reason && { reason: command.reason }),
    ...(command.issuedAt && { issuedAt: command.issuedAt }),
  };

  const payload = JSON.stringify(payloadObject);

  mqttClient.publish(topic, payload, { qos: 1, retain: false }, (err) => {
    if (err) {
      console.error(`[MQTT] Failed to publish actuator command to ${topic}:`, err.message);
    } else {
      console.log(
        `[MQTT] ▶ Actuator command sent → ${topic}: ` +
        `R1=${command.ledStates?.row1}, R2=${command.ledStates?.row2}, R3=${command.ledStates?.row3}, ` +
        `buzzer=${command.buzzerActive}, emergency=${command.emergency}`,
      );
    }
  });

  return true;
}

/**
 * Send plain text buzzer control command to ESP32: "MUTE", "ON", "OFF", "AUTO"
 */
export function sendBuzzerControlCommand(command: string): boolean {
  if (!mqttClient || !isConnected) {
    console.warn('[MQTT] Cannot send buzzer control command: client not connected.');
    return false;
  }

  const topic = config.mqtt.buzzerControlTopic;
  const payload = command.trim().toUpperCase();

  mqttClient.publish(topic, payload, { qos: 0, retain: false }, (err) => {
    if (err) {
      console.error(`[MQTT] Failed to publish buzzer command to ${topic}:`, err.message);
    } else {
      console.log(`[MQTT] ▶ Buzzer control command sent → ${topic}: "${payload}"`);
    }
  });

  return true;
}

/**
 * Return current MQTT connection status.
 */
export function getMqttStatus(): { connected: boolean; brokerUrl: string } {
  return { connected: isConnected, brokerUrl: config.mqtt.brokerUrl };
}

/**
 * Return current OTA update status.
 */
export function getOtaStatus(): { status: string; raw: string; timestamp: string } {
  return latestOtaStatus;
}

/**
 * Publish an OTA trigger command to ESP32: "warehouse/small_warehouse/ota/trigger"
 */
export function sendOtaTriggerCommand(payload: string): boolean {
  if (!mqttClient || !isConnected) {
    console.warn('[MQTT] Cannot send OTA trigger: client not connected.');
    return false;
  }
  const topic = config.mqtt.otaTriggerTopic;
  mqttClient.publish(topic, payload, { qos: 1, retain: false }, (err) => {
    if (err) {
      console.error(`[MQTT] Failed to publish OTA trigger to ${topic}:`, err.message);
    } else {
      console.log(`[MQTT] ▶ OTA trigger published to ${topic}: "${payload}"`);
    }
  });
  return true;
}

/**
 * Gracefully disconnect the MQTT client.
 */
export function disconnectMqtt(): void {
  if (mqttClient) {
    mqttClient.end(false, {}, () => console.log('[MQTT] Client disconnected gracefully.'));
    isConnected = false;
    mqttClient = null;
  }
}

// ============================================================================
// INTERNAL HANDLERS
// ============================================================================

function handleConnect(): void {
  if (!mqttClient) return;
  isConnected = true;
  console.log('[MQTT] ✓ Connected to broker successfully.');

  const topics = [
    config.mqtt.telemetryTopicPattern,         // "warehouse/small_warehouse/telemetry"
    config.mqtt.legacyTelemetryTopicPattern,   // "racks/+/telemetry"
    config.mqtt.otaStatusTopic,                // "warehouse/small_warehouse/ota/status"
  ];

  topics.forEach((top) => {
    mqttClient?.subscribe(top, { qos: 1 }, (err) => {
      if (err) {
        console.error(`[MQTT] Subscription error on ${top}:`, err.message);
      } else {
        console.log(`[MQTT] ✓ Subscribed to: ${top}`);
      }
    });
  });
}

function handleOtaStatusMessage(rawString: string): void {
  const clean = rawString.trim();
  let statusText = clean;
  let otaData: any = null;

  try {
    otaData = JSON.parse(clean);
    statusText = otaData.status || otaData.state || clean;
  } catch {
    statusText = clean;
  }

  const timestamp = new Date().toISOString();
  latestOtaStatus = {
    status: statusText.toUpperCase(),
    raw: clean,
    timestamp,
  };

  console.log(`[MQTT OTA] 🚀 Status firmware update: "${latestOtaStatus.status}" (topic: warehouse/small_warehouse/ota/status)`);

  if (socketIo) {
    socketIo.emit('ota_status', latestOtaStatus);
    socketIo.emit('otaStatus', latestOtaStatus);
  }
}

async function handleMessage(topic: string, rawPayload: Buffer): Promise<void> {
  const rawString = rawPayload.toString('utf8');

  // Handle OTA status topic: "warehouse/small_warehouse/ota/status"
  if (topic === config.mqtt.otaStatusTopic || topic.endsWith('/ota/status')) {
    handleOtaStatusMessage(rawString);
    return;
  }

  // Only process telemetry topics
  if (!topic.endsWith('/telemetry')) return;

  let parsed: any = null;
  let normalized: MqttTelemetryPayload | null = null;

  try {
    parsed = JSON.parse(rawString);
    normalized = normalizeTelemetryPayload(parsed);
  } catch (err) {
    console.error(`[MQTT] JSON parse error on topic "${topic}":`, (err as Error).message);
    return;
  }

  // ── IMMEDIATE DIRECT PUSH: Broadcast directly to all web dashboards instantly ──
  if (socketIo && parsed && typeof parsed === 'object') {
    try {
      const directPayload = extractDirectEdgeTelemetry(parsed);
      if (directPayload) {
        socketIo.emit('telemetry_update', directPayload);
        socketIo.emit('telemetryUpdate', directPayload);
        console.log(
          `[Socket.IO] ⚡ Instant telemetry broadcast: ${directPayload.summary.total_items} items | ` +
          `L1=${directPayload.floors[0]?.item_count}(${directPayload.floors[0]?.led_color}), ` +
          `L2=${directPayload.floors[1]?.item_count}(${directPayload.floors[1]?.led_color}), ` +
          `L3=${directPayload.floors[2]?.item_count}(${directPayload.floors[2]?.led_color})`
        );
      }
    } catch (pushErr) {
      console.warn('[Socket.IO] Direct push warning:', (pushErr as Error).message);
    }
  }

  if (!normalized) {
    console.warn(`[MQTT] Unrecognized telemetry payload on topic "${topic}" — skipping DB pipeline.`);
    return;
  }

  try {
    await processTelemetry(normalized);
  } catch (err) {
    console.error('[MQTT] processTelemetry error:', (err as Error).message);
  }
}

// ============================================================================
// TELEMETRY PROCESSING PIPELINE
// ============================================================================

async function processTelemetry(payload: MqttTelemetryPayload): Promise<void> {
  const { rackId, environment } = payload;
  const now = new Date();

  // ── Step 1: Compute temperature-compensated speed of sound ──
  const soundSpeedMs = 331.3 + 0.606 * environment.temperatureC;

  // ── Step 2: Fetch rack + rows + sensors from DB ──
  let rack: any = null;
  try {
    rack = await prisma.rack.findUnique({
      where: { rackId },
      include: { rows: { include: { product: true, sensorLeft: true, sensorRight: true } } },
    });
  } catch (dbErr) {
    console.warn('[MQTT] Database read error:', (dbErr as Error).message);
  }

  // ── Step 3: Process each row reading ──
  const enrichedRows: EnrichedRow[] = [];
  const ledgerInserts: Array<() => Promise<void>> = [];

  for (const rowReading of payload.rows) {
    const floorNum = parseInt(rowReading.rowId.replace(/\D/g, ''), 10) || 1;
    const dbRow = rack?.rows?.find((r: any) => r.rowId === rowReading.rowId) || {
      id: `fallback-${rowReading.rowId}`,
      rowId: rowReading.rowId,
      rowNumber: floorNum,
      sku: `SKU-00${floorNum}`,
      capacity: 4,
      rowSpanCm: 58.0,
      leftDistanceCm: rowReading.leftDistanceCm,
      rightDistanceCm: rowReading.rightDistanceCm,
      product: { name: `Kardus Lantai ${floorNum}`, lengthCm: 14.5 },
      sensorLeft: { online: true },
      sensorRight: { online: true },
    };

    const leftOnline = dbRow.sensorLeft?.online ?? true;
    const rightOnline = dbRow.sensorRight?.online ?? true;
    const bothOnline = leftOnline && rightOnline;

    // Calculate stock: if precalculated by edge MQTT (itemCount), use it directly!
    const defaultCalc = calculateRowStock(
      dbRow.rowSpanCm,
      rowReading.leftDistanceCm,
      rowReading.rightDistanceCm,
      dbRow.product.lengthCm,
      dbRow.capacity,
      bothOnline,
      environment.temperatureC,
    );

    let estimatedStock = defaultCalc.estimatedStock;
    let occupiedSpan = defaultCalc.occupiedSpan;
    let occupancyPct = defaultCalc.occupancyPct;
    let rawEstimated = defaultCalc.rawEstimated;
    let status = defaultCalc.status;

    if (rowReading.itemCount !== undefined) {
      estimatedStock = Math.min(dbRow.capacity, Math.max(0, rowReading.itemCount));
      occupancyPct = Math.min(100, Math.round((estimatedStock / dbRow.capacity) * 100));
      if (rowReading.occupiedSpanCm !== undefined) {
        occupiedSpan = Number(rowReading.occupiedSpanCm.toFixed(1));
        rawEstimated = Number((occupiedSpan / dbRow.product.lengthCm).toFixed(2));
      }
      if (estimatedStock === 0) {
        status = 'EMPTY';
      } else if (estimatedStock >= dbRow.capacity) {
        status = 'FULL CAPACITY';
      } else if (estimatedStock <= 2) {
        status = 'LOW STOCK';
      } else {
        status = 'IN STOCK';
      }
    }

    const calc = {
      occupiedSpan,
      rawEstimated,
      estimatedStock,
      occupancyPct,
      status,
      soundSpeedMs: defaultCalc.soundSpeedMs,
    };

    const prevStock = lastKnownStock.get(dbRow.rowId);
    const stockChanged = prevStock !== undefined && prevStock !== calc.estimatedStock;

    // ── Step 4: Auto-generate ledger entry if stock delta detected ──
    if (stockChanged && bothOnline) {
      const diff = calc.estimatedStock - (prevStock ?? 0);
      const eventType = diff > 0 ? 'Stock In' : 'Stock Out';
      const leftDelta = (rowReading.leftDistanceCm - dbRow.leftDistanceCm).toFixed(1);
      const trigger = `MQTT/ESP32 — ${rowReading.leftSensorId}/US-${rowReading.rightSensorId} Δ(L:${leftDelta}cm)`;

      // Capture closure values for deferred insert
      const closureRow = dbRow;
      const closureDiff = diff;
      const closureEventType = eventType;
      const closureCalc = calc;
      const closurePrevStock = prevStock ?? 0;
      const closureReading = rowReading;
      const closureTrigger = trigger;

      if (rack?.id && !closureRow.id.startsWith('fallback-')) {
        ledgerInserts.push(async () => {
          await prisma.inventoryLedger.create({
            data: {
              txId: generateTxId('TX'),
              rackId: rack.id,
              rowId: closureRow.id,
              sku: closureRow.sku,
              prevStock: closurePrevStock,
              currentStock: closureCalc.estimatedStock,
              diff: closureDiff,
              eventType: closureEventType,
              trigger: closureTrigger,
              leftDistCm: closureReading.leftDistanceCm,
              rightDistCm: closureReading.rightDistanceCm,
            },
          }).catch(() => {});
          console.log(
            `[Ledger] ✓ ${closureEventType} recorded — ${closureRow.rowId}: ` +
            `${closurePrevStock} → ${closureCalc.estimatedStock} boxes (Δ${closureDiff > 0 ? '+' : ''}${closureDiff})`,
          );
        });
      }
    }

    // Update last known stock
    lastKnownStock.set(dbRow.rowId, calc.estimatedStock);

    // ── Update DB row distances ──
    if (rack && !dbRow.id.startsWith('fallback-')) {
      await prisma.rackRow.update({
        where: { id: dbRow.id },
        data: {
          leftDistanceCm: rowReading.leftDistanceCm,
          rightDistanceCm: rowReading.rightDistanceCm,
          lastUpdated: now,
        },
      }).catch(() => {});
    }

    // ── Update sensor RSSI & lastSeen ──
    if (rowReading.rssi !== undefined && rack) {
      await prisma.sensor.update({
        where: { sensorId: rowReading.leftSensorId },
        data: { signalRssi: rowReading.rssi, lastSeen: now },
      }).catch(() => { /* sensor may not exist yet */ });
    }

    enrichedRows.push({
      rowId: dbRow.rowId,
      rowNumber: dbRow.rowNumber,
      rackId: rack?.rackId ?? 'RACK-001',
      sku: dbRow.sku,
      productName: dbRow.product.name,
      productLengthCm: dbRow.product.lengthCm,
      capacity: dbRow.capacity,
      rowSpanCm: dbRow.rowSpanCm,
      leftSensorId: rowReading.leftSensorId ?? dbRow.leftSensorId,
      rightSensorId: rowReading.rightSensorId ?? dbRow.rightSensorId,
      leftDistanceCm: rowReading.leftDistanceCm,
      rightDistanceCm: rowReading.rightDistanceCm,
      leftSensorOnline: leftOnline,
      rightSensorOnline: rightOnline,
      sensorsOnline: bothOnline,
      lastUpdated: now.toISOString(),
      ...calc,
    });
  }

  // ── Step 5: Persist TelemetrySnapshot (ring-buffer) ──
  if (rack?.id) {
    await prisma.telemetrySnapshot.create({
      data: {
        rackId: rack.id,
        temperatureC: environment.temperatureC,
        humidityRh: environment.humidityRh,
        gasPpm: environment.gasPpm,
        soundSpeedMs,
      },
    }).catch(() => {});
    // Prune old snapshots beyond retention limit
    const snapshotCount = await prisma.telemetrySnapshot.count({ where: { rackId: rack.id } });
    if (snapshotCount > config.telemetryRetentionCount) {
      const oldest = await prisma.telemetrySnapshot.findMany({
        where: { rackId: rack.id },
        orderBy: { createdAt: 'asc' },
        take: snapshotCount - config.telemetryRetentionCount,
        select: { id: true },
      });
      await prisma.telemetrySnapshot.deleteMany({
        where: { id: { in: oldest.map((s) => s.id) } },
      });
    }
  }

  // ── Step 6: Run ledger inserts (after DB row updates complete) ──
  for (const insertFn of ledgerInserts) {
    await insertFn();
  }

  // ── Step 7: Determine actuator state (3 independent row LEDs + buzzer + emergency) ──
  const { ledStates, buzzerActive, emergency, reason, ledState } = determineActuatorState(
    enrichedRows,
    environment.temperatureC,
    environment.gasPpm,
    config.thresholds.tempDangerC,
    config.thresholds.gasDangerPpm,
  );

  const actuatorCommand: ActuatorCommand = {
    rackId,
    buzzerActive,
    ledStates,
    emergency,
    ledState,
    reason,
    issuedAt: now.toISOString(),
  };

  // ── Step 8: Publish actuator command back to ESP32 ──
  publishActuatorCommand(rackId, actuatorCommand);

  // ── Step 9: Build environment DTO for frontend ──
  const isEmergency =
    environment.hazardDetected ||
    emergency ||
    environment.temperatureC >= config.thresholds.tempDangerC ||
    environment.gasPpm >= config.thresholds.gasDangerPpm ||
    (environment.gasPct !== undefined && environment.gasPct >= 44.0);

  const gasStatus = isEmergency
    ? 'Danger'
    : environment.gasPpm >= config.thresholds.gasWarningPpm
    ? 'Warning'
    : 'Normal';

  const environmentData: EnvironmentData = {
    temperatureC: environment.temperatureC,
    humidityRh: environment.humidityRh,
    gasPpm: environment.gasPpm,
    gasStatus,
    soundSpeedMs: Number(soundSpeedMs.toFixed(2)),
    gasWarningThreshold: config.thresholds.gasWarningPpm,
    gasDangerThreshold: config.thresholds.gasDangerPpm,
    gasRaw: environment.gasRaw,
    gasPct: environment.gasPct,
    hazardDetected: environment.hazardDetected ?? isEmergency,
    safetyState: environment.safetyState ?? (isEmergency ? 'ALARM_TRIGGERED' : 'SAFE_NORMAL'),
  };

  // ── Step 10: Emit `telemetryUpdate` Socket.IO event ──
  if (socketIo) {
    const totalStock = enrichedRows.reduce((acc, r) => acc + r.estimatedStock, 0);
    const totalCapacity = enrichedRows.reduce((acc, r) => acc + r.capacity, 0);
    const totalSensorsCount = await prisma.sensor.count().catch(() => 8);
    const onlineSensorsCount = await prisma.sensor.count({ where: { online: true } }).catch(() => 8);

    // Build Edge Telemetry Floor models
    const floors = enrichedRows.map((r, idx) => {
      const floorNum = r.rowNumber || idx + 1;
      const leftDetected = r.leftDistanceCm > 0 && r.leftDistanceCm < 18.0;
      const rightDetected = r.rightDistanceCm > 0 && r.rightDistanceCm < 18.0;

      const isFull = (leftDetected && rightDetected) || r.estimatedStock >= r.capacity;
      const isEmpty = (!leftDetected && !rightDetected) || r.estimatedStock === 0;

      const status: 'EMPTY' | 'PARTIAL' | 'FULL' =
        isFull ? 'FULL' : isEmpty ? 'EMPTY' : 'PARTIAL';

      const ledColor: 'RED' | 'BLUE' | 'GREEN' | 'BLINK_RED' =
        isEmergency
          ? 'BLINK_RED'
          : status === 'FULL'
          ? 'GREEN'
          : status === 'EMPTY'
          ? 'RED'
          : 'BLUE';

      const itemCount = isFull ? Math.max(4, r.estimatedStock) : isEmpty ? 0 : r.estimatedStock;

      return {
        floor: floorNum,
        distance_left_cm: r.leftDistanceCm,
        distance_right_cm: r.rightDistanceCm,
        occupied_span_cm: r.occupiedSpan,
        item_count: itemCount,
        is_occupied: !isEmpty,
        detected_sides: (leftDetected ? 1 : 0) + (rightDetected ? 1 : 0),
        status,
        led_color: ledColor,
      };
    });

    const occupiedFloors = floors.filter((f) => f.item_count > 0).length;
    const warehouseStatus: 'EMPTY' | 'PARTIAL' | 'FULL' =
      totalStock === 0 ? 'EMPTY' : totalStock >= totalCapacity ? 'FULL' : 'PARTIAL';

    const edgeTelemetryPayload: any = {
      firmware_version: 'v1.0.7',
      firmwareVersion: 'v1.0.7',
      otaStatus: latestOtaStatus,
      floors,
      summary: {
        total_items: totalStock,
        occupied_floors: occupiedFloors,
        warehouse_status: warehouseStatus,
        totalStock,
        totalCapacity,
        activeRowsCount: occupiedFloors,
        totalRowsCount: enrichedRows.length,
        onlineSensorsCount,
        totalSensorsCount,
      },
      environment: {
        temperature_c: environmentData.temperatureC,
        humidity_pct: environmentData.humidityRh,
        gas_raw: environmentData.gasRaw ?? environmentData.gasPpm,
        gas_pct: environmentData.gasPct ?? Number(((environmentData.gasPpm / 1000) * 100).toFixed(1)),
        hazard_detected: Boolean(environmentData.hazardDetected || isEmergency),
        safety_state: (isEmergency ? 'ALARM_TRIGGERED' : 'SAFE_NORMAL') as 'SAFE_NORMAL' | 'ALARM_TRIGGERED',
        temperatureC: environmentData.temperatureC,
        humidityRh: environmentData.humidityRh,
        gasPpm: environmentData.gasPpm,
      },
      actuators: {
        buzzer: buzzerActive,
      },
      rackId,
      timestamp: now.toISOString(),
      rows: enrichedRows,
      env: {
        temperatureC: environmentData.temperatureC,
        humidityRh: environmentData.humidityRh,
        gasPpm: environmentData.gasPpm,
      },
      alerts: {
        gasStatus: environmentData.gasStatus,
        isEmergency,
      },
      actuatorState: actuatorCommand,
      actuatorCommand: {
        led: actuatorCommand.ledState,
        buzzer: actuatorCommand.buzzerActive,
      },
    };

    socketIo.emit('telemetry_update', edgeTelemetryPayload);
    socketIo.emit('telemetryUpdate', edgeTelemetryPayload);
    console.log(
      `[Socket.IO] ◀▶ telemetry_update emitted — items=${totalStock}, floors=${occupiedFloors}/3, ` +
      `LEDs=${JSON.stringify(ledStates)}, buzzer=${buzzerActive}, emergency=${emergency}`,
    );
  }
}

// ============================================================================
// PAYLOAD NORMALIZATION & VALIDATION (Supports both Warehouse & Legacy schema)
// ============================================================================

function normalizeTelemetryPayload(parsed: unknown): MqttTelemetryPayload | null {
  if (typeof parsed !== 'object' || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;

  // Check if it's the Warehouse MQTT format (with `floors` object or array)
  if (obj['floors'] && typeof obj['floors'] === 'object') {
    let floorEntries: Array<{ floorNum: number; data: Record<string, unknown> }> = [];

    if (Array.isArray(obj['floors'])) {
      floorEntries = (obj['floors'] as Array<Record<string, unknown>>).map((f, idx) => ({
        floorNum: typeof f['floor'] === 'number' ? f['floor'] : idx + 1,
        data: f,
      }));
    } else {
      const floorsObj = obj['floors'] as Record<string, unknown>;
      const keys = Object.keys(floorsObj);
      for (const k of keys) {
        const match = k.match(/\d+/);
        const floorNum = match ? parseInt(match[0], 10) : 1;
        const data = floorsObj[k];
        if (typeof data === 'object' && data !== null) {
          floorEntries.push({ floorNum, data: data as Record<string, unknown> });
        }
      }
      floorEntries.sort((a, b) => a.floorNum - b.floorNum);
    }

    const envObj =
      typeof obj['environment'] === 'object' && obj['environment'] !== null
        ? (obj['environment'] as Record<string, unknown>)
        : {};

    const rows: import('../types').MqttRowReading[] = floorEntries.map(({ floorNum, data: f }) => {
      const rowId = `Row 0${floorNum}`;
      const dLeft = parseFloat(String(f['distance_left_cm'] ?? 0)) || 0;
      const dRight = parseFloat(String(f['distance_right_cm'] ?? 0)) || 0;
      const occupied = f['occupied_span_cm'] !== undefined ? parseFloat(String(f['occupied_span_cm'])) : undefined;
      const items = f['item_count'] !== undefined ? parseInt(String(f['item_count']), 10) : undefined;

      return {
        rowId,
        leftDistanceCm: dLeft,
        rightDistanceCm: dRight,
        leftSensorId: `US-0${floorNum * 2 - 1}`,
        rightSensorId: `US-0${floorNum * 2}`,
        occupiedSpanCm: isNaN(occupied as number) ? undefined : occupied,
        itemCount: isNaN(items as number) ? undefined : items,
        status: typeof f['status'] === 'string' ? f['status'] : undefined,
      };
    });

    const rawTemp =
      envObj['temperature_c'] ??
      envObj['temperatureC'] ??
      envObj['temperature'] ??
      envObj['temp'] ??
      envObj['temp_c'] ??
      envObj['suhu'] ??
      envObj['t'] ??
      obj['temperature_c'] ??
      obj['temperatureC'] ??
      obj['temperature'] ??
      obj['temp'] ??
      obj['suhu'];
    const tempC = rawTemp !== undefined && !isNaN(parseFloat(String(rawTemp))) ? parseFloat(String(rawTemp)) : 27.5;

    const rawHum =
      envObj['humidity_pct'] ??
      envObj['humidityRh'] ??
      envObj['humidity'] ??
      envObj['hum'] ??
      envObj['hum_pct'] ??
      envObj['kelembaban'] ??
      envObj['rh'] ??
      obj['humidity_pct'] ??
      obj['humidityRh'] ??
      obj['humidity'] ??
      obj['hum'] ??
      obj['kelembaban'];
    const humPct = rawHum !== undefined && !isNaN(parseFloat(String(rawHum))) ? parseFloat(String(rawHum)) : 65.0;

    const rawGasVal =
      envObj['gas_raw'] ??
      envObj['gasPpm'] ??
      envObj['gas'] ??
      envObj['mq2'] ??
      envObj['gas_ppm'] ??
      obj['gas_raw'] ??
      obj['gasPpm'] ??
      obj['gas'] ??
      obj['mq2'];
    const gasRaw = rawGasVal !== undefined && !isNaN(parseInt(String(rawGasVal), 10)) ? parseInt(String(rawGasVal), 10) : 185;

    const gasPct = envObj['gas_pct'] !== undefined ? parseFloat(String(envObj['gas_pct'])) : undefined;
    const hazardDetected =
      typeof envObj['hazard_detected'] === 'boolean'
        ? envObj['hazard_detected']
        : tempC >= config.thresholds.tempDangerC || gasRaw >= config.thresholds.gasDangerPpm;

    const safetyState = typeof envObj['safety_state'] === 'string' ? envObj['safety_state'] : undefined;

    return {
      rackId: typeof obj['rackId'] === 'string' ? obj['rackId'] : 'RACK-001',
      timestamp: typeof obj['timestamp'] === 'string' ? obj['timestamp'] : new Date().toISOString(),
      rows,
      environment: {
        temperatureC: tempC,
        humidityRh: humPct,
        gasPpm: gasRaw,
        gasRaw,
        gasPct,
        hazardDetected,
        safetyState,
      },
    };
  }

  // Otherwise check legacy format
  if (isValidTelemetryPayload(parsed)) {
    return parsed;
  }

  return null;
}

function isValidTelemetryPayload(parsed: unknown): parsed is MqttTelemetryPayload {
  if (typeof parsed !== 'object' || parsed === null) return false;

  const obj = parsed as Record<string, unknown>;

  if (typeof obj['rackId'] !== 'string') return false;
  if (!Array.isArray(obj['rows'])) return false;
  if (typeof obj['environment'] !== 'object' || obj['environment'] === null) return false;

  const env = obj['environment'] as Record<string, unknown>;
  if (typeof env['temperatureC'] !== 'number') return false;
  if (typeof env['humidityRh'] !== 'number') return false;
  if (typeof env['gasPpm'] !== 'number') return false;

  // Validate at least one row entry
  for (const row of obj['rows'] as unknown[]) {
    if (typeof row !== 'object' || row === null) return false;
    const r = row as Record<string, unknown>;
    if (typeof r['rowId'] !== 'string') return false;
    if (typeof r['leftDistanceCm'] !== 'number') return false;
    if (typeof r['rightDistanceCm'] !== 'number') return false;
  }

  return true;
}

// ============================================================================
// DIRECT EDGE TELEMETRY EXTRACTOR (Zero-latency instant broadcast)
// ============================================================================

function extractDirectEdgeTelemetry(obj: Record<string, unknown>): any | null {
  if (typeof obj !== 'object' || obj === null) return null;

  let floorEntries: Array<{ floorNum: number; data: Record<string, unknown> }> = [];

  if (obj['floors'] && typeof obj['floors'] === 'object') {
    if (Array.isArray(obj['floors'])) {
      floorEntries = (obj['floors'] as Array<Record<string, unknown>>).map((f, idx) => ({
        floorNum: typeof f['floor'] === 'number' ? f['floor'] : idx + 1,
        data: f,
      }));
    } else {
      const floorsObj = obj['floors'] as Record<string, unknown>;
      const keys = Object.keys(floorsObj);
      for (const k of keys) {
        const match = k.match(/\d+/);
        const floorNum = match ? parseInt(match[0], 10) : 1;
        const data = floorsObj[k];
        if (typeof data === 'object' && data !== null) {
          floorEntries.push({ floorNum, data: data as Record<string, unknown> });
        }
      }
      floorEntries.sort((a, b) => a.floorNum - b.floorNum);
    }
  } else if (Array.isArray(obj['rows'])) {
    floorEntries = (obj['rows'] as Array<Record<string, unknown>>).map((r, idx) => {
      const match = String(r['rowId'] ?? '').match(/\d+/);
      const floorNum = match ? parseInt(match[0], 10) : idx + 1;
      return { floorNum, data: r };
    });
  } else {
    return null;
  }

  const firmwareVersion = String(
    obj['firmware_version'] ?? obj['firmwareVersion'] ?? obj['version'] ?? 'v1.0.7',
  );

  const envObj =
    typeof obj['environment'] === 'object' && obj['environment'] !== null
      ? (obj['environment'] as Record<string, unknown>)
      : {};
  const sumObj =
    typeof obj['summary'] === 'object' && obj['summary'] !== null
      ? (obj['summary'] as Record<string, unknown>)
      : {};
  const actObj =
    typeof obj['actuators'] === 'object' && obj['actuators'] !== null
      ? (obj['actuators'] as Record<string, unknown>)
      : {};

  const rawDirectTemp =
    envObj['temperature_c'] ??
    envObj['temperatureC'] ??
    envObj['temperature'] ??
    envObj['temp'] ??
    envObj['temp_c'] ??
    envObj['suhu'] ??
    envObj['t'] ??
    obj['temperature_c'] ??
    obj['temperatureC'] ??
    obj['temperature'] ??
    obj['temp'] ??
    obj['suhu'];
  const tempC = rawDirectTemp !== undefined && !isNaN(parseFloat(String(rawDirectTemp))) ? parseFloat(String(rawDirectTemp)) : 27.5;

  const rawDirectHum =
    envObj['humidity_pct'] ??
    envObj['humidityRh'] ??
    envObj['humidity'] ??
    envObj['hum'] ??
    envObj['hum_pct'] ??
    envObj['kelembaban'] ??
    envObj['rh'] ??
    obj['humidity_pct'] ??
    obj['humidityRh'] ??
    obj['humidity'] ??
    obj['hum'] ??
    obj['kelembaban'];
  const humPct = rawDirectHum !== undefined && !isNaN(parseFloat(String(rawDirectHum))) ? parseFloat(String(rawDirectHum)) : 65.0;

  const rawDirectGas =
    envObj['gas_raw'] ??
    envObj['gasPpm'] ??
    envObj['gas'] ??
    envObj['mq2'] ??
    envObj['gas_ppm'] ??
    obj['gas_raw'] ??
    obj['gasPpm'] ??
    obj['gas'] ??
    obj['mq2'];
  const gasRaw = rawDirectGas !== undefined && !isNaN(parseInt(String(rawDirectGas), 10)) ? parseInt(String(rawDirectGas), 10) : 185;
  const gasPct =
    envObj['gas_pct'] !== undefined
      ? parseFloat(String(envObj['gas_pct']))
      : Number(((gasRaw / 1000) * 100).toFixed(1));
  const isEmergency = Boolean(
    envObj['hazard_detected'] ||
      String(envObj['safety_state'] || '').includes('ALARM') ||
      tempC >= config.thresholds.tempDangerC ||
      gasRaw >= config.thresholds.gasDangerPpm,
  );

  const floors = floorEntries.map(({ floorNum, data: f }) => {
    const dLeft = parseFloat(String(f['distance_left_cm'] ?? f['leftDistanceCm'] ?? 0)) || 0;
    const dRight = parseFloat(String(f['distance_right_cm'] ?? f['rightDistanceCm'] ?? 0)) || 0;
    const occupied =
      f['occupied_span_cm'] !== undefined
        ? parseFloat(String(f['occupied_span_cm']))
        : f['occupiedSpan'] !== undefined
        ? parseFloat(String(f['occupiedSpan']))
        : Math.max(0, 58.0 - dLeft - dRight);

    // Threshold deteksi barang fisik aktual (18.0 cm sesuai firmware ESP32):
    // - Jarak < 18 cm pada 2 sisi = Terisi Penuh (Hijau)
    // - Jarak >= 18 cm pada 2 sisi = Kosong (Merah)
    // - Jarak < 18 cm pada 1 sisi = Terisi Sebagian (Biru)
    const detectThresholdCm = 18.0;
    const leftDetected = dLeft > 0 && dLeft < detectThresholdCm;
    const rightDetected = dRight > 0 && dRight < detectThresholdCm;

    let autoStatus: 'EMPTY' | 'PARTIAL' | 'FULL';
    let autoLedColor: 'RED' | 'BLUE' | 'GREEN' | 'BLINK_RED';
    let autoItems: number;

    if (leftDetected && rightDetected) {
      autoStatus = 'FULL';
      autoLedColor = 'GREEN';
      autoItems = 4;
    } else if (!leftDetected && !rightDetected) {
      autoStatus = 'EMPTY';
      autoLedColor = 'RED';
      autoItems = 0;
    } else {
      autoStatus = 'PARTIAL';
      autoLedColor = 'BLUE';
      autoItems = 2;
    }

    // Prioritaskan led_color dari hardware ESP32 jika tersedia
    const rawLed = typeof f['led_color'] === 'string' ? f['led_color'].trim().toUpperCase() : '';
    let ledColor: 'RED' | 'BLUE' | 'GREEN' | 'BLINK_RED' = isEmergency
      ? 'BLINK_RED'
      : rawLed === 'GREEN'
      ? 'GREEN'
      : rawLed === 'RED'
      ? 'RED'
      : rawLed === 'BLUE'
      ? 'BLUE'
      : rawLed === 'BLINK_RED'
      ? 'BLINK_RED'
      : autoLedColor;

    if (isEmergency) ledColor = 'BLINK_RED';

    let status =
      typeof f['status'] === 'string' && f['status'].trim()
        ? (f['status'] as string)
        : ledColor === 'GREEN'
        ? 'FULL'
        : ledColor === 'RED'
        ? 'EMPTY'
        : autoStatus;

    if (status === 'IN STOCK') status = 'PARTIAL';
    if (status === 'FULL CAPACITY') status = 'FULL';
    if (ledColor === 'GREEN') status = 'FULL';
    if (ledColor === 'RED') status = 'EMPTY';

    let items =
      status === 'FULL' || ledColor === 'GREEN'
        ? Math.max(4, parseInt(String(f['item_count'] ?? 4), 10) || 4)
        : status === 'EMPTY' || ledColor === 'RED'
        ? 0
        : Math.min(3, Math.max(1, parseInt(String(f['item_count'] ?? autoItems), 10) || 2));

    return {
      floor: floorNum,
      distance_left_cm: dLeft,
      distance_right_cm: dRight,
      occupied_span_cm: Number(occupied.toFixed(1)),
      item_count: items,
      is_occupied: items > 0,
      detected_sides: (leftDetected ? 1 : 0) + (rightDetected ? 1 : 0),
      status: status as 'EMPTY' | 'PARTIAL' | 'FULL',
      led_color: ledColor as 'RED' | 'BLUE' | 'GREEN' | 'BLINK_RED',
    };
  });

  const totalItems =
    sumObj['total_items'] !== undefined
      ? parseInt(String(sumObj['total_items']), 10)
      : floors.reduce((acc, f) => acc + f.item_count, 0);

  const occupiedFloors =
    sumObj['occupied_floors'] !== undefined
      ? parseInt(String(sumObj['occupied_floors']), 10)
      : floors.filter((f) => f.item_count > 0).length;

  const warehouseStatus =
    (sumObj['warehouse_status'] as 'EMPTY' | 'PARTIAL' | 'FULL') ||
    (totalItems === 0 ? 'EMPTY' : totalItems >= 12 ? 'FULL' : 'PARTIAL');

  return {
    firmware_version: firmwareVersion,
    firmwareVersion,
    otaStatus: latestOtaStatus,
    floors,
    summary: {
      total_items: totalItems,
      occupied_floors: occupiedFloors,
      warehouse_status: warehouseStatus,
      totalStock: totalItems,
      totalCapacity: 12,
      activeRowsCount: occupiedFloors,
      totalRowsCount: floors.length,
      onlineSensorsCount: 8,
      totalSensorsCount: 8,
    },
    environment: {
      temperature_c: tempC,
      humidity_pct: humPct,
      gas_raw: gasRaw,
      gas_pct: gasPct,
      hazard_detected: isEmergency,
      safety_state: isEmergency ? 'ALARM_TRIGGERED' : 'SAFE_NORMAL',
    },
    actuators: {
      buzzer: Boolean(actObj['buzzer'] || isEmergency),
    },
    timestamp: new Date().toISOString(),
  };
}
