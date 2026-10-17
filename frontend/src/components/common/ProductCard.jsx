import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { resolveImageUrl } from '../../utils/imageUrl';
import { enrichProduct } from '../../utils/productEnricher';

export default function ProductCard({ product, onTryOnNow }) {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (!product) return null;

  const enriched = enrichProduct(product);
  const isFavorited = isInWishlist(product.id);

  const handleTryOnClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onTryOnNow) {
      onTryOnNow(product);
    } else {
      navigate('/try-on', { state: { selectedGarment: product } });
    }
  };

  const handleAddToCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 'M', product.colors?.[0]?.name, 1, true);
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div className="group relative flex flex-col bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#161514] transition-all duration-500">
      {/* 1. Image Container (3:4 Editorial Portrait Aspect Ratio) */}
      <div className="relative aspect-[3/4] bg-[#F3EFE6] overflow-hidden">
        <Link to={`/products/${product.id}`} className="block w-full h-full">
          <img
            src={resolveImageUrl(product.image)}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/samples/cloth-1.jpg';
            }}
          />
        </Link>

        {/* Badges / Editorial Tag */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10 pointer-events-none">
          {product.badge && (
            <span className="text-[9px] font-semibold tracking-[0.2em] uppercase px-2.5 py-1 bg-[#161514] text-[#FAF8F5]">
              {product.badge}
            </span>
          )}
          {product.discountPercent > 0 && (
            <span className="text-[9px] font-semibold tracking-[0.16em] uppercase px-2 py-0.5 bg-[#C05A39] text-[#FAF8F5]">
              -{product.discountPercent}%
            </span>
          )}
        </div>

        {/* Minimalist Wishlist Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center transition-all cursor-pointer z-10 ${
            isFavorited
              ? 'bg-[#FAF8F5] text-[#C05A39] border border-[#E5E0D8]'
              : 'bg-[#FAF8F5]/80 backdrop-blur-xs text-[#6B655D] hover:bg-[#FAF8F5] hover:text-[#161514] border border-[#E5E0D8]'
          }`}
          title={isFavorited ? 'Xóa khỏi danh sách lưu' : 'Lưu vào danh sách yêu thích'}
        >
          <Heart className={`w-3.5 h-3.5 stroke-[1.75] ${isFavorited ? 'fill-[#C05A39]' : ''}`} />
        </button>

        {/* Hover Action Overlay: Bespoke Atelier Actions */}
        <div className="absolute inset-x-3 bottom-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <button
            type="button"
            onClick={handleTryOnClick}
            className="w-full bg-[#C05A39] hover:bg-[#A64B2E] text-[#FAF8F5] text-[10.5px] font-medium tracking-[0.18em] uppercase py-2.5 flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <span>Ướm Thử Sản Phẩm</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          
          <button
            type="button"
            onClick={handleAddToCartClick}
            className="w-full bg-[#FAF8F5] hover:bg-[#FFFFFF] text-[#161514] text-[10.5px] font-medium tracking-[0.18em] uppercase py-2.5 flex items-center justify-center gap-1.5 border border-[#161514] transition-all cursor-pointer"
          >
            <span>Thêm Vào Túi Đồ</span>
          </button>
        </div>
      </div>

      {/* 2. Product Narrative & Specifications */}
      <div className="p-4 flex flex-col flex-1 justify-between bg-[#FAF8F5]">
        <div>
          <div className="flex items-center justify-between text-[10px] tracking-[0.2em] text-[#8C8476] uppercase font-medium">
            <span className="truncate max-w-[140px]">
              {enriched.enrichedFabric?.composition?.split(' ')[0]} {enriched.enrichedFabric?.composition?.split(' ')[1] || 'ATELIER'}
            </span>
            <span>{enriched.atelierCode}</span>
          </div>

          <Link to={`/products/${product.id}`} className="block mt-1.5">
            <h3 className="font-serif-luxury text-base font-normal text-[#161514] leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-[#C05A39] transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price & Atelier Signature */}
        <div className="mt-3 pt-3 border-t border-[#E5E0D8] flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-sm text-[#161514] tracking-wide">
              {product.price}
            </span>
            {product.originalPrice && product.originalPrice > product.rawPrice && (
              <span className="text-[11px] text-[#8C8476] line-through">
                {product.originalPrice.toLocaleString('vi-VN')}₫
              </span>
            )}
          </div>

          <span className="text-[10px] tracking-[0.15em] text-[#8C8476] uppercase font-medium">
            Sẵn hàng
          </span>
        </div>
      </div>
    </div>
  );
}
