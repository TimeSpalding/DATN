import { useState } from 'react';
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
              THIẾT KẾ CHUẨN MỰC
            </p>
            <p className="font-serif-luxury text-base text-[#FAF8F5] tracking-wide">
              Kỹ nghệ may đo tinh xảo
            </p>
            <p className="text-[11px] text-[#8C8476] mt-1 leading-relaxed">
              Từng đường may, ve áo và khuy xà cừ đều được hoàn thiện tỉ mỉ theo tiêu chuẩn cao cấp.
            </p>
          </div>

          <div className="border-l border-[#2E2B27] pl-5">
            <p className="text-[10px] font-medium tracking-[0.25em] text-[#C05A39] uppercase mb-1">
              THỬ ĐỒ TRỰC TUYẾN
            </p>
            <p className="font-serif-luxury text-base text-[#FAF8F5] tracking-wide">
              Phòng thử đồ trực tuyến
            </p>
            <p className="text-[11px] text-[#8C8476] mt-1 leading-relaxed">
              Quan sát trực quan độ rủ chất liệu và phom dáng trang phục trên vóc dáng trước khi đặt mua.
            </p>
          </div>

          <div className="border-l border-[#2E2B27] pl-5">
            <p className="text-[10px] font-medium tracking-[0.25em] text-[#C05A39] uppercase mb-1">
              DỊCH VỤ KHÁCH HÀNG
            </p>
            <p className="font-serif-luxury text-base text-[#FAF8F5] tracking-wide">
              Giao hàng &amp; Đổi size tận nơi
            </p>
            <p className="text-[11px] text-[#8C8476] mt-1 leading-relaxed">
              Miễn phí vận chuyển cho đơn từ 500.000₫ và hỗ trợ đổi kích cỡ miễn phí trong 30 ngày.
            </p>
          </div>

          <div className="border-l border-[#2E2B27] pl-5">
            <p className="text-[10px] font-medium tracking-[0.25em] text-[#C05A39] uppercase mb-1">
              CHẤT LIỆU TỰ NHIÊN
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
            Lấy cảm hứng từ sự thanh lịch vượt thời gian của kiến trúc Noucentisme tại Barcelona, Grand Atelier Central kết hợp kỹ nghệ thiết kế trang phục chuẩn mực cùng trải nghiệm thử đồ trực tuyến tiện lợi.
          </p>

          {/* Newsletter Box */}
          <div className="max-w-md">
            <p className="text-[11px] font-medium tracking-[0.2em] text-[#FAF8F5] uppercase mb-2">
              BẢN TIN THỜI TRANG
            </p>
            <p className="text-[11px] text-[#8C8476] mb-3">
              Đăng ký nhận thông tin về bộ sưu tập mới và các chương trình ưu đãi dành riêng cho thành viên.
            </p>

            {subscribed ? (
              <p className="text-xs text-[#C05A39] font-medium">
                Cảm ơn quý khách đã đăng ký nhận bản tin từ Grand Atelier Central.
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex border-b border-[#3D3A35] focus-within:border-[#FAF8F5] transition-colors pb-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập địa chỉ email của quý khách..."
                  autoComplete="email"
                  spellCheck={false}
                  required
                  className="bg-transparent border-none text-xs text-[#FAF8F5] placeholder-[#6B655D] focus:outline-none flex-1 py-1"
                />
                <button
                  type="submit"
                  className="text-[#FAF8F5] hover:text-[#C05A39] transition-colors text-[11px] font-medium tracking-widest uppercase flex items-center gap-1 cursor-pointer"
                >
                  <span>Đăng ký</span>
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
                Áo &amp; Tops Thiết Kế
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
                Phòng Thử Đồ Trực Tuyến
              </Link>
            </li>
          </ul>
        </div>

        {/* The House (Col 8-9) */}
        <div className="lg:col-span-2">
          <h4 className="font-medium text-[#FAF8F5] uppercase tracking-[0.2em] text-[11px] mb-4">
            THƯƠNG HIỆU &amp; DỊCH VỤ
          </h4>
          <ul className="space-y-2.5 text-xs text-[#8C8476]">
            <li>
              <Link to="/about" className="hover:text-[#FAF8F5] transition-colors">
                Câu Chuyện Thương Hiệu
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-[#FAF8F5] transition-colors">
                Nguồn Gốc Chất Liệu
              </Link>
            </li>
            <li>
              <Link to="/search-result" className="hover:text-[#FAF8F5] transition-colors">
                Tìm Kiếm Trang Phục
              </Link>
            </li>
            <li>
              <Link to="/catalog" className="hover:text-[#FAF8F5] transition-colors">
                Bảng Kích Cỡ Chuẩn
              </Link>
            </li>
            <li>
              <Link to="/orders" className="hover:text-[#FAF8F5] transition-colors">
                Tra Cứu Đơn Hàng
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact & Locations (Col 10-12) */}
        <div className="lg:col-span-3">
          <h4 className="font-medium text-[#FAF8F5] uppercase tracking-[0.2em] text-[11px] mb-4">
            LIÊN HỆ &amp; CỬA HÀNG
          </h4>
          <ul className="space-y-3 text-xs text-[#8C8476]">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-3.5 h-3.5 text-[#C05A39] shrink-0 mt-0.5" />
              <span>Showroom: 10 Nguyễn Trãi, Q. Hà Đông, Hà Nội</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-3.5 h-3.5 text-[#C05A39]" />
              <span>Hotline CSKH: +84 (0) 24 3868 6868</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-3.5 h-3.5 text-[#C05A39]" />
              <span>cskh@grandatelier.vn</span>
            </li>
            <li className="pt-2 text-[11px] text-[#6B655D] leading-relaxed">
              Giờ mở cửa: 09:00 - 21:00 hàng ngày. Hỗ trợ giao nhanh nội thành trong 24 giờ.
            </li>
          </ul>
        </div>
      </div>

      {/* 3. Bottom Legal & Copyright Bar */}
      <div className="border-t border-[#23211F] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10.5px] text-[#6B655D]">
          <p>
            &copy; 2026 Grand Atelier Central. Thương hiệu thời trang thiết kế đương đại. Mọi quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-6">
            <span className="hover:text-[#FAF8F5] transition-colors cursor-pointer">Chính Sách Bảo Mật</span>
            <span className="hover:text-[#FAF8F5] transition-colors cursor-pointer">Điều Khoản Dịch Vụ</span>
            <span className="hover:text-[#FAF8F5] transition-colors cursor-pointer">Chính Sách Đổi Trả</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
