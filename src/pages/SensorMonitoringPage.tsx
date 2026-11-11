import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  WifiOff,
  Activity,
  Cpu,
  Flame,
  Thermometer,
  Droplets,
  Volume2,
  VolumeX,
  RotateCcw
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { Sensor, EnrichedRow, EnvData, GasAlert, EnvHistoryPoint, TelemetryPayload, BuzzerCommand } from '../types';
import StatusBadge from '../components/ui/StatusBadge';
import { IoTApiService } from '../services/iotApiService';

interface SensorMonitoringPageProps {
  sensors: Sensor[];
  enrichedRows: EnrichedRow[];
  envData: EnvData;
  setEnvData: React.Dispatch<React.SetStateAction<EnvData>>;
  gasStatus: string;
  gasAlerts: GasAlert[];
  setGasAlerts: React.Dispatch<React.SetStateAction<GasAlert[]>>;
  envHistory: EnvHistoryPoint[];
  onToggleSensor: (sensorId: string) => void;
  triggerToast: (msg: string, type?: 'info' | 'danger') => void;
  telemetryPayload?: TelemetryPayload;
}

export const SensorMonitoringPage: React.FC<SensorMonitoringPageProps> = ({
  sensors,
  enrichedRows,
  envData,
  setEnvData,
  gasStatus,
  gasAlerts,
  setGasAlerts,
  envHistory,
  onToggleSensor,
  triggerToast,
  telemetryPayload
}) => {
  // Helper to get current reading string for each sensor
  const getSensorReadingDisplay = (sensor: Sensor) => {
    if (!sensor.online) return 'TIDAK ADA SINYAL';
    if (sensor.type === 'ULTRASONIC') {
      const match = sensor.rowId.match(/\d+/);
      const floorNum = match ? parseInt(match[0], 10) : 1;
      const floorData = telemetryPayload?.floors?.find((f) => f.floor === floorNum);

      if (floorData) {
        const isLeft =
          sensor.id === 'US-01' ||
          sensor.id === 'US-03' ||
          sensor.id === 'US-05' ||
          sensor.position.includes('Left') ||
          sensor.position.includes('Kiri');
        const dist = isLeft ? floorData.distance_left_cm : floorData.distance_right_cm;
        return `${dist.toFixed(1)} cm`;
      }

      const row = enrichedRows.find((r) => r.rowId === sensor.rowId);
      if (!row) return '0 cm';
      const dist =
        sensor.position.includes('Left') || sensor.position.includes('Kiri')
          ? row.leftDistanceCm
          : row.rightDistanceCm;
      return `${dist.toFixed(1)} cm`;
    }
    if (sensor.type === 'GAS') {
      const gasRaw = telemetryPayload?.environment?.gas_raw ?? envData.gasPpm;
      const gasPct = telemetryPayload?.environment?.gas_pct;
      return `${gasRaw} ADC ${gasPct !== undefined ? `(${gasPct}%)` : ''}`;
    }
    if (sensor.type === 'ENV') {
      const t = (telemetryPayload?.environment?.temperature_c ?? envData.temperatureC).toFixed(1);
      const h = (telemetryPayload?.environment?.humidity_pct ?? envData.humidityRh).toFixed(0);
      return `${t} °C / ${h}% RH (DHT11)`;
    }
    return 'OK';
  };

  const connectedSensors = sensors.filter((s) => s.online);
  const disconnectedSensors = sensors.filter((s) => !s.online);

  const handleLogGasTestAlert = () => {
    const newAlert: GasAlert = {
      id: `GA-0${gasAlerts.length + 1}`,
      timestamp: '2026-11-03 16:36:10',
      readingPpm: envData.gasPpm,
      status: gasStatus as 'Normal' | 'Warning' | 'Danger',
      message: `Diagnostik ambang batas manual tercatat pada ${envData.gasPpm} ppm.`
    };
    setGasAlerts([newAlert, ...gasAlerts]);
    triggerToast('Snapshot status sensor gas berhasil dicatat ke riwayat.');
  };

  return (
    <div className="space-y-6">
      {/* SEPARATE DISCONNECTED / FAULTY SENSORS PANEL */}
      <div className="bg-white border border-[#E3E7E5] rounded-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-[#F5F6F4] border-b border-[#E3E7E5] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert
              className={`w-4 h-4 ${
                disconnectedSensors.length > 0 ? 'text-[#C85C54]' : 'text-[#66856A]'
              }`}
            />
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-[#263238]">
              Sensor Terputus / Gangguan Sinyal ({disconnectedSensors.length})
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#77827D]">
            Klik "Simulasi Putus" untuk menguji isolasi kendala sensor
          </span>
        </div>

        {disconnectedSensors.length === 0 ? (
          <div className="p-4 text-xs font-mono text-[#4A644E] bg-[#66856A]/5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#66856A] shrink-0" />
              <span>
                Seluruh 8 kanal sensor fisik (US-01..US-06, GAS-01, ENV-01) terhubung normal ke ESP32.
              </span>
            </div>
            <button
              onClick={() => onToggleSensor('US-06')}
              className="px-2.5 py-1 bg-white border border-[#E3E7E5] text-[#263238] hover:border-[#C85C54] rounded-sm text-xs font-semibold"
            >
              Simulasi Putus US-06
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E3E7E5]">
            {disconnectedSensors.map((s) => (
              <div
                key={s.id}
                className="p-4 bg-[#C85C54]/5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <WifiOff className="w-4 h-4 text-[#C85C54] shrink-0" />
                  <div>
                    <div className="font-bold text-[#9E3831]">
                      {s.id} — {s.name} ({s.rowId})
                    </div>
                    <div className="text-[11px] text-[#77827D] break-words">
                      Pinout ESP32: {s.gpio} • Pembacaan Terakhir: {s.lastSeen}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status="OFFLINE" />
                  <button
                    onClick={() => onToggleSensor(s.id)}
                    className="px-3 py-1 bg-[#1C100C] text-orange-200 border border-orange-900/40 hover:bg-[#2E180E] rounded-sm font-semibold transition-colors"
                  >
                    Sambungkan Kembali
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONNECTED SENSORS CONTAINER */}
      <div className="bg-white border border-[#E3E7E5] rounded-sm overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-[#E3E7E5] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold font-mono uppercase text-[#1C100C]">
              Sensor Aktif Terhubung ({connectedSensors.length} Online)
            </h2>
            <p className="text-xs text-[#77827D] mt-0.5">
              Transduser jarak ultrasonik (US-01 s/d US-06) dan modul lingkungan yang terhubung ke bus ESP32.
            </p>
          </div>
        </div>

        {/* MOBILE VIEW: Stacked Sensor Cards (Downwards flow, no horizontal scroll) */}
        <div className="md:hidden divide-y divide-[#E3E7E5]">
          {connectedSensors.map((s) => (
            <div key={s.id} className="p-4 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="font-bold text-orange-700">{s.id} — {s.name}</span>
                <StatusBadge status="ONLINE" />
              </div>
              <div className="flex items-center justify-between text-[#77827D]">
                <span>Lokasi: {s.rowId} ({s.position})</span>
                <strong className="text-[#1C100C] text-sm tabular-nums">
                  {getSensorReadingDisplay(s)}
                </strong>
              </div>
              <div className="p-2 bg-[#F5F6F4] rounded-sm text-[11px] text-[#77827D] break-words">
                Pinout: {s.gpio} • Terakhir dilihat: {s.lastSeen}
              </div>
              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => onToggleSensor(s.id)}
                  className="px-2.5 py-1 text-xs bg-white border border-[#E3E7E5] hover:border-[#C85C54] hover:text-[#C85C54] rounded-sm"
                >
                  Simulasi Putus
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP VIEW: Full Table with Word Wrapping */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F6F4] border-b border-[#E3E7E5] text-[11px] font-mono uppercase text-[#77827D]">
                <th className="py-2.5 px-4">ID Sensor</th>
                <th className="py-2.5 px-4">Nama &amp; Pemasangan</th>
                <th className="py-2.5 px-4">Baris / Zona</th>
                <th className="py-2.5 px-4">Jalur Pin ESP32</th>
                <th className="py-2.5 px-4">Nilai Telemetri</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Terakhir Terlihat</th>
                <th className="py-2.5 px-4 text-right">Aksi Uji Coba</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E7E5] text-xs font-mono">
              {connectedSensors.map((s) => (
                <tr key={s.id} className="hover:bg-[#F5F6F4]/60">
                  <td className="py-3 px-4 font-bold text-orange-700 whitespace-nowrap">{s.id}</td>
                  <td className="py-3 px-4 font-sans font-medium text-[#1C100C] whitespace-nowrap">{s.name}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{s.rowId} ({s.position})</td>
                  <td className="py-3 px-4 text-[#77827D] max-w-xs break-words">{s.gpio}</td>
                  <td className="py-3 px-4 font-bold text-[#1C100C] tabular-nums whitespace-nowrap">
                    {getSensorReadingDisplay(s)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status="ONLINE" />
                  </td>
                  <td className="py-3 px-4 text-[#77827D] tabular-nums whitespace-nowrap">{s.lastSeen}</td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => onToggleSensor(s.id)}
                      className="px-2 py-1 text-[11px] bg-[#F5F6F4] border border-[#E3E7E5] hover:border-[#C85C54] hover:text-[#C85C54] rounded-sm font-semibold"
                    >
                      Simulasi Putus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GAS MONITORING & AMBIENT TEMPERATURE/HUMIDITY CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gas Leakage Monitoring & Threshold Control */}
        <div className="bg-white border border-[#E3E7E5] rounded-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E3E7E5] pb-3">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-[#263238]">
                Monitoring Kebocoran Gas (GAS-01)
              </h3>
              <p className="text-xs text-[#77827D] mt-0.5">
                Telemetri konsentrasi gas, konfigurasi batas bahaya &amp; riwayat alarm
              </p>
            </div>
            <StatusBadge status={gasStatus} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
            <div className="p-3 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm">
              <div className="text-[10px] uppercase text-[#77827D]">Kadar Saat Ini</div>
              <div className="text-xl font-bold text-[#263238] mt-1 tabular-nums">
                {envData.gasPpm} ppm
              </div>
            </div>
            <div className="p-3 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm">
              <label className="block text-[10px] uppercase text-[#9A6E1F]">
                Batas Waspada
              </label>
              <input
                type="number"
                value={envData.gasWarningThreshold}
                onChange={(e) =>
                  setEnvData({ ...envData, gasWarningThreshold: Number(e.target.value) })
                }
                className="w-full mt-1 px-2 py-1 text-sm font-bold bg-white border border-[#E3E7E5] rounded-sm"
              />
            </div>
            <div className="p-3 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm">
              <label className="block text-[10px] uppercase text-[#9E3831]">
                Batas Bahaya
              </label>
              <input
                type="number"
                value={envData.gasDangerThreshold}
                onChange={(e) =>
                  setEnvData({ ...envData, gasDangerThreshold: Number(e.target.value) })
                }
                className="w-full mt-1 px-2 py-1 text-sm font-bold bg-white border border-[#E3E7E5] rounded-sm"
              />
            </div>
          </div>

          {/* Interactive Test Slider for Gas Concentration */}
          <div className="p-3 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm space-y-1.5 font-mono">
            <div className="flex justify-between text-xs">
              <span>Simulasi Konsentrasi Gas (Uji Coba Alarm):</span>
              <span className="font-bold">{envData.gasPpm} ppm</span>
            </div>
            <input
              type="range"
              min={100}
              max={800}
              step={10}
              value={envData.gasPpm}
              onChange={(e) => setEnvData({ ...envData, gasPpm: Number(e.target.value) })}
              className="w-full accent-orange-600 h-1.5 bg-gray-300 rounded-lg cursor-pointer"
            />
          </div>

          {/* Panel Kontrol Alarm & Buzzer Fisik (MQTT) */}
          <div className="p-3.5 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between text-xs font-mono gap-1 border-b border-[#E3E7E5] pb-2">
              <span className="font-bold text-[#1C100C] uppercase flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-orange-600" />
                Panel Kontrol Alarm &amp; Buzzer Fisik (MQTT)
              </span>
              <span className="text-[10px] text-[#77827D]">
                warehouse/small_warehouse/control/buzzer
              </span>
            </div>

            {/* Status Sirene & Status Bahaya Real-Time */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 bg-white border border-[#E3E7E5] rounded-sm flex items-center justify-between">
                <span className="text-[11px] text-[#77827D]">Status Sirene:</span>
                <span className={`font-bold flex items-center gap-1 ${telemetryPayload?.actuators?.buzzer ? 'text-[#C85C54]' : 'text-emerald-700'}`}>
                  <span className={`w-2 h-2 rounded-full ${telemetryPayload?.actuators?.buzzer ? 'bg-[#C85C54] animate-ping' : 'bg-emerald-600'}`} />
                  {telemetryPayload?.actuators?.buzzer ? 'BUNYI (AKTIF)' : 'MATI (STANDBY)'}
                </span>
              </div>
              <div className="p-2 bg-white border border-[#E3E7E5] rounded-sm flex items-center justify-between">
                <span className="text-[11px] text-[#77827D]">Safety State:</span>
                <span className={`font-bold ${telemetryPayload?.environment?.safety_state === 'ALARM_TRIGGERED' ? 'text-[#C85C54]' : 'text-emerald-700'}`}>
                  {telemetryPayload?.environment?.safety_state === 'ALARM_TRIGGERED' ? 'ALARM_TRIGGERED (BAHAYA)' : 'SAFE_NORMAL (AMAN)'}
                </span>
              </div>
            </div>

            {/* 4 Tombol Interaktif Buzzer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <button
                onClick={async () => {
                  const ok = await IoTApiService.sendBuzzerCommand('MUTE');
                  triggerToast(
                    ok ? 'Perintah MUTE terkirim ke ESP32.' : 'Gagal kirim perintah MUTE.',
                    ok ? 'info' : 'danger'
                  );
                }}
                className="px-2 py-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 rounded-sm flex items-center justify-center gap-1.5 font-semibold text-amber-900 transition-colors"
                title="Diamkan alarm saat bahaya aktif"
              >
                <VolumeX className="w-3.5 h-3.5 text-amber-600" />
                <span>MUTE</span>
              </button>
              <button
                onClick={async () => {
                  const ok = await IoTApiService.sendBuzzerCommand('AUTO');
                  triggerToast(
                    ok ? 'Sistem dikembalikan ke mode AUTO.' : 'Gagal kirim perintah AUTO.',
                    ok ? 'info' : 'danger'
                  );
                }}
                className="px-2 py-1.5 bg-[#1C100C] text-orange-200 border border-orange-900/40 rounded-sm flex items-center justify-center gap-1.5 font-semibold hover:bg-[#2E180E] transition-colors"
                title="Kembalikan sistem ke mode pemantauan otomatis"
              >
                <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                <span>AUTO</span>
              </button>
              <button
                onClick={async () => {
                  const ok = await IoTApiService.sendBuzzerCommand('ON');
                  triggerToast(
                    ok ? 'Perintah TEST ON (Uji Sirine) terkirim.' : 'Gagal kirim perintah ON.',
                    ok ? 'info' : 'danger'
                  );
                }}
                className="px-2 py-1.5 bg-red-50 border border-red-300 hover:bg-red-100 rounded-sm flex items-center justify-center gap-1.5 font-semibold text-red-700 transition-colors"
                title="Bunyikan sirine darurat secara manual (TEST ON)"
              >
                <Volume2 className="w-3.5 h-3.5 text-red-600" />
                <span>TEST ON</span>
              </button>
              <button
                onClick={async () => {
                  const ok = await IoTApiService.sendBuzzerCommand('OFF');
                  triggerToast(
                    ok ? 'Perintah OFF terkirim ke ESP32.' : 'Gagal kirim perintah OFF.',
                    ok ? 'info' : 'danger'
                  );
                }}
                className="px-2 py-1.5 bg-stone-100 border border-stone-300 hover:bg-stone-200 rounded-sm flex items-center justify-center gap-1.5 font-semibold text-stone-700 transition-colors"
                title="Matikan buzzer secara paksa"
              >
                <span>OFF</span>
              </button>
            </div>
          </div>

          {/* Gas Alert History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase text-[#1C100C]">
                Riwayat Peringatan Gas
              </span>
              <button
                onClick={handleLogGasTestAlert}
                className="px-2 py-1 text-[11px] font-mono bg-[#F5F6F4] border border-[#E3E7E5] hover:border-orange-500 rounded-sm"
              >
                + Catat Snapshot
              </button>
            </div>
            <div className="border border-[#E3E7E5] rounded-sm divide-y divide-[#E3E7E5] max-h-44 overflow-y-auto">
              {gasAlerts.map((alert) => (
                <div key={alert.id} className="p-2.5 text-xs font-mono flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1C100C]">{alert.timestamp}</span>
                      <span className="text-orange-700 font-semibold">{alert.readingPpm} ppm</span>
                    </div>
                    <div className="text-[11px] font-sans text-[#77827D] mt-0.5 break-words">{alert.message}</div>
                  </div>
                  <StatusBadge status={alert.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Temperature & Humidity Historical Chart */}
        <div className="bg-white border border-[#E3E7E5] rounded-sm p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between border-b border-[#E3E7E5] pb-3 gap-2">
              <div>
                <h3 className="text-sm font-bold font-mono uppercase text-[#1C100C]">
                  Monitoring Suhu &amp; Kelembaban (ENV-01)
                </h3>
                <p className="text-xs text-[#77827D] mt-0.5">
                  Riwayat telemetri kondisi udara sekitar rak penyimpanan
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm font-bold text-orange-700">
                  {envData.temperatureC.toFixed(1)} °C
                </span>
                <span className="mx-1.5 text-[#77827D]">|</span>
                <span className="text-sm font-bold text-amber-700">
                  {envData.humidityRh} %RH
                </span>
              </div>
            </div>

            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={envHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3E7E5" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#77827D' }} />
                  <YAxis
                    yAxisId="temp"
                    domain={[20, 35]}
                    tick={{ fontSize: 11, fill: '#EA580C' }}
                    label={{ value: '°C', position: 'insideTopLeft', fontSize: 10 }}
                  />
                  <YAxis
                    yAxisId="hum"
                    orientation="right"
                    domain={[40, 90]}
                    tick={{ fontSize: 11, fill: '#D97706' }}
                    label={{ value: '%RH', position: 'insideTopRight', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E3E7E5',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Line
                    yAxisId="temp"
                    type="monotone"
                    dataKey="temp"
                    name="Suhu Lingkungan (°C)"
                    stroke="#EA580C"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="hum"
                    type="monotone"
                    dataKey="humidity"
                    name="Kelembaban Udara (%RH)"
                    stroke="#D97706"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm text-[11px] font-mono text-[#77827D] flex flex-wrap items-center justify-between gap-2">
            <span>Modul Sensor: DHT11 Digital (1-Wire GPIO04)</span>
            <span>Kompensasi Suhu Kecepatan Suara: Aktif (347.6 m/s @ 27.5°C)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorMonitoringPage;
