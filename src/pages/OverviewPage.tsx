
import React, { useState } from 'react';
import {
  Package,
  Layers,
  Flame,
  Thermometer,
  Droplets,
  Play,
  ChevronRight
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
import { EnrichedRow, SummaryMetrics, EnvData, InventoryHistory, EnvHistoryPoint, TelemetryPayload, LedColor } from '../types';
import StatusBadge from '../components/ui/StatusBadge';

interface OverviewPageProps {
  enrichedRows: EnrichedRow[];
  summaryMetrics: SummaryMetrics;
  envData: EnvData;
  gasStatus: string;
  inventoryHistory: InventoryHistory[];
  envHistory: EnvHistoryPoint[];
  onInspectRow: (rowId: string) => void;
  onNavigate: (page: string) => void;
  onStepRowBox: (rowId: string, deltaBoxes: number) => void;
  onOpenTutorial?: () => void;
  telemetryPayload?: TelemetryPayload;
}

const SHELF_SPAN_CM = 58.0; // Dimensi mutlak panjang ambalan fisik rak

export const OverviewPage: React.FC<OverviewPageProps> = ({
  enrichedRows,
  summaryMetrics,
  envData,
  gasStatus,
  inventoryHistory,
  envHistory,
  onInspectRow,
  onNavigate,
  onOpenTutorial,
  telemetryPayload
}) => {
  // Edge Telemetry Metric values
  const totalItems = telemetryPayload?.summary?.total_items ?? summaryMetrics.totalStock;
  const occupiedFloors = telemetryPayload?.summary?.occupied_floors ?? summaryMetrics.activeRowsCount;
  const totalCapacity = summaryMetrics.totalCapacity || 12;
  const temperatureC = telemetryPayload?.environment?.temperature_c ?? envData.temperatureC;
  const humidityPct = telemetryPayload?.environment?.humidity_pct ?? envData.humidityRh;
  const gasRaw = telemetryPayload?.environment?.gas_raw ?? envData.gasPpm;
  const gasPct = telemetryPayload?.environment?.gas_pct ?? Number(((gasRaw / 1000) * 100).toFixed(1));

  const renderLedBadge = (color?: LedColor) => {
    switch (color) {
      case 'GREEN':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#66856A]/10 text-[#66856A] border border-[#66856A]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#66856A]" />
            LED: GREEN
          </span>
        );
      case 'BLUE':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            LED: BLUE
          </span>
        );
      case 'BLINK_RED':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
            LED: BLINK RED
          </span>
        );
      case 'RED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            LED: RED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* A. COMPACT SUMMARY METRICS (4-Column Strip) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Inventory */}
        <div className="bg-white border border-[#E3E7E5] p-4 rounded-sm shadow-xs hover:border-orange-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#77827D]">
              Total Stok Barang
            </span>
            <div className="w-8 h-8 rounded-sm bg-orange-50 border border-orange-200 flex items-center justify-center">
              <Package className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-[#1C100C] tabular-nums">
              {totalItems}{' '}
              <span className="text-sm font-normal text-[#77827D]">
                / {totalCapacity} Kardus
              </span>
            </div>
            <span className="text-xs font-mono font-semibold text-orange-700">
              {totalCapacity > 0
                ? Math.round((totalItems / totalCapacity) * 100)
                : 0}% Kapasitas
            </span>
          </div>
          <div className="mt-2.5 w-full h-1.5 bg-[#F5F6F4] rounded-none overflow-hidden border border-[#E3E7E5]">
            <div
              className="h-full bg-gradient-to-r from-orange-600 to-amber-600 transition-all duration-300"
              style={{
                width: `${
                  totalCapacity > 0
                    ? (totalItems / totalCapacity) * 100
                    : 0
                }%`
              }}
            />
          </div>
        </div>

        {/* Metric 2: Active Rack Rows */}
        <div className="bg-white border border-[#E3E7E5] p-4 rounded-sm shadow-xs hover:border-orange-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#77827D]">
              Baris Rak Terisi
            </span>
            <div className="w-8 h-8 rounded-sm bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Layers className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-[#1C100C] tabular-nums">
              {occupiedFloors}{' '}
              <span className="text-sm font-normal text-[#77827D]">
                / 3 Lantai Terisi
              </span>
            </div>
            <span className="text-xs font-mono text-orange-700 font-semibold bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">RACK-001</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-[11px] font-mono text-[#77827D] overflow-x-auto">
            {enrichedRows.map((r) => (
              <span
                key={r.rowId}
                className={`px-1.5 py-0.5 border rounded-sm whitespace-nowrap ${
                  r.estimatedStock > 0
                    ? 'bg-orange-500/10 text-orange-900 border-orange-500/30 font-semibold'
                    : 'bg-gray-50 text-[#77827D] border-[#E3E7E5]'
                }`}
              >
                {r.rowId}: {r.estimatedStock}
              </span>
            ))}
          </div>
        </div>

        {/* Metric 3: Gas Sensor Status */}
        <div className="bg-white border border-[#E3E7E5] p-4 rounded-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#77827D]">
              Status Kebocoran Gas
            </span>
            <Flame className={`w-4 h-4 ${gasStatus === 'Normal' ? 'text-[#66856A]' : 'text-[#C85C54]'}`} />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-2xl font-bold font-mono text-[#263238] tabular-nums">
              {gasRaw} <span className="text-sm font-normal text-[#77827D]">ppm ({gasPct}%)</span>
            </div>
            <StatusBadge status={gasStatus} />
          </div>
          <div className="mt-2.5 text-[11px] font-mono text-[#77827D] flex justify-between">
            <span>Waspada: {envData.gasWarningThreshold} ppm</span>
            <span>Bahaya: {envData.gasDangerThreshold} ppm</span>
          </div>
        </div>

        {/* Metric 4: Ambient Temperature & Humidity (DHT11) */}
        <div className="bg-white border border-[#E3E7E5] p-4 rounded-sm shadow-xs hover:border-orange-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#77827D]">
              Kondisi Lingkungan (DHT11)
            </span>
            <div className="w-8 h-8 rounded-sm bg-rose-50 border border-rose-200 flex items-center justify-center">
              <Thermometer className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-[#1C100C] tabular-nums">
              {temperatureC.toFixed(1)} °C
            </div>
            <div className="text-lg font-bold font-mono text-orange-700 tabular-nums">
              {humidityPct} %RH
            </div>
          </div>
          <div className="mt-2.5 text-[11px] font-mono text-[#77827D] flex items-center justify-between">
            <span>Sensor: ENV-01 (DHT11)</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">Udara Sekitar</span>
          </div>
        </div>
      </div>

      {/* B & C. RACK INVENTORY OVERVIEW + ENVIRONMENTAL MONITORING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* B. Rack Inventory Overview (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white border border-[#E3E7E5] rounded-sm flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-[#E3E7E5] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#263238] uppercase tracking-wider font-mono">
                  Ringkasan Inventaris &amp; Telemetri Ultrasonik RACK-001
                </h2>
                <p className="text-xs text-[#77827D] mt-0.5">
                  Penyimpanan kardus horizontal satu baris diukur oleh pasangan sensor ultrasonik kiri &amp; kanan.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {onOpenTutorial && (
                  <button
                    onClick={onOpenTutorial}
                    className="px-3 py-1.5 text-xs font-mono font-semibold bg-[#F5F6F4] text-[#1C100C] border border-orange-900/20 hover:bg-[#1C100C] hover:text-white rounded-sm flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Buka panduan interaktif penggunaan rak"
                  >
                    <Play className="w-3.5 h-3.5 text-amber-600" />
                    <span>Petunjuk Penggunaan Rak</span>
                  </button>
                )}
                <button
                  onClick={() => onNavigate('rack')}
                  className="px-3 py-1.5 text-xs font-mono font-semibold bg-[#1C100C] hover:bg-[#2E180E] text-white rounded-sm flex items-center gap-1.5 shadow-sm border border-orange-950"
                >
                  <span>Buka Tampilan 3D / CAD Rak</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Clean Visual Rack Schematic Strip */}
            <div className="p-5 space-y-4">
              {enrichedRows.map((row) => (
                <div
                  key={row.rowId}
                  className="border border-[#E3E7E5] bg-[#F5F6F4]/60 rounded-sm p-4 hover:border-orange-500/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E3E7E5]">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-[#1C100C] text-orange-200 text-xs font-mono font-bold rounded-sm border border-orange-900/40">
                        {row.rowId}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-[#1C100C] flex items-center gap-2">
                          <span>{row.product.name}</span>
                          <span className="font-mono text-[11px] text-[#77827D] bg-white px-1.5 py-0.5 border border-[#E3E7E5] rounded-sm">
                            {row.sku}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[#77827D] mt-0.5">
                          Panjang Kardus: <strong className="text-[#1C100C]">{row.product.lengthCm} cm</strong> • Lebar Rak: {row.rowSpanCm} cm
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {renderLedBadge(row.led_color)}
                      <div className="text-right font-mono">
                        <div className="text-[10px] uppercase text-[#77827D]">Total Stok Baris</div>
                        <div className="text-sm font-bold text-[#1C100C] tabular-nums">
                          {row.estimatedStock} / {row.capacity} Kardus ({row.occupancyPct}%)
                        </div>
                      </div>
                      <StatusBadge status={row.status} />
                      <button
                        onClick={() => onInspectRow(row.rowId)}
                        className="px-2.5 py-1 text-xs font-mono bg-white border border-[#E3E7E5] hover:border-orange-500 hover:text-orange-600 text-[#1C100C] rounded-sm transition-colors"
                      >
                        Periksa
                      </button>
                    </div>
                  </div>

                  {/* Row Ultrasonic Schematic Bar */}
                  <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    {/* Left Sensor Tag */}
                    <div className="sm:w-28 shrink-0 bg-white border border-[#E3E7E5] px-2.5 py-1.5 rounded-sm font-mono flex sm:block justify-between items-center">
                      <div className="text-[10px] text-[#77827D] flex items-center gap-1.5 sm:justify-between">
                        <span>{row.leftSensorId} (Kiri)</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <div className="text-xs font-bold text-[#1C100C] tabular-nums sm:mt-0.5">
                        {row.leftDistanceCm} cm
                      </div>
                    </div>

                    {/* Visual Shelf Representation */}
                    <div className="flex-1 h-11 bg-white border border-[#E3E7E5] rounded-sm relative flex items-center overflow-hidden min-h-[44px]">
                      {row.estimatedStock === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-[#77827D] italic bg-orange-950/[0.02]">
                          — BARIS KOSONG (0 KARDUS) —
                        </div>
                      ) : (
                        (() => {
                          const isAlignedLeft = row.leftDistanceCm <= row.rightDistanceCm;
                          const occupiedPct = Math.min(100, Math.max(0, (row.occupiedSpan / row.rowSpanCm) * 100));
                          const emptyPct = Math.max(0, 100 - occupiedPct);

                          return (
                            <div className="w-full h-full flex items-center">
                              {/* If stacked from right, empty gap is on the left */}
                              {!isAlignedLeft && (
                                <div
                                  style={{ width: `${emptyPct}%` }}
                                  className="h-full flex items-center justify-center border-r border-dashed border-orange-900/30 bg-orange-900/[0.03] text-[10px] font-mono text-[#77827D] overflow-hidden transition-all duration-500 ease-out"
                                >
                                  {row.leftDistanceCm > 0 && `◄ ${row.leftDistanceCm} cm`}
                                </div>
                              )}

                              {/* Cardboard Boxes Block (Directly attached to wall) */}
                              <div
                                style={{ width: `${occupiedPct}%` }}
                                className="h-7 flex items-center gap-1 px-1 transition-all duration-500 ease-out"
                              >
                                {Array.from({ length: row.estimatedStock }).map((_, idx) => (
                                  <div
                                    key={idx}
                                    className="flex-1 h-full bg-[#D6A34A]/30 border-2 border-[#9A6E1F] rounded-[2px] flex items-center justify-center text-[10px] font-mono font-bold text-[#6E4D12] shadow-xs transition-all duration-300 transform scale-100 animate-in fade-in"
                                    title={`${row.sku} Kardus #${idx + 1} (${row.product.lengthCm}cm)`}
                                  >
                                    #{idx + 1}
                                  </div>
                                ))}
                              </div>

                              {/* If stacked from left, empty gap is on the right */}
                              {isAlignedLeft && (
                                <div
                                  style={{ width: `${emptyPct}%` }}
                                  className="h-full flex items-center justify-center border-l border-dashed border-orange-900/30 bg-orange-900/[0.03] text-[10px] font-mono text-[#77827D] overflow-hidden transition-all duration-500 ease-out"
                                >
                                  {row.rightDistanceCm > 0 && `${row.rightDistanceCm} cm ►`}
                                </div>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </div>

                    {/* Right Sensor Tag */}
                    <div className="sm:w-28 shrink-0 bg-white border border-[#E3E7E5] px-2.5 py-1.5 rounded-sm font-mono flex sm:block justify-between items-center sm:text-right">
                      <div className="text-[10px] text-[#77827D] flex items-center gap-1.5 sm:justify-between">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{row.rightSensorId} (Kanan)</span>
                      </div>
                      <div className="text-xs font-bold text-[#1C100C] tabular-nums sm:mt-0.5">
                        {row.rightDistanceCm} cm
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note clarifying stock counting logic */}
          <div className="px-5 py-3 bg-[#F5F6F4] border-t border-[#E3E7E5] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#77827D]">
            <span>
              Rumus Stok: Estimasi Kardus = round((LebarRak - (d_kiri + d_kanan)) / PanjangKardus)
            </span>
            <span>1 SKU per Baris • Penghitungan Kardus Terpadu</span>
          </div>
        </div>

        {/* C. Environmental Monitoring Panel */}
        <div className="bg-white border border-[#E3E7E5] rounded-sm flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-[#E3E7E5] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#263238] uppercase tracking-wider font-mono">
                  Telemetri Lingkungan
                </h2>
                <p className="text-xs text-[#77827D] mt-0.5">
                  Node keselamatan kebocoran gas &amp; udara gudang
                </p>
              </div>
              <button
                onClick={() => onNavigate('sensors')}
                className="text-xs font-mono font-semibold text-orange-600 hover:text-orange-700 hover:underline"
              >
                Konfigurasi →
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Gas Leakage Monitoring Box */}
              <div className="p-3.5 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-bold font-mono text-[#1C100C]">
                      Monitoring Kebocoran Gas
                    </span>
                  </div>
                  <StatusBadge status={gasStatus} />
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <div className="text-2xl font-bold font-mono text-[#1C100C] tabular-nums">
                      {envData.gasPpm} <span className="text-xs font-normal text-[#77827D]">ppm</span>
                    </div>
                    <div className="text-[11px] font-mono text-[#77827D]">
                      Konsentrasi Gas Terdeteksi (GAS-01)
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px] text-[#77827D]">
                    <div>Waspada: {envData.gasWarningThreshold} ppm</div>
                    <div>Bahaya: {envData.gasDangerThreshold} ppm</div>
                  </div>
                </div>

                {/* Threshold Bar */}
                <div className="mt-3 w-full h-2 bg-white border border-[#E3E7E5] rounded-none overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      gasStatus === 'Danger'
                        ? 'bg-[#C85C54]'
                        : gasStatus === 'Warning'
                        ? 'bg-[#D6A34A]'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, (envData.gasPpm / 800) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Temperature & Humidity Monitoring Box */}
              <div className="p-3.5 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-mono text-[#1C100C]">
                    Monitoring Suhu &amp; Kelembaban
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white border border-[#E3E7E5] text-[#77827D]">
                    Rangka Rak
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-2.5 border border-[#E3E7E5] rounded-sm">
                    <div className="text-[10px] font-mono uppercase text-[#77827D] flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-orange-600" />
                      Suhu Sekitar
                    </div>
                    <div className="text-lg font-bold font-mono text-[#1C100C] mt-1 tabular-nums">
                      {temperatureC.toFixed(1)} °C
                    </div>
                  </div>
                  <div className="bg-white p-2.5 border border-[#E3E7E5] rounded-sm">
                    <div className="text-[10px] font-mono uppercase text-[#77827D] flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-orange-600" />
                      Kelembaban Udara
                    </div>
                    <div className="text-lg font-bold font-mono text-[#1C100C] mt-1 tabular-nums">
                      {humidityPct} %RH
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Historical Trend */}
              <div>
                <div className="text-[11px] font-mono uppercase text-[#77827D] mb-2 flex justify-between">
                  <span>Tren Suhu Lingkungan</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    DHT11 • Real-Time
                  </span>
                </div>
                <div className="h-36 w-full border border-[#E3E7E5] bg-[#F5F6F4]/40 p-2 rounded-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={envHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E3E7E5" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#77827D' }} />
                      <YAxis yAxisId="left" domain={[(dataMin: number) => Math.floor(Math.min(dataMin, 20)), (dataMax: number) => Math.ceil(Math.max(dataMax, 35))]} tick={{ fontSize: 10, fill: '#77827D' }} width={28} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E3E7E5',
                          fontSize: '11px',
                          fontFamily: 'monospace'
                        }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="temp"
                        name="Suhu (°C)"
                        stroke="#EA580C"
                        strokeWidth={2.5}
                        dot={{ r: 2.5, fill: '#EA580C' }}
                        isAnimationActive={true}
                        animationDuration={300}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 bg-[#F5F6F4] border-t border-[#E3E7E5] text-[11px] font-mono text-[#77827D]">
            Terpasang pada tiang samping rak (memantau suhu &amp; gas gudang).
          </div>
        </div>
      </div>

      {/* D. RECENT INVENTORY ACTIVITY TABLE */}
      <div className="bg-white border border-[#E3E7E5] rounded-sm">
        <div className="px-5 py-4 border-b border-[#E3E7E5] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1C100C] uppercase tracking-wider font-mono">
              Aktivitas Inventaris &amp; Log Sensor Terbaru
            </h2>
            <p className="text-xs text-[#77827D] mt-0.5">
              Pencatatan otomatis barang masuk dan keluar berdasarkan selisih jarak sensor ultrasonik
            </p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-mono font-semibold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1"
          >
            <span>Lihat Buku Besar Lengkap ({inventoryHistory.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* MOBILE VIEW: Stacked Activity Cards (Flows downwards, no horizontal scroll) */}
        <div className="md:hidden divide-y divide-[#E3E7E5]">
          {inventoryHistory.slice(0, 5).map((tx) => (
            <div key={tx.id} className="p-4 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1C100C]">{tx.rackId} • {tx.rowId}</span>
                <StatusBadge status={tx.eventType} />
              </div>
              <div className="flex items-center justify-between text-[#77827D]">
                <span>{tx.timestamp}</span>
                <span className="px-1.5 py-0.5 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm font-semibold text-[#263238]">
                  {tx.sku}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-t border-b border-dashed border-[#E3E7E5]">
                <span className="text-[#77827D]">Stok: {tx.prevStock} → <strong className="text-[#263238]">{tx.currentStock}</strong></span>
                <span className={`font-bold ${tx.diff > 0 ? 'text-[#66856A]' : 'text-[#D6A34A]'}`}>
                  {tx.diff > 0 ? `+${tx.diff}` : tx.diff} Kardus
                </span>
              </div>
              <div className="text-[11px] text-[#77827D] break-words">
                <span className="font-semibold text-[#263238]">Pemicu:</span> {tx.trigger}
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP VIEW: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F6F4] border-b border-[#E3E7E5] text-[11px] font-mono uppercase text-[#77827D]">
                <th className="py-2.5 px-4">Waktu</th>
                <th className="py-2.5 px-4">Rak / Baris</th>
                <th className="py-2.5 px-4">SKU Produk</th>
                <th className="py-2.5 px-4">Tipe Kejadian</th>
                <th className="py-2.5 px-4 text-right">Stok Awal</th>
                <th className="py-2.5 px-4 text-right">Stok Akhir</th>
                <th className="py-2.5 px-4 text-right">Selisih</th>
                <th className="py-2.5 px-4">Pemicu Sensor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E7E5] text-xs font-mono">
              {inventoryHistory.slice(0, 5).map((tx) => (
                <tr key={tx.id} className="hover:bg-[#F5F6F4]/60">
                  <td className="py-2.5 px-4 text-[#77827D] tabular-nums whitespace-nowrap">{tx.timestamp}</td>
                  <td className="py-2.5 px-4 font-semibold text-[#263238] whitespace-nowrap">
                    {tx.rackId} • {tx.rowId}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-1.5 py-0.5 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm">
                      {tx.sku}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusBadge status={tx.eventType} />
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums">{tx.prevStock}</td>
                  <td className="py-2.5 px-4 text-right font-bold tabular-nums">{tx.currentStock}</td>
                  <td
                    className={`py-2.5 px-4 text-right font-bold tabular-nums ${
                      tx.diff > 0 ? 'text-[#66856A]' : 'text-[#D6A34A]'
                    }`}
                  >
                    {tx.diff > 0 ? `+${tx.diff}` : tx.diff}
                  </td>
                  <td className="py-2.5 px-4 text-[#77827D] max-w-xs break-words">{tx.trigger}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;

