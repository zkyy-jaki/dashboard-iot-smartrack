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
      className="relative w-full flex-1 min-h-[300px] max-h-[620px] flex flex-col justify-end items-stretch select-none overflow-hidden group transition-all duration-700"
    >
      {/* 1. AMBIENT BACKDROP LIGHTING (Pendaran Hawa Panas & Kabut Karhutla) */}
      <div
        className={`absolute inset-0 transition-all duration-700 pointer-events-none ${
          isBurning
            ? 'opacity-100 bg-[radial-gradient(ellipse_at_50%_90%,rgba(239,68,68,0.6)_0%,rgba(249,115,22,0.45)_35%,rgba(180,83,9,0.2)_65%,transparent_95%)]'
            : 'opacity-90 bg-[radial-gradient(ellipse_at_50%_75%,rgba(245,158,11,0.22)_0%,rgba(180,83,9,0.12)_45%,rgba(28,16,12,0.05)_75%,transparent_90%)]'
        }`}
      />

      {/* Denyut hawa panas merah menyala saat kebakaran aktif */}
      {isBurning && (
        <div className="absolute inset-0 bg-red-600/15 animate-pulse pointer-events-none" />
      )}

      {/* 2. TALL MAJESTIC KARHUTLA TREE SILHOUETTE SVG (280 x 500 Canvas) */}
      <svg
        viewBox="0 0 280 500"
        className="w-full h-full min-h-[300px] z-10 transition-transform duration-500 group-hover:scale-[1.01]"
        preserveAspectRatio="xMidYBottom meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Pendaran Latar Belakang (Backlight Sunset Disk) agar Siluet Tampak Jelas & Tegas */}
          <radialGradient id="silhouetteBackdropGlow" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor={isBurning ? '#EF4444' : '#F59E0B'} stopOpacity={isBurning ? '0.45' : '0.28'} />
            <stop offset="45%" stopColor={isBurning ? '#EA580C' : '#D97706'} stopOpacity={isBurning ? '0.25' : '0.14'} />
            <stop offset="80%" stopColor="#78350F" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#1C100C" stopOpacity="0" />
          </radialGradient>

          {/* Warna Siluet Batang Normal: Charred Timber Solid dengan Highlight Tepi Emas/Tembaga */}
          <linearGradient id="solidTreeSilhouette" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2A140A" />
            <stop offset="30%" stopColor="#1C0D06" />
            <stop offset="70%" stopColor="#120603" />
            <stop offset="100%" stopColor="#0A0301" />
          </linearGradient>

          {/* Rim-Light Tepi Siluet (Membuat Siluet Pohon Kontras & Tajam) */}
          <linearGradient id="rimLightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="25%" stopColor="#F59E0B" />
            <stop offset="60%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#9A3412" />
          </linearGradient>

          {/* Warna Siluet saat Terbakar: Magma Bara Api Pijar */}
          <linearGradient id="burningMagmaBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="20%" stopColor="#FDE047" />
            <stop offset="45%" stopColor="#F97316" />
            <stop offset="75%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#7F1D1D" />
          </linearGradient>

          {/* Lidah Api Luar */}
          <linearGradient id="blazeOuterFire" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#7F1D1D" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#DC2626" />
            <stop offset="65%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#FDE047" stopOpacity="0.95" />
          </linearGradient>

          {/* Inti Lidah Api Panas */}
          <linearGradient id="blazeCoreFire" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="40%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#FEFCE8" />
          </linearGradient>

          {/* Kepulan Asap Tebal Karhutla */}
          <radialGradient id="smokeCloud" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#78716C" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#44403C" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1C1917" stopOpacity="0" />
          </radialGradient>

          {/* Filter Cahaya Pijar Api (Bloom Glow) */}
          <filter id="fireBloomEffect" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- LAYER 1: BACKLIGHT SUNSET/EMBER DISK (Pendaran Latar Belakang Penegas Siluet) --- */}
        <ellipse
          cx="140"
          cy="210"
          rx="125"
          ry="150"
          fill="url(#silhouetteBackdropGlow)"
          className="transition-all duration-700"
        />

        {/* --- LAYER 2: TANAH GAMBUT DASAR --- */}
        <ellipse
          cx="140"
          cy="490"
          rx="135"
          ry="10"
          fill={isBurning ? '#260B04' : '#140703'}
          stroke={isBurning ? '#EA580C' : '#451A03'}
          strokeWidth="1.5"
        />

        {/* Retakan Bara Api di Tanah Gambut saat Kebakaran */}
        {isBurning && (
          <path
            d="M 35 490 Q 85 487 140 490 Q 195 487 245 490 M 65 492 Q 140 489 215 492"
            stroke="#F97316"
            strokeWidth="2.2"
            strokeDasharray="4 6"
            className="animate-pulse"
          />
        )}

        {/* --- LAYER 3: AKAR-AKAR BESAR MENCENGKERAM TANAH (SOLID ROOTS) --- */}
        <path
          d={`
            M 116 480 C 100 486, 75 491, 28 496
            M 164 480 C 180 486, 205 491, 252 496
            M 126 482 C 130 488, 134 494, 136 498
            M 154 482 C 150 488, 146 494, 144 498
            M 92 486 C 75 492, 55 495, 42 497
            M 188 486 C 205 492, 225 495, 238 497
          `}
          stroke={isBurning ? '#EA580C' : '#9A3412'}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* --- LAYER 4: SOLID TREE SILHOUETTE BODY (KONTUR SILUET PADAT & TEGAS) --- */}
        {/* Batang Utama & Cabang-Cabang Primer dibuat menyatu padat (Solid Filled Silhouette) */}
        <path
          d={`
            /* Dimulai dari akar kiri bawah */
            M 30 495
            C 60 491, 95 486, 118 480
            
            /* Sisi kiri batang utama naik dengan lekukan pohon purba */
            C 121 440, 123 395, 126 350
            
            /* DAHAN KIRI BAWAH (Melengkung gagah ke kiri) */
            C 108 335, 82 320, 52 305
            C 34 295, 22 275, 14 245
            C 11 235, 17 228, 24 234
            C 32 258, 48 276, 68 285
            /* Cabang anakan kiri bawah */
            C 58 260, 48 230, 44 200
            C 50 194, 56 198, 58 208
            C 62 232, 72 258, 84 272
            C 98 290, 114 305, 128 322
            
            /* Sisi kiri batang tengah menuju dahan atas */
            C 128 295, 126 270, 122 245
            
            /* DAHAN KIRI ATAS (Menjulang tinggi ke sudut kiri atas) */
            C 102 225, 76 192, 48 155
            C 32 128, 22 98, 16 62
            C 14 52, 22 48, 26 58
            C 34 90, 46 118, 62 138
            /* Cabang anakan dahan kiri atas */
            C 56 112, 50 82, 48 55
            C 54 48, 62 52, 64 64
            C 66 90, 78 118, 92 138
            C 88 110, 84 82, 86 50
            C 92 44, 98 48, 98 60
            C 98 86, 106 114, 118 138
            C 124 165, 128 198, 132 222
            
            /* PUNCAK MAHKOTA PUSAT (Menjulang tegak ke langit puncak y=15) */
            /* Puncak Mahkota Kiri */
            C 130 185, 126 145, 122 100
            C 118 68, 114 42, 110 18
            C 116 10, 124 14, 126 25
            C 130 55, 134 92, 136 128
            
            /* Puncak Mahkota Utama Tertinggi */
            C 136 92, 138 55, 139 12
            C 143 6, 149 8, 149 20
            C 147 55, 145 95, 144 135
            
            /* Puncak Mahkota Kanan */
            C 146 95, 150 62, 156 28
            C 162 20, 168 24, 166 36
            C 162 68, 156 105, 152 145
            C 160 120, 170 85, 180 48
            C 186 40, 192 44, 190 56
            C 182 88, 174 125, 166 162
            
            /* Sisi kanan batang tengah menuju dahan kanan */
            C 164 190, 162 222, 158 248
            
            /* DAHAN KANAN ATAS (Menjulang tinggi ke sudut kanan atas) */
            C 178 228, 204 195, 232 158
            C 248 128, 258 98, 264 62
            C 266 52, 258 48, 254 58
            C 246 90, 234 118, 218 138
            /* Cabang anakan dahan kanan atas */
            C 224 112, 230 82, 232 55
            C 226 48, 218 52, 216 64
            C 214 90, 202 118, 188 138
            C 192 110, 196 82, 194 50
            C 188 44, 182 48, 182 60
            C 182 86, 174 114, 162 138
            C 158 175, 156 210, 154 278
            
            /* DAHAN KANAN BAWAH (Melengkung gagah ke kanan) */
            C 172 295, 198 320, 228 305
            C 246 295, 258 275, 266 245
            C 269 235, 263 228, 256 234
            C 248 258, 232 276, 212 285
            /* Cabang anakan kanan bawah */
            C 222 260, 232 230, 236 200
            C 230 194, 224 198, 222 208
            C 218 232, 208 258, 196 272
            C 182 290, 166 305, 152 322
            
            /* Sisi kanan batang utama turun menuju tanah */
            C 155 350, 158 395, 162 440
            C 165 486, 200 491, 250 495
            C 255 498, 245 500, 230 498
            C 190 494, 140 490, 90 494
            C 50 498, 35 500, 30 495
            Z
          `}
          fill={isBurning ? 'url(#burningMagmaBody)' : 'url(#solidTreeSilhouette)'}
          stroke={isBurning ? '#FEF08A' : 'url(#rimLightGradient)'}
          strokeWidth={isBurning ? '2.5' : '1.8'}
          strokeLinejoin="round"
          className="transition-colors duration-700"
          filter={isBurning ? 'url(#fireBloomEffect)' : undefined}
        />

        {/* --- LAYER 5: RANTING-RANTING MAHKOTA TAJAM (DELICATE SHARP TWIG SILHOUETTE) --- */}
        {/* Ranting luar yang mempertegas tekstur pohon kering Karhutla di seluruh kanopi */}
        <path
          d={`
            /* Puncak Atas */
            M 110 18 L 102 6 M 116 26 L 122 10 M 139 12 L 138 2 M 140 12 L 148 4
            M 156 28 L 164 12 M 166 36 L 174 22 M 180 48 L 190 32 M 190 56 L 200 42
            
            /* Sayap Kiri Atas */
            M 16 62 L 6 48 M 22 78 L 10 70 M 48 55 L 40 38 M 64 64 L 56 46
            M 26 58 L 18 42 M 34 94 L 22 84 M 86 50 L 78 35 M 92 138 L 104 120
            M 14 245 L 4 230 M 24 234 L 12 222 M 44 200 L 34 182 M 58 208 L 68 190
            
            /* Sayap Kanan Atas */
            M 264 62 L 274 48 M 258 78 L 270 70 M 232 55 L 240 38 M 216 64 L 224 46
            M 254 58 L 262 42 M 246 94 L 258 84 M 194 50 L 202 35 M 188 138 L 176 120
            M 266 245 L 276 230 M 256 234 L 268 222 M 236 200 L 246 182 M 222 208 L 212 190
          `}
          fill="none"
          stroke={isBurning ? '#F97316' : '#F59E0B'}
          strokeWidth="2.2"
          strokeLinecap="round"
          className="transition-colors duration-700"
        />

        {/* Retakan Serat Kayu Bercahaya di Batang Pohon */}
        <path
          d="M 137 465 Q 133 395 137 335 Q 140 285 137 245 M 144 450 Q 147 385 143 325"
          fill="none"
          stroke={isBurning ? '#FEFCE8' : '#D97706'}
          strokeWidth={isBurning ? '3' : '1.4'}
          opacity={isBurning ? '1' : '0.65'}
          filter={isBurning ? 'url(#fireBloomEffect)' : undefined}
          className={isBurning ? 'animate-pulse' : ''}
        />

        {/* --- LAYER 6: KOBARAN API RAKSASA SAAT SENSOR KEBAKARAN AKTIF --- */}
        {isBurning && (
          <g filter="url(#fireBloomEffect)">
            {/* 1. Api Utama Membakar Seluruh Batang Bawah */}
            <path
              d="M 110 485 Q 95 390 135 330 Q 146 390 154 355 Q 172 415 170 485 Z"
              fill="url(#blazeOuterFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '140px 485px' }}
            />
            <path
              d="M 120 485 Q 110 400 138 365 Q 150 400 158 485 Z"
              fill="url(#blazeCoreFire)"
              className="animate-fire-secondary"
              style={{ transformOrigin: '140px 485px' }}
            />

            {/* 2. Api Dahan Kiri Bawah & Tengah */}
            <path
              d="M 68 315 Q 20 255 52 195 Q 72 240 82 225 Q 96 280 90 315 Z"
              fill="url(#blazeOuterFire)"
              className="animate-fire-secondary"
              style={{ transformOrigin: '80px 315px', animationDelay: '0.15s' }}
            />
            <path
              d="M 76 300 Q 42 250 58 210 Q 76 250 84 290 Z"
              fill="url(#blazeCoreFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '80px 300px' }}
            />

            {/* 3. Api Ujung Dahan Kiri Atas */}
            <path
              d="M 26 135 Q -8 85 18 45 Q 30 80 40 115 Z"
              fill="url(#blazeOuterFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '30px 135px', animationDelay: '0.35s' }}
            />
            <path
              d="M 28 125 Q 8 90 22 65 Q 30 90 38 110 Z"
              fill="url(#blazeCoreFire)"
              className="animate-fire-secondary"
              style={{ transformOrigin: '30px 125px' }}
            />

            {/* 4. Api Dahan Kanan Bawah & Tengah */}
            <path
              d="M 190 315 Q 238 255 208 195 Q 188 240 178 225 Q 164 280 170 315 Z"
              fill="url(#blazeOuterFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '180px 315px', animationDelay: '0.2s' }}
            />
            <path
              d="M 184 300 Q 218 250 202 210 Q 184 250 176 290 Z"
              fill="url(#blazeCoreFire)"
              className="animate-fire-secondary"
              style={{ transformOrigin: '180px 300px' }}
            />

            {/* 5. Api Ujung Dahan Kanan Atas */}
            <path
              d="M 254 135 Q 288 85 262 45 Q 250 80 240 115 Z"
              fill="url(#blazeOuterFire)"
              className="animate-fire-secondary"
              style={{ transformOrigin: '250px 135px', animationDelay: '0.4s' }}
            />
            <path
              d="M 252 125 Q 272 90 258 65 Q 250 90 242 110 Z"
              fill="url(#blazeCoreFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '250px 125px' }}
            />

            {/* 6. Api Puncak Mahkota Pohon (Towering Crown Blaze y=12) */}
            <path
              d="M 124 145 Q 108 85 140 10 Q 162 80 156 145 Z"
              fill="url(#blazeOuterFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '140px 145px', animationDelay: '0.1s' }}
            />
            <path
              d="M 132 135 Q 122 90 140 32 Q 154 85 148 135 Z"
              fill="url(#blazeCoreFire)"
              className="animate-fire-secondary"
              style={{ transformOrigin: '140px 135px' }}
            />

            {/* Asap Tebal Karhutla Membumbung Tinggi Menembus Bagian Atas */}
            <circle cx="120" cy="18" r="18" fill="url(#smokeCloud)" className="animate-smoke" style={{ animationDelay: '0s' }} />
            <circle cx="162" cy="12" r="22" fill="url(#smokeCloud)" className="animate-smoke" style={{ animationDelay: '0.7s' }} />
            <circle cx="72" cy="32" r="16" fill="url(#smokeCloud)" className="animate-smoke" style={{ animationDelay: '1.2s' }} />
            <circle cx="218" cy="28" r="18" fill="url(#smokeCloud)" className="animate-smoke" style={{ animationDelay: '1.6s' }} />

            {/* Percikan Bara Api Berhamburan Naik (Embers) */}
            <circle cx="110" cy="115" r="2.6" fill="#FDE047" className="animate-ember" style={{ '--ember-drift': '-18px', '--ember-drift-end': '-40px', animationDelay: '0.1s' } as React.CSSProperties} />
            <circle cx="172" cy="125" r="2.8" fill="#F97316" className="animate-ember" style={{ '--ember-drift': '20px', '--ember-drift-end': '42px', animationDelay: '0.35s' } as React.CSSProperties} />
            <circle cx="140" cy="70" r="2.2" fill="#FEF08A" className="animate-ember" style={{ '--ember-drift': '10px', '--ember-drift-end': '-15px', animationDelay: '0.65s' } as React.CSSProperties} />
            <circle cx="52" cy="95" r="2.4" fill="#EF4444" className="animate-ember" style={{ '--ember-drift': '-22px', '--ember-drift-end': '-45px', animationDelay: '0.9s' } as React.CSSProperties} />
            <circle cx="238" cy="100" r="2.4" fill="#F59E0B" className="animate-ember" style={{ '--ember-drift': '18px', '--ember-drift-end': '38px', animationDelay: '1.15s' } as React.CSSProperties} />
            <circle cx="32" cy="115" r="2.0" fill="#FEF08A" className="animate-ember" style={{ '--ember-drift': '-16px', '--ember-drift-end': '-30px', animationDelay: '1.4s' } as React.CSSProperties} />
            <circle cx="258" cy="120" r="2.2" fill="#F97316" className="animate-ember" style={{ '--ember-drift': '16px', '--ember-drift-end': '32px', animationDelay: '1.7s' } as React.CSSProperties} />
            <circle cx="130" cy="235" r="2.4" fill="#FDE047" className="animate-ember" style={{ '--ember-drift': '-12px', '--ember-drift-end': '-25px', animationDelay: '0.4s' } as React.CSSProperties} />
            <circle cx="156" cy="245" r="2.6" fill="#EA580C" className="animate-ember" style={{ '--ember-drift': '14px', '--ember-drift-end': '30px', animationDelay: '0.8s' } as React.CSSProperties} />
          </g>
        )}

        {/* Partikel Abu & Debu Gambut Melayang Lembut saat Normal */}
        {!isBurning && (
          <g opacity="0.8">
            <circle cx="72" cy="215" r="1.8" fill="#F59E0B" />
            <circle cx="198" cy="185" r="1.6" fill="#D97706" />
            <circle cx="140" cy="105" r="1.5" fill="#F59E0B" />
            <circle cx="42" cy="125" r="1.6" fill="#D97706" />
            <circle cx="242" cy="135" r="1.5" fill="#B45309" />
            <circle cx="108" cy="60" r="1.4" fill="#FBBF24" />
            <circle cx="172" cy="70" r="1.5" fill="#F59E0B" />
            <circle cx="88" cy="305" r="1.5" fill="#D97706" />
            <circle cx="192" cy="315" r="1.5" fill="#B45309" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default KarhutlaTreeWidget;
