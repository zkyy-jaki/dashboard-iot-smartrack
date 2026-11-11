/**
 * Database Seed — Populates SQLite with the initial demonstration data
 * that exactly matches the React frontend's INITIAL_* constants.
 *
 * Run with:  npx ts-node src/prisma/seed.ts
 *       or:  npm run prisma:seed
 */
import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('[Seed] Starting database seed…');

  // ── 1. Upsert Rack ──────────────────────────────────────────────────────────
  const rack = await prisma.rack.upsert({
    where: { rackId: 'RACK-001' },
    update: {},
    create: {
      rackId: 'RACK-001',
      location: 'Warehouse A — Section 1',
      description: 'Smart Small Rack — 3-row ultrasonic monitoring unit with DHT11 + MQ2 ambient sensors.',
    },
  });
  console.log(`[Seed] ✓ Rack: ${rack.rackId}`);

  // ── 2. Upsert Products (SKUs) ───────────────────────────────────────────────
  const products = [
    {
      sku: 'SKU-001',
      name: 'Cardboard Product A',
      lengthCm: 8,
      widthCm: 8,
      heightCm: 8,
      description: 'Standard physical box unit (axial length 8.0 cm).',
    },
    {
      sku: 'SKU-002',
      name: 'Cardboard Product B',
      lengthCm: 8,
      widthCm: 8,
      heightCm: 8,
      description: 'Sub-assembly shipping box (axial length 8.0 cm).',
    },
    {
      sku: 'SKU-003',
      name: 'Cardboard Product C',
      lengthCm: 8,
      widthCm: 8,
      heightCm: 8,
      description: 'Instrumentation housing carton (axial length 8.0 cm).',
    },
    {
      sku: 'SKU-004',
      name: 'Cardboard Product D (Spare SKU)',
      lengthCm: 8,
      widthCm: 8,
      heightCm: 8,
      description: 'Compact sensor spare kit carton (axial length 8.0 cm).',
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: { name: p.name, lengthCm: p.lengthCm, widthCm: p.widthCm, heightCm: p.heightCm, description: p.description },
      create: p,
    });
    console.log(`[Seed] ✓ Product: ${p.sku} (${p.name}, L=${p.lengthCm}cm)`);
  }

  // ── 3. Upsert Sensors ───────────────────────────────────────────────────────
  // Pinout mapping hardware sesuai Firmware Dual ESP32 (Master + Slave Serial2)
  const sensors = [
    { sensorId: 'US-01', name: 'Ultrasonic Left — Row 01',   type: 'ULTRASONIC', rowId: 'Row 01', position: 'Left End',                        gpio: 'TRIG: GPIO27 / ECHO: GPIO34 (Slave)', online: true, signalRssi: -54 },
    { sensorId: 'US-02', name: 'Ultrasonic Right — Row 01',  type: 'ULTRASONIC', rowId: 'Row 01', position: 'Right End',                       gpio: 'TRIG: GPIO14 / ECHO: GPIO35 (Slave)', online: true, signalRssi: -56 },
    { sensorId: 'US-03', name: 'Ultrasonic Left — Row 02',   type: 'ULTRASONIC', rowId: 'Row 02', position: 'Left End',                        gpio: 'TRIG: GPIO13 / ECHO: GPIO32 (Slave)', online: true, signalRssi: -52 },
    { sensorId: 'US-04', name: 'Ultrasonic Right — Row 02',  type: 'ULTRASONIC', rowId: 'Row 02', position: 'Right End',                       gpio: 'TRIG: GPIO04 / ECHO: GPIO33 (Slave)', online: true, signalRssi: -58 },
    { sensorId: 'US-05', name: 'Ultrasonic Left — Row 03',   type: 'ULTRASONIC', rowId: 'Row 03', position: 'Left End',                        gpio: 'TRIG: GPIO05 / ECHO: GPIO25 (Slave)', online: true, signalRssi: -55 },
    { sensorId: 'US-06', name: 'Ultrasonic Right — Row 03',  type: 'ULTRASONIC', rowId: 'Row 03', position: 'Right End',                       gpio: 'TRIG: GPIO18 / ECHO: GPIO26 (Slave)', online: true, signalRssi: -57 },
    { sensorId: 'GAS-01', name: 'Gas Leakage Monitoring',    type: 'GAS',        rowId: 'Ambient Frame', position: 'Upper Right Post',          gpio: 'ADC1_CH0 (GPIO36 - Master)',           online: true, signalRssi: -51 },
    { sensorId: 'ENV-01', name: 'Temperature & Humidity Monitoring', type: 'ENV', rowId: 'Ambient Frame', position: 'Lower Right Post (DHT11)', gpio: 'DATA: GPIO04 (1-Wire Digital - Master)', online: true, signalRssi: -51 },
  ];

  for (const s of sensors) {
    await prisma.sensor.upsert({
      where: { sensorId: s.sensorId },
      update: { name: s.name, gpio: s.gpio, position: s.position, online: s.online, signalRssi: s.signalRssi },
      create: { ...s, lastSeen: new Date() },
    });
    console.log(`[Seed] ✓ Sensor: ${s.sensorId} (${s.name})`);
  }

  // ── 4. Upsert Rack Rows ─────────────────────────────────────────────────────
  // Initial demonstration values from frontend spec (Rack row span: 58 cm):
  //   Row 01: SKU-001 (L=20cm), span=58cm, left=18cm, right=0cm → 2 boxes
  //   Row 02: SKU-002 (L=25cm), span=58cm, left=8cm, right=0cm → 2 boxes
  //   Row 03: SKU-003 (L=30cm), span=58cm, left=29cm, right=29cm → 0 boxes (empty)
  const rows = [
    {
      rowId:          'Row 01',
      rowNumber:      1,
      rackId:         rack.id,
      sku:            'SKU-001',
      capacity:       config.rack.defaultCapacity,
      rowSpanCm:      config.rack.defaultRowSpanCm,
      leftSensorId:   'US-01',
      rightSensorId:  'US-02',
      leftDistanceCm: 18,
      rightDistanceCm: 0,
    },
    {
      rowId:          'Row 02',
      rowNumber:      2,
      rackId:         rack.id,
      sku:            'SKU-002',
      capacity:       config.rack.defaultCapacity,
      rowSpanCm:      config.rack.defaultRowSpanCm,
      leftSensorId:   'US-03',
      rightSensorId:  'US-04',
      leftDistanceCm: 8,
      rightDistanceCm: 0,
    },
    {
      rowId:          'Row 03',
      rowNumber:      3,
      rackId:         rack.id,
      sku:            'SKU-003',
      capacity:       config.rack.defaultCapacity,
      rowSpanCm:      config.rack.defaultRowSpanCm,
      leftSensorId:   'US-05',
      rightSensorId:  'US-06',
      leftDistanceCm: 29,
      rightDistanceCm: 29,
    },
  ];

  for (const r of rows) {
    await prisma.rackRow.upsert({
      where: { rowId: r.rowId },
      update: {
        leftDistanceCm:  r.leftDistanceCm,
        rightDistanceCm: r.rightDistanceCm,
        lastUpdated:     new Date(),
      },
      create: { ...r, lastUpdated: new Date() },
    });
    console.log(`[Seed] ✓ Row: ${r.rowId} (${r.sku}, span=${r.rowSpanCm}cm)`);
  }

  // ── 5. Seed initial TelemetrySnapshot ──────────────────────────────────────
  const existingSnaps = await prisma.telemetrySnapshot.count({ where: { rackId: rack.id } });
  if (existingSnaps === 0) {
    // Seed a few historical data points matching INITIAL_ENV_HISTORY
    const envHistory = [
      { time: '14:00', temp: 26.8, humidity: 62, gas: 170 },
      { time: '14:30', temp: 27.0, humidity: 63, gas: 175 },
      { time: '15:00', temp: 27.2, humidity: 64, gas: 180 },
      { time: '15:30', temp: 27.4, humidity: 64, gas: 178 },
      { time: '16:00', temp: 27.6, humidity: 66, gas: 182 },
      { time: '16:30', temp: 27.5, humidity: 65, gas: 185 },
    ];

    const baseDate = new Date('2026-11-03T14:00:00+07:00');
    for (let i = 0; i < envHistory.length; i++) {
      const snap = envHistory[i];
      const snapTime = new Date(baseDate.getTime() + i * 30 * 60 * 1000);
      await prisma.telemetrySnapshot.create({
        data: {
          rackId:       rack.id,
          temperatureC: snap.temp,
          humidityRh:   snap.humidity,
          gasPpm:       snap.gas,
          soundSpeedMs: 331.3 + 0.606 * snap.temp,
          createdAt:    snapTime,
        },
      });
    }
    console.log('[Seed] ✓ TelemetrySnapshot: 6 historical entries seeded.');
  } else {
    console.log(`[Seed] ⤷ TelemetrySnapshot: ${existingSnaps} existing entries, skipping seed.`);
  }

  // ── 6. Seed Inventory Ledger (historical audit log) ─────────────────────────
  const existingLedger = await prisma.inventoryLedger.count();
  if (existingLedger === 0) {
    const rackRow01 = await prisma.rackRow.findUnique({ where: { rowId: 'Row 01' } });
    const rackRow02 = await prisma.rackRow.findUnique({ where: { rowId: 'Row 02' } });
    const rackRow03 = await prisma.rackRow.findUnique({ where: { rowId: 'Row 03' } });

    if (!rackRow01 || !rackRow02 || !rackRow03) {
      throw new Error('[Seed] Rows not found — cannot seed ledger.');
    }

    const ledgerEntries = [
      {
        txId: 'TX-1048', rackId: rack.id, rowId: rackRow01.id, sku: 'SKU-001',
        prevStock: 4, currentStock: 5, diff: 1, eventType: 'Stock In',
        trigger: 'US-01/US-02 Delta (-20cm)', leftDistCm: 20, rightDistCm: 0,
        createdAt: new Date('2026-11-03T16:12:04+07:00'),
      },
      {
        txId: 'TX-1047', rackId: rack.id, rowId: rackRow03.id, sku: 'SKU-003',
        prevStock: 2, currentStock: 0, diff: -2, eventType: 'Stock Out',
        trigger: 'US-05/US-06 Clear (200cm)', leftDistCm: 100, rightDistCm: 100,
        createdAt: new Date('2026-11-03T15:40:19+07:00'),
      },
      {
        txId: 'TX-1046', rackId: rack.id, rowId: rackRow02.id, sku: 'SKU-002',
        prevStock: 5, currentStock: 4, diff: -1, eventType: 'Stock Out',
        trigger: 'US-03 Distance +25cm', leftDistCm: 50, rightDistCm: 0,
        createdAt: new Date('2026-11-03T14:22:10+07:00'),
      },
      {
        txId: 'TX-1045', rackId: rack.id, rowId: rackRow01.id, sku: 'SKU-001',
        prevStock: 2, currentStock: 4, diff: 2, eventType: 'Stock In',
        trigger: 'US-01/US-02 Delta (-40cm)', leftDistCm: 40, rightDistCm: 0,
        createdAt: new Date('2026-11-03T11:05:33+07:00'),
      },
      {
        txId: 'TX-1044', rackId: rack.id, rowId: rackRow02.id, sku: 'SKU-002',
        prevStock: 3, currentStock: 5, diff: 2, eventType: 'Stock In',
        trigger: 'US-03/US-04 Delta (-50cm)', leftDistCm: 25, rightDistCm: 0,
        createdAt: new Date('2026-11-02T17:48:12+07:00'),
      },
      {
        txId: 'TX-1043', rackId: rack.id, rowId: rackRow03.id, sku: 'SKU-003',
        prevStock: 4, currentStock: 2, diff: -2, eventType: 'Stock Out',
        trigger: 'US-05/US-06 Delta (+60cm)', leftDistCm: 70, rightDistCm: 70,
        createdAt: new Date('2026-11-02T15:19:00+07:00'),
      },
      {
        txId: 'TX-1042', rackId: rack.id, rowId: rackRow01.id, sku: 'SKU-001',
        prevStock: 5, currentStock: 2, diff: -3, eventType: 'Stock Out',
        trigger: 'US-01 Distance +60cm', leftDistCm: 80, rightDistCm: 0,
        createdAt: new Date('2026-11-02T09:30:45+07:00'),
      },
      {
        txId: 'TX-1041', rackId: rack.id, rowId: rackRow03.id, sku: 'SKU-003',
        prevStock: 1, currentStock: 4, diff: 3, eventType: 'Stock In',
        trigger: 'US-05/US-06 Delta (-90cm)', leftDistCm: 10, rightDistCm: 10,
        createdAt: new Date('2026-11-01T16:04:22+07:00'),
      },
    ];

    for (const entry of ledgerEntries) {
      await prisma.inventoryLedger.upsert({
        where: { txId: entry.txId },
        update: {},
        create: entry,
      });
    }
    console.log(`[Seed] ✓ InventoryLedger: ${ledgerEntries.length} historical entries seeded.`);
  } else {
    console.log(`[Seed] ⤷ InventoryLedger: ${existingLedger} existing entries, skipping seed.`);
  }

  console.log('\n[Seed] ✅ Database seed completed successfully.');
  console.log('─────────────────────────────────────────');
  console.log('  Rack:     RACK-001');
  console.log('  Products: 4 SKUs (SKU-001 to SKU-004)');
  console.log('  Rows:     3 (Row 01 → 5 boxes, Row 02 → 4 boxes, Row 03 → 0 boxes)');
  console.log('  Sensors:  8 (US-01..06, GAS-01, ENV-01)');
  console.log('  Ledger:   8 historical transactions');
  console.log('─────────────────────────────────────────');
}

main()
  .catch((err) => {
    console.error('[Seed] ❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

