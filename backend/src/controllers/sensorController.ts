/**
 * Sensor Controller — Sensor status, health check, and calibration trigger.
 *
 * GET   /api/v1/sensors/alerts    — recent gas/temperature alerts
 * GET   /api/v1/sensors           — all sensor statuses
 * POST  /api/v1/sensors/:sensorId/calibrate  — trigger zero-offset or speed-of-sound compensation
 * PATCH /api/v1/sensors/:sensorId            — update online status / RSSI
 */
import type { Request, Response } from 'express';
import { prisma } from '../config/database';
import { config } from '../config';
import type { ApiSuccess, ApiError, GasAlertDto, SensorStatus } from '../types';

// ─── GET /api/v1/sensors ─────────────────────────────────────────────────────
export async function listSensors(req: Request, res: Response): Promise<void> {
  try {
    const sensors = await prisma.sensor.findMany({ orderBy: { sensorId: 'asc' } });

    const dtos: SensorStatus[] = sensors.map((s) => ({
      id: s.sensorId,
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

    res.status(200).json({ success: true, data: dtos, meta: { count: dtos.length } } satisfies ApiSuccess<SensorStatus[]>);
  } catch (err) {
    console.error('[SensorController] listSensors error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' } satisfies ApiError);
  }
}

// ─── GET /api/v1/sensors/alerts ──────────────────────────────────────────────
/**
 * Returns recent telemetry snapshots classified as alerts.
 * Warning: gasPpm >= gasWarningThreshold
 * Danger:  gasPpm >= gasDangerThreshold OR temperatureC >= tempDangerThreshold
 */
export async function getSensorAlerts(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query['limit'] ?? '20'), 10)));

    // Fetch recent snapshots that crossed any threshold
    const snapshots = await prisma.telemetrySnapshot.findMany({
      where: {
        OR: [
          { gasPpm: { gte: config.thresholds.gasWarningPpm } },
          { temperatureC: { gte: config.thresholds.tempDangerC } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { rack: { select: { rackId: true } } },
    });

    const alerts: GasAlertDto[] = snapshots.map((snap) => {
      const isDanger =
        snap.gasPpm >= config.thresholds.gasDangerPpm ||
        snap.temperatureC >= config.thresholds.tempDangerC;
      const isWarning = snap.gasPpm >= config.thresholds.gasWarningPpm;

      let status: GasAlertDto['status'];
      let message: string;

      if (isDanger) {
        status = 'Danger';
        const reasons: string[] = [];
        if (snap.gasPpm >= config.thresholds.gasDangerPpm)
          reasons.push(`Gas ${snap.gasPpm.toFixed(0)} ppm ≥ ${config.thresholds.gasDangerPpm} ppm`);
        if (snap.temperatureC >= config.thresholds.tempDangerC)
          reasons.push(`Temp ${snap.temperatureC.toFixed(1)}°C ≥ ${config.thresholds.tempDangerC}°C`);
        message = `DANGER threshold breached: ${reasons.join('; ')}`;
      } else if (isWarning) {
        status = 'Warning';
        message = `Gas concentration elevated: ${snap.gasPpm.toFixed(0)} ppm (Warning ≥ ${config.thresholds.gasWarningPpm} ppm)`;
      } else {
        status = 'Normal';
        message = `Automated reading: ${snap.gasPpm.toFixed(0)} ppm, ${snap.temperatureC.toFixed(1)}°C`;
      }

      return {
        id: snap.id,
        timestamp: snap.createdAt.toISOString(),
        readingPpm: snap.gasPpm,
        status,
        message,
      };
    });

    res.status(200).json({ success: true, data: alerts, meta: { count: alerts.length } } satisfies ApiSuccess<GasAlertDto[]>);
  } catch (err) {
    console.error('[SensorController] getSensorAlerts error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' } satisfies ApiError);
  }
}

// ─── POST /api/v1/sensors/:sensorId/calibrate ────────────────────────────────
/**
 * Trigger a calibration procedure for a specific sensor.
 * "zero_offset": recalibrate baseline distance reading
 * "temp_compensation": re-compute sound-speed using latest SHT31 temperature
 */
export async function calibrateSensor(req: Request, res: Response): Promise<void> {
  const { sensorId } = req.params;
  const { mode } = req.body as { mode?: string };

  if (!mode || !['zero_offset', 'temp_compensation'].includes(mode)) {
    res.status(400).json({
      success: false,
      error: 'Field "mode" must be either "zero_offset" or "temp_compensation".',
    } satisfies ApiError);
    return;
  }

  try {
    const sensor = await prisma.sensor.findUnique({ where: { sensorId } });
    if (!sensor) {
      res.status(404).json({ success: false, error: `Sensor "${sensorId}" not found.` } satisfies ApiError);
      return;
    }

    if (!sensor.online) {
      res.status(409).json({
        success: false,
        error: `Sensor "${sensorId}" is currently offline. Calibration cannot proceed.`,
      } satisfies ApiError);
      return;
    }

    // Fetch latest temperature for compensation calculation
    let calibrationMeta: Record<string, unknown> = { mode, sensorId };

    if (mode === 'temp_compensation') {
      const latestSnap = await prisma.telemetrySnapshot.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      const tempC = latestSnap?.temperatureC ?? 27.5;
      const soundSpeedMs = 331.3 + 0.606 * tempC;
      calibrationMeta = {
        ...calibrationMeta,
        temperatureC: tempC,
        computedSoundSpeedMs: Number(soundSpeedMs.toFixed(2)),
        note: 'Speed-of-sound compensation recalculated using latest SHT31 reading.',
      };
    } else {
      calibrationMeta['note'] = 'Zero-offset calibration command acknowledged. Awaiting ESP32 confirmation via MQTT.';
    }

    res.status(200).json({
      success: true,
      data: {
        message: `Calibration "${mode}" initiated for sensor ${sensorId}.`,
        ...calibrationMeta,
        initiatedAt: new Date().toISOString(),
      },
    } satisfies ApiSuccess<Record<string, unknown>>);
  } catch (err) {
    console.error('[SensorController] calibrateSensor error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' } satisfies ApiError);
  }
}

// ─── PATCH /api/v1/sensors/:sensorId ─────────────────────────────────────────
export async function updateSensor(req: Request, res: Response): Promise<void> {
  const { sensorId } = req.params;
  const { online, signalRssi } = req.body as { online?: boolean; signalRssi?: number };

  try {
    const sensor = await prisma.sensor.findUnique({ where: { sensorId } });
    if (!sensor) {
      res.status(404).json({ success: false, error: `Sensor "${sensorId}" not found.` } satisfies ApiError);
      return;
    }

    const updated = await prisma.sensor.update({
      where: { sensorId },
      data: {
        ...(online !== undefined && { online }),
        ...(signalRssi !== undefined && { signalRssi }),
        ...(online === true && { lastSeen: new Date() }),
      },
    });

    const dto: SensorStatus = {
      id: updated.id,
      sensorId: updated.sensorId,
      name: updated.name,
      type: updated.type,
      rowId: updated.rowId,
      position: updated.position,
      gpio: updated.gpio,
      online: updated.online,
      signalRssi: updated.signalRssi,
      lastSeen: updated.lastSeen.toISOString(),
    };

    res.status(200).json({ success: true, data: dto } satisfies ApiSuccess<SensorStatus>);
  } catch (err) {
    console.error('[SensorController] updateSensor error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' } satisfies ApiError);
  }
}
