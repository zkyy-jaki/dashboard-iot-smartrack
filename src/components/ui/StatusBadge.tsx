import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const STATUS_MAP_ID: Record<string, string> = {
  'IN STOCK': 'TERSEDIA',
  'FULL CAPACITY': 'KAPASITAS PENUH',
  'Normal': 'NORMAL',
  'ONLINE': 'TERHUBUNG',
  'LOW STOCK': 'STOK MENIPIS',
  'Warning': 'WASPADA',
  'EMPTY': 'KOSONG',
  'Danger': 'BAHAYA',
  'OFFLINE': 'TERPUTUS',
  'SENSOR FAULT': 'SENSOR RUSAK',
  'Stock In': 'Barang Masuk',
  'Stock Out': 'Barang Keluar'
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: Record<string, string> = {
    'IN STOCK': 'bg-[#66856A]/15 text-[#4A644E] border-[#66856A]/40',
    'FULL CAPACITY': 'bg-[#172B3A]/10 text-[#172B3A] border-[#172B3A]/30',
    'Normal': 'bg-[#66856A]/15 text-[#4A644E] border-[#66856A]/40',
    'ONLINE': 'bg-[#66856A]/15 text-[#4A644E] border-[#66856A]/40',
    'LOW STOCK': 'bg-[#D6A34A]/15 text-[#9A6E1F] border-[#D6A34A]/40',
    'Warning': 'bg-[#D6A34A]/15 text-[#9A6E1F] border-[#D6A34A]/40',
    'EMPTY': 'bg-[#77827D]/15 text-[#525B57] border-[#77827D]/40',
    'Danger': 'bg-[#C85C54]/15 text-[#9E3831] border-[#C85C54]/40',
    'OFFLINE': 'bg-[#C85C54]/15 text-[#9E3831] border-[#C85C54]/40',
    'SENSOR FAULT': 'bg-[#C85C54]/15 text-[#9E3831] border-[#C85C54]/40',
    'Stock In': 'bg-[#66856A]/15 text-[#4A644E] border-[#66856A]/40',
    'Stock Out': 'bg-[#D6A34A]/15 text-[#9A6E1F] border-[#D6A34A]/40'
  };

  const dotColor =
    status === 'IN STOCK' || status === 'Normal' || status === 'ONLINE' || status === 'Stock In' || status === 'FULL CAPACITY'
      ? 'bg-[#66856A]'
      : status === 'LOW STOCK' || status === 'Warning' || status === 'Stock Out'
      ? 'bg-[#D6A34A]'
      : status === 'EMPTY'
      ? 'bg-[#77827D]'
      : 'bg-[#C85C54]';

  const label = STATUS_MAP_ID[status] || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider border rounded-sm ${
        styles[status] || 'bg-gray-100 text-gray-700 border-gray-300'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
};

export default StatusBadge;

