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
  Cpu,
  Flame,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { OtaStatusInfo } from '../../types';
import { KarhutlaTreeWidget } from './KarhutlaTreeWidget';

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
  isFireAlert?: boolean;
  gasPpm?: number;
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
  onOpenTutorial,
  isFireAlert = false,
  gasPpm = 0
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
      {/* Mobile Backdrop with Warm Charcoal Tint */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#0F0704]/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 lg:w-72 h-screen lg:sticky lg:top-0 bg-gradient-to-b from-[#1C100C] via-[#170C08] to-[#0E0603] text-white flex flex-col justify-between shrink-0 border-r border-[#2E160C] select-none shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Brand Header & Navigation */}
        <div className="flex flex-col">
          <div className="h-16 px-5 flex items-center justify-between border-b border-orange-500/15 bg-gradient-to-r from-orange-950/30 via-transparent to-red-950/20">
            <div className="flex items-center gap-3">
              {/* Flame Ember Logo Badge */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 rounded-sm blur-[3px] opacity-70 group-hover:opacity-100 transition duration-300" />
                <div className="relative w-8 h-8 rounded-sm bg-gradient-to-br from-[#2D1409] via-[#1F0C05] to-[#120602] border border-orange-500/40 flex items-center justify-center text-orange-400 font-mono font-bold text-sm shadow-inner">
                  <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                </div>
              </div>

              <div>
                <div className="font-extrabold tracking-wider text-sm bg-gradient-to-r from-amber-200 via-orange-300 to-red-300 bg-clip-text text-transparent leading-none flex items-center gap-1.5">
                  SMART RACK
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping inline-block" />
                </div>
                <div className="text-[10px] font-mono text-amber-200/60 mt-1 tracking-tight">
                  
                </div>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-amber-300/70 hover:text-white rounded-sm hover:bg-orange-500/20 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Node Hardware Card — Charred Timber & Copper Border */}
          <div className="mx-3 mt-3.5 p-2.5 bg-gradient-to-r from-[#24130A] to-[#1A0C06] border border-orange-500/25 rounded-sm shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-orange-600/10 rounded-full blur-xl group-hover:bg-orange-600/20 transition-all" />
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-amber-200/70">
              <span className="flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-orange-400" />
                ESP32 NODE #01
              </span>
              <span className="text-orange-400 font-bold bg-orange-950/80 px-1.5 py-0.5 rounded-xs border border-orange-500/30">
                ACTIVE
              </span>
            </div>
            <div className="mt-1.5 text-[10px] font-mono text-stone-300 flex items-center justify-between">
              <span className="text-stone-400">Sensor Ambalan:</span>
              <span className="text-amber-300/90 font-medium">6x HC-SR04 • MQ • DHT11</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 px-2.5 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-300/50 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-orange-500" />
              Operasional &amp; Telemetri
            </div>
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600/30 via-red-600/20 to-transparent text-white border-l-[3px] border-orange-500 shadow-[inset_0_1px_1px_rgba(251,146,60,0.2)] font-semibold'
                      : 'text-stone-300 hover:text-white hover:bg-orange-950/30 hover:border-l-2 hover:border-orange-500/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComponent
                      className={`w-4 h-4 transition-transform ${
                        isActive
                          ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)] scale-105'
                          : 'text-stone-400 group-hover:text-orange-300'
                      }`}
                    />
                    <span className={isActive ? 'text-orange-100' : 'text-stone-300'}>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono bg-orange-950/60 text-amber-300/90 border border-orange-500/30 rounded-xs font-semibold">
                      {item.badge}
                    </span>
                  )}
                  {item.alertCount && item.alertCount > 0 ? (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xs font-bold animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.5)]">
                      {item.alertCount} ALERT
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
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-sm text-amber-200 bg-gradient-to-r from-orange-950/40 to-red-950/30 hover:from-orange-900/50 hover:to-red-900/40 border border-orange-500/30 transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                    <span>Panduan Penggunaan</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] font-mono bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xs uppercase font-bold tracking-wider shadow-xs">
                    Buka
                  </span>
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* MIDDLE AREA: DYNAMIC SEAMLESS KARHUTLA TREE SILHOUETTE (Fills empty space seamlessly, no box) */}
        <KarhutlaTreeWidget isFireAlert={isFireAlert} gasPpm={gasPpm} />

        {/* Bottom Sidebar: System Connection & User Profile (Ember Hearth) */}
        <div className="p-3 border-t border-orange-500/15 bg-gradient-to-b from-[#170C08] to-[#0A0402] space-y-2.5 shrink-0 z-10">
          {/* Connection Status Box - Jalur Telemetri Real-Time */}
          <div className="p-2.5 bg-[#1F0E07]/90 border border-orange-500/25 rounded-sm space-y-2 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-200/80 flex items-center gap-1.5">
                <Radio className={`w-3 h-3 ${isTelemetryLive ? 'text-orange-400 animate-pulse' : 'text-stone-400'}`} />
                Jalur Telemetri
              </span>

              {/* Dynamic status badge */}
              {!isBackendConnected ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-red-300 font-semibold px-1.5 py-0.5 rounded-xs bg-red-950/80 border border-red-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  GATEWAY OFFLINE
                </span>
              ) : isTelemetryLive ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-300 font-semibold px-1.5 py-0.5 rounded-xs bg-emerald-950/80 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  LIVE ESP32
                </span>
              ) : isMqttConnected ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-amber-300 font-semibold px-1.5 py-0.5 rounded-xs bg-amber-950/80 border border-amber-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  STANDBY MQTT
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-amber-400 font-semibold px-1.5 py-0.5 rounded-xs bg-amber-950/80 border border-amber-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  MQTT TERPUTUS
                </span>
              )}
            </div>

            {/* Broker & Protocol Card */}
            {/* <div className="bg-[#120603]/80 p-2 rounded-xs border border-orange-500/15 space-y-1">
              <div className="flex items-center justify-between text-[9px] font-mono text-stone-400">
                <span>Broker MQTT (TLS):</span>
                <span className="text-amber-400 font-semibold">EMQX Cloud</span>
              </div>
              <div
                className="text-[10px] font-mono text-amber-100/90 truncate select-all cursor-text font-medium"
                title={mqttBroker}
              >
                {mqttBroker}
              </div>
              <div className="text-[9px] font-mono text-stone-400 pt-0.5 flex items-center justify-between">
                <span>Topik:</span>
                <span className="text-orange-200/80 font-mono truncate">small_warehouse/telemetry</span>
              </div>
            </div> */}

            {/* Active Sensor Counter */}
            <div className="flex items-center justify-between text-[10px] font-mono text-stone-300 pt-1 border-t border-orange-500/15">
              <span>Status Sensor:</span>
              <span className={`font-semibold ${isTelemetryLive ? 'text-amber-400' : 'text-stone-300'}`}>
                {isTelemetryLive
                  ? `${onlineSensorsCount} / ${totalSensorsCount} Aktif`
                  : isBackendConnected
                  ? 'Menunggu Node ESP32'
                  : '0 / 8 Terputus'}
              </span>
            </div>

            {/* Firmware Version & OTA Over-The-Air Status */}
            <div className="flex items-center justify-between text-[10px] font-mono text-stone-300 pt-1 border-t border-orange-500/15">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-orange-400" />
                Firmware ESP32:
              </span>
              <span className="text-amber-300 font-bold font-mono">
                {firmwareVersion || 'v1.0.7'}
              </span>
            </div>

            {/* Active OTA Update Progress Card */}
            {otaStatus && otaStatus.status !== 'IDLE' && (
              <div className={`p-1.5 rounded-xs text-[9px] font-mono border flex items-center justify-between ${
                otaStatus.status === 'SUCCESS'
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : otaStatus.status === 'FAILED'
                  ? 'bg-red-950/80 border-red-500/50 text-red-300'
                  : 'bg-orange-950/80 border-orange-500/50 text-orange-300 animate-pulse'
              }`}>
                <span className="flex items-center gap-1 font-bold">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    otaStatus.status === 'SUCCESS' ? 'bg-emerald-400' : otaStatus.status === 'FAILED' ? 'bg-red-400' : 'bg-orange-400 animate-ping'
                  }`} />
                  OTA: {otaStatus.status}
                </span>
                <span className="text-[8px] text-stone-400">
                  {otaStatus.status === 'DOWNLOADING' ? 'Mengunduh...' : otaStatus.status === 'BURNING' ? 'Flashing...' : 'Selesai'}
                </span>
              </div>
            )}
          </div>

          {/* User Profile — Firebreak Operator Badge */}
          <div className="flex items-center justify-between px-1 pt-0.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-sm bg-gradient-to-br from-orange-700 via-amber-800 to-red-950 border border-orange-500/30 flex items-center justify-center text-xs font-mono font-bold text-amber-100 shadow-xs">
                TT
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold text-stone-200">TITUT</div>
                <div className="text-[10px] font-mono text-orange-400/80">Smart Small Rack Warehouse</div>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-orange-950/80 border border-orange-500/30 rounded-xs text-amber-300">
              NODE-01
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
