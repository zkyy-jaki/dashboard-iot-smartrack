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
            ? 'bg-red-50/90 border-red-300 text-red-900 animate-pulse shadow-sm'
            : 'bg-emerald-50/90 border-emerald-300 text-emerald-900 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-3">
          {isAlarm ? (
            <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
          ) : (
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
          )}
          <div>
            <div className="font-extrabold font-mono text-sm uppercase tracking-wider">
              STATUS KESELAMATAN: {environment.safety_state}
            </div>
            <div className="text-xs">
              {isAlarm
                ? 'BAHAYA TERDETEKSI: Suhu melebihi 50°C atau Konsentrasi Gas >= 1800 ADC.'
                : 'Kondisi lingkungan rak dalam batas aman normal.'}
            </div>
          </div>
        </div>
        <span
          className={`px-3 py-1 text-xs font-mono font-bold rounded-sm shadow-2xs ${
            isAlarm ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-600 text-white'
          }`}
        >
          {isAlarm ? '⚠️ HAZARD' : '✓ NORMAL'}
        </span>
      </div>

      {/* 2. Grid Sensor Lingkungan (Suhu, Kelembaban, Gas) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Suhu Udara (DHT11) */}
        <div className="bg-white border border-orange-900/10 p-4 rounded-sm shadow-2xs hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-mono font-semibold uppercase">Suhu (DHT11)</span>
            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-sm">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#1C100C] tabular-nums">
            {environment.temperature_c.toFixed(1)} <span className="text-sm font-normal text-stone-400">°C</span>
          </div>
          <div className="text-[11px] font-mono text-stone-500 mt-1">
            Ambang Bahaya: &gt; 50.0 °C
          </div>
        </div>

        {/* Kelembaban Udara (DHT11) */}
        <div className="bg-white border border-orange-900/10 p-4 rounded-sm shadow-2xs hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-mono font-semibold uppercase">Kelembaban (DHT11)</span>
            <div className="p-1.5 bg-sky-50 text-sky-600 rounded-sm">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#1C100C] tabular-nums">
            {environment.humidity_pct.toFixed(1)} <span className="text-sm font-normal text-stone-400">% RH</span>
          </div>
          <div className="text-[11px] font-mono text-stone-500 mt-1">
            Rentang Optimal: 40% - 70%
          </div>
        </div>

        {/* Kadar Gas / Asap (MQ-2) */}
        <div className="bg-white border border-orange-900/10 p-4 rounded-sm shadow-2xs hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-mono font-semibold uppercase">Konsentrasi Gas (MQ-2)</span>
            <div className="p-1.5 bg-red-50 text-red-600 rounded-sm">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#1C100C] tabular-nums">
            {environment.gas_raw} <span className="text-sm font-normal text-stone-400">ADC ({environment.gas_pct}%)</span>
          </div>
          <div className="text-[11px] font-mono text-stone-500 mt-1">
            Ambang Bahaya: &gt; 1800 ADC (Waspada: &gt; 700 ADC)
          </div>
        </div>
      </div>

      {/* 3. Panel Kontrol Sirene & Buzzer Aktif */}
      <div className="bg-white border border-orange-900/10 p-5 rounded-sm shadow-2xs">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-orange-200/60 gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            {actuators.buzzer ? (
              <div className="p-2 bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-sm animate-bounce shadow-xs">
                <Volume2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 bg-[#1C100C] text-orange-400 border border-orange-500/30 rounded-sm">
                <VolumeX className="w-5 h-5" />
              </div>
            )}
            <div>
              <h4 className="text-sm font-extrabold font-mono text-[#1C100C] uppercase">
                Kontrol Sirene Buzzer Fisik (GPIO 13)
              </h4>
              <p className="text-xs text-stone-500">
                Status Hardware Saat Ini:{' '}
                <span className={`font-mono font-bold ${actuators.buzzer ? 'text-red-600' : 'text-stone-600'}`}>
                  {actuators.buzzer ? '🔊 BUNYI AKTIF' : '🔇 MATI / STANDBY'}
                </span>
              </p>
            </div>
          </div>

          {lastAction && (
            <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2 py-1 border border-emerald-300 rounded-sm font-semibold">
              {lastAction}
            </span>
          )}
        </div>

        {/* 4 Tombol Kontrol Interaktif */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            disabled={isPending}
            onClick={() => handleCommand('MUTE')}
            className="px-3 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-bold rounded-sm transition-colors shadow-xs disabled:opacity-50"
          >
            🔇 MUTE BUZZER
          </button>
          <button
            disabled={isPending}
            onClick={() => handleCommand('AUTO')}
            className="px-3 py-2.5 bg-[#1C100C] hover:bg-orange-950 text-amber-200 border border-orange-500/40 font-mono text-xs font-bold rounded-sm transition-colors shadow-xs disabled:opacity-50"
          >
            🔄 MODE AUTO
          </button>
          <button
            disabled={isPending}
            onClick={() => handleCommand('ON')}
            className="px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold rounded-sm transition-colors shadow-xs disabled:opacity-50"
          >
            🔊 TEST ON
          </button>
          <button
            disabled={isPending}
            onClick={() => handleCommand('OFF')}
            className="px-3 py-2.5 bg-stone-700 hover:bg-stone-800 text-stone-200 font-mono text-xs font-bold rounded-sm transition-colors shadow-xs disabled:opacity-50"
          >
            ⏹️ PAKSA OFF
          </button>
        </div>
      </div>
    </div>
  );
};

