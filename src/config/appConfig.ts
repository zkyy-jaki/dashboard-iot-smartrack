/**
 * ============================================================================
 * PUSAT KONFIGURASI UTAMA SMART RACK WMS (FRONTEND)
 * ============================================================================
 * 
 * File ini adalah Single Source of Truth (Satu Sumber Kebenaran) untuk semua
 * parameter konfigurasi dashboard. Jika Anda ingin mengubah ukuran rak, pin sensor,
 * ambang batas bahaya, atau URL server, CUKUP UBAH DI FILE INI.
 * 
 * Seluruh komponen, halaman, kalkulator, dan data simulasi akan otomatis
 * mengikuti nilai yang ditentukan di sini.
 */

export const APP_CONFIG = {
  // --------------------------------------------------------------------------
  // 1. KONFIGURASI FISIK RAK & AMBALAN PENYIMPANAN
  // --------------------------------------------------------------------------
  RACK: {
    DEFAULT_RACK_ID: 'RACK-001',
    DEFAULT_CONTROLLER_ID: 'ESP32-WROOM-32D',

    /**
     * Panjang fisik satu baris ambalan rak dalam centimeter (cm).
     * CONTOH: Jika rak Anda berukuran 58 cm, ubah nilai di bawah menjadi 58.
     * Jika rak Anda nanti diganti menjadi 100 cm atau 120 cm, cukup ganti angka ini.
     */
    DEFAULT_ROW_SPAN_CM: 58,

    /**
     * Jumlah baris penyimpanan vertikal pada satu unit rak.
     */
    TOTAL_ROWS: 3,

    /**
     * Batas maksimal kardus yang dapat ditampung per baris (kapasitas default).
     */
    DEFAULT_ROW_CAPACITY: 6,
  },

  // --------------------------------------------------------------------------
  // 2. KONFIGURASI AMBANG BATAS SENSOR & KESELAMATAN (THRESHOLDS)
  // --------------------------------------------------------------------------
  THRESHOLDS: {
    /**
     * Ambang batas waspada kebocoran gas/asap (PPM / ADC) dari sensor MQ-2.
     * Nilai di atas ini akan memunculkan status 'Warning' (Kuning).
     */
    GAS_WARNING_PPM: 700,

    /**
     * Ambang batas bahaya gas/asap (PPM / ADC).
     * Nilai di atas ini memicu status 'Danger' (Merah) dan menyalakan buzzer darurat.
     */
    GAS_DANGER_PPM: 1800,

    /**
     * Ambang batas bahaya suhu tinggi (°C) dari sensor SHT31.
     * Memicu protokol evakuasi/alarm kebakaran jika terlampaui.
     */
    TEMP_DANGER_C: 50.0,

    /**
     * Suhu & kelembapan baseline lingkungan normal.
     */
    DEFAULT_TEMP_C: 27.5,
    DEFAULT_HUMIDITY_RH: 65,
    DEFAULT_GAS_PPM: 185,
  },

  // --------------------------------------------------------------------------
  // 3. KONFIGURASI JARINGAN & SERVER (NETWORK & BACKEND)
  // --------------------------------------------------------------------------
  NETWORK: {
    /**
     * URL API Backend Express.
     * Dapat dioverride melalui file `.env` dengan variabel `VITE_BACKEND_URL`.
     */
    BACKEND_URL: (() => {
      let url = String(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001').trim();
      url = url.replace(/\/+$/, '');
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://') && !url.includes('localhost')) {
        url = url.replace(/^http:\/\//, 'https://');
      }
      return url;
    })(),

    /**
     * Alamat default broker MQTT tempat ESP32 mengirim data.
     * Menggunakan EMQX Serverless Cloud Broker dengan protokol TLS (port 8883).
     */
    DEFAULT_MQTT_BROKER: import.meta.env.VITE_MQTT_BROKER || 'mqtts://k4366bfc.ala.asia-southeast1.emqxsl.com:8883',

    /**
     * Interval polling/update telemetri dalam milidetik (ms).
     */
    DEFAULT_POLLING_INTERVAL_MS: 2000,
  },

  // --------------------------------------------------------------------------
  // 4. PEMETAAN PIN HARDWARE SENSOR ESP32 (HARDWARE PINOUT CONTRACT)
  // Sesuai Firmware ESP32 Master + ESP32 Slave UART Serial2
  // --------------------------------------------------------------------------
  SENSORS: {
    ROWS: [
      {
        rowId: 'Row 01',
        rowNumber: 1,
        leftSensor: {
          id: 'US-01',
          name: 'Ultrasonik Kiri — Baris 01',
          gpio: 'TRIG: GPIO27 / ECHO: GPIO34 (Slave)',
          position: 'Ujung Kiri Ambalan',
        },
        rightSensor: {
          id: 'US-02',
          name: 'Ultrasonik Kanan — Baris 01',
          gpio: 'TRIG: GPIO14 / ECHO: GPIO35 (Slave)',
          position: 'Ujung Kanan Ambalan',
        },
      },
      {
        rowId: 'Row 02',
        rowNumber: 2,
        leftSensor: {
          id: 'US-03',
          name: 'Ultrasonik Kiri — Baris 02',
          gpio: 'TRIG: GPIO13 / ECHO: GPIO32 (Slave)',
          position: 'Ujung Kiri Ambalan',
        },
        rightSensor: {
          id: 'US-04',
          name: 'Ultrasonik Kanan — Baris 02',
          gpio: 'TRIG: GPIO04 / ECHO: GPIO33 (Slave)',
          position: 'Ujung Kanan Ambalan',
        },
      },
      {
        rowId: 'Row 03',
        rowNumber: 3,
        leftSensor: {
          id: 'US-05',
          name: 'Ultrasonik Kiri — Baris 03',
          gpio: 'TRIG: GPIO05 / ECHO: GPIO25 (Slave)',
          position: 'Ujung Kiri Ambalan',
        },
        rightSensor: {
          id: 'US-06',
          name: 'Ultrasonik Kanan — Baris 03',
          gpio: 'TRIG: GPIO18 / ECHO: GPIO26 (Slave)',
          position: 'Ujung Kanan Ambalan',
        },
      },
    ],
    ENVIRONMENT: {
      GAS_MQ2: {
        id: 'GAS-01',
        name: 'Sensor Gas MQ-2',
        gpio: 'ADC1_CH0 (GPIO36 - Master)',
        position: 'Tiang Kanan Atas',
      },
      TEMP_HUMIDITY_DHT11: {
        id: 'ENV-01',
        name: 'Sensor Suhu & Kelembapan DHT11',
        gpio: 'DATA: GPIO04 (1-Wire Digital - Master)',
        position: 'Tiang Kanan Bawah',
      },
    },
    ACTUATORS: {
      RGB_LED_ROW1: {
        id: 'ACT-LED-01',
        name: 'Indikator RGB LED Lantai 1',
        gpio: 'R: GPIO23 / G: GPIO22 / B: GPIO21 (Master)',
        position: 'Rangka Ambalan Baris 01',
      },
      RGB_LED_ROW2: {
        id: 'ACT-LED-02',
        name: 'Indikator RGB LED Lantai 2',
        gpio: 'R: GPIO19 / G: GPIO18 / B: GPIO05 (Master)',
        position: 'Rangka Ambalan Baris 02',
      },
      RGB_LED_ROW3: {
        id: 'ACT-LED-03',
        name: 'Indikator RGB LED Lantai 3',
        gpio: 'R: GPIO17 / G: GPIO16 / B: GPIO14 (Master)',
        position: 'Rangka Ambalan Baris 03',
      },
      RGB_LED: {
        id: 'ACT-LED-01',
        name: 'Lampu Indikator RGB Terintegrasi',
        gpio: 'R: GPIO23 / G: GPIO22 / B: GPIO21 (Master)',
        position: 'Rangka Rak',
      },
      BUZZER: {
        id: 'ACT-BUZ-01',
        name: 'Buzzer Alarm Peringatan',
        gpio: 'GPIO13 (Active High - Master)',
        position: 'Modul Samping Rak',
      },
    },
    COMMUNICATION: {
      UART_SERIAL2: {
        MASTER: 'RX: GPIO26 / TX: GPIO27 (Master)',
        SLAVE: 'TX: GPIO17 / RX: GPIO16 (Slave)',
        BAUD_RATE: 115200,
        DESCRIPTION: 'Inter-ESP32 UART Serial2 Bridge'
      }
    }
  },

  // --------------------------------------------------------------------------
  // 5. WARNA & STATUS INDIKATOR RGB LED RAK
  // --------------------------------------------------------------------------
  LED_COLORS: {
    EMPTY: {
      label: 'MERAH STABIL',
      hex: '#DC2626',
      meaning: 'Rak kosong (0 kardus)',
    },
    PARTIALLY_OCCUPIED: {
      label: 'BIRU STABIL',
      hex: '#2563EB',
      meaning: 'Rak terisi sebagian',
    },
    FULL: {
      label: 'HIJAU STABIL',
      hex: '#16A34A',
      meaning: 'Rak penuh sesuai kapasitas maksimal',
    },
    EMERGENCY: {
      label: 'MERAH KEDIP + BUZZER',
      hex: '#EF4444',
      meaning: 'Peringatan bahaya suhu tinggi atau kebocoran gas',
    },
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
export default APP_CONFIG;

