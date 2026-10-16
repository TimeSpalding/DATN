import React, { useState } from 'react';
import { Download, ShoppingBag, Eye, EyeOff } from 'lucide-react';

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
    a.download = `atelier-fitting-${Date.now()}.png`;
    a.click();
  };

  const displayImg = (showOriginal && originalModelUrl) ? originalModelUrl : resultImgUrl;

  return (
    <div className="w-full max-w-[360px] lg:max-w-none lg:w-full flex flex-col justify-self-center">
      {/* Label Header */}
      <div className="flex min-h-8 items-center justify-between gap-3 mb-2 px-1">
        <span className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-[#161514] flex items-center gap-1.5 min-w-0">
          <span>Gương Ướm Thử</span>
        </span>
        <div className="shrink-0 max-w-[68%]">
          {headerRight || (
            resultImgUrl ? (
              <span className="text-[9.5px] font-semibold tracking-wider text-[#C05A39] border border-[#C05A39]/30 px-2.5 py-0.5 uppercase">
                Hoàn tất
              </span>
            ) : (
              <span className="text-[9.5px] font-medium tracking-wider text-[#8C8476] border border-[#D8D2C5] px-2 py-0.5 uppercase">
                Phòng Đo
              </span>
            )
          )}
        </div>
      </div>

      {/* Card Stage: Sharp luxury framing */}
      <div
        className={`
          relative group overflow-hidden
          w-full aspect-[3/4] max-h-[380px]
          flex flex-col items-center justify-center
          transition-all duration-500 ease-out bg-[#FAF8F5]
          ${resultImgUrl
            ? 'border-2 border-[#161514] shadow-sm'
            : 'border border-dashed border-[#D8D2C5]'
          }
        `}
      >
        {loading ? (
          /* High-end loading experience */
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            {/* Minimalist Line Spinner */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="w-12 h-12 border border-[#E5E0D8] border-t-[#C05A39] animate-spin" />
            </div>

            <div>
              <p className="text-[11px] font-medium text-[#161514] tracking-[0.2em] uppercase">
                Mô Phỏng Độ Rủ Sợi Vải
              </p>
              <p className="text-[11px] text-[#8C8476] mt-1.5 max-w-[220px] leading-relaxed">
                {elapsedTime < 5 
                  ? 'Đang phân tích tỷ lệ giải phẫu học vóc dáng...' 
                  : elapsedTime < 15 
                    ? 'Đang tính toán nếp gấp & độ rủ theo thớ dệt...' 
                    : 'Đang kết xuất phản chiếu ánh sáng tự nhiên...'}
              </p>
              <p className="text-[11px] font-mono text-[#C05A39] mt-2 font-semibold">
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
              className="w-full h-full object-contain bg-[#F3EFE6]"
            />

            {/* Before/After Indicator */}
            {showOriginal && (
              <div className="absolute top-3 left-3 bg-[#161514]/90 text-[#FAF8F5] text-[9.5px] font-medium tracking-widest uppercase px-2.5 py-1 border border-white/10">
                Chân Dung Gốc
              </div>
            )}

            {/* Top Right Actions */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 -translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
              {originalModelUrl && (
                <button
                  type="button"
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="px-2.5 py-1 bg-[#161514]/90 hover:bg-[#161514] text-[#FAF8F5] text-[9.5px] font-medium tracking-widest uppercase flex items-center gap-1 border border-white/15 transition-all cursor-pointer"
                  title="Chuyển đổi xem ảnh gốc / ảnh đã thử đồ"
                >
                  {showOriginal ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{showOriginal ? 'Xem Thử Đồ' : 'Ảnh Gốc'}</span>
                </button>
              )}
            </div>

            {/* Bottom Floating Bar */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#161514]/85 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
              <span className="text-[#FAF8F5] text-[9.5px] font-medium tracking-wider uppercase px-2 py-1 bg-[#161514]/70 border border-white/15">
                Bespoke Atelier &bull; {elapsedTime || 12}s
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-7 h-7 bg-[#161514]/80 hover:bg-[#C05A39] text-[#FAF8F5] flex items-center justify-center transition-all cursor-pointer border border-white/15"
                  title="Tải ảnh kết quả về máy"
                >
                  <Download className="w-3 h-3" />
                </button>

                {onAddToCart && (
                  <button
                    type="button"
                    onClick={onAddToCart}
                    className="h-7 px-3 bg-[#C05A39] hover:bg-[#A64B2E] text-white text-[10px] font-medium tracking-wider uppercase flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                    title="Thêm trang phục đang thử vào túi đồ"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Thêm Vào Túi</span>
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="w-12 h-12 bg-[#EAE5D9] flex items-center justify-center border border-[#D8D2C5]">
              <span className="font-serif-luxury text-xl text-[#8C8476]">03</span>
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#161514] tracking-[0.18em] uppercase">
                Gương Soi Hoàn Thiện
              </p>
              <p className="text-[11px] text-[#8C8476] mt-1 font-normal leading-normal max-w-[200px]">
                Chọn Người Mặc &amp; Trang Phục rồi nhấn "Ướm Thử Trang Phục"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
