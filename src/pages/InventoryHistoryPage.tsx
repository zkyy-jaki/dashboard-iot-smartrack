import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Layers,
  Package,
  Activity,
  RotateCcw
} from 'lucide-react';
import { InventoryHistory, Product } from '../types';
import StatusBadge from '../components/ui/StatusBadge';

interface InventoryHistoryPageProps {
  inventoryHistory: InventoryHistory[];
  products: Product[];
  onRefresh?: () => void;
}

export const InventoryHistoryPage: React.FC<InventoryHistoryPageProps> = ({
  inventoryHistory,
  products,
  onRefresh
}) => {
  const [rowFilter, setRowFilter] = useState('ALL');
  const [skuFilter, setSkuFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Ekstrak tanggal unik secara dinamis dari database audit
  const availableDates = useMemo(() => {
    const dates = new Set(inventoryHistory.map((i) => i.dateOnly).filter(Boolean));
    return Array.from(dates).sort().reverse();
  }, [inventoryHistory]);

  const filteredLogs = useMemo(() => {
    return inventoryHistory.filter((item) => {
      if (rowFilter !== 'ALL' && item.rowId !== rowFilter) return false;
      if (skuFilter !== 'ALL' && item.sku !== skuFilter) return false;
      if (dateFilter !== 'ALL' && item.dateOnly !== dateFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.id.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.rowId.toLowerCase().includes(q) ||
          item.eventType.toLowerCase().includes(q) ||
          item.trigger.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [inventoryHistory, rowFilter, skuFilter, dateFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Filter Controls Bar */}
      <div className="bg-white border border-[#E3E7E5] p-4 rounded-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Date Filter */}
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-mono uppercase text-[#77827D] mb-1">
              Filter Tanggal
            </label>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto px-2.5 py-1.5 text-xs font-mono bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm"
            >
              <option value="ALL">Semua Tanggal ({inventoryHistory.length})</option>
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>

          {/* Row Filter */}
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-mono uppercase text-[#77827D] mb-1">
              Baris Rak
            </label>
            <select
              value={rowFilter}
              onChange={(e) => {
                setRowFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto px-2.5 py-1.5 text-xs font-mono bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm"
            >
              <option value="ALL">Semua Baris</option>
              <option value="Row 01">Baris 01</option>
              <option value="Row 02">Baris 02</option>
              <option value="Row 03">Baris 03</option>
            </select>
          </div>

          {/* Product SKU Filter */}
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-mono uppercase text-[#77827D] mb-1">
              SKU Produk
            </label>
            <select
              value={skuFilter}
              onChange={(e) => {
                setSkuFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto px-2.5 py-1.5 text-xs font-mono bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm"
            >
              <option value="ALL">Semua SKU</option>
              {products.map((p) => (
                <option key={p.id} value={p.sku}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-auto flex items-end gap-2">
          <div className="flex-1 sm:w-auto">
            <label className="block text-[10px] font-mono uppercase text-[#77827D] mb-1">
              Cari Transaksi
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#77827D] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari ID, pemicu, SKU..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 text-xs font-mono bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm w-full sm:w-60"
              />
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Sinkronisasi audit terbaru dari database SQLite"
              className="px-3 py-1.5 text-xs font-mono font-bold bg-[#172B3A] text-white rounded-sm hover:bg-[#254257] flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
          )}
        </div>
      </div>

      {/* History Ledger Container */}
      <div className="bg-white border border-[#E3E7E5] rounded-sm overflow-hidden">
        {/* MOBILE / TABLET VIEW: Responsive Cards (Stacked Vertically without horizontal scrolling) */}
        <div className="md:hidden divide-y divide-[#E3E7E5]">
          {paginatedLogs.length > 0 ? (
            paginatedLogs.map((tx) => (
              <div key={tx.id} className="p-4 space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#172B3A]">{tx.id}</span>
                  <StatusBadge status={tx.eventType} />
                </div>
                <div className="flex items-center justify-between text-[#77827D]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {tx.timestamp}
                  </span>
                  <span className="font-semibold text-[#263238]">{tx.rowId}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-t border-b border-dashed border-[#E3E7E5]">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#172B3A]" />
                    <span className="px-1.5 py-0.5 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm font-semibold">
                      {tx.sku}
                    </span>
                  </div>
                  <div className="tabular-nums">
                    <span>{tx.prevStock}</span>
                    <span className="mx-1 text-[#77827D]">→</span>
                    <strong className="text-[#263238]">{tx.currentStock}</strong>
                    <span
                      className={`ml-1.5 font-bold ${
                        tx.diff > 0 ? 'text-[#66856A]' : 'text-[#D6A34A]'
                      }`}
                    >
                      ({tx.diff > 0 ? `+${tx.diff}` : tx.diff})
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-[#77827D] break-words">
                  <span className="font-semibold text-[#263238]">Pemicu:</span> {tx.trigger}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs font-mono text-[#77827D]">
              Tidak ada riwayat transaksi yang cocok dengan filter.
            </div>
          )}
        </div>

        {/* DESKTOP VIEW: Full Table with Auto-wrapping */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F6F4] border-b border-[#E3E7E5] text-[11px] font-mono uppercase text-[#77827D]">
                <th className="py-3 px-4">ID Transaksi</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Lokasi Rak</th>
                <th className="py-3 px-4">SKU Produk</th>
                <th className="py-3 px-4 text-right">Stok Awal</th>
                <th className="py-3 px-4 text-right">Stok Akhir</th>
                <th className="py-3 px-4 text-right">Selisih</th>
                <th className="py-3 px-4">Tipe Kejadian</th>
                <th className="py-3 px-4">Pemicu Telemetri</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E7E5] text-xs font-mono">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F5F6F4]/60">
                    <td className="py-3 px-4 font-bold text-[#172B3A]">{tx.id}</td>
                    <td className="py-3 px-4 text-[#77827D] tabular-nums whitespace-nowrap">
                      {tx.timestamp}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#263238] whitespace-nowrap">
                      {tx.rackId} • {tx.rowId}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-1.5 py-0.5 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm font-semibold">
                        {tx.sku}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">{tx.prevStock}</td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums">{tx.currentStock}</td>
                    <td
                      className={`py-3 px-4 text-right font-bold tabular-nums ${
                        tx.diff > 0 ? 'text-[#66856A]' : 'text-[#D6A34A]'
                      }`}
                    >
                      {tx.diff > 0 ? `+${tx.diff}` : tx.diff}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={tx.eventType} />
                    </td>
                    <td className="py-3 px-4 text-[#77827D] max-w-xs break-words">
                      {tx.trigger}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#77827D]">
                    Tidak ada riwayat transaksi yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3 bg-[#F5F6F4] border-t border-[#E3E7E5] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <span className="text-[#77827D]">
            Menampilkan {paginatedLogs.length} dari {filteredLogs.length} transaksi
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1 bg-white border border-[#E3E7E5] rounded-sm disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
            </button>
            <span className="px-2">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 bg-white border border-[#E3E7E5] rounded-sm disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryHistoryPage;
