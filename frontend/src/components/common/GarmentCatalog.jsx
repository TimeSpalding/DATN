import React, { useState, useEffect } from 'react';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import { CATALOG_PRODUCTS } from '../../mocks/catalogData';
import { catalogService } from '../../services/catalogService';
import { resolveImageUrl } from '../../utils/imageUrl';

export default function GarmentCatalog({ selectedGarmentId, onSelectGarment }) {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchItems = async () => {
      setLoading(true);
      try {
        const catParam = filter === 'all' ? undefined : filter;
        const res = await catalogService.getProducts({
          category: catParam,
          limit: 8,
          page: 1,
        });
        if (isMounted && res?.data && res.data.length > 0) {
          setItems(res.data);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Failed to load catalog products for studio showcase, fallback to mock', err);
      }

      if (isMounted) {
        // Fallback
        const fallbackItems = filter === 'all'
          ? CATALOG_PRODUCTS.slice(0, 8)
          : CATALOG_PRODUCTS.filter(item => item.subCategory === filter || (filter === 'upper' && item.category === 'upper')).slice(0, 8);
        setItems(fallbackItems);
        setLoading(false);
      }
    };

    fetchItems();
    return () => { isMounted = false; };
  }, [filter]);

  return (
    <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 w-full">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-blue-800 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>TỦ ĐỒ MẪU &bull; CHỌN ĐỂ ƯỚM THỬ</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
            Bộ Sưu Tập Trang Phục Tuyển Chọn
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chọn sản phẩm bên dưới để tự động nạp vào phòng thử đồ, hoặc tải lên ảnh trang phục riêng của bạn.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold uppercase gap-1 self-start md:self-end shadow-2xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${filter === 'all' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950'}`}
          >
            Tất Cả
          </button>
          <button
            type="button"
            onClick={() => setFilter('upper')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${filter === 'upper' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950'}`}
          >
            Áo &amp; Tops
          </button>
          <button
            type="button"
            onClick={() => setFilter('dress')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${filter === 'dress' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950'}`}
          >
            Váy Đầm
          </button>
          <button
            type="button"
            onClick={() => setFilter('outerwear')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${filter === 'outerwear' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950'}`}
          >
            Áo Khoác
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-slate-100 animate-pulse" />
          ))
        ) : items.map((item) => {
          const isSelected = selectedGarmentId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => onSelectGarment(item)}
              className={`
                group relative flex flex-col rounded-2xl overflow-hidden bg-white cursor-pointer transition-all duration-300
                ${isSelected
                  ? 'ring-2 ring-blue-700 shadow-lg translate-y-[-2px]'
                  : 'border border-slate-200 hover:border-slate-400 hover:shadow-md hover:translate-y-[-2px]'
                }
              `}
            >
              {/* Product Image Stage */}
              <div className="relative aspect-[3/4] bg-slate-50 overflow-hidden">
                <img
                  src={resolveImageUrl(item.image)}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/samples/cloth-1.jpg';
                  }}
                />

                {/* Badge */}
                {item.badge && (
                  <span className="absolute top-2.5 left-2.5 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 bg-white/95 backdrop-blur-md rounded-full text-slate-900 shadow-2xs border border-slate-200/50">
                    {item.badge}
                  </span>
                )}

                {/* Selected Status Overlay */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 bg-blue-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <Check className="w-2.5 h-2.5 text-amber-400" />
                    <span>Đang thử</span>
                  </div>
                )}

                {/* Quick Action Button on Hover */}
                <div className="absolute inset-x-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    type="button"
                    className="w-full bg-slate-950/90 hover:bg-slate-950 backdrop-blur-md text-white text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{isSelected ? 'Đã Chọn' : 'Ướm Thử Ngay'}</span>
                  </button>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-3.5 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                    {item.material || 'Vải cao cấp'}
                  </span>
                  <h3 className="font-semibold text-xs sm:text-sm text-slate-900 mt-1 leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-blue-800 transition-colors">
                    {item.name}
                  </h3>
                </div>

                <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm text-slate-950">
                    {item.price}
                  </span>
                  <span className="text-[11px] text-blue-800 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    <span>Thử</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
