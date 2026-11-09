/**
 * API Router — Mounts all v1 route groups.
 * Base path: /api/v1
 */
import { Router } from 'express';
import { getRackOverview, updateRackRow } from '../controllers/rackController';
import { listProducts, createProduct, getProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { getInventoryHistory } from '../controllers/inventoryController';
import { listSensors, getSensorAlerts, calibrateSensor, updateSensor } from '../controllers/sensorController';
import { getMqttStatus, sendBuzzerControlCommand, getOtaStatus, sendOtaTriggerCommand } from '../services/mqttService';

const router = Router();

// ── OTA Firmware Actions ──────────────────────────────────────────────────────
// GET /api/v1/ota/status
router.get('/ota/status', (_req, res) => {
  res.status(200).json({
    success: true,
    ota: getOtaStatus(),
    firmwareVersion: 'v1.0.7',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/v1/ota/trigger
router.post('/ota/trigger', (req, res) => {
  const payload = typeof req.body === 'object' ? JSON.stringify(req.body) : String(req.body ?? 'TRIGGER_OTA');
  const sent = sendOtaTriggerCommand(payload);
  res.status(200).json({
    success: sent,
    topic: 'warehouse/small_warehouse/ota/trigger',
    payload: req.body,
    timestamp: new Date().toISOString(),
  });
});

// ── Control Actions (Hardware Command Dispatch) ───────────────────────────────
// POST /api/v1/control/buzzer
router.post('/control/buzzer', (req, res) => {
  const { command } = req.body;
  if (!command || typeof command !== 'string') {
    res.status(400).json({ success: false, error: 'Command string is required (e.g. MUTE, ON, OFF, AUTO).' });
    return;
  }
  const upper = command.trim().toUpperCase();
  const valid = ['MUTE', 'ON', 'OFF', 'AUTO'];
  if (!valid.includes(upper)) {
    res.status(400).json({ success: false, error: `Invalid command "${command}". Must be one of: ${valid.join(', ')}` });
    return;
  }
  const sent = sendBuzzerControlCommand(upper);
  res.status(200).json({
    success: sent,
    command: upper,
    topic: 'warehouse/small_warehouse/control/buzzer',
    timestamp: new Date().toISOString(),
  });
});

// ── Health check ──────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  const mqtt = getMqttStatus();
  res.status(200).json({
    status: 'ok',
    service: 'SmarTrack WMS Backend',
    version: '1.0.0',
    mqtt,
    timestamp: new Date().toISOString(),
  });
});

// ── Racks ─────────────────────────────────────────────────────────────────────
// GET  /api/v1/racks/:rackId/overview
router.get('/racks/:rackId/overview', getRackOverview);
// PATCH /api/v1/racks/:rackId/rows/:rowId
router.patch('/racks/:rackId/rows/:rowId', updateRackRow);

// ── Products ──────────────────────────────────────────────────────────────────
// GET  /api/v1/products
router.get('/products', listProducts);
// POST /api/v1/products
router.post('/products', createProduct);
// GET  /api/v1/products/:sku
router.get('/products/:sku', getProduct);
// PUT  /api/v1/products/:sku
router.put('/products/:sku', updateProduct);
// DELETE /api/v1/products/:sku
router.delete('/products/:sku', deleteProduct);

// ── Inventory History ─────────────────────────────────────────────────────────
// GET /api/v1/inventory/history
router.get('/inventory/history', getInventoryHistory);

// ── Sensors ───────────────────────────────────────────────────────────────────
// GET  /api/v1/sensors
router.get('/sensors', listSensors);
// GET  /api/v1/sensors/alerts
router.get('/sensors/alerts', getSensorAlerts);
// POST /api/v1/sensors/:sensorId/calibrate
router.post('/sensors/:sensorId/calibrate', calibrateSensor);
// PATCH /api/v1/sensors/:sensorId
router.patch('/sensors/:sensorId', updateSensor);

export default router;
