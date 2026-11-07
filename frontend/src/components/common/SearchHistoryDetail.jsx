import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaTimes, FaImage, FaAlignLeft, FaFont, FaClock } from "react-icons/fa";
import { getSearchHistoryDetail } from "../../services/searchHistoryService";
import { ImageWithFallback } from "../common/ImageWithFallback";
import { formatDateTime } from "../../utils/formatDateTime";

export const SearchHistoryDetailModal = ({ isOpen, onClose, searchId }) => {
  const dialogRef = useRef(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["search-history-detail", searchId],
    queryFn: () => getSearchHistoryDetail(searchId),
    enabled: !!searchId && isOpen,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleBackdropClick = (event) => {
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isDialogContent =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;
    if (!isDialogContent) {
      dialog.close();
    }
  };

  if (!isOpen) return null;

  const isImageSearch = data?.searchType === "IMAGE_TO_IMAGE";
  const modeLabel = isImageSearch
    ? "Tìm kiếm bằng hình ảnh"
    : data?.searchType === "TEXT_OCR"
      ? "Nhận diện nhãn chữ"
      : "Tìm kiếm theo mô tả";

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="search-history-detail-title"
      onClose={onClose}
      onClick={handleBackdropClick}
      className="m-auto w-[min(92vw,640px)] bg-[#FAF8F5] p-0 text-[#161514] border border-[#E5E0D8] shadow-2xl backdrop:bg-[#161514]/70 backdrop:backdrop-blur-xs"
    >
      <div>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D8] bg-[#F7F5F0]">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#C05A39]">
              NHẬT KÝ TÌM KIẾM
            </p>
            <h2
              id="search-history-detail-title"
              className="font-serif-luxury text-xl font-normal text-[#161514] mt-0.5"
            >
              Chi Tiết Truy Vấn #{searchId}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Đóng chi tiết tìm kiếm"
            className="p-2 text-[#8C8476] hover:text-[#161514] cursor-pointer transition-colors"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin h-7 w-7 border border-[#161514] border-t-transparent" />
            </div>
          ) : isError ? (
            <div className="border border-[#C05A39]/30 bg-[#C05A39]/10 p-4 text-center text-xs text-[#C05A39]">
              Không thể tải thông tin chi tiết truy vấn này.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="px-3 py-1 text-[10.5px] font-semibold uppercase tracking-widest border border-[#161514] bg-[#161514] text-[#FAF8F5] inline-flex items-center gap-1.5">
                  {isImageSearch ? (
                    <FaImage className="h-3 w-3" />
                  ) : data?.searchType === "TEXT_OCR" ? (
                    <FaFont className="h-3 w-3" />
                  ) : (
                    <FaAlignLeft className="h-3 w-3" />
                  )}
                  <span>{modeLabel}</span>
                </span>
                <span className="text-xs text-[#6B655D]">
                  {formatDateTime(data?.createdAt)}
                </span>
              </div>

              {isImageSearch ? (
                <div className="w-full bg-[#F3EFE6] border border-[#E5E0D8] overflow-hidden flex justify-center p-4 min-h-[16rem]">
                  <ImageWithFallback
                    src={data?.queryImageUrl || data?.storagePath}
                    imageId={data?.queryImageId}
                    alt="Ảnh truy vấn tìm kiếm"
                    className="max-h-80 object-contain"
                  />
                </div>
              ) : (
                <div className="w-full bg-white border border-[#E5E0D8] p-5">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#8C8476] mb-2">
                    Từ khóa tìm kiếm
                  </p>
                  <p className="font-serif-luxury text-lg text-[#161514] italic break-words whitespace-pre-wrap leading-relaxed">
                    {data?.queryText !== "null" && data?.queryText
                      ? `"${data.queryText}"`
                      : "Không có nội dung văn bản"}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-[#E5E0D8] text-xs text-[#6B655D]">
                <span className="inline-flex items-center gap-1.5">
                  <FaClock className="text-[#8C8476] h-3.5 w-3.5" />
                  <span>Thời gian phản hồi:</span>
                  <strong className="text-[#161514]">
                    {data?.processingTimeMs || 0} ms
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="btn-noir py-2 px-5 text-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
};
