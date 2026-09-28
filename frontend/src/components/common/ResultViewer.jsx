import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Download, ShoppingBag, Eye, EyeOff, Scissors } from 'lucide-react';

export default function ResultViewer({ 
  loading, 
  resultImgUrl, 
  originalModelUrl, 
  elapsedTime,
  onAddToCart,
  selectedGarment,
  headerRight = null
}) {
  const [showOriginal, setShowOriginal] = useState(false);

  const handleDownload = () => {
    if (!resultImgUrl) return;
    const a = document.createElement('a');
    a.href = resultImgUrl;
    a.download = `latelier-tryon-${Date.now()}.png`;
    a.click();
  };

  const displayImg = (showOriginal && originalModelUrl) ? originalModelUrl : resultImgUrl;

  return (
    <div className="w-full max-w-[360px] lg:max-w-none lg:w-full flex flex-col justify-self-center">
      {/* Label Header */}
      <div className="flex min-h-8 items-center justify-between gap-3 mb-2.5 px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-blue-700" />
          <span>Gương Thử Đồ</span>
        </span>
        <div className="shrink-0 max-w-[68%]">
          {headerRight || (
            resultImgUrl ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Đã xong</span>
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                Gương Kỹ Thuật Số
              </span>
            )
          )}
        </div>
      </div>

      {/* Card Stage */}
      <div
        className={`
          relative group rounded-2xl overflow-hidden
          w-full aspect-[3/4] max-h-[380px]
          flex flex-col items-center justify-center
          transition-all duration-500 ease-out bg-white
          ${resultImgUrl
            ? 'border-2 border-slate-900 shadow-md'
            : 'border-2 border-dashed border-slate-300'
          }
        `}
      >
        {loading ? (
          /* High-end loading experience */
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            {/* Multi-ring Spinner */}
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-slate-200 border-t-blue-700 animate-spin" />
              <div className="w-9 h-9 rounded-full border border-dashed border-blue-400 animate-spin-slow" />
              <Scissors className="w-4 h-4 text-slate-800" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-900 tracking-widest uppercase">
                Đang Mô Phỏng Dáng Vải
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {elapsedTime < 5 
                  ? 'Đang phân tích tỷ lệ vóc dáng người mẫu...' 
                  : elapsedTime < 15 
                    ? 'Đang căn chỉnh nếp gấp & độ rủ tự nhiên...' 
                    : 'Đang kết xuất ánh sáng phản chiếu studio...'}
              </p>
              <p className="text-[11px] font-mono text-blue-700 mt-2 font-bold">
                {elapsedTime}s
              </p>
            </div>
          </div>
        ) : resultImgUrl ? (
          /* Result Loaded */
          <>
            <img
              src={displayImg}
              alt="Kết quả thử đồ"
              className="w-full h-full object-contain bg-slate-50"
            />

            {/* Before/After Indicator */}
            {showOriginal && (
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                Ảnh Gốc Ban Đầu
              </div>
            )}

            {/* Top Right Actions */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 -translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0">
              {originalModelUrl && (
                <button
                  type="button"
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 border border-white/20 transition-all cursor-pointer"
                  title="Chuyển đổi xem ảnh gốc / ảnh đã thử đồ"
                >
                  {showOriginal ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{showOriginal ? 'Xem Thử Đồ' : 'Xem Ảnh Gốc'}</span>
                </button>
              )}
            </div>

            {/* Bottom Floating Bar */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100" />
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0">
              <span className="text-white text-[10px] font-semibold px-2 py-1 bg-white/20 backdrop-blur-md rounded-md border border-white/20">
                Studio 4K &bull; {elapsedTime || 12}s
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/35 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 hover:scale-105"
                  title="Tải ảnh kết quả về máy"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {onAddToCart && (
                  <button
                    type="button"
                    onClick={onAddToCart}
                    className="h-7 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-md transition-all cursor-pointer hover:scale-105"
                    title="Thêm trang phục đang thử vào giỏ hàng"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Thêm Giỏ</span>
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="w-13 h-13 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
              <Sparkles className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                Gương Thử Trực Tuyến
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium leading-normal max-w-[200px]">
                Chọn Người Mẫu &amp; Trang Phục rồi nhấn nút "Ướm Thử" để trải nghiệm
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
