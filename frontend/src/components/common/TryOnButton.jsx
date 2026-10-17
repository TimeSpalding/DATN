import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function TryOnButton({ loading, disabled, elapsedTime }) {
  return (
    <div className="flex flex-col items-center">
      <button
        type="submit"
        disabled={disabled}
        className={`
          group relative inline-flex items-center justify-center gap-3 px-10 py-4
          text-xs font-semibold tracking-[0.2em] uppercase
          transition-all duration-300 ease-out cursor-pointer
          ${disabled
            ? 'bg-[#E5E0D8] text-[#8C8476] cursor-not-allowed'
            : 'bg-[#C05A39] text-[#FAF8F5] hover:bg-[#A64B2E] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 text-[#FAF8F5] animate-spin" />
            <span>Đang Mô Phỏng Ướm Thử... ({elapsedTime}s)</span>
          </>
        ) : (
          <>
            <span>Ướm Thử Trang Phục Ngay</span>
            <ArrowRight className="w-4 h-4 text-[#FAF8F5] transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>

      {disabled && !loading && (
        <span className="text-[11px] text-[#8C8476] font-normal mt-2.5 tracking-wide">
          Vui lòng chọn hoặc tải đủ ảnh Người Mặc &amp; Trang Phục để bắt đầu ướm thử
        </span>
      )}
    </div>
  );
}
