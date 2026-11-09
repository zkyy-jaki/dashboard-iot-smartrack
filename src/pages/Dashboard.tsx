/**
 * ============================================================================
 * LIVE DYNAMIC DASHBOARD (SMART SMALL RACK WAREHOUSE)
 * ============================================================================
 * 100% DINAMIS & ZERO LOCAL MATH:
 * - Menghapus semua mock data.
 * - Jika data WebSocket belum masuk (telemetry === null), menampilkan layar
 *   loading status gateway yang profesional.
 * - Menggunakan useWarehouseSocket untuk mendengarkan event real-time dari ESP32.
 * - Merender RackVisualizer dan EnvironmentPanel secara murni dari payload.
 * ============================================================================
 */

import React from 'react';
import {
  Package,
  Layers,
  Radio,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { TelemetryPayload, BuzzerCommand } from '../types';
import { useWarehouseSocket } from '../hooks/useWarehouseSocket';
import { RackVisualizer } from '../components/rack/RackVisualizer';
import { EnvironmentPanel } from '../components/dashboard/EnvironmentPanel';

interface DashboardProps {
  telemetry?: TelemetryPayload | null;
  isConnected?: boolean;
  lastUpdated?: string | null;
  sendBuzzerCommand?: (command: BuzzerCommand) => Promise<boolean>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  telemetry: propTelemetry,
  isConnected: propIsConnected,
  lastUpdated: propLastUpdated,
  sendBuzzerCommand: propSendBuzzerCommand,
}) => {
  const socket = useWarehouseSocket();
  const telemetry = propTelemetry !== undefined ? propTelemetry : socket.telemetry;
  const isConnected = propIsConnected !== undefined ? propIsConnected : socket.isConnected;
  const lastUpdated = propLastUpdated !== undefined ? propLastUpdated : socket.lastUpdated;
  const sendBuzzerCommand = propSendBuzzerCommand || socket.sendBuzzerCommand;

  // 1. SCREEN JIKA BELUM ADA DATA DARI ESP32 / GATEWAY
  if (!telemetry) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-[#172B3A]/10 rounded-full flex items-center justify-center animate-ping absolute inset-0" />
          <div className="w-20 h-20 bg-[#172B3A] text-white rounded-full flex items-center justify-center relative shadow-lg">
            <Radio className="w-10 h-10 animate-pulse" />
          </div>
        </div>

        <h2 className="text-xl font-bold font-mono text-[#263238] uppercase tracking-wide">
          Menunggu Koneksi Gateway ESP32...
        </h2>
        <p className="text-sm text-[#77827D] max-w-md mt-2">
          {isConnected
            ? 'WebSocket terhubung. Menunggu paket telemetri MQTT pertama dari ESP32 (topik: warehouse/small_warehouse/telemetry)...'
            : 'Mencoba menghubungkan ke Backend WebSocket di port 3001... Pastikan backend telah dijalankan.'}
        </p>

        <div className="mt-6 flex items-center gap-3 px-4 py-2 bg-white border border-[#E3E7E5] rounded-full text-xs font-mono">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'
            }`}
          />
          <span className="font-bold text-[#263238]">
            Status Gateway: {isConnected ? 'ONLINE & SIAP' : 'MENGHUBUNGKAN...'}
          </span>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  // 2. DASHBOARD 100% DINAMIS SAAT DATA REAL-TIME SUDAH DITERIMA
  const { summary, environment, actuators, floors } = telemetry;
  const isAlarm = environment.safety_state === 'ALARM_TRIGGERED' || environment.hazard_detected;

  return (
    <div className="space-y-6">
      {/* Top Banner Status Bar */}
      <div className="bg-white border border-[#E3E7E5] p-4 rounded-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#172B3A] text-white rounded-sm">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold font-mono text-[#263238] uppercase">
              Smart Small Rack Warehouse — Live Monitor
            </h1>
            <p className="text-xs text-[#77827D] mt-0.5">
              Arsitektur Edge Computing • Data dihitung langsung oleh ESP32
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#77827D]">
            <Clock className="w-4 h-4" />
            <span>Update Terakhir: {lastUpdated || 'Baru Saja'}</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            LIVE MQTT
          </span>
        </div>
      </div>

      {/* A. 4 METRIC CARDS RINGKASAN GUDANG (ZERO LOCAL MATH) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Kardus */}
        <div className="bg-white border border-[#E3E7E5] p-4 rounded-sm">
          <div className="flex items-center justify-between text-[#77827D] mb-2">
            <span className="text-xs font-mono font-semibold uppercase">Total Stok Barang</span>
            <Package className="w-4 h-4 text-[#172B3A]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#263238] tabular-nums">
            {summary.total_items}{' '}
            <span className="text-sm font-normal text-[#77827D]">/ 12 Kardus</span>
          </div>
          <div className="text-[11px] font-mono text-[#77827D] mt-1">
            Status Gudang: <span className="font-bold text-[#172B3A]">{summary.warehouse_status}</span>
          </div>
        </div>

        {/* Card 2: Baris Rak Terisi */}
        <div className="bg-white border border-[#E3E7E5] p-4 rounded-sm">
          <div className="flex items-center justify-between text-[#77827D] mb-2">
            <span className="text-xs font-mono font-semibold uppercase">Lantai Terisi</span>
            <Layers className="w-4 h-4 text-[#172B3A]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#263238] tabular-nums">
            {summary.occupied_floors}{' '}
            <span className="text-sm font-normal text-[#77827D]">/ 3 Lantai</span>
          </div>
          <div className="text-[11px] font-mono text-[#77827D] mt-1">
            Ambalan: 3 Baris x 58.0 cm
          </div>
        </div>

        {/* Card 3: Suhu Udara (DHT11) */}
        <div className="bg-white border border-[#E3E7E5] p-4 rounded-sm">
          <div className="flex items-center justify-between text-[#77827D] mb-2">
            <span className="text-xs font-mono font-semibold uppercase">Suhu Ruang (DHT11)</span>
            <span className="text-xs font-mono text-orange-600 font-bold">
              {environment.temperature_c.toFixed(1)}°C
            </span>
          </div>
          <div className="text-3xl font-bold font-mono text-[#263238] tabular-nums">
            {environment.humidity_pct.toFixed(0)}{' '}
            <span className="text-sm font-normal text-[#77827D]">% RH</span>
          </div>
          <div className="text-[11px] font-mono text-[#77827D] mt-1">
            Kelembaban Udara Gudang
          </div>
        </div>

        {/* Card 4: Konsentrasi Gas & Sirene */}
        <div className="bg-white border border-[#E3E7E5] p-4 rounded-sm">
          <div className="flex items-center justify-between text-[#77827D] mb-2">
            <span className="text-xs font-mono font-semibold uppercase">Sensor Gas (MQ-2)</span>
            {isAlarm ? (
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="text-3xl font-bold font-mono text-[#263238] tabular-nums">
            {environment.gas_raw}{' '}
            <span className="text-sm font-normal text-[#77827D]">ADC ({environment.gas_pct}%)</span>
          </div>
          <div className="text-[11px] font-mono text-[#77827D] mt-1">
            Buzzer:{' '}
            <span className={`font-bold ${actuators.buzzer ? 'text-rose-600' : 'text-slate-600'}`}>
              {actuators.buzzer ? '🔊 BUNYI' : '🔇 STANDBY'}
            </span>
          </div>
        </div>
      </div>

      {/* B. VISUALISASI RAK 3D (RACK VISUALIZER) */}
      <RackVisualizer floors={floors} />

      {/* C. PANEL LINGKUNGAN & KONTROL AKTUATOR BUZZER */}
      <EnvironmentPanel
        environment={environment}
        actuators={actuators}
        onSendBuzzerCommand={sendBuzzerCommand}
      />
    </div>
  );
};

export default Dashboard;

