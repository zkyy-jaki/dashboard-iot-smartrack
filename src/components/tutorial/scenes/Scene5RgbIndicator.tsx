import React from 'react';

interface Scene5RgbIndicatorProps {
  subStep: number;
}

export const Scene5RgbIndicator: React.FC<Scene5RgbIndicatorProps> = ({ subStep }) => {
  // Cycle through the 3 states cleanly (subStep 0: Empty/Red, 1: 50%/Blue, 2 or 3: Full/Green)
  const conditionIndex = subStep === 0 ? 0 : subStep === 1 ? 1 : 2;

  const states = [
    {
      boxCount: 0,
      capacityPct: '0%',
      ledFill: '#DC2626',
      ledStroke: '#7F1D1D',
      ledHalo: 'rgba(220, 38, 38, 0.28)',
      badgeBg: '#C85C54',
      label: 'MERAH — RAK KOSONG',
      subDesc: 'KONDISI 1: Rak kosong (0 kardus) → 1 LED RGB menyala MERAH stabil'
    },
    {
      boxCount: 3,
      capacityPct: '50%',
      ledFill: '#2563EB',
      ledStroke: '#1E3A8A',
      ledHalo: 'rgba(37, 99, 235, 0.28)',
      badgeBg: '#2563EB',
      label: 'BIRU — TERISI SEBAGIAN',
      subDesc: 'KONDISI 2: Rak terisi sebagian (~50%) → 1 LED RGB berubah BIRU stabil'
    },
    {
      boxCount: 6,
      capacityPct: '100%',
      ledFill: '#16A34A',
      ledStroke: '#14532D',
      ledHalo: 'rgba(22, 163, 74, 0.28)',
      badgeBg: '#16A34A',
      label: 'HIJAU — RAK PENUH',
      subDesc: 'KONDISI 3: Rak penuh (100% kapasitas) → 1 LED RGB berubah HIJAU stabil'
    }
  ];

  const active = states[conditionIndex];

  return (
    <div
      className="w-full max-w-[490px]"
      style={{ transform: 'rotateX(6deg) rotateY(-3deg)' }}
    >
      <svg viewBox="0 0 500 260" className="w-full h-auto">
        {/* Top State Status Label */}
        <rect x="65" y="10" width="370" height="28" rx="2" fill={active.badgeBg} />
        <text x="250" y="28" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontFamily="monospace" fontWeight="bold">
          {active.label} ({active.capacityPct} CAPACITY)
        </text>

        {/* Rack Structure */}
        <rect x="44" y="56" width="14" height="142" fill="#263238" />
        <rect x="404" y="56" width="16" height="142" fill="#263238" />
        <rect x="58" y="66" width="346" height="96" fill="#F4F0E8" stroke="#D8D2C5" />
        <polygon points="58,162 404,162 414,150 68,150" fill="#DFD8C8" />
        <rect x="58" y="162" width="346" height="12" fill="#EAE3D2" stroke="#263238" strokeWidth="1.5" />

        {/* Ultrasonic Sensors */}
        <rect x="58" y="106" width="18" height="24" fill="#263238" />
        <rect x="386" y="106" width="18" height="24" fill="#263238" />

        {/* Cardboard Boxes Synchronized with LED State */}
        {active.boxCount === 0 ? (
          <text x="231" y="120" textAnchor="middle" fill="#77827D" fontSize="11" fontFamily="monospace" fontWeight="bold">
            — AREA BARIS RAK KOSONG (0 KARDUS) —
          </text>
        ) : (
          Array.from({ length: active.boxCount }).map((_, idx) => {
            const xPos = 86 + idx * 48;
            return (
              <g key={idx} transform={`translate(${xPos}, 96)`}>
                <polygon points="0,8 46,8 52,0 6,0" fill="#D9B486" stroke="#6E4720" strokeWidth="1" />
                <polygon points="46,8 52,0 52,58 46,66" fill="#A97D50" stroke="#6E4720" strokeWidth="1" />
                <rect x="0" y="8" width="46" height="58" fill="#C69C6D" stroke="#6E4720" strokeWidth="1.4" />
                <text x="23" y="41" textAnchor="middle" fill="#3E2723" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  #{idx + 1}
                </text>
              </g>
            );
          })
        )}

        {/* SINGLE RGB LED MODULE MOUNTED ON SIDE OF RACK */}
        <g transform="translate(420, 74)">
          {/* Side Housing Bracket */}
          <rect x="0" y="16" width="8" height="6" fill="#263238" />
          <rect x="8" y="0" width="56" height="44" rx="3" fill="#263238" stroke="#11171A" strokeWidth="1.5" />
          {/* Subtle Halo (Not excessive neon) */}
          <circle cx="36" cy="18" r="14" fill={active.ledHalo} />
          {/* Single Physical RGB Diffuser Dome */}
          <circle cx="36" cy="18" r="9" fill={active.ledFill} stroke={active.ledStroke} strokeWidth="1.5" />
          <circle cx="33" cy="15" r="2.5" fill="#FFFFFF" opacity="0.65" />
          <text x="36" y="38" textAnchor="middle" fill="#EAE3D2" fontSize="7" fontFamily="monospace" fontWeight="bold">
            1x RGB LED
          </text>
        </g>

        {/* Bottom Condition Selector Strip */}
        <rect x="44" y="208" width="440" height="36" rx="2" fill="#FFFFFF" stroke="#D8D2C5" strokeWidth="1.2" />
        <text x="264" y="230" textAnchor="middle" fill="#263238" fontSize="10" fontFamily="monospace" fontWeight="bold">
          {active.subDesc}
        </text>
      </svg>
    </div>
  );
};

export default Scene5RgbIndicator;

