import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
} from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import { catalogService } from '../services/catalogService';

const PAGE_SIZE = 24;

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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [categoriesData, setCategoriesData] = useState([]);

  // Fetch available categories from API
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await catalogService.getCategories();
        if (res?.data && Array.isArray(res.data)) {
          setCategoriesData(res.data);
        }
      } catch (e) {
        console.warn('Failed to fetch categories, using fallback', e);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    if (categoryParam !== category) {
      setCategory(categoryParam);
      setPage(1);
    }
  }, [categoryParam]);

  const loadProducts = async (targetPage = page) => {
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
        page: targetPage,
        limit: PAGE_SIZE,
      });

      setProducts(res?.data || []);
      if (res?.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      }
    } catch (e) {
      console.error('Failed to load catalog products', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [category, sort, selectedSize, priceRange, page]);

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    setPage(1);
    setSearchParams(newCat === 'all' ? {} : { category: newCat });
    if (mobileFilterOpen) setMobileFilterOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadProducts(1);
  };

  const handleResetFilters = () => {
    setCategory('all');
    setPriceRange('all');
    setSelectedSize('all');
    setSearchTerm('');
    setSort('popular');
    setPage(1);
    setSearchParams({});
    if (mobileFilterOpen) setMobileFilterOpen(false);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
  };

  // Generate category list combining static standard labels and backend counts
  const standardCategories = [
    { id: 'all', label: 'Tất Cả Sản Phẩm' },
    { id: 'upper', label: 'Áo & Tops' },
    { id: 'dress', label: 'Váy đầm & Dresses' },
    { id: 'outerwear', label: 'Áo khoác & Outerwear' },
    { id: 'lower', label: 'Quần & Chân váy' },
    { id: 'accessories', label: 'Phụ kiện thời trang' },
  ];

  const categoriesList = standardCategories.map((c) => {
    if (c.id === 'all') return { ...c, count: totalCount };
    const matched = categoriesData.find((dbCat) => dbCat.code === c.id);
    return {
      ...c,
      count: matched?.productCount,
    };
  });

  const sizesList = ['all', 'S', 'M', 'L', 'XL'];

  // Pagination helper to generate smart page numbers with ellipsis
  const getPaginationPages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const startItem = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, totalCount);

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
            Toàn bộ 1.000+ sản phẩm catalog được tối ưu hóa dữ liệu số, may đo chuẩn dáng và hỗ trợ ướm thử 3D trực tuyến trên người mẫu trước khi mua hàng.
          </p>
        </div>

        {/* Search Bar, Filter Button on Mobile, & Sort Dropdown */}
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

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-full text-xs font-bold transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-800" />
            <span>Bộ lọc</span>
          </button>

          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-full px-3 py-1.5 text-xs text-slate-800">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
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
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-7 pr-4 border-r border-slate-200">
          {/* Category Filter */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-blue-800" />
                <span>Danh Mục Trang Phục</span>
              </span>
              {(category !== 'all' || priceRange !== 'all' || selectedSize !== 'all' || searchTerm) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[10px] text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer lowercase"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>đặt lại</span>
                </button>
              )}
            </h3>
            <ul className="space-y-1.5 text-xs">
              {categoriesList.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`w-full flex items-center justify-between py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                      category === cat.id
                        ? 'bg-slate-950 text-white font-bold'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {typeof cat.count === 'number' && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          category === cat.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {cat.count}
                      </span>
                    )}
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
                    onChange={() => {
                      setPriceRange(p.id);
                      setPage(1);
                    }}
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
                  onClick={() => {
                    setSelectedSize(sz);
                    setPage(1);
                  }}
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

        {/* Mobile Filter Modal / Drawer */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/60 backdrop-blur-xs">
            <div className="ml-auto w-full max-w-xs bg-white h-full p-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <h3 className="font-bold text-sm text-slate-950">Bộ lọc danh mục</h3>
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-950"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-900 mb-2">Danh mục</h4>
                  <div className="flex flex-col gap-1">
                    {categoriesList.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                          category === cat.id ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {cat.label} {cat.count !== undefined ? `(${cat.count})` : ''}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-900 mb-2">Mức giá</h4>
                  <div className="flex flex-col gap-2 text-xs">
                    {[
                      { id: 'all', label: 'Tất cả mức giá' },
                      { id: 'under-500k', label: 'Dưới 500.000₫' },
                      { id: '500k-1m', label: '500.000₫ - 1.000.000₫' },
                      { id: 'above-1m', label: 'Trên 1.000.000₫' },
                    ].map((p) => (
                      <label key={p.id} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mobilePrice"
                          value={p.id}
                          checked={priceRange === p.id}
                          onChange={() => {
                            setPriceRange(p.id);
                            setPage(1);
                          }}
                        />
                        <span>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 flex gap-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex-1 py-2.5 border border-slate-300 rounded-full text-xs font-bold text-slate-700"
                >
                  Đặt lại
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 py-2.5 bg-slate-950 text-white rounded-full text-xs font-bold"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {/* Result Count and Active Filters Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <p className="text-xs text-slate-500 font-medium">
              Hiển thị <strong className="text-slate-900">{startItem}-{endItem}</strong> trên tổng số{' '}
              <strong className="text-slate-900">{totalCount.toLocaleString('vi-VN')}</strong> sản phẩm
            </p>
            {totalPages > 1 && (
              <span className="text-[11px] font-semibold text-slate-400">
                Trang {page} / {totalPages}
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
                onClick={handleResetFilters}
                className="mt-4 px-5 py-2.5 bg-slate-950 text-white rounded-full text-xs font-bold uppercase transition-all shadow-xs hover:bg-blue-900"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Enterprise Pagination Bar */}
              {totalPages > 1 && (
                <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-slate-500">
                    Trang <strong>{page}</strong> của <strong>{totalPages}</strong>
                  </p>

                  <div className="flex items-center gap-1.5">
                    {/* Previous Button */}
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        page <= 1
                          ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                          : 'border-slate-300 text-slate-700 hover:border-slate-950 hover:text-slate-950 cursor-pointer bg-white'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Trước</span>
                    </button>

                    {/* Page Numbers */}
                    {getPaginationPages().map((p, idx) =>
                      p === '...' ? (
                        <span key={`dots-${idx}`} className="px-2 text-xs text-slate-400">
                          ...
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePageChange(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            page === p
                              ? 'bg-slate-950 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-800'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                    {/* Next Button */}
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => handlePageChange(page + 1)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        page >= totalPages
                          ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                          : 'border-slate-300 text-slate-700 hover:border-slate-950 hover:text-slate-950 cursor-pointer bg-white'
                      }`}
                    >
                      <span>Sau</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
