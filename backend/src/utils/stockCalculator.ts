/**
 * Stock Calculator — Core mathematical engine for IIoT rack inventory estimation.
 *
 * Physics:
 *   Speed of sound compensated by temperature (DHT11):
 *     v = 331.3 + (0.606 × temperatureC)   [m/s]
 *
 * Inventory Formula (per row):
 *   totalEmpty    = d_left + d_right
 *   occupiedSpan  = max(0, rowSpanCm - totalEmpty)
 *   estimatedStock = min(capacity, round(occupiedSpan / L_box))
 *   occupancyPct  = round((estimatedStock / capacity) * 100)
 *
 * Status Rules:
 *   estimatedStock === 0              → "EMPTY"
 *   estimatedStock <= 2               → "LOW STOCK"
 *   estimatedStock >= capacity        → "FULL CAPACITY"
 *   sensors offline                   → "SENSOR FAULT"
 *   otherwise                         → "IN STOCK"
 */

import type { StockCalculationResult, StockStatus, LedState, RowLedStates } from '../types';

/**
 * Calculate temperature-compensated speed of sound using DHT11 reading.
 * @param temperatureC - Ambient temperature in Celsius from DHT11 sensor
 * @returns Speed of sound in m/s
 */
export function computeSoundSpeed(temperatureC: number): number {
  return 331.3 + 0.606 * temperatureC;
}

/**
 * Calculate estimated row stock based on ultrasonic distance readings.
 *
 * @param rowSpanCm     - Total shelf span in centimetres (physical constant per row)
 * @param leftDistCm    - Distance measured by left HC-SR04 sensor (cm)
 * @param rightDistCm   - Distance measured by right HC-SR04 sensor (cm)
 * @param boxLengthCm   - Axial length of the product (cm) assigned to this row
 * @param capacity      - Maximum box count for this row
 * @param sensorsOnline - Whether both ultrasonic sensors are responding
 * @param temperatureC  - Current ambient temperature for sound speed compensation
 * @returns StockCalculationResult
 */
export function calculateRowStock(
  rowSpanCm: number,
  leftDistCm: number,
  rightDistCm: number,
  boxLengthCm: number,
  capacity: number,
  sensorsOnline: boolean,
  temperatureC: number = 25.0,
  detectThresholdCm: number = 18.0,
): StockCalculationResult {
  const soundSpeedMs = computeSoundSpeed(temperatureC);

  // Graceful degradation if sensors are offline or misconfigured
  if (!sensorsOnline || boxLengthCm <= 0 || capacity <= 0) {
    return {
      occupiedSpan: 0,
      rawEstimated: 0,
      estimatedStock: 0,
      occupancyPct: 0,
      status: 'SENSOR FAULT',
      soundSpeedMs: Number(soundSpeedMs.toFixed(2)),
    };
  }

  const safeLeft = Math.max(0, leftDistCm);
  const safeRight = Math.max(0, rightDistCm);
  const totalEmpty = safeLeft + safeRight;
  const occupiedSpan = Math.max(0, rowSpanCm - totalEmpty);
  const rawEstimated = occupiedSpan / boxLengthCm;

  // Aturan threshold deteksi fisik aktual (18.0 cm sesuai firmware ESP32):
  // - 2 sisi mendeteksi halangan (< 18.0 cm) = Terisi Penuh (Hijau)
  // - 2 sisi tidak ada halangan (>= 18.0 cm) = Kosong (Merah)
  // - 1 sisi mendeteksi halangan (< 18.0 cm) = Terisi Sebagian (Biru)
  const leftDetected = safeLeft > 0 && safeLeft < detectThresholdCm;
  const rightDetected = safeRight > 0 && safeRight < detectThresholdCm;

  let estimatedStock: number;
  let status: StockStatus;

  if (leftDetected && rightDetected) {
    estimatedStock = capacity;
    status = 'FULL CAPACITY';
  } else if (!leftDetected && !rightDetected) {
    estimatedStock = 0;
    status = 'EMPTY';
  } else {
    estimatedStock = Math.min(Math.max(1, capacity - 1), Math.max(1, Math.round(rawEstimated) || 2));
    status = 'IN STOCK';
  }

  const occupancyPct = Math.round((estimatedStock / capacity) * 100);

  return {
    occupiedSpan: Number(occupiedSpan.toFixed(1)),
    rawEstimated: Number(rawEstimated.toFixed(2)),
    estimatedStock,
    occupancyPct,
    status,
    soundSpeedMs: Number(soundSpeedMs.toFixed(2)),
  };
}

/**
 * Evaluates the LED colour state for a single shelf row based on stock occupancy
 * and physical ultrasonic sensor readings (18.0 cm detection threshold).
 *
 * Rules (ESP32 Contract):
 *   - Both sensors < 18.0 cm (dual detection)  → "GREEN" (Terisi Penuh)
 *   - Neither sensor < 18.0 cm (clear span)    → "RED" (Kosong)
 *   - 1 sensor < 18.0 cm (single side)         → "BLUE" (Terisi Sebagian)
 *   - Emergency hazard active                  → "BLINK_RED"
 */
export function determineRowLedState(
  estimatedStock: number,
  capacity: number,
  isEmergency: boolean,
  leftDistCm?: number,
  rightDistCm?: number,
  thresholdCm: number = 18.0,
): LedState {
  if (isEmergency) {
    return 'BLINK_RED';
  }

  // 1. Prioritaskan aturan deteksi fisik aktual jika jarak sensor tersedia
  if (leftDistCm !== undefined && rightDistCm !== undefined && leftDistCm > 0 && rightDistCm > 0) {
    const leftDetected = leftDistCm < thresholdCm;
    const rightDetected = rightDistCm < thresholdCm;

    if (leftDetected && rightDetected) {
      return 'GREEN';
    }
    if (!leftDetected && !rightDetected) {
      return 'RED';
    }
    return 'BLUE';
  }

  // 2. Fallback berdasarkan jumlah stok
  if (estimatedStock <= 0) {
    return 'RED';
  }
  if (capacity > 0 && estimatedStock >= capacity) {
    return 'GREEN';
  }
  return 'BLUE';
}

export interface RowStockSummary {
  rowId: string;
  rowNumber?: number;
  estimatedStock: number;
  capacity: number;
  leftDistanceCm?: number;
  rightDistanceCm?: number;
}

export interface ActuatorEvaluationResult {
  ledStates: RowLedStates;
  buzzerActive: boolean;
  emergency: boolean;
  ledState: LedState; // aggregated overall state
  reason: string;
}

/**
 * Determine actuator commands for all 3 rack rows (Lantai 1, 2, 3),
 * buzzer activation, and emergency state based on environmental hazard rules.
 *
 * Emergency condition:
 *   temperatureC >= tempDangerThreshold OR gasPpm >= gasDangerThreshold
 *   → emergency: true, buzzerActive: true, all row LEDs: "BLINK_RED"
 *
 * Normal condition:
 *   emergency: false, buzzerActive: false, each row LED independently evaluated
 */
export function determineActuatorState(
  rows: RowStockSummary[],
  temperatureC: number,
  gasPpm: number,
  tempDangerThreshold: number,
  gasDangerThreshold: number,
): ActuatorEvaluationResult {
  const isEmergency =
    temperatureC >= tempDangerThreshold || gasPpm >= gasDangerThreshold;

  if (isEmergency) {
    const reasons: string[] = [];
    if (temperatureC >= tempDangerThreshold) {
      reasons.push(`Suhu ${temperatureC.toFixed(1)}°C ≥ ${tempDangerThreshold}°C`);
    }
    if (gasPpm >= gasDangerThreshold) {
      reasons.push(`Gas ${gasPpm} ppm ≥ ${gasDangerThreshold} ppm`);
    }

    return {
      emergency: true,
      buzzerActive: true,
      ledStates: {
        row1: 'BLINK_RED',
        row2: 'BLINK_RED',
        row3: 'BLINK_RED',
      },
      ledState: 'BLINK_RED',
      reason: `EMERGENCY HAZARD: ${reasons.join(', ')}`,
    };
  }

  // Helper to extract row by number or ID
  const getRow = (num: number, idPrefix: string): RowStockSummary | undefined => {
    return rows.find((r) => r.rowNumber === num || r.rowId.toLowerCase().includes(idPrefix));
  };

  const r1 = getRow(1, '01');
  const r2 = getRow(2, '02');
  const r3 = getRow(3, '03');

  const row1State = determineRowLedState(
    r1?.estimatedStock ?? 0,
    r1?.capacity ?? 4,
    false,
    r1?.leftDistanceCm,
    r1?.rightDistanceCm,
  );
  const row2State = determineRowLedState(
    r2?.estimatedStock ?? 0,
    r2?.capacity ?? 4,
    false,
    r2?.leftDistanceCm,
    r2?.rightDistanceCm,
  );
  const row3State = determineRowLedState(
    r3?.estimatedStock ?? 0,
    r3?.capacity ?? 4,
    false,
    r3?.leftDistanceCm,
    r3?.rightDistanceCm,
  );

  const ledStates: RowLedStates = {
    row1: row1State,
    row2: row2State,
    row3: row3State,
  };

  // Determine aggregate state across rows
  const allEmpty = row1State === 'RED' && row2State === 'RED' && row3State === 'RED';
  const allFull = row1State === 'GREEN' && row2State === 'GREEN' && row3State === 'GREEN';
  const aggregateLed: LedState = allEmpty ? 'RED' : allFull ? 'GREEN' : 'BLUE';

  return {
    emergency: false,
    buzzerActive: false,
    ledStates,
    ledState: aggregateLed,
    reason: `Normal operational: Row1=${row1State}, Row2=${row2State}, Row3=${row3State}`,
  };
}

/**
 * Backward-compatible helper for callers still using aggregate determineLedState
 */
export function determineLedState(
  estimatedStockValues: number[],
  capacities: number[],
  temperatureC: number,
  gasPpm: number,
  tempDangerThreshold: number,
  gasDangerThreshold: number,
): { ledState: LedState; buzzerActive: boolean; reason: string } {
  const rows: RowStockSummary[] = estimatedStockValues.map((stock, i) => ({
    rowId: `Row 0${i + 1}`,
    rowNumber: i + 1,
    estimatedStock: stock,
    capacity: capacities[i] ?? 6,
  }));

  const res = determineActuatorState(
    rows,
    temperatureC,
    gasPpm,
    tempDangerThreshold,
    gasDangerThreshold,
  );

  return {
    ledState: res.ledState,
    buzzerActive: res.buzzerActive,
    reason: res.reason,
  };
}
