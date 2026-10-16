import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SlidersHorizontal,
  ArrowUpDown,
  Search,
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

  const standardCategories = [
    { id: 'all', label: 'Tất Cả Thiết Kế' },
    { id: 'upper', label: 'Áo & Tops' },
    { id: 'dress', label: 'Váy Đầm Liền Thân' },
    { id: 'outerwear', label: 'Áo Khoác & Outerwear' },
    { id: 'lower', label: 'Quần & Chân Váy' },
    { id: 'accessories', label: 'Phụ Kiện Thủ Công' },
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

  const getPaginationPages = () => {
    const pages = [];
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* 1. Catalog Editorial Title Banner */}
      <div className="mb-12 pb-8 border-b border-[#E5E0D8] flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-1.5">
            HAUTE COUTURE &bull; CATÁLOGO EXCLUSIVO
          </p>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-normal text-[#161514] tracking-wide">
            Bộ Sưu Tập May Đo Grand Atelier
          </h1>
          <p className="text-xs sm:text-sm text-[#6B655D] mt-2 max-w-xl leading-relaxed">
            Hơn 1.000 thiết kế tinh tuyển từ sợi tự nhiên cao cấp. Mỗi tác phẩm sẵn sàng cho trải nghiệm ướm thử tư gia trực tuyến trước khi quý khách quyết định may đo.
          </p>
        </div>

        {/* Search Bar & Sort Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Tìm theo tên, mã thiết kế..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-[#FAF8F5] border border-[#D8D2C5] text-xs text-[#161514] placeholder-[#8C8476] focus:outline-none focus:border-[#161514] w-56 sm:w-64"
            />
            <Search className="w-3.5 h-3.5 text-[#8C8476] absolute left-3 top-3" />
          </form>

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#FAF8F5] border border-[#161514] text-[#161514] text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#C05A39]" />
            <span>Bộ lọc</span>
          </button>

          <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#D8D2C5] px-3.5 py-2.5 text-xs text-[#161514]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8C8476]" />
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="bg-transparent focus:outline-none font-medium text-xs cursor-pointer tracking-wide uppercase"
            >
              <option value="popular">Tuyển chọn phổ biến</option>
              <option value="newest">Thiết kế mới nhất</option>
              <option value="price-asc">Mức giá: Thấp đến cao</option>
              <option value="price-desc">Mức giá: Cao đến thấp</option>
              <option value="rating">Đánh giá cao nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Main Layout with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Desktop Sidebar Filters (Col 1-3) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-8 pr-6 border-r border-[#E5E0D8]">
          {/* Category Filter */}
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E5E0D8]">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#161514]">
                DANH MỤC THIẾT KẾ
              </h3>
              {(category !== 'all' || priceRange !== 'all' || selectedSize !== 'all' || searchTerm) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[10px] text-[#C05A39] hover:underline flex items-center gap-0.5 cursor-pointer lowercase"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>đặt lại</span>
                </button>
              )}
            </div>

            <ul className="space-y-1 text-xs">
              {categoriesList.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`w-full flex items-center justify-between py-2 px-2.5 transition-colors cursor-pointer ${
                      category === cat.id
                        ? 'bg-[#161514] text-[#FAF8F5] font-medium'
                        : 'text-[#6B655D] hover:text-[#161514] hover:bg-[#F3EFE6]'
                    }`}
                  >
                    <span className="tracking-wide">{cat.label}</span>
                    {typeof cat.count === 'number' && (
                      <span className={`text-[10px] ${category === cat.id ? 'text-[#D8D2C5]' : 'text-[#8C8476]'}`}>
                        ({cat.count})
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Price Range Filter */}
          <div className="pt-6 border-t border-[#E5E0D8]">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#161514] mb-3">
              MỨC GIÁ MAY ĐO
            </h3>
            <div className="space-y-2 text-xs text-[#6B655D]">
              {[
                { id: 'all', label: 'Tất cả mức giá' },
                { id: 'under-500k', label: 'Dưới 500.000₫' },
                { id: '500k-1m', label: '500.000₫ - 1.000.000₫' },
                { id: 'above-1m', label: 'Trên 1.000.000₫' },
              ].map((p) => (
                <label key={p.id} className="flex items-center gap-2.5 cursor-pointer py-0.5 hover:text-[#161514]">
                  <input
                    type="radio"
                    name="priceRange"
                    value={p.id}
                    checked={priceRange === p.id}
                    onChange={() => {
                      setPriceRange(p.id);
                      setPage(1);
                    }}
                    className="accent-[#C05A39]"
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Size Filter */}
          <div className="pt-6 border-t border-[#E5E0D8]">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#161514] mb-3">
              KÍCH CỠ (SIZE)
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
                  className={`w-9 h-9 border text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                    selectedSize === sz
                      ? 'bg-[#161514] text-[#FAF8F5] border-[#161514]'
                      : 'bg-[#FAF8F5] text-[#6B655D] border-[#D8D2C5] hover:border-[#161514] hover:text-[#161514]'
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
          <div className="fixed inset-0 z-50 flex lg:hidden bg-[#161514]/70 backdrop-blur-xs">
            <div className="ml-auto w-full max-w-xs bg-[#FAF8F5] h-full p-6 flex flex-col justify-between overflow-y-auto border-l border-[#E5E0D8]">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
                  <h3 className="font-serif-luxury text-lg text-[#161514]">Bộ lọc danh mục</h3>
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 text-[#8C8476] hover:text-[#161514]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#161514] mb-2">Danh mục</h4>
                  <div className="flex flex-col gap-1 text-xs">
                    {categoriesList.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`text-left px-3 py-2 text-xs ${
                          category === cat.id ? 'bg-[#161514] text-[#FAF8F5] font-medium' : 'text-[#6B655D] hover:bg-[#F3EFE6]'
                        }`}
                      >
                        {cat.label} {cat.count !== undefined ? `(${cat.count})` : ''}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#161514] mb-2">Mức giá</h4>
                  <div className="flex flex-col gap-2 text-xs text-[#6B655D]">
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

              <div className="pt-6 border-t border-[#E5E0D8] flex gap-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex-1 py-2.5 border border-[#161514] text-xs font-semibold tracking-wider uppercase text-[#161514]"
                >
                  Đặt lại
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 py-2.5 bg-[#161514] text-white text-xs font-semibold tracking-wider uppercase"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid Area (Col 4-12) */}
        <div className="lg:col-span-9">
          {/* Result Count and Active Filters Header */}
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E5E0D8]">
            <p className="text-xs text-[#8C8476] font-normal">
              Hiển thị <strong className="text-[#161514] font-medium">{startItem}-{endItem}</strong> trên tổng số{' '}
              <strong className="text-[#161514] font-medium">{totalCount.toLocaleString('vi-VN')}</strong> thiết kế
            </p>
            {totalPages > 1 && (
              <span className="text-[11px] font-medium tracking-wider text-[#8C8476] uppercase">
                Trang {page} / {totalPages}
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-[#F3EFE6] border border-[#E5E0D8] animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 bg-[#F7F5F0] border border-[#E5E0D8]">
              <p className="font-serif-luxury text-2xl text-[#161514]">Không tìm thấy thiết kế phù hợp</p>
              <p className="text-xs text-[#8C8476] mt-2 max-w-sm">Hãy thử nới lỏng bộ lọc hoặc tìm kiếm theo danh mục khác.</p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-noir mt-6"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Minimalist Editorial Pagination Bar */}
              {totalPages > 1 && (
                <div className="mt-16 pt-8 border-t border-[#E5E0D8] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-[#8C8476]">
                    Trang <strong>{page}</strong> của <strong>{totalPages}</strong>
                  </p>

                  <div className="flex items-center gap-1">
                    {/* Previous Button */}
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                      className={`inline-flex items-center gap-1 px-3.5 py-2 border text-xs font-medium tracking-wider uppercase transition-all ${
                        page <= 1
                          ? 'border-[#E5E0D8] text-[#D8D2C5] cursor-not-allowed'
                          : 'border-[#161514] text-[#161514] hover:bg-[#161514] hover:text-[#FAF8F5] cursor-pointer'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Trước</span>
                    </button>

                    {/* Page Numbers */}
                    {getPaginationPages().map((p, idx) =>
                      p === '...' ? (
                        <span key={`dots-${idx}`} className="px-2 text-xs text-[#8C8476]">
                          ...
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePageChange(p)}
                          className={`w-9 h-9 text-xs font-semibold tracking-wider transition-all cursor-pointer border ${
                            page === p
                              ? 'bg-[#161514] text-[#FAF8F5] border-[#161514]'
                              : 'bg-[#FAF8F5] text-[#161514] border-[#E5E0D8] hover:border-[#161514]'
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
                      className={`inline-flex items-center gap-1 px-3.5 py-2 border text-xs font-medium tracking-wider uppercase transition-all ${
                        page >= totalPages
                          ? 'border-[#E5E0D8] text-[#D8D2C5] cursor-not-allowed'
                          : 'border-[#161514] text-[#161514] hover:bg-[#161514] hover:text-[#FAF8F5] cursor-pointer'
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
