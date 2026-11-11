import React from 'react';
import { Sliders, X } from 'lucide-react';
import { EnrichedRow, EnvData } from '../../types';
import StatusBadge from '../ui/StatusBadge';

interface SimulatorDrawerProps {
  show: boolean;
  onClose: () => void;
  enrichedRows: EnrichedRow[];
  onUpdateRowDistances: (rowId: string, newLeftCm: number, newRightCm: number, sourceLabel?: string) => void;
  onStepRowBox: (rowId: string, deltaBoxes: number) => void;
  envData: EnvData;
  setEnvData: React.Dispatch<React.SetStateAction<EnvData>>;
  gasStatus: string;
}

export const SimulatorDrawer: React.FC<SimulatorDrawerProps> = ({
  show,
  onClose,
  enrichedRows,
  onUpdateRowDistances,
  onStepRowBox,
  envData,
  setEnvData,
  gasStatus
}) => {
  if (!show) return null;

  return (
    <div className="bg-white border-b-2 border-orange-600 px-4 sm:px-6 py-4 shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-orange-600" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1C100C]">
            Simulator Interaktif Jarak Ultrasonik &amp; Lingkungan
          </h3>
          <span className="text-xs text-[#77827D] hidden md:inline">
            — Geser jarak sensor (`d_left`, `d_right`) untuk menguji kalkulasi jumlah kardus dan pencatatan riwayat stok otomatis
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-mono text-[#77827D] hover:text-[#1C100C] flex items-center gap-1"
        >
          <X className="w-4 h-4" /> Tutup
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {enrichedRows.map((r) => (
          <div key={r.rowId} className="p-3 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-orange-700">
                {r.rowId} ({r.sku})
              </span>
              <span className="text-xs font-mono font-semibold text-[#1C100C]">
                Stok: {r.estimatedStock}/{r.capacity}
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#77827D]">
              Lebar: {r.rowSpanCm}cm | Kardus: {r.product.lengthCm}cm
            </div>
            <div className="space-y-1.5 pt-1">
              <div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span>{r.leftSensorId} (Kiri):</span>
                  <span className="font-bold">{r.leftDistanceCm} cm</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={r.rowSpanCm}
                  step={5}
                  value={r.leftDistanceCm}
                  onChange={(e) =>
                    onUpdateRowDistances(r.rowId, Number(e.target.value), r.rightDistanceCm, 'Simulator Slider')
                  }
                  className="w-full accent-orange-600 h-1.5 bg-gray-300 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span>{r.rightSensorId} (Kanan):</span>
                  <span className="font-bold">{r.rightDistanceCm} cm</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={r.rowSpanCm}
                  step={5}
                  value={r.rightDistanceCm}
                  onChange={(e) =>
                    onUpdateRowDistances(r.rowId, r.leftDistanceCm, Number(e.target.value), 'Simulator Slider')
                  }
                  className="w-full accent-orange-600 h-1.5 bg-gray-300 rounded-lg cursor-pointer"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#E3E7E5]">
              <button
                onClick={() => onStepRowBox(r.rowId, -1)}
                disabled={r.estimatedStock <= 0}
                className="px-2 py-0.5 text-[11px] font-mono bg-white border border-[#E3E7E5] rounded-sm hover:border-orange-500 disabled:opacity-40"
              >
                -1 Kardus (Ambil)
              </button>
              <button
                onClick={() => onStepRowBox(r.rowId, +1)}
                disabled={r.estimatedStock >= r.capacity}
                className="px-2 py-0.5 text-[11px] font-mono bg-white border border-[#E3E7E5] rounded-sm hover:border-orange-500 disabled:opacity-40"
              >
                +1 Kardus (Tambah)
              </button>
            </div>
          </div>
        ))}

        {/* Environmental Simulator Controls */}
        <div className="p-3 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-orange-700">
              Simulasi Udara &amp; Gas
            </span>
            <StatusBadge status={gasStatus} />
          </div>
          <div>
            <div className="flex justify-between text-[11px] font-mono">
              <span>Konsentrasi Gas (GAS-01):</span>
              <span className="font-bold">{envData.gasPpm} ppm</span>
            </div>
            <input
              type="range"
              min={100}
              max={800}
              step={5}
              value={envData.gasPpm}
              onChange={(e) =>
                setEnvData((prev) => ({ ...prev, gasPpm: Number(e.target.value) }))
              }
              className="w-full accent-[#C85C54] h-1.5 bg-gray-300 rounded-lg cursor-pointer"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[10px] font-mono text-[#77827D]">Temp (°C)</label>
              <input
                type="number"
                step="0.5"
                value={envData.temperatureC}
                onChange={(e) =>
                  setEnvData((prev) => ({ ...prev, temperatureC: Number(e.target.value) }))
                }
                className="w-full px-2 py-1 text-xs font-mono bg-white border border-[#E3E7E5] rounded-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-[#77827D]">Humidity (%RH)</label>
              <input
                type="number"
                step="1"
                value={envData.humidityRh}
                onChange={(e) =>
                  setEnvData((prev) => ({ ...prev, humidityRh: Number(e.target.value) }))
                }
                className="w-full px-2 py-1 text-xs font-mono bg-white border border-[#E3E7E5] rounded-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulatorDrawer;

