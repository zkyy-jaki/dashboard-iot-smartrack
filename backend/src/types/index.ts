/**
 * Shared TypeScript domain types for the SmarTrack WMS backend.
 * These mirror the exact JSON contract expected by the React frontend.
 */

// ============================================================================
// MQTT PAYLOAD — Published by ESP32 to `racks/{rackId}/telemetry`
// ============================================================================
export interface MqttTelemetryPayload {
  rackId: string;          // "RACK-001"
  timestamp: string;       // ISO-8601
  rows: MqttRowReading[];
  environment: MqttEnvironmentReading;
}

export interface MqttRowReading {
  rowId: string;           // "Row 01"
  leftDistanceCm: number;  // raw HC-SR04 time-of-flight converted to cm
  rightDistanceCm: number;
  leftSensorId?: string;   // "US-01"
  rightSensorId?: string;  // "US-02"
  rssi?: number;           // optional WiFi RSSI
  occupiedSpanCm?: number; // precalculated by edge ESP32
  itemCount?: number;      // precalculated by edge ESP32
  status?: string;         // "EMPTY" | "PARTIAL" | "FULL"
}

export interface MqttEnvironmentReading {
  temperatureC: number;    // DHT11 temperature in Celsius
  humidityRh: number;      // DHT11 relative humidity %
  gasPpm: number;          // MQ2 gas concentration / raw ADC
  gasSensorId?: string;    // "GAS-01"
  envSensorId?: string;    // "ENV-01"
  gasRaw?: number;
  gasPct?: number;
  hazardDetected?: boolean;
  safetyState?: string;
}

// ============================================================================
// WAREHOUSE MQTT PAYLOAD — From `warehouse/small_warehouse/telemetry`
// ============================================================================
export interface MqttWarehouseFloorReading {
  floor: number;              // 1, 2, 3
  distance_left_cm: number;
  distance_right_cm: number;
  occupied_span_cm?: number;  // precalculated in ESP32 MQTT
  item_count?: number;        // precalculated in ESP32 MQTT
  is_occupied?: boolean;
  detected_sides?: number;
  status?: 'EMPTY' | 'PARTIAL' | 'FULL' | string;
  led_color?: string;
}

export interface MqttWarehouseSummary {
  total_items: number;
  occupied_floors: number;
  warehouse_status: 'EMPTY' | 'PARTIAL' | 'FULL' | string;
}

export interface MqttWarehouseEnvironment {
  temperature_c: number;
  humidity_pct: number;
  gas_raw: number;
  gas_pct: number;
  hazard_detected: boolean;
  safety_state: 'SAFE_NORMAL' | 'ALARM_TRIGGERED' | 'ALARM_SILENCED' | 'MANUAL_TEST' | string;
}

export interface MqttWarehouseActuators {
  buzzer: boolean;
}

export interface OtaStatusEvent {
  status: 'IDLE' | 'DOWNLOADING' | 'BURNING' | 'SUCCESS' | 'FAILED' | string;
  progress?: number;
  message?: string;
  raw?: string;
  timestamp: string;
}

export interface MqttWarehouseTelemetryPayload {
  firmware_version?: string;
  firmwareVersion?: string;
  floors: MqttWarehouseFloorReading[];
  summary: MqttWarehouseSummary;
  environment: MqttWarehouseEnvironment;
  actuators?: MqttWarehouseActuators;
}

// ============================================================================
// ACTUATOR COMMAND — Published by backend to `racks/{rackId}/actuators`
// ============================================================================
export type LedState =
  | 'RED'       // rack/row empty (0 boxes)
  | 'BLUE'      // partially occupied
  | 'GREEN'     // full capacity (100%)
  | 'BLINK_RED' // emergency: temp >= 50°C OR gas >= 600 ppm

export interface RowLedStates {
  row1: LedState;
  row2: LedState;
  row3: LedState;
}

export interface ActuatorCommand {
  rackId: string;
  buzzerActive: boolean;    // true during emergency or alarm condition
  ledStates: RowLedStates;  // 3 independent RGB LED states for rows 1, 2, 3
  emergency: boolean;       // true if temp >= 50°C or gas >= 600 ppm
  ledState?: LedState;      // aggregate summary LED state (backwards compatibility)
  reason?: string;          // human-readable diagnostic message
  issuedAt?: string;        // ISO-8601 timestamp
}

// ============================================================================
// STOCK CALCULATION RESULT
// ============================================================================
export type StockStatus = 'IN STOCK' | 'FULL CAPACITY' | 'LOW STOCK' | 'EMPTY' | 'SENSOR FAULT';

export interface StockCalculationResult {
  occupiedSpan: number;      // rowSpanCm - (leftDistCm + rightDistCm)
  rawEstimated: number;      // occupiedSpan / L_box (unrounded)
  estimatedStock: number;    // min(capacity, round(rawEstimated))
  occupancyPct: number;      // round((estimatedStock / capacity) * 100)
  status: StockStatus;
  soundSpeedMs: number;      // temperature-compensated speed of sound
}

// ============================================================================
// ENRICHED ROW — Row data extended with computed stock metrics
// ============================================================================
export interface EnrichedRow {
  rowId: string;
  rowNumber: number;
  rackId: string;
  sku: string;
  productName: string;
  productLengthCm: number;
  capacity: number;
  rowSpanCm: number;
  leftSensorId: string;
  rightSensorId: string;
  leftDistanceCm: number;
  rightDistanceCm: number;
  leftSensorOnline: boolean;
  rightSensorOnline: boolean;
  sensorsOnline: boolean;
  lastUpdated: string;       // ISO-8601
  // computed
  occupiedSpan: number;
  rawEstimated: number;
  estimatedStock: number;
  occupancyPct: number;
  status: StockStatus;
  soundSpeedMs: number;
}

// ============================================================================
// RACK OVERVIEW — Full state snapshot returned by GET /api/v1/racks/:rackId/overview
// ============================================================================
export interface RackOverview {
  rackId: string;
  location: string;
  rows: EnrichedRow[];
  environment: EnvironmentData;
  actuatorState: ActuatorCommand;
  summary: RackSummary;
  sensors: SensorStatus[];
  fetchedAt: string;
}

export interface EnvironmentData {
  temperatureC: number;
  humidityRh: number;
  gasPpm: number;
  gasStatus: 'Normal' | 'Warning' | 'Danger' | 'SENSOR FAULT';
  soundSpeedMs: number;
  gasWarningThreshold: number;
  gasDangerThreshold: number;
  gasRaw?: number;
  gasPct?: number;
  hazardDetected?: boolean;
  safetyState?: string;
}

export interface RackSummary {
  totalStock: number;
  totalCapacity: number;
  activeRowsCount: number;
  totalRowsCount: number;
  onlineSensorsCount: number;
  totalSensorsCount: number;
}

export interface SensorStatus {
  id: string;
  sensorId: string;
  name: string;
  type: string;
  rowId: string;
  position: string;
  gpio: string;
  online: boolean;
  signalRssi: number;
  lastSeen: string;
}

// ============================================================================
// PRODUCT
// ============================================================================
export interface ProductDto {
  id: string;
  sku: string;
  name: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// INVENTORY LEDGER
// ============================================================================
export interface LedgerEntryDto {
  id: string;
  txId: string;
  timestamp: string;
  dateOnly: string;
  rackId: string;
  rowId: string;
  sku: string;
  productName?: string;
  prevStock: number;
  currentStock: number;
  diff: number;
  eventType: 'Stock In' | 'Stock Out';
  trigger: string;
  leftDistCm: number;
  rightDistCm: number;
}

// ============================================================================
// ALERT
// ============================================================================
export interface GasAlertDto {
  id: string;
  timestamp: string;
  readingPpm: number;
  status: 'Normal' | 'Warning' | 'Danger';
  message: string;
}

// ============================================================================
// SOCKET.IO EVENT PAYLOAD — Emitted on `telemetryUpdate`
// ============================================================================
export interface TelemetryUpdateEvent {
  rackId: string;
  timestamp: string;
  rows: EnrichedRow[];
  environment: EnvironmentData;
  actuatorState: ActuatorCommand;
  summary: RackSummary;
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ============================================================================
// PAGINATION
// ============================================================================
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
