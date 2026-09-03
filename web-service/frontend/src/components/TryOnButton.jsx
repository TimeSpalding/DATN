import React from 'react';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';

export default function TryOnButton({ loading, disabled, elapsedTime }) {
  return (
    <div className="flex flex-col items-center">
      <button
        type="submit"
        disabled={disabled}
        className={`
          group relative inline-flex items-center justify-center gap-3 px-10 py-4
          text-xs md:text-sm font-bold tracking-[0.15em] uppercase rounded-full
          transition-all duration-300 ease-out cursor-pointer shadow-md
          ${disabled
            ? 'bg-[#ded8cc] text-[#8d887f] cursor-not-allowed shadow-none'
            : 'bg-[#111215] text-[#fbfaf8] hover:bg-[#2b2e38] hover:shadow-xl hover:shadow-[#111215]/20 hover:-translate-y-0.5 active:translate-y-0'
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 text-[#d4af37] animate-spin" />
            <span>Đang May Đo Kỹ Thuật Số... ({elapsedTime}s)</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-[#d4af37] transition-transform group-hover:rotate-12" />
            <span>Bắt Đầu Ướm Thử Trang Phục</span>
            <ArrowRight className="w-4 h-4 text-[#8d887f] transition-transform group-hover:translate-x-1 group-hover:text-white" />
          </>
        )}
      </button>

      {disabled && !loading && (
        <span className="text-[11px] text-[#8d887f] font-medium mt-2.5">
          Vui lòng chọn hoặc tải đủ ảnh Người Mẫu &amp; Trang Phục để bắt đầu
        </span>
      )}
    </div>
  );
}
