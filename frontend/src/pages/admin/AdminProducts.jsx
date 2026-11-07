import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const addDialogRef = useRef(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'upper',
    subCategory: 'shirt',
    rawPrice: 450000,
    material: 'Cotton Pima Cao Cấp',
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

  useEffect(() => {
    const dialog = addDialogRef.current;
    if (!dialog) return;
    if (showAddModal) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [showAddModal]);

  const handleDialogBackdropClick = (event) => {
    const dialog = addDialogRef.current;
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return;
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isDialogContent =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;
    if (!isDialogContent) {
      dialog.close();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa thiết kế này khỏi danh mục cửa hàng?')) return;
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
      material: 'Cotton Pima Cao Cấp',
      origin: 'Việt Nam',
      badge: 'Mới về',
      image: '/samples/cloth-1.jpg',
      description: '',
    });
    loadProducts();
  };

  return (
    <div className="max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-[#E5E0D8] gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#C05A39] mb-1">
            DANH MỤC HÀNG HÓA
          </p>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-normal text-[#161514]">
            Quản Lý Sản Phẩm Thời Trang
          </h1>
          <p className="text-xs text-[#6B655D] mt-1">
            Cập nhật thông tin thiết kế, giá bán, chất liệu và hình ảnh phục vụ cửa hàng trực tuyến
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#161514] hover:bg-[#2A2725] text-[#FAF8F5] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer self-start sm:self-auto"
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
            placeholder="Tìm theo tên thiết kế, mã SKU, chất liệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#D8D2C5] text-xs text-[#161514] placeholder-[#8C8476] focus:outline-none focus:border-[#161514]"
          />
          <Search className="w-4 h-4 text-[#8C8476] absolute left-3 top-2.5" />
        </div>

        <span className="text-xs text-[#6B655D]">
          Hiển thị <strong className="text-[#161514]">{products.length}</strong> /{' '}
          <strong className="text-[#161514]">{(totalCount || products.length).toLocaleString('vi-VN')}</strong> thiết kế
        </span>
      </div>

      {/* Table */}
      <div className="border border-[#E5E0D8] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#6B655D] font-semibold uppercase tracking-wider text-[10.5px]">
                <th className="p-3.5">Hình ảnh</th>
                <th className="p-3.5">Mã SKU</th>
                <th className="p-3.5">Tên thiết kế</th>
                <th className="p-3.5">Phân nhóm</th>
                <th className="p-3.5">Giá niêm yết</th>
                <th className="p-3.5">Chất liệu</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D8] text-[#2A2724]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-[#8C8476]">
                    Đang tải danh mục sản phẩm...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-[#8C8476]">
                    Không tìm thấy sản phẩm phù hợp.
                  </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#FAF8F5]/70 transition-colors">
                    <td className="p-3">
                      <img
                        src={resolveImageUrl(prod.image)}
                        alt={prod.name}
                        className="w-12 h-16 object-cover bg-[#F3EFE6] border border-[#E5E0D8]"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/samples/cloth-1.jpg';
                        }}
                      />
                    </td>
                    <td className="p-3 font-mono font-semibold text-[#161514]">{prod.sku}</td>
                    <td className="p-3 font-medium text-[#161514] max-w-xs">{prod.name}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 border border-[#E5E0D8] bg-[#FAF8F5] text-[#161514] text-[10px] font-semibold uppercase tracking-wider">
                        {prod.category}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-[#161514]">{prod.price}</td>
                    <td className="p-3 text-[#6B655D] max-w-[180px] truncate">{prod.material}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(prod.id)}
                        className="p-1.5 text-[#8C8476] hover:text-[#C05A39] transition-colors cursor-pointer"
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
          <div className="p-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-[#6B655D]">
              Trang <strong className="text-[#161514]">{page}</strong> /{' '}
              <strong className="text-[#161514]">{totalPages}</strong> (Tổng{' '}
              <strong className="text-[#161514]">{totalCount.toLocaleString('vi-VN')}</strong> thiết kế)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`inline-flex items-center gap-1 px-3 py-1.5 border text-xs font-semibold uppercase tracking-wider ${
                  page <= 1
                    ? 'border-[#E5E0D8] text-[#D8D2C5] bg-[#F7F5F0] cursor-not-allowed'
                    : 'border-[#D8D2C5] bg-white text-[#161514] hover:border-[#161514] cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={`inline-flex items-center gap-1 px-3 py-1.5 border text-xs font-semibold uppercase tracking-wider ${
                  page >= totalPages
                    ? 'border-[#E5E0D8] text-[#D8D2C5] bg-[#F7F5F0] cursor-not-allowed'
                    : 'border-[#D8D2C5] bg-white text-[#161514] hover:border-[#161514] cursor-pointer'
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
      <dialog
        ref={addDialogRef}
        closedby="any"
        aria-labelledby="admin-add-product-title"
        onClose={() => setShowAddModal(false)}
        onClick={handleDialogBackdropClick}
        className="m-auto w-[min(92vw,520px)] bg-[#FAF8F5] p-0 text-[#161514] border border-[#E5E0D8] shadow-2xl backdrop:bg-[#161514]/70 backdrop:backdrop-blur-xs"
      >
        <div className="p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
            <h3
              id="admin-add-product-title"
              className="font-serif-luxury text-xl font-normal text-[#161514]"
            >
              Thêm Sản Phẩm Mới
            </h3>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              aria-label="Đóng biểu mẫu thêm sản phẩm"
              className="p-1 text-[#8C8476] hover:text-[#161514] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="pt-4 space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B655D] mb-1.5">
                Tên sản phẩm *
              </label>
              <input
                type="text"
                required
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Ví dụ: Áo Sơ Mi Lụa Dệt Kim"
                className="w-full px-3 py-2.5 bg-white border border-[#D8D2C5] text-[#161514] focus:outline-none focus:border-[#161514]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B655D] mb-1.5">
                  Danh mục
                </label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-[#D8D2C5] text-[#161514] focus:outline-none focus:border-[#161514]"
                >
                  <option value="upper">Áo &amp; Tops (Upper)</option>
                  <option value="lower">Quần &amp; Chân váy (Lower)</option>
                  <option value="dress">Đầm &amp; Đồ bộ (Dress)</option>
                  <option value="outerwear">Áo khoác (Outerwear)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B655D] mb-1.5">
                  Giá niêm yết (VND) *
                </label>
                <input
                  type="number"
                  required
                  value={newProduct.rawPrice}
                  onChange={(e) => setNewProduct({ ...newProduct, rawPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-white border border-[#D8D2C5] text-[#161514] focus:outline-none focus:border-[#161514]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B655D] mb-1.5">
                Chất liệu sợi vải
              </label>
              <input
                type="text"
                value={newProduct.material}
                onChange={(e) => setNewProduct({ ...newProduct, material: e.target.value })}
                placeholder="Ví dụ: 100% Cotton Pima tự nhiên"
                className="w-full px-3 py-2.5 bg-white border border-[#D8D2C5] text-[#161514] focus:outline-none focus:border-[#161514]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B655D] mb-1.5">
                Đường dẫn hình ảnh
              </label>
              <input
                type="text"
                value={newProduct.image}
                onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-[#D8D2C5] text-[#161514] focus:outline-none focus:border-[#161514]"
              />
            </div>

            <div className="pt-4 border-t border-[#E5E0D8] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 border border-[#D8D2C5] bg-white text-[#161514] hover:border-[#161514] uppercase tracking-wider font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#161514] hover:bg-[#2A2725] text-[#FAF8F5] font-semibold uppercase tracking-wider cursor-pointer"
              >
                Lưu sản phẩm
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}
