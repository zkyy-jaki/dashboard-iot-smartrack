/**
 * Rack Controller — Handles GET /api/v1/racks/:rackId/overview
 * and PATCH /api/v1/racks/:rackId/rows/:rowId
 */
import type { Request, Response } from 'express';
import { prisma } from '../config/database';
import { config } from '../config';
import { calculateRowStock, determineActuatorState } from '../utils/stockCalculator';
import { publishActuatorCommand } from '../services/mqttService';
import type {
  RackOverview,
  EnrichedRow,
  EnvironmentData,
  ActuatorCommand,
  RackSummary,
  SensorStatus,
  ApiSuccess,
  ApiError,
} from '../types';

// ─── GET /api/v1/racks/:rackId/overview ─────────────────────────────────────
export async function getRackOverview(req: Request, res: Response): Promise<void> {
  const { rackId } = req.params;

  try {
    const rack = await prisma.rack.findUnique({
      where: { rackId },
      include: {
        rows: {
          orderBy: { rowNumber: 'asc' },
          include: {
            product: true,
            sensorLeft: true,
            sensorRight: true,
          },
        },
      },
    });

    if (!rack) {
      const errBody: ApiError = { success: false, error: `Rack "${rackId}" not found.` };
      res.status(404).json(errBody);
      return;
    }

    // Fetch latest telemetry snapshot for environmental data
    const latestSnapshot = await prisma.telemetrySnapshot.findFirst({
      where: { rackId: rack.id },
      orderBy: { createdAt: 'desc' },
    });

    const temperatureC = latestSnapshot?.temperatureC ?? 27.5;
    const humidityRh = latestSnapshot?.humidityRh ?? 65;
    const gasPpm = latestSnapshot?.gasPpm ?? 185;
    const soundSpeedMs = latestSnapshot?.soundSpeedMs ?? 331.3 + 0.606 * temperatureC;

    // Fetch all sensors
    const sensors = await prisma.sensor.findMany({ orderBy: { sensorId: 'asc' } });

    // Build enriched rows
    const enrichedRows: EnrichedRow[] = rack.rows.map((dbRow) => {
      const leftOnline = dbRow.sensorLeft.online;
      const rightOnline = dbRow.sensorRight.online;
      const bothOnline = leftOnline && rightOnline;

      const calc = calculateRowStock(
        dbRow.rowSpanCm,
        dbRow.leftDistanceCm,
        dbRow.rightDistanceCm,
        dbRow.product.lengthCm,
        dbRow.capacity,
        bothOnline,
        temperatureC,
      );

      return {
        rowId: dbRow.rowId,
        rowNumber: dbRow.rowNumber,
        rackId: rack.rackId,
        sku: dbRow.sku,
        productName: dbRow.product.name,
        productLengthCm: dbRow.product.lengthCm,
        capacity: dbRow.capacity,
        rowSpanCm: dbRow.rowSpanCm,
        leftSensorId: dbRow.leftSensorId,
        rightSensorId: dbRow.rightSensorId,
        leftDistanceCm: dbRow.leftDistanceCm,
        rightDistanceCm: dbRow.rightDistanceCm,
        leftSensorOnline: leftOnline,
        rightSensorOnline: rightOnline,
        sensorsOnline: bothOnline,
        lastUpdated: dbRow.lastUpdated.toISOString(),
        ...calc,
      };
    });

    // Aggregate summary
    const totalStock = enrichedRows.reduce((acc, r) => acc + r.estimatedStock, 0);
    const totalCapacity = enrichedRows.reduce((acc, r) => acc + r.capacity, 0);
    const onlineSensorsCount = sensors.filter((s) => s.online).length;

    const summary: RackSummary = {
      totalStock,
      totalCapacity,
      activeRowsCount: enrichedRows.filter((r) => r.estimatedStock > 0).length,
      totalRowsCount: enrichedRows.length,
      onlineSensorsCount,
      totalSensorsCount: sensors.length,
    };

    // Actuator state (3-row RGB LEDs + emergency)
    const { ledStates, buzzerActive, emergency, reason, ledState } = determineActuatorState(
      enrichedRows,
      temperatureC,
      gasPpm,
      config.thresholds.tempDangerC,
      config.thresholds.gasDangerPpm,
    );

    const actuatorState: ActuatorCommand = {
      rackId,
      buzzerActive,
      ledStates,
      emergency,
      ledState,
      reason,
      issuedAt: new Date().toISOString(),
    };

    // Environment data
    const gasStatus =
      gasPpm >= config.thresholds.gasDangerPpm
        ? 'Danger'
        : gasPpm >= config.thresholds.gasWarningPpm
        ? 'Warning'
        : 'Normal';

    const environment: EnvironmentData = {
      temperatureC,
      humidityRh,
      gasPpm,
      gasStatus: gasStatus as EnvironmentData['gasStatus'],
      soundSpeedMs: Number(soundSpeedMs.toFixed(2)),
      gasWarningThreshold: config.thresholds.gasWarningPpm,
      gasDangerThreshold: config.thresholds.gasDangerPpm,
    };

    const sensorDtos: SensorStatus[] = sensors.map((s) => ({
      id: s.id,
      sensorId: s.sensorId,
      name: s.name,
      type: s.type,
      rowId: s.rowId,
      position: s.position,
      gpio: s.gpio,
      online: s.online,
      signalRssi: s.signalRssi,
      lastSeen: s.lastSeen.toISOString(),
    }));

    const overview: RackOverview = {
      rackId: rack.rackId,
      location: rack.location,
      rows: enrichedRows,
      environment,
      actuatorState,
      summary,
      sensors: sensorDtos,
      fetchedAt: new Date().toISOString(),
    };

    const body: ApiSuccess<RackOverview> = { success: true, data: overview };
    res.status(200).json(body);
  } catch (err) {
    console.error('[RackController] getRackOverview error:', err);
    const errBody: ApiError = { success: false, error: 'Internal server error.' };
    res.status(500).json(errBody);
  }
}

// ─── PATCH /api/v1/racks/:rackId/rows/:rowId ────────────────────────────────
export async function updateRackRow(req: Request, res: Response): Promise<void> {
  const { rackId, rowId } = req.params;
  const { rowSpanCm, capacity, sku, leftDistanceCm, rightDistanceCm } = req.body as {
    rowSpanCm?: number;
    capacity?: number;
    sku?: string;
    leftDistanceCm?: number;
    rightDistanceCm?: number;
  };

  try {
    const dbRow = await prisma.rackRow.findUnique({
      where: { rowId },
      include: { rack: true, product: true, sensorLeft: true, sensorRight: true },
    });

    if (!dbRow || dbRow.rack.rackId !== rackId) {
      const errBody: ApiError = { success: false, error: `Row "${rowId}" not found in rack "${rackId}".` };
      res.status(404).json(errBody);
      return;
    }

    // If SKU is changing, validate product exists
    if (sku && sku !== dbRow.sku) {
      const product = await prisma.product.findUnique({ where: { sku } });
      if (!product) {
        const errBody: ApiError = { success: false, error: `Product with SKU "${sku}" does not exist.` };
        res.status(400).json(errBody);
        return;
      }
    }

    const updatedRow = await prisma.rackRow.update({
      where: { rowId },
      data: {
        ...(rowSpanCm !== undefined && { rowSpanCm }),
        ...(capacity !== undefined && { capacity }),
        ...(sku !== undefined && { sku }),
        ...(leftDistanceCm !== undefined && { leftDistanceCm }),
        ...(rightDistanceCm !== undefined && { rightDistanceCm }),
        lastUpdated: new Date(),
      },
      include: { product: true, sensorLeft: true, sensorRight: true },
    });

    // Recalculate and publish actuator state update
    const latestSnap = await prisma.telemetrySnapshot.findFirst({
      where: { rackId: dbRow.rack.id },
      orderBy: { createdAt: 'desc' },
    });
    const tempC = latestSnap?.temperatureC ?? 27.5;

    const calc = calculateRowStock(
      updatedRow.rowSpanCm,
      updatedRow.leftDistanceCm,
      updatedRow.rightDistanceCm,
      updatedRow.product.lengthCm,
      updatedRow.capacity,
      updatedRow.sensorLeft.online && updatedRow.sensorRight.online,
      tempC,
    );

    const allRows = await prisma.rackRow.findMany({
      where: { rack: { rackId } },
      include: { product: true, sensorLeft: true, sensorRight: true },
    });

    const rowSummaries = allRows.map((r) => ({
      rowId: r.rowId,
      rowNumber: r.rowNumber,
      estimatedStock: r.rowId === updatedRow.rowId ? calc.estimatedStock : 0,
      capacity: r.capacity,
    }));
    const gasPpm = latestSnap?.gasPpm ?? 185;

    const { ledStates, buzzerActive, emergency, reason, ledState } = determineActuatorState(
      rowSummaries,
      tempC,
      gasPpm,
      config.thresholds.tempDangerC,
      config.thresholds.gasDangerPpm,
    );

    publishActuatorCommand(rackId, {
      rackId,
      buzzerActive,
      ledStates,
      emergency,
      ledState,
      reason,
      issuedAt: new Date().toISOString(),
    });

    const body: ApiSuccess<typeof updatedRow> = { success: true, data: updatedRow };
    res.status(200).json(body);
  } catch (err) {
    console.error('[RackController] updateRackRow error:', err);
    const errBody: ApiError = { success: false, error: 'Internal server error.' };
    res.status(500).json(errBody);
  }
}
