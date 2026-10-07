import { useNavigate } from "react-router-dom";
import { formatScore } from "../../utils/formatScore";
import { resolveImageUrl } from "../../utils/imageUrl";
import { ImageWithFallback } from "../common/ImageWithFallback";
import { FiTrash2, FiCheck } from "react-icons/fi";
import { Sparkles, ShoppingBag } from "lucide-react";

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
          name: result.name || result.originalFilename || `Mẫu tìm kiếm #${result.imageId}`,
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
      className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 transition-all duration-300 ${
        isSelected ? "ring-2 ring-blue-900 scale-[0.98] shadow-md" : "hover:shadow-xl hover:border-slate-400"
      }`}
      style={aspectRatioStyle}
    >
      <div 
        className={`pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-transparent to-black/60 transition-opacity duration-300 ${actionVisibilityClasses}`} 
      />

      {isSelectable && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleSelect?.(result.imageId);
          }}
          className={`absolute left-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
            isSelected
              ? "border-blue-900 bg-blue-900 text-white"
              : "border-white/80 bg-black/20 text-transparent hover:border-white hover:bg-black/40"
          } ${actionVisibilityClasses}`}
          aria-label="Chọn ảnh"
        >
          <FiCheck className={`h-4 w-4 transition-opacity ${isSelected ? "opacity-100" : "opacity-0"}`} strokeWidth={3} />
        </button>
      )}

      {showDeleteAction && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete?.(result.imageId);
          }}
          className={`absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white shadow-sm backdrop-blur-md transition-all hover:scale-110 hover:bg-rose-600 ${actionVisibilityClasses}`}
          title={`Xóa ảnh #${result.imageId}`}
        >
          <FiTrash2 className="h-4 w-4" />
        </button>
      )}

      {imageUrl ? (
        <ImageWithFallback
          src={imageUrl}
          imageId={result.imageId}
          alt={`Ảnh #${result.imageId}`}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-500 ${
            isSelected ? "scale-105" : "group-hover:scale-105"
          }`}
        />
      ) : (
        <div className="flex h-full min-h-[200px] w-full items-center justify-center px-4 text-center text-xs text-slate-400">
          Không có ảnh
        </div>
      )}

      {/* Quick Try-On Overlay button on hover */}
      <div className={`absolute bottom-3 left-3 z-20 transition-opacity duration-300 ${actionVisibilityClasses}`}>
        <button
          type="button"
          onClick={handleLaunchTryOn}
          className="px-3 py-1.5 rounded-full bg-slate-950/90 hover:bg-blue-900 text-white text-[10.5px] font-bold tracking-wider uppercase flex items-center gap-1.5 backdrop-blur-md shadow-sm transition-all"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Ướm thử</span>
        </button>
      </div>

      {/* Similarity score pill */}
      {similarityScore > 0 && (
        <div 
          className={`absolute bottom-3 right-3 z-20 rounded-full bg-black/70 px-2.5 py-1 text-[10.5px] font-bold text-white shadow-sm backdrop-blur-md transition-opacity duration-300 ${actionVisibilityClasses}`}
        >
          {formatScore(similarityScore)}
        </div>
      )}
    </article>
  );
};
export default SearchResultCard;