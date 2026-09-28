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
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            : 'bg-slate-950 text-white hover:bg-blue-900 hover:shadow-xl hover:shadow-blue-950/20 hover:-translate-y-0.5 active:translate-y-0'
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <span>Đang May Đo Kỹ Thuật Số... ({elapsedTime}s)</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-12" />
            <span>Bắt Đầu Ướm Thử Trang Phục</span>
            <ArrowRight className="w-4 h-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-white" />
          </>
        )}
      </button>

      {disabled && !loading && (
        <span className="text-[11px] text-slate-500 font-medium mt-2.5">
          Vui lòng chọn hoặc tải đủ ảnh Người Mẫu &amp; Trang Phục để bắt đầu
        </span>
      )}
    </div>
  );
}
