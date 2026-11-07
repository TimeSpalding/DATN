import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#161514] flex flex-col font-sans selection:bg-[#C05A39] selection:text-[#FAF8F5]">
      <header className="w-full border-b border-[#E5E0D8] bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex flex-col">
            <span className="font-brand text-lg sm:text-xl font-medium tracking-[0.24em] text-[#161514] uppercase">
              GRAND ATELIER
            </span>
            <span className="text-[8.5px] tracking-[0.3em] text-[#8C8476] uppercase font-medium -mt-0.5">
              CENTRAL &bull; MAISON DE COUTURE
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.18em] uppercase text-[#6B655D] hover:text-[#161514] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại cửa hàng</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-10 flex items-center justify-center">
        {children}
      </main>

      <footer className="w-full border-t border-[#E5E0D8] py-4 text-center text-[10.5px] text-[#8C8476]">
        &copy; 2026 Grand Atelier Central. Bảo mật thông tin thành viên.
      </footer>
    </div>
  );
}
