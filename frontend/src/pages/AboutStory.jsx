import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Compass, Scissors, Award } from 'lucide-react';
import StudioBenefits from '../components/common/StudioBenefits';

export default function AboutStory() {
  return (
    <div className="w-full flex flex-col items-center bg-[#FAF8F5]">
      
      {/* 1. Atmospheric Hero Banner */}
      <section className="relative w-full min-h-[60vh] flex flex-col justify-center items-center bg-[#161514] text-[#FAF8F5] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2000&q=85"
            alt="Maison Central Architecture & Interior"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#161514] via-[#161514]/50 to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] uppercase text-[#C05A39] mb-4">
            DI SẢN &amp; TRIẾT LÝ THIẾT KẾ
          </p>
          <h1 className="font-serif-luxury text-4xl sm:text-6xl text-[#FAF8F5] font-normal tracking-wide leading-tight">
            Grand Atelier Central: Nơi Vẻ Đẹp Vượt Thời Gian Bắt Đầu
          </h1>
          <div className="w-16 h-[1px] bg-[#C05A39] mx-auto my-6" />
          <p className="font-serif-luxury text-lg sm:text-xl text-[#D8D2C5] italic max-w-2xl mx-auto leading-relaxed">
            "Chúng tôi không chạy theo những xu hướng thoáng qua. Chúng tôi tìm kiếm sự cân bằng hoàn hảo giữa xúc cảm của sợi dệt và đường cắt tôn vinh phẩm giá người mặc."
          </p>
        </div>
      </section>

      {/* 2. Chapter 1: The Architectural Roots */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-[#E5E0D8]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-5">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase">
              CHƯƠNG I &bull; CẢM HỨNG NOUCENTISME
            </p>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#161514] font-normal leading-snug">
              Tinh Thần Cổ Điển Tinh Tế Từ Barcelona
            </h2>
            <div className="w-12 h-[1px] bg-[#161514] my-3" />
            <p className="text-xs sm:text-sm text-[#6B655D] leading-relaxed">
              Lấy cảm hứng từ tòa nhà thập niên 1920 của kiến trúc sư Adolf Florensa tại trung tâm Barcelona, Grand Atelier Central được xây dựng trên triết lý Noucentisme: sự hòa quyện giữa tỷ lệ hình học cổ điển, cấu trúc đối xứng trang nhã và vật liệu đá vôi ấm áp.
            </p>
            <p className="text-xs sm:text-sm text-[#6B655D] leading-relaxed">
              Trong từng nếp áo, ve áo và đường ráp tay, chúng tôi tái hiện sự chuẩn mực đó. Một chiếc áo sơ mi hay một bộ vest không đơn thuần là lớp vải che thân; đó là sự biểu đạt của trật tự, sự tĩnh lặng và phong thái đĩnh đạc tự nhiên của người sở hữu.
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="aspect-[4/3] bg-[#F3EFE6] border border-[#E5E0D8] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1200&q=85"
                alt="Barcelona architecture and elegance"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>
      </section>

      {/* 3. Chapter 2: The Art of Sourcing Natural Fibers */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-[#E5E0D8]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="aspect-[4/3] bg-[#F3EFE6] border border-[#E5E0D8] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=85"
                alt="Natural fiber selection in atelier"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase">
              CHƯƠNG II &bull; SỢI DỆT TỰ NHIÊN
            </p>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#161514] font-normal leading-snug">
              Những Thớ Sợi Biết Thở Cùng Năm Tháng
            </h2>
            <div className="w-12 h-[1px] bg-[#161514] my-3" />
            <p className="text-xs sm:text-sm text-[#6B655D] leading-relaxed">
              Maison từ chối mọi loại sợi tổng hợp từ dầu mỏ gây bức bối cho da. Thay vào đó, chúng tôi lặn lội đến các vùng thổ nhưỡng nguyên bản để thu hoạch những thớ sợi thuần khiết nhất:
            </p>
            <ul className="space-y-2 text-xs text-[#2A2724]">
              <li className="flex items-start gap-2">
                <span className="text-[#C05A39] font-bold">&bull;</span>
                <span><strong>Bông Pima Peru:</strong> Sợi siêu dài thu hoạch thủ công ven biển Piura, tạo nên mặt vải mượt óng êm ái.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C05A39] font-bold">&bull;</span>
                <span><strong>Lanh Normandy Pháp:</strong> Sợi dệt tự nhiên rũ mát, giữ phom dáng mộc mạc và càng giặt càng mềm.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C05A39] font-bold">&bull;</span>
                <span><strong>Len Merino Úc 19.5 micron:</strong> Cách nhiệt và thoáng khí bốn mùa, nâng niu làn da nhạy cảm.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* 4. Chapter 3: Why the Virtual Fitting Suite? */}
      <section className="w-full bg-[#161514] text-[#FAF8F5] py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-[#C05A39]">
            CHƯƠNG III &bull; TRIẾT LÝ PHÒNG ƯỚM THỬ TƯ GIA
          </p>
          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal tracking-wide text-[#FAF8F5]">
            Công Nghệ Phục Vụ Sự Tinh Tế, Không Phải Sự Phô Trương
          </h2>
          <div className="w-16 h-[1px] bg-[#C05A39] mx-auto my-4" />
          <p className="text-xs sm:text-sm text-[#D8D2C5] leading-relaxed max-w-2xl mx-auto">
            Tại Grand Atelier Central, phòng thử đồ trực tuyến không phải một món đồ chơi hào nhoáng. Đó là một cam kết về thời trang bền vững (conscious fashion).
          </p>
          <p className="text-xs sm:text-sm text-[#8C8476] leading-relaxed max-w-2xl mx-auto">
            Bằng việc tái hiện trung thực độ rủ sợi dệt và tỷ lệ vóc dáng của người mặc trước khi hoàn tất đặt mua, chúng tôi giảm thiểu đến 90% tỉ lệ hoàn trả hàng và lãng phí bao bì, đồng thời bảo vệ trọn vẹn thời gian quý báu của mỗi vị khách.
          </p>
          <div className="pt-4">
            <Link
              to="/try-on"
              className="btn-terracotta"
            >
              <span>Trải Nghiệm Phòng Thử Đồ Tư Gia</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Pillars & Assurances */}
      <StudioBenefits />

    </div>
  );
}
