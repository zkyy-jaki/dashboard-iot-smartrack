/**
 * Environment configuration loader.
 * Validates all required environment variables at startup.
 * Throws an error if critical variables are missing.
 */
import 'dotenv/config';

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`[Config] Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function parseFloat(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    console.warn(`[Config] ${key} is not a valid number ("${raw}"), using fallback ${fallback}`);
    return fallback;
  }
  return parsed;
}

function parseInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    console.warn(`[Config] ${key} is not a valid integer ("${raw}"), using fallback ${fallback}`);
    return fallback;
  }
  return parsed;
}

export const config = {
  server: {
    port: parseInt('PORT', 3001),
    nodeEnv: optionalEnv('NODE_ENV', 'development'),
    corsOrigin: optionalEnv('CORS_ORIGIN', 'http://localhost:5173'),
  },

  database: {
    url: requireEnv('DATABASE_URL', 'file:./dev.db'),
  },

  mqtt: {
    brokerUrl: optionalEnv('MQTT_BROKER_URL', 'mqtt://broker.emqx.io:1883'),
    clientId: optionalEnv('MQTT_CLIENT_ID', 'smartrack-backend-01'),
    username: optionalEnv('MQTT_USERNAME', ''),
    password: optionalEnv('MQTT_PASSWORD', ''),
    reconnectPeriodMs: parseInt('MQTT_RECONNECT_PERIOD_MS', 5000),
    keepaliveSecs: parseInt('MQTT_KEEPALIVE_SECS', 60),
    // Topics
    telemetryTopicPattern: 'warehouse/small_warehouse/telemetry',
    legacyTelemetryTopicPattern: 'racks/+/telemetry',
    buzzerControlTopic: 'warehouse/small_warehouse/control/buzzer',
    actuatorTopicPrefix: 'racks',
    otaStatusTopic: 'warehouse/small_warehouse/ota/status',
    otaTriggerTopic: 'warehouse/small_warehouse/ota/trigger',
  },

  thresholds: {
    tempDangerC: parseFloat('TEMP_DANGER_THRESHOLD_C', 50.0),
    gasDangerPpm: parseFloat('GAS_DANGER_THRESHOLD_PPM', 600),
    gasWarningPpm: parseFloat('GAS_WARNING_THRESHOLD_PPM', 350),
  },

  rack: {
    defaultRowSpanCm: parseFloat('DEFAULT_ROW_SPAN_CM', 58.0),
    defaultCapacity: parseInt('DEFAULT_ROW_CAPACITY', 6),
  },

  // Telemetry snapshot ring-buffer: keep last N snapshots per rack
  telemetryRetentionCount: 100,
} as const;

export type Config = typeof config;
