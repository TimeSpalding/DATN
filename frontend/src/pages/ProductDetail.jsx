import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShoppingBag,
  Heart,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
  Minus,
  Plus,
  ArrowRight,
  Ruler,
  X,
  Share2,
} from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import ProductCard from '../components/common/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, showToast } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('desc');
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await catalogService.getProductById(id);
        const prod = res?.data;
        setProduct(prod);
        setSelectedImage(prod.image);
        setSelectedColor(prod.colors?.[0]?.name || 'Tiêu chuẩn');
        setSelectedSize(prod.sizes?.[0]?.size || 'M');

        // Fetch related
        const relatedRes = await catalogService.getRelatedProducts(prod.id, prod.category, 4);
        setRelatedProducts(relatedRes?.data || []);
      } catch (err) {
        console.error('Failed to get product', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-slate-200 border-t-slate-950 animate-spin" />
        <p className="text-xs text-slate-500 font-semibold mt-4">Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-24 text-center">
        <h2 className="text-lg font-bold text-slate-900">Không tìm thấy sản phẩm</h2>
        <p className="text-xs text-slate-500 mt-2">Sản phẩm có thể đã ngừng kinh doanh hoặc đường dẫn không đúng.</p>
        <Link
          to="/catalog"
          className="mt-6 inline-flex px-6 py-2.5 bg-slate-950 text-white text-xs font-bold uppercase rounded-full"
        >
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  const isFavorited = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity, true);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedColor, quantity, false);
    navigate('/checkout');
  };

  const handleLaunchTryOn = () => {
    navigate('/try-on', { state: { selectedGarment: product } });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8">
        <Link to="/" className="hover:text-slate-900 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link to="/catalog" className="hover:text-slate-900 transition-colors">
          Bộ sưu tập
        </Link>
        <span>/</span>
        <Link
          to={`/catalog?category=${product.category}`}
          className="hover:text-slate-900 transition-colors capitalize"
        >
          {product.category === 'upper' ? 'Áo' : product.category === 'lower' ? 'Quần & Váy' : 'Đầm & Đồ Bộ'}
        </Link>
        <span>/</span>
        <span className="text-slate-950 font-bold truncate max-w-[200px] sm:max-w-none">
          {product.name}
        </span>
      </nav>

      {/* Main Product Showcase (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        {/* Left: Gallery Column */}
        <div className="flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails */}
          {product.gallery && product.gallery.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto max-h-[500px]">
              {product.gallery.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`w-18 h-24 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    selectedImage === img ? 'border-slate-950 shadow-xs' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Stage Image */}
          <div className="flex-1 relative aspect-[3/4] rounded-3xl overflow-hidden bg-slate-50 border border-slate-200">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              {product.badge && (
                <span className="text-[10px] font-bold tracking-wider uppercase px-3 py-1 bg-slate-950 text-white rounded-full shadow-xs">
                  {product.badge}
                </span>
              )}
              {product.discountPercent > 0 && (
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 bg-rose-600 text-white rounded-full shadow-xs">
                  -{product.discountPercent}%
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isFavorited
                  ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-xs'
                  : 'bg-white/80 backdrop-blur-md text-slate-700 hover:bg-white border border-slate-200 shadow-xs'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Right: Specifications & CTAs Column */}
        <div className="flex flex-col justify-between">
          <div>
            {/* SKU & Brand Line */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
              <span className="tracking-widest uppercase">MÃ SP: {product.sku}</span>
              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
                Còn hàng ({product.sizes?.reduce((a, b) => a + b.stock, 0) || 45} chiếc)
              </span>
            </div>

            {/* Product Title */}
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Rating & Review summary */}
            <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-500">
              <div className="flex text-amber-500 font-bold">
                {product.rating || '4.9'} / 5.0
              </div>
              <span>&bull;</span>
              <span className="underline cursor-pointer">{product.reviewsCount || 48} Đánh giá đã xác thực</span>
              <span>&bull;</span>
              <span>Đã bán 180+</span>
            </div>

            {/* Price Row */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-900">
                  {product.price}
                </span>
                {product.originalPrice && product.originalPrice > product.rawPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    {product.originalPrice.toLocaleString('vi-VN')}₫
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Đã bao gồm thuế VAT
              </span>
            </div>

            {/* Color Swatches */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-2.5">
                  <span>Màu Sắc: <strong className="text-blue-900">{selectedColor}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      className={`relative w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                        selectedColor === c.name ? 'ring-2 ring-slate-950 ring-offset-2 border-slate-950' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {selectedColor === c.name && (
                        <Check className={`w-3.5 h-3.5 ${['#ffffff', '#fdfbf7', '#f5f5f4', '#f5ebe0', '#fef3c7'].includes(c.hex.toLowerCase()) ? 'text-slate-950' : 'text-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-2.5">
                <span>Chọn Kích Cỡ (Size):</span>
                <button
                  type="button"
                  onClick={() => setShowSizeModal(true)}
                  className="flex items-center gap-1 text-blue-800 hover:underline cursor-pointer font-semibold"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Bảng quy đổi size</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                {product.sizes?.map((sz) => (
                  <button
                    key={sz.size}
                    type="button"
                    onClick={() => setSelectedSize(sz.size)}
                    disabled={sz.stock <= 0}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      selectedSize === sz.size
                        ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                        : sz.stock <= 0
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white text-slate-800 border-slate-300 hover:border-slate-950'
                    }`}
                  >
                    <span>{sz.size}</span>
                    <span className="text-[9px] font-normal opacity-75">
                      {sz.stock > 0 ? `Còn ${sz.stock}` : 'Hết'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mt-6 flex items-center gap-4">
              <span className="text-xs font-bold text-slate-900">Số lượng:</span>
              <div className="inline-flex items-center border border-slate-300 rounded-xl bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-950 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-xs font-bold text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-950 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col gap-3">
              {/* Highlight Virtual Try-on CTA Button */}
              <button
                type="button"
                onClick={handleLaunchTryOn}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-900 to-slate-900 hover:from-blue-950 hover:to-black text-white text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-blue-950/20 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Ướm Thử Sản Phẩm Này (AI Virtual Try-On)</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="py-3.5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-950 text-slate-950 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-blue-800" />
                  <span>Thêm Vào Giỏ</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="py-3.5 rounded-2xl bg-slate-950 hover:bg-blue-900 text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <span>Mua Ngay</span>
                </button>
              </div>
            </div>

            {/* Trust Assurances */}
            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-3 gap-3 text-center">
              <div className="flex flex-col items-center">
                <Truck className="w-5 h-5 text-blue-700 mb-1" />
                <span className="text-[11px] font-bold text-slate-800">Freeship từ 500k</span>
                <span className="text-[10px] text-slate-400">Giao 2-3 ngày</span>
              </div>
              <div className="flex flex-col items-center">
                <RotateCcw className="w-5 h-5 text-blue-700 mb-1" />
                <span className="text-[11px] font-bold text-slate-800">Đổi trả 30 ngày</span>
                <span className="text-[10px] text-slate-400">Tận nhà miễn phí</span>
              </div>
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mb-1" />
                <span className="text-[11px] font-bold text-slate-800">Chính hãng 100%</span>
                <span className="text-[10px] text-slate-400">Bảo hành sợi vải</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details & Specifications Tabs */}
      <div className="mt-16 border-t border-slate-200 pt-10">
        <div className="flex items-center gap-8 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveTab('desc')}
            className={`pb-3 transition-colors cursor-pointer ${
              activeTab === 'desc' ? 'border-b-2 border-slate-950 text-slate-950' : 'text-slate-400 hover:text-slate-800'
            }`}
          >
            Mô Tả &amp; Thông Số Kỹ Thuật
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('care')}
            className={`pb-3 transition-colors cursor-pointer ${
              activeTab === 'care' ? 'border-b-2 border-slate-950 text-slate-950' : 'text-slate-400 hover:text-slate-800'
            }`}
          >
            Chất Liệu &amp; Bảo Quản
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 transition-colors cursor-pointer ${
              activeTab === 'reviews' ? 'border-b-2 border-slate-950 text-slate-950' : 'text-slate-400 hover:text-slate-800'
            }`}
          >
            Đánh Giá Của Khách Hàng ({product.reviewsCount || 48})
          </button>
        </div>

        <div className="py-6 max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-600">
          {activeTab === 'desc' && (
            <div className="space-y-4">
              <p>{product.description}</p>
              <div className="mt-4 border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200">
                <div className="grid grid-cols-3 p-3 bg-slate-50 font-semibold text-slate-800">
                  <span>Chất liệu</span>
                  <span className="col-span-2 font-normal text-slate-600">{product.material}</span>
                </div>
                <div className="grid grid-cols-3 p-3 bg-white font-semibold text-slate-800">
                  <span>Xuất xứ</span>
                  <span className="col-span-2 font-normal text-slate-600">{product.origin || 'Việt Nam'}</span>
                </div>
                <div className="grid grid-cols-3 p-3 bg-slate-50 font-semibold text-slate-800">
                  <span>Kiểu dáng (Fit)</span>
                  <span className="col-span-2 font-normal text-slate-600">Regular Fit may đo chuẩn người châu Á</span>
                </div>
                <div className="grid grid-cols-3 p-3 bg-white font-semibold text-slate-800">
                  <span>Khả năng tương thích AI</span>
                  <span className="col-span-2 font-normal text-slate-600">Hỗ trợ thử đồ ảo độ phân giải 4K trên gương kỹ thuật số</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'care' && (
            <div className="space-y-3">
              <p>Để trang phục giữ được độ bền màu và cấu trúc sợi vải hoàn hảo:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>Giặt máy ở chế độ nhẹ nhàng với nhiệt độ nước không quá 30°C.</li>
                <li>Không sử dụng chất tẩy mạnh chứa clo để tránh làm biến đổi sợi vải tự nhiên.</li>
                <li>Phơi trong bóng râm, tránh ánh nắng mặt trời gắt trực tiếp làm cứng nếp vải.</li>
                <li>Ủi ở nhiệt độ trung bình (dưới 150°C), khuyến khích dùng bàn là hơi nước.</li>
              </ul>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {[
                { name: 'Hoàng Minh', date: '25/09/2026', comment: 'Chất vải rất mịn, đường may tinh tế. Tôi dùng tính năng ướm thử đồ ảo thấy chuẩn kích cỡ nên đặt luôn, nhận hàng mặc vừa như in!', rating: 5 },
                { name: 'Thu Thảo', date: '22/09/2026', comment: 'Màu sắc thực tế rất sang trọng đúng như ảnh studio. Đóng gói hộp rất chuyên nghiệp.', rating: 5 },
              ].map((rev, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900">{rev.name}</span>
                    <span className="text-[11px] text-slate-400">{rev.date}</span>
                  </div>
                  <div className="flex text-amber-500 font-bold mb-1">
                    {'★'.repeat(rev.rating)}
                  </div>
                  <p className="text-slate-600 text-xs">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 border-t border-slate-200 pt-10">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-950 mb-6">
            Sản Phẩm Tương Tự Bạn Có Thể Thích
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      {showSizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-blue-800" />
                <span>Bảng Quy Đổi Kích Cỡ Chuẩn</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSizeModal(false)}
                className="p-1 text-slate-400 hover:text-slate-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 text-xs">
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold">
                    <th className="p-2 border border-slate-200">Size</th>
                    <th className="p-2 border border-slate-200">Chiều cao</th>
                    <th className="p-2 border border-slate-200">Cân nặng</th>
                    <th className="p-2 border border-slate-200">Vòng ngực</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  <tr>
                    <td className="p-2 font-bold border border-slate-200">S</td>
                    <td className="p-2 border border-slate-200">1m55 - 1m65</td>
                    <td className="p-2 border border-slate-200">48 - 56kg</td>
                    <td className="p-2 border border-slate-200">84 - 88cm</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold border border-slate-200">M</td>
                    <td className="p-2 border border-slate-200">1m65 - 1m72</td>
                    <td className="p-2 border border-slate-200">57 - 65kg</td>
                    <td className="p-2 border border-slate-200">89 - 94cm</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold border border-slate-200">L</td>
                    <td className="p-2 border border-slate-200">1m72 - 1m78</td>
                    <td className="p-2 border border-slate-200">66 - 74kg</td>
                    <td className="p-2 border border-slate-200">95 - 100cm</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold border border-slate-200">XL</td>
                    <td className="p-2 border border-slate-200">1m78 - 1m85</td>
                    <td className="p-2 border border-slate-200">75 - 84kg</td>
                    <td className="p-2 border border-slate-200">101 - 108cm</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-3 text-[11px] text-slate-500">
                Nếu vóc dáng của bạn nằm giữa 2 size, chúng tôi khuyên bạn nên chọn size lớn hơn để có cảm giác thoải mái nhất.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setShowSizeModal(false)}
                className="px-5 py-2 bg-slate-950 text-white rounded-xl text-xs font-bold uppercase"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
