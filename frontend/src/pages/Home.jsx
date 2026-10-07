import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Search, ShieldCheck, Compass, ShoppingBag } from 'lucide-react';
import FittingStudio from '../components/common/FittingStudio';
import GarmentCatalog from '../components/common/GarmentCatalog';
import StudioBenefits from '../components/common/StudioBenefits';
import VisualSearchPanel from '../components/common/VisualSearchPanel';

export default function Home() {
  const [selectedStudioGarment, setSelectedStudioGarment] = useState(null);

  const handleSelectFromCatalog = (garment) => {
    setSelectedStudioGarment(garment);
    const studioEl = document.getElementById('studio');
    if (studioEl) {
      studioEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Editorial Luxury Hero Section */}
      <section className="relative w-full bg-gradient-to-b from-slate-50 via-white to-white pt-12 pb-16 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          
          {/* Monogram Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold uppercase tracking-[0.25em] text-blue-900 mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>L'ATELIER DIGITAL FITTING &bull; HỆ THỐNG THỜI TRANG ĐA PHƯƠNG THỨC</span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.15] max-w-4xl">
            Tủ Đồ Kỹ Thuật Số &amp; Phòng Thử Đồ Ảo AI
          </h1>

          <p className="text-sm sm:text-base text-slate-500 mt-5 leading-relaxed max-w-2xl font-normal">
            Ứng dụng công nghệ thị giác máy tính tiên tiến giúp tìm kiếm trang phục bằng hình ảnh, nhận diện kiểu dáng và mô phỏng ướm thử 3D chính xác trên vóc dáng thật.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mt-8">
            <a
              href="#studio"
              className="inline-flex items-center gap-2 bg-slate-950 hover:bg-blue-900 text-white px-7 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Thử Đồ Trực Tuyến</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 px-7 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-2xs hover:-translate-y-0.5"
            >
              <ShoppingBag className="w-4 h-4 text-blue-800" />
              <span>Xem Bộ Sưu Tập</span>
            </Link>

            <a
              href="#search-engine"
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Search className="w-4 h-4 text-slate-600" />
              <span>Tìm Bằng Ảnh</span>
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-12 mt-14 pt-8 border-t border-slate-200/60 max-w-4xl w-full">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-950">98%</p>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Độ chính xác dáng vải</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-950">&lt; 15s</p>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Tốc độ kết xuất</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-950">50K+</p>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Vector đặc trưng</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-950">100%</p>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Đổi trả tận nơi</p>
            </div>
          </div>
        </div>
      </section>

      {/* 1. Fitting Studio (Modeled after datn_v1) */}
      <div className="w-full bg-slate-50/40 py-6">
        <FittingStudio initialGarment={selectedStudioGarment} />
      </div>

      {/* 2. Curated Garment Catalog (Pick clothes to try on) */}
      <GarmentCatalog
        selectedGarmentId={selectedStudioGarment?.id}
        onSelectGarment={handleSelectFromCatalog}
      />

      {/* 3. Multimodal Visual & Text Search Engine Section */}
      <section id="search-engine" className="w-full bg-slate-50/70 border-t border-b border-slate-200 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-900 mb-2 shadow-2xs">
              <Compass className="w-3.5 h-3.5 text-blue-700" />
              <span>CÔNG NGHỆ TRUY VẤN ĐA PHƯƠNG THỨC</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-slate-950 tracking-tight">
              Tìm Kiếm Trang Phục Bằng AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Kéo thả hình ảnh trang phục bất kỳ hoặc nhập mô tả phong cách để hệ thống tự động nhận diện và đề xuất các mẫu tương đồng.
            </p>
          </div>

          {/* Embedded Visual Search Panel */}
          <VisualSearchPanel />
        </div>
      </section>

      {/* 4. Studio Benefits Section */}
      <StudioBenefits />
    </div>
  );
}