import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Award,
  Bookmark,
  CheckCircle2,
  Hash,
  Layers,
  Search,
  Shirt,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { formatScore } from "../../utils/formatScore";
import { getCleanGarmentTitle } from "../../utils/garmentTitle";
import { resolveImageUrl } from "../../utils/imageUrl";
import { saveBookmark } from "../../services/bookmarkService";
import { ImageWithFallback } from "./ImageWithFallback";

const CATEGORY_LABELS = {
  upper: "Áo & Tops",
  dress: "Đầm & Váy",
  lower: "Quần",
  outerwear: "Áo khoác",
};

const DetailRow = ({ icon: Icon, label, value, highlight = false }) => (
  <div className="flex items-center justify-between gap-4 border-b border-[#E5E0D8] pb-2.5">
    <div className="flex items-center gap-2 text-xs font-medium text-[#6B655D]">
      <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#8C8476]" />
      <span>{label}</span>
    </div>
    <div
      className={`max-w-[210px] truncate text-right text-xs font-medium tracking-wide ${
        highlight ? "font-semibold text-[#C05A39]" : "text-[#161514]"
      }`}
      title={String(value)}
    >
      {value}
    </div>
  </div>
);

function SearchDetailDialog({ result, onClose, onSearchSimilar }) {
  const [showComposedInput, setShowComposedInput] = useState(false);
  const [composedText, setComposedText] = useState("");

  const dialogRef = useRef(null);
  const titleId = useId();
  const composedInputId = useId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const saveBookmarkMutation = useMutation({
    mutationFn: saveBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) {
      dialog.showModal();
    }

    if (!("closedBy" in HTMLDialogElement.prototype)) {
      const isOutside = (event) => {
        const rect = dialog.getBoundingClientRect();
        return (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        );
      };

      let pressedOutside = false;
      const handlePointerDown = (event) => {
        pressedOutside = isOutside(event);
      };
      const handlePointerUp = (event) => {
        if (pressedOutside && isOutside(event)) {
          dialog.close();
        }
      };

      dialog.addEventListener("pointerdown", handlePointerDown);
      dialog.addEventListener("pointerup", handlePointerUp);
      return () => {
        dialog.removeEventListener("pointerdown", handlePointerDown);
        dialog.removeEventListener("pointerup", handlePointerUp);
      };
    }

    return undefined;
  }, []);

  const imageUrl = resolveImageUrl(
    result.imageUrl || result.storagePath || result.thumbnailUrl || result.thumbnailPath,
    result.imageId
  );

  const displayTitle = getCleanGarmentTitle(result);
  const designCode = result.sku || `GAC-${String(result.imageId || 0).padStart(4, "0")}`;
  const categoryLabel = result.category
    ? CATEGORY_LABELS[result.category] || result.category
    : null;

  const similarityScore = result.similarityScore ?? result.score ?? 0;
  const similarityPercent = Math.min(100, Math.max(8, Math.round(similarityScore * 100)));
  const matchTierLabel =
    similarityScore >= 0.8
      ? "Độ tương đồng cao"
      : similarityScore >= 0.65
        ? "Phù hợp tốt"
        : "Gợi ý tham khảo";

  const isMockOnly = result.isMock && !result.canBookmark;
  const canSave = Boolean(result.imageId) && !isMockOnly && !saveBookmarkMutation.isPending;

  const handleRequestClose = () => {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    } else {
      onClose?.();
    }
  };

  const handleSaveBookmark = () => {
    if (!result.imageId) return;
    saveBookmarkMutation.mutate(result.imageId);
  };

  const handleComposedSearch = (event) => {
    event.preventDefault();
    if (!composedText.trim() || !result?.imageId) return;
    onClose?.();
    navigate(
      `/search-result?type=composed&imageId=${result.imageId}&text=${encodeURIComponent(
        composedText.trim()
      )}&page=1&size=20`
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLaunchTryOn = () => {
    onClose?.();
    navigate("/try-on", {
      state: {
        selectedGarment: {
          id: `search-${result.imageId}`,
          name: displayTitle,
          image: imageUrl,
          category: result.category || "upper",
          price: result.price || "450.000₫",
        },
      },
    });
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" })}
      aria-labelledby={titleId}
      onClose={() => onClose?.()}
      className="m-auto w-[calc(100%-1.5rem)] max-w-[1060px] border border-[#E5E0D8] bg-[#FAF8F5] p-0 text-[#161514] shadow-2xl"
    >
      <div className="relative flex max-h-[92vh] flex-col overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] lg:overflow-hidden">
        <button
          type="button"
          onClick={handleRequestClose}
          aria-label="Đóng chi tiết sản phẩm"
          className="absolute top-3 right-3 z-20 flex h-8 w-8 cursor-pointer items-center justify-center border border-[#E5E0D8] bg-[#FAF8F5] text-[#161514] transition-colors hover:border-[#161514] hover:text-[#C05A39]"
        >
          <X aria-hidden="true" className="h-4 w-4 stroke-[1.75]" />
        </button>

        {/* Left Column: Clean Garment Showcase */}
        <div className="relative flex h-[40vh] items-center justify-center border-b border-[#E5E0D8] bg-[#F3EFE6] sm:h-[48vh] lg:h-auto lg:min-h-[580px] lg:border-r lg:border-b-0">
          {imageUrl ? (
            <ImageWithFallback
              src={imageUrl}
              imageId={result.imageId}
              alt={displayTitle}
              loading="eager"
              className="h-full w-full object-contain p-5 lg:max-h-[84vh]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-[#8C8476]">
              Không có hình ảnh hiển thị
            </div>
          )}

          {result.rankPosition && (
            <div className="pointer-events-none absolute top-3 left-3 border border-[#E5E0D8] bg-[#FAF8F5]/90 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-[#161514] uppercase backdrop-blur-xs">
              Kết quả #{result.rankPosition}
            </div>
          )}
        </div>

        {/* Right Column: Curated Garment & Search Details */}
        <aside className="flex flex-col justify-between bg-[#FAF8F5] p-6 sm:p-7 lg:max-h-[92vh] lg:overflow-y-auto">
          <div>
            <p className="mb-1 text-[10px] font-semibold tracking-[0.22em] text-[#C05A39] uppercase">
              Thông Tin Mẫu Trang Phục
            </p>

            <div className="border-b border-[#E5E0D8] pb-3.5 pr-8">
              <h2
                id={titleId}
                className="font-serif-luxury text-2xl font-normal text-[#161514] sm:text-[26px]"
              >
                {displayTitle}
              </h2>
              {result.price && (
                <p className="mt-1 text-sm font-semibold tracking-wide text-[#C05A39]">
                  {result.price}
                </p>
              )}
            </div>

            {/* Similarity Match Meter */}
            {similarityScore > 0 && (
              <div className="mt-4 border border-[#E5E0D8] bg-[#F7F5F0] p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-[#161514]">
                    <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-[#C05A39]" />
                    <span>Mức độ tương đồng</span>
                  </span>
                  <span className="text-xs font-semibold text-[#C05A39]">
                    {formatScore(similarityScore)} &bull; {matchTierLabel}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden bg-[#EAE5D9]">
                  <div
                    className="h-full bg-[#C05A39] transition-all duration-500"
                    style={{ width: `${similarityPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Curated Product & Search Attributes */}
            <div className="mt-4 space-y-2.5">
              <DetailRow icon={Hash} label="Mã thiết kế" value={designCode} />
              <DetailRow
                icon={Award}
                label="Thứ hạng kết quả"
                value={`Top #${result.rankPosition || 1}`}
              />
              {categoryLabel && (
                <DetailRow icon={Shirt} label="Danh mục" value={categoryLabel} />
              )}
              {result.material && (
                <DetailRow icon={Layers} label="Chất liệu" value={result.material} />
              )}
              <DetailRow
                icon={CheckCircle2}
                label="Trải nghiệm thử đồ"
                value="Sẵn sàng ướm thử"
                highlight
              />
            </div>

            <p className="mt-4 border-l-2 border-[#C05A39] bg-[#F7F5F0] px-3.5 py-2.5 text-xs leading-relaxed text-[#6B655D]">
              Chuyển mẫu trang phục này sang Phòng thử đồ để xem trực tiếp trên ảnh cá nhân, hoặc nhập mô tả bên dưới để tìm kiểu dáng tương tự với màu sắc, chi tiết khác.
            </p>
          </div>

          {/* Actions & Editorial Composed Search */}
          <div className="mt-6 border-t border-[#E5E0D8] pt-5">
            {saveBookmarkMutation.isSuccess && (
              <p className="mb-3 border border-[#C05A39]/30 bg-[#FAF8F5] p-2.5 text-xs text-[#C05A39]">
                Đã lưu vào danh sách yêu thích.{" "}
                <Link
                  to="/bookmarks"
                  onClick={() => onClose?.()}
                  className="font-semibold underline transition-colors hover:text-[#161514]"
                >
                  Xem danh sách
                </Link>
              </p>
            )}
            {saveBookmarkMutation.isError && (
              <p className="mb-3 border border-[#E5E0D8] bg-[#F7F5F0] p-2.5 text-xs text-[#6B655D]">
                Mẫu trang phục này đã có trong danh sách yêu thích.
              </p>
            )}

            {/* Editorial Composed Search Trigger & Form */}
            {result.imageId && (
              <div className="mb-3">
                {!showComposedInput ? (
                  <button
                    type="button"
                    onClick={() => setShowComposedInput(true)}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 border border-[#D8D2C5] bg-[#F3EFE6] px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.15em] text-[#161514] uppercase transition-colors hover:border-[#161514] hover:bg-[#EAE5D9]"
                  >
                    <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5 text-[#C05A39]" />
                    <span>Tìm Kiểu Dáng Này Với Mô Tả Khác</span>
                  </button>
                ) : (
                  <form
                    onSubmit={handleComposedSearch}
                    className="border border-[#161514] bg-[#F3EFE6] p-3.5"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <label
                        htmlFor={composedInputId}
                        className="text-[10.5px] font-semibold tracking-[0.14em] text-[#161514] uppercase"
                      >
                        Mô tả thay đổi từ mẫu này
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowComposedInput(false);
                          setComposedText("");
                        }}
                        className="cursor-pointer text-[10.5px] font-medium tracking-wider text-[#6B655D] uppercase transition-colors hover:text-[#C05A39]"
                      >
                        Đóng
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        id={composedInputId}
                        type="text"
                        value={composedText}
                        onChange={(e) => setComposedText(e.target.value)}
                        placeholder="VD: đổi sang màu đen, kẻ sọc, tay ngắn..."
                        autoFocus
                        className="h-9 flex-1 border border-[#D8D2C5] bg-[#FAF8F5] px-3 text-xs text-[#161514] placeholder:text-[#8C8476] focus:border-[#161514] focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!composedText.trim()}
                        className="h-9 shrink-0 cursor-pointer bg-[#161514] px-4 text-[10.5px] font-semibold tracking-[0.15em] text-[#FAF8F5] uppercase transition-colors hover:bg-[#C05A39] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Tìm Ngay
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Primary Try-On CTA */}
            <button
              type="button"
              onClick={handleLaunchTryOn}
              className="mb-2.5 flex w-full cursor-pointer items-center justify-center gap-2 bg-[#C05A39] px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.16em] text-[#FAF8F5] uppercase transition-colors hover:bg-[#A64B2E]"
            >
              <span>Ướm Thử Tại Phòng Thử Đồ</span>
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </button>

            {/* Secondary Actions */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onSearchSimilar?.(result)}
                className="flex w-full cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap bg-[#161514] px-3 py-2.5 text-[10.5px] font-semibold tracking-[0.14em] text-[#FAF8F5] uppercase transition-colors hover:bg-[#2B2825]"
              >
                <Search aria-hidden="true" className="h-3 w-3 shrink-0" />
                <span>Mẫu Tương Tự</span>
              </button>

              <button
                type="button"
                onClick={handleSaveBookmark}
                disabled={!canSave}
                className="flex w-full cursor-pointer items-center justify-center gap-2 border border-[#161514] bg-[#FAF8F5] px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.15em] text-[#161514] uppercase transition-colors hover:bg-[#161514] hover:text-[#FAF8F5] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Bookmark aria-hidden="true" className="h-3 w-3" />
                <span>{saveBookmarkMutation.isPending ? "Đang lưu..." : "Lưu Yêu Thích"}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </dialog>,
    document.body
  );
}

export const SearchDetailModal = ({ isOpen, result, onClose, onSearchSimilar }) => {
  if (!isOpen || !result) return null;

  return (
    <SearchDetailDialog
      key={result.imageId || "detail"}
      result={result}
      onClose={onClose}
      onSearchSimilar={onSearchSimilar}
    />
  );
};
