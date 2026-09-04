import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, Upload } from 'lucide-react';

export const CATALOG_ITEMS = [
  {
    id: 'polo-retro',
    name: 'Áo Polo Dệt Kim Họa Tiết Retro Khóa Zip',
    price: '489.000₫',
    rawPrice: 489000,
    category: 'upper',
    type: 'polo',
    badge: 'Bán chạy',
    material: 'Cotton Dệt Kim Co Giãn',
    image: '/samples/cloth-1.jpg',
  },
  {
    id: 'graphic-tee',
    name: 'Áo Thun Cổ Tròn Graphic Owl Heavyweight',
    price: '350.000₫',
    rawPrice: 350000,
    category: 'upper',
    type: 'tee',
    badge: 'Mới về',
    material: 'Cotton 280gsm Dày Dặn',
    image: '/samples/cloth-2.webp',
  },
  {
    id: 'linen-shirt',
    name: 'Áo Sơ Mi Trắng Cổ Tàu Poplin Sang Trọng',
    price: '520.000₫',
    rawPrice: 520000,
    category: 'upper',
    type: 'shirt',
    badge: 'Độc quyền',
    material: 'Poplin Cotton Ai Cập Chống Nhăn',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'maxi-dress',
    name: 'Váy Đầm Dài Linen Thắt Eo Nữ Tính',
    price: '890.000₫',
    rawPrice: 890000,
    category: 'overall',
    type: 'dress',
    badge: 'Cao cấp',
    material: '100% Pure Linen Thô',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
  }
];

export default function GarmentCatalog({ selectedGarmentId, onSelectGarment, onUploadCustomClick }) {
  const [filter, setFilter] = useState('all');

  const filteredItems = filter === 'all' 
    ? CATALOG_ITEMS 
    : CATALOG_ITEMS.filter(item => item.type === filter || (filter === 'upper' && item.category === 'upper'));

  return (
    <section id="catalog" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-[#ece9e2] gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#a88325] mb-1.5">
            <Sparkles className="w-3 h-3" />
            <span>Tủ Đồ Mẫu &bull; Chọn Để Ướm Thử</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111215] tracking-tight">
            Bộ Sưu Tập Trang Phục Tuyển Chọn
          </h2>
          <p className="text-xs sm:text-sm text-[#6e7382] mt-1">
            Chọn sản phẩm bên dưới để tự động nạp vào phòng thử đồ, hoặc tải lên ảnh trang phục riêng của bạn.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex items-center p-0.5 rounded-full bg-white border border-[#ded8cc] text-[10px] font-bold uppercase gap-1 self-start md:self-end shadow-2xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${filter === 'all' ? 'bg-[#111215] text-white shadow-xs' : 'text-[#6e7382] hover:text-[#111215]'}`}
          >
            Tất Cả
          </button>
          <button
            type="button"
            onClick={() => setFilter('polo')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${filter === 'polo' ? 'bg-[#111215] text-white shadow-xs' : 'text-[#6e7382] hover:text-[#111215]'}`}
          >
            Polo
          </button>
          <button
            type="button"
            onClick={() => setFilter('shirt')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${filter === 'shirt' ? 'bg-[#111215] text-white shadow-xs' : 'text-[#6e7382] hover:text-[#111215]'}`}
          >
            Sơ Mi
          </button>
          <button
            type="button"
            onClick={() => setFilter('dress')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${filter === 'dress' ? 'bg-[#111215] text-white shadow-xs' : 'text-[#6e7382] hover:text-[#111215]'}`}
          >
            Váy Đầm
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {filteredItems.map((item) => {
          const isSelected = selectedGarmentId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => onSelectGarment(item)}
              className={`
                group relative flex flex-col rounded-2xl overflow-hidden bg-white cursor-pointer transition-all duration-300
                ${isSelected
                  ? 'ring-2 ring-[#111215] shadow-lg translate-y-[-2px]'
                  : 'border border-[#ece9e2] hover:border-[#111215]/30 hover:shadow-md hover:translate-y-[-2px]'
                }
              `}
            >
              {/* Product Image Stage */}
              <div className="relative aspect-[3/4] bg-[#f7f6f2] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Badge */}
                <span className="absolute top-2.5 left-2.5 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 bg-white/95 backdrop-blur-md rounded-full text-[#111215] shadow-2xs">
                  {item.badge}
                </span>

                {/* Selected Status Overlay */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 bg-[#111215] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <Check className="w-2.5 h-2.5 text-[#d4af37]" />
                    <span>Đang thử</span>
                  </div>
                )}

                {/* Quick Action Button on Hover */}
                <div className="absolute inset-x-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    type="button"
                    className="w-full bg-[#111215]/90 hover:bg-[#111215] backdrop-blur-md text-white text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Sparkles className="w-3 h-3 text-[#d4af37]" />
                    <span>{isSelected ? 'Đã Chọn' : 'Ướm Thử Ngay'}</span>
                  </button>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-3.5 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-[#8d887f] uppercase tracking-wider block truncate">
                    {item.material}
                  </span>
                  <h3 className="font-semibold text-xs sm:text-sm text-[#111215] mt-1 leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-[#a88325] transition-colors">
                    {item.name}
                  </h3>
                </div>

                <div className="mt-2.5 pt-2.5 border-t border-[#f4f3ee] flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm text-[#111215]">
                    {item.price}
                  </span>
                  <span className="text-[11px] text-[#a88325] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
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
