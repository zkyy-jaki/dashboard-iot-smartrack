/**
 * ============================================================================
 * LAYANAN WEBSOCKET REAL-TIME (SOCKET.IO CLIENT)
 * ============================================================================
 * Menghubungkan dashboard web ke backend Node.js untuk menerima event
 * `telemetry_update` secara instan (push notification) dari hardware ESP32.
 */

import { io, Socket } from 'socket.io-client';
import { APP_CONFIG } from '../config';
import { TelemetryPayload, FloorTelemetry, FloorStatus, LedColor } from '../types';

const BACKEND_URL = APP_CONFIG.NETWORK.BACKEND_URL;

let socket: Socket | null = null;

/**
 * Normalisasi data Socket.IO menjadi TelemetryPayload standar Edge Computing
 */
function normalizeToTelemetryPayload(raw: any): TelemetryPayload {
  if (!raw || typeof raw !== 'object') {
    return {
      floors: [],
      summary: { total_items: 0, occupied_floors: 0, warehouse_status: 'EMPTY' },
      environment: {
        temperature_c: 27.0,
        humidity_pct: 60.0,
        gas_raw: 150,
        gas_pct: 15.0,
        hazard_detected: false,
        safety_state: 'SAFE_NORMAL',
      },
      actuators: { buzzer: false },
    };
  }

  // 1. Ekstraksi floors
  let floors: FloorTelemetry[] = [];
  let rawFloorList: any[] = [];

  if (Array.isArray(raw.floors)) {
    rawFloorList = raw.floors;
  } else if (raw.floors && typeof raw.floors === 'object') {
    const keys = Object.keys(raw.floors).sort();
    rawFloorList = keys.map((k, idx) => {
      const match = k.match(/\d+/);
      const floorNum = match ? parseInt(match[0], 10) : idx + 1;
      return { floor: floorNum, ...raw.floors[k] };
    });
  }

  if (rawFloorList.length > 0) {
    floors = rawFloorList.map((f: any, idx: number): FloorTelemetry => {
      const floorNum = typeof f.floor === 'number' ? f.floor : idx + 1;
      const status: FloorStatus =
        f.status === 'FULL' || f.status === 'PARTIAL' || f.status === 'EMPTY'
          ? f.status
          : f.item_count === 0
          ? 'EMPTY'
          : f.item_count >= 4
          ? 'FULL'
          : 'PARTIAL';

      const ledColor: LedColor =
        f.led_color === 'RED' || f.led_color === 'BLUE' || f.led_color === 'GREEN' || f.led_color === 'BLINK_RED'
          ? f.led_color
          : status === 'EMPTY'
          ? 'RED'
          : status === 'FULL'
          ? 'GREEN'
          : 'BLUE';

      return {
        floor: floorNum,
        distance_left_cm: Number(f.distance_left_cm ?? 0),
        distance_right_cm: Number(f.distance_right_cm ?? 0),
        occupied_span_cm: Number(f.occupied_span_cm ?? 0),
        item_count: Number(f.item_count ?? 0),
        is_occupied: Boolean(f.is_occupied ?? (f.item_count > 0)),
        detected_sides: Number(f.detected_sides ?? 2),
        status,
        led_color: ledColor,
      };
    });
  } else if (Array.isArray(raw.rows)) {
    // Fallback jika backend mengirim array rows
    floors = raw.rows.map((r: any, idx: number): FloorTelemetry => {
      const floorNum = r.rowNumber || idx + 1;
      const itemCount = r.estimatedStock ?? r.itemCount ?? 0;
      const status: FloorStatus =
        itemCount === 0 ? 'EMPTY' : itemCount >= (r.capacity || 4) ? 'FULL' : 'PARTIAL';
      const isEmergency = Boolean(raw.alerts?.isEmergency || raw.actuatorState?.emergency);
      const ledColor: LedColor = isEmergency
        ? 'BLINK_RED'
        : status === 'EMPTY'
        ? 'RED'
        : status === 'FULL'
        ? 'GREEN'
        : 'BLUE';

      return {
        floor: floorNum,
        distance_left_cm: Number(r.leftDistanceCm ?? 0),
        distance_right_cm: Number(r.rightDistanceCm ?? 0),
        occupied_span_cm: Number(r.occupiedSpan ?? 0),
        item_count: itemCount,
        is_occupied: itemCount > 0,
        detected_sides: 2,
        status,
        led_color: ledColor,
      };
    });
  }

  // 2. Ekstraksi summary
  const totalItems = raw.summary?.total_items ?? raw.summary?.totalStock ?? floors.reduce((acc, f) => acc + f.item_count, 0);
  const occupiedFloors = raw.summary?.occupied_floors ?? raw.summary?.activeRowsCount ?? floors.filter((f) => f.item_count > 0).length;
  const warehouseStatus: FloorStatus =
    raw.summary?.warehouse_status || (totalItems === 0 ? 'EMPTY' : totalItems >= 12 ? 'FULL' : 'PARTIAL');

  // 3. Ekstraksi environment
  const envRaw = raw.environment || raw.env || {};
  const tempC = Number(
    envRaw.temperature_c ??
    envRaw.temperatureC ??
    envRaw.temperature ??
    envRaw.temp ??
    envRaw.suhu ??
    raw.temperature_c ??
    raw.temperatureC ??
    raw.temperature ??
    raw.temp ??
    27.5
  );
  const humPct = Number(
    envRaw.humidity_pct ??
    envRaw.humidityRh ??
    envRaw.humidity ??
    envRaw.hum ??
    envRaw.kelembaban ??
    raw.humidity_pct ??
    raw.humidityRh ??
    raw.humidity ??
    raw.hum ??
    65.0
  );
  const gasRaw = Number(
    envRaw.gas_raw ??
    envRaw.gasPpm ??
    envRaw.gas ??
    envRaw.mq2 ??
    raw.gas_raw ??
    raw.gasPpm ??
    raw.gas ??
    185
  );
  const gasPct = Number(envRaw.gas_pct ?? ((gasRaw / 1000) * 100).toFixed(1));
  const isEmergency = Boolean(envRaw.hazard_detected || raw.alerts?.isEmergency || raw.actuatorState?.emergency || tempC >= 50.0 || gasRaw >= 600);
  const safetyState: 'SAFE_NORMAL' | 'ALARM_TRIGGERED' =
    envRaw.safety_state === 'ALARM_TRIGGERED' || isEmergency ? 'ALARM_TRIGGERED' : 'SAFE_NORMAL';

  // 4. Ekstraksi actuators
  const buzzer = Boolean(
    raw.actuators?.buzzer ?? raw.actuatorState?.buzzerActive ?? raw.actuatorCommand?.buzzer ?? false
  );

  return {
    floors,
    summary: {
      total_items: totalItems,
      occupied_floors: occupiedFloors,
      warehouse_status: warehouseStatus,
      totalStock: totalItems,
      totalCapacity: raw.summary?.totalCapacity ?? 12,
      activeRowsCount: occupiedFloors,
      totalRowsCount: floors.length,
    },
    environment: {
      temperature_c: tempC,
      humidity_pct: humPct,
      gas_raw: gasRaw,
      gas_pct: gasPct,
      hazard_detected: isEmergency,
      safety_state: safetyState,
    },
    actuators: {
      buzzer,
    },
    timestamp: raw.timestamp || new Date().toISOString(),
  };
}

/**
 * Menginisialisasi instance Socket singleton
 */
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(BACKEND_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

/**
 * Menghubungkan client ke WebSocket backend dengan callback handler
 * @param onTelemetry Handler saat data telemetri baru diterima (mendengarkan event 'telemetry_update')
 * @param onStatusChange Handler status koneksi online/offline
 * @returns Fungsi cleanup untuk melepas listener
 */
export const connectSocket = (
  onTelemetry?: (data: TelemetryPayload) => void,
  onStatusChange?: (connected: boolean) => void
): (() => void) => {
  const s = getSocket();

  const handleConnect = () => {
    console.log('[Socket.IO] ✓ Connected to backend at', BACKEND_URL);
    onStatusChange?.(true);
  };

  const handleDisconnect = (reason: string) => {
    console.warn('[Socket.IO] Disconnected from backend:', reason);
    onStatusChange?.(false);
  };

  const handleConnectError = (err: Error) => {
    console.error('[Socket.IO] Connection error to', BACKEND_URL, ':', err.message);
    onStatusChange?.(false);
  };

  const handleTelemetry = (data: any) => {
    const normalized = normalizeToTelemetryPayload(data);
    onTelemetry?.(normalized);
  };

  s.on('connect', handleConnect);
  s.on('disconnect', handleDisconnect);
  s.on('connect_error', handleConnectError);

  if (onTelemetry) {
    // Dengarkan event standar baru 'telemetry_update' serta legacy 'telemetryUpdate'
    s.on('telemetry_update', handleTelemetry);
    s.on('telemetryUpdate', handleTelemetry);
  }

  // Jika socket sudah dalam kondisi connected saat render/mount, panggil handler seketika
  if (s.connected) {
    onStatusChange?.(true);
  } else {
    s.connect();
  }

  return () => {
    s.off('connect', handleConnect);
    s.off('disconnect', handleDisconnect);
    s.off('connect_error', handleConnectError);
    if (onTelemetry) {
      s.off('telemetry_update', handleTelemetry);
      s.off('telemetryUpdate', handleTelemetry);
    }
  };
};

export default connectSocket;
