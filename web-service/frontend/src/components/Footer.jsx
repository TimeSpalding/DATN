import React from 'react';
import { MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#111215] text-[#fbfaf8] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <span className="font-serif text-2xl font-bold tracking-[0.2em] uppercase text-white block">
              L'ATELIER
            </span>
            <span className="text-[10px] tracking-[0.3em] text-[#a88325] uppercase font-semibold block mt-1">
              Haute Couture &bull; Digital Fitting Studio
            </span>
            <p className="text-xs text-[#a49c8c] mt-4 leading-relaxed max-w-sm">
              Thương hiệu thời trang ứng dụng công nghệ mô phỏng thông minh. Mang trải nghiệm may đo cao cấp đến từng khách hàng trực tuyến.
            </p>

            {/* Newsletter input */}
            <div className="mt-6">
              <span className="text-xs font-semibold text-white block mb-2">
                Đăng ký nhận ưu đãi 15% cho đơn hàng đầu tiên
              </span>
              <div className="flex max-w-sm">
                <input
                  type="email"
                  placeholder="Nhập địa chỉ email của bạn..."
                  className="min-w-0 bg-white/10 border border-white/15 px-3.5 py-2 rounded-l-lg text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#a88325] flex-1"
                />
                <button
                  type="button"
                  className="bg-[#d4af37] text-[#111215] px-4 py-2 rounded-r-lg text-xs font-bold uppercase tracking-wider hover:bg-[#c59e35] transition-colors"
                >
                  Gửi
                </button>
              </div>
            </div>
          </div>

          {/* Nav Column 1 */}
          <div>
            <h5 className="text-xs font-bold tracking-[0.15em] uppercase text-white mb-4">
              Khám Phá
            </h5>
            <ul className="space-y-2.5 text-xs text-[#a49c8c]">
              <li><a href="#catalog" className="hover:text-white transition-colors">Bộ Sưu Tập Mới</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Áo Polo &amp; Sơ Mi</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Váy Maxi &amp; Đầm</a></li>
              <li><a href="#studio" className="hover:text-white transition-colors">Phòng Thử Đồ Ảo</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Lookbook Mùa Thu</a></li>
            </ul>
          </div>

          {/* Nav Column 2 */}
          <div>
            <h5 className="text-xs font-bold tracking-[0.15em] uppercase text-white mb-4">
              Hỗ Trợ Khách Hàng
            </h5>
            <ul className="space-y-2.5 text-xs text-[#a49c8c]">
              <li><a href="#benefits" className="hover:text-white transition-colors">Hướng Dẫn Chọn Size</a></li>
              <li><a href="#benefits" className="hover:text-white transition-colors">Chính Sách Đổi Trả</a></li>
              <li><a href="#benefits" className="hover:text-white transition-colors">Chính Sách Vận Chuyển</a></li>
              <li><a href="#benefits" className="hover:text-white transition-colors">Bảo Mật Dữ Liệu AI</a></li>
              <li><a href="#benefits" className="hover:text-white transition-colors">Câu Hỏi Thường Gặp</a></li>
            </ul>
          </div>

          {/* Nav Column 3 */}
          <div>
            <h5 className="text-xs font-bold tracking-[0.15em] uppercase text-white mb-4">
              Studio &amp; Showroom
            </h5>
            <ul className="space-y-3 text-xs text-[#a49c8c]">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#a88325] shrink-0 mt-0.5" />
                <span>Flagship: 88 Đồng Khởi, Q.1, TP. Hồ Chí Minh</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#a88325] shrink-0 mt-0.5" />
                <span>Atelier: 12 Tràng Tiền, Hoàn Kiếm, Hà Nội</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#a88325] shrink-0" />
                <span>Hotline: 1900 8989 (8h00 - 22h00)</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#6e7382] gap-5">
          <p className="text-center sm:text-left leading-relaxed">
            &copy; {new Date().getFullYear()} L'ATELIER STUDIO. Bảo lưu mọi quyền. Đồ án tốt nghiệp hệ thống thời trang thông minh.
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-5 gap-y-2 text-center">
            <a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a>
            <a href="#" className="hover:text-white transition-colors">Chính sách quyền riêng tư</a>
            <a href="#" className="hover:text-white transition-colors">Tiêu chuẩn AI Đạo đức</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
