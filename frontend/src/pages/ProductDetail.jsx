import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
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
  Compass,
} from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import ProductCard from '../components/common/ProductCard';
import { resolveImageUrl } from '../utils/imageUrl';
import { enrichProduct } from '../utils/productEnricher';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [enriched, setEnriched] = useState(null);
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
        const enrichedProd = enrichProduct(prod);
        setEnriched(enrichedProd);
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
      <div className="w-full max-w-7xl mx-auto px-4 py-28 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border border-[#E5E0D8] border-t-[#C05A39] animate-spin" />
        <p className="text-xs text-[#8C8476] tracking-widest uppercase mt-4">Đang truy xuất thông số may đo...</p>
      </div>
    );
  }

  if (!product || !enriched) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-28 text-center">
        <h2 className="font-serif-luxury text-2xl text-[#161514]">Không tìm thấy thiết kế</h2>
        <p className="text-xs text-[#8C8476] mt-2">Mẫu trang phục có thể đã ngừng lưu trữ hoặc đường dẫn không hợp lệ.</p>
        <Link
          to="/catalog"
          className="btn-noir mt-6"
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10.5px] tracking-[0.18em] uppercase text-[#8C8476] mb-10 font-medium">
        <Link to="/" className="hover:text-[#161514] transition-colors">
          Trang Chủ
        </Link>
        <span>/</span>
        <Link to="/catalog" className="hover:text-[#161514] transition-colors">
          Bộ Sưu Tập
        </Link>
        <span>/</span>
        <Link
          to={`/catalog?category=${product.category}`}
          className="hover:text-[#161514] transition-colors"
        >
          {product.category === 'upper' ? 'Áo & Tops' : product.category === 'lower' ? 'Quần & Váy' : 'Đầm & Outerwear'}
        </Link>
        <span>/</span>
        <span className="text-[#161514] font-semibold truncate max-w-[200px] sm:max-w-none">
          {product.name}
        </span>
      </nav>

      {/* 2. Main Product Showcase (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        
        {/* Left: Gallery Column (Col 1-7) */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          
          {/* Thumbnails */}
          {product.gallery && product.gallery.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto max-h-[560px] pb-2 sm:pb-0">
              {product.gallery.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-28 overflow-hidden border shrink-0 transition-all cursor-pointer ${
                    selectedImage === img ? 'border-[#161514] opacity-100' : 'border-[#E5E0D8] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={resolveImageUrl(img)}
                    alt={`${product.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/samples/cloth-1.jpg';
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Stage Image (3:4 Editorial Portrait) */}
          <div className="flex-1 relative aspect-[3/4] bg-[#F3EFE6] border border-[#E5E0D8] overflow-hidden">
            <img
              src={resolveImageUrl(selectedImage || product.image)}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/samples/cloth-1.jpg';
              }}
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none">
              {product.badge && (
                <span className="text-[9.5px] font-semibold tracking-[0.2em] uppercase px-3 py-1 bg-[#161514] text-[#FAF8F5]">
                  {product.badge}
                </span>
              )}
              {product.discountPercent > 0 && (
                <span className="text-[9.5px] font-semibold tracking-[0.16em] uppercase px-2.5 py-0.5 bg-[#C05A39] text-[#FAF8F5]">
                  -{product.discountPercent}%
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-4 right-4 w-9 h-9 flex items-center justify-center transition-all cursor-pointer ${
                isFavorited
                  ? 'bg-[#FAF8F5] text-[#C05A39] border border-[#E5E0D8]'
                  : 'bg-[#FAF8F5]/80 backdrop-blur-xs text-[#6B655D] hover:bg-[#FAF8F5] hover:text-[#161514] border border-[#E5E0D8]'
              }`}
              title={isFavorited ? 'Xóa khỏi danh sách yêu thích' : 'Lưu thiết kế'}
            >
              <Heart className={`w-4 h-4 stroke-[1.75] ${isFavorited ? 'fill-[#C05A39]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Right: Specifications & Tailoring Notes Column (Col 8-12) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            {/* Atelier Code & Stock Line */}
            <div className="flex items-center justify-between text-[10.5px] tracking-[0.2em] uppercase text-[#8C8476] font-medium mb-3">
              <span>MÃ THIẾT KẾ: {enriched.atelierCode}</span>
              <span className="text-[#C05A39] font-semibold">
                SẴN CỠ MAY ĐO ({product.sizes?.reduce((a, b) => a + b.stock, 0) || 45} CHIẾC)
              </span>
            </div>

            {/* Product Title */}
            <h1 className="font-serif-luxury text-3xl sm:text-4xl font-normal text-[#161514] tracking-wide leading-tight">
              {product.name}
            </h1>

            {/* Editorial Tagline */}
            <p className="text-[11px] font-medium tracking-[0.16em] text-[#8C8476] uppercase mt-2">
              {enriched.editorialTagline}
            </p>

            {/* Price Line */}
            <div className="mt-6 py-4 border-y border-[#E5E0D8] flex items-baseline justify-between">
              <div className="flex items-baseline gap-3">
                <span className="font-serif-luxury text-3xl text-[#161514]">
                  {product.price}
                </span>
                {product.originalPrice && product.originalPrice > product.rawPrice && (
                  <span className="text-sm text-[#8C8476] line-through">
                    {product.originalPrice.toLocaleString('vi-VN')}₫
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-[0.18em] uppercase text-[#8C8476] font-medium">
                ĐÃ GỒM THUẾ VAT &bull; MIỄN PHÍ VẬN CHUYỂN
              </span>
            </div>

            {/* Sensory Short Excerpt */}
            <p className="text-xs sm:text-sm text-[#6B655D] mt-5 leading-relaxed font-normal">
              {enriched.sensoryDescription}
            </p>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-6 pt-5 border-t border-[#E5E0D8]">
                <div className="flex items-center justify-between text-[11px] tracking-[0.16em] uppercase font-medium text-[#161514] mb-3">
                  <span>SẮC THÁI SỢI DỆT: <strong>{selectedColor}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      className={`relative w-8 h-8 border transition-all flex items-center justify-center cursor-pointer ${
                        selectedColor === c.name ? 'ring-1 ring-[#161514] ring-offset-2 border-[#161514]' : 'border-[#D8D2C5]'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {selectedColor === c.name && (
                        <Check className={`w-3.5 h-3.5 ${['#ffffff', '#fdfbf7', '#f5f5f4', '#f5ebe0', '#fef3c7'].includes(c.hex.toLowerCase()) ? 'text-[#161514]' : 'text-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            <div className="mt-6 pt-5 border-t border-[#E5E0D8]">
              <div className="flex items-center justify-between text-[11px] tracking-[0.16em] uppercase font-medium text-[#161514] mb-3">
                <span>CHỌN KÍCH CỠ (SIZE):</span>
                <button
                  type="button"
                  onClick={() => setShowSizeModal(true)}
                  className="flex items-center gap-1 text-[#C05A39] hover:underline cursor-pointer lowercase tracking-normal"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>quy chuẩn size</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                {product.sizes?.map((sz) => (
                  <button
                    key={sz.size}
                    type="button"
                    onClick={() => setSelectedSize(sz.size)}
                    disabled={sz.stock <= 0}
                    className={`py-3 border text-xs font-semibold tracking-wider uppercase transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      selectedSize === sz.size
                        ? 'bg-[#161514] text-[#FAF8F5] border-[#161514]'
                        : sz.stock <= 0
                        ? 'bg-[#F3EFE6] text-[#A8A196] border-[#E5E0D8] cursor-not-allowed'
                        : 'bg-[#FAF8F5] text-[#161514] border-[#E5E0D8] hover:border-[#161514]'
                    }`}
                  >
                    <span>{sz.size}</span>
                    <span className="text-[8.5px] font-normal opacity-70">
                      {sz.stock > 0 ? `Còn ${sz.stock}` : 'Hết hàng'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mt-6 pt-5 border-t border-[#E5E0D8] flex items-center gap-4">
              <span className="text-[11px] tracking-[0.16em] uppercase font-medium text-[#161514]">SỐ LƯỢNG:</span>
              <div className="inline-flex items-center border border-[#E5E0D8] bg-[#FAF8F5]">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center text-[#6B655D] hover:text-[#161514] cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-10 text-center text-xs font-semibold text-[#161514]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-[#6B655D] hover:text-[#161514] cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Action Buttons: Terracotta Fitting Suite CTA */}
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleLaunchTryOn}
                className="btn-terracotta w-full py-4 text-xs font-semibold tracking-[0.2em] cursor-pointer"
              >
                <span>Ướm Thử Thiết Kế Này (Fitting Suite)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="btn-outline-luxury w-full py-3.5 text-xs font-semibold tracking-[0.18em]"
                >
                  <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                  <span>Thêm Vào Túi</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="btn-noir w-full py-3.5 text-xs font-semibold tracking-[0.18em]"
                >
                  <span>Đặt May Ngay</span>
                </button>
              </div>
            </div>

            {/* Trust Assurances */}
            <div className="mt-8 pt-6 border-t border-[#E5E0D8] grid grid-cols-3 gap-3 text-center">
              <div className="flex flex-col items-center">
                <Truck className="w-4 h-4 text-[#8C8476] mb-1.5" />
                <span className="text-[10px] tracking-[0.15em] font-medium uppercase text-[#161514]">Miễn Phí Giao Hàng</span>
                <span className="text-[10px] text-[#8C8476] mt-0.5">Vận chuyển tận nhà</span>
              </div>
              <div className="flex flex-col items-center">
                <RotateCcw className="w-4 h-4 text-[#8C8476] mb-1.5" />
                <span className="text-[10px] tracking-[0.15em] font-medium uppercase text-[#161514]">Đổi Size 30 Ngày</span>
                <span className="text-[10px] text-[#8C8476] mt-0.5">Tận tay miễn phí</span>
              </div>
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-4 h-4 text-[#8C8476] mb-1.5" />
                <span className="text-[10px] tracking-[0.15em] font-medium uppercase text-[#161514]">Sợi Dệt Sinh Thái</span>
                <span className="text-[10px] text-[#8C8476] mt-0.5">Chuẩn OEKO-TEX</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Deep Editorial Craftsmanship & Invisible Details Tabs */}
      <div className="mt-20 border-t border-[#E5E0D8] pt-12">
        <div className="flex items-center gap-8 border-b border-[#E5E0D8] text-xs font-medium uppercase tracking-[0.2em]">
          <button
            type="button"
            onClick={() => setActiveTab('desc')}
            className={`pb-4 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'desc' ? 'border-[#161514] text-[#161514] font-semibold' : 'border-transparent text-[#8C8476] hover:text-[#161514]'
            }`}
          >
            Kỹ Nghệ May Đo &amp; Sợi Dệt
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('care')}
            className={`pb-4 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'care' ? 'border-[#161514] text-[#161514] font-semibold' : 'border-transparent text-[#8C8476] hover:text-[#161514]'
            }`}
          >
            Nghi Thức Bảo Quản Maison
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'reviews' ? 'border-[#161514] text-[#161514] font-semibold' : 'border-transparent text-[#8C8476] hover:text-[#161514]'
            }`}
          >
            Cảm Nhận Của Khách Hàng ({product.reviewsCount || 48})
          </button>
        </div>

        <div className="py-8 max-w-4xl text-xs sm:text-sm leading-relaxed text-[#6B655D]">
          {activeTab === 'desc' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-serif-luxury text-xl text-[#161514] font-normal mb-2">
                  Những Chi Tiết Thủ Công Vô Hình Của Trang Phục
                </h4>
                <p>{enriched.stylistNote}</p>
              </div>

              {/* Bespoke Specifications Table */}
              <div className="border border-[#E5E0D8] bg-[#FAF8F5] divide-y divide-[#E5E0D8] text-xs">
                <div className="grid grid-cols-3 p-3.5">
                  <span className="font-medium text-[#161514] tracking-wider uppercase text-[10.5px]">Thành Phần Sợi Dệt</span>
                  <span className="col-span-2 text-[#2A2724]">{enriched.enrichedFabric.composition} ({enriched.enrichedFabric.origin})</span>
                </div>
                <div className="grid grid-cols-3 p-3.5 bg-[#F7F5F0]">
                  <span className="font-medium text-[#161514] tracking-wider uppercase text-[10.5px]">Cấu Trúc &amp; Trọng Lượng</span>
                  <span className="col-span-2 text-[#2A2724]">{enriched.enrichedFabric.weave} &bull; {enriched.enrichedFabric.weight}</span>
                </div>
                <div className="grid grid-cols-3 p-3.5">
                  <span className="font-medium text-[#161514] tracking-wider uppercase text-[10.5px]">Kỹ Thuật May Đường Sườn</span>
                  <span className="col-span-2 text-[#2A2724]">{enriched.enrichedTailoring.seam}</span>
                </div>
                <div className="grid grid-cols-3 p-3.5 bg-[#F7F5F0]">
                  <span className="font-medium text-[#161514] tracking-wider uppercase text-[10.5px]">Khuy &amp; Chi Tiết Kim Loại</span>
                  <span className="col-span-2 text-[#2A2724]">{enriched.enrichedTailoring.hardware}</span>
                </div>
                <div className="grid grid-cols-3 p-3.5">
                  <span className="font-medium text-[#161514] tracking-wider uppercase text-[10.5px]">Cấu Trúc Dựng Phom</span>
                  <span className="col-span-2 text-[#2A2724]">{enriched.enrichedTailoring.collar}</span>
                </div>
                <div className="grid grid-cols-3 p-3.5 bg-[#F7F5F0]">
                  <span className="font-medium text-[#161514] tracking-wider uppercase text-[10.5px]">Lớp Lót Trong</span>
                  <span className="col-span-2 text-[#2A2724]">{enriched.enrichedTailoring.lining}</span>
                </div>
                <div className="grid grid-cols-3 p-3.5">
                  <span className="font-medium text-[#161514] tracking-wider uppercase text-[10.5px]">Tiêu Chuẩn Kiểm Định</span>
                  <span className="col-span-2 text-[#2A2724]">{enriched.certifications.join(' · ')}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'care' && (
            <div className="space-y-4">
              <h4 className="font-serif-luxury text-xl text-[#161514] font-normal mb-2">
                Nghi Thức Giữ Gìn &amp; Chăm Sóc Sợi Vải Tự Nhiên
              </h4>
              <p>
                Trang phục may đo từ sợi thiên nhiên mang vẻ đẹp sống động và bền bỉ khi được chăm sóc với những nghi thức chuẩn mực:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-[#6B655D]">
                {enriched.careRitual.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {[
                { name: 'Nguyễn Hoàng Minh', date: 'Tháng 10, 2026', comment: 'Chất vải mát mịn, đường may French seam bên trong sạch sẽ không một sợi chỉ thừa. Ướm thử trên phòng đo thấy chuẩn vóc dáng nên tôi đặt luôn, nhận áo mặc vừa vặn như may đo tại tiệm.', rating: 5 },
                { name: 'Trần Thu Thảo', date: 'Tháng 10, 2026', comment: 'Sắc thái màu cát rất trang nhã đúng như ảnh. Đóng gói hộp cứng rất thơm và sang trọng.', rating: 5 },
              ].map((rev, i) => (
                <div key={i} className="p-5 border border-[#E5E0D8] bg-[#FAF8F5]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-serif-luxury text-base text-[#161514]">{rev.name}</span>
                    <span className="text-[10.5px] tracking-wider text-[#8C8476]">{rev.date}</span>
                  </div>
                  <div className="flex text-[#C05A39] text-xs mb-2">
                    {'★'.repeat(rev.rating)}
                  </div>
                  <p className="text-[#6B655D] text-xs leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Related Products Grid */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 border-t border-[#E5E0D8] pt-12">
          <div className="mb-8">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-1">
              GỢI Ý TỪ STYLIST
            </p>
            <h2 className="font-serif-luxury text-2xl sm:text-3xl font-normal text-[#161514]">
              Những Thiết Kế Đồng Điệu Cùng Phong Cách
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* 5. Size Guide Modal */}
      {showSizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#161514]/70 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] max-w-lg w-full p-8 border border-[#E5E0D8] shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
              <h3 className="font-serif-luxury text-xl font-normal text-[#161514] flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[#C05A39]" />
                <span>Quy Chuẩn Đo Vóc Dáng Của Maison</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSizeModal(false)}
                className="p-1 text-[#8C8476] hover:text-[#161514]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 text-xs text-[#6B655D]">
              <table className="w-full text-left border-collapse border border-[#E5E0D8]">
                <thead>
                  <tr className="bg-[#F7F5F0] text-[#161514] font-medium tracking-wider text-[11px] uppercase">
                    <th className="p-2.5 border border-[#E5E0D8]">Size</th>
                    <th className="p-2.5 border border-[#E5E0D8]">Chiều cao</th>
                    <th className="p-2.5 border border-[#E5E0D8]">Cân nặng</th>
                    <th className="p-2.5 border border-[#E5E0D8]">Vòng ngực</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D8]">
                  <tr>
                    <td className="p-2.5 font-medium border border-[#E5E0D8]">S</td>
                    <td className="p-2.5 border border-[#E5E0D8]">1m55 - 1m65</td>
                    <td className="p-2.5 border border-[#E5E0D8]">48 - 56kg</td>
                    <td className="p-2.5 border border-[#E5E0D8]">84 - 88cm</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium border border-[#E5E0D8]">M</td>
                    <td className="p-2.5 border border-[#E5E0D8]">1m65 - 1m72</td>
                    <td className="p-2.5 border border-[#E5E0D8]">57 - 65kg</td>
                    <td className="p-2.5 border border-[#E5E0D8]">89 - 94cm</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium border border-[#E5E0D8]">L</td>
                    <td className="p-2.5 border border-[#E5E0D8]">1m72 - 1m78</td>
                    <td className="p-2.5 border border-[#E5E0D8]">66 - 74kg</td>
                    <td className="p-2.5 border border-[#E5E0D8]">95 - 100cm</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium border border-[#E5E0D8]">XL</td>
                    <td className="p-2.5 border border-[#E5E0D8]">1m78 - 1m85</td>
                    <td className="p-2.5 border border-[#E5E0D8]">75 - 84kg</td>
                    <td className="p-2.5 border border-[#E5E0D8]">101 - 108cm</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-4 text-[11px] text-[#8C8476] leading-relaxed">
                Đặc quyền may đo: Nếu vóc dáng của quý khách cần căn chỉnh lai gấu hoặc vai áo, Concierge của chúng tôi sẽ hỗ trợ điều chỉnh hoàn toàn miễn phí tại showroom.
              </p>
            </div>

            <div className="pt-4 border-t border-[#E5E0D8] text-right">
              <button
                type="button"
                onClick={() => setShowSizeModal(false)}
                className="btn-noir py-2 px-6 text-xs"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
