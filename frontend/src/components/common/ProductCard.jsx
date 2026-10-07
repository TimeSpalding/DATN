import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Sparkles, ShoppingBag, Eye } from 'lucide-react';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';

export default function ProductCard({ product, onTryOnNow }) {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (!product) return null;

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
    <div className="group relative flex flex-col rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-blue-900/30 hover:shadow-lg transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
        <Link to={`/products/${product.id}`} className="block w-full h-full">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {product.badge && (
            <span className="text-[9.5px] font-bold tracking-wider uppercase px-2.5 py-0.5 bg-slate-900 text-white rounded-full shadow-2xs">
              {product.badge}
            </span>
          )}
          {product.discountPercent > 0 && (
            <span className="text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 bg-rose-600 text-white rounded-full shadow-2xs">
              -{product.discountPercent}%
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer z-10 ${
            isFavorited
              ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs'
              : 'bg-white/80 backdrop-blur-md text-slate-700 hover:bg-white hover:text-slate-950 border border-slate-200'
          }`}
          title={isFavorited ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-600' : ''}`} />
        </button>

        {/* Quick Action Overlay on Hover */}
        <div className="absolute inset-x-2.5 bottom-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            type="button"
            onClick={handleTryOnClick}
            className="w-full bg-blue-900/90 hover:bg-blue-950 text-white text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 backdrop-blur-md transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ướm Thử Ảo Ngay</span>
          </button>
          
          <button
            type="button"
            onClick={handleAddToCartClick}
            className="w-full bg-white/95 hover:bg-white text-slate-900 text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 backdrop-blur-md transition-all shadow-sm cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-blue-700" />
            <span>Thêm Giỏ Hàng</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block truncate">
            {product.material || product.category}
          </span>
          <Link to={`/products/${product.id}`}>
            <h3 className="font-semibold text-xs sm:text-sm text-slate-900 mt-1 leading-snug line-clamp-2 min-h-[2.5rem] hover:text-blue-700 transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="font-bold text-sm text-slate-950">
              {product.price}
            </span>
            {product.originalPrice && product.originalPrice > product.rawPrice && (
              <span className="text-[11px] text-slate-600 line-through ml-2">
                {product.originalPrice.toLocaleString('vi-VN')}₫
              </span>
            )}
          </div>

          <div className="flex items-center text-[11px] text-slate-500 font-semibold gap-1">
            <span className="text-amber-500 font-bold">{product.rating || '4.9'}</span>
            <span>({product.reviewsCount || '12'})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
