/**
 * ============================================================================
 * WIRELESS SERIAL MONITOR ESP32 (MQTT OVER-THE-AIR DEBUGGER)
 * ============================================================================
 * Menampilkan stream telemetri dan log serial dari ESP32 Master secara langsung
 * melalui Wi-Fi / MQTT Broker EMQX Cloud tanpa perlu colok kabel USB!
 *
 * Jalankan dengan:
 * npm run monitor
 * ============================================================================
 */

const mqtt = require('mqtt');

const BROKER_URL = 'mqtts://k4366bfc.ala.asia-southeast1.emqxsl.com:8883';
const OPTIONS = {
  username: 'iwakdantempe',
  password: 'admin123',
  clientId: `cli_wireless_monitor_${Math.floor(1000 + Math.random() * 9000)}`,
  rejectUnauthorized: false,
  clean: true,
  reconnectPeriod: 3000,
};

const TOPICS = [
  'warehouse/small_warehouse/telemetry',
  'racks/+/telemetry',
  'warehouse/small_warehouse/ota/status',
  'warehouse/small_warehouse/control/buzzer'
];

console.log('\x1b[36m%s\x1b[0m', '=============================================================');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', ' 📡 SMART RACK - WIRELESS SERIAL MONITOR (ESP32 OVER WI-FI)');
console.log('\x1b[36m%s\x1b[0m', '=============================================================');
console.log(`Menghubungkan ke Broker: ${BROKER_URL}...`);

const client = mqtt.connect(BROKER_URL, OPTIONS);

client.on('connect', () => {
  console.log('\x1b[32m%s\x1b[0m', '✓ Berhasil terhubung ke Broker EMQX Cloud!');
  console.log('Menunggu transmisi live dari ESP32...\n');
  client.subscribe(TOPICS, (err) => {
    if (err) console.error('Subscription error:', err.message);
  });
});

client.on('message', (topic, rawMessage) => {
  const timeStr = new Date().toLocaleTimeString('id-ID');

  if (topic.includes('/control/buzzer')) {
    console.log(`\x1b[35m[${timeStr}] [KONTROL BUZZER] Perintah: "${rawMessage.toString().trim()}"\x1b[0m`);
    return;
  }

  if (topic.includes('/ota/status')) {
    console.log(`\x1b[34m[${timeStr}] [OTA UPDATE] Status: ${rawMessage.toString().trim()}\x1b[0m`);
    return;
  }

  try {
    const payload = JSON.parse(rawMessage.toString());
    const env = payload.environment || {};
    const sum = payload.summary || {};
    const act = payload.actuators || {};
    const floors = Array.isArray(payload.floors) ? payload.floors : [];

    console.log('\x1b[36m-------------------------------------------------------------\x1b[0m');
    console.log(`\x1b[1m[${timeStr}] 📡 TELEMETRI ESP32 DITERIMA (Topik: ${topic})\x1b[0m`);
    console.log('\x1b[36m-------------------------------------------------------------\x1b[0m');
    console.log(`• Status Gudang : \x1b[33m${sum.warehouse_status || 'UNKNOWN'}\x1b[0m | Total Stok: \x1b[32m${sum.total_items ?? 0} Kardus\x1b[0m | Firmware: ${sum.firmware_version || 'v1.0.0'}`);

    floors.forEach((f) => {
      const ledColor = f.led_color === 'GREEN' ? '\x1b[32mHIJAU\x1b[0m' : f.led_color === 'BLUE' ? '\x1b[34mBIRU\x1b[0m' : '\x1b[31mMERAH\x1b[0m';
      console.log(`  └─ Lantai ${f.floor}: Kiri: ${f.distance_left_cm} cm | Kanan: ${f.distance_right_cm} cm | Terisi: ${f.occupied_span_cm} cm | Stok: ${f.item_count} [${f.status}] LED: ${ledColor}`);
    });

    const tempVal = env.temperature_c ?? env.temperatureC ?? 0;
    const humVal = env.humidity_pct ?? env.humidityRh ?? 0;
    const gasVal = env.gas_raw ?? env.gasPpm ?? 0;
    const gasColor = gasVal >= 1800 ? '\x1b[31mBAHAYA' : gasVal >= 700 ? '\x1b[33mWASPADA' : '\x1b[32mNORMAL';

    console.log(`• Sensor Gas    : ${gasVal} ADC (${env.gas_pct ?? 0}%) -> [${gasColor}\x1b[0m]`);
    console.log(`• Sensor DHT11  : Suhu: \x1b[1m${tempVal} °C\x1b[0m | Kelembaban: \x1b[1m${humVal} %RH\x1b[0m ${tempVal === 0 ? '\x1b[31m(⚠ SENSOR 0/BELUM TERBACA)\x1b[0m' : ''}`);
    console.log(`• Status Sirene : ${act.buzzer ? '\x1b[31m🔊 BUNYI (AKTIF)\x1b[0m' : '\x1b[32m🔇 MATI (STANDBY)\x1b[0m'} | Safety: ${env.safety_state || 'SAFE_NORMAL'}`);
  } catch {
    console.log(`[${timeStr}] [RAW MSG]: ${rawMessage.toString()}`);
  }
});

client.on('error', (err) => {
  console.error('\x1b[31m[MQTT Error]:\x1b[0m', err.message);
});

client.on('close', () => {
  console.log('Koneksi MQTT tertutup.');
});

