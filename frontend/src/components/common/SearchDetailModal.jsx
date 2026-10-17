import { useState, useEffect } from "react";
import { 
  FaBookmark, FaFileImage, FaHashtag, FaImage, FaInfoCircle, 
  FaRulerCombined, FaSearch, FaStar, FaTimes, FaChevronDown, FaChevronUp 
} from "react-icons/fa";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatScore } from "../../utils/formatScore";
import { resolveImageUrl } from "../../utils/imageUrl";
import { saveBookmark } from "../../services/bookmarkService";
import { ImageWithFallback } from "./ImageWithFallback";
import { Link } from "react-router-dom";

const DetailRow = ({ icon: Icon, label, value, highlight = false }) => (
  <div className="flex items-center justify-between gap-4 border-b border-[#E5E0D8] pb-2.5">
    <div className="flex items-center gap-2 text-xs font-medium text-[#6B655D]">
      <Icon className="h-3.5 w-3.5 text-[#8C8476]" />
      {label}
    </div>
    <div
      className={`max-w-[200px] truncate text-right text-xs font-medium tracking-wide ${
        highlight ? "text-[#C05A39] font-semibold" : "text-[#161514]"
      }`}
      title={String(value)}
    >
      {value}
    </div>
  </div>
);

export const SearchDetailModal = ({ isOpen, result, onClose, onSearchSimilar }) => {
  const [showDetails, setShowDetails] = useState(false);

  const queryClient = useQueryClient();
  const saveBookmarkMutation = useMutation({
    mutationFn: saveBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
  const { reset: resetSaveBookmark } = saveBookmarkMutation;

  useEffect(() => {
    resetSaveBookmark();
  }, [isOpen, result?.imageId, resetSaveBookmark]);

  if (!isOpen || !result) return null;

  const imageUrl = resolveImageUrl(
    result.imageUrl || result.storagePath || result.thumbnailUrl || result.thumbnailPath,
    result.imageId
  );
  const fileName = result.originalFilename || `Thiết kế #${result.imageId}`;
  const dimensions =
    result.width && result.height ? `${result.width} x ${result.height} px` : "Chưa có dữ liệu";
  const isMockOnly = result.isMock && !result.canBookmark;
  const canSave = !!result.imageId && !isMockOnly && !saveBookmarkMutation.isPending;

  const similarityScore = result.similarityScore ?? result.score ?? 0;

  const handleSaveBookmark = () => {
    if (!result.imageId) return;
    saveBookmarkMutation.mutate(result.imageId);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#161514]/75 p-3 sm:p-6 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-detail-title"
      onMouseDown={onClose}
    >
      <div
        className="relative flex flex-col lg:grid max-h-[92vh] w-full max-w-[1080px] overflow-y-auto lg:overflow-hidden bg-[#FAF8F5] border border-[#E5E0D8] shadow-2xl lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute cursor-pointer right-3 top-3 z-20 flex h-8 w-8 items-center justify-center border border-[#E5E0D8] bg-[#FAF8F5] text-[#161514] hover:border-[#161514] transition-colors"
        >
          <FaTimes className="h-3.5 w-3.5" />
        </button>

        {/* Khung chứa ảnh */}
        <div className="relative flex h-[40vh] sm:h-[48vh] lg:h-auto lg:min-h-[580px] items-center justify-center bg-[#F3EFE6] border-b lg:border-b-0 lg:border-r border-[#E5E0D8]">
          {imageUrl ? (
            <ImageWithFallback
              src={imageUrl}
              imageId={result.imageId}
              alt={fileName}
              loading="eager"
              className="h-full w-full object-contain p-4 lg:max-h-[85vh]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-[#8C8476]">
              Không có ảnh để hiển thị
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#161514]/70 to-transparent p-4">
            <p className="max-w-xl truncate text-xs text-[#FAF8F5] tracking-wide" title={fileName}>
              {fileName}
            </p>
          </div>
        </div>

        {/* Cột thông tin chi tiết */}
        <aside className="flex flex-col justify-between p-6 sm:p-8 bg-[#FAF8F5] lg:max-h-[92vh] lg:overflow-y-auto">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.22em] text-[#C05A39] uppercase mb-1">
              CONCIERGE THỊ GIÁC &bull; THÔNG TIN THIẾT KẾ
            </p>
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
              <h2
                id="search-detail-title"
                className="font-serif-luxury text-xl sm:text-2xl font-normal text-[#161514]"
              >
                Hồ Sơ Tác Phẩm
              </h2>
              
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex cursor-pointer items-center gap-1.5 px-2.5 py-1 text-xs border border-[#E5E0D8] text-[#161514] lg:hidden"
              >
                <span>{showDetails ? "Thu gọn" : "Chi tiết"}</span>
                {showDetails ? <FaChevronUp className="h-2.5 w-2.5" /> : <FaChevronDown className="h-2.5 w-2.5" />}
              </button>
            </div>

            {/* Bảng thông số */}
            <div className={`mt-5 space-y-3 ${showDetails ? 'block' : 'hidden lg:block'}`}>
              <DetailRow icon={FaHashtag} label="Mã hình ảnh" value={`IMG-${result.imageId}`} />
              {similarityScore > 0 && (
                <DetailRow
                  icon={FaStar}
                  label="Độ chuẩn xác thị giác"
                  value={formatScore(similarityScore)}
                  highlight
                />
              )}
              <DetailRow icon={FaRulerCombined} label="Độ phân giải" value={dimensions} />
              <DetailRow icon={FaSearch} label="Thứ hạng tìm kiếm" value={`#${result.rankPosition || 1}`} />
              <DetailRow icon={FaFileImage} label="Định dạng" value={result.mimeType || "image/jpeg"} />
              <DetailRow icon={FaImage} label="Tên tệp" value={fileName} />
            </div>
          </div>

          {/* Các nút hành động */}
          <div className="mt-8 pt-5 border-t border-[#E5E0D8]">
            {saveBookmarkMutation.isSuccess && (
              <p className="mb-3 p-2.5 bg-[#FAF8F5] border border-[#C05A39]/30 text-xs text-[#C05A39]">
                Đã lưu hình ảnh vào mục Yêu thích! {' '}
                <Link
                  to="/bookmarks"
                  className="font-semibold underline hover:text-[#161514] transition-colors"
                >
                  Xem danh sách
                </Link>
              </p>
            )}
            {saveBookmarkMutation.isError && (
              <p className="mb-3 p-2.5 bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#6B655D]">
                Hình ảnh này đã có sẵn trong danh sách lưu trữ.
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onSearchSimilar?.(result)}
                className="cursor-pointer w-full py-2.5 px-4 bg-[#C05A39] hover:bg-[#A64B2E] text-[#FAF8F5] text-[10.5px] font-medium tracking-[0.16em] uppercase flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <FaSearch className="h-3 w-3" />
                <span>Tìm Ảnh Tương Tự</span>
              </button>

              <button
                type="button"
                onClick={handleSaveBookmark}
                disabled={!canSave}
                className="cursor-pointer w-full py-2.5 px-4 border border-[#161514] hover:bg-[#161514] hover:text-[#FAF8F5] text-[#161514] text-[10.5px] font-medium tracking-[0.16em] uppercase flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              >
                <FaBookmark className="h-3 w-3" />
                <span>{saveBookmarkMutation.isPending ? "Đang lưu..." : "Lưu Yêu Thích"}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};