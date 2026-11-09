import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Package,
  Ruler
} from 'lucide-react';
import { Product, RackRow } from '../types';
import { IoTApiService } from '../services/iotApiService';

interface ProductManagementPageProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  rows: RackRow[];
  triggerToast: (msg: string, type?: 'info' | 'danger') => void;
}

export const ProductManagementPage: React.FC<ProductManagementPageProps> = ({
  products,
  setProducts,
  rows,
  triggerToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmSku, setDeleteConfirmSku] = useState<string | null>(null);

  const [formState, setFormState] = useState({
    name: '',
    sku: '',
    lengthCm: 20,
    widthCm: 15,
    heightCm: 15,
    description: ''
  });

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormState({
      name: '',
      sku: `SKU-00${products.length + 1}`,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 15,
      description: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormState({
      name: product.name,
      sku: product.sku,
      lengthCm: product.lengthCm,
      widthCm: product.widthCm,
      heightCm: product.heightCm,
      description: product.description
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.sku.trim()) return;

    const normalized: Omit<Product, 'id'> = {
      name: formState.name.trim(),
      sku: formState.sku.trim().toUpperCase(),
      lengthCm: Math.max(5, Number(formState.lengthCm)),
      widthCm: Math.max(5, Number(formState.widthCm)),
      heightCm: Math.max(5, Number(formState.heightCm)),
      description: formState.description.trim()
    };

    if (editingProduct) {
      await IoTApiService.updateProduct(editingProduct.sku, normalized);
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...normalized } : p))
      );
      triggerToast(`Produk ${normalized.sku} berhasil diperbarui di database.`);
    } else {
      const saved = await IoTApiService.createProduct(normalized);
      const newProd: Product = saved || {
        id: `prod-${Date.now()}`,
        ...normalized
      };
      setProducts((prev) => [...prev, newProd]);
      triggerToast(`Produk baru ${normalized.sku} berhasil disimpan ke database.`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteProduct = async (sku: string) => {
    const isAssigned = rows.some((r) => r.sku === sku);
    if (isAssigned) {
      triggerToast(`Tidak dapat menghapus ${sku}: masih ditetapkan pada baris rak aktif.`, 'danger');
      setDeleteConfirmSku(null);
      return;
    }
    await IoTApiService.deleteProduct(sku);
    setProducts((prev) => prev.filter((p) => p.sku !== sku));
    triggerToast(`Produk ${sku} telah dihapus dari database.`);
    setDeleteConfirmSku(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white border border-[#E3E7E5] p-4 rounded-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold font-mono uppercase text-[#263238]">
            Katalog SKU &amp; Konfigurasi Dimensi Kardus Produk
          </h2>
          <p className="text-xs text-[#77827D] mt-0.5">
            Dimensi <strong className="text-[#263238]">Panjang (cm)</strong> adalah sisi kardus yang sejajar dengan arah tembak sensor ultrasonik kiri &amp; kanan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 text-[#77827D] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari SKU atau nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs font-mono bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm focus:outline-none focus:border-[#172B3A] w-full sm:w-56"
            />
          </div>
          <button
            onClick={openAddModal}
            className="w-full sm:w-auto px-3 py-1.5 text-xs font-mono font-semibold bg-[#172B3A] text-white rounded-sm hover:bg-[#223d52] flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah SKU Produk</span>
          </button>
        </div>
      </div>

      {/* Product List Container */}
      <div className="bg-white border border-[#E3E7E5] rounded-sm overflow-hidden">
        {/* MOBILE VIEW: Cards that stack vertically downward (No horizontal scroll) */}
        <div className="md:hidden divide-y divide-[#E3E7E5]">
          {filteredProducts.map((product) => {
            const assignedRow = rows.find((r) => r.sku === product.sku);
            return (
              <div key={product.id} className="p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#172B3A] text-white font-mono font-bold rounded-sm">
                      {product.sku}
                    </span>
                    <strong className="text-[#263238]">{product.name}</strong>
                  </div>
                  {assignedRow ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#66856A]/15 text-[#4A644E] border border-[#66856A]/30 rounded-sm font-semibold">
                      {assignedRow.rowId}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#77827D]">Belum Ditetapkan</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 p-2 bg-[#F5F6F4] rounded-sm font-mono text-[11px]">
                  <div>
                    <span className="text-[#77827D] block">Panjang Sumbu Ukur:</span>
                    <span className="font-bold text-[#172B3A]">{product.lengthCm} cm</span>
                  </div>
                  <div>
                    <span className="text-[#77827D] block">Lebar × Tinggi:</span>
                    <span>{product.widthCm} × {product.heightCm} cm</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#77827D] break-words">
                  {product.description}
                </p>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-dashed border-[#E3E7E5] font-mono">
                  <button
                    onClick={() => openEditModal(product)}
                    className="px-2.5 py-1 text-xs bg-white border border-[#E3E7E5] hover:border-[#172B3A] rounded-sm flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  {deleteConfirmSku === product.sku ? (
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteProduct(product.sku)}
                        className="px-2 py-1 text-xs bg-[#C85C54] text-white rounded-sm font-bold"
                      >
                        Ya, Hapus
                      </button>
                      <button
                        onClick={() => setDeleteConfirmSku(null)}
                        className="px-2 py-1 text-xs bg-gray-200 text-[#263238] rounded-sm"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmSku(product.sku)}
                      className="p-1 text-[#77827D] hover:text-[#C85C54] border border-[#E3E7E5] rounded-sm"
                      title="Hapus SKU"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* DESKTOP VIEW: Table with Auto-wrapping */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F6F4] border-b border-[#E3E7E5] text-[11px] font-mono uppercase text-[#77827D]">
                <th className="py-3 px-4">Kode SKU</th>
                <th className="py-3 px-4">Nama Produk</th>
                <th className="py-3 px-4">Panjang (Sumbu Ukur)</th>
                <th className="py-3 px-4">Lebar × Tinggi</th>
                <th className="py-3 px-4">Baris Rak</th>
                <th className="py-3 px-4">Deskripsi Produk</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E7E5] text-xs">
              {filteredProducts.map((product) => {
                const assignedRow = rows.find((r) => r.sku === product.sku);
                return (
                  <tr key={product.id} className="hover:bg-[#F5F6F4]/50">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#172B3A] whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm">
                        {product.sku}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#263238] whitespace-nowrap">
                      {product.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-[#172B3A]/10 text-[#172B3A] font-bold rounded-sm">
                        {product.lengthCm} cm
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#77827D] whitespace-nowrap">
                      {product.widthCm} cm × {product.heightCm} cm
                    </td>
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      {assignedRow ? (
                        <span className="px-2 py-0.5 bg-[#66856A]/15 text-[#4A644E] border border-[#66856A]/30 rounded-sm font-semibold">
                          {assignedRow.rowId}
                        </span>
                      ) : (
                        <span className="text-[#77827D]">Belum Ditetapkan</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#77827D] max-w-sm break-words">
                      {product.description}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="px-2 py-1 text-xs bg-[#F5F6F4] border border-[#E3E7E5] hover:border-[#172B3A] rounded-sm flex items-center gap-1 font-semibold"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        {deleteConfirmSku === product.sku ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteProduct(product.sku)}
                              className="px-2 py-1 text-xs bg-[#C85C54] text-white rounded-sm font-bold"
                            >
                              Hapus
                            </button>
                            <button
                              onClick={() => setDeleteConfirmSku(null)}
                              className="px-2 py-1 text-xs bg-gray-200 text-[#263238] rounded-sm"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmSku(product.sku)}
                            className="p-1 text-[#77827D] hover:text-[#C85C54] border border-transparent hover:border-[#E3E7E5] rounded-sm"
                            title="Hapus SKU"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E7E5] rounded-sm w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 bg-[#172B3A] text-white flex items-center justify-between shrink-0">
              <h3 className="text-sm font-mono font-bold uppercase">
                {editingProduct ? `Edit Produk — ${editingProduct.sku}` : 'Daftarkan SKU Kardus Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono uppercase text-[#77827D] mb-1">
                    Kode SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.sku}
                    onChange={(e) => setFormState({ ...formState, sku: e.target.value })}
                    className="w-full px-3 py-2 font-mono border border-[#E3E7E5] rounded-sm bg-[#F5F6F4] font-bold"
                  />
                </div>
                <div>
                  <label className="block font-mono uppercase text-[#77827D] mb-1">
                    Nama Produk *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E3E7E5] rounded-sm font-medium"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm">
                <div className="font-mono font-bold text-[#172B3A] mb-2">
                  Dimensi Fisik Kardus (cm)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-[#172B3A] font-semibold mb-1">
                      Panjang (Aksial) *
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      required
                      value={formState.lengthCm}
                      onChange={(e) => setFormState({ ...formState, lengthCm: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 font-mono border border-[#172B3A] bg-white rounded-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#77827D] mb-1">
                      Lebar (cm) *
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      required
                      value={formState.widthCm}
                      onChange={(e) => setFormState({ ...formState, widthCm: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 font-mono border border-[#E3E7E5] bg-white rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#77827D] mb-1">
                      Tinggi (cm) *
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      required
                      value={formState.heightCm}
                      onChange={(e) => setFormState({ ...formState, heightCm: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 font-mono border border-[#E3E7E5] bg-white rounded-sm"
                    />
                  </div>
                </div>
                <p className="text-[11px] font-mono text-[#77827D] mt-2">
                  Catatan: Panjang (cm) digunakan langsung dalam rumus estimasi jumlah stok per baris rak.
                </p>
              </div>

              <div>
                <label className="block font-mono uppercase text-[#77827D] mb-1">
                  Deskripsi Barang
                </label>
                <textarea
                  rows={3}
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E3E7E5] rounded-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E3E7E5]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-mono text-xs bg-[#F5F6F4] border border-[#E3E7E5] rounded-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-mono text-xs font-semibold bg-[#172B3A] text-white rounded-sm hover:bg-[#223d52]"
                >
                  Simpan SKU Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagementPage;
