import React from 'react';
import { ShoppingBag, Heart, Search, Sparkles } from 'lucide-react';

export default function Navbar({ cartCount = 0 }) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#ece9e2]">
      {/* Top Announcement Bar */}
      <div className="bg-[#111215] text-[#e8e5dc] text-[9px] sm:text-[10px] font-medium tracking-[0.12em] sm:tracking-[0.2em] uppercase py-1.5 px-4 text-center flex items-center justify-center gap-2 leading-relaxed">
        <Sparkles className="w-3 h-3 text-[#d4af37]" />
        <span>Phòng Thử Đồ Trực Tuyến &bull; Miễn Phí Đổi Size Tận Nhà Trong 30 Ngày</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-3 flex items-center justify-between gap-4">
        {/* Brand logo */}
        <div className="flex items-center min-w-0 gap-10">
          <a href="/" className="flex flex-col group">
            <span className="font-serif text-lg sm:text-2xl font-bold tracking-[0.16em] sm:tracking-[0.2em] text-[#111215] uppercase transition-colors group-hover:text-[#a88325]">
              L'ATELIER
            </span>
            <span className="text-[8px] tracking-[0.3em] text-[#8d887f] uppercase font-semibold -mt-0.5">
              Studio &bull; Fitting Lab
            </span>
          </a>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-[12px] font-bold tracking-wider text-[#6e7382] uppercase">
            <a href="#catalog" className="hover:text-[#111215] transition-colors">Bộ Sưu Tập</a>
            <a href="#catalog" className="hover:text-[#111215] transition-colors">Áo Polo &amp; Sơ Mi</a>
            <a href="#catalog" className="hover:text-[#111215] transition-colors">Quần &amp; Váy</a>
            <a 
              href="#studio" 
              className="inline-flex items-center gap-1.5 text-[#111215] bg-[#f7f6f2] px-3 py-1 rounded-full border border-[#ded8cc] transition-all hover:bg-[#111215] hover:text-white"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Phòng Thử Đồ Ảo</span>
            </a>
          </nav>
        </div>

        {/* Right utility actions */}
        <div className="flex items-center gap-3 sm:gap-4 text-[#2b2e38]">
          <a 
            href="#catalog"
            className="p-2 hover:text-[#111215] hover:bg-[#f6f5f1] rounded-full transition-colors hidden sm:flex cursor-pointer"
            title="Tìm kiếm trang phục"
          >
            <Search className="w-4 h-4" />
          </a>

          <button 
            type="button" 
            aria-label="Yêu thích"
            className="p-2 hover:text-[#111215] hover:bg-[#f6f5f1] rounded-full transition-colors relative cursor-pointer"
          >
            <Heart className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#111215] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              2
            </span>
          </button>

          <a 
            href="#studio"
            className="flex items-center gap-2 bg-[#111215] text-white px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all hover:bg-[#2b2e38] shadow-xs cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="hidden sm:inline">Túi Đồ</span>
            <span className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center text-[10px]">
              {cartCount}
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}
