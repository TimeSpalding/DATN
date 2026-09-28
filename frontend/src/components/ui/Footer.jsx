import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Truck, RotateCcw, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-900 w-full mt-auto">
      {/* Top Value Promise Band */}
      <div className="border-b border-slate-900/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-blue-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-200">Giao hàng miễn phí</p>
              <p className="text-[11px] text-slate-500">Cho đơn hàng từ 500.000₫</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-blue-400 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-200">Đổi trả 30 ngày</p>
              <p className="text-[11px] text-slate-500">Đổi size tận nơi miễn phí</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-blue-400 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="font-bold text-slate-200">Phòng thử đồ AI</p>
              <p className="text-[11px] text-slate-500">Chuẩn xác tỷ lệ vóc dáng</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-200">Thanh toán an toàn</p>
              <p className="text-[11px] text-slate-500">Bảo mật giao dịch 100%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Brand Bio */}
        <div className="lg:col-span-2">
          <Link to="/" className="inline-flex flex-col mb-4">
            <span className="font-serif text-2xl font-bold tracking-[0.2em] text-white uppercase">
              L'ATELIER
            </span>
            <span className="text-[9px] tracking-[0.3em] text-slate-500 uppercase font-semibold">
              Studio &bull; Fitting Lab
            </span>
          </Link>
          <p className="text-slate-400 leading-relaxed text-xs max-w-sm mb-4">
            Nền tảng thương mại điện tử thời trang tích hợp công nghệ thị giác máy tính, tìm kiếm đa phương thức và thử đồ ảo AI độc quyền.
          </p>
          <div className="flex items-center gap-3 text-slate-300">
            <span className="text-[11px] font-semibold">Hệ thống showroom: Hà Nội &bull; TP. Hồ Chí Minh</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs mb-3">
            Bộ Sưu Tập
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/catalog?category=upper" className="hover:text-white transition-colors">
                Áo Polo &amp; Sơ Mi
              </Link>
            </li>
            <li>
              <Link to="/catalog?category=lower" className="hover:text-white transition-colors">
                Quần Tây &amp; Denim
              </Link>
            </li>
            <li>
              <Link to="/catalog?category=overall" className="hover:text-white transition-colors">
                Váy Đầm Liền Thân
              </Link>
            </li>
            <li>
              <Link to="/try-on" className="hover:text-white transition-colors text-amber-400 font-semibold">
                Phòng Thử Đồ Ảo AI
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs mb-3">
            Hỗ Trợ Khách Hàng
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Hướng Dẫn Chọn Size
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Chính Sách Đổi Trả
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Chính Sách Vận Chuyển
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Bảo Mật Thông Tin
              </a>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs mb-3">
            Liên Hệ Trực Tiếp
          </h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>1800 6868 (Miễn phí)</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>support@latelier.vn</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>Km 10, Đường Nguyễn Trãi, Q. Hà Đông, Hà Nội</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 L'ATELIER Fashion Studio. Dự án nghiên cứu &amp; triển khai đồ án tốt nghiệp công nghệ AI.</p>
          <div className="flex items-center gap-4">
            <span>Thanh toán bảo mật: COD &bull; VNPAY &bull; Napas &bull; VietQR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer };