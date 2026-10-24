import { FaAlignLeft, FaClock, FaFont, FaHashtag, FaImage } from "react-icons/fa";
import { resolveImageUrl } from "../../utils/imageUrl";
import { ImageWithFallback } from "../common/ImageWithFallback";
import { formatDateTime } from "../../utils/formatDateTime";

const searchTypeConfig = {
  IMAGE_TO_IMAGE: {
    label: "Hình ảnh tham chiếu",
    Icon: FaImage,
    className: "border border-[#161514] bg-[#161514] text-[#FAF8F5]",
  },
  TEXT_SEMANTIC: {
    label: "Mô tả chất liệu & phong cách",
    Icon: FaAlignLeft,
    className: "border border-[#C05A39] bg-[#C05A39]/10 text-[#C05A39]",
  },
  TEXT_OCR: {
    label: "Ký tự & Họa tiết dệt",
    Icon: FaFont,
    className: "border border-[#9E7A52] bg-[#9E7A52]/10 text-[#9E7A52]",
  },
};

const getHistoryId = (history) => history.searchId || history.id;
const getHistorySearchType = (history) => history.searchType || history.search_type || "TEXT_SEMANTIC";

const getHistoryImagePath = (history) => {
  return (
    history.thumbnailPath ||
    history.thumbnailUrl ||
    history.thumbnail_path ||
    history.thumbnail_url ||
    history.queryImageUrl ||
    history.queryImagePath ||
    history.query_image_url ||
    history.query_image_path ||
    history.storagePath ||
    history.storage_path ||
    ""
  );
};

export const SearchHistoryCard = ({ history, onClick }) => {
  const searchType = getHistorySearchType(history);
  const config = searchTypeConfig[searchType] || searchTypeConfig.TEXT_SEMANTIC;
  const Icon = config.Icon;
  const isImageSearch = searchType === "IMAGE_TO_IMAGE";
  const historyId = getHistoryId(history);
  const imagePath = getHistoryImagePath(history);
  const imageUrl = resolveImageUrl(imagePath);
  const queryText = history.queryText || history.query_text || history.query || "Không có nội dung tìm kiếm";

  return (
    <article
      onClick={onClick}
      className="group flex h-full cursor-pointer flex-col border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#161514] transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F3EFE6]">
        {isImageSearch && imageUrl ? (
          <ImageWithFallback
            src={imageUrl}
            imageId={history.queryImageId}
            alt={`Truy vấn thị giác #${historyId}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col justify-between bg-[#F3EFE6] p-4">
            <span className={`inline-flex w-fit items-center gap-1.5 px-2.5 py-1 text-[9.5px] uppercase tracking-widest font-medium ${config.className}`}>
              <Icon className="h-2.5 w-2.5" />
              {config.label}
            </span>
            <p className="line-clamp-3 font-serif-luxury text-sm font-normal text-[#161514] leading-relaxed" title={queryText}>
              &ldquo;{queryText}&rdquo;
            </p>
          </div>
        )}

        {isImageSearch && (
          <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 px-2.5 py-1 text-[9.5px] uppercase tracking-widest font-medium shadow-xs ${config.className}`}>
            <Icon className="h-2.5 w-2.5" />
            {config.label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 bg-[#FAF8F5]">
        <div className="space-y-1">
          <h3 className="line-clamp-2 font-serif-luxury text-base font-normal text-[#161514] leading-snug group-hover:text-[#C05A39] transition-colors">
            {isImageSearch ? `Tác phẩm tham chiếu #${historyId}` : queryText}
          </h3>
          <p className="text-[10px] text-[#8C8476] tracking-wider uppercase">
            {formatDateTime(history.createdAt || history.createAt)}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E5E0D8] flex items-center justify-between text-[10px] text-[#8C8476] uppercase tracking-wider">
          <span className="truncate">
            Mã: #{historyId || "N/A"}
          </span>
          <span className="flex items-center gap-1">
            <FaClock className="h-2.5 w-2.5" />
            {history.processingTimeMs ?? 0}ms
          </span>
        </div>
      </div>
    </article>
  );
};
