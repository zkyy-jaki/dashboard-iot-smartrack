import React from 'react';

interface Scene3OrientationProps {
  subStep: number;
  reducedMotion: boolean;
}

export const Scene3Orientation: React.FC<Scene3OrientationProps> = ({ subStep, reducedMotion }) => {
  const showSecondBox = subStep >= 1 || reducedMotion;

  return (
    <div
      className="w-full max-w-[490px]"
      style={{ transform: 'rotateX(5deg)' }}
    >
      <svg viewBox="0 0 500 265" className="w-full h-auto">
        {/* Measurement Axis Header */}
        <rect x="30" y="8" width="440" height="22" rx="2" fill="#263238" />
        <text x="250" y="23" textAnchor="middle" fill="#F5F6F4" fontSize="10" fontFamily="monospace" fontWeight="bold">
          ◄─── ARAH PENGUKURAN ULTRASONIK (CONTOH KARDUS 5 × 6 CM) ───►
        </text>

        {/* ============================================================
            UPPER ROW: ORIENTASI BENAR (BOTH 5 CM PARALLEL TO AXIS)
        ============================================================ */}
        <g transform="translate(0, 38)">
          <rect x="30" y="0" width="440" height="98" rx="2" fill="#F4F0E8" stroke="#66856A" strokeWidth="2" />
          <rect x="30" y="0" width="440" height="22" fill="#66856A" />
          <text x="42" y="15" fill="#FFFFFF" fontSize="10" fontFamily="monospace" fontWeight="bold">
            ✓ ORIENTASI BENAR: SISI 5 CM SEJAJAR ARAH PENGUKURAN
          </text>

          {/* Cream Shelf Floor */}
          <rect x="44" y="78" width="412" height="10" fill="#EAE3D2" stroke="#263238" strokeWidth="1.2" />

          {/* Left & Right Sensors */}
          <rect x="44" y="42" width="18" height="24" rx="1" fill="#263238" />
          <rect x="438" y="42" width="18" height="24" rx="1" fill="#263238" />

          {/* Box 1 (5 cm width along shelf, 6 cm depth) */}
          <g transform="translate(135, 30)">
            <polygon points="0,8 68,8 78,0 10,0" fill="#D9B486" stroke="#6E4720" strokeWidth="1" />
            <polygon points="68,8 78,0 78,40 68,48" fill="#A97D50" stroke="#6E4720" strokeWidth="1" />
            <rect x="0" y="8" width="68" height="40" fill="#C69C6D" stroke="#6E4720" strokeWidth="1.5" />
            <text x="34" y="27" textAnchor="middle" fill="#3E2723" fontSize="9" fontFamily="monospace" fontWeight="bold">
              KARDUS 1
            </text>
            <text x="34" y="40" textAnchor="middle" fill="#3E2723" fontSize="10" fontFamily="monospace" fontWeight="bold">
              ◄ 5 cm ►
            </text>
            <text x="84" y="24" fill="#525B57" fontSize="8" fontFamily="monospace" fontWeight="bold">
              6cm
            </text>
          </g>

          {/* Box 2 (Same 5 cm orientation) */}
          {showSecondBox && (
            <g
              transform="translate(205, 30)"
              className="sr-anim-box"
              style={{ animation: reducedMotion ? 'none' : 'srBoxEnter 0.45s ease-out' }}
            >
              <polygon points="0,8 68,8 78,0 10,0" fill="#D9B486" stroke="#6E4720" strokeWidth="1" />
              <polygon points="68,8 78,0 78,40 68,48" fill="#A97D50" stroke="#6E4720" strokeWidth="1" />
              <rect x="0" y="8" width="68" height="40" fill="#C69C6D" stroke="#6E4720" strokeWidth="1.5" />
              <text x="34" y="27" textAnchor="middle" fill="#3E2723" fontSize="9" fontFamily="monospace" fontWeight="bold">
                KARDUS 2
              </text>
              <text x="34" y="40" textAnchor="middle" fill="#3E2723" fontSize="10" fontFamily="monospace" fontWeight="bold">
                ◄ 5 cm ►
              </text>
            </g>
          )}

          {/* Check Badge */}
          <rect x="315" y="38" width="112" height="32" rx="2" fill="#FFFFFF" stroke="#66856A" strokeWidth="1.2" />
          <text x="371" y="52" textAnchor="middle" fill="#4A644E" fontSize="9" fontFamily="monospace" fontWeight="bold">
            Total = 10 cm
          </text>
          <text x="371" y="64" textAnchor="middle" fill="#4A644E" fontSize="9" fontFamily="monospace" fontWeight="bold">
            Akurat (2 Kardus)
          </text>
        </g>

        {/* ============================================================
            LOWER ROW: ORIENTASI SALAH (BOX 2 ROTATED 90 DEG -> 6 CM)
        ============================================================ */}
        <g transform="translate(0, 150)">
          <rect x="30" y="0" width="440" height="102" rx="2" fill="#F4F0E8" stroke="#C85C54" strokeWidth="2" />
          <rect x="30" y="0" width="440" height="22" fill="#C85C54" />
          <text x="42" y="15" fill="#FFFFFF" fontSize="10" fontFamily="monospace" fontWeight="bold">
            ✕ ORIENTASI SALAH: KARDUS KEDUA DIPUTAR 90° (SISI 6 CM SEJAJAR)
          </text>

          {/* Cream Shelf Floor */}
          <rect x="44" y="82" width="412" height="10" fill="#EAE3D2" stroke="#263238" strokeWidth="1.2" />

          {/* Left & Right Sensors */}
          <rect x="44" y="44" width="18" height="24" rx="1" fill="#263238" />
          <rect x="438" y="44" width="18" height="24" rx="1" fill="#263238" />

          {/* Box 1 (5 cm along shelf) */}
          <g transform="translate(135, 34)">
            <polygon points="0,8 68,8 78,0 10,0" fill="#D9B486" stroke="#6E4720" strokeWidth="1" />
            <polygon points="68,8 78,0 78,40 68,48" fill="#A97D50" stroke="#6E4720" strokeWidth="1" />
            <rect x="0" y="8" width="68" height="40" fill="#C69C6D" stroke="#6E4720" strokeWidth="1.5" />
            <text x="34" y="27" textAnchor="middle" fill="#3E2723" fontSize="9" fontFamily="monospace" fontWeight="bold">
              KARDUS 1
            </text>
            <text x="34" y="40" textAnchor="middle" fill="#3E2723" fontSize="10" fontFamily="monospace" fontWeight="bold">
              ◄ 5 cm ►
            </text>
          </g>

          {/* Box 2 (Rotated 90° -> Wider 6 cm along shelf, shallower depth) */}
          {showSecondBox && (
            <g
              transform="translate(205, 34)"
              className="sr-anim-box"
              style={{ animation: reducedMotion ? 'none' : 'srBoxEnter 0.45s ease-out' }}
            >
              <polygon points="0,8 88,8 95,2 7,2" fill="#E6B8AF" stroke="#9E3831" strokeWidth="1.2" />
              <polygon points="88,8 95,2 95,42 88,48" fill="#C85C54" stroke="#9E3831" strokeWidth="1.2" />
              <rect x="0" y="8" width="88" height="40" fill="#DFB982" stroke="#C85C54" strokeWidth="2" />
              <text x="44" y="26" textAnchor="middle" fill="#9E3831" fontSize="8" fontFamily="monospace" fontWeight="bold">
                DIPUTAR 90°
              </text>
              <text x="44" y="40" textAnchor="middle" fill="#9E3831" fontSize="10" fontFamily="monospace" fontWeight="bold">
                ◄── 6 cm ──►
              </text>
            </g>
          )}

          {/* Error Callout */}
          <rect x="315" y="40" width="112" height="34" rx="2" fill="#FFFFFF" stroke="#C85C54" strokeWidth="1.2" />
          <text x="371" y="54" textAnchor="middle" fill="#9E3831" fontSize="9" fontFamily="monospace" fontWeight="bold">
            5cm + 6cm = 11cm
          </text>
          <text x="371" y="66" textAnchor="middle" fill="#9E3831" fontSize="8" fontFamily="monospace" fontWeight="bold">
            Beda Orientasi!
          </text>
        </g>
      </svg>
    </div>
  );
};

export default Scene3Orientation;

