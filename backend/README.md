# SmarTrack WMS Backend
**Smart Small Rack Warehouse Monitoring System — IIoT Middleware**

Node.js + TypeScript backend yang menjembatani ESP32-WROOM-32D dengan React dashboard.

---

## Arsitektur Sistem

```
ESP32-WROOM-32D
  │  MQTT Publish
  ▼
Eclipse Mosquitto Broker (mqtt://192.168.10.50:1883)
  │  Topic: racks/+/telemetry
  ▼
┌──────────────────────────────────────────────────────┐
│          SMARTRACK WMS BACKEND (Node.js)              │
│                                                       │
│  mqttService.ts ──► stockCalculator.ts               │
│       │                    │                          │
│       │              Prisma ORM (SQLite)              │
│       │              InventoryLedger (auto audit)     │
│       │                                               │
│       └──► REST API (Express)                        │
│       └──► Socket.IO (telemetryUpdate event)         │
└──────────────────────────────────────────────────────┘
  │  MQTT Publish                │  WebSocket / HTTP
  ▼                              ▼
ESP32 Actuator             React Dashboard
(LED RGB + Buzzer)         (Frontend TSX)
```

---

## Prasyarat

- **Node.js** v18+ (diuji dengan v22)
- **npm** v9+
- **Eclipse Mosquitto** MQTT Broker berjalan di jaringan lokal
- **Windows / Linux / macOS**

---

## Instalasi & Setup

### 1. Clone / masuk ke folder backend

```bash
cd "Dashboard IoT/backend"
```

### 2. Install dependencies

```bash
npm install
```

### 3. Konfigurasi environment

Salin `.env.example` ke `.env` dan sesuaikan:

```bash
copy .env.example .env
```

Edit `.env`:

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173         # URL React frontend

DATABASE_URL="file:./dev.db"             # SQLite — tidak perlu server

MQTT_BROKER_URL=mqtt://192.168.10.50:1883  # IP broker Mosquitto Anda
MQTT_CLIENT_ID=smartrack-backend-01
MQTT_USERNAME=                           # kosongkan jika tanpa auth
MQTT_PASSWORD=

TEMP_DANGER_THRESHOLD_C=50.0
GAS_DANGER_THRESHOLD_PPM=600
GAS_WARNING_THRESHOLD_PPM=350
```

### 4. Setup database (generate + migrate + seed)

```bash
# Generate Prisma client
npx prisma generate

# Jalankan migrasi SQLite
npx prisma migrate dev --name init

# Seed data awal (rack, produk, sensor, riwayat ledger)
npx ts-node src/prisma/seed.ts
```

Atau jalankan sekaligus:

```bash
npm run setup
```

### 5. Jalankan server (development)

```bash
npm run dev
```

### 6. Jalankan server (production)

```bash
npm run build
npm start
```

---

## REST API Endpoints

Base URL: `http://localhost:3001/api/v1`

| Method | Endpoint | Keterangan |
|--------|----------|-----------|
| `GET` | `/health` | Health check + status MQTT |
| `GET` | `/racks/:rackId/overview` | Full snapshot rack (rows + env + aktuator) |
| `PATCH` | `/racks/:rackId/rows/:rowId` | Update konfigurasi baris |
| `GET` | `/products` | Daftar semua SKU terdaftar |
| `POST` | `/products` | Daftarkan SKU baru |
| `GET` | `/products/:sku` | Detail satu produk |
| `PUT` | `/products/:sku` | Update produk |
| `DELETE` | `/products/:sku` | Hapus produk |
| `GET` | `/inventory/history` | Riwayat ledger (paginasi + filter) |
| `GET` | `/sensors` | Status semua sensor |
| `GET` | `/sensors/alerts` | Alert gas/suhu dari snapshot |
| `POST` | `/sensors/:sensorId/calibrate` | Trigger kalibrasi sensor |
| `PATCH` | `/sensors/:sensorId` | Update status sensor |

### Contoh: GET /api/v1/racks/RACK-001/overview

```json
{
  "success": true,
  "data": {
    "rackId": "RACK-001",
    "location": "Warehouse A — Section 1",
    "rows": [
      {
        "rowId": "Row 01",
        "sku": "SKU-001",
        "estimatedStock": 5,
        "capacity": 8,
        "occupancyPct": 63,
        "status": "IN STOCK",
        "soundSpeedMs": 348.2,
        "leftDistanceCm": 20,
        "rightDistanceCm": 0
      }
    ],
    "environment": {
      "temperatureC": 27.5,
      "humidityRh": 65,
      "gasPpm": 185,
      "gasStatus": "Normal",
      "soundSpeedMs": 348.17
    },
    "actuatorState": {
      "ledState": "BLUE",
      "buzzerActive": false,
      "reason": "Rack partially occupied (9/24 boxes)"
    }
  }
}
```

### Contoh: GET /api/v1/inventory/history (dengan filter)

```
GET /api/v1/inventory/history?rowId=Row 01&eventType=Stock In&page=1&pageSize=10
```

---

## WebSocket (Socket.IO)

Frontend connect ke: `ws://localhost:3001`

### Event yang diterima frontend

| Event | Trigger | Payload |
|-------|---------|---------|
| `telemetryUpdate` | Setiap MQTT telemetry baru dari ESP32 | `TelemetryUpdateEvent` |
| `mqttStatus` | Saat client connect / request manual | `{ connected, brokerUrl }` |

### Contoh frontend (React + socket.io-client)

```ts
import { io } from 'socket.io-client';
import type { TelemetryUpdateEvent } from './types';

const socket = io('http://localhost:3001', { transports: ['websocket'] });

socket.on('telemetryUpdate', (event: TelemetryUpdateEvent) => {
  // Update React state dengan data real-time
  setRows(event.rows);
  setEnvData(event.environment);
  setActuatorState(event.actuatorState);
});
```

---

## Format Payload MQTT dari ESP32

**Topic:** `racks/{rackId}/telemetry`

```json
{
  "rackId": "RACK-001",
  "timestamp": "2026-11-04T14:30:00.000Z",
  "rows": [
    {
      "rowId": "Row 01",
      "leftSensorId": "US-01",
      "rightSensorId": "US-02",
      "leftDistanceCm": 20.3,
      "rightDistanceCm": 0.0,
      "rssi": -54
    },
    {
      "rowId": "Row 02",
      "leftSensorId": "US-03",
      "rightSensorId": "US-04",
      "leftDistanceCm": 25.1,
      "rightDistanceCm": 0.0
    },
    {
      "rowId": "Row 03",
      "leftSensorId": "US-05",
      "rightSensorId": "US-06",
      "leftDistanceCm": 100.0,
      "rightDistanceCm": 100.0
    }
  ],
  "environment": {
    "temperatureC": 27.5,
    "humidityRh": 65.2,
    "gasPpm": 185,
    "gasSensorId": "GAS-01",
    "envSensorId": "ENV-01"
  }
}
```

**Aktuator yang dikirim balik ke ESP32:**

**Topic:** `racks/{rackId}/actuators`

```json
{
  "rackId": "RACK-001",
  "ledState": "BLUE",
  "buzzerActive": false,
  "reason": "Rack partially occupied (9/24 boxes)",
  "issuedAt": "2026-11-04T14:30:00.123Z"
}
```

---

## Logika Aktuator LED RGB

| Kondisi | LED State | Buzzer |
|---------|-----------|--------|
| Suhu ≥ 50°C **ATAU** Gas ≥ 600 ppm | `BLINK_RED` | ✅ ON |
| Semua baris kosong (0 kardus) | `RED` | ❌ OFF |
| Semua baris penuh kapasitas | `GREEN` | ❌ OFF |
| Terisi sebagian | `BLUE` | ❌ OFF |

> **Catatan:** MQ2 mendeteksi gas/asap (LPG, CO, methane, smoke). SHT31 membaca suhu ambient.  
> Backend **tidak** mengklaim MQ2 mendeteksi api secara langsung.

---

## Rumus Kalkulasi Stok

```
v_suara = 331.3 + (0.606 × T_celsius)          [m/s — kompensasi SHT31]

totalEmpty    = d_kiri + d_kanan                 [cm]
occupiedSpan  = max(0, rowSpan - totalEmpty)     [cm]
estimatedStock = min(kapasitas, round(occupiedSpan / L_box))
occupancyPct  = round((estimatedStock / kapasitas) × 100)
```

**Status:**
- `0` box → `EMPTY`
- `≤ 2` box → `LOW STOCK`
- `≥ kapasitas` → `FULL CAPACITY`
- Sensor offline → `SENSOR FAULT`
- Lainnya → `IN STOCK`

---

## Struktur Folder

```
backend/
├── prisma/
│   └── schema.prisma         # Skema SQLite
├── src/
│   ├── config/
│   │   ├── index.ts          # Env config loader
│   │   └── database.ts       # Prisma singleton
│   ├── controllers/
│   │   ├── rackController.ts
│   │   ├── productController.ts
│   │   ├── inventoryController.ts
│   │   └── sensorController.ts
│   ├── middleware/
│   │   └── errorHandler.ts
│   ├── prisma/
│   │   └── seed.ts           # Data awal database
│   ├── routes/
│   │   └── index.ts          # API router
│   ├── services/
│   │   └── mqttService.ts    # Jantung sistem — MQTT bridge
│   ├── types/
│   │   └── index.ts          # Domain types (TypeScript)
│   ├── utils/
│   │   ├── stockCalculator.ts # Rumus stok + aktuator
│   │   └── helpers.ts
│   └── server.ts             # Entry point
├── .env                      # (tidak di-commit)
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| MQTT tidak connect | Pastikan Mosquitto berjalan dan `MQTT_BROKER_URL` benar di `.env` |
| `prisma generate` error | Jalankan `npx prisma generate` lagi setelah `npm install` |
| Port 3001 sudah dipakai | Ubah `PORT` di `.env` |
| SQLite `ENOENT` | Pastikan path `DATABASE_URL` valid, folder `backend/` writable |
| CORS error dari frontend | Sesuaikan `CORS_ORIGIN` di `.env` dengan URL React dev server |

