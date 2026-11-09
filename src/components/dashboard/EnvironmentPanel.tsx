/**
 * ============================================================================
 * PANEL TELEMETRI LINGKUNGAN & KONTROL AKTUATOR
 * ============================================================================
 * 1. Membaca data Suhu DHT11, Kelembapan, dan Gas MQ-2 langsung dari objek
 *    `data.environment`.
 * 2. Menampilkan status sirene dari `data.actuators.buzzer`.
 * 3. Menyediakan 4 tombol kontrol Buzzer (MUTE, AUTO, TEST ON, OFF).
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  Flame,
  Thermometer,
  Droplets,
  Volume2,
  VolumeX,
  ShieldAlert,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { TelemetryPayload, BuzzerCommand } from '../../types';

interface EnvironmentPanelProps {
  environment: TelemetryPayload['environment'];
  actuators: TelemetryPayload['actuators'];
  onSendBuzzerCommand: (command: BuzzerCommand) => Promise<boolean>;
}

export const EnvironmentPanel: React.FC<EnvironmentPanelProps> = ({
  environment,
  actuators,
  onSendBuzzerCommand,
}) => {
  const [isPending, setIsPending] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleCommand = async (cmd: BuzzerCommand) => {
    setIsPending(true);
    const success = await onSendBuzzerCommand(cmd);
    setIsPending(false);
    if (success) {
      setLastAction(`Perintah "${cmd}" berhasil terkirim.`);
      setTimeout(() => setLastAction(null), 3000);
    }
  };

  const isAlarm = environment.safety_state === 'ALARM_TRIGGERED' || environment.hazard_detected;

  return (
    <div className="space-y-6">
      {/* 1. Status Bahaya Gudang (Safety State Banner) */}
      <div
        className={`p-4 rounded-sm border flex items-center justify-between transition-all ${
          isAlarm
            ? 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse'
            : 'bg-emerald-50 border-emerald-300 text-emerald-800'
        }`}
      >
        <div className="flex items-center gap-3">
          {isAlarm ? (
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
          ) : (
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
          )}
          <div>
            <div className="font-bold font-mono text-sm uppercase tracking-wider">
              STATUS KESELAMATAN: {environment.safety_state}
            </div>
            <div className="text-xs">
              {isAlarm
                ? 'BAHAYA TERDETEKSI: Suhu melebihi 50°C atau Konsentrasi Gas > 600 ppm.'
                : 'Kondisi lingkungan rak dalam batas aman normal.'}
            </div>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 text-xs font-mono font-bold rounded-sm ${
            isAlarm ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          {isAlarm ? '⚠️ HAZARD' : '✓ NORMAL'}
        </span>
      </div>

      {/* 2. Grid Sensor Lingkungan (Suhu, Kelembaban, Gas) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Suhu Udara (DHT11) */}
        <div className="bg-white border border-[#E3E7E5] p-4 rounded-sm">
          <div className="flex items-center justify-between text-[#77827D] mb-2">
            <span className="text-xs font-mono font-semibold uppercase">Suhu (DHT11)</span>
            <Thermometer className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#263238] tabular-nums">
            {environment.temperature_c.toFixed(1)} <span className="text-sm font-normal text-[#77827D]">°C</span>
          </div>
          <div className="text-[11px] font-mono text-[#77827D] mt-1">
            Ambang Bahaya: &gt; 50.0 °C
          </div>
        </div>

        {/* Kelembaban Udara (DHT11) */}
        <div className="bg-white border border-[#E3E7E5] p-4 rounded-sm">
          <div className="flex items-center justify-between text-[#77827D] mb-2">
            <span className="text-xs font-mono font-semibold uppercase">Kelembaban (DHT11)</span>
            <Droplets className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#263238] tabular-nums">
            {environment.humidity_pct.toFixed(1)} <span className="text-sm font-normal text-[#77827D]">% RH</span>
          </div>
          <div className="text-[11px] font-mono text-[#77827D] mt-1">
            Rentang Optimal: 40% - 70%
          </div>
        </div>

        {/* Kadar Gas / Asap (MQ-2) */}
        <div className="bg-white border border-[#E3E7E5] p-4 rounded-sm">
          <div className="flex items-center justify-between text-[#77827D] mb-2">
            <span className="text-xs font-mono font-semibold uppercase">Konsentrasi Gas (MQ-2)</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#263238] tabular-nums">
            {environment.gas_raw} <span className="text-sm font-normal text-[#77827D]">ADC ({environment.gas_pct}%)</span>
          </div>
          <div className="text-[11px] font-mono text-[#77827D] mt-1">
            Ambang Bahaya: &gt; 600 ppm
          </div>
        </div>
      </div>

      {/* 3. Panel Kontrol Sirene & Buzzer Aktif */}
      <div className="bg-white border border-[#E3E7E5] p-5 rounded-sm">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#E3E7E5] gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            {actuators.buzzer ? (
              <div className="p-2 bg-rose-500 text-white rounded-sm animate-bounce">
                <Volume2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 bg-slate-700 text-white rounded-sm">
                <VolumeX className="w-5 h-5" />
              </div>
            )}
            <div>
              <h4 className="text-sm font-bold font-mono text-[#263238] uppercase">
                Kontrol Sirene Buzzer Fisik (GPIO 13)
              </h4>
              <p className="text-xs text-[#77827D]">
                Status Hardware Saat Ini:{' '}
                <span className={`font-mono font-bold ${actuators.buzzer ? 'text-rose-600' : 'text-slate-600'}`}>
                  {actuators.buzzer ? '🔊 BUNYI AKTIF' : '🔇 MATI / STANDBY'}
                </span>
              </p>
            </div>
          </div>

          {lastAction && (
            <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 border border-emerald-200 rounded-sm">
              {lastAction}
            </span>
          )}
        </div>

        {/* 4 Tombol Kontrol Interaktif */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            disabled={isPending}
            onClick={() => handleCommand('MUTE')}
            className="px-3 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-mono text-xs font-bold rounded-sm transition-colors shadow-xs disabled:opacity-50"
          >
            🔇 MUTE BUZZER
          </button>
          <button
            disabled={isPending}
            onClick={() => handleCommand('AUTO')}
            className="px-3 py-2.5 bg-[#172B3A] hover:bg-[#233F53] text-white font-mono text-xs font-bold rounded-sm transition-colors shadow-xs disabled:opacity-50"
          >
            ⚙️ MODE AUTO
          </button>
          <button
            disabled={isPending}
            onClick={() => handleCommand('ON')}
            className="px-3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-bold rounded-sm transition-colors shadow-xs disabled:opacity-50"
          >
            🚨 TEST ON
          </button>
          <button
            disabled={isPending}
            onClick={() => handleCommand('OFF')}
            className="px-3 py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-mono text-xs font-bold rounded-sm transition-colors shadow-xs disabled:opacity-50"
          >
            ⏹️ PAKSA OFF
          </button>
        </div>
      </div>
    </div>
  );
};

