import { useNavigate } from "react-router-dom";
import { formatScore } from "../../utils/formatScore";
import { resolveImageUrl } from "../../utils/imageUrl";
import { ImageWithFallback } from "../common/ImageWithFallback";
import { FiTrash2, FiCheck } from "react-icons/fi";
import { ArrowRight } from "lucide-react";

export const SearchResultCard = ({
  result,
  onViewDetails,
  isSelectable = false,
  isSelected = false,
  onToggleSelect,
  showDeleteAction = false,
  onDelete,
}) => {
  const navigate = useNavigate();
  const imageUrl = resolveImageUrl(
    result.thumbnailUrl || result.imageUrl || result.thumbnailPath || result.storagePath,
    result.imageId
  );
  const similarityScore = result.similarityScore ?? result.score ?? 0;

  const aspectRatioStyle = result.width && result.height
    ? { aspectRatio: `${result.width} / ${result.height}` }
    : { aspectRatio: '3 / 4' }; 

  const actionVisibilityClasses = isSelected 
    ? "opacity-100" 
    : "opacity-100 md:opacity-0 md:group-hover:opacity-100";

  const handleLaunchTryOn = (e) => {
    e.stopPropagation();
    navigate('/try-on', {
      state: {
        selectedGarment: {
          id: `search-${result.imageId}`,
          name: result.name || result.originalFilename || `Thiết kế #${result.imageId}`,
          image: imageUrl,
          category: result.category || 'upper',
          price: result.price || '450.000₫',
        }
      }
    });
  };

  return (
    <article
      onClick={() => onViewDetails?.(result)}
      className={`group relative cursor-pointer overflow-hidden bg-[#F3EFE6] border transition-all duration-500 ${
        isSelected ? "border-[#161514] scale-[0.98] shadow-md" : "border-[#E5E0D8] hover:border-[#161514]"
      }`}
      style={aspectRatioStyle}
    >
      <div 
        className={`pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#161514]/80 via-transparent to-transparent transition-opacity duration-300 ${actionVisibilityClasses}`} 
      />

      {isSelectable && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleSelect?.(result.imageId);
          }}
          className={`absolute left-3 top-3 z-20 flex h-7 w-7 items-center justify-center border shadow-sm backdrop-blur-xs transition-all ${
            isSelected
              ? "border-[#161514] bg-[#161514] text-[#FAF8F5]"
              : "border-white/80 bg-black/20 text-transparent hover:border-white hover:bg-black/40"
          } ${actionVisibilityClasses}`}
          aria-label="Chọn thiết kế"
        >
          <FiCheck className={`h-3.5 w-3.5 transition-opacity ${isSelected ? "opacity-100" : "opacity-0"}`} strokeWidth={2.5} />
        </button>
      )}

      {showDeleteAction && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete?.(result.imageId);
          }}
          className={`absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center bg-black/40 text-white shadow-sm backdrop-blur-xs transition-all hover:bg-[#C05A39] ${actionVisibilityClasses}`}
          title={`Xóa ảnh #${result.imageId}`}
        >
          <FiTrash2 className="h-3.5 w-3.5" />
        </button>
      )}

      {imageUrl ? (
        <ImageWithFallback
          src={imageUrl}
          imageId={result.imageId}
          alt={`Thiết kế #${result.imageId}`}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-700 ease-out ${
            isSelected ? "scale-105" : "group-hover:scale-105"
          }`}
        />
      ) : (
        <div className="flex h-full min-h-[200px] w-full items-center justify-center px-4 text-center text-xs text-[#8C8476]">
          Không có hình ảnh
        </div>
      )}

      {/* Quick Try-On Button on hover */}
      <div className={`absolute bottom-3 left-3 z-20 transition-opacity duration-300 ${actionVisibilityClasses}`}>
        <button
          type="button"
          onClick={handleLaunchTryOn}
          className="px-3 py-1.5 bg-[#C05A39] hover:bg-[#A64B2E] text-[#FAF8F5] text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1 shadow-sm transition-all"
        >
          <span>Ướm Thử</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Similarity score */}
      {similarityScore > 0 && (
        <div 
          className={`absolute bottom-3 right-3 z-20 bg-[#161514]/80 px-2 py-1 text-[9.5px] font-mono tracking-wider text-[#FAF8F5] backdrop-blur-xs transition-opacity duration-300 ${actionVisibilityClasses}`}
        >
          {formatScore(similarityScore)}
        </div>
      )}
    </article>
  );
};
export default SearchResultCard;