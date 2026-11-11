import React from 'react';
import {
  Menu,
  Server,
  Wifi,
  BookOpen
} from 'lucide-react';

interface HeaderProps {
  rackId: string;
  currentPageLabel: string;
  firmwareVersion?: string;
  lastSyncTime: string;
  isBackendConnected?: boolean;
  onOpenMobileMenu: () => void;
  onOpenTutorial?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  rackId,
  currentPageLabel,
  firmwareVersion = 'v1.0.7',
  lastSyncTime,
  isBackendConnected = false,
  onOpenMobileMenu,
  onOpenTutorial
}) => {
  return (
    <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-orange-900/10 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs">
      {/* Left: Hamburger (Mobile) + Page Title & Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 -ml-1 text-stone-800 hover:bg-orange-50 rounded-sm transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5 text-orange-950" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-stone-500 uppercase tracking-wider truncate">
            <span className="hidden sm:inline">GUDANG</span>
            <span className="hidden sm:inline text-orange-400">/</span>
            <span className="text-orange-950 font-bold">{rackId}</span>
            <span className="text-orange-400">/</span>
            <span className="truncate text-orange-800 font-semibold">{currentPageLabel}</span>
          </div>
          <h1 className="text-sm sm:text-base font-extrabold text-[#1C100C] tracking-tight mt-0.5 truncate">
            {currentPageLabel}
          </h1>
        </div>

        <div className="h-6 w-[1px] bg-orange-200/60 mx-1 hidden md:block" />

        {/* Rack Identifier Badge */}
        <div className="hidden md:flex items-center gap-2 bg-[#26150D]/5 border border-orange-500/20 px-2.5 py-1 rounded-sm shrink-0">
          <Server className="w-3.5 h-3.5 text-orange-700" />
          <span className="text-[11px] font-mono text-stone-500 hidden xl:inline">
            (1 Rak • 3 Baris • 6 Sensor US)
          </span>
        </div>

        {/* Firmware Version Badge */}
        <div className="hidden lg:flex items-center gap-1.5 bg-orange-50 border border-orange-300/80 px-2 py-1 rounded-sm shrink-0 shadow-2xs" title="Versi Firmware Aktif ESP32 Over-The-Air">
          <span className="text-[10px] font-mono font-bold text-orange-800">FW:</span>
          <span className="text-xs font-mono font-bold text-orange-700">
            {firmwareVersion}
          </span>
        </div>
      </div>

      {/* Right: Tutorial Button, Sync Timestamp & Connection Indicator */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Interactive Tutorial Reopen Button */}
        {onOpenTutorial && (
          <button
            onClick={onOpenTutorial}
            className="px-2 sm:px-2.5 py-1.5 text-xs font-mono font-semibold bg-orange-50/80 hover:bg-gradient-to-r hover:from-orange-600 hover:to-red-600 hover:text-white text-orange-950 border border-orange-300/80 rounded-sm flex items-center gap-1.5 transition-all shadow-2xs group"
            title="Buka panduan interaktif penggunaan alat & rak"
          >
            <BookOpen className="w-3.5 h-3.5 text-orange-600 group-hover:text-white transition-colors" />
            <span className="hidden md:inline">Panduan Penggunaan</span>
            <span className="md:hidden">Panduan</span>
          </button>
        )}

        {/* Last Data Sync Time */}
        <div className="hidden lg:flex flex-col items-end text-right border-l border-orange-200/60 pl-3">
          <span className="text-[10px] font-mono uppercase text-stone-400">
            Sinkronisasi Terakhir
          </span>
          <span className="text-xs font-mono font-semibold text-orange-950 tabular-nums">
            {lastSyncTime}
          </span>
        </div>

        {/* Connection Indicator */}
        <div className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 border rounded-sm ${
          isBackendConnected
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
            : 'bg-rose-50 border-rose-300 text-rose-800'
        }`}>
          <Wifi className={`w-3.5 h-3.5 ${isBackendConnected ? 'text-emerald-600' : 'text-rose-500'}`} />
          <span className="text-xs font-mono font-bold hidden sm:inline">
            {isBackendConnected ? 'WS AKTIF' : 'WS TERPUTUS'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
