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
          <div className="w-20 h-20 bg-orange-500/15 rounded-full flex items-center justify-center animate-ping absolute inset-0" />
          <div className="w-20 h-20 bg-gradient-to-br from-[#2D1409] via-[#1F0C05] to-[#120602] border border-orange-500/40 text-orange-400 rounded-full flex items-center justify-center relative shadow-xl">
            <Radio className="w-10 h-10 animate-pulse text-orange-500" />
          </div>
        </div>

        <h2 className="text-xl font-extrabold font-mono text-[#1C100C] uppercase tracking-wide">
          Menunggu Koneksi Gateway ESP32...
        </h2>
        <p className="text-sm text-stone-500 max-w-md mt-2">
          {isConnected
            ? 'WebSocket terhubung. Menunggu paket telemetri MQTT pertama dari ESP32 (topik: warehouse/small_warehouse/telemetry)...'
            : 'Mencoba menghubungkan ke Backend WebSocket di port 3001... Pastikan backend telah dijalankan.'}
        </p>

        <div className="mt-6 flex items-center gap-3 px-4 py-2 bg-white/90 border border-orange-200/80 rounded-full text-xs font-mono shadow-xs">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500 animate-ping'
            }`}
          />
          <span className="font-bold text-[#1C100C]">
            Status Gateway: {isConnected ? 'ONLINE & SIAP' : 'MENGHUBUNGKAN...'}
          </span>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
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
      <div className="bg-white/95 border border-orange-900/10 p-4 rounded-sm flex flex-wrap items-center justify-between gap-4 shadow-2xs border-t-2 border-t-orange-500">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-orange-600 via-amber-600 to-red-600 text-white rounded-sm shadow-xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold font-mono text-[#1C100C] uppercase tracking-tight">
              Smart Small Rack Warehouse — Live Monitor
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Arsitektur Edge Computing • Data dihitung langsung oleh ESP32
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-stone-500">
            <Clock className="w-4 h-4 text-orange-600" />
            <span>Update Terakhir: {lastUpdated || 'Baru Saja'}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[11px] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            LIVE MQTT
          </span>
        </div>
      </div>

      {/* A. 4 METRIC CARDS RINGKASAN GUDANG (ZERO LOCAL MATH) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Kardus */}
        <div className="bg-white border border-orange-900/10 p-4 rounded-sm shadow-2xs hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-mono font-semibold uppercase">Total Stok Barang</span>
            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-sm">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#1C100C] tabular-nums">
            {summary.total_items}{' '}
            <span className="text-sm font-normal text-stone-400">/ 12 Kardus</span>
          </div>
          <div className="text-[11px] font-mono text-stone-500 mt-1">
            Status Gudang: <span className="font-bold text-orange-950">{summary.warehouse_status}</span>
          </div>
        </div>

        {/* Card 2: Baris Rak Terisi */}
        <div className="bg-white border border-orange-900/10 p-4 rounded-sm shadow-2xs hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-mono font-semibold uppercase">Lantai Terisi</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-sm">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#1C100C] tabular-nums">
            {summary.occupied_floors}{' '}
            <span className="text-sm font-normal text-stone-400">/ 3 Lantai</span>
          </div>
          <div className="text-[11px] font-mono text-stone-500 mt-1">
            Ambalan: 3 Baris x 58.0 cm
          </div>
        </div>

        {/* Card 3: Suhu Udara (DHT11) */}
        <div className="bg-white border border-orange-900/10 p-4 rounded-sm shadow-2xs hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-mono font-semibold uppercase">Suhu Ruang (DHT11)</span>
            <span className="text-xs font-mono text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-sm border border-red-200">
              {environment.temperature_c.toFixed(1)}°C
            </span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#1C100C] tabular-nums">
            {environment.humidity_pct.toFixed(0)}{' '}
            <span className="text-sm font-normal text-stone-400">% RH</span>
          </div>
          <div className="text-[11px] font-mono text-stone-500 mt-1">
            Kelembaban Udara Gudang
          </div>
        </div>

        {/* Card 4: Konsentrasi Gas & Sirene */}
        <div className="bg-white border border-orange-900/10 p-4 rounded-sm shadow-2xs hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-mono font-semibold uppercase">Sensor Gas (MQ-2)</span>
            {isAlarm ? (
              <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#1C100C] tabular-nums">
            {environment.gas_raw}{' '}
            <span className="text-sm font-normal text-stone-400">ADC ({environment.gas_pct}%)</span>
          </div>
          <div className="text-[11px] font-mono text-stone-500 mt-1">
            Buzzer:{' '}
            <span className={`font-bold ${actuators.buzzer ? 'text-red-600 animate-pulse' : 'text-stone-600'}`}>
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

