/**
 * ============================================================================
 * ESP32 VIRTUAL HARDWARE SIMULATOR (MQTT)
 * ============================================================================
 * Mensimulasikan data ESP32 tanpa membutuhkan perangkat fisik.
 * Mengirimkan data telemetri ke EMQX Broker dan mendengarkan respon backend.
 *
 * Jalankan dengan:
 *   cd backend
 *   npm run simulate
 * ============================================================================
 */

import mqtt from 'mqtt';
import readline from 'readline';

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtts://k4366bfc.ala.asia-southeast1.emqxsl.com:8883';
const CLIENT_ID = 'ESP32-Virtual-Simulator-' + Math.floor(Math.random() * 1000);
const MQTT_USER = process.env.MQTT_USERNAME || 'iwakdantempe';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || 'admin123';

const TOPIC_TELEMETRY = 'warehouse/small_warehouse/telemetry';
const TOPIC_BUZZER_CONTROL = 'warehouse/small_warehouse/control/buzzer';
const TOPIC_ACTUATORS = 'racks/RACK-001/actuators';

const SHELF_WIDTH = 58.0; // cm
const BOX_WIDTH = 14.5;   // cm

const client = mqtt.connect(BROKER_URL, {
  clientId: CLIENT_ID,
  clean: true,
  connectTimeout: 10000,
  username: MQTT_USER,
  password: MQTT_PASSWORD,
  rejectUnauthorized: false,
});

let autoInterval: NodeJS.Timeout | null = null;
let currentStep = 0;

console.clear();
console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║       ESP32 VIRTUAL HARDWARE SIMULATOR (IIoT WAREHOUSE)          ║');
console.log('╠══════════════════════════════════════════════════════════════════╣');
console.log(`║  Broker MQTT : ${BROKER_URL.padEnd(46)}║`);
console.log(`║  Client ID   : ${CLIENT_ID.padEnd(46)}║`);
console.log(`║  Pub Topik   : ${TOPIC_TELEMETRY.padEnd(46)}║`);
console.log('╚══════════════════════════════════════════════════════════════════╝');
console.log('\n[Simulator] Menghubungkan ke broker EMQX...');

client.on('connect', () => {
  console.log('[Simulator] ✓ Terhubung ke EMQX Broker!');
  client.subscribe([TOPIC_BUZZER_CONTROL, TOPIC_ACTUATORS], (err) => {
    if (!err) {
      console.log(`[Simulator] ✓ Mendengarkan topik perintah:`);
      console.log(`            - ${TOPIC_BUZZER_CONTROL} (Kontrol Buzzer Langsung)`);
      console.log(`            - ${TOPIC_ACTUATORS} (Aktuator LED 3-Lantai dari Backend)`);
      printMenu();
    }
  });
});

client.on('message', (topic, payload) => {
  const msg = payload.toString();
  console.log('\n------------------------------------------------------------');
  console.log(`📩 [DITERIMA DARI BACKEND / WEB] Topik: ${topic}`);
  try {
    const parsed = JSON.parse(msg);
    console.log('Payload JSON:', JSON.stringify(parsed, null, 2));
    if (parsed.ledStates) {
      console.log(`💡 Status Fisik LED:`);
      console.log(`   - Lantai 1: ${formatColor(parsed.ledStates.row1)}`);
      console.log(`   - Lantai 2: ${formatColor(parsed.ledStates.row2)}`);
      console.log(`   - Lantai 3: ${formatColor(parsed.ledStates.row3)}`);
      console.log(`📢 Status Buzzer: ${parsed.buzzerActive ? '🔊 BUNYI' : '🔇 MATI'}`);
      console.log(`🚨 Emergency    : ${parsed.emergency ? '⚠️ DARURAT' : '✅ NORMAL'}`);
    }
  } catch {
    console.log(`Perintah Teks: "${msg}"`);
  }
  console.log('------------------------------------------------------------');
});

function formatColor(color: string): string {
  if (color === 'RED') return '\x1b[31m[RED / KOSONG]\x1b[0m';
  if (color === 'BLUE') return '\x1b[34m[BLUE / TERISI SEBAGIAN]\x1b[0m';
  if (color === 'GREEN') return '\x1b[32m[GREEN / PENUH]\x1b[0m';
  if (color === 'BLINK_RED') return '\x1b[35m\x1b[1m[BLINK RED / BAHAYA]\x1b[0m';
  return color;
}

function sendTelemetry(params: {
  f1Items: number;
  f2Items: number;
  f3Items: number;
  tempC?: number;
  humRh?: number;
  gasPpm?: number;
}) {
  const { f1Items, f2Items, f3Items, tempC = 27.5, humRh = 62.0, gasPpm = 180 } = params;
  const isHazard = tempC >= 50.0 || gasPpm >= 600;

  function buildFloor(items: number, align: 'left' | 'right' = 'left') {
    if (items === 0) {
      return {
        distance_left_cm: SHELF_WIDTH,
        distance_right_cm: SHELF_WIDTH,
        occupied_span_cm: 0.0,
        item_count: 0,
        is_occupied: false,
        detected_sides: 2,
        status: 'EMPTY',
        led_color: isHazard ? 'BLINK_RED' : 'RED',
        sensor_left_ok: true,
        sensor_right_ok: true,
      };
    }

    const occupied = Number(Math.min(items * BOX_WIDTH, SHELF_WIDTH).toFixed(1));
    const remaining = Number(Math.max(0, SHELF_WIDTH - occupied).toFixed(1));

    // Konsep fisik rak warehouse: Kardus menempel di dinding/stoper kiri (atau kanan), tidak bisa melayang di tengah
    const dLeft = align === 'left' ? 0.0 : remaining;
    const dRight = align === 'left' ? remaining : 0.0;
    const status = items >= 4 ? 'FULL' : 'PARTIAL';
    const ledColor = isHazard ? 'BLINK_RED' : status === 'FULL' ? 'GREEN' : 'BLUE';

    return {
      distance_left_cm: dLeft,
      distance_right_cm: dRight,
      occupied_span_cm: occupied,
      item_count: items,
      is_occupied: true,
      detected_sides: 2,
      status,
      led_color: ledColor,
      sensor_left_ok: true,
      sensor_right_ok: true,
    };
  }

  const f1 = buildFloor(f1Items);
  const f2 = buildFloor(f2Items);
  const f3 = buildFloor(f3Items);
  const totalItems = f1.item_count + f2.item_count + f3.item_count;
  const occupancyPct = Number(((totalItems / 12) * 100).toFixed(1));

  const payload = {
    rackId: 'RACK-001',
    timestamp: Math.floor(Date.now() / 1000),
    floors: {
      floor_1: f1,
      floor_2: f2,
      floor_3: f3,
    },
    summary: {
      total_items: totalItems,
      occupied_floors: [f1, f2, f3].filter((f) => f.item_count > 0).length,
      warehouse_status: totalItems === 0 ? 'EMPTY' : totalItems >= 12 ? 'FULL' : 'PARTIAL',
      max_capacity: 12,
      occupancy_rate_pct: occupancyPct,
    },
    environment: {
      temperature_c: tempC,
      humidity_pct: humRh,
      gas_raw: Math.round((gasPpm / 1000) * 4095),
      gas_pct: Number(((gasPpm / 1000) * 100).toFixed(1)),
      hazard_detected: isHazard,
      safety_state: isHazard ? 'HAZARD' : 'SAFE',
    },
  };

  client.publish(TOPIC_TELEMETRY, JSON.stringify(payload), { qos: 0 }, (err) => {
    if (!err) {
      console.log(`\n🚀 [TELEMETRI TERKIRIM] Total Barang: ${totalItems}/12 (${occupancyPct}%)`);
      console.log(`   ├─ Lantai 1 (Row 1): ${f1.item_count}/4 box (${f1.status}) | Span: ${f1.occupied_span_cm} cm | LED: ${formatColor(f1.led_color)}`);
      console.log(`   ├─ Lantai 2 (Row 2): ${f2.item_count}/4 box (${f2.status}) | Span: ${f2.occupied_span_cm} cm | LED: ${formatColor(f2.led_color)}`);
      console.log(`   ├─ Lantai 3 (Row 3): ${f3.item_count}/4 box (${f3.status}) | Span: ${f3.occupied_span_cm} cm | LED: ${formatColor(f3.led_color)}`);
      console.log(`   └─ Sensor Lingkungan: Suhu ${tempC}°C (DHT11) | Gas ${gasPpm} ppm (${isHazard ? '⚠️ BAHAYA' : '✅ AMAN'})`);
      console.log('   👉 Cek Dashboard Browser Anda (http://localhost:5173/) sekarang!');
    }
  });
}

function printMenu() {
  console.log('\n=================== PILIH SKENARIO UJI ===================');
  console.log(' [1] Rak Kosong Semua        (L1: 0, L2: 0, L3: 0)  -> 3 LED: RED');
  console.log(' [2] Rak Terisi Sebagian     (L1: 1, L2: 2, L3: 3)  -> 3 LED: BLUE');
  console.log(' [3] Rak Penuh Kapasitas     (L1: 4, L2: 4, L3: 4)  -> 3 LED: GREEN');
  console.log(' [4] Campuran Tiap Lantai    (L1: 0, L2: 4, L3: 2)  -> L1: RED, L2: GREEN, L3: BLUE');
  console.log(' [5] SIMULASI BAHAYA GAS     (MQ-2: 2100 ppm)       -> Alarm + Semua BLINK_RED + Buzzer');
  console.log(' [6] SIMULASI BAHAYA SUHU    (DHT11: 54°C)          -> Alarm + Semua BLINK_RED + Buzzer');
  console.log(' [7] AUTO-LOOP REAL-TIME     (Simulasi dinamis tiap 3 detik)');
  console.log(' [8] Hentikan Auto-Loop');
  console.log(' [0] Keluar Simulator');
  console.log('==========================================================');
  process.stdout.write('Masukkan nomor pilihan [0-8]: ');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on('line', (line) => {
  const choice = line.trim();

  switch (choice) {
    case '1':
      stopAuto();
      console.log('\n▶ Mengirim Skenario 1: Rak Kosong...');
      sendTelemetry({ f1Items: 0, f2Items: 0, f3Items: 0 });
      break;
    case '2':
      stopAuto();
      console.log('\n▶ Mengirim Skenario 2: Rak Terisi Sebagian...');
      sendTelemetry({ f1Items: 1, f2Items: 2, f3Items: 3 });
      break;
    case '3':
      stopAuto();
      console.log('\n▶ Mengirim Skenario 3: Rak Penuh...');
      sendTelemetry({ f1Items: 4, f2Items: 4, f3Items: 4 });
      break;
    case '4':
      stopAuto();
      console.log('\n▶ Mengirim Skenario 4: Campuran Dinamis...');
      sendTelemetry({ f1Items: 0, f2Items: 4, f3Items: 2 });
      break;
    case '5':
      stopAuto();
      console.log('\n▶ Mengirim Skenario 5: Bahaya Gas 2100 ppm...');
      sendTelemetry({ f1Items: 2, f2Items: 2, f3Items: 2, gasPpm: 2100 });
      break;
    case '6':
      stopAuto();
      console.log('\n▶ Mengirim Skenario 6: Bahaya Suhu 54°C...');
      sendTelemetry({ f1Items: 2, f2Items: 2, f3Items: 2, tempC: 54.0 });
      break;
    case '7':
      startAuto();
      break;
    case '8':
      stopAuto();
      console.log('\n✓ Auto-loop dihentikan.');
      break;
    case '0':
      console.log('\nKeluar dari simulator. Sampai jumpa!');
      client.end();
      process.exit(0);
      break;
    default:
      console.log('Pilihan tidak valid.');
      break;
  }

  setTimeout(printMenu, 1500);
});

function stopAuto() {
  if (autoInterval) {
    clearInterval(autoInterval);
    autoInterval = null;
  }
}

function startAuto() {
  stopAuto();
  console.log('\n🚀 Auto-loop aktif! Mengirim data perubahan stok otomatis setiap 3 detik...');
  const scenarios = [
    { f1Items: 0, f2Items: 0, f3Items: 0, gasPpm: 120, tempC: 26.5 },
    { f1Items: 1, f2Items: 0, f3Items: 0, gasPpm: 130, tempC: 27.0 },
    { f1Items: 2, f2Items: 1, f3Items: 0, gasPpm: 125, tempC: 27.2 },
    { f1Items: 3, f2Items: 2, f3Items: 1, gasPpm: 140, tempC: 27.5 },
    { f1Items: 4, f2Items: 3, f3Items: 2, gasPpm: 150, tempC: 28.0 },
    { f1Items: 4, f2Items: 4, f3Items: 4, gasPpm: 160, tempC: 28.2 },
    { f1Items: 2, f2Items: 4, f3Items: 1, gasPpm: 170, tempC: 27.8 },
  ];

  autoInterval = setInterval(() => {
    const sc = scenarios[currentStep % scenarios.length];
    currentStep++;
    sendTelemetry(sc);
  }, 3000);
}

