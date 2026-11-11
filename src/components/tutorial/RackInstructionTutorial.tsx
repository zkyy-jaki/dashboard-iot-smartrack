import React, { useState, useEffect } from 'react';
import {
  Info,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { TUTORIAL_SCENES } from '../../data/initialData';
import Scene1Sensors from './scenes/Scene1Sensors';
import Scene2Placement from './scenes/Scene2Placement';
import Scene3Orientation from './scenes/Scene3Orientation';
import Scene4HorizontalStacking from './scenes/Scene4HorizontalStacking';
import Scene5RgbIndicator from './scenes/Scene5RgbIndicator';
import Scene6EnvSensors from './scenes/Scene6EnvSensors';
import Scene7Emergency from './scenes/Scene7Emergency';

interface RackInstructionTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RackInstructionTutorial: React.FC<RackInstructionTutorialProps> = ({ isOpen, onClose }) => {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [subStep, setSubStep] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check prefers-reduced-motion media query safely
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Listen for Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Reset subStep when switching scenes or replaying
  useEffect(() => {
    setSubStep(0);
  }, [currentScene, replayKey]);

  // Controlled sub-step state machine for each scene (cleans up when closed or paused)
  useEffect(() => {
    if (!isOpen || !isPlaying) return;
    const stepDurationMs = prefersReducedMotion ? 1600 : 1250;
    const timer = setInterval(() => {
      setSubStep((prev) => (prev + 1) % 4);
    }, stepDurationMs);
    return () => clearInterval(timer);
  }, [isOpen, isPlaying, currentScene, replayKey, prefersReducedMotion]);

  // If modal is closed, unmount completely: stops animations, timers, and releases CPU/GPU resources
  if (!isOpen) return null;

  const activeSceneMeta = TUTORIAL_SCENES[currentScene];

  const handlePrevScene = () => {
    setCurrentScene((prev) => Math.max(0, prev - 1));
  };

  const handleNextScene = () => {
    setCurrentScene((prev) => Math.min(TUTORIAL_SCENES.length - 1, prev + 1));
  };

  const handleReplayScene = () => {
    setSubStep(0);
    setIsPlaying(true);
    setReplayKey((prev) => prev + 1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes srWaveLeft {
          0% { transform: translateX(0) scaleY(0.85); opacity: 0.9; }
          100% { transform: translateX(78px) scaleY(1.1); opacity: 0.15; }
        }
        @keyframes srWaveRight {
          0% { transform: translateX(0) scaleY(0.85); opacity: 0.9; }
          100% { transform: translateX(-78px) scaleY(1.1); opacity: 0.15; }
        }
        @keyframes srBoxEnter {
          0% { transform: translateY(18px) scale(0.95); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes srEmergencyBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.18; }
        }
        @keyframes srBuzzerPulse {
          0% { transform: scale(0.85); opacity: 0.85; }
          100% { transform: scale(1.45); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sr-anim-wave-l,
          .sr-anim-wave-r,
          .sr-anim-box,
          .sr-anim-blink,
          .sr-anim-buzzer {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div
        className="bg-white border-2 border-[#1C100C] rounded shadow-2xl overflow-hidden w-full max-w-5xl my-auto flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Panel Bar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#1C100C] via-[#2A140A] to-[#1C100C] text-white flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-orange-900/40">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-orange-600 text-white rounded-sm">
              PANDUAN INTERAKTIF
            </span>
            <h3 id="tutorial-dialog-title" className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-orange-100">
              Smart Small Rack — Tata Cara Operasional &amp; Perangkat Keras
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-300">
              Langkah <strong className="text-white">{currentScene + 1}</strong> dari {TUTORIAL_SCENES.length}
            </span>
            <button
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-mono bg-white/10 hover:bg-white/20 text-white rounded-sm flex items-center gap-1 transition-colors border border-white/20"
              title="Tutup Panduan (Esc)"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tutup</span>
            </button>
          </div>
        </div>

        {/* Main Layout Grid: Left 3D Stage (7 cols) + Right Explanation & Controls (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* LEFT AREA: 3D INDUSTRIAL RACK ILLUSTRATION STAGE */}
          <div className="lg:col-span-7 bg-[#EFECE6] border-b lg:border-b-0 lg:border-r border-[#E3E7E5] p-4 sm:p-6 flex flex-col justify-between min-h-[360px] relative overflow-hidden select-none">
            {/* Top Stage Technical Header */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#263238] text-[#F5F6F4] text-[10px] font-mono font-bold rounded-sm">
                  {activeSceneMeta.code}
                </span>
                <span className="text-[11px] font-mono text-[#525B57] hidden sm:inline">
                  • TAMPILAN ISOMETRIK 3D PERANGKAT
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#525B57] bg-white/80 px-2 py-0.5 border border-[#D8D3C8] rounded-sm">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isPlaying ? 'bg-[#66856A] animate-pulse' : 'bg-[#D6A34A]'
                  }`}
                />
                <span>{isPlaying ? 'ANIMASI BERJALAN' : 'DIJEDA'}</span>
              </div>
            </div>

            {/* Center 3D Visual Stage */}
            <div
              key={`${currentScene}-${replayKey}`}
              className="my-2 flex-1 flex items-center justify-center min-h-[220px]"
              style={{ perspective: '900px' }}
            >
              {currentScene === 0 && (
                <Scene1Sensors subStep={subStep} isPlaying={isPlaying} reducedMotion={prefersReducedMotion} />
              )}
              {currentScene === 1 && (
                <Scene2Placement subStep={subStep} reducedMotion={prefersReducedMotion} />
              )}
              {currentScene === 2 && (
                <Scene3Orientation subStep={subStep} reducedMotion={prefersReducedMotion} />
              )}
              {currentScene === 3 && (
                <Scene4HorizontalStacking subStep={subStep} reducedMotion={prefersReducedMotion} />
              )}
              {currentScene === 4 && (
                <Scene5RgbIndicator subStep={subStep} />
              )}
              {currentScene === 5 && (
                <Scene6EnvSensors subStep={subStep} isPlaying={isPlaying} />
              )}
              {currentScene === 6 && (
                <Scene7Emergency subStep={subStep} isPlaying={isPlaying} />
              )}
            </div>

            {/* Bottom Stage Legend & Sub-step Phase Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D8D3C8] text-[10px] font-mono text-[#525B57] z-10">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-[#263238] inline-block rounded-[1px]" /> Rangka Hitam
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-[#E6E0D4] border border-[#77827D] inline-block rounded-[1px]" /> Ambalan Rak
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-[#C69C6D] border border-[#6E4720] inline-block rounded-[1px]" /> Kardus Barang
                </span>
              </div>
              <div className="flex items-center gap-1">
                {/* <span>Fase Animasi:</span> */}
                {[0, 1, 2, 3].map((phaseIdx) => (
                  <span
                    key={phaseIdx}
                    className={`w-3.5 h-1.5 rounded-[1px] transition-colors ${
                      subStep === phaseIdx ? 'bg-orange-600' : 'bg-[#CBC5B9]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT AREA: SCENE DESCRIPTION, STEP PROGRESS & CONTROLS */}
          <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between bg-white overflow-y-auto">
            <div className="space-y-4">
              {/* Step Progress Pills */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[#77827D] mb-2">
                  <span>Kemajuan Panduan</span>
                  <span className="font-bold text-orange-700">
                    Langkah {currentScene + 1} dari {TUTORIAL_SCENES.length}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {TUTORIAL_SCENES.map((scene, idx) => {
                    const isCurrent = idx === currentScene;
                    const isCompleted = idx < currentScene;
                    return (
                      <button
                        key={scene.step}
                        onClick={() => setCurrentScene(idx)}
                        className={`h-7 text-xs font-mono font-bold rounded-sm border transition-colors flex items-center justify-center ${
                          isCurrent
                            ? 'bg-[#1C100C] text-orange-200 border-orange-600'
                            : isCompleted
                            ? 'bg-orange-500/15 text-orange-800 border-orange-500/40 hover:bg-orange-500/25'
                            : 'bg-[#F5F6F4] text-[#77827D] border-[#E3E7E5] hover:border-orange-500/40'
                        }`}
                        title={`Langkah ${scene.step}: ${scene.title}`}
                      >
                        {scene.step}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scene Title & Main Mandatory Copy */}
              <div className="pt-2">
                <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-orange-700">
                  {activeSceneMeta.code}
                </div>
                <h4 className="text-base sm:text-lg font-bold text-[#1C100C] mt-1">
                  {activeSceneMeta.title}
                </h4>
                <div className="mt-3 p-3.5 bg-[#F5F6F4] border-l-4 border-orange-600 rounded-r-sm">
                  <p className="text-xs sm:text-sm text-[#1C100C] leading-relaxed font-medium">
                    "{activeSceneMeta.description}"
                  </p>
                </div>
              </div>

              {/* Hardware & Operational Specification Note */}
              <div className="p-3 bg-white border border-[#E3E7E5] rounded-sm space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-orange-700">
                  <Info className="w-3.5 h-3.5 text-orange-600" />
                  <span>Catatan Operasional &amp; Perangkat Keras</span>
                </div>
                <p className="text-xs text-[#77827D] leading-relaxed">
                  {activeSceneMeta.technicalNote}
                </p>
              </div>
            </div>

            {/* Bottom Navigation & Playback Controls */}
            <div className="pt-5 mt-5 border-t border-[#E3E7E5] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Playback Controls: Play/Pause & Replay */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying((prev) => !prev)}
                    className={`px-3 py-1.5 text-xs font-mono font-semibold border rounded-sm flex items-center gap-1.5 transition-colors ${
                      isPlaying
                        ? 'bg-[#F5F6F4] text-[#263238] border-[#E3E7E5] hover:border-orange-500'
                        : 'bg-orange-600 text-white border-orange-600'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Jeda</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Putar</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleReplayScene}
                    className="px-2.5 py-1.5 text-xs font-mono bg-[#F5F6F4] text-[#263238] border border-[#E3E7E5] hover:border-orange-500 rounded-sm flex items-center gap-1"
                    title="Ulangi animasi langkah ini"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ulangi</span>
                  </button>
                </div>

                {/* Scene Step Navigation: Previous / Next / Finish */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevScene}
                    disabled={currentScene === 0}
                    className="px-3 py-1.5 text-xs font-mono font-semibold bg-[#F5F6F4] text-[#263238] border border-[#E3E7E5] hover:border-orange-500 rounded-sm disabled:opacity-40 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Sebelumnya</span>
                  </button>

                  {currentScene < TUTORIAL_SCENES.length - 1 ? (
                    <button
                      onClick={handleNextScene}
                      className="px-3.5 py-1.5 text-xs font-mono font-semibold bg-[#1C100C] text-white border border-orange-950 hover:bg-[#2E180E] rounded-sm flex items-center gap-1 transition-colors"
                    >
                      <span>Selanjutnya</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={onClose}
                      className="px-3.5 py-1.5 text-xs font-mono font-semibold bg-emerald-700 text-white border border-emerald-800 hover:bg-emerald-800 rounded-sm flex items-center gap-1 shadow-sm"
                    >
                      <span>Selesai &amp; Buka Dashboard</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Quick Dismiss / Close link */}
              <div className="pt-2 flex items-center justify-between text-xs text-[#77827D] border-t border-dashed border-[#E3E7E5]">
                <span className="font-mono text-[11px]">
                  Tekan <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px]">Esc</kbd> untuk menutup
                </span>
                <button
                  onClick={onClose}
                  className="text-xs font-mono text-orange-700 hover:text-orange-800 hover:underline font-semibold"
                >
                  Lewati Panduan &amp; Mulai Sekarang →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RackInstructionTutorial;
