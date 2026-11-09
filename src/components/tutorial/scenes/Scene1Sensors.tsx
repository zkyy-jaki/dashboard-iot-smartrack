import React from 'react';

interface Scene1SensorsProps {
  subStep: number;
  isPlaying: boolean;
  reducedMotion: boolean;
}

export const Scene1Sensors: React.FC<Scene1SensorsProps> = ({ subStep, isPlaying, reducedMotion }) => {
  const cameraTransform = reducedMotion
    ? 'rotateX(6deg) rotateY(0deg)'
    : subStep === 0
    ? 'rotateX(10deg) rotateY(-8deg) scale(0.96)'
    : 'rotateX(6deg) rotateY(-3deg) scale(1)';

  const showLeftSensors = subStep >= 1 || reducedMotion;
  const showRightSensors = subStep >= 2 || reducedMotion;
  const showWaves = subStep >= 2 || reducedMotion;

  return (
    <div
      className="w-full max-w-[490px] transition-transform duration-700 ease-out"
      style={{ transform: cameraTransform, transformStyle: 'preserve-3d' }}
    >
      <svg viewBox="0 0 500 265" className="w-full h-auto drop-shadow-sm">
        {/* Top Sensor Callout Labels */}
        <g opacity={showLeftSensors ? 1 : 0.25} className="transition-opacity duration-500">
          <rect x="24" y="6" width="160" height="22" rx="2" fill="#263238" />
          <text x="104" y="21" textAnchor="middle" fill="#F5F6F4" fontSize="10" fontFamily="monospace" fontWeight="bold">
            Sensor Ultrasonik Kiri
          </text>
          <line x1="78" y1="28" x2="78" y2="55" stroke="#263238" strokeWidth="1.5" strokeDasharray="3 2" />
        </g>

        <g opacity={showRightSensors ? 1 : 0.25} className="transition-opacity duration-500">
          <rect x="316" y="6" width="160" height="22" rx="2" fill="#263238" />
          <text x="396" y="21" textAnchor="middle" fill="#F5F6F4" fontSize="10" fontFamily="monospace" fontWeight="bold">
            Sensor Ultrasonik Kanan
          </text>
          <line x1="422" y1="28" x2="422" y2="55" stroke="#263238" strokeWidth="1.5" strokeDasharray="3 2" />
        </g>

        {/* 3D Back Shadow Depth Frame */}
        <polygon points="62,36 452,36 440,46 50,46" fill="#374146" />
        <rect x="60" y="36" width="10" height="210" fill="#1B2327" />
        <rect x="440" y="36" width="10" height="210" fill="#1B2327" />

        {/* Main Charcoal Uprights */}
        <rect x="48" y="44" width="12" height="210" fill="#263238" />
        <rect x="430" y="44" width="12" height="210" fill="#263238" />
        <rect x="48" y="40" width="394" height="8" fill="#263238" />

        {/* Three Storage Rows */}
        {[0, 1, 2].map((rowIndex) => {
          const yTop = 58 + rowIndex * 64;
          const shelfY = yTop + 44;
          return (
            <g key={rowIndex}>
              {/* Cream/Beige Storage Bay Backplane & 3D Shelf Deck */}
              <rect x="60" y={yTop} width="370" height="44" fill="#F4F0E8" stroke="#D8D2C5" strokeWidth="1" />
              <polygon
                points={`60,${shelfY} 430,${shelfY} 440,${shelfY - 7} 70,${shelfY - 7}`}
                fill="#DFD8C8"
                stroke="#C5BDA1"
              />
              <rect x="60" y={shelfY} width="370" height="9" fill="#EAE3D2" stroke="#263238" strokeWidth="1.5" />

              {/* Row Label */}
              <text x="245" y={shelfY - 12} textAnchor="middle" fill="#77827D" fontSize="9" fontFamily="monospace" fontWeight="bold">
                AREA PENYIMPANAN BARIS 0{rowIndex + 1} (58 CM)
              </text>

              {/* Left Ultrasonic Sensor (Facing Right) */}
              <g
                opacity={showLeftSensors ? 1 : 0}
                className="transition-opacity duration-500"
              >
                <rect x="60" y={yTop + 12} width="22" height="22" rx="2" fill="#263238" stroke="#11171A" strokeWidth="1" />
                <rect x="82" y={yTop + 15} width="5" height="7" rx="1" fill="#525B57" />
                <rect x="82" y={yTop + 24} width="5" height="7" rx="1" fill="#525B57" />
                <text x="71" y={yTop + 26} textAnchor="middle" fill="#EAE3D2" fontSize="7" fontFamily="monospace" fontWeight="bold">
                  US-L
                </text>
              </g>

              {/* Right Ultrasonic Sensor (Facing Left) */}
              <g
                opacity={showRightSensors ? 1 : 0}
                className="transition-opacity duration-500"
              >
                <rect x="408" y={yTop + 12} width="22" height="22" rx="2" fill="#263238" stroke="#11171A" strokeWidth="1" />
                <rect x="403" y={yTop + 15} width="5" height="7" rx="1" fill="#525B57" />
                <rect x="403" y={yTop + 24} width="5" height="7" rx="1" fill="#525B57" />
                <text x="419" y={yTop + 26} textAnchor="middle" fill="#EAE3D2" fontSize="7" fontFamily="monospace" fontWeight="bold">
                  US-R
                </text>
              </g>

              {/* Ultrasonic Acoustic Measurement Waves Facing Center */}
              {showWaves && (
                <g>
                  <line
                    x1="90"
                    y1={yTop + 23}
                    x2="230"
                    y2={yTop + 23}
                    stroke="#172B3A"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />
                  <line
                    x1="400"
                    y1={yTop + 23}
                    x2="260"
                    y2={yTop + 23}
                    stroke="#172B3A"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />

                  {/* Left Animated Acoustic Arcs */}
                  <g
                    className={isPlaying ? 'sr-anim-wave-l' : ''}
                    style={{ animation: isPlaying ? 'srWaveLeft 1.8s infinite ease-out' : 'none' }}
                  >
                    <path
                      d={`M 98 ${yTop + 15} Q 106 ${yTop + 23} 98 ${yTop + 31}`}
                      fill="none"
                      stroke="#172B3A"
                      strokeWidth="2"
                    />
                    <path
                      d={`M 110 ${yTop + 12} Q 120 ${yTop + 23} 110 ${yTop + 34}`}
                      fill="none"
                      stroke="#172B3A"
                      strokeWidth="1.5"
                      opacity="0.7"
                    />
                  </g>

                  {/* Right Animated Acoustic Arcs */}
                  <g
                    className={isPlaying ? 'sr-anim-wave-r' : ''}
                    style={{ animation: isPlaying ? 'srWaveRight 1.8s infinite ease-out' : 'none' }}
                  >
                    <path
                      d={`M 392 ${yTop + 15} Q 384 ${yTop + 23} 392 ${yTop + 31}`}
                      fill="none"
                      stroke="#172B3A"
                      strokeWidth="2"
                    />
                    <path
                      d={`M 380 ${yTop + 12} Q 370 ${yTop + 23} 380 ${yTop + 34}`}
                      fill="none"
                      stroke="#172B3A"
                      strokeWidth="1.5"
                      opacity="0.7"
                    />
                  </g>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default Scene1Sensors;

