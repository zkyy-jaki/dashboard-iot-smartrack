export type LedColor = 'RED' | 'BLUE' | 'GREEN' | 'BLINK_RED';
export type FloorStatus = 'EMPTY' | 'PARTIAL' | 'FULL';
export type BuzzerCommand = 'MUTE' | 'ON' | 'OFF' | 'AUTO';

export interface FloorTelemetry {
  floor: number;
  distance_left_cm: number;
  distance_right_cm: number;
  occupied_span_cm: number;
  item_count: number;
  is_occupied: boolean;
  detected_sides: number;
  status: FloorStatus;
  led_color: LedColor;
}

export interface OtaStatusInfo {
  status: 'IDLE' | 'DOWNLOADING' | 'BURNING' | 'SUCCESS' | 'FAILED' | string;
  progress?: number;
  message?: string;
  raw?: string;
  timestamp?: string;
}

export interface TelemetryPayload {
  firmware_version?: string;
  firmwareVersion?: string;
  otaStatus?: OtaStatusInfo;
  floors: FloorTelemetry[];
  summary: {
    total_items: number;
    occupied_floors: number;
    warehouse_status: FloorStatus;
    totalStock?: number;
    totalCapacity?: number;
    activeRowsCount?: number;
    totalRowsCount?: number;
  };
  environment: {
    temperature_c: number;
    humidity_pct: number;
    gas_raw: number;
    gas_pct: number;
    hazard_detected: boolean;
    safety_state: 'SAFE_NORMAL' | 'ALARM_TRIGGERED';
  };
  actuators: {
    buzzer: boolean;
  };
  timestamp?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  description: string;
}

export interface RackRow {
  rowId: string;
  rowNumber: number;
  sku: string;
  capacity: number;
  rowSpanCm: number;
  leftSensorId: string;
  rightSensorId: string;
  leftDistanceCm: number;
  rightDistanceCm: number;
  lastUpdated: string;
}

export interface StockCalculationResult {
  occupiedSpan: number;
  rawEstimated: number;
  estimatedStock: number;
  occupancyPct: number;
  status: 'IN STOCK' | 'EMPTY' | 'LOW STOCK' | 'FULL CAPACITY' | 'SENSOR FAULT';
}

export interface EnrichedRow extends RackRow, StockCalculationResult {
  product: Product;
  leftSensor?: Sensor;
  rightSensor?: Sensor;
  sensorsOnline: boolean;
  led_color?: LedColor;
  floorTelemetry?: FloorTelemetry;
}

export type SensorType = 'ULTRASONIC' | 'GAS' | 'ENV';

export interface Sensor {
  id: string;
  name: string;
  type: SensorType;
  rowId: string;
  position: string;
  gpio: string;
  online: boolean;
  signalRssi: number;
  lastSeen: string;
}

export interface InventoryHistory {
  id: string;
  timestamp: string;
  dateOnly: string;
  rackId: string;
  rowId: string;
  sku: string;
  prevStock: number;
  currentStock: number;
  diff: number;
  eventType: 'Stock In' | 'Stock Out';
  trigger: string;
}

export interface EnvData {
  temperatureC: number;
  humidityRh: number;
  gasPpm: number;
  gasWarningThreshold: number;
  gasDangerThreshold: number;
}

export interface EnvHistoryPoint {
  time: string;
  temp: number;
  humidity: number;
  gasPpm: number;
}

export interface GasAlert {
  id: string;
  timestamp: string;
  readingPpm: number;
  status: 'Normal' | 'Warning' | 'Danger';
  message: string;
}

export interface SystemConfig {
  rackId: string;
  controllerId: string;
  mqttBroker: string;
  pollingIntervalMs: number;
  tempCompensation: boolean;
  emailAlerts: boolean;
  webhookAlerts: boolean;
}

export interface SummaryMetrics {
  totalStock: number;
  totalCapacity: number;
  activeRowsCount: number;
  totalRowsCount: number;
  onlineSensorsCount: number;
  totalSensorsCount: number;
}

export interface TutorialScene {
  step: number;
  code: string;
  title: string;
  description: string;
  technicalNote: string;
}

export interface ApiEndpointContract {
  method: string;
  path: string;
  desc: string;
}

