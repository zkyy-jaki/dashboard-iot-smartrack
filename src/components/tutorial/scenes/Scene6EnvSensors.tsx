import React from 'react';

interface Scene6EnvSensorsProps {
  subStep: number;
  isPlaying: boolean;
}

export const Scene6EnvSensors: React.FC<Scene6EnvSensorsProps> = ({ subStep, isPlaying }) => {
  const showRgb = subStep >= 0;
  const showDht11 = subStep >= 1;
  const showMq2 = subStep >= 2;

  return (
    <div
      className="w-full max-w-[490px] transition-transform duration-700"
      style={{ transform: 'rotateX(4deg) rotateY(-6deg)' }}
    >
      <svg viewBox="0 0 500 265" className="w-full h-auto">
        {/* Close-up Portion of Right Side of Rack */}
        <rect x="24" y="20" width="155" height="225" fill="#F4F0E8" stroke="#D8D2C5" />
        {/* Shelf Beams inside cropped view */}
        <rect x="24" y="85" width="155" height="12" fill="#EAE3D2" stroke="#263238" strokeWidth="1.5" />
        <rect x="24" y="175" width="155" height="12" fill="#EAE3D2" stroke="#263238" strokeWidth="1.5" />

        {/* Sample Kraft Box on Shelf */}
        <rect x="45" y="35" width="65" height="50" fill="#C69C6D" stroke="#6E4720" strokeWidth="1.5" />
        <rect x="45" y="125" width="65" height="50" fill="#C69C6D" stroke="#6E4720" strokeWidth="1.5" />

        {/* Right Vertical Charcoal Upright Post (Zoomed Focus) */}
        <rect x="179" y="14" width="24" height="236" fill="#263238" stroke="#11171A" strokeWidth="1.5" />
        <polygon points="203,14 215,6 215,242 203,250" fill="#1B2327" />

        {/* ============================================================
            1. TOP MODULE: RGB INDICATOR
        ============================================================ */}
        <g opacity={showRgb ? 1 : 0.25} className="transition-opacity duration-500">
          <rect x="203" y="36" width="12" height="6" fill="#263238" />
          <rect x="215" y="22" width="52" height="42" rx="3" fill="#263238" stroke="#11171A" strokeWidth="1.5" />
          <circle cx="241" cy="40" r="9" fill="#2563EB" stroke="#1E3A8A" strokeWidth="1.5" />
          <circle cx="238" cy="37" r="2.5" fill="#FFFFFF" opacity="0.7" />
          <text x="241" y="58" textAnchor="middle" fill="#EAE3D2" fontSize="7" fontFamily="monospace">
            RGB
          </text>

          {/* Callout Label 1 */}
          <line x1="267" y1="42" x2="295" y2="42" stroke="#263238" strokeWidth="1.5" />
          <rect x="295" y="25" width="185" height="34" rx="2" fill="#FFFFFF" stroke="#263238" strokeWidth="1.5" />
          <text x="305" y="40" fill="#263238" fontSize="10" fontFamily="monospace" fontWeight="bold">
            1. Indikator RGB LED
          </text>
          <text x="305" y="52" fill="#77827D" fontSize="8.5" fontFamily="monospace">
            Status Kapasitas &amp; Alarm
          </text>
        </g>

        {/* ============================================================
            2. MIDDLE MODULE (BELOW RGB): DHT11 TEMP & HUMIDITY SENSOR
        ============================================================ */}
        <g opacity={showDht11 ? 1 : 0.2} className="transition-opacity duration-500">
          <rect x="203" y="112" width="12" height="6" fill="#263238" />
          {/* DHT11 Blue Casing */}
          <rect x="215" y="94" width="52" height="48" rx="3" fill="#0284C7" stroke="#11171A" strokeWidth="1.5" />
          {/* DHT11 Grid Vents */}
          <rect x="227" y="103" width="28" height="18" rx="1" fill="#0369A1" stroke="#BAE6FD" strokeWidth="0.8" />
          <line x1="231" y1="108" x2="251" y2="108" stroke="#E0F2FE" strokeWidth="1" />
          <line x1="231" y1="112" x2="251" y2="112" stroke="#E0F2FE" strokeWidth="1" />
          <line x1="231" y1="116" x2="251" y2="116" stroke="#E0F2FE" strokeWidth="1" />
          <text x="241" y="134" textAnchor="middle" fill="#FFFFFF" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
            DHT11
          </text>

          {/* Callout Label 2 */}
          <line x1="267" y1="118" x2="295" y2="118" stroke="#263238" strokeWidth="1.5" />
          <rect x="295" y="94" width="185" height="48" rx="2" fill="#FFFFFF" stroke="#0284C7" strokeWidth="1.5" />
          <text x="305" y="110" fill="#0369A1" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
            2. Sensor Suhu &amp; Kelembapan
          </text>
          <text x="305" y="122" fill="#0369A1" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
            Sensor (DHT11)
          </text>
          <text x="305" y="135" fill="#66856A" fontSize="9" fontFamily="monospace" fontWeight="bold">
            27.5 °C • 65 %RH
          </text>
        </g>

        {/* ============================================================
            3. LOWER MODULE (BELOW SHT31): GAS SENSOR (MQ2)
        ============================================================ */}
        <g opacity={showMq2 ? 1 : 0.2} className="transition-opacity duration-500">
          <rect x="203" y="192" width="12" height="6" fill="#263238" />
          <rect x="215" y="172" width="52" height="52" rx="3" fill="#2F3B40" stroke="#11171A" strokeWidth="1.5" />
          {/* MQ2 Stainless Mesh Cylinder */}
          <circle cx="241" cy="193" r="12" fill="#525B57" stroke="#263238" strokeWidth="1.5" />
          <circle cx="241" cy="193" r="8" fill="#77827D" stroke="#263238" strokeWidth="0.8" strokeDasharray="2 1" />
          <text x="241" y="217" textAnchor="middle" fill="#EAE3D2" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
            MQ2 GAS
          </text>

          {/* Gas Detection Waves */}
          {isPlaying && (
            <g>
              <path d="M 222 166 Q 241 158 260 166" fill="none" stroke="#66856A" strokeWidth="1.5" strokeDasharray="3 2" />
              <path d="M 218 160 Q 241 150 264 160" fill="none" stroke="#66856A" strokeWidth="1.2" opacity="0.7" />
            </g>
          )}

          {/* Callout Label 3 */}
          <line x1="267" y1="196" x2="295" y2="196" stroke="#263238" strokeWidth="1.5" />
          <rect x="295" y="174" width="185" height="46" rx="2" fill="#FFFFFF" stroke="#66856A" strokeWidth="1.5" />
          <text x="305" y="191" fill="#263238" fontSize="10" fontFamily="monospace" fontWeight="bold">
            3. Sensor Gas &amp; Asap (MQ2)
          </text>
          <text x="305" y="205" fill="#66856A" fontSize="9" fontFamily="monospace" fontWeight="bold">
            Deteksi Gas/Asap: 185 ppm
          </text>
        </g>
      </svg>
    </div>
  );
};

export default Scene6EnvSensors;

