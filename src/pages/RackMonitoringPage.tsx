import React from 'react';
import {
  Layers,
  Cpu,
  Ruler
} from 'lucide-react';
import { EnrichedRow, EnvData, Sensor, LedColor, FloorTelemetry, TelemetryPayload } from '../types';
import StatusBadge from '../components/ui/StatusBadge';

interface RackMonitoringPageProps {
  enrichedRows: EnrichedRow[];
  selectedRowId: string;
  onSelectRow: (rowId: string) => void;
  onUpdateDistances: (rowId: string, newLeftCm: number, newRightCm: number, sourceLabel?: string) => void;
  onStepRowBox: (rowId: string, deltaBoxes: number) => void;
  envData: EnvData;
  gasStatus: string;
  sensors: Sensor[];
  telemetryPayload?: TelemetryPayload;
}

const SHELF_SPAN_CM = 58.0; // Dimensi mutlak panjang ambalan fisik rak

export const RackMonitoringPage: React.FC<RackMonitoringPageProps> = ({
  enrichedRows,
  selectedRowId,
  onSelectRow,
  onUpdateDistances,
  onStepRowBox,
  envData,
  gasStatus,
  sensors,
  telemetryPayload
}) => {
  const selectedRow = enrichedRows.find((r) => r.rowId === selectedRowId) || enrichedRows[0];
  const selectedRowFloor = selectedRow.floorTelemetry || telemetryPayload?.floors?.find((f) => f.floor === selectedRow.rowNumber);
  const selDistLeft = selectedRowFloor ? selectedRowFloor.distance_left_cm : selectedRow.leftDistanceCm;
  const selDistRight = selectedRowFloor ? selectedRowFloor.distance_right_cm : selectedRow.rightDistanceCm;
  const selOccupiedSpan = selectedRowFloor ? selectedRowFloor.occupied_span_cm : selectedRow.occupiedSpan;
  const selItemCount = selectedRowFloor ? selectedRowFloor.item_count : selectedRow.estimatedStock;
  const selOccupancyPct = Math.min(100, Math.round((selItemCount / selectedRow.capacity) * 100));

  const renderLedBadge = (color?: LedColor) => {
    switch (color) {
      case 'GREEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#66856A]/10 text-[#66856A] border border-[#66856A]/30">
            <span className="w-2 h-2 rounded-full bg-[#66856A] shadow-xs" />
            LED: GREEN (PENUH)
          </span>
        );
      case 'BLUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#172B3A]/10 text-[#172B3A] border border-[#172B3A]/30">
            <span className="w-2 h-2 rounded-full bg-[#172B3A] shadow-xs" />
            LED: BLUE (TERISI)
          </span>
        );
      case 'BLINK_RED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            LED: BLINK RED (DARURAT)
          </span>
        );
      case 'RED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs" />
            LED: RED (KOSONG)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Instruction & Hardware Topology Header */}
      <div className="bg-white border border-[#E3E7E5] p-4 rounded-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#172B3A] text-white rounded-sm shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-mono uppercase text-[#263238]">
              Elevasi Fisik Rak &amp; Telemetri Jarak Ultrasonik — RACK-001
            </h2>
            <p className="text-xs text-[#77827D] mt-0.5">
              Klik baris penyimpanan di bawah untuk memeriksa sensor ultrasonik kiri &amp; kanan, dimensi kardus, serta rumus kalkulasi stok langsung.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs w-full sm:w-auto">
          {enrichedRows.map((r) => (
            <button
              key={r.rowId}
              onClick={() => onSelectRow(r.rowId)}
              className={`px-3 py-1.5 rounded-sm border transition-colors ${
                selectedRow.rowId === r.rowId
                  ? 'bg-[#172B3A] text-white border-[#172B3A] font-bold'
                  : 'bg-[#F5F6F4] text-[#263238] border-[#E3E7E5] hover:bg-gray-200'
              }`}
            >
              {r.rowId} ({r.estimatedStock}/{r.capacity})
            </button>
          ))}
        </div>
      </div>

      {/* MAIN GRID: LEFT 2/3 PHYSICAL RACK ELEVATION, RIGHT 1/3 ROW DETAIL INSPECTOR */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: TECHNICAL RACK ELEVATION DIAGRAM */}
        <div className="xl:col-span-2 bg-white border border-[#E3E7E5] rounded-sm p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-[#E3E7E5] gap-2">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#77827D]">
                  SKEMATIK TAMPILAN DEPAN RAK (CAD ISOMETRIK)
                </span>
                <h3 className="text-sm sm:text-base font-bold text-[#263238] font-mono mt-0.5">
                  RACK-001 (3 Baris Ambalan • 6 Sensor Ultrasonik • Kontroler ESP32)
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-[#77827D]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#172B3A] inline-block rounded-[1px]" /> Sensor Ultrasonik
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#D6A34A]/40 border border-[#9A6E1F] inline-block rounded-[1px]" /> Kardus Barang
                </span>
              </div>
            </div>

            {/* RACK FRAME CONTAINER */}
            <div className="relative pl-1 sm:pl-4 pr-24 sm:pr-28 py-2 overflow-x-auto">
              {/* Vertical Steel Uprights + Shelves */}
              <div className="border-x-[8px] sm:border-x-[10px] border-t-[8px] border-[#4A5559] bg-[#F5F6F4]/70 pt-4 pb-2 px-2 sm:px-3 space-y-6 relative min-w-[340px]">
                {enrichedRows.map((row) => {
                  const isSelected = selectedRow.rowId === row.rowId;
                  const floor = row.floorTelemetry || telemetryPayload?.floors?.find((f) => f.floor === row.rowNumber);
                  const distLeft = floor ? floor.distance_left_cm : row.leftDistanceCm;
                  const distRight = floor ? floor.distance_right_cm : row.rightDistanceCm;
                  const occupiedSpan = floor ? floor.occupied_span_cm : row.occupiedSpan;
                  const itemCount = floor ? floor.item_count : row.estimatedStock;
                  const ledColor = floor?.led_color || row.led_color || 'RED';

                  const isAlignedLeft = distLeft <= distRight;
                  // Dimensi mutlak berdasarkan panjang fisik 58.0 cm
                  const occupiedPct = itemCount > 0
                    ? Math.min(100, Math.max(0, (occupiedSpan / SHELF_SPAN_CM) * 100))
                    : 0;
                  const leftPct = itemCount === 0
                    ? 0
                    : isAlignedLeft
                    ? Math.min(100 - occupiedPct, Math.max(0, (distLeft / SHELF_SPAN_CM) * 100))
                    : Math.max(0, 100 - occupiedPct);
                  const rightPct = itemCount === 0
                    ? 0
                    : isAlignedLeft
                    ? Math.max(0, 100 - occupiedPct - leftPct)
                    : Math.min(100 - occupiedPct, Math.max(0, (distRight / SHELF_SPAN_CM) * 100));

                  return (
                    <div
                      key={row.rowId}
                      onClick={() => onSelectRow(row.rowId)}
                      className={`cursor-pointer transition-all rounded-sm border-2 ${
                        isSelected
                          ? 'border-[#172B3A] bg-white shadow-sm'
                          : 'border-transparent bg-white/70 hover:border-[#172B3A]/40'
                      }`}
                    >
                      {/* Row Top Metadata Strip */}
                      <div className="px-3 py-2 bg-[#172B3A]/5 border-b border-[#E3E7E5] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-[#172B3A] text-white font-bold rounded-sm">
                            {row.rowId} (Lantai {row.rowNumber})
                          </span>
                          <span className="font-bold text-[#263238]">{row.product.name}</span>
                          <span className="text-[#77827D]">({row.sku})</span>
                          <span className="text-[#77827D] hidden sm:inline">• Ambalan: 58.0 cm</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {renderLedBadge(ledColor)}
                          <span className="font-bold text-[#172B3A]">
                            Stok: {itemCount} / {row.capacity} Kardus ({Math.round((itemCount / row.capacity) * 100)}%)
                          </span>
                          <StatusBadge status={floor?.status === 'FULL' ? 'FULL CAPACITY' : floor?.status === 'PARTIAL' ? 'IN STOCK' : floor?.status === 'EMPTY' ? 'EMPTY' : row.status} />
                        </div>
                      </div>

                      {/* Physical Storage Bay Elevation */}
                      <div className="h-28 relative flex items-end px-7 sm:px-8 pt-4 pb-1 bg-white">
                        {/* Far Left Ultrasonic Sensor Module */}
                        <div
                          className="absolute left-0 bottom-3 z-10 flex items-center"
                          title={`${row.leftSensorId} Sensor Ultrasonik Kiri`}
                        >
                          <div className="bg-[#172B3A] text-white px-1 sm:px-1.5 py-2 rounded-r-sm border border-[#0F1E29] flex flex-col items-center shadow-sm">
                            <span className="text-[8px] sm:text-[9px] font-mono font-bold leading-none">
                              {row.leftSensorId}
                            </span>
                            <span className="text-[7px] sm:text-[8px] font-mono text-slate-300 mt-0.5">KIRI</span>
                          </div>
                          <div className="w-1.5 h-5 bg-slate-400 border border-slate-600 rounded-r-sm" />
                        </div>

                        {/* Far Right Ultrasonic Sensor Module */}
                        <div
                          className="absolute right-0 bottom-3 z-10 flex items-center"
                          title={`${row.rightSensorId} Sensor Ultrasonik Kanan`}
                        >
                          <div className="w-1.5 h-5 bg-slate-400 border border-slate-600 rounded-l-sm" />
                          <div className="bg-[#172B3A] text-white px-1 sm:px-1.5 py-2 rounded-l-sm border border-[#0F1E29] flex flex-col items-center shadow-sm">
                            <span className="text-[8px] sm:text-[9px] font-mono font-bold leading-none">
                              {row.rightSensorId}
                            </span>
                            <span className="text-[7px] sm:text-[8px] font-mono text-slate-300 mt-0.5">KANAN</span>
                          </div>
                        </div>

                        {/* Inner Horizontal Shelf Span */}
                        <div className="w-full h-20 flex items-end relative overflow-hidden">
                          {itemCount === 0 ? (
                            <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-[#172B3A]/30 bg-[#172B3A]/[0.02] rounded-sm">
                              <span className="text-xs font-mono font-semibold text-[#77827D] italic">
                                — BARIS KOSONG (0 KARDUS) —
                              </span>
                              <span className="text-[10px] font-mono text-[#77827D] mt-0.5">
                                Seluruh ambalan {row.rowSpanCm} cm siap untuk penempatan kardus
                              </span>
                            </div>
                          ) : (
                            <>
                              {/* LEFT DISTANCE ZONE (jika kardus menempel di kanan) */}
                              {!isAlignedLeft && leftPct > 0 && (
                                <div
                                  style={{ width: `${leftPct}%` }}
                                  className="h-full flex flex-col justify-center items-center relative overflow-hidden transition-all duration-500 ease-out"
                                >
                                  {distLeft > 0 && (
                                    <div className="w-full border-b-2 border-dashed border-[#172B3A]/60 flex items-center justify-between px-1">
                                      <span className="text-[9px] font-mono text-[#172B3A]">◄</span>
                                      <span className="px-1 py-0.5 bg-[#F5F6F4] border border-[#E3E7E5] text-[9px] sm:text-[10px] font-mono font-bold text-[#172B3A] rounded-sm whitespace-nowrap">
                                        d_kiri: {distLeft} cm
                                      </span>
                                      <span className="text-[9px] font-mono text-[#172B3A]">►</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* CARDBOARD BOXES (Muncul langsung menempel di dinding/stoper) */}
                              <div
                                style={{ width: `${occupiedPct}%` }}
                                className="h-16 flex items-stretch gap-1 px-0.5 transition-all duration-500 ease-out"
                              >
                                {Array.from({ length: itemCount }).map((_, boxIdx) => (
                                  <div
                                    key={boxIdx}
                                    className="flex-1 bg-[#DFB982] border-2 border-[#8C6239] rounded-[2px] relative flex flex-col items-center justify-between p-1 shadow-inner overflow-hidden transition-all duration-300 transform scale-100 animate-in fade-in"
                                  >
                                    <div className="w-1/2 h-1 bg-[#C69C6D] border-x border-[#8C6239]/40" />
                                    <div className="text-center leading-tight">
                                      <div className="text-[9px] sm:text-[10px] font-mono font-bold text-[#3E2723]">
                                        {row.sku}
                                      </div>
                                      <div className="text-[8px] sm:text-[9px] font-mono text-[#5D4037] hidden sm:block">
                                        {row.product.lengthCm}cm
                                      </div>
                                    </div>
                                    <div className="text-[7px] sm:text-[8px] font-mono text-[#5D4037] bg-white/60 px-1 rounded-[1px]">
                                      #{boxIdx + 1}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* RIGHT DISTANCE ZONE (jika kardus menempel di kiri) */}
                              {isAlignedLeft && rightPct > 0 && (
                                <div
                                  style={{ width: `${rightPct}%` }}
                                  className="h-full flex flex-col justify-center items-center relative overflow-hidden transition-all duration-500 ease-out"
                                >
                                  {distRight > 0 ? (
                                    <div className="w-full border-b-2 border-dashed border-[#172B3A]/60 flex items-center justify-between px-1">
                                      <span className="text-[9px] font-mono text-[#172B3A]">◄</span>
                                      <span className="px-1 py-0.5 bg-[#F5F6F4] border border-[#E3E7E5] text-[9px] sm:text-[10px] font-mono font-bold text-[#172B3A] rounded-sm whitespace-nowrap">
                                        d_kanan: {distRight} cm
                                      </span>
                                      <span className="text-[9px] font-mono text-[#172B3A]">►</span>
                                    </div>
                                  ) : (
                                    <div className="text-[9px] font-mono text-[#66856A] font-bold">
                                      0cm
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Steel Shelf Profile */}
                      <div className="h-3.5 bg-[#6E7A80] border-t border-[#4A5559] flex items-center justify-between px-3 text-[8px] sm:text-[9px] font-mono text-white">
                        <span>PROFIL AMBALAN {row.rowId}</span>
                        <span>PANJANG: {row.rowSpanCm} CM</span>
                        <span className="hidden sm:inline">UPDATE: {row.lastUpdated.split(' ')[1]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* HARDWARE CALLOUTS MOUNTED ON RIGHT POST */}
              <div className="absolute right-0 top-12 w-24 sm:w-28 space-y-4">
                {/* ESP32 Controller */}
                <div className="p-2 bg-[#172B3A] text-white border border-[#0F1E29] rounded-sm text-[10px] font-mono shadow-sm relative">
                  <div className="w-2 sm:w-3 h-[2px] bg-[#172B3A] absolute -left-2 sm:-left-3 top-4" />
                  <div className="flex items-center gap-1 text-[#66856A] font-bold text-[9px] sm:text-[10px]">
                    <Cpu className="w-3 h-3" />
                    <span>ESP32 NODE</span>
                  </div>
                  <div className="text-[8px] sm:text-[9px] text-slate-300 mt-1">
                    6x US + MQ2 + DHT11
                  </div>
                  <div className="text-[8px] sm:text-[9px] text-[#66856A] mt-0.5">Wi-Fi / MQTT</div>
                </div>

                {/* Gas Monitoring */}
                <div className="p-2 bg-white border border-[#E3E7E5] rounded-sm text-[9px] sm:text-[10px] font-mono shadow-sm relative">
                  <div className="w-2 sm:w-3 h-[2px] bg-[#4A5559] absolute -left-2 sm:-left-3 top-4" />
                  <div className="font-bold text-[#263238] truncate">Sensor Gas</div>
                  <div className="text-xs font-bold text-[#172B3A] mt-0.5">{envData.gasPpm} ppm</div>
                  <div className="mt-1">
                    <StatusBadge status={gasStatus} />
                  </div>
                </div>

                {/* Temperature & Humidity (DHT11) */}
                <div className="p-2 bg-white border border-[#E3E7E5] rounded-sm text-[9px] sm:text-[10px] font-mono shadow-sm relative">
                  <div className="w-2 sm:w-3 h-[2px] bg-[#4A5559] absolute -left-2 sm:-left-3 top-4" />
                  <div className="font-bold text-[#263238] truncate">Sensor DHT11</div>
                  <div className="text-[#172B3A] font-bold mt-1 text-[9px] sm:text-xs">
                    {(telemetryPayload?.environment?.temperature_c ?? envData.temperatureC).toFixed(1)}°C / {telemetryPayload?.environment?.humidity_pct ?? envData.humidityRh}%RH
                  </div>
                  <div className="text-[8px] sm:text-[9px] text-[#77827D] mt-0.5">GPIO 04 (1-Wire)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Quick Row Controls */}
          <div className="mt-6 pt-4 border-t border-[#E3E7E5] flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs font-mono text-[#77827D]">
              Baris Terpilih: <strong className="text-[#172B3A]">{selectedRow.rowId}</strong> — Uji coba penambahan/pengambilan kardus:
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onStepRowBox(selectedRow.rowId, -1)}
                disabled={selectedRow.estimatedStock <= 0}
                className="px-3 py-1.5 text-xs font-mono font-semibold bg-[#F5F6F4] border border-[#E3E7E5] hover:border-[#172B3A] rounded-sm disabled:opacity-40"
              >
                -1 Ambil Kardus ({selectedRow.rowId})
              </button>
              <button
                onClick={() => onStepRowBox(selectedRow.rowId, +1)}
                disabled={selectedRow.estimatedStock >= selectedRow.capacity}
                className="px-3 py-1.5 text-xs font-mono font-semibold bg-[#172B3A] text-white rounded-sm hover:bg-[#223d52] disabled:opacity-40"
              >
                +1 Tambah Kardus ({selectedRow.rowId})
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT 1 COLUMN: SELECTED ROW DETAIL INSPECTOR */}
        <div className="bg-white border border-[#E3E7E5] rounded-sm flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 bg-[#172B3A] text-white flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-300">
                  INSPEKTOR TELEMETRI &amp; KALKULASI BARIS
                </div>
                <h3 className="text-base font-bold font-mono mt-0.5">
                  {selectedRow.rowId} — {selectedRow.sku}
                </h3>
              </div>
              <StatusBadge status={selectedRow.status} />
            </div>

            <div className="p-4 sm:p-5 space-y-5">
              {/* Assigned Product Summary */}
              <div className="p-3.5 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-[#77827D]">SKU yang Ditetapkan</span>
                  <span className="text-xs font-mono font-bold text-[#172B3A]">{selectedRow.sku}</span>
                </div>
                <div className="text-sm font-bold text-[#263238]">{selectedRow.product.name}</div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E3E7E5] text-center font-mono">
                  <div className="bg-white p-1.5 border border-[#E3E7E5] rounded-sm">
                    <div className="text-[10px] text-[#77827D]">Panjang Aksial</div>
                    <div className="text-xs font-bold text-[#172B3A]">{selectedRow.product.lengthCm} cm</div>
                  </div>
                  <div className="bg-white p-1.5 border border-[#E3E7E5] rounded-sm">
                    <div className="text-[10px] text-[#77827D]">Lebar</div>
                    <div className="text-xs font-bold text-[#263238]">{selectedRow.product.widthCm} cm</div>
                  </div>
                  <div className="bg-white p-1.5 border border-[#E3E7E5] rounded-sm">
                    <div className="text-[10px] text-[#77827D]">Tinggi</div>
                    <div className="text-xs font-bold text-[#263238]">{selectedRow.product.heightCm} cm</div>
                  </div>
                </div>
              </div>

              {/* Paired Ultrasonic Distance Readings & Interactive Sliders */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold uppercase text-[#263238] flex items-center justify-between">
                  <span>Pembacaan Jarak Sensor Ultrasonik</span>
                  <span className="text-[11px] font-normal text-[#77827D]">Uji Interaktif</span>
                </div>

                {/* Left Sensor Card */}
                <div className="p-3 border border-[#E3E7E5] rounded-sm space-y-2">
                  <div className="flex items-center justify-between font-mono">
                    <div>
                      <span className="text-xs font-bold text-[#172B3A]">{selectedRow.leftSensorId}</span>
                      <span className="text-xs text-[#77827D]"> • Ujung Kiri Rak</span>
                    </div>
                    <span className="text-sm font-bold text-[#263238] tabular-nums">
                      {selDistLeft} cm
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={selectedRow.rowSpanCm}
                    step={1}
                    value={selDistLeft}
                    onChange={(e) =>
                      onUpdateDistances(
                        selectedRow.rowId,
                        Number(e.target.value),
                        selDistRight,
                        `${selectedRow.leftSensorId} Inspektor`
                      )
                    }
                    className="w-full accent-[#172B3A] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Right Sensor Card */}
                <div className="p-3 border border-[#E3E7E5] rounded-sm space-y-2">
                  <div className="flex items-center justify-between font-mono">
                    <div>
                      <span className="text-xs font-bold text-[#172B3A]">{selectedRow.rightSensorId}</span>
                      <span className="text-xs text-[#77827D]"> • Ujung Kanan Rak</span>
                    </div>
                    <span className="text-sm font-bold text-[#263238] tabular-nums">
                      {selDistRight} cm
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={selectedRow.rowSpanCm}
                    step={1}
                    value={selDistRight}
                    onChange={(e) =>
                      onUpdateDistances(
                        selectedRow.rowId,
                        selDistLeft,
                        Number(e.target.value),
                        `${selectedRow.rightSensorId} Inspektor`
                      )
                    }
                    className="w-full accent-[#172B3A] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Step-by-Step Mathematical Stock Estimation Breakdown */}
              <div className="p-4 bg-[#172B3A]/[0.04] border border-[#172B3A]/20 rounded-sm space-y-2.5 font-mono">
                <div className="text-xs font-bold uppercase text-[#172B3A] flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Rincian Rumus Kalkulasi Stok</span>
                </div>

                <div className="text-[11px] space-y-1.5 text-[#263238] pt-1">
                  <div className="flex justify-between">
                    <span className="text-[#77827D]">1. Panjang Efektif Rak:</span>
                    <span className="font-semibold">{selectedRow.rowSpanCm} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77827D]">
                      2. Total Ruang Kosong ({selectedRow.leftSensorId} + {selectedRow.rightSensorId}):
                    </span>
                    <span className="font-semibold">
                      {selDistLeft} + {selDistRight} ={' '}
                      {Number((selDistLeft + selDistRight).toFixed(1))} cm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77827D]">3. Ruang Terisi Kardus:</span>
                    <span className="font-semibold">
                      {selectedRow.rowSpanCm} - {Number((selDistLeft + selDistRight).toFixed(1))} ={' '}
                      {selOccupiedSpan} cm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77827D]">4. Dibagi Panjang Kardus:</span>
                    <span className="font-semibold">
                      {selOccupiedSpan} / {selectedRow.product.lengthCm} cm ={' '}
                      {(selOccupiedSpan / (selectedRow.product.lengthCm || 1)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#172B3A]/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#172B3A]">ESTIMASI STOK BARIS:</span>
                  <span className="text-sm sm:text-base font-bold text-[#172B3A] bg-white px-2.5 py-0.5 border border-[#172B3A]/30 rounded-sm">
                    {selItemCount} / {selectedRow.capacity} Kardus ({selOccupancyPct}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 bg-[#F5F6F4] border-t border-[#E3E7E5] flex items-center justify-between text-[11px] font-mono text-[#77827D]">
            <span>Update Terakhir: {selectedRow.lastUpdated}</span>
            <span>GPIO ESP32 Terverifikasi</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RackMonitoringPage;
