# 📖 Panduan Konfigurasi & Arsitektur Bersih (Clean Code)
## Smart Small Rack Warehouse Monitoring System (IIoT WMS)

Dokumen ini memandu Anda untuk memahami struktur kode, lokasi file konfigurasi terpusat, dan cara mengubah parameter sistem (panjang rak, pin sensor, ambang batas bahaya, URL API/MQTT) dengan mudah dan aman tanpa merusak alur aplikasi.

---

## 🎯 1. Ringkasan Pusat Konfigurasi (Single Source of Truth)

Sebelumnya nilai konfigurasi (seperti panjang rak 58 cm, ambang batas gas 350/600 ppm, IP MQTT) tersebar di banyak file. Sekarang seluruh konfigurasi telah disatukan ke dalam **dua file utama**:

| Lingkup | File Konfigurasi Utama | Deskripsi |
| :--- | :--- | :--- |
| **Frontend (React)** | [`src/config/appConfig.ts`](file:///c:/Users/LENOVO/OneDrive/Documents/KULYEAHHH/SMT%205/IoT/Dashboard%20IoT/src/config/appConfig.ts) | Dimensi rak, daftar pin sensor, warna LED RGB, ambang batas gas/suhu, URL API. |
| **Backend (Node.js)** | [`backend/.env`](file:///c:/Users/LENOVO/OneDrive/Documents/KULYEAHHH/SMT%205/IoT/Dashboard%20IoT/backend/.env.example) & [`backend/src/config/index.ts`](file:///c:/Users/LENOVO/OneDrive/Documents/KULYEAHHH/SMT%205/IoT/Dashboard%20IoT/backend/src/config/index.ts) | Port Express, URL Broker MQTT, Database SQLite, ambang batas bahaya, default panjang rak. |

---

## 🛠️ 2. Cara Mengubah Parameter Umum

### A. Mengubah Panjang Ambalan Rak (Misal dari 58 cm ke ukuran lain)
Jika Anda mengganti rak fisik Anda dengan panjang yang berbeda:
1. **Di Frontend**: Buka [`src/config/appConfig.ts`](file:///c:/Users/LENOVO/OneDrive/Documents/KULYEAHHH/SMT%205/IoT/Dashboard%20IoT/src/config/appConfig.ts), cari bagian `RACK`:
   ```ts
   RACK: {
     DEFAULT_RACK_ID: 'RACK-001',
     DEFAULT_ROW_SPAN_CM: 58, // <-- Ganti angka ini (misal: 60, 80, 100, 120)
     TOTAL_ROWS: 3,
     DEFAULT_ROW_CAPACITY: 6,
   }
   ```
2. **Di Backend**: Buka file `backend/.env` (atau salin dari `backend/.env.example`):
   ```env
   DEFAULT_ROW_SPAN_CM=58  # <-- Ganti dengan angka yang sama
   ```
*Semua perhitungan stok, diagram, indikator, simulator, dan seed database akan langsung tersinkronisasi otomatis!*

---

### B. Mengubah Ambang Batas Sensor (Gas MQ-2 & Suhu DHT11)
Buka [`src/config/appConfig.ts`](file:///c:/Users/LENOVO/OneDrive/Documents/KULYEAHHH/SMT%205/IoT/Dashboard%20IoT/src/config/appConfig.ts), cari bagian `THRESHOLDS`:
```ts
THRESHOLDS: {
  GAS_WARNING_PPM: 350,  // Muncul status 'Warning' (Kuning)
  GAS_DANGER_PPM: 600,   // Memicu 'Danger' (Merah) & Alarm Buzzer
  TEMP_DANGER_C: 50.0,   // Ambang batas kebakaran/suhu tinggi
}
```

---

### C. Mengubah Alamat Backend & Broker MQTT (Untuk ESP32)
1. **Frontend**: Buat file `.env` di folder utama (contoh di [`.env.example`](file:///c:/Users/LENOVO/OneDrive/Documents/KULYEAHHH/SMT%205/IoT/Dashboard%20IoT/.env.example)):
   ```env
   VITE_BACKEND_URL=http://192.168.1.100:3001
   ```
   *(Ganti `192.168.1.100` dengan alamat IP komputer/server Anda)*.
2. **Backend**: Di `backend/.env`:
   ```env
   PORT=3001
   CORS_ORIGIN=http://localhost:5173
   MQTT_BROKER_URL=mqtt://192.168.1.100:1883
   ```

---

### D. Mengubah Dimensi Barang / Produk (Kardus SKU)
Buka [`src/data/initialData.ts`](file:///c:/Users/LENOVO/OneDrive/Documents/KULYEAHHH/SMT%205/IoT/Dashboard%20IoT/src/data/initialData.ts) pada bagian `INITIAL_PRODUCTS`:
```ts
{
  id: 'prod-1',
  sku: 'SKU-001',
  name: 'Kardus Produk A',
  lengthCm: 20, // <-- Panjang sisi kardus yang sejajar dengan arah tembak sensor ultrasonik
  widthCm: 15,
  heightCm: 15,
}
```
> **Penting**: Nilai `lengthCm` adalah dimensi aksial yang digunakan rumus pembagi:
> $$\text{Stok} = \text{round}\left(\frac{\text{Panjang Rak} - (d_{\text{kiri}} + d_{\text{kanan}})}{L_{\text{kardus}}}\right)$$

---

## 🔌 3. Format Data Telemetri ESP32 (MQTT Contract)

Ketika ESP32 Anda mengirim data secara real-time, kirimkan payload JSON ke topik MQTT:
**Topik**: `racks/RACK-001/telemetry`

**Format JSON**:
```json
{
  "rackId": "RACK-001",
  "timestamp": "2026-11-05T19:30:00Z",
  "env": {
    "temperatureC": 28.2,
    "humidityRh": 63,
    "gasPpm": 190
  },
  "rows": [
    {
      "rowId": "Row 01",
      "leftDistanceCm": 18.0,
      "rightDistanceCm": 0.0
    },
    {
      "rowId": "Row 02",
      "leftDistanceCm": 8.0,
      "rightDistanceCm": 0.0
    },
    {
      "rowId": "Row 03",
      "leftDistanceCm": 29.0,
      "rightDistanceCm": 29.0
    }
  ]
}
```

Backend akan otomatis memproses data di atas, menghitung stok, menyimpan ke riwayat, lalu mem-push perubahan ke dashboard melalui WebSocket (`telemetryUpdate`).

---

## 📂 4. Struktur Folder Bersih (Clean Architecture)

```
Dashboard IoT/
├── PANDUAN_KONFIGURASI.md      <-- Panduan arsitektur & parameter sistem
├── PANDUAN_KONFIGURASI_MQTT.md <-- [BARU] Panduan khusus setup MQTT & kode ESP32
├── DOKUMENTASI_PROJEK_SMART_RACK_IOT.md <-- Dokumentasi teknis lengkap
├── package.json                <-- Dependensi frontend (Vite, React, Tailwind)
├── .env.example                <-- Template environment frontend
│
├── src/                        <-- KODE UTAMA FRONTEND
│   ├── config/                 <-- [BARU] PUSAT KONFIGURASI TERPUSAT
│   │   ├── appConfig.ts        <-- Nilai default rak, sensor, ambang batas, URL
│   │   └── index.ts
│   ├── services/               <-- KOMUNIKASI API & WEBSOCKET
│   │   ├── iotApiService.ts    <-- REST API client ke backend
│   │   └── socketService.ts    <-- WebSocket real-time client
│   ├── utils/                  <-- LOGIKA MATEMATIS MURNI
│   │   └── stockCalculator.ts  <-- Rumus perhitungan stok kardus ultrasonik
│   ├── data/
│   │   └── initialData.ts      <-- Data dummy/fallback (mengambil dari appConfig)
│   ├── types/
│   │   └── index.ts            <-- Definisi TypeScript tipe data domain
│   ├── components/             <-- KOMPONEN TAMPILAN
│   │   ├── layout/             <-- Sidebar, Header, Simulator Drawer
│   │   ├── tutorial/           <-- Modal Panduan Pop-up Interaktif
│   │   └── ui/                 <-- StatusBadge, tombol, badge
│   ├── pages/                  <-- 6 HALAMAN UTAMA DASHBOARD
│   │   ├── OverviewPage.tsx         (Ringkasan inventaris & telemetri)
│   │   ├── RackMonitoringPage.tsx   (Tampilan visual 3D ambalan rak)
│   │   ├── ProductManagementPage.tsx(Manajemen SKU & ukuran kardus)
│   │   ├── InventoryHistoryPage.tsx (Riwayat mutasi keluar/masuk)
│   │   ├── SensorMonitoringPage.tsx (Status 8 sensor hardware)
│   │   └── SettingsPage.tsx         (Pengaturan sistem & kontrak API)
│   ├── App.tsx                 <-- Root Component pengelola state & navigasi
│   └── main.tsx                <-- Entry point React DOM
│
└── backend/                    <-- BACKEND NODE.JS + EXPRESS + MQTT
    ├── .env.example            <-- Template environment backend
    ├── src/
    │   ├── config/             <-- Konfigurasi backend & koneksi database SQLite
    │   ├── controllers/        <-- Handler REST API endpoint
    │   ├── services/
    │   │   ├── mqttService.ts  <-- Jembatan MQTT (subscribe ESP32, publish aktuator)
    │   │   └── socketService.ts<-- Socket.IO Server push ke frontend
    │   ├── utils/
    │   │   └── stockCalculator.ts <-- Logika kalkulasi stok di sisi server
    │   └── server.ts           <-- Entry point server backend
```

---

## 🚀 5. Cara Menjalankan

1. **Jalankan Frontend (Dashboard)**:
   ```bash
   npm run dev
   ```
   Buka di browser: `http://localhost:5173/`

2. **Jalankan Backend (Opsional saat integrasi)**:
   ```bash
   cd backend
   npm run dev
   ```
   Server aktif di: `http://localhost:3001`

