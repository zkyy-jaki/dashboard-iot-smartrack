import React from 'react';

interface Scene4HorizontalStackingProps {
  subStep: number;
  reducedMotion: boolean;
}

export const Scene4HorizontalStacking: React.FC<Scene4HorizontalStackingProps> = ({ subStep, reducedMotion }) => {
  // subStep controls sequential box arrival & tightening
  const boxCount = reducedMotion ? 3 : Math.min(3, subStep + 1);
  const isTightened = subStep >= 2 || reducedMotion;

  return (
    <div
      className="w-full max-w-[490px]"
      style={{ transform: 'rotateX(5deg)' }}
    >
      <svg viewBox="0 0 500 265" className="w-full h-auto">
        {/* ============================================================
            KONDISI A — BENAR (3 KARDUS BERDERET RAPAT TANPA CELAH)
        ============================================================ */}
        <g transform="translate(0, 10)">
          <rect x="28" y="0" width="444" height="112" rx="2" fill="#F4F0E8" stroke="#66856A" strokeWidth="2" />
          <rect x="28" y="0" width="444" height="22" fill="#66856A" />
          <text x="40" y="15" fill="#FFFFFF" fontSize="10" fontFamily="monospace" fontWeight="bold">
            ✓ KONDISI A — BENAR: KARDUS DISUSUN RAPAT TANPA CELAH HORIZONTAL
          </text>

          {/* Shelf Beam */}
          <rect x="42" y="90" width="416" height="10" fill="#EAE3D2" stroke="#263238" strokeWidth="1.2" />
          <rect x="42" y="52" width="18" height="26" rx="1" fill="#263238" />
          <rect x="440" y="52" width="18" height="26" rx="1" fill="#263238" />

          {/* 3 Contiguous Horizontal Boxes */}
          {[0, 1, 2].map((idx) => {
            if (idx >= boxCount) return null;
            const targetX = 115 + idx * 64 + (isTightened ? 0 : idx * 10);
            return (
              <g
                key={idx}
                style={{
                  transform: `translate(${targetX}px, 38px)`,
                  transition: reducedMotion ? 'none' : 'transform 450ms ease-out'
                }}
              >
                <polygon points="0,8 62,8 70,0 8,0" fill="#D9B486" stroke="#6E4720" strokeWidth="1" />
                <polygon points="62,8 70,0 70,44 62,52" fill="#A97D50" stroke="#6E4720" strokeWidth="1" />
                <rect x="0" y="8" width="62" height="44" fill="#C69C6D" stroke="#6E4720" strokeWidth="1.5" />
                <text x="31" y="34" textAnchor="middle" fill="#3E2723" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  BOX #{idx + 1}
                </text>
              </g>
            );
          })}

          {/* Checkmark Badge */}
          <g transform="translate(335, 42)">
            <rect x="0" y="0" width="96" height="36" rx="2" fill="#FFFFFF" stroke="#66856A" strokeWidth="1.5" />
            <circle cx="18" cy="18" r="9" fill="#66856A" />
            <path d="M 14 18 L 17 21 L 23 15" fill="none" stroke="#FFFFFF" strokeWidth="2" />
            <text x="58" y="16" textAnchor="middle" fill="#4A644E" fontSize="9" fontFamily="monospace" fontWeight="bold">
              RAPAT
            </text>
            <text x="58" y="28" textAnchor="middle" fill="#4A644E" fontSize="8" fontFamily="monospace">
              0 cm Celah
            </text>
          </g>
        </g>

        {/* ============================================================
            KONDISI B — SALAH (ADA RONGGA / CELAH DI ANTARA KARDUS)
        ============================================================ */}
        <g transform="translate(0, 140)">
          <rect x="28" y="0" width="444" height="112" rx="2" fill="#F4F0E8" stroke="#C85C54" strokeWidth="2" />
          <rect x="28" y="0" width="444" height="22" fill="#C85C54" />
          <text x="40" y="15" fill="#FFFFFF" fontSize="10" fontFamily="monospace" fontWeight="bold">
            ✕ KONDISI B — SALAH: TERDAPAT CELAH / RONGGA ANTAR KARDUS
          </text>

          {/* Shelf Beam */}
          <rect x="42" y="90" width="416" height="10" fill="#EAE3D2" stroke="#263238" strokeWidth="1.2" />
          <rect x="42" y="52" width="18" height="26" rx="1" fill="#263238" />
          <rect x="440" y="52" width="18" height="26" rx="1" fill="#263238" />

          {/* 3 Spaced Boxes with Visible Gaps */}
          {[0, 1, 2].map((idx) => {
            const xPos = 90 + idx * 86;
            return (
              <g key={idx} transform={`translate(${xPos}, 38)`}>
                <polygon points="0,8 58,8 66,0 8,0" fill="#D9B486" stroke="#6E4720" strokeWidth="1" />
                <polygon points="58,8 66,0 66,44 58,52" fill="#A97D50" stroke="#6E4720" strokeWidth="1" />
                <rect x="0" y="8" width="58" height="44" fill="#C69C6D" stroke="#6E4720" strokeWidth="1.5" />
                <text x="29" y="34" textAnchor="middle" fill="#3E2723" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  BOX #{idx + 1}
                </text>
              </g>
            );
          })}

          {/* Highlighted Red Gap Indicators Between Boxes */}
          {[0, 1].map((gapIdx) => {
            const gapX = 148 + gapIdx * 86;
            return (
              <g key={gapIdx}>
                <rect
                  x={gapX}
                  y="42"
                  width="28"
                  height="48"
                  fill="#C85C54"
                  fillOpacity="0.22"
                  stroke="#C85C54"
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                />
                <text x={gapX + 14} y="69" textAnchor="middle" fill="#9E3831" fontSize="8" fontFamily="monospace" fontWeight="bold">
                  CELAH
                </text>
              </g>
            );
          })}

          {/* Cross Mark Badge */}
          <g transform="translate(335, 42)">
            <rect x="0" y="0" width="96" height="36" rx="2" fill="#FFFFFF" stroke="#C85C54" strokeWidth="1.5" />
            <circle cx="18" cy="18" r="9" fill="#C85C54" />
            <path d="M 14 14 L 22 22 M 22 14 L 14 22" fill="none" stroke="#FFFFFF" strokeWidth="2" />
            <text x="58" y="16" textAnchor="middle" fill="#9E3831" fontSize="9" fontFamily="monospace" fontWeight="bold">
              RENGGANG
            </text>
            <text x="58" y="28" textAnchor="middle" fill="#9E3831" fontSize="8" fontFamily="monospace">
              Salah Hitung!
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default Scene4HorizontalStacking;

