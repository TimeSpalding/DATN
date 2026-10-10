import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, ShoppingBag, Eye, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import { resolveImageUrl } from '../../utils/imageUrl';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'upper',
    subCategory: 'shirt',
    rawPrice: 450000,
    material: 'Cotton Cao Cấp',
    origin: 'Việt Nam',
    badge: 'Mới về',
    image: '/samples/cloth-1.jpg',
    description: '',
  });

  const loadProducts = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await catalogService.getProducts({ page: targetPage, limit: 20, search: searchTerm });
      setProducts(res?.data || []);
      if (res?.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadProducts(1);
  }, [searchTerm]);

  useEffect(() => {
    loadProducts(page);
  }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    await catalogService.deleteProduct(id);
    loadProducts();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    await catalogService.addProduct(newProduct);
    setShowAddModal(false);
    setNewProduct({
      name: '',
      category: 'upper',
      subCategory: 'shirt',
      rawPrice: 450000,
      material: 'Cotton Cao Cấp',
      origin: 'Việt Nam',
      badge: 'Mới về',
      image: '/samples/cloth-1.jpg',
      description: '',
    });
    loadProducts();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-950">Quản Lý Sản Phẩm Thời Trang</h1>
          <p className="text-xs text-slate-500 mt-1">Danh mục sản phẩm phục vụ bán lẻ và mô hình AI Thử đồ</p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm sản phẩm mới</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="my-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Tìm theo tên, SKU, chất liệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-slate-950"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Tổng cộng: <strong>{products.length}</strong> sản phẩm
        </span>
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-2xl bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Hình ảnh</th>
                <th className="p-3.5">Mã SKU</th>
                <th className="p-3.5">Tên sản phẩm</th>
                <th className="p-3.5">Danh mục</th>
                <th className="p-3.5">Giá bán</th>
                <th className="p-3.5">Chất liệu</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Đang tải danh sách...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Không có sản phẩm nào.</td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <img
                        src={resolveImageUrl(prod.image)}
                        alt={prod.name}
                        className="w-12 h-16 object-cover rounded-lg bg-slate-100 border border-slate-200"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/samples/cloth-1.jpg';
                        }}
                      />
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">{prod.sku}</td>
                    <td className="p-3 font-semibold text-slate-900 max-w-xs">{prod.name}</td>
                    <td className="p-3 capitalize">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {prod.category}
                      </span>
                    </td>
                    <td className="p-3 font-extrabold text-blue-900">{prod.price}</td>
                    <td className="p-3 text-slate-500 max-w-[150px] truncate">{prod.material}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(prod.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Admin Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              Trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Tổng <strong>{totalCount.toLocaleString('vi-VN')}</strong> sản phẩm)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                  page <= 1
                    ? 'border-slate-200 text-slate-300 bg-slate-100 cursor-not-allowed'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-950 cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                  page >= totalPages
                    ? 'border-slate-200 text-slate-300 bg-slate-100 cursor-not-allowed'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-950 cursor-pointer'
                }`}
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950">
                Thêm Sản Phẩm Mới
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Ví dụ: Áo Sơ Mi Lụa Dệt Kim"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Danh mục</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="upper">Áo (Upper)</option>
                    <option value="lower">Quần/Váy (Lower)</option>
                    <option value="overall">Đầm/Đồ bộ (Overall)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giá bán (VND) *</label>
                  <input
                    type="number"
                    required
                    value={newProduct.rawPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, rawPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chất liệu</label>
                <input
                  type="text"
                  value={newProduct.material}
                  onChange={(e) => setNewProduct({ ...newProduct, material: e.target.value })}
                  placeholder="Ví dụ: Cotton 100% tự nhiên"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Đường dẫn ảnh mẫu</label>
                <input
                  type="text"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-950 text-white rounded-xl font-bold uppercase"
                >
                  Lưu sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
