import React from 'react';

interface Scene7EmergencyProps {
  subStep: number;
  isPlaying: boolean;
}

export const Scene7Emergency: React.FC<Scene7EmergencyProps> = ({ subStep, isPlaying }) => {
  // subStep 0 = Normal, subStep 1..3 = Escalating Heat/Smoke Emergency + Blinking Red RGB + Buzzer
  const isEmergency = subStep >= 1;
  const tempValues = ['27.5 °C', '42.0 °C', '54.8 °C', '62.4 °C'];
  const gasValues = ['185 ppm', '460 ppm', '680 ppm', '745 ppm'];

  return (
    <div
      className="w-full max-w-[490px]"
      style={{ transform: 'rotateX(5deg) rotateY(-3deg)' }}
    >
      <svg viewBox="0 0 500 265" className="w-full h-auto">
        {/* Top Emergency Warning Banner */}
        <rect
          x="30"
          y="8"
          width="440"
          height="28"
          rx="2"
          fill={isEmergency ? '#C85C54' : '#263238'}
        />
        <text x="250" y="26" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontFamily="monospace" fontWeight="bold">
          {isEmergency
            ? '▲ PERINGATAN DARURAT: SUHU TINGGI / BAHAYA GAS — LED MERAH KEDIP + BUZZER'
            : 'KONDISI NORMAL — PEMANTAUAN LINGKUNGAN AKTIF (27.5 °C / 185 PPM)'}
        </text>

        {/* Rack Structure */}
        <rect x="44" y="52" width="12" height="150" fill="#263238" />
        <rect x="330" y="52" width="16" height="150" fill="#263238" />
        <rect x="56" y="62" width="274" height="100" fill="#F4F0E8" stroke="#D8D2C5" />
        <rect x="56" y="162" width="274" height="10" fill="#EAE3D2" stroke="#263238" strokeWidth="1.5" />

        {/* Stored Kraft Cartons */}
        <rect x="85" y="104" width="52" height="58" fill="#C69C6D" stroke="#6E4720" strokeWidth="1.4" />
        <rect x="139" y="104" width="52" height="58" fill="#C69C6D" stroke="#6E4720" strokeWidth="1.4" />

        {/* Fire / Heat & Smoke Hazard Illustration Near Rack */}
        {isEmergency && (
          <g transform="translate(245, 102)">
            {/* Rising Smoke / Gas Plume */}
            <circle cx="28" cy="-2" r="12" fill="#77827D" opacity="0.35" />
            <circle cx="40" cy="-14" r="15" fill="#77827D" opacity="0.25" />
            {/* Small Illustrative Fire Scenario */}
            <path
              d="M 28 58 C 12 58 8 38 20 24 C 22 32 26 30 28 16 C 36 28 46 36 42 50 C 40 55 34 58 28 58 Z"
              fill="#C85C54"
              stroke="#9E3831"
              strokeWidth="1.2"
            />
            <path
              d="M 28 58 C 20 58 18 44 25 34 C 28 40 33 38 35 48 C 34 54 31 58 28 58 Z"
              fill="#D6A34A"
            />
            <text x="28" y="72" textAnchor="middle" fill="#9E3831" fontSize="8" fontFamily="monospace" fontWeight="bold">
              PANAS / ASAP
            </text>
          </g>
        )}

        {/* Side Hardware Stack: 1. Single RGB LED (Blinking Red), 2. DHT11, 3. MQ2 + Buzzer */}
        <g transform="translate(346, 56)">
          {/* 1. Single RGB LED Housing */}
          <rect x="0" y="0" width="56" height="42" rx="3" fill="#263238" stroke="#11171A" strokeWidth="1.5" />
          <circle
            cx="28"
            cy="18"
            r="10"
            fill={isEmergency ? '#EF4444' : '#2563EB'}
            stroke="#11171A"
            strokeWidth="1.5"
            className={isEmergency && isPlaying ? 'sr-anim-blink' : ''}
            style={{
              animation: isEmergency && isPlaying ? 'srEmergencyBlink 0.45s infinite' : 'none'
            }}
          />
          <text x="28" y="36" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontFamily="monospace" fontWeight="bold">
            {isEmergency ? 'KEDIP MERAH' : 'LED RGB'}
          </text>

          {/* 2. DHT11 Temperature & Humidity Sensor */}
          <rect x="0" y="50" width="56" height="40" rx="3" fill="#0284C7" stroke="#11171A" strokeWidth="1.5" />
          <text x="28" y="66" textAnchor="middle" fill="#FFFFFF" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
            DHT11 SUHU
          </text>
          <text
            x="28"
            y="81"
            textAnchor="middle"
            fill={isEmergency ? '#FCA5A5' : '#A7F3D0'}
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {tempValues[subStep]}
          </text>

          {/* 3. MQ2 Gas Sensor */}
          <rect x="0" y="98" width="56" height="40" rx="3" fill="#2F3B40" stroke="#11171A" strokeWidth="1.5" />
          <text x="28" y="114" textAnchor="middle" fill="#EAE3D2" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
            MQ2 GAS
          </text>
          <text
            x="28"
            y="129"
            textAnchor="middle"
            fill={isEmergency ? '#FCA5A5' : '#A7F3D0'}
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {gasValues[subStep]}
          </text>

          {/* Acoustic Buzzer Sound Waves */}
          {isEmergency && (
            <g transform="translate(68, 22)">
              <circle cx="0" cy="0" r="8" fill="#C85C54" />
              <path
                d="M 14 -12 Q 26 0 14 12"
                fill="none"
                stroke="#C85C54"
                strokeWidth="2.5"
                className={isPlaying ? 'sr-anim-buzzer' : ''}
                style={{ animation: isPlaying ? 'srBuzzerPulse 0.8s infinite ease-out' : 'none' }}
              />
              <path
                d="M 22 -18 Q 38 0 22 18"
                fill="none"
                stroke="#C85C54"
                strokeWidth="2"
                className={isPlaying ? 'sr-anim-buzzer' : ''}
                style={{ animation: isPlaying ? 'srBuzzerPulse 0.8s infinite 0.2s ease-out' : 'none' }}
              />
              <text x="20" y="32" textAnchor="middle" fill="#9E3831" fontSize="9" fontFamily="monospace" fontWeight="bold">
                BUZZER BUNYI!
              </text>
            </g>
          )}
        </g>

        {/* Bottom Distinction Legend: Steady Red vs Blinking Red + Buzzer */}
        <rect x="30" y="212" width="440" height="40" rx="2" fill="#FFFFFF" stroke="#D8D2C5" strokeWidth="1.2" />
        <text x="140" y="230" textAnchor="middle" fill="#525B57" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
          ● Merah Stabil = Rak Kosong
        </text>
        <line x1="250" y1="218" x2="250" y2="246" stroke="#E3E7E5" strokeWidth="1.5" />
        <text x="362" y="230" textAnchor="middle" fill="#9E3831" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
          ◎ Merah Berkedip + Buzzer = Darurat
        </text>
        <text x="250" y="245" textAnchor="middle" fill="#77827D" fontSize="8.5" fontFamily="monospace">
          DHT11 membaca kenaikan suhu &amp; MQ2 mendeteksi gas/asap berbahaya
        </text>
      </svg>
    </div>
  );
};

export default Scene7Emergency;

