import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Package,
  History,
  Activity,
  Settings as SettingsIcon,
  X,
  BookOpen,
  Radio,
  Cpu
} from 'lucide-react';
import { OtaStatusInfo } from '../../types';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  mqttBroker?: string;
  isBackendConnected?: boolean;
  isMqttConnected?: boolean;
  isTelemetryLive?: boolean;
  firmwareVersion?: string;
  otaStatus?: OtaStatusInfo | null;
  onlineSensorsCount: number;
  totalSensorsCount: number;
  sensorAlertCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenTutorial?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  mqttBroker = 'mqtts://k4366bfc.ala.asia-southeast1.emqxsl.com:8883',
  isBackendConnected = false,
  isMqttConnected = false,
  isTelemetryLive = false,
  firmwareVersion = 'v1.0.7',
  otaStatus = null,
  onlineSensorsCount,
  totalSensorsCount,
  sensorAlertCount,
  mobileOpen,
  onCloseMobile,
  onOpenTutorial
}) => {
  const navItems = [
    { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'rack', label: 'Monitoring Rak', icon: Layers, badge: '3 Baris' },
    { id: 'products', label: 'Manajemen Produk', icon: Package },
    { id: 'history', label: 'Riwayat Stok', icon: History },
    {
      id: 'sensors',
      label: 'Monitoring Sensor',
      icon: Activity,
      alertCount: sensorAlertCount
    },
    { id: 'settings', label: 'Pengaturan', icon: SettingsIcon }
  ];

  const handleNavClick = (id: string) => {
    setActivePage(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#172B3A] text-white flex flex-col justify-between shrink-0 border-r border-[#0F1E29] select-none transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Brand Header */}
        <div>
          <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-[#66856A] flex items-center justify-center text-white font-mono font-bold text-sm border border-white/20">
                SR
              </div>
              <div>
                <div className="font-bold tracking-wider text-sm text-white leading-none">
                  SMART RACK
                </div>
                <div className="text-[11px] font-mono text-slate-300 mt-1">
                  IIoT WMS v2.4 • RACK-001
                </div>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded-sm hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Prototype Mode Notice inside Sidebar */}
          <div className="mx-3 mt-3 p-2.5 bg-[#0F1E29] border border-white/10 rounded-sm">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-300">
              <span>Node Hardware</span>
              <span className="text-[#66856A] font-semibold">ESP32-WROOM</span>
            </div>
            <div className="mt-1 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>6x HC-SR04 • MQ • DHT11</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 px-2 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Operasional &amp; Telemetri
            </div>
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-sm transition-colors ${
                    isActive
                      ? 'bg-white/12 text-white border-l-2 border-[#66856A]'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComponent
                      className={`w-4 h-4 ${isActive ? 'text-[#66856A]' : 'text-slate-400'}`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono bg-white/10 text-slate-200 rounded-sm">
                      {item.badge}
                    </span>
                  )}
                  {item.alertCount && item.alertCount > 0 ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#C85C54] text-white rounded-sm font-bold">
                      {item.alertCount}
                    </span>
                  ) : null}
                </button>
              );
            })}

            {/* Quick Tutorial Opener in Navigation */}
            {onOpenTutorial && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    onOpenTutorial();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-sm text-[#EAE3D2] bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-[#66856A]" />
                    <span>Panduan Penggunaan</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] font-mono bg-[#66856A] text-white rounded-xs uppercase">
                    Buka
                  </span>
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Bottom Sidebar: System Connection & User Profile */}
        <div className="p-3 border-t border-white/10 bg-[#12222E] space-y-3">
          {/* Connection Status Box - Jalur Telemetri Real-Time */}
          <div className="p-2.5 bg-[#172B3A] border border-white/10 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Radio className={`w-3 h-3 ${isTelemetryLive ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                Jalur Telemetri
              </span>

              {/* Dynamic status badge */}
              {!isBackendConnected ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-rose-400 font-semibold px-1.5 py-0.5 rounded-xs bg-rose-950/60 border border-rose-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  GATEWAY OFFLINE
                </span>
              ) : isTelemetryLive ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-400 font-semibold px-1.5 py-0.5 rounded-xs bg-emerald-950/60 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  LIVE ESP32
                </span>
              ) : isMqttConnected ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-amber-300 font-semibold px-1.5 py-0.5 rounded-xs bg-amber-950/60 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  STANDBY MQTT
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-amber-400 font-semibold px-1.5 py-0.5 rounded-xs bg-amber-950/60 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  MQTT TERPUTUS
                </span>
              )}
            </div>

            {/* Broker & Protocol Card */}
            <div className="bg-black/30 p-2 rounded-xs border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                <span>Broker MQTT (TLS):</span>
                <span className="text-emerald-400 font-semibold">EMQX Cloud</span>
              </div>
              <div
                className="text-[10px] font-mono text-slate-200 truncate select-all cursor-text font-medium"
                title={mqttBroker}
              >
                {mqttBroker}
              </div>
              <div className="text-[9px] font-mono text-slate-400 pt-0.5 flex items-center justify-between">
                <span>Topik:</span>
                <span className="text-slate-300 font-mono truncate">small_warehouse/telemetry</span>
              </div>
            </div>

            {/* Active Sensor Counter */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/10">
              <span>Status Sensor:</span>
              <span className={`font-semibold ${isTelemetryLive ? 'text-emerald-400' : 'text-slate-300'}`}>
                {isTelemetryLive
                  ? `${onlineSensorsCount} / ${totalSensorsCount} Aktif`
                  : isBackendConnected
                  ? 'Menunggu Node ESP32'
                  : '0 / 8 Terputus'}
              </span>
            </div>

            {/* Firmware Version & OTA Over-The-Air Status */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/10">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-slate-400" />
                Firmware ESP32:
              </span>
              <span className="text-emerald-400 font-semibold font-mono">
                {firmwareVersion || 'v1.0.7'}
              </span>
            </div>

            {/* Active OTA Update Progress Card */}
            {otaStatus && otaStatus.status !== 'IDLE' && (
              <div className={`p-1.5 rounded-xs text-[9px] font-mono border flex items-center justify-between ${
                otaStatus.status === 'SUCCESS'
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                  : otaStatus.status === 'FAILED'
                  ? 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                  : 'bg-amber-950/70 border-amber-500/50 text-amber-300 animate-pulse'
              }`}>
                <span className="flex items-center gap-1 font-bold">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    otaStatus.status === 'SUCCESS' ? 'bg-emerald-400' : otaStatus.status === 'FAILED' ? 'bg-rose-400' : 'bg-amber-400 animate-ping'
                  }`} />
                  OTA: {otaStatus.status}
                </span>
                <span className="text-[8px] text-slate-400">
                  {otaStatus.status === 'DOWNLOADING' ? 'Mengunduh...' : otaStatus.status === 'BURNING' ? 'Flashing...' : 'Selesai'}
                </span>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-sm bg-slate-700 border border-white/15 flex items-center justify-center text-xs font-mono font-semibold text-white">
                IP
              </div>
              <div className="leading-tight">
                <div className="text-xs font-medium text-white">JQ</div>
                <div className="text-[10px] font-mono text-slate-400">IIoT Systems Lead</div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white/10 rounded-sm text-slate-300">
              OP-01
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
