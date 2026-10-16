import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#161514] text-[#D8D2C5] text-xs border-t border-[#2B2825] w-full mt-auto">
      {/* 1. Heritage Assurances Band */}
      <div className="border-b border-[#2B2825] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="border-l border-[#2E2B27] pl-5">
            <p className="text-[10px] font-medium tracking-[0.25em] text-[#C05A39] uppercase mb-1">
              HAUTE ATELIER
            </p>
            <p className="font-serif-luxury text-base text-[#FAF8F5] tracking-wide">
              Nghệ thuật may đo chuẩn mực
            </p>
            <p className="text-[11px] text-[#8C8476] mt-1 leading-relaxed">
              Từng đường may, ve áo và khuy xà cừ đều được chế tác theo tiêu chuẩn thời trang cao cấp.
            </p>
          </div>

          <div className="border-l border-[#2E2B27] pl-5">
            <p className="text-[10px] font-medium tracking-[0.25em] text-[#C05A39] uppercase mb-1">
              SUITE D'ESSAYAGE
            </p>
            <p className="font-serif-luxury text-base text-[#FAF8F5] tracking-wide">
              Ướm thử tư gia trực tuyến
            </p>
            <p className="text-[11px] text-[#8C8476] mt-1 leading-relaxed">
              Trải nghiệm ướm thử độ rủ sợi dệt và phom dáng chuẩn xác trên người mặc trước khi quyết định.
            </p>
          </div>

          <div className="border-l border-[#2E2B27] pl-5">
            <p className="text-[10px] font-medium tracking-[0.25em] text-[#C05A39] uppercase mb-1">
              BESPOKE CONCIERGE
            </p>
            <p className="font-serif-luxury text-base text-[#FAF8F5] tracking-wide">
              Giao hàng &amp; Chỉnh sửa tận nơi
            </p>
            <p className="text-[11px] text-[#8C8476] mt-1 leading-relaxed">
              Miễn phí vận chuyển và hỗ trợ căn chỉnh kích cỡ theo số đo riêng của quý khách.
            </p>
          </div>

          <div className="border-l border-[#2E2B27] pl-5">
            <p className="text-[10px] font-medium tracking-[0.25em] text-[#C05A39] uppercase mb-1">
              CIRCULAR LUXURY
            </p>
            <p className="font-serif-luxury text-base text-[#FAF8F5] tracking-wide">
              Vật liệu bền vững tự nhiên
            </p>
            <p className="text-[11px] text-[#8C8476] mt-1 leading-relaxed">
              100% sợi cotton Pima, linen Pháp và len Merino đạt chứng nhận sinh thái OEKO-TEX Standard 100.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Editorial Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
        
        {/* Brand Narrative & Newsletter (Col 1-5) */}
        <div className="lg:col-span-5 pr-0 lg:pr-8">
          <Link to="/" className="inline-flex flex-col mb-4">
            <span className="font-brand text-2xl font-medium tracking-[0.24em] text-[#FAF8F5] uppercase">
              GRAND ATELIER
            </span>
            <span className="text-[9px] tracking-[0.32em] text-[#8C8476] uppercase font-medium -mt-0.5">
              CENTRAL &bull; MAISON DE COUTURE
            </span>
          </Link>
          
          <p className="text-[#8C8476] leading-relaxed text-xs max-w-md mb-8">
            Lấy cảm hứng từ sự thanh lịch vượt thời gian của kiến trúc Noucentisme tại Barcelona, Grand Atelier Central kết nối di sản may đo thủ công cùng trải nghiệm ướm thử tư gia tinh tế.
          </p>

          {/* Newsletter Box */}
          <div className="max-w-md">
            <p className="text-[11px] font-medium tracking-[0.2em] text-[#FAF8F5] uppercase mb-2">
              THƯ PHẨM PHONG CÁCH TỪ MAISON
            </p>
            <p className="text-[11px] text-[#8C8476] mb-3">
              Đăng ký để nhận thông tin về các bộ sưu tập phiên bản giới hạn và lời mời tham dự tuần lễ may đo.
            </p>

            {subscribed ? (
              <p className="text-xs text-[#C05A39] font-medium">
                Cảm ơn quý khách đã đăng ký nhận thông tin từ Grand Atelier Central.
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex border-b border-[#3D3A35] focus-within:border-[#FAF8F5] transition-colors pb-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Địa chỉ thư điện tử của quý khách..."
                  required
                  className="bg-transparent border-none text-xs text-[#FAF8F5] placeholder-[#6B655D] focus:outline-none flex-1 py-1"
                />
                <button
                  type="submit"
                  className="text-[#FAF8F5] hover:text-[#C05A39] transition-colors text-[11px] font-medium tracking-widest uppercase flex items-center gap-1 cursor-pointer"
                >
                  <span>Gửi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Collections Links (Col 6-7) */}
        <div className="lg:col-span-2">
          <h4 className="font-medium text-[#FAF8F5] uppercase tracking-[0.2em] text-[11px] mb-4">
            BỘ SƯU TẬP
          </h4>
          <ul className="space-y-2.5 text-xs text-[#8C8476]">
            <li>
              <Link to="/catalog?category=upper" className="hover:text-[#FAF8F5] transition-colors">
                Áo &amp; Tops May Đo
              </Link>
            </li>
            <li>
              <Link to="/catalog?category=dress" className="hover:text-[#FAF8F5] transition-colors">
                Đầm &amp; Váy Thiết Kế
              </Link>
            </li>
            <li>
              <Link to="/catalog?category=outerwear" className="hover:text-[#FAF8F5] transition-colors">
                Áo Khoác &amp; Outerwear
              </Link>
            </li>
            <li>
              <Link to="/catalog?category=lower" className="hover:text-[#FAF8F5] transition-colors">
                Quần Tây Xếp Ly
              </Link>
            </li>
            <li>
              <Link to="/try-on" className="hover:text-[#FAF8F5] transition-colors text-[#C05A39] font-medium">
                Phòng Thử Đồ Tư Gia
              </Link>
            </li>
          </ul>
        </div>

        {/* The House (Col 8-9) */}
        <div className="lg:col-span-2">
          <h4 className="font-medium text-[#FAF8F5] uppercase tracking-[0.2em] text-[11px] mb-4">
            MAISON &amp; DỊCH VỤ
          </h4>
          <ul className="space-y-2.5 text-xs text-[#8C8476]">
            <li>
              <Link to="/about" className="hover:text-[#FAF8F5] transition-colors">
                Di Sản &amp; Kiến Trúc
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-[#FAF8F5] transition-colors">
                Nguồn Gốc Sợi Vải
              </Link>
            </li>
            <li>
              <Link to="/search-result" className="hover:text-[#FAF8F5] transition-colors">
                Visual Concierge
              </Link>
            </li>
            <li>
              <a href="#size-guide" className="hover:text-[#FAF8F5] transition-colors">
                Quy Chuẩn May Đo (Size)
              </a>
            </li>
            <li>
              <a href="#care-guide" className="hover:text-[#FAF8F5] transition-colors">
                Nghi Thức Bảo Quản
              </a>
            </li>
          </ul>
        </div>

        {/* Concierge & Locations (Col 10-12) */}
        <div className="lg:col-span-3">
          <h4 className="font-medium text-[#FAF8F5] uppercase tracking-[0.2em] text-[11px] mb-4">
            LIÊN HỆ CONCIERGE
          </h4>
          <ul className="space-y-3 text-xs text-[#8C8476]">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-3.5 h-3.5 text-[#C05A39] shrink-0 mt-0.5" />
              <span>Showroom: 10 Nguyễn Trãi, Q. Hà Đông, Hà Nội</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-3.5 h-3.5 text-[#C05A39]" />
              <span>Hotline May Đo: +84 (0) 24 3868 6868</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-3.5 h-3.5 text-[#C05A39]" />
              <span>concierge@grandatelier.vn</span>
            </li>
            <li className="pt-2 text-[11px] text-[#6B655D] leading-relaxed">
              Thời gian tiếp đón khách: 09:00 - 21:00 hàng ngày. Đặt lịch hẹn may đo tư gia trước 24 giờ.
            </li>
          </ul>
        </div>
      </div>

      {/* 3. Bottom Legal & Copyright Bar */}
      <div className="border-t border-[#23211F] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10.5px] text-[#6B655D]">
          <p>
            &copy; 2026 Grand Atelier Central. Mọi quyền được bảo lưu. Dự án nghiên cứu &amp; triển khai thời trang đương đại tích hợp thị giác máy tính.
          </p>
          <div className="flex items-center gap-6">
            <span className="hover:text-[#FAF8F5] transition-colors cursor-pointer">Chính Sách Bảo Mật</span>
            <span className="hover:text-[#FAF8F5] transition-colors cursor-pointer">Điều Khoản Dịch Vụ</span>
            <span className="hover:text-[#FAF8F5] transition-colors cursor-pointer">Tiêu Chuẩn Sợi Dệt</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer };