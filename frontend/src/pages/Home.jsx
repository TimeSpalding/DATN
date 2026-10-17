import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Scissors, Sparkles } from 'lucide-react';
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
    <div className="w-full flex flex-col items-center bg-[#FAF8F5]">
      
      {/* 1. Cinematic Luxury Hero Section (Inspired by Grand Hotel Central) */}
      <section className="relative w-full min-h-[85vh] flex flex-col justify-between bg-[#161514] text-[#FAF8F5] overflow-hidden">
        {/* Background Editorial Imagery with Dark Cinematic Tone */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85"
            alt="Grand Atelier Central Editorial Campaign"
            className="w-full h-full object-cover object-center opacity-40 scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#161514] via-[#161514]/40 to-[#161514]/70" />
        </div>

        {/* Hero Center Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center flex flex-col items-center my-auto">
          
          {/* Overline */}
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="w-6 h-[1px] bg-[#C05A39]" />
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] uppercase text-[#D8D2C5]">
              HAUTE COUTURE &bull; DIGITAL FITTING SUITE &bull; BARCELONA &amp; HÀ NỘI
            </span>
            <span className="w-6 h-[1px] bg-[#C05A39]" />
          </div>

          {/* Main Headline */}
          <h1 className="font-serif-luxury text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-normal text-[#FAF8F5] tracking-tight leading-[1.1] max-w-4xl">
            Một Không Gian Thời Trang Đương Đại Nơi Nghệ Thuật &amp; Cảm Xúc Giao Thoa
          </h1>

          <p className="font-serif-luxury text-base sm:text-xl text-[#D8D2C5] mt-6 max-w-2xl leading-relaxed italic">
            "Chào mừng quý khách đến với Grand Atelier Central — nơi từng thớ sợi dệt tự nhiên hòa cùng kỹ nghệ rập chuẩn mực và trải nghiệm ướm thử tư gia độc bản."
          </p>

          {/* Action CTAs: Terracotta, Outline Light, and Noir */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            <a
              href="#studio"
              className="btn-terracotta"
            >
              <span>Phòng Thử Đồ Tư Gia</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>

            <Link
              to="/catalog"
              className="btn-outline-light"
            >
              <span>Xem Bộ Sưu Tập</span>
            </Link>

            <a
              href="#visual-concierge"
              className="btn-outline-light border-white/20 text-[#D8D2C5] hover:text-[#161514]"
            >
              <Compass className="w-3.5 h-3.5 mr-1" />
              <span>Visual Concierge</span>
            </a>
          </div>
        </div>

        {/* Floating Boutique Experience Bar (Inspired by Grand Hotel Central's bottom check-in bar) */}
        <div className="relative z-10 w-full border-t border-white/10 bg-[#161514]/90 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center text-xs">
              
              <div className="border-r border-white/10 pr-4">
                <span className="text-[9.5px] uppercase tracking-[0.2em] text-[#8C8476] block mb-0.5">
                  BỘ SƯU TẬP
                </span>
                <span className="font-medium text-[#FAF8F5] text-xs uppercase tracking-wider">
                  Mùa Thu &bull; Đông 2026
                </span>
              </div>

              <div className="border-r border-white/10 pr-4">
                <span className="text-[9.5px] uppercase tracking-[0.2em] text-[#8C8476] block mb-0.5">
                  DÁNG ÁO (FIT)
                </span>
                <span className="font-medium text-[#FAF8F5] text-xs uppercase tracking-wider">
                  Regular Tailored &bull; Tapered
                </span>
              </div>

              <div className="border-r border-white/10 pr-4">
                <span className="text-[9.5px] uppercase tracking-[0.2em] text-[#8C8476] block mb-0.5">
                  CHẤT LIỆU NGUỒN GỐC
                </span>
                <span className="font-medium text-[#FAF8F5] text-xs uppercase tracking-wider">
                  100% Sợi Tự Nhiên Sinh Thái
                </span>
              </div>

              <div className="flex justify-end">
                <Link
                  to="/catalog"
                  className="w-full sm:w-auto text-center py-2.5 px-6 bg-[#C05A39] hover:bg-[#A64B2E] text-white text-[10.5px] font-semibold tracking-[0.2em] uppercase transition-all"
                >
                  Khám Phá Cửa Hàng
                </Link>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 2. Editorial Narrative Section: The Philosophy of the Maison */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-b border-[#E5E0D8]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left: Atmospheric Workshop & Fabric Imagery */}
          <div className="lg:col-span-5 relative">
            <div className="aspect-[3/4] bg-[#F3EFE6] overflow-hidden border border-[#E5E0D8]">
              <img
                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=85"
                alt="Artisanal tailoring workshop at Maison Central"
                className="w-full h-full object-cover transition-transform duration-1000 hover:scale-103"
              />
            </div>
            {/* Small offset caption */}
            <div className="absolute -bottom-5 -right-5 bg-[#FAF8F5] border border-[#E5E0D8] p-4 max-w-xs shadow-md hidden sm:block">
              <p className="text-[10px] tracking-[0.2em] text-[#8C8476] uppercase font-semibold">
                KỸ NGHỆ RẬP THỦ CÔNG
              </p>
              <p className="font-serif-luxury text-sm text-[#161514] italic mt-1">
                Từng nếp gấp vải đều được tính toán theo độ rủ trọng lực tự nhiên.
              </p>
            </div>
          </div>

          {/* Right: The Narrative Story */}
          <div className="lg:col-span-7 flex flex-col justify-center lg:pl-6">
            <p className="text-[10.5px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-3">
              KẾT NỐI DI SẢN VÀ ĐƯƠNG ĐẠI
            </p>

            <h2 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl text-[#161514] font-normal leading-[1.15] tracking-wide">
              Grand Atelier Central, Nơi Mỗi Thiết Kế Mang Một Linh Hồn Riêng Biệt
            </h2>

            <div className="w-12 h-[1px] bg-[#C05A39] my-6" />

            <div className="space-y-4 text-xs sm:text-sm text-[#6B655D] leading-relaxed">
              <p>
                Khởi nguồn từ tình yêu sâu sắc với trường phái kiến trúc Noucentisme tinh tế tại Barcelona và kỹ nghệ thiết kế thời trang chuẩn mực, Grand Atelier Central được xây dựng như một ngôi nhà mở nơi thời trang tìm về bản chất thuần khiết nhất: sự thoải mái, vừa vặn và bền bỉ cùng thời gian.
              </p>
              <p>
                Chúng tôi chắt lọc sợi bông Pima vùng Piura, lanh Normandy và len Merino sinh thái không qua hóa chất làm bóng. Sự kết hợp giữa kỹ nghệ may giấu chỉ blind-stitch và phòng thử đồ tư gia cho phép quý khách quan sát chân thực độ rủ của tà áo trên vóc dáng của mình trước khi quyết định đặt mua.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E5E0D8] flex items-center gap-6">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-[#161514] hover:text-[#C05A39] transition-colors"
              >
                <span>Đọc Tiếp Về Câu Chuyện Của Maison</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Suite D'Essayage (Private Fitting Studio) */}
      <div className="w-full bg-[#FAF8F5] border-b border-[#E5E0D8]">
        <FittingStudio initialGarment={selectedStudioGarment} />
      </div>

      {/* 4. Curated Garment Collection Tray */}
      <GarmentCatalog
        selectedGarmentId={selectedStudioGarment?.id}
        onSelectGarment={handleSelectFromCatalog}
      />

      {/* 5. The Visual Concierge Section */}
      <section id="visual-concierge" className="w-full bg-[#F3EFE6] border-t border-b border-[#E5E0D8] py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-2">
              THE VISUAL CONCIERGE &bull; DỊCH VỤ TÌM KIẾM THỊ GIÁC
            </p>
            
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#161514] font-normal tracking-wide">
              Tìm Kiếm Thiết Kế Theo Cảm Hứng Ánh Nhìn
            </h2>

            <div className="w-12 h-[1px] bg-[#C05A39] mx-auto my-4" />

            <p className="text-xs sm:text-sm text-[#6B655D] leading-relaxed">
              Gửi một bức ảnh thời trang, một khoảnh khắc trên phố hay mô tả phong cách quý khách yêu thích. Concierge của Atelier sẽ tuyển lựa những thiết kế tương đồng nhất từ kho lưu trữ.
            </p>
          </div>

          {/* Embedded Visual Search Panel */}
          <VisualSearchPanel />
        </div>
      </section>

      {/* 6. Atelier Pillars & Heritage Assurances */}
      <StudioBenefits />

    </div>
  );
}