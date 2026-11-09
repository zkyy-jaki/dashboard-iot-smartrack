import { StockCalculationResult } from '../types';

/**
 * Calculates stock quantity for a single storage row using paired ultrasonic sensor distance readings.
 * 
 * Formula:
 * totalEmpty = d_left + d_right
 * occupiedSpan = max(0, rowSpanCm - totalEmpty)
 * rawEstimated = occupiedSpan / boxLengthCm
 * estimatedStock = min(maxCapacity, round(rawEstimated))
 * occupancyPct = round((estimatedStock / maxCapacity) * 100)
 */
export function calculateRowStock(
  rowSpanCm: number,
  leftDistCm: number,
  rightDistCm: number,
  boxLengthCm: number,
  maxCapacity: number,
  sensorsOnline: boolean = true
): StockCalculationResult {
  if (!sensorsOnline || boxLengthCm <= 0) {
    return {
      occupiedSpan: 0,
      rawEstimated: 0,
      estimatedStock: 0,
      occupancyPct: 0,
      status: 'SENSOR FAULT'
    };
  }

  const safeLeft = Math.max(0, Number(leftDistCm));
  const safeRight = Math.max(0, Number(rightDistCm));
  const totalEmpty = Math.max(0, safeLeft + safeRight);
  const occupiedSpan = Math.max(0, Number(rowSpanCm) - totalEmpty);
  const rawEstimated = occupiedSpan / Number(boxLengthCm);

  // Aturan threshold deteksi fisik 18.0 cm (sesuai firmware ESP32):
  // - 2 sisi mendeteksi halangan (< 18.0 cm) = Terisi Penuh (Hijau)
  // - 2 sisi tidak ada halangan (>= 18.0 cm) = Kosong (Merah)
  // - 1 sisi mendeteksi halangan (< 18.0 cm) = Terisi Sebagian (Biru)
  const leftDetected = safeLeft > 0 && safeLeft < 18.0;
  const rightDetected = safeRight > 0 && safeRight < 18.0;

  let estimatedStock: number;
  let status: 'IN STOCK' | 'EMPTY' | 'LOW STOCK' | 'FULL CAPACITY';

  if (leftDetected && rightDetected) {
    estimatedStock = maxCapacity;
    status = 'FULL CAPACITY';
  } else if (!leftDetected && !rightDetected) {
    estimatedStock = 0;
    status = 'EMPTY';
  } else {
    estimatedStock = Math.min(maxCapacity - 1, Math.max(1, Math.round(rawEstimated) || 2));
    status = 'IN STOCK';
  }

  const occupancyPct = maxCapacity > 0 ? Math.round((estimatedStock / maxCapacity) * 100) : 0;

  return {
    occupiedSpan: Number(occupiedSpan.toFixed(1)),
    rawEstimated: Number(rawEstimated.toFixed(2)),
    estimatedStock,
    occupancyPct,
    status
  };
}

