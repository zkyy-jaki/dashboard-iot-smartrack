import React from 'react';
import {
  Menu,
  Server,
  Sliders,
  Play,
  Pause,
  Wifi,
  BookOpen
} from 'lucide-react';

interface HeaderProps {
  rackId: string;
  currentPageLabel: string;
  firmwareVersion?: string;
  showSimulatorBar: boolean;
  setShowSimulatorBar: React.Dispatch<React.SetStateAction<boolean>>;
  liveSimActive: boolean;
  setLiveSimActive: React.Dispatch<React.SetStateAction<boolean>>;
  lastSyncTime: string;
  isBackendConnected?: boolean;
  onOpenMobileMenu: () => void;
  onOpenTutorial?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  rackId,
  currentPageLabel,
  firmwareVersion = 'v1.0.7',
  showSimulatorBar,
  setShowSimulatorBar,
  liveSimActive,
  setLiveSimActive,
  lastSyncTime,
  isBackendConnected = false,
  onOpenMobileMenu,
  onOpenTutorial
}) => {
  return (
    <header className="h-16 bg-white border-b border-[#E3E7E5] px-4 sm:px-6 flex items-center justify-between shrink-0">
      {/* Left: Hamburger (Mobile) + Page Title & Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 -ml-1 text-[#263238] hover:bg-[#F5F6F4] rounded-sm transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-[#77827D] uppercase tracking-wider truncate">
            <span className="hidden sm:inline">GUDANG</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-[#172B3A] font-semibold">{rackId}</span>
            <span>/</span>
            <span className="truncate">{currentPageLabel}</span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-[#263238] tracking-tight mt-0.5 truncate">
            {currentPageLabel}
          </h1>
        </div>

        <div className="h-6 w-[1px] bg-[#E3E7E5] mx-1 hidden md:block" />

        {/* Rack Identifier Badge */}
        <div className="hidden md:flex items-center gap-2 bg-[#F5F6F4] border border-[#E3E7E5] px-2.5 py-1 rounded-sm shrink-0">
          <Server className="w-3.5 h-3.5 text-[#172B3A]" />
          {/* <span className="text-xs font-mono font-bold text-[#172B3A]">
            {rackId}
          </span> */}
          <span className="text-[11px] font-mono text-[#77827D] hidden xl:inline">
            (1 Rak • 3 Baris • 6 Sensor US)
          </span>
        </div>

        {/* Firmware Version Badge */}
        <div className="hidden lg:flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-200 px-2 py-1 rounded-sm shrink-0" title="Versi Firmware Aktif ESP32 Over-The-Air">
          <span className="text-[10px] font-mono font-bold text-emerald-800">FW:</span>
          <span className="text-xs font-mono font-bold text-emerald-700">
            {firmwareVersion}
          </span>
        </div>
      </div>

      {/* Right: Simulation Controls, Tutorial Button, Sync Timestamp & Connection Indicator */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Interactive Tutorial Reopen Button */}
        {onOpenTutorial && (
          <button
            onClick={onOpenTutorial}
            className="px-2 sm:px-2.5 py-1.5 text-xs font-mono font-semibold bg-[#172B3A]/5 hover:bg-[#172B3A] hover:text-white text-[#172B3A] border border-[#172B3A]/20 rounded-sm flex items-center gap-1.5 transition-colors shadow-xs"
            title="Buka panduan interaktif penggunaan alat & rak"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#66856A]" />
            <span className="hidden md:inline">Panduan Penggunaan</span>
            <span className="md:hidden">Panduan</span>
          </button>
        )}

        {/* Interactive Telemetry Test Bench Toggle */}
        <button
          onClick={() => setShowSimulatorBar((prev) => !prev)}
          className={`px-2 sm:px-2.5 py-1.5 text-xs font-mono font-medium border rounded-sm flex items-center gap-1.5 transition-colors ${
            showSimulatorBar
              ? 'bg-[#172B3A] text-white border-[#172B3A]'
              : 'bg-[#F5F6F4] text-[#263238] border-[#E3E7E5] hover:bg-gray-200/70'
          }`}
          title="Buka simulator uji coba sensor"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Uji Coba Sensor</span>
        </button>

        {/* Live Pulse Toggle */}
        <button
          onClick={() => setLiveSimActive((prev) => !prev)}
          className={`px-2 sm:px-2.5 py-1.5 text-xs font-mono font-medium border rounded-sm flex items-center gap-1.5 transition-colors ${
            liveSimActive
              ? 'bg-[#66856A] text-white border-[#66856A]'
              : 'bg-white text-[#263238] border-[#E3E7E5] hover:bg-[#F5F6F4]'
          }`}
          title={liveSimActive ? 'Jeda simulasi pulsa' : 'Mulai simulasi pulsa'}
        >
          {liveSimActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{liveSimActive ? 'Telemetri Aktif' : 'Simulasi Pulsa'}</span>
        </button>

        {/* Last Data Sync Time */}
        <div className="hidden lg:flex flex-col items-end text-right border-l border-[#E3E7E5] pl-3">
          <span className="text-[10px] font-mono uppercase text-[#77827D]">
            Sinkronisasi Terakhir
          </span>
          <span className="text-xs font-mono font-semibold text-[#263238] tabular-nums">
            {lastSyncTime}
          </span>
        </div>

        {/* Connection Indicator */}
        <div className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 border rounded-sm ${
          isBackendConnected
            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
            : 'bg-rose-50 border-rose-300 text-rose-700'
        }`}>
          <Wifi className={`w-3.5 h-3.5 ${isBackendConnected ? 'text-emerald-600' : 'text-rose-500'}`} />
          <span className="text-xs font-mono font-semibold hidden sm:inline">
            {isBackendConnected ? 'WS AKTIF' : 'WS TERPUTUS'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
