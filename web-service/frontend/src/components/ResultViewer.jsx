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
      {/* Label Header with fixed height 28px */}
      <div className="flex min-h-8 items-center justify-between gap-3 mb-2.5 px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#111215] flex items-center gap-1.5 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
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
              <span className="text-[10px] font-semibold text-[#8d887f] bg-[#f6f5f1] px-2.5 py-0.5 rounded-full border border-[#ded8cc]">
                Gương Số
              </span>
            )
          )}
        </div>
      </div>

      {/* Card Stage with explicit height */}
      <div
        className={`
          relative group rounded-2xl overflow-hidden
          w-full aspect-[3/4] max-h-[380px]
          flex flex-col items-center justify-center
          transition-all duration-500 ease-out bg-white
          ${resultImgUrl
            ? 'border-2 border-[#111215] shadow-md'
            : 'border-2 border-dashed border-[#ded8cc]'
          }
        `}
      >
        {loading ? (
          /* High-end loading experience */
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            {/* Multi-ring Spinner */}
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#ece9e2] border-t-[#111215] animate-spin" />
              <div className="w-9 h-9 rounded-full border border-dashed border-[#a88325] animate-spin-slow" />
              <Scissors className="w-4 h-4 text-[#111215]" />
            </div>

            <div>
              <p className="text-xs font-bold text-[#111215] tracking-widest uppercase">
                Đang Mô Phỏng Dáng Vải
              </p>
              <p className="text-[11px] text-[#6e7382] mt-1">
                {elapsedTime < 10 
                  ? 'Đang phân tích tỷ lệ vóc dáng...' 
                  : elapsedTime < 25 
                    ? 'Đang tính toán độ rủ & nếp nhăn...' 
                    : 'Đang kết xuất ánh sáng studio...'}
              </p>
              <p className="text-[10px] font-mono text-[#a88325] mt-2 font-bold">
                {elapsedTime} giây
              </p>
            </div>
          </div>
        ) : resultImgUrl ? (
          /* Result Loaded */
          <>
            <img
              src={displayImg}
              alt="Kết quả thử đồ"
              className="w-full h-full object-contain bg-[#f7f6f2]"
            />

            {/* Before/After Indicator */}
            {showOriginal && (
              <div className="absolute top-3 left-3 bg-[#111215]/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                Ảnh Gốc Ban Đầu
              </div>
            )}

            {/* Top Right Actions */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              {originalModelUrl && (
                <button
                  type="button"
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="px-2.5 py-1 rounded-lg bg-black/50 hover:bg-black/75 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 border border-white/20 transition-all cursor-pointer"
                  title="Chuyển đổi xem ảnh gốc / ảnh đã thử đồ"
                >
                  {showOriginal ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{showOriginal ? 'Xem Thử Đồ' : 'Xem Ảnh Gốc'}</span>
                </button>
              )}
            </div>

            {/* Bottom Floating Bar */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2">
              <span className="text-white text-[10px] font-semibold px-2 py-1 bg-white/15 backdrop-blur-md rounded-md border border-white/20">
                HD &bull; {elapsedTime}s
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
                    className="h-7 px-2.5 rounded-lg bg-[#d4af37] hover:bg-[#c59e35] text-[#111215] text-[11px] font-bold flex items-center gap-1 shadow-md transition-all cursor-pointer hover:scale-105"
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
            <div className="w-13 h-13 rounded-2xl bg-[#f7f6f2] flex items-center justify-center border border-[#ece9e2]">
              <Sparkles className="w-6 h-6 text-[#ded8cc]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#6e7382] tracking-wide uppercase">
                Gương Thử Trực Tuyến
              </p>
              <p className="text-[11px] text-[#8d887f] mt-1 font-medium leading-normal max-w-[180px]">
                Nhấn "Bắt Đầu Ướm Thử" bên dưới để xem hình ảnh trên người mẫu
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
