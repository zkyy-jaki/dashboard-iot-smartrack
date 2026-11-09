import { Product, RackRow, Sensor, InventoryHistory, EnvHistoryPoint, GasAlert, TutorialScene } from '../types';
import { APP_CONFIG } from '../config';

/**
 * ============================================================================
 * DATA INVENTARIS & TELEMETRI DEFAULT (STANDALONE & DEMO FALLBACK)
 * ============================================================================
 * Data ini digunakan saat aplikasi pertama kali dijalankan atau saat backend offline.
 * Nilai dimensi rak dan sensor terikat secara dinamis ke APP_CONFIG.
 */

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'SKU-001',
    name: 'Kardus Produk A (Komponen Kecil)',
    lengthCm: 8, // Panjang aksial kardus sejajar sumbu ukur sensor (cm)
    widthCm: 8,
    heightCm: 8,
    description: 'Kardus kubus standar fisik aktual 8 cm (panjang aksial 8.0 cm).'
  },
  {
    id: 'prod-2',
    sku: 'SKU-002',
    name: 'Kardus Produk B (Sub-Assembly)',
    lengthCm: 8, // Panjang aksial kardus sejajar sumbu ukur sensor (cm)
    widthCm: 8,
    heightCm: 8,
    description: 'Kardus rakitan modul komponen aktual (panjang aksial 8.0 cm).'
  },
  {
    id: 'prod-3',
    sku: 'SKU-003',
    name: 'Kardus Produk C (Instrumentasi Berat)',
    lengthCm: 8, // Panjang aksial kardus sejajar sumbu ukur sensor (cm)
    widthCm: 8,
    heightCm: 8,
    description: 'Kardus instrumen industri aktual (panjang aksial 8.0 cm).'
  },
  {
    id: 'prod-4',
    sku: 'SKU-004',
    name: 'Kardus Produk D (Cadangan Uji Coba)',
    lengthCm: 8,
    widthCm: 8,
    heightCm: 8,
    description: 'Kardus cadangan untuk kalibrasi penambahan variasi ukuran barang (8.0 cm).'
  }
];

export const INITIAL_ROWS: RackRow[] = [
  {
    rowId: 'Row 01',
    rowNumber: 1,
    sku: 'SKU-001',
    capacity: APP_CONFIG.RACK.DEFAULT_ROW_CAPACITY,
    rowSpanCm: APP_CONFIG.RACK.DEFAULT_ROW_SPAN_CM,
    leftSensorId: 'US-01',
    rightSensorId: 'US-02',
    leftDistanceCm: 18,
    rightDistanceCm: 0,
    lastUpdated: '2026-11-03 16:34:52'
  },
  {
    rowId: 'Row 02',
    rowNumber: 2,
    sku: 'SKU-002',
    capacity: APP_CONFIG.RACK.DEFAULT_ROW_CAPACITY,
    rowSpanCm: APP_CONFIG.RACK.DEFAULT_ROW_SPAN_CM,
    leftSensorId: 'US-03',
    rightSensorId: 'US-04',
    leftDistanceCm: 8,
    rightDistanceCm: 0,
    lastUpdated: '2026-11-03 16:34:52'
  },
  {
    rowId: 'Row 03',
    rowNumber: 3,
    sku: 'SKU-003',
    capacity: APP_CONFIG.RACK.DEFAULT_ROW_CAPACITY,
    rowSpanCm: APP_CONFIG.RACK.DEFAULT_ROW_SPAN_CM,
    leftSensorId: 'US-05',
    rightSensorId: 'US-06',
    leftDistanceCm: 29,
    rightDistanceCm: 29,
    lastUpdated: '2026-11-03 16:34:52'
  }
];

export const INITIAL_SENSORS: Sensor[] = [
  {
    id: APP_CONFIG.SENSORS.ROWS[0].leftSensor.id,
    name: APP_CONFIG.SENSORS.ROWS[0].leftSensor.name,
    type: 'ULTRASONIC',
    rowId: 'Row 01',
    position: APP_CONFIG.SENSORS.ROWS[0].leftSensor.position,
    gpio: APP_CONFIG.SENSORS.ROWS[0].leftSensor.gpio,
    online: true,
    signalRssi: -54,
    lastSeen: '16:34:52'
  },
  {
    id: APP_CONFIG.SENSORS.ROWS[0].rightSensor.id,
    name: APP_CONFIG.SENSORS.ROWS[0].rightSensor.name,
    type: 'ULTRASONIC',
    rowId: 'Row 01',
    position: APP_CONFIG.SENSORS.ROWS[0].rightSensor.position,
    gpio: APP_CONFIG.SENSORS.ROWS[0].rightSensor.gpio,
    online: true,
    signalRssi: -56,
    lastSeen: '16:34:52'
  },
  {
    id: APP_CONFIG.SENSORS.ROWS[1].leftSensor.id,
    name: APP_CONFIG.SENSORS.ROWS[1].leftSensor.name,
    type: 'ULTRASONIC',
    rowId: 'Row 02',
    position: APP_CONFIG.SENSORS.ROWS[1].leftSensor.position,
    gpio: APP_CONFIG.SENSORS.ROWS[1].leftSensor.gpio,
    online: true,
    signalRssi: -52,
    lastSeen: '16:34:52'
  },
  {
    id: APP_CONFIG.SENSORS.ROWS[1].rightSensor.id,
    name: APP_CONFIG.SENSORS.ROWS[1].rightSensor.name,
    type: 'ULTRASONIC',
    rowId: 'Row 02',
    position: APP_CONFIG.SENSORS.ROWS[1].rightSensor.position,
    gpio: APP_CONFIG.SENSORS.ROWS[1].rightSensor.gpio,
    online: true,
    signalRssi: -58,
    lastSeen: '16:34:52'
  },
  {
    id: APP_CONFIG.SENSORS.ROWS[2].leftSensor.id,
    name: APP_CONFIG.SENSORS.ROWS[2].leftSensor.name,
    type: 'ULTRASONIC',
    rowId: 'Row 03',
    position: APP_CONFIG.SENSORS.ROWS[2].leftSensor.position,
    gpio: APP_CONFIG.SENSORS.ROWS[2].leftSensor.gpio,
    online: true,
    signalRssi: -55,
    lastSeen: '16:34:52'
  },
  {
    id: APP_CONFIG.SENSORS.ROWS[2].rightSensor.id,
    name: APP_CONFIG.SENSORS.ROWS[2].rightSensor.name,
    type: 'ULTRASONIC',
    rowId: 'Row 03',
    position: APP_CONFIG.SENSORS.ROWS[2].rightSensor.position,
    gpio: APP_CONFIG.SENSORS.ROWS[2].rightSensor.gpio,
    online: true,
    signalRssi: -57,
    lastSeen: '16:34:52'
  },
  {
    id: APP_CONFIG.SENSORS.ENVIRONMENT.GAS_MQ2.id,
    name: APP_CONFIG.SENSORS.ENVIRONMENT.GAS_MQ2.name,
    type: 'GAS',
    rowId: 'Ambient Frame',
    position: APP_CONFIG.SENSORS.ENVIRONMENT.GAS_MQ2.position,
    gpio: APP_CONFIG.SENSORS.ENVIRONMENT.GAS_MQ2.gpio,
    online: true,
    signalRssi: -51,
    lastSeen: '16:34:52'
  },
  {
    id: APP_CONFIG.SENSORS.ENVIRONMENT.TEMP_HUMIDITY_DHT11.id,
    name: APP_CONFIG.SENSORS.ENVIRONMENT.TEMP_HUMIDITY_DHT11.name,
    type: 'ENV',
    rowId: 'Ambient Frame',
    position: APP_CONFIG.SENSORS.ENVIRONMENT.TEMP_HUMIDITY_DHT11.position,
    gpio: APP_CONFIG.SENSORS.ENVIRONMENT.TEMP_HUMIDITY_DHT11.gpio,
    online: true,
    signalRssi: -51,
    lastSeen: '16:34:52'
  }
];

export const INITIAL_HISTORY: InventoryHistory[] = [
  {
    id: 'TX-1048',
    timestamp: '2026-11-03 16:12:04',
    dateOnly: '2026-11-03',
    rackId: 'RACK-001',
    rowId: 'Row 01',
    sku: 'SKU-001',
    prevStock: 4,
    currentStock: 5,
    diff: +1,
    eventType: 'Stock In',
    trigger: 'US-01/US-02 Delta (-20cm)'
  },
  {
    id: 'TX-1047',
    timestamp: '2026-11-03 15:40:19',
    dateOnly: '2026-11-03',
    rackId: 'RACK-001',
    rowId: 'Row 03',
    sku: 'SKU-003',
    prevStock: 2,
    currentStock: 0,
    diff: -2,
    eventType: 'Stock Out',
    trigger: 'US-05/US-06 Clear (200cm)'
  },
  {
    id: 'TX-1046',
    timestamp: '2026-11-03 14:22:10',
    dateOnly: '2026-11-03',
    rackId: 'RACK-001',
    rowId: 'Row 02',
    sku: 'SKU-002',
    prevStock: 5,
    currentStock: 4,
    diff: -1,
    eventType: 'Stock Out',
    trigger: 'US-03 Distance +25cm'
  },
  {
    id: 'TX-1045',
    timestamp: '2026-11-03 11:05:33',
    dateOnly: '2026-11-03',
    rackId: 'RACK-001',
    rowId: 'Row 01',
    sku: 'SKU-001',
    prevStock: 2,
    currentStock: 4,
    diff: +2,
    eventType: 'Stock In',
    trigger: 'US-01/US-02 Delta (-40cm)'
  },
  {
    id: 'TX-1044',
    timestamp: '2026-11-02 17:48:12',
    dateOnly: '2026-11-02',
    rackId: 'RACK-001',
    rowId: 'Row 02',
    sku: 'SKU-002',
    prevStock: 3,
    currentStock: 5,
    diff: +2,
    eventType: 'Stock In',
    trigger: 'US-03/US-04 Delta (-50cm)'
  },
  {
    id: 'TX-1043',
    timestamp: '2026-11-02 15:19:00',
    dateOnly: '2026-11-02',
    rackId: 'RACK-001',
    rowId: 'Row 03',
    sku: 'SKU-003',
    prevStock: 4,
    currentStock: 2,
    diff: -2,
    eventType: 'Stock Out',
    trigger: 'US-05/US-06 Delta (+60cm)'
  },
  {
    id: 'TX-1042',
    timestamp: '2026-11-02 09:30:45',
    dateOnly: '2026-11-02',
    rackId: 'RACK-001',
    rowId: 'Row 01',
    sku: 'SKU-001',
    prevStock: 5,
    currentStock: 2,
    diff: -3,
    eventType: 'Stock Out',
    trigger: 'US-01 Distance +60cm'
  },
  {
    id: 'TX-1041',
    timestamp: '2026-11-01 16:04:22',
    dateOnly: '2026-11-01',
    rackId: 'RACK-001',
    rowId: 'Row 03',
    sku: 'SKU-003',
    prevStock: 1,
    currentStock: 4,
    diff: +3,
    eventType: 'Stock In',
    trigger: 'US-05/US-06 Delta (-90cm)'
  }
];

export const INITIAL_ENV_HISTORY: EnvHistoryPoint[] = [
  { time: '14:00', temp: 26.8, humidity: 62, gasPpm: 170 },
  { time: '14:30', temp: 27.0, humidity: 63, gasPpm: 175 },
  { time: '15:00', temp: 27.2, humidity: 64, gasPpm: 180 },
  { time: '15:30', temp: 27.4, humidity: 64, gasPpm: 178 },
  { time: '16:00', temp: 27.6, humidity: 66, gasPpm: 182 },
  { time: '16:30', temp: 27.5, humidity: 65, gasPpm: 185 }
];

export const INITIAL_GAS_ALERTS: GasAlert[] = [
  {
    id: 'GA-03',
    timestamp: '2026-11-03 08:15:00',
    readingPpm: 182,
    status: 'Normal',
    message: 'Pemeriksaan mandiri ambang batas gas pagi hari normal.'
  },
  {
    id: 'GA-02',
    timestamp: '2026-10-29 14:12:44',
    readingPpm: 430,
    status: 'Warning',
    message: 'Kenaikan sementara uap VOC di dekat pintu bongkar muat (kembali normal dlm 4m).'
  },
  {
    id: 'GA-01',
    timestamp: '2026-10-18 11:02:10',
    readingPpm: 690,
    status: 'Danger',
    message: 'Pelewatan ambang batas bahaya selama uji kalibrasi gas kaleng.'
  }
];

export const TUTORIAL_SCENES: TutorialScene[] = [
  {
    step: 1,
    code: 'SCENE 01 • TOPOLOGI ULTRASONIK',
    title: 'Pengenalan Sensor Ultrasonik',
    description:
      'Setiap baris rak dilengkapi dua sensor ultrasonik yang mengukur jarak dari kedua ujung penyimpanan.',
    technicalNote:
      'Dua transduser HC-SR04 dipasang saling berhadapan di ujung kiri dan kanan setiap baris penyimpanan.'
  },
  {
    step: 2,
    code: 'SCENE 02 • PENGUKURAN RUANG KOSONG',
    title: 'Posisi Penempatan Kardus',
    description:
      'Kardus dapat ditempatkan di berbagai posisi sepanjang area penyimpanan. Sensor akan mengukur ruang kosong dari kedua ujung rak.',
    technicalNote:
      'Sistem mengakumulasi jarak ruang kosong kiri (d_left) dan kanan (d_right), bukan mendeteksi koordinat kardus secara langsung.'
  },
  {
    step: 3,
    code: 'SCENE 03 • KONSISTENSI ORIENTASI',
    title: 'Konsistensi Orientasi Kardus',
    description:
      'Pastikan seluruh kardus dalam satu baris memiliki orientasi yang sama. Jika kardus pertama menggunakan sisi 5 cm sebagai panjang susunan, kardus berikutnya juga harus menggunakan sisi 5 cm.',
    technicalNote:
      'Memutar kardus 90° (sisi 6 cm sejajar sumbu ukur) akan membuat pembagi rumus panjang aksial menjadi tidak akurat.'
  },
  {
    step: 4,
    code: 'SCENE 04 • PENYUSUNAN RAPAT HORIZONTAL',
    title: 'Kardus Harus Bertumpukan Rapat Secara Horizontal',
    description:
      'Jika menyimpan lebih dari satu kardus, susun kardus secara rapat tanpa celah di antaranya agar estimasi jumlah barang tetap akurat.',
    technicalNote:
      'Celah udara di antara kardus tidak terukur oleh sensor ujung dan dapat terhitung sebagai tambahan panjang barang.'
  },
  {
    step: 5,
    code: 'SCENE 05 • INDIKATOR LED RGB TUNGGAL',
    title: 'Indikator RGB LED dan Kondisi Kosong',
    description:
      'Satu lampu indikator RGB pada rangka samping rak berubah warna secara stabil mengikuti tingkat keterisian: Merah (Kosong), Biru (Terisi Sebagian), dan Hijau (Penuh).',
    technicalNote:
      'Menggunakan 1 modul LED RGB terintegrasi yang mengubah warna secara sinkron dengan kapasitas baris rak.'
  },
  {
    step: 6,
    code: 'SCENE 06 • TELEMETRI KESELAMATAN LINGKUNGAN',
    title: 'Sensor Suhu dan Sensor Gas MQ2',
    description:
      'Selain memantau persediaan, sistem juga memantau kondisi lingkungan di sekitar rak melalui sensor suhu, kelembapan, dan gas.',
    technicalNote:
      'Dipasang secara vertikal di bawah indikator RGB pada tiang samping: DHT11 (Suhu & Kelembapan) serta MQ2 (Gas/Asap).'
  },
  {
    step: 7,
    code: 'SCENE 07 • PROTOKOL ALARM DARURAT',
    title: 'Kondisi Darurat: Suhu Tinggi atau Kebakaran',
    description:
      'Jika suhu lingkungan mencapai batas bahaya atau sistem mendeteksi kondisi gas berbahaya, sistem akan mengaktifkan peringatan berupa lampu merah berkedip dan buzzer.',
    technicalNote:
      'Lampu merah stabil menandakan rak kosong, sedangkan lampu merah berkedip disertai suara buzzer menandakan kondisi darurat.'
  }
];
