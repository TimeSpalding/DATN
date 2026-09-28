import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, ArrowUpDown, Search, Sparkles } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import { catalogService } from '../services/catalogService';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(categoryParam);
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState('popular');
  const [selectedSize, setSelectedSize] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    if (categoryParam !== category) {
      setCategory(categoryParam);
    }
  }, [categoryParam]);

  const loadProducts = async () => {
    setLoading(true);
    let minPrice = 0;
    let maxPrice = 5000000;

    if (priceRange === 'under-500k') {
      maxPrice = 500000;
    } else if (priceRange === '500k-1m') {
      minPrice = 500000;
      maxPrice = 1000000;
    } else if (priceRange === 'above-1m') {
      minPrice = 1000000;
    }

    try {
      const res = await catalogService.getProducts({
        category,
        search: searchTerm,
        sort,
        size: selectedSize,
        minPrice,
        maxPrice,
        page: 1,
        limit: 24,
      });
      setProducts(res?.data || []);
    } catch (e) {
      console.error('Failed to load catalog products', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [category, sort, selectedSize, priceRange]);

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    setSearchParams(newCat === 'all' ? {} : { category: newCat });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProducts();
  };

  const categoriesList = [
    { id: 'all', label: 'Tất Cả Sản Phẩm' },
    { id: 'upper', label: 'Áo Nam & Nữ' },
    { id: 'lower', label: 'Quần & Váy' },
    { id: 'overall', label: 'Đầm & Đồ Bộ' },
    { id: 'polo', label: 'Áo Polo Dệt Kim' },
    { id: 'shirt', label: 'Áo Sơ Mi' },
    { id: 't-shirt', label: 'Áo Phông / Tee' },
    { id: 'jacket', label: 'Blazer & Áo Khoác' },
  ];

  const sizesList = ['all', 'S', 'M', 'L', 'XL'];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Catalog Title Banner */}
      <div className="mb-8 pb-6 border-b border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-blue-800 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>BỘ SƯU TẬP CAO CẤP &bull; SẴN SÀNG ƯỚM THỬ AI</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Cửa Hàng Thời Trang L'Atelier
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Tất cả sản phẩm đều được may đo chuẩn phom dáng và hỗ trợ ướm thử 3D trực tuyến trên người mẫu trước khi mua hàng.
          </p>
        </div>

        {/* Search Bar & Sort Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Tìm theo tên, mã SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-full text-xs text-slate-900 focus:outline-none focus:border-blue-800 w-52 sm:w-64"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </form>

          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-full px-3 py-1.5 text-xs text-slate-800">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent focus:outline-none font-semibold text-xs cursor-pointer"
            >
              <option value="popular">Bán chạy nhất</option>
              <option value="newest">Mới về</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
              <option value="rating">Đánh giá cao nhất</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block space-y-7 pr-4 border-r border-slate-200">
          {/* Category Filter */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 mb-3 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-blue-800" />
              <span>Danh Mục Trang Phục</span>
            </h3>
            <ul className="space-y-1.5 text-xs">
              {categoriesList.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`w-full text-left py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                      category === cat.id
                        ? 'bg-slate-950 text-white font-bold'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    {cat.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Price Range Filter */}
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 mb-3">
              Mức Giá
            </h3>
            <div className="space-y-2 text-xs text-slate-700">
              {[
                { id: 'all', label: 'Tất cả mức giá' },
                { id: 'under-500k', label: 'Dưới 500.000₫' },
                { id: '500k-1m', label: '500.000₫ - 1.000.000₫' },
                { id: 'above-1m', label: 'Trên 1.000.000₫' },
              ].map((p) => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priceRange"
                    value={p.id}
                    checked={priceRange === p.id}
                    onChange={() => setPriceRange(p.id)}
                    className="accent-slate-950"
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Size Filter */}
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 mb-3">
              Kích Cỡ (Size)
            </h3>
            <div className="flex flex-wrap gap-2">
              {sizesList.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`w-9 h-9 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    selectedSize === sz
                      ? 'bg-slate-950 text-white border-slate-950'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-800'
                  }`}
                >
                  {sz === 'all' ? 'All' : sz}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-sm font-bold text-slate-800">Không tìm thấy sản phẩm phù hợp</p>
              <p className="text-xs text-slate-500 mt-1">Hãy thử xóa bớt bộ lọc hoặc tìm kiếm từ khóa khác.</p>
              <button
                type="button"
                onClick={() => {
                  setCategory('all');
                  setPriceRange('all');
                  setSelectedSize('all');
                  setSearchTerm('');
                }}
                className="mt-4 px-4 py-2 bg-slate-950 text-white rounded-full text-xs font-bold uppercase"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-500 mb-4 font-medium">
                Hiển thị <strong>{products.length}</strong> sản phẩm cao cấp
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
