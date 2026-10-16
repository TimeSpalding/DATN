import React, { useState, useEffect } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { CATALOG_PRODUCTS } from '../../mocks/catalogData';
import { catalogService } from '../../services/catalogService';
import { resolveImageUrl } from '../../utils/imageUrl';
import { enrichProduct } from '../../utils/productEnricher';

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
    <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 w-full">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-[#E5E0D8] gap-6">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-1.5">
            BỘ SƯU TẬP TUYỂN LỰA
          </p>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl font-normal text-[#161514] tracking-wide">
            Thiết Kế Sẵn Sàng Cho Phòng Ướm Thử
          </h2>
          <p className="text-xs sm:text-sm text-[#6B655D] mt-2 max-w-xl leading-relaxed">
            Chọn bất kỳ thiết kế nào bên dưới để nạp trực tiếp vào phòng thử đồ tư gia, hoặc tải lên ảnh trang phục riêng của quý khách.
          </p>
        </div>

        {/* Minimalist Filter Tabs */}
        <div className="flex items-center gap-1 border-b border-[#161514] self-start md:self-end pb-1 text-xs">
          {[
            { id: 'all', label: 'TẤT CẢ' },
            { id: 'upper', label: 'ÁO & TOPS' },
            { id: 'dress', label: 'VÁY ĐẦM' },
            { id: 'outerwear', label: 'ÁO KHOÁC' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilter(cat.id)}
              className={`px-3 py-1.5 text-[10.5px] font-medium tracking-[0.18em] transition-all cursor-pointer ${
                filter === cat.id
                  ? 'bg-[#161514] text-[#FAF8F5]'
                  : 'text-[#6B655D] hover:text-[#161514] hover:bg-[#F3EFE6]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-[#F3EFE6] animate-pulse border border-[#E5E0D8]" />
          ))
        ) : items.map((item) => {
          const isSelected = selectedGarmentId === item.id;
          const enriched = enrichProduct(item);

          return (
            <div
              key={item.id}
              onClick={() => onSelectGarment(item)}
              className={`
                group relative flex flex-col bg-[#FAF8F5] cursor-pointer transition-all duration-500
                ${isSelected
                  ? 'border-2 border-[#161514] shadow-md -translate-y-1'
                  : 'border border-[#E5E0D8] hover:border-[#161514] hover:-translate-y-1'
                }
              `}
            >
              {/* Product Image Stage */}
              <div className="relative aspect-[3/4] bg-[#F3EFE6] overflow-hidden">
                <img
                  src={resolveImageUrl(item.image)}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/samples/cloth-1.jpg';
                  }}
                />

                {/* Badge */}
                {item.badge && (
                  <span className="absolute top-3 left-3 text-[9px] font-semibold tracking-[0.2em] uppercase px-2.5 py-1 bg-[#161514] text-[#FAF8F5]">
                    {item.badge}
                  </span>
                )}

                {/* Selected Status Overlay */}
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-[#C05A39] text-[#FAF8F5] text-[9.5px] font-medium tracking-widest uppercase px-2.5 py-1 flex items-center gap-1 shadow-sm">
                    <Check className="w-3 h-3" />
                    <span>ĐANG THỬ</span>
                  </div>
                )}

                {/* Quick Action Button on Hover */}
                <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    type="button"
                    className="w-full bg-[#161514] text-[#FAF8F5] text-[10.5px] font-medium tracking-[0.18em] uppercase py-2.5 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>{isSelected ? 'ĐÃ CHỌN ƯỚM THỬ' : 'CHỌN ƯỚM THỬ'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-4 flex flex-col flex-1 justify-between bg-[#FAF8F5]">
                <div>
                  <div className="flex items-center justify-between text-[10px] tracking-[0.2em] text-[#8C8476] uppercase font-medium">
                    <span className="truncate max-w-[130px]">{enriched.enrichedFabric?.composition?.split(' ')[0]} {enriched.enrichedFabric?.composition?.split(' ')[1] || 'ATELIER'}</span>
                    <span>{enriched.atelierCode}</span>
                  </div>

                  <h3 className="font-serif-luxury text-base font-normal text-[#161514] mt-1.5 leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-[#C05A39] transition-colors">
                    {item.name}
                  </h3>
                </div>

                <div className="mt-3 pt-3 border-t border-[#E5E0D8] flex items-center justify-between">
                  <span className="font-medium text-sm text-[#161514]">
                    {item.price}
                  </span>
                  <span className="text-[10.5px] font-semibold tracking-[0.16em] uppercase text-[#C05A39] flex items-center gap-1">
                    <span>Ướm Thử</span>
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
