# 📡 PANDUAN KONFIGURASI MQTT
## Smart Rack IoT — ESP32 ↔ Broker Mosquitto ↔ Backend ↔ Dashboard

> **Tujuan Dokumen:**
> Panduan praktis langkah demi langkah untuk mengonfigurasi komunikasi data MQTT 
> antara mikrokontroler ESP32, broker MQTT (Mosquitto), backend Express.js, hingga 
> tampil secara real-time pada dashboard web.

---

## 🗺️ Gambaran Alur Komunikasi Data

```
[ Sensor Fisik (DHT11, 6x HC-SR04, MQ-2) ]
                   │
                   ▼ (1-Wire GPIO04, Trigger/Echo Pulses, ADC GPIO34)
            [ ESP32-WROOM-32D ]
                   │
                   ▼ MQTT PUBLISH (Topik: racks/RACK-001/telemetry)
         [ Broker MQTT (Mosquitto) ]
                   │
                   ▼ MQTT SUBSCRIBE (Pola: racks/+/telemetry)
        [ Backend Express.js (Node.js) ]
         ├── 1. Validasi struktur JSON Payload
         ├── 2. Kompensasi suhu kecepatan suara (DHT11)
         ├── 3. Kalkulasi stok kardus per baris rak
         ├── 4. Simpan ke database jika ada mutasi stok (Stock In/Out)
         ├── 5. Evaluasi ambang batas bahaya (Suhu / Gas)
         ├── 6. Publish balik perintah aktuator (Topik: racks/RACK-001/actuators)
         └── 7. Emit WebSocket 'telemetryUpdate' ke client browser
                   │
                   ▼ Socket.IO Push
          [ Dashboard React (Web) ]
```

---

## ⚡ 1. Tiga File yang Perlu Dikonfigurasi

Untuk menghubungkan seluruh sistem, Anda hanya perlu memperhatikan 3 file berikut:

| No | Komponen / File | Yang Perlu Diatur | Keterangan |
| :--- | :--- | :--- | :--- |
| **1** | `backend/.env` | `MQTT_BROKER_URL` | Alamat IP komputer/server yang menjalankan broker MQTT. |
| **2** | Kode Arduino ESP32 (`sketch.ino`) | SSID Wi-Fi, Password, & IP Broker | Program di ESP32 yang membaca sensor dan mengirim JSON. |
| **3** | `mosquitto.conf` (Jika pakai PC lokal) | `listener 1883`, `allow_anonymous true` | Mengizinkan ESP32 dan backend terhubung ke broker. |

---

## 💻 2. Mengetahui IP Komputer Anda (Sebagai Broker)

Karena ESP32 dan Backend berkomunikasi melalui Wi-Fi lokal, mereka harus tahu IP komputer tempat Mosquitto berjalan.

1. Buka **Command Prompt (CMD)** atau **PowerShell** di Windows.
2. Ketik perintah:
   ```cmd
   ipconfig
   ```
3. Cari bagian **Wireless LAN adapter Wi-Fi** (atau Ethernet jika pakai kabel LAN).
4. Catat bagian **IPv4 Address**, misalnya:
   ```
   IPv4 Address. . . . . . . . . . . : 192.168.1.105
   ```
> 💡 Gunakan IP ini (misalnya `192.168.1.105`) untuk konfigurasi di `backend/.env` dan kode ESP32.

---

## 🔧 3. Konfigurasi Backend (`backend/.env`)

Buka file `backend/.env` pada folder proyek Anda (jika belum ada, salin dari `backend/.env.example`).
Pastikan variabel MQTT diisi sesuai IP broker Anda:

```env
# ==============================================================================
# PENGATURAN BROKER MQTT
# ==============================================================================

# URL Broker: sesuaikan IP dengan komputer Anda, port standar adalah 1883
MQTT_BROKER_URL=mqtt://192.168.1.105:1883

# ID unik koneksi client backend ke broker
MQTT_CLIENT_ID=smartrack-backend-01

# Kosongkan jika broker tidak menggunakan username & password
MQTT_USERNAME=
MQTT_PASSWORD=

# Periode coba ulang koneksi jika broker sempat terputus (dalam milidetik)
MQTT_RECONNECT_PERIOD_MS=5000

# Detak sinyal keepalive (dalam detik)
MQTT_KEEPALIVE_SECS=60
```

---

## 📋 4. Topik MQTT yang Digunakan Sistem

Sistem menggunakan 2 topik utama yang sudah otomatis tertanam pada backend:

| Topik | Arah Aliran Data | Pengirim (*Publisher*) | Penerima (*Subscriber*) | Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| `racks/RACK-001/telemetry` | **Masuk ke Backend** | ESP32 | Backend Node.js | Mengirimkan data sensor suhu DHT11, gas MQ-2, dan jarak 6 ultrasonik. |
| `racks/RACK-001/actuators` | **Keluar dari Backend** | Backend Node.js | ESP32 | Mengirimkan status 3 RGB LED per baris (`row1`, `row2`, `row3`), status `emergency`, dan aktivasi Buzzer. |

> 📌 **Catatan Backend:** Backend men-subscribe topik dengan pola wildcard `racks/+/telemetry`. Jadi jika Anda menambah rak kedua (`RACK-002`), backend langsung bisa membacanya tanpa ubah kodingan backend!

---

## 📦 5. Format Standar JSON Payload (ESP32 → Backend)

ESP32 wajib mem-publish pesan dengan format JSON yang terstruktur persis seperti ini:

```json
{
  "rackId": "RACK-001",
  "timestamp": "2026-11-06T10:00:00Z",
  "environment": {
    "temperatureC": 27.5,
    "humidityRh": 65.0,
    "gasPpm": 185
  },
  "rows": [
    {
      "rowId": "Row 01",
      "leftSensorId": "US-01",
      "rightSensorId": "US-02",
      "leftDistanceCm": 18.0,
      "rightDistanceCm": 0.0
    },
    {
      "rowId": "Row 02",
      "leftSensorId": "US-03",
      "rightSensorId": "US-04",
      "leftDistanceCm": 8.0,
      "rightDistanceCm": 0.0
    },
    {
      "rowId": "Row 03",
      "leftSensorId": "US-05",
      "rightSensorId": "US-06",
      "leftDistanceCm": 29.0,
      "rightDistanceCm": 29.0
    }
  ]
}
```

### ⚠️ Validasi Penting pada Backend:
* `rackId`: String, harus cocok dengan ID rak (misal `"RACK-001"`).
* `environment.temperatureC`: Nilai float suhu dari **DHT11**.
* `environment.humidityRh`: Nilai float kelembapan dari **DHT11**.
* `environment.gasPpm`: Nilai integer kadar gas dari **MQ-2**.
* `rows`: Array berisikan objek tiap baris dengan key `rowId`, `leftDistanceCm`, dan `rightDistanceCm`.

---

## 🤖 6. Contoh Lengkap Program ESP32 (Arduino IDE)

Berikut template kode C++ lengkap untuk ESP32 yang menggunakan library `WiFi.h`, `PubSubClient.h`, `DHT.h`, dan `ArduinoJson.h`:

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ============================================================================
// 1. KONFIGURASI JARINGAN & BROKER MQTT
// ============================================================================
const char* WIFI_SSID       = "NAMA_WIFI_ANDA";
const char* WIFI_PASSWORD   = "PASSWORD_WIFI_ANDA";
const char* MQTT_BROKER_IP  = "192.168.1.105"; // Ganti dengan IP komputer Anda
const int   MQTT_PORT       = 1883;
const char* MQTT_CLIENT_ID  = "ESP32_SmartRack_RACK001";

const char* TOPIC_TELEMETRY = "racks/RACK-001/telemetry";
const char* TOPIC_ACTUATORS = "racks/RACK-001/actuators";

// ============================================================================
// 2. PEMETAAN PIN HARDWARE (DHT11, SHARED TRIG ULTRASONIK, MQ-2, 3x RGB, BUZZER)
// ============================================================================
// Sensor Suhu & Kelembapan DHT11 (1-Wire Digital)
#define PIN_DHT          4
#define DHTTYPE          DHT11

// Sensor Gas MQ-2
#define PIN_MQ2_ANALOG   36   // ADC1_CH0 (GPIO 36 / VP)

// Shared Trigger Pin untuk seluruh 6 Sensor Ultrasonik
#define PIN_SHARED_TRIG  27

// Echo Pin Lantai 1 (Row 01)
#define PIN_ECHO_ROW1_LEFT   35  // US-01
#define PIN_ECHO_ROW1_RIGHT  34  // US-02

// Echo Pin Lantai 2 (Row 02)
#define PIN_ECHO_ROW2_LEFT   33  // US-03
#define PIN_ECHO_ROW2_RIGHT  32  // US-04

// Echo Pin Lantai 3 (Row 03)
#define PIN_ECHO_ROW3_LEFT   26  // US-05
#define PIN_ECHO_ROW3_RIGHT  25  // US-06

// RGB LED Lantai 1 (Row 01)
#define PIN_LED_R1_R     23
#define PIN_LED_R1_G     22
#define PIN_LED_R1_B     21

// RGB LED Lantai 2 (Row 02)
#define PIN_LED_R2_R     19
#define PIN_LED_R2_G     18
#define PIN_LED_R2_B     5

// RGB LED Lantai 3 (Row 03)
#define PIN_LED_R3_R     17
#define PIN_LED_R3_G     16
#define PIN_LED_R3_B     14

// Buzzer Alarm
#define PIN_BUZZER       13

// ============================================================================
// 3. OBJEK & VARIABEL GLOBAL
// ============================================================================
WiFiClient espClient;
PubSubClient mqttClient(espClient);
DHT dht(PIN_DHT, DHTTYPE);

unsigned long previousPublishTime = 0;
const unsigned long PUBLISH_INTERVAL = 2000; // Kirim data setiap 2 detik

// State Lampu per Lantai & Buzzer dari Backend
String stateRow1 = "RED";
String stateRow2 = "RED";
String stateRow3 = "RED";
bool isBuzzerActive = false;
bool isEmergency = false;

// ============================================================================
// 4. FUNGSI PENGUKURAN JARAK ULTRASONIK (SHARED TRIG)
// ============================================================================
// Karena pin TRIG dishare ke seluruh sensor, pulsa dikirimkan ke pin 27,
// lalu pembacaan pulseIn hanya dilakukan pada pin ECHO sensor yang diuji.
// Berikan jeda singkat (delay) antar pembacaan sensor agar gelombang suara mereda.
float readUltrasonicDistance(int echoPin, float tempC) {
  digitalWrite(PIN_SHARED_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_SHARED_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_SHARED_TRIG, LOW);

  long durationUs = pulseIn(echoPin, HIGH, 30000); // timeout 30ms (~5 meter)
  if (durationUs <= 0) {
    return 58.0; // Jika tidak ada pantulan, anggap ruang kosong maksimal
  }

  // Kompensasi kecepatan suara berdasarkan suhu udara DHT11 (m/s)
  float soundSpeed = 331.3 + (0.606 * tempC); 
  // Jarak (cm) = (waktu (detik) * kecepatan (cm/detik)) / 2
  float distanceCm = (durationUs / 1000000.0 * (soundSpeed * 100.0)) / 2.0;

  if (distanceCm > 150.0) distanceCm = 58.0; // Filter pembacaan di luar batas rak
  delay(20); // Jeda pemulihan agar tidak ada interferensi gema akustik
  return distanceCm;
}

// ============================================================================
// 5. PENANGANAN OUTPUT 3 RGB LED & BUZZER
// ============================================================================
void setLedColor(int rPin, int gPin, int bPin, String color, bool blink) {
  // Matikan LED terlebih dahulu (Common Cathode: LOW = Mati)
  digitalWrite(rPin, LOW);
  digitalWrite(gPin, LOW);
  digitalWrite(bPin, LOW);

  if (blink) {
    static bool blinkToggle = false;
    blinkToggle = !blinkToggle;
    digitalWrite(rPin, blinkToggle ? HIGH : LOW);
    return;
  }

  if (color == "RED") {
    digitalWrite(rPin, HIGH);
  } else if (color == "GREEN") {
    digitalWrite(gPin, HIGH);
  } else if (color == "BLUE") {
    digitalWrite(bPin, HIGH);
  }
}

void applyActuatorOutputs() {
  bool blink = isEmergency;
  setLedColor(PIN_LED_R1_R, PIN_LED_R1_G, PIN_LED_R1_B, stateRow1, blink);
  setLedColor(PIN_LED_R2_R, PIN_LED_R2_G, PIN_LED_R2_B, stateRow2, blink);
  setLedColor(PIN_LED_R3_R, PIN_LED_R3_G, PIN_LED_R3_B, stateRow3, blink);

  digitalWrite(PIN_BUZZER, isBuzzerActive ? HIGH : LOW);
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("[MQTT Masuk] Topik: ");
  Serial.println(topic);
  Serial.println(message);

  // Parsing JSON perintah aktuator 3-Row
  StaticJsonDocument<384> doc;
  DeserializationError error = deserializeJson(doc, message);
  if (!error) {
    isBuzzerActive = doc["buzzerActive"] | false;
    isEmergency = doc["emergency"] | false;

    if (doc.containsKey("ledStates")) {
      JsonObject ledStates = doc["ledStates"];
      stateRow1 = ledStates["row1"] | "RED";
      stateRow2 = ledStates["row2"] | "RED";
      stateRow3 = ledStates["row3"] | "RED";
    }

    applyActuatorOutputs();
  }
}

// ============================================================================
// 6. SETUP & KONEKSI
// ============================================================================
void connectWiFi() {
  Serial.print("Menghubungkan ke Wi-Fi ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✓ Wi-Fi Terhubung!");
  Serial.print("IP ESP32: ");
  Serial.println(WiFi.localIP());
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Menghubungkan ke Broker MQTT...");
    if (mqttClient.connect(MQTT_CLIENT_ID)) {
      Serial.println(" Berhasil!");
      // Subscribe ke topik perintah aktuator
      mqttClient.subscribe(TOPIC_ACTUATORS);
      Serial.print("✓ Subscribed ke: ");
      Serial.println(TOPIC_ACTUATORS);
    } else {
      Serial.print(" Gagal, kode error: ");
      Serial.print(mqttClient.state());
      Serial.println(". Coba lagi dalam 3 detik...");
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();

  // Pin Shared Trigger (Output)
  pinMode(PIN_SHARED_TRIG, OUTPUT);
  digitalWrite(PIN_SHARED_TRIG, LOW);

  // Pin Echo Sensor Ultrasonik (Input)
  pinMode(PIN_ECHO_ROW1_LEFT, INPUT);
  pinMode(PIN_ECHO_ROW1_RIGHT, INPUT);
  pinMode(PIN_ECHO_ROW2_LEFT, INPUT);
  pinMode(PIN_ECHO_ROW2_RIGHT, INPUT);
  pinMode(PIN_ECHO_ROW3_LEFT, INPUT);
  pinMode(PIN_ECHO_ROW3_RIGHT, INPUT);

  // Pin RGB LED Lantai 1, 2, 3 (Output)
  pinMode(PIN_LED_R1_R, OUTPUT); pinMode(PIN_LED_R1_G, OUTPUT); pinMode(PIN_LED_R1_B, OUTPUT);
  pinMode(PIN_LED_R2_R, OUTPUT); pinMode(PIN_LED_R2_G, OUTPUT); pinMode(PIN_LED_R2_B, OUTPUT);
  pinMode(PIN_LED_R3_R, OUTPUT); pinMode(PIN_LED_R3_G, OUTPUT); pinMode(PIN_LED_R3_B, OUTPUT);

  // Pin Buzzer (Output)
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  connectWiFi();
  mqttClient.setServer(MQTT_BROKER_IP, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
}

// ============================================================================
// 7. LOOP UTAMA
// ============================================================================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  // Handle kedip LED jika kondisi darurat aktif
  if (isEmergency) {
    static unsigned long lastBlinkMs = 0;
    if (millis() - lastBlinkMs >= 300) {
      lastBlinkMs = millis();
      applyActuatorOutputs();
    }
  }

  unsigned long currentMillis = millis();
  if (currentMillis - previousPublishTime >= PUBLISH_INTERVAL) {
    previousPublishTime = currentMillis;

    // 1. Baca sensor suhu & kelembapan DHT11
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    if (isnan(temperature)) temperature = 27.0; // Nilai fallback jika sensor belum siap
    if (isnan(humidity)) humidity = 60.0;

    // 2. Baca sensor gas MQ-2
    int rawGas = analogRead(PIN_MQ2_ANALOG);
    int gasPpm = map(rawGas, 0, 4095, 50, 1000);

    // 3. Baca 6 sensor ultrasonik (TRIG bersama pada GPIO 27)
    float d1Left  = readUltrasonicDistance(PIN_ECHO_ROW1_LEFT, temperature);
    float d1Right = readUltrasonicDistance(PIN_ECHO_ROW1_RIGHT, temperature);

    float d2Left  = readUltrasonicDistance(PIN_ECHO_ROW2_LEFT, temperature);
    float d2Right = readUltrasonicDistance(PIN_ECHO_ROW2_RIGHT, temperature);

    float d3Left  = readUltrasonicDistance(PIN_ECHO_ROW3_LEFT, temperature);
    float d3Right = readUltrasonicDistance(PIN_ECHO_ROW3_RIGHT, temperature);

    // 4. Susun dokumen JSON Telemetri
    StaticJsonDocument<768> doc;
    doc["rackId"] = "RACK-001";
    doc["timestamp"] = "2026-11-06T12:00:00Z";

    JsonObject env = doc.createNestedObject("environment");
    env["temperatureC"] = temperature;
    env["humidityRh"]   = humidity;
    env["gasPpm"]       = gasPpm;

    JsonArray rows = doc.createNestedArray("rows");

    JsonObject row1 = rows.createNestedObject();
    row1["rowId"]          = "Row 01";
    row1["leftSensorId"]   = "US-01";
    row1["rightSensorId"]  = "US-02";
    row1["leftDistanceCm"] = d1Left;
    row1["rightDistanceCm"]= d1Right;

    JsonObject row2 = rows.createNestedObject();
    row2["rowId"]          = "Row 02";
    row2["leftSensorId"]   = "US-03";
    row2["rightSensorId"]  = "US-04";
    row2["leftDistanceCm"] = d2Left;
    row2["rightDistanceCm"]= d2Right;

    JsonObject row3 = rows.createNestedObject();
    row3["rowId"]          = "Row 03";
    row3["leftSensorId"]   = "US-05";
    row3["rightSensorId"]  = "US-06";
    row3["leftDistanceCm"] = d3Left;
    row3["rightDistanceCm"]= d3Right;

    // 5. Kirim via MQTT
    char jsonBuffer[768];
    serializeJson(doc, jsonBuffer);
    mqttClient.publish(TOPIC_TELEMETRY, jsonBuffer);

    Serial.println("[MQTT Terkirim] Data telemetri berhasil di-publish.");
  }
}
```

---

## 🛠️ 7. Menjalankan Broker Mosquitto di Komputer Lokal

Jika Anda menjalankan Mosquitto di komputer Windows/Linux sendiri:

### 1. Buat atau periksa file konfigurasi `mosquitto.conf`:
```conf
# Izinkan koneksi dari IP luar pada port 1883
listener 1883 0.0.0.0

# Izinkan tanpa login password (sangat disarankan saat tahap pengujian lokal)
allow_anonymous true
```

### 2. Jalankan Mosquitto:
* **Di Windows (CMD):**
  ```cmd
  "C:\Program Files\mosquitto\mosquitto.exe" -c "C:\Program Files\mosquitto\mosquitto.conf" -v
  ```
* **Di Linux / WSL:**
  ```bash
  mosquitto -c /etc/mosquitto/mosquitto.conf -v
  ```
  *(Parameter `-v` untuk mode verbose, menampilkan log setiap ada data masuk/keluar)*.

---

## 🧪 8. Uji Coba MQTT Tanpa ESP32 (Menggunakan Terminal)

Anda bisa menguji apakah alur MQTT → Backend → Dashboard sudah berhasil tanpa menyalakan ESP32 fisik dengan alat bawaan Mosquitto:

### A. Dengarkan pesan yang beredar (Subscribe):
```cmd
mosquitto_sub -h 127.0.0.1 -t "racks/#" -v
```

### B. Kirim data tiruan (Publish):
Buka terminal baru dan kirim data simulasi satu baris perintah:
```cmd
mosquitto_pub -h 127.0.0.1 -t "racks/RACK-001/telemetry" -m "{\"rackId\":\"RACK-001\",\"environment\":{\"temperatureC\":27.5,\"humidityRh\":65,\"gasPpm\":185},\"rows\":[{\"rowId\":\"Row 01\",\"leftDistanceCm\":18,\"rightDistanceCm\":0},{\"rowId\":\"Row 02\",\"leftDistanceCm\":8,\"rightDistanceCm\":0},{\"rowId\":\"Row 03\",\"leftDistanceCm\":29,\"rightDistanceCm\":29}]}"
```

Hasil yang akan terlihat:
1. Terminal backend akan mencetak:
   ```
   [MQTT] Processed telemetry for RACK-001
   [Ledger] ✓ Stock In recorded ...
   [Socket.IO] ◀▶ telemetryUpdate emitted
   ```
2. Terminal subscriber akan menerima balasan aktuator ke topik `racks/RACK-001/actuators`.
3. Tampilan angka kardus di browser dashboard langsung berubah otomatis!

---

## 🚨 9. Solusi Masalah Umum (Troubleshooting)

| Gejala Error | Kemungkinan Penyebab | Solusi |
| :--- | :--- | :--- |
| **`[MQTT] Connection error: connect ECONNREFUSED`** | Broker Mosquitto belum aktif atau IP salah. | Pastikan Mosquitto aktif di background dan IP di `backend/.env` tepat. |
| **ESP32 terus menerus `rc=-2` saat connect** | ESP32 tidak bisa menjangkau IP broker. | Pastikan ESP32 dan Laptop/PC terhubung ke **Wi-Fi yang sama**. Cek apakah Windows Firewall memblokir port 1883. |
| **`[MQTT] Malformed telemetry payload on topic ... skipping`** | Format JSON dari ESP32 ada key yang typo atau tipe data tidak valid. | Samakan nama key persis seperti contoh bab 5 (`temperatureC`, `humidityRh`, `gasPpm`, `leftDistanceCm`). |
| **Dashboard tidak merespons perubahan jarak** | ESP32 mengirim jarak dengan satuan selain `cm` atau nilai string. | Pastikan nilai jarak dikirim berupa angka desimal (*float/number*), bukan teks berkutip. |
| **Suhu DHT11 terbaca 0 atau NaN** | Kabel pin data salah atau longgar. | Pastikan kabel data terhubung ke GPIO04 (Pin 4 ESP32) dan tambahkan resistor pull-up 10kΩ antara VCC dan DATA bila modul belum memilikinya. |

---

## 📌 Checklist Terakhir Sebelum Demo:
- [ ] IP Komputer sudah dicek via `ipconfig`.
- [ ] `backend/.env` sudah diisi `MQTT_BROKER_URL=mqtt://<IP_ANDA>:1883`.
- [ ] Mosquitto sudah running dengan parameter `allow_anonymous true`.
- [ ] Backend sudah dijalankan (`npm run dev` di folder `backend`).
- [ ] ESP32 sudah di-flash dan Serial Monitor menampilkan pesan `[MQTT Terkirim]`.
- [ ] Web Dashboard dibuka di browser dan indikator sensor menyala hijau (online).

