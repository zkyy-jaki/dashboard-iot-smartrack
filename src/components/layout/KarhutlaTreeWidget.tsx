import React from 'react';

interface KarhutlaTreeWidgetProps {
  isFireAlert?: boolean;
  gasPpm?: number;
}

export const KarhutlaTreeWidget: React.FC<KarhutlaTreeWidgetProps> = ({
  isFireAlert = false,
  gasPpm = 0
}) => {
  // Status menyala otomatis mengikuti telemetri sensor bahaya ESP32
  const isBurning = isFireAlert;

  return (
    <div
      className="relative w-full flex-1 min-h-[280px] max-h-[620px] flex flex-col justify-end items-stretch select-none overflow-hidden group transition-all duration-700"
    >
      {/* 1. SEAMLESS AMBIENT BACKDROP LIGHTING (Full-bleed, mengisi ruang vertikal secara merata) */}
      <div
        className={`absolute inset-0 transition-all duration-700 pointer-events-none ${
          isBurning
            ? 'opacity-100 bg-[radial-gradient(ellipse_at_50%_90%,rgba(239,68,68,0.55)_0%,rgba(249,115,22,0.4)_35%,rgba(180,83,9,0.18)_65%,transparent_95%)]'
            : 'opacity-90 bg-[radial-gradient(ellipse_at_50%_80%,rgba(217,119,6,0.22)_0%,rgba(146,64,14,0.12)_45%,rgba(28,16,12,0.05)_75%,transparent_90%)]'
        }`}
      />

      {/* Denyut hawa panas merah menyala saat kebakaran aktif */}
      {isBurning && (
        <div className="absolute inset-0 bg-red-600/15 animate-pulse pointer-events-none" />
      )}

      {/* 2. TALL MAJESTIC DRY & BURNING KARHUTLA TREE SVG (280 x 500 Canvas) */}
      <svg
        viewBox="0 0 280 500"
        className="w-full h-full min-h-[280px] z-10 transition-transform duration-500 group-hover:scale-[1.01]"
        preserveAspectRatio="xMidYBottom meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Warna Kayu Pohon Kering (Vivid Contrast di Latar Gelap) */}
          <linearGradient id="dryWoodBarkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="20%" stopColor="#F59E0B" />
            <stop offset="45%" stopColor="#D97706" />
            <stop offset="70%" stopColor="#9A3412" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>

          {/* Warna Batang Terbakar Membara (Pijar Magma Bara Api) */}
          <linearGradient id="burningMagmaBark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="15%" stopColor="#FDE047" />
            <stop offset="35%" stopColor="#F97316" />
            <stop offset="65%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#7F1D1D" />
          </linearGradient>

          {/* Lidah Api Luar (Kirmizi ke Oranye Membara) */}
          <linearGradient id="blazeOuterFire" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#7F1D1D" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#DC2626" />
            <stop offset="65%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#FDE047" stopOpacity="0.95" />
          </linearGradient>

          {/* Inti Lidah Api Panas (Pijar Putih-Kuning Inti Api) */}
          <linearGradient id="blazeCoreFire" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="40%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#FEFCE8" />
          </linearGradient>

          {/* Kepulan Asap Tebal Karhutla */}
          <radialGradient id="smokeCloud" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#78716C" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#44403C" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1C1917" stopOpacity="0" />
          </radialGradient>

          {/* Filter Cahaya Pijar Api (Bloom Glow) */}
          <filter id="fireBloomEffect" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- A. TANAH GAMBUT & ARANG DASAR --- */}
        <ellipse
          cx="140"
          cy="490"
          rx="135"
          ry="10"
          fill={isBurning ? '#2D0A03' : '#1C0D06'}
          stroke={isBurning ? '#EA580C' : '#451A03'}
          strokeWidth="1.5"
        />

        {/* Retakan Bara Api di Tanah saat Kebakaran */}
        {isBurning && (
          <path
            d="M 35 490 Q 85 487 140 490 Q 195 487 245 490 M 65 492 Q 140 489 215 492"
            stroke="#F97316"
            strokeWidth="2"
            strokeDasharray="4 6"
            className="animate-pulse"
          />
        )}

        {/* --- B. AKAR-AKAR BESAR MENCENGKERAM TANAH --- */}
        <path
          d={`
            M 118 482 C 102 487, 75 491, 35 495
            M 162 482 C 178 487, 205 491, 245 495
            M 128 484 C 132 490, 136 495, 137 498
            M 152 484 C 148 490, 144 495, 143 498
            M 95 488 C 80 492, 60 494, 45 496
            M 185 488 C 200 492, 220 494, 235 496
          `}
          stroke={isBurning ? '#EA580C' : '#9A3412'}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* --- C. BATANG POHON UTAMA TEBAL & KOKOH (TRUNK 485 -> 280) --- */}
        {/* Kontur Batang Siluet Berbobot */}
        <path
          d={`
            M 118 482
            C 122 430, 126 370, 130 310
            C 133 270, 136 230, 138 180
            L 142 180
            C 144 230, 147 270, 150 310
            C 154 370, 158 430, 162 482
            Z
          `}
          fill={isBurning ? '#3D0E05' : '#2A1208'}
          stroke={isBurning ? 'url(#burningMagmaBark)' : 'url(#dryWoodBarkGradient)'}
          strokeWidth="3.5"
          className="transition-colors duration-700"
          filter={isBurning ? 'url(#fireBloomEffect)' : undefined}
        />

        {/* --- D. CABANG-CABANG BESAR MENYEBAR PENUH KE SELURUH KANVAS --- */}
        <path
          d={`
            /* 1. DAHAN KIRI BAWAH (Melebar ke batas kiri) */
            M 130 340
            C 105 320, 75 305, 45 290
            C 25 280, 15 260, 10 230
            M 45 290
            C 30 255, 20 220, 15 175
            M 30 255 L 42 225
            M 10 230 L 4 205

            /* 2. DAHAN KIRI TENGAH / ATAS (Menjulang tinggi ke kiri atas) */
            M 134 275
            C 112 235, 82 195, 52 155
            C 34 125, 24 95, 16 55
            M 82 195
            C 68 150, 56 110, 48 70
            M 52 155
            C 40 120, 32 85, 26 50
            M 68 150 L 80 120
            M 56 110 L 44 85

            /* 3. PINNAKLE / MAHKOTA PUSAT (Menjulang Tegak ke Puncak Tertinggi y=18) */
            M 138 180
            C 137 135, 138 90, 140 22
            M 138 140
            C 122 105, 110 65, 105 28
            M 139 120
            C 155 90, 168 55, 172 25
            M 138 80
            C 128 50, 122 30, 118 18
            M 139 70
            C 148 45, 156 30, 160 18

            /* 4. DAHAN KANAN TENGAH / ATAS (Menjulang tinggi ke kanan atas) */
            M 146 275
            C 168 235, 198 195, 228 155
            C 246 125, 256 95, 264 55
            M 198 195
            C 212 150, 224 110, 232 70
            M 228 155
            C 240 120, 248 85, 254 50
            M 212 150 L 200 120
            M 224 110 L 236 85

            /* 5. DAHAN KANAN BAWAH (Melebar ke batas kanan) */
            M 150 340
            C 175 320, 205 305, 235 290
            C 255 280, 265 260, 270 230
            M 235 290
            C 250 255, 260 220, 265 175
            M 250 255 L 238 225
            M 270 230 L 276 205
          `}
          fill="none"
          stroke={isBurning ? 'url(#burningMagmaBark)' : 'url(#dryWoodBarkGradient)'}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-colors duration-700"
          filter={isBurning ? 'url(#fireBloomEffect)' : undefined}
        />

        {/* --- E. RANTING-RANTING KERING HALUS (DENSE DEADWOOD CANOPY TWIGS) --- */}
        <path
          d={`
            /* Ranting Mahkota Atas */
            M 118 18 L 112 8 M 122 28 L 128 14 M 140 22 L 140 10 M 140 22 L 146 12
            M 160 18 L 166 8 M 154 28 L 148 14 M 105 28 L 98 16 M 172 25 L 180 14
            
            /* Ranting Kanopi Kiri */
            M 16 55 L 8 42 M 22 70 L 12 62 M 48 70 L 40 52 M 60 45 L 52 30
            M 26 50 L 18 36 M 34 85 L 24 76 M 80 120 L 92 105 M 95 75 L 88 58
            M 15 175 L 6 162 M 22 190 L 10 182 M 42 225 L 50 208 M 62 245 L 72 230
            
            /* Ranting Kanopi Kanan */
            M 264 55 L 272 42 M 258 70 L 268 62 M 232 70 L 240 52 M 220 45 L 228 30
            M 254 50 L 262 36 M 246 85 L 256 76 M 200 120 L 188 105 M 185 75 L 192 58
            M 265 175 L 274 162 M 258 190 L 270 182 M 238 225 L 230 208 M 218 245 L 208 230
          `}
          fill="none"
          stroke={isBurning ? '#F97316' : '#D97706'}
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Retakan Serat Kayu Bercahaya di Batang */}
        <path
          d="M 137 470 Q 134 400 138 340 Q 140 290 137 250 M 143 455 Q 146 390 142 330"
          fill="none"
          stroke={isBurning ? '#FEF08A' : '#78350F'}
          strokeWidth={isBurning ? '3' : '1.5'}
          opacity={isBurning ? '1' : '0.6'}
          filter={isBurning ? 'url(#fireBloomEffect)' : undefined}
          className={isBurning ? 'animate-pulse' : ''}
        />

        {/* --- F. KOBARAN API RAKSASA (MENYALA SAAT SENSOR KEBAKARAN AKTIF) --- */}
        {isBurning && (
          <g filter="url(#fireBloomEffect)">
            {/* 1. Api Utama Membakar Seluruh Batang Bawah */}
            <path
              d="M 112 485 Q 98 400 135 340 Q 145 400 152 365 Q 170 420 168 485 Z"
              fill="url(#blazeOuterFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '140px 485px' }}
            />
            <path
              d="M 122 485 Q 112 410 138 375 Q 150 410 156 485 Z"
              fill="url(#blazeCoreFire)"
              className="animate-fire-secondary"
              style={{ transformOrigin: '140px 485px' }}
            />

            {/* 2. Api Dahan Kiri Bawah & Tengah */}
            <path
              d="M 70 320 Q 25 260 55 200 Q 75 245 85 230 Q 98 285 92 320 Z"
              fill="url(#blazeOuterFire)"
              className="animate-fire-secondary"
              style={{ transformOrigin: '80px 320px', animationDelay: '0.15s' }}
            />
            <path
              d="M 78 305 Q 45 255 60 215 Q 78 255 86 295 Z"
              fill="url(#blazeCoreFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '80px 305px' }}
            />

            {/* 3. Api Ujung Dahan Kiri Atas */}
            <path
              d="M 28 140 Q -5 90 20 50 Q 32 85 42 120 Z"
              fill="url(#blazeOuterFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '30px 140px', animationDelay: '0.35s' }}
            />
            <path
              d="M 30 130 Q 10 95 24 70 Q 32 95 40 115 Z"
              fill="url(#blazeCoreFire)"
              className="animate-fire-secondary"
              style={{ transformOrigin: '30px 130px' }}
            />

            {/* 4. Api Dahan Kanan Bawah & Tengah */}
            <path
              d="M 188 320 Q 235 260 205 200 Q 185 245 175 230 Q 162 285 168 320 Z"
              fill="url(#blazeOuterFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '180px 320px', animationDelay: '0.2s' }}
            />
            <path
              d="M 182 305 Q 215 255 200 215 Q 182 255 174 295 Z"
              fill="url(#blazeCoreFire)"
              className="animate-fire-secondary"
              style={{ transformOrigin: '180px 305px' }}
            />

            {/* 5. Api Ujung Dahan Kanan Atas */}
            <path
              d="M 252 140 Q 285 90 260 50 Q 248 85 238 120 Z"
              fill="url(#blazeOuterFire)"
              className="animate-fire-secondary"
              style={{ transformOrigin: '250px 140px', animationDelay: '0.4s' }}
            />
            <path
              d="M 250 130 Q 270 95 256 70 Q 248 95 240 115 Z"
              fill="url(#blazeCoreFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '250px 130px' }}
            />

            {/* 6. Api Puncak Mahkota Pohon (Towering Crown Blaze y=15) */}
            <path
              d="M 125 150 Q 110 90 140 15 Q 160 85 155 150 Z"
              fill="url(#blazeOuterFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '140px 150px', animationDelay: '0.1s' }}
            />
            <path
              d="M 132 140 Q 124 95 140 38 Q 152 90 148 140 Z"
              fill="url(#blazeCoreFire)"
              className="animate-fire-secondary"
              style={{ transformOrigin: '140px 140px' }}
            />

            {/* Asap Tebal Membumbung Tinggi Menembus Bagian Atas */}
            <circle cx="120" cy="20" r="16" fill="url(#smokeCloud)" className="animate-smoke" style={{ animationDelay: '0s' }} />
            <circle cx="160" cy="15" r="20" fill="url(#smokeCloud)" className="animate-smoke" style={{ animationDelay: '0.7s' }} />
            <circle cx="75" cy="35" r="14" fill="url(#smokeCloud)" className="animate-smoke" style={{ animationDelay: '1.2s' }} />
            <circle cx="215" cy="30" r="16" fill="url(#smokeCloud)" className="animate-smoke" style={{ animationDelay: '1.6s' }} />

            {/* Percikan Bara Api Berhamburan Naik (Embers) */}
            <circle cx="110" cy="120" r="2.5" fill="#FDE047" className="animate-ember" style={{ '--ember-drift': '-18px', '--ember-drift-end': '-40px', animationDelay: '0.1s' } as React.CSSProperties} />
            <circle cx="170" cy="130" r="2.8" fill="#F97316" className="animate-ember" style={{ '--ember-drift': '20px', '--ember-drift-end': '42px', animationDelay: '0.35s' } as React.CSSProperties} />
            <circle cx="140" cy="75" r="2.0" fill="#FEF08A" className="animate-ember" style={{ '--ember-drift': '10px', '--ember-drift-end': '-15px', animationDelay: '0.65s' } as React.CSSProperties} />
            <circle cx="55" cy="100" r="2.2" fill="#EF4444" className="animate-ember" style={{ '--ember-drift': '-22px', '--ember-drift-end': '-45px', animationDelay: '0.9s' } as React.CSSProperties} />
            <circle cx="235" cy="105" r="2.2" fill="#F59E0B" className="animate-ember" style={{ '--ember-drift': '18px', '--ember-drift-end': '38px', animationDelay: '1.15s' } as React.CSSProperties} />
            <circle cx="35" cy="120" r="1.8" fill="#FEF08A" className="animate-ember" style={{ '--ember-drift': '-16px', '--ember-drift-end': '-30px', animationDelay: '1.4s' } as React.CSSProperties} />
            <circle cx="255" cy="125" r="2.0" fill="#F97316" className="animate-ember" style={{ '--ember-drift': '16px', '--ember-drift-end': '32px', animationDelay: '1.7s' } as React.CSSProperties} />
            <circle cx="130" cy="240" r="2.2" fill="#FDE047" className="animate-ember" style={{ '--ember-drift': '-12px', '--ember-drift-end': '-25px', animationDelay: '0.4s' } as React.CSSProperties} />
            <circle cx="155" cy="250" r="2.5" fill="#EA580C" className="animate-ember" style={{ '--ember-drift': '14px', '--ember-drift-end': '30px', animationDelay: '0.8s' } as React.CSSProperties} />
          </g>
        )}

        {/* Partikel Abu & Debu Gambut Melayang Lembut saat Normal */}
        {!isBurning && (
          <g opacity="0.75">
            <circle cx="75" cy="220" r="1.6" fill="#F59E0B" />
            <circle cx="195" cy="190" r="1.5" fill="#D97706" />
            <circle cx="140" cy="110" r="1.3" fill="#F59E0B" />
            <circle cx="45" cy="130" r="1.5" fill="#D97706" />
            <circle cx="240" cy="140" r="1.4" fill="#B45309" />
            <circle cx="110" cy="65" r="1.2" fill="#FBBF24" />
            <circle cx="170" cy="75" r="1.3" fill="#F59E0B" />
            <circle cx="90" cy="310" r="1.4" fill="#D97706" />
            <circle cx="190" cy="320" r="1.4" fill="#B45309" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default KarhutlaTreeWidget;
