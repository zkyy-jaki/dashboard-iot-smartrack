/**
 * ============================================================================
 * RACK VISUALIZER (KEMBAR DIGITAL RAK 3-LANTAI)
 * ============================================================================
 * Menampilkan skematik visual fisik rak ambalan 58.0 cm secara 100% dinamis.
 * 
 * PRINSIP ZERO LOCAL MATH:
 * - Tidak menghitung stok atau menerka warna LED di browser.
 * - Nilai occupied_span_cm, item_count, distance_left_cm, distance_right_cm,
 *   dan led_color langsung dibaca dari objek floor payload ESP32.
 * - Rasio visual kardus dihitung mutlak: (floor.occupied_span_cm / 58.0) * 100%.
 * ============================================================================
 */

import React from 'react';
import { Layers } from 'lucide-react';
import { FloorTelemetry, LedColor } from '../../types';

interface RackVisualizerProps {
  floors: FloorTelemetry[];
  selectedFloor?: number;
  onSelectFloor?: (floorNum: number) => void;
}

const SHELF_WIDTH_CM = 58.0; // Dimensi mutlak panjang ambalan fisik rak

export const RackVisualizer: React.FC<RackVisualizerProps> = ({
  floors,
  selectedFloor,
  onSelectFloor,
}) => {
  // Render bulatan lampu fisik 3 RGB LED independen
  const renderRgbLed = (color: LedColor) => {
    switch (color) {
      case 'GREEN':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-[10px] font-mono font-bold text-emerald-600">LED: GREEN (PENUH)</span>
          </div>
        );
      case 'BLUE':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
            <span className="text-[10px] font-mono font-bold text-sky-600">LED: BLUE (TERISI)</span>
          </div>
        );
      case 'BLINK_RED':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/50 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shadow-[0_0_10px_rgba(225,29,72,1)]" />
            <span className="text-[10px] font-mono font-bold text-rose-600">LED: BLINK RED (BAHAYA)</span>
          </div>
        );
      case 'RED':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
            <span className="text-[10px] font-mono font-bold text-rose-600">LED: RED (KOSONG)</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-white border border-orange-900/10 rounded-sm p-4 sm:p-6 flex flex-col justify-between shadow-2xs">
      {/* Header Visualizer */}
      <div className="flex flex-wrap items-center justify-between pb-4 mb-5 border-b border-orange-200/60 gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-orange-600 via-amber-600 to-red-600 text-white rounded-sm shrink-0 shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
              SKEMATIK ELEVASI RAK (CAD ISOMETRIK)
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-[#1C100C] font-mono">
              RACK-001 • 3 Lantai Ambalan (Panjang 58.0 cm)
            </h3>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#1C100C] inline-block rounded-[1px] border border-orange-500/40" /> Sensor HC-SR04
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-amber-500 border border-amber-700 inline-block rounded-[1px]" /> Kardus Barang
          </span>
        </div>
      </div>

      {/* Frame Rak Baja — Charred Timber & Dark Steel */}
      <div className="border-x-[10px] sm:border-x-[12px] border-t-[10px] border-[#2E180E] bg-stone-100/70 pt-4 pb-2 px-2 sm:px-4 space-y-5 relative rounded-t-sm shadow-inner">
        {floors.map((floor) => {
          const isSelected = selectedFloor === floor.floor;
          // ZERO LOCAL MATH: Lebar murni rasio terhadap 58.0 cm
          const widthPct = Math.min(100, Math.max(0, (floor.occupied_span_cm / SHELF_WIDTH_CM) * 100));

          return (
            <div
              key={floor.floor}
              onClick={() => onSelectFloor?.(floor.floor)}
              className={`transition-all rounded-sm border-2 bg-white ${
                isSelected
                  ? 'border-orange-600 shadow-md ring-2 ring-orange-500/20'
                  : 'border-orange-200/80 hover:border-orange-500/50 cursor-pointer shadow-xs'
              }`}
            >
              {/* Baris Strip Informasi Lantai */}
              <div className="px-3 py-2 bg-orange-950/5 border-b border-orange-200/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-gradient-to-r from-orange-700 to-amber-800 text-amber-100 font-bold rounded-sm shadow-2xs">
                    Lantai {floor.floor}
                  </span>
                  <span className="font-bold text-[#1C100C]">
                    {floor.item_count} Kardus ({floor.occupied_span_cm} cm)
                  </span>
                  <span className="text-stone-500 hidden md:inline">
                    • Kiri: {floor.distance_left_cm} cm | Kanan: {floor.distance_right_cm} cm
                  </span>
                </div>

                {/* Indikator Status & RGB LED Independen */}
                <div className="flex items-center gap-2">
                  {renderRgbLed(floor.led_color)}
                  <span
                    className={`px-2 py-0.5 rounded-sm font-bold text-[10px] ${
                      floor.status === 'FULL'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : floor.status === 'PARTIAL'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {floor.status}
                  </span>
                </div>
              </div>

              {/* Area Ambalan Fisik */}
              <div className="h-28 relative flex items-end px-7 sm:px-8 pt-4 pb-2 bg-white overflow-hidden">
                {/* Modul Sensor Kiri */}
                <div className="absolute left-0 bottom-2 z-10 flex items-center">
                  <div className="bg-[#1C100C] text-orange-400 px-1.5 py-2 rounded-r-sm flex flex-col items-center shadow-xs border-r border-y border-orange-500/30">
                    <span className="text-[9px] font-mono font-bold leading-none">US-0{floor.floor * 2 - 1}</span>
                    <span className="text-[7px] font-mono text-amber-300/70">KIRI</span>
                  </div>
                </div>

                {/* Modul Sensor Kanan */}
                <div className="absolute right-0 bottom-2 z-10 flex items-center">
                  <div className="bg-[#1C100C] text-orange-400 px-1.5 py-2 rounded-l-sm flex flex-col items-center shadow-xs border-l border-y border-orange-500/30">
                    <span className="text-[9px] font-mono font-bold leading-none">US-0{floor.floor * 2}</span>
                    <span className="text-[7px] font-mono text-amber-300/70">KANAN</span>
                  </div>
                </div>

                {/* Ambalan Rak 58 cm */}
                <div className="w-full h-20 flex items-end relative overflow-hidden bg-stone-50 border-b-2 border-[#2E180E]">
                  {floor.item_count === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-stone-300 rounded-sm">
                      <span className="text-xs font-mono font-semibold text-stone-400 italic">
                        — LANTAI KOSONG (0 KARDUS) —
                      </span>
                      <span className="text-[10px] font-mono text-stone-400">
                        Ambalan 58.0 cm bersih tanpa hambatan
                      </span>
                    </div>
                  ) : (
                    /* Kardus Merapat ke Sisi Kiri */
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="h-16 flex items-stretch gap-1 transition-all duration-500 ease-out"
                    >
                      {Array.from({ length: floor.item_count }).map((_, boxIdx) => (
                        <div
                          key={boxIdx}
                          className="flex-1 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 border-2 border-amber-800 rounded-xs shadow-md flex flex-col items-center justify-center relative overflow-hidden select-none"
                          title={`Kardus #${boxIdx + 1} di Lantai ${floor.floor}`}
                        >
                          {/* Garis Lakban Cokelat */}
                          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2.5 bg-amber-950/25 border-y border-amber-900/40" />
                          <span className="text-[10px] font-mono font-bold text-amber-950 z-10">
                            BOX #{boxIdx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Garis Ambalan Besi Horizontal */}
              <div className="h-2 bg-[#2E180E] border-t border-[#1C100C]" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

