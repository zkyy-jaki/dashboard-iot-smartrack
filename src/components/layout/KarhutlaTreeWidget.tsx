import React from 'react';

interface KarhutlaTreeWidgetProps {
  isFireAlert?: boolean;
  gasPpm?: number;
}

export const KarhutlaTreeWidget: React.FC<KarhutlaTreeWidgetProps> = ({
  isFireAlert = false,
  gasPpm = 0
}) => {
  // Terbakar otomatis jika sensor bahaya / kebakaran ESP32 aktif
  const isBurning = isFireAlert;

  return (
    <div
      className="relative w-full flex-1 flex flex-col justify-end items-stretch select-none overflow-hidden group transition-all duration-700"
    >
      {/* 1. SEAMLESS AMBIENT BACKDROP LIGHTING (Full-bleed, no cutoff, no box) */}
      <div
        className={`absolute inset-0 transition-all duration-700 pointer-events-none ${
          isBurning
            ? 'opacity-100 bg-[radial-gradient(ellipse_at_50%_90%,rgba(239,68,68,0.5)_0%,rgba(249,115,22,0.35)_40%,rgba(180,83,9,0.12)_70%,transparent_95%)]'
            : 'opacity-80 bg-[radial-gradient(ellipse_at_50%_80%,rgba(217,119,6,0.18)_0%,rgba(146,64,14,0.08)_50%,transparent_85%)]'
        }`}
      />

      {/* Denyut hawa panas merah saat kebakaran menyala */}
      {isBurning && (
        <div className="absolute inset-0 bg-red-600/10 animate-pulse pointer-events-none" />
      )}

      {/* 2. TALL MAJESTIC DRY & BURNING TREE SVG (Full width & height, mengisi seluruh area kosong) */}
      <svg
        viewBox="0 0 256 300"
        className="w-full h-full min-h-[200px] z-10 transition-transform duration-500 group-hover:scale-[1.01]"
        preserveAspectRatio="xMidYMax meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Warna Kayu Pohon Kering (Tegas, Kontras, Sangat Jelas di Latar Gelap) */}
          <linearGradient id="dryWoodBarkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="25%" stopColor="#D97706" />
            <stop offset="55%" stopColor="#9A3412" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>

          {/* Warna Batang Terbakar Membara (Pijar Api Magma) */}
          <linearGradient id="burningMagmaBark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="20%" stopColor="#F97316" />
            <stop offset="50%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#7F1D1D" />
          </linearGradient>

          {/* Lidah Api Luar (Merah Kirmizi ke Oranye Membara) */}
          <linearGradient id="blazeOuterFire" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#7F1D1D" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#DC2626" />
            <stop offset="70%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.95" />
          </linearGradient>

          {/* Inti Lidah Api Panas (Kuning Pijar ke Putih Api) */}
          <linearGradient id="blazeCoreFire" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="50%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#FEF9C3" />
          </linearGradient>

          {/* Kepulan Asap Lembut */}
          <radialGradient id="smokeCloud" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#78716C" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#44403C" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1C1917" stopOpacity="0" />
          </radialGradient>

          {/* Filter Cahaya Pijar Api (Intense Bloom) */}
          <filter id="fireBloomEffect" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- A. TANAH ARANG DI DASAR POHON (Menyatu langsung dengan batas bawah) --- */}
        <ellipse
          cx="128"
          cy="294"
          rx="122"
          ry="10"
          fill={isBurning ? '#260B04' : '#1C0D06'}
          stroke={isBurning ? '#EA580C' : '#451A03'}
          strokeWidth="1.5"
        />

        {/* Retakan Bara Api di Tanah Gambut saat Kebakaran */}
        {isBurning && (
          <path
            d="M 45 294 Q 88 291 128 294 Q 168 291 210 294 M 70 296 Q 128 293 186 296"
            stroke="#F97316"
            strokeWidth="1.8"
            strokeDasharray="4 6"
            className="animate-pulse"
          />
        )}

        {/* --- B. AKAR-AKAR BESAR MENCENGKERAM TANAH --- */}
        <path
          d={`
            M 108 288 C 96 292, 75 295, 48 298
            M 148 288 C 160 292, 181 295, 208 298
            M 118 290 C 122 295, 125 298, 126 300
            M 138 290 C 134 295, 131 298, 130 300
          `}
          stroke={isBurning ? '#EA580C' : '#9A3412'}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* --- C. BATANG & CABANG POHON KERING TINGGI PENUH (MASSIVE DEADWOOD TREE) --- */}
        <path
          d={`
            /* Batang Bawah Tebal Menjulang ke Atas */
            M 114 288
            C 117 250, 120 220, 123 190
            
            /* Dahan Kiri Utama (Melebar Penuh ke Sisi Kiri) */
            C 118 170, 100 152, 82 135
            C 68 122, 50 114, 32 106
            C 20 100, 10 94, 4 84
            
            /* Cabang Bawah Kiri */
            M 52 114
            C 38 126, 24 132, 12 136
            M 28 130 L 16 142
            
            /* Cabang Tengah Kiri */
            M 82 135
            C 78 112, 68 92, 54 72
            C 42 56, 30 46, 18 36
            M 68 92
            C 76 76, 84 60, 80 40
            M 54 72 L 40 60
            
            /* Mahkota Batang Tengah (Menjulang ke Atas) */
            M 123 190
            C 125 160, 127 132, 125 104
            C 123 80, 116 56, 108 32
            M 125 104
            C 135 82, 145 60, 138 34
            C 134 22, 129 14, 124 6
            M 118 62 L 102 46
            M 136 72 L 152 56
            
            /* Dahan Kanan Utama (Melebar Penuh ke Sisi Kanan) */
            M 125 180
            C 136 162, 156 148, 178 132
            C 194 120, 214 110, 234 100
            C 244 94, 252 86, 256 76
            
            /* Cabang Bawah Kanan */
            M 212 110
            C 226 124, 238 130, 248 134
            M 234 128 L 244 140
            
            /* Cabang Tengah Kanan */
            M 178 132
            C 186 112, 196 92, 210 72
            C 222 56, 232 46, 244 36
            M 196 92
            C 188 76, 182 60, 186 40
            M 210 72 L 224 60

            /* Sisi Kanan Batang Utama Menutup ke Bawah */
            M 142 288
            C 139 250, 135 220, 129 190
          `}
          fill="none"
          stroke={isBurning ? 'url(#burningMagmaBark)' : 'url(#dryWoodBarkGradient)'}
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-colors duration-700"
          filter={isBurning ? 'url(#fireBloomEffect)' : undefined}
        />

        {/* Ranting-Ranting Kering Halus (Deadwood Twigs Menyebar ke Seluruh Layar) */}
        <path
          d={`
            M 14 90 L 6 78 M 26 102 L 14 108 M 46 62 L 36 50 M 74 52 L 68 38
            M 104 46 L 94 34 M 134 30 L 142 16 M 168 46 L 178 32
            M 194 58 L 206 46 M 224 96 L 236 102 M 248 82 L 254 72
          `}
          fill="none"
          stroke={isBurning ? '#F97316' : '#D97706'}
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Retakan Serat Kayu (Glow Pijar saat Kebakaran) */}
        <path
          d="M 127 282 Q 123 245 126 215 Q 128 190 125 168 M 132 272 Q 135 238 131 208"
          fill="none"
          stroke={isBurning ? '#FEF08A' : '#78350F'}
          strokeWidth={isBurning ? '3' : '1.5'}
          opacity={isBurning ? '1' : '0.6'}
          filter={isBurning ? 'url(#fireBloomEffect)' : undefined}
          className={isBurning ? 'animate-pulse' : ''}
        />

        {/* --- D. KOBARAN API BESAR (MENYALA MELEKAT PADA POHON SAAT KEBAKARAN) --- */}
        {isBurning && (
          <g filter="url(#fireBloomEffect)">
            {/* 1. Api Membakar Batang Bawah Pohon */}
            <path
              d="M 110 286 Q 98 230 125 195 Q 132 235 138 210 Q 154 245 146 286 Z"
              fill="url(#blazeOuterFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '128px 286px' }}
            />
            <path
              d="M 116 286 Q 108 242 126 220 Q 138 242 140 286 Z"
              fill="url(#blazeCoreFire)"
              className="animate-fire-secondary"
              style={{ transformOrigin: '128px 286px' }}
            />

            {/* 2. Api Membakar Dahan Kiri Utama */}
            <path
              d="M 60 135 Q 30 90 52 50 Q 68 85 76 70 Q 88 110 84 135 Z"
              fill="url(#blazeOuterFire)"
              className="animate-fire-secondary"
              style={{ transformOrigin: '72px 135px', animationDelay: '0.15s' }}
            />
            <path
              d="M 68 128 Q 46 92 58 64 Q 72 95 80 125 Z"
              fill="url(#blazeCoreFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '72px 128px' }}
            />

            {/* 3. Api di Ujung Ranting Kiri */}
            <path
              d="M 20 105 Q -2 68 15 42 Q 24 66 32 92 Z"
              fill="url(#blazeOuterFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '22px 105px', animationDelay: '0.35s' }}
            />
            <path
              d="M 22 98 Q 8 74 18 56 Q 24 76 30 88 Z"
              fill="url(#blazeCoreFire)"
              className="animate-fire-secondary"
              style={{ transformOrigin: '22px 98px' }}
            />

            {/* 4. Api Membakar Dahan Kanan Utama */}
            <path
              d="M 172 135 Q 206 90 196 50 Q 182 85 174 70 Q 158 110 164 135 Z"
              fill="url(#blazeOuterFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '180px 135px', animationDelay: '0.2s' }}
            />
            <path
              d="M 174 128 Q 198 92 188 64 Q 178 95 168 125 Z"
              fill="url(#blazeCoreFire)"
              className="animate-fire-secondary"
              style={{ transformOrigin: '180px 128px' }}
            />

            {/* 5. Api di Ujung Ranting Kanan */}
            <path
              d="M 230 105 Q 256 68 240 42 Q 230 66 220 92 Z"
              fill="url(#blazeOuterFire)"
              className="animate-fire-secondary"
              style={{ transformOrigin: '232px 105px', animationDelay: '0.4s' }}
            />
            <path
              d="M 232 98 Q 248 74 236 56 Q 228 76 222 88 Z"
              fill="url(#blazeCoreFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '232px 98px' }}
            />

            {/* 6. Kobaran Api Dahsyat di Puncak Mahkota Pohon */}
            <path
              d="M 106 112 Q 90 48 125 4 Q 135 36 144 18 Q 160 54 146 112 Z"
              fill="url(#blazeOuterFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '128px 112px' }}
            />
            <path
              d="M 112 104 Q 102 54 126 20 Q 136 40 142 64 Q 140 96 134 104 Z"
              fill="#F97316"
              className="animate-fire-secondary"
              style={{ transformOrigin: '128px 104px', animationDelay: '0.25s' }}
            />
            <path
              d="M 116 100 Q 110 64 126 34 Q 136 60 134 100 Z"
              fill="url(#blazeCoreFire)"
              className="animate-fire-primary"
              style={{ transformOrigin: '128px 100px' }}
            />

            {/* Asap Tebal Membumbung Tinggi Menembus Bagian Atas */}
            <circle cx="110" cy="24" r="14" fill="url(#smokeCloud)" className="animate-smoke" style={{ animationDelay: '0s' }} />
            <circle cx="148" cy="16" r="18" fill="url(#smokeCloud)" className="animate-smoke" style={{ animationDelay: '0.7s' }} />
            <circle cx="65" cy="34" r="12" fill="url(#smokeCloud)" className="animate-smoke" style={{ animationDelay: '1.2s' }} />
            <circle cx="196" cy="28" r="14" fill="url(#smokeCloud)" className="animate-smoke" style={{ animationDelay: '1.6s' }} />

            {/* Percikan Bara Api Berhamburan Naik (Embers) */}
            <circle cx="100" cy="80" r="2.2" fill="#FDE047" className="animate-ember" style={{ '--ember-drift': '-16px', '--ember-drift-end': '-35px', animationDelay: '0.1s' } as React.CSSProperties} />
            <circle cx="156" cy="90" r="2.5" fill="#F97316" className="animate-ember" style={{ '--ember-drift': '18px', '--ember-drift-end': '38px', animationDelay: '0.35s' } as React.CSSProperties} />
            <circle cx="128" cy="55" r="1.8" fill="#FEF08A" className="animate-ember" style={{ '--ember-drift': '8px', '--ember-drift-end': '-14px', animationDelay: '0.65s' } as React.CSSProperties} />
            <circle cx="48" cy="70" r="2.0" fill="#EF4444" className="animate-ember" style={{ '--ember-drift': '-20px', '--ember-drift-end': '-40px', animationDelay: '0.9s' } as React.CSSProperties} />
            <circle cx="215" cy="72" r="1.9" fill="#F59E0B" className="animate-ember" style={{ '--ember-drift': '16px', '--ember-drift-end': '34px', animationDelay: '1.15s' } as React.CSSProperties} />
            <circle cx="28" cy="82" r="1.6" fill="#FEF08A" className="animate-ember" style={{ '--ember-drift': '-14px', '--ember-drift-end': '-28px', animationDelay: '1.4s' } as React.CSSProperties} />
            <circle cx="236" cy="84" r="1.8" fill="#F97316" className="animate-ember" style={{ '--ember-drift': '14px', '--ember-drift-end': '28px', animationDelay: '1.7s' } as React.CSSProperties} />
          </g>
        )}

        {/* Debu Abu Melayang Lembut saat Pohon Kering Normal */}
        {!isBurning && (
          <g opacity="0.65">
            <circle cx="68" cy="165" r="1.4" fill="#F59E0B" />
            <circle cx="178" cy="140" r="1.2" fill="#D97706" />
            <circle cx="128" cy="80" r="1.1" fill="#F59E0B" />
            <circle cx="40" cy="95" r="1.3" fill="#D97706" />
            <circle cx="220" cy="105" r="1.2" fill="#B45309" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default KarhutlaTreeWidget;
