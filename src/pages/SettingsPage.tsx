import React from 'react';
import { Terminal, Cpu } from 'lucide-react';
import { RackRow, Product, EnvData, SystemConfig, OtaStatusInfo } from '../types';
import { IoTApiService } from '../services/iotApiService';

interface SettingsPageProps {
  rows: RackRow[];
  setRows: React.Dispatch<React.SetStateAction<RackRow[]>>;
  products: Product[];
  envData: EnvData;
  setEnvData: React.Dispatch<React.SetStateAction<EnvData>>;
  systemConfig: SystemConfig;
  setSystemConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
  firmwareVersion?: string;
  otaStatus?: OtaStatusInfo | null;
  triggerToast: (msg: string, type?: 'info' | 'danger') => void;
  onResetDemo: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  rows,
  setRows,
  products,
  envData,
  systemConfig,
  setSystemConfig,
  firmwareVersion = 'v1.0.7',
  otaStatus = null,
  triggerToast,
  onResetDemo
}) => {
  const handleRowConfigChange = (rowId: string, field: string, value: string | number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.rowId === rowId
          ? { ...r, [field]: field === 'sku' ? value : Number(value) }
          : r
      )
    );
    triggerToast(`Updated ${rowId} configuration (${field}: ${value}).`);
  };

  const endpoints = IoTApiService.getEndpointsContract();

  return (
    <div className="space-y-6">
      {/* Row Dimensions & Single-SKU Assignment Configuration */}
      <div className="bg-white border border-[#E3E7E5] rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E3E7E5] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold font-mono uppercase text-[#263238]">
              Dimensi Baris Rak &amp; Penetapan SKU (RACK-001)
            </h2>
            <p className="text-xs text-[#77827D] mt-0.5">
              Setiap baris rak menyimpan satu jenis SKU. Mengubah SKU atau panjang baris rak akan langsung mengkalkulasi ulang stok.
            </p>
          </div>
          <button
            onClick={onResetDemo}
            className="px-3 py-1.5 text-xs font-mono bg-[#F5F6F4] border border-[#E3E7E5] hover:border-[#172B3A] rounded-sm"
          >
            Reset ke Pengaturan Default
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {rows.map((row) => (
            <div key={row.rowId} className="p-4 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[#E3E7E5] pb-2">
                <span className="px-2 py-0.5 bg-[#172B3A] text-white text-xs font-mono font-bold rounded-sm">
                  {row.rowId}
                </span>
                <span className="text-xs font-mono text-[#77827D]">
                  Sensor: {row.leftSensorId} / {row.rightSensorId}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#77827D] mb-1">
                  SKU Produk yang Ditetapkan (1 SKU / Baris)
                </label>
                <select
                  value={row.sku}
                  onChange={(e) => handleRowConfigChange(row.rowId, 'sku', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-[#E3E7E5] rounded-sm font-semibold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.sku}>
                      {p.sku} — {p.name} (L: {p.lengthCm}cm)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#77827D] mb-1">
                    Panjang Baris Rak (cm)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="300"
                    value={row.rowSpanCm}
                    onChange={(e) => handleRowConfigChange(row.rowId, 'rowSpanCm', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-[#E3E7E5] rounded-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#77827D] mb-1">
                    Kapasitas Maksimal Kardus
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={row.capacity}
                    onChange={(e) => handleRowConfigChange(row.rowId, 'capacity', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-[#E3E7E5] rounded-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controller, Thresholds & Notification Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E3E7E5] rounded-sm p-5 space-y-4">
          <h3 className="text-sm font-bold font-mono uppercase text-[#263238] border-b border-[#E3E7E5] pb-3">
            Pengaturan Kontroler ESP32 &amp; Preferensi Notifikasi
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-[#77827D] uppercase mb-1">ID Pengenal Rak (Rack ID)</label>
              <input
                type="text"
                value={systemConfig.rackId}
                onChange={(e) => setSystemConfig({ ...systemConfig, rackId: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm font-semibold text-[#172B3A]"
              />
            </div>
            <div>
              <label className="block text-[#77827D] uppercase mb-1">Interval Polling Telemetri (ms)</label>
              <input
                type="number"
                step="500"
                min="500"
                value={systemConfig.pollingIntervalMs}
                onChange={(e) =>
                  setSystemConfig({ ...systemConfig, pollingIntervalMs: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm font-semibold text-[#172B3A]"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 text-xs">
            <label className="flex items-start sm:items-center justify-between p-2.5 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm cursor-pointer gap-2">
              <div>
                <div className="font-semibold text-[#263238]">
                  Kompensasi Suhu Kecepatan Suara Ultrasonik
                </div>
                <div className="text-[11px] text-[#77827D]">
                  Menggunakan suhu sensor ENV-01 (v = 331.3 + 0.606 * T) untuk menyempurnakan akurasi jarak
                </div>
              </div>
              <input
                type="checkbox"
                checked={systemConfig.tempCompensation}
                onChange={(e) =>
                  setSystemConfig({ ...systemConfig, tempCompensation: e.target.checked })
                }
                className="w-4 h-4 accent-[#172B3A] shrink-0 mt-0.5 sm:mt-0"
              />
            </label>

            <label className="flex items-start sm:items-center justify-between p-2.5 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm cursor-pointer gap-2">
              <div>
                <div className="font-semibold text-[#263238]">
                  Peringatan Bahaya Kebocoran Gas &amp; Sensor Terputus
                </div>
                <div className="text-[11px] text-[#77827D]">
                  Tampilkan banner peringatan instan jika kadar gas melebihi {envData.gasWarningThreshold} ppm
                </div>
              </div>
              <input
                type="checkbox"
                checked={systemConfig.emailAlerts}
                onChange={(e) =>
                  setSystemConfig({ ...systemConfig, emailAlerts: e.target.checked })
                }
                className="w-4 h-4 accent-[#172B3A] shrink-0 mt-0.5 sm:mt-0"
              />
            </label>
          </div>
        </div>

        {/* ESP32 Firmware & OTA Over-The-Air Update Management */}
        <div className="bg-white border border-[#E3E7E5] rounded-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E3E7E5] pb-3">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-[#263238]">
                Firmware ESP32 &amp; Over-The-Air (OTA) Update
              </h3>
              <p className="text-xs text-[#77827D]">
                Update sistem nirkabel via Wi-Fi tanpa perlu mencolokkan kabel USB ke modul ESP32
              </p>
            </div>
            <Cpu className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm space-y-1">
              <span className="text-[#77827D] block uppercase text-[10px]">Versi Firmware Aktif</span>
              <span className="text-base font-bold text-emerald-700">{firmwareVersion || 'v1.0.7'}</span>
              <div className="text-[10px] text-slate-500">Topik: warehouse/small_warehouse/telemetry</div>
            </div>

            <div className="p-3 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm space-y-1">
              <span className="text-[#77827D] block uppercase text-[10px]">Status Terakhir OTA</span>
              <span className={`text-sm font-bold flex items-center gap-1.5 ${
                otaStatus?.status === 'SUCCESS' ? 'text-emerald-600' : otaStatus?.status === 'FAILED' ? 'text-rose-600' : 'text-amber-600'
              }`}>
                <span className="w-2 h-2 rounded-full bg-current" />
                {otaStatus?.status || 'STANDBY / IDLE'}
              </span>
              <div className="text-[10px] text-slate-500">Topik: warehouse/small_warehouse/ota/status</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm text-xs space-y-2">
            <div className="font-semibold text-slate-800">Alur Update Nirkabel (OTA Lifecycle):</div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 overflow-x-auto pb-1">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold shrink-0">TRIGGER</span>
              <span>→</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold shrink-0">DOWNLOADING</span>
              <span>→</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold shrink-0">BURNING</span>
              <span>→</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold shrink-0">SUCCESS</span>
            </div>
          </div>
        </div>

        {/* Node.js Backend REST & WebSocket Integration Contract */}
        <div className="bg-white border border-[#E3E7E5] rounded-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E3E7E5] pb-3">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-[#263238]">
                Kontrak Integrasi Backend API &amp; WebSocket
              </h3>
              <p className="text-xs text-[#77827D]">
                Alur data: Sensor Fisik → ESP32 → MQTT Broker → Node.js Backend → Dashboard
              </p>
            </div>
            <Terminal className="w-4 h-4 text-[#172B3A]" />
          </div>

          <div className="space-y-2 font-mono text-xs">
            {endpoints.map((ep, idx) => (
              <div
                key={idx}
                className="p-2 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-sm shrink-0 ${
                      ep.method === 'GET'
                        ? 'bg-[#172B3A] text-white'
                        : ep.method === 'POST'
                        ? 'bg-[#66856A] text-white'
                        : 'bg-[#D6A34A] text-white'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-semibold text-[#263238] truncate">{ep.path}</span>
                </div>
                <span className="text-[11px] text-[#77827D] hidden sm:inline truncate">
                  {ep.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

