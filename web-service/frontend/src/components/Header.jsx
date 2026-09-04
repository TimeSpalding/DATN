import React from 'react';
import { Sparkles, ShieldCheck, Zap, Scissors } from 'lucide-react';

export default function Header() {
  return (
    <div className="text-center max-w-2xl mx-auto mb-7 sm:mb-8">
      {/* Brand Monogram Badge */}
      <div className="inline-flex max-w-full items-center gap-2 px-3 py-1 rounded-full bg-[#f6f5f1] border border-[#ded8cc] text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#a88325] mb-3">
        <Sparkles className="w-3 h-3" />
        <span>L'ATELIER DIGITAL FITTING STUDIO</span>
      </div>

      {/* Editorial Headline */}
      <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#111215] tracking-tight leading-tight">
        Phòng Thử Đồ Kỹ Thuật Số
      </h1>

      <p className="text-xs sm:text-sm text-[#6e7382] mt-2 leading-relaxed max-w-xl mx-auto px-2">
        Ướm thử trang phục thời gian thực trên vóc dáng thật với độ rủ và chi tiết sợi vải chuẩn xác.
      </p>

      {/* Trust Micro-Row */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-6 mt-4 text-[11px] font-semibold text-[#8d887f]">
        <span className="flex items-center gap-1">
          <Scissors className="w-3.5 h-3.5 text-[#a88325]" />
          <span>Sợi vải 4K</span>
        </span>
        <span className="text-[#ded8cc]">&bull;</span>
        <span className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-[#a88325]" />
          <span>Xem trước 30s</span>
        </span>
        <span className="text-[#ded8cc]">&bull;</span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Bảo mật ảnh</span>
        </span>
      </div>
    </div>
  );
}
