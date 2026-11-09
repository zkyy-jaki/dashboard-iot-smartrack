import React from 'react';

interface Scene2PlacementProps {
  subStep: number;
  reducedMotion: boolean;
}

export const Scene2Placement: React.FC<Scene2PlacementProps> = ({ subStep, reducedMotion }) => {
  // 4 states: 0 = Center placement, 1 = Shifted Left, 2 = Shifted Right, 3 = Center-Right
  const positions = [
    { boxX: 215, dLeft: 45, dRight: 50, posLabel: 'POSISI A — TENGAH BARIS RAK' },
    { boxX: 135, dLeft: 20, dRight: 75, posLabel: 'POSISI B — AGAK KE KIRI (VALID)' },
    { boxX: 295, dLeft: 70, dRight: 25, posLabel: 'POSISI C — AGAK KE KANAN (VALID)' },
    { boxX: 245, dLeft: 55, dRight: 40, posLabel: 'POSISI D — BEBAS SEPANJANG BARIS (VALID)' }
  ];

  const current = positions[subStep % positions.length];
  const boxWidthPx = 70;
  const leftSensorEdge = 86;
  const rightSensorEdge = 414;

  return (
    <div
      className="w-full max-w-[490px]"
      style={{ transform: 'rotateX(6deg) rotateY(-2deg)' }}
    >
      <svg viewBox="0 0 500 250" className="w-full h-auto">
        {/* Top Position Status Banner */}
        <rect x="85" y="10" width="330" height="24" rx="2" fill="#263238" />
        <text x="250" y="26" textAnchor="middle" fill="#EAE3D2" fontSize="10" fontFamily="monospace" fontWeight="bold">
          {current.posLabel}
        </text>

        {/* Ghost Allowed Placement Guides */}
        <rect x="135" y="96" width="70" height="58" fill="none" stroke="#77827D" strokeWidth="1" strokeDasharray="3 3" opacity="0.45" />
        <rect x="215" y="96" width="70" height="58" fill="none" stroke="#77827D" strokeWidth="1" strokeDasharray="3 3" opacity="0.45" />
        <rect x="295" y="96" width="70" height="58" fill="none" stroke="#77827D" strokeWidth="1" strokeDasharray="3 3" opacity="0.45" />

        {/* Single Detailed Rack Row Structure */}
        <rect x="46" y="54" width="14" height="145" fill="#263238" />
        <rect x="440" y="54" width="14" height="145" fill="#263238" />
        <rect x="60" y="64" width="380" height="95" fill="#F4F0E8" stroke="#D8D2C5" />

        {/* 3D Cream Shelf Surface */}
        <polygon points="60,159 440,159 452,147 72,147" fill="#DFD8C8" />
        <rect x="60" y="159" width="380" height="12" fill="#EAE3D2" stroke="#263238" strokeWidth="1.5" />

        {/* Left & Right Ultrasonic Sensors */}
        <rect x="60" y="102" width="24" height="28" rx="2" fill="#263238" />
        <rect x="84" y="108" width="5" height="16" rx="1" fill="#525B57" />
        <text x="72" y="120" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="monospace" fontWeight="bold">
          US-L
        </text>

        <rect x="416" y="102" width="24" height="28" rx="2" fill="#263238" />
        <rect x="411" y="108" width="5" height="16" rx="1" fill="#525B57" />
        <text x="428" y="120" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="monospace" fontWeight="bold">
          US-R
        </text>

        {/* Measured Left Empty Space Zone */}
        <rect
          x={leftSensorEdge}
          y="78"
          width={Math.max(0, current.boxX - leftSensorEdge)}
          height="74"
          fill="#172B3A"
          fillOpacity="0.06"
        />
        <line
          x1={leftSensorEdge + 4}
          y1="116"
          x2={current.boxX - 4}
          y2="116"
          stroke="#172B3A"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        <rect
          x={(leftSensorEdge + current.boxX) / 2 - 36}
          y="72"
          width="72"
          height="18"
          rx="2"
          fill="#FFFFFF"
          stroke="#172B3A"
          strokeWidth="1"
        />
        <text
          x={(leftSensorEdge + current.boxX) / 2}
          y="84"
          textAnchor="middle"
          fill="#172B3A"
          fontSize="9"
          fontFamily="monospace"
          fontWeight="bold"
        >
          Ruang: {current.dLeft}cm
        </text>

        {/* Measured Right Empty Space Zone */}
        <rect
          x={current.boxX + boxWidthPx}
          y="78"
          width={Math.max(0, rightSensorEdge - (current.boxX + boxWidthPx))}
          height="74"
          fill="#172B3A"
          fillOpacity="0.06"
        />
        <line
          x1={current.boxX + boxWidthPx + 4}
          y1="116"
          x2={rightSensorEdge - 4}
          y2="116"
          stroke="#172B3A"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        <rect
          x={(current.boxX + boxWidthPx + rightSensorEdge) / 2 - 36}
          y="72"
          width="72"
          height="18"
          rx="2"
          fill="#FFFFFF"
          stroke="#172B3A"
          strokeWidth="1"
        />
        <text
          x={(current.boxX + boxWidthPx + rightSensorEdge) / 2}
          y="84"
          textAnchor="middle"
          fill="#172B3A"
          fontSize="9"
          fontFamily="monospace"
          fontWeight="bold"
        >
          Ruang: {current.dRight}cm
        </text>

        {/* 3D Kraft Brown Cardboard Box (Smooth Horizontal Transition) */}
        <g
          style={{
            transform: `translateX(${current.boxX}px)`,
            transition: reducedMotion ? 'none' : 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        >
          {/* Top 3D Flap */}
          <polygon points="0,96 70,96 78,86 8,86" fill="#D9B486" stroke="#6E4720" strokeWidth="1.2" />
          <line x1="8" y1="91" x2="74" y2="91" stroke="#8C6239" strokeWidth="1.5" />
          {/* Right 3D Side Face */}
          <polygon points="70,96 78,86 78,144 70,154" fill="#A97D50" stroke="#6E4720" strokeWidth="1.2" />
          {/* Front Kraft Face */}
          <rect x="0" y="96" width="70" height="58" fill="#C69C6D" stroke="#6E4720" strokeWidth="1.5" />
          <rect x="26" y="96" width="18" height="8" fill="#DFB982" stroke="#8C6239" strokeWidth="0.8" />
          <text x="35" y="125" textAnchor="middle" fill="#3E2723" fontSize="10" fontFamily="monospace" fontWeight="bold">
            KARDUS
          </text>
          <text x="35" y="139" textAnchor="middle" fill="#4E342E" fontSize="8" fontFamily="monospace">
            1 UNIT
          </text>
        </g>

        {/* Formula Explanation Strip at Bottom */}
        <rect x="60" y="185" width="380" height="44" rx="2" fill="#FFFFFF" stroke="#D8D2C5" strokeWidth="1.2" />
        <text x="250" y="203" textAnchor="middle" fill="#263238" fontSize="10" fontFamily="monospace" fontWeight="bold">
          Total Ruang Kosong = {current.dLeft} cm (Kiri) + {current.dRight} cm (Kanan) = 95 cm
        </text>
        <text x="250" y="219" textAnchor="middle" fill="#66856A" fontSize="10" fontFamily="monospace" fontWeight="bold">
          ✓ Hasil Ukuran Barang Tetap Konsisten Walaupun Posisi Kardus Bergeser
        </text>
      </svg>
    </div>
  );
};

export default Scene2Placement;

