import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { resolveImageUrl } from '../../utils/imageUrl';

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    cartItems,
    isCartOpen,
    closeCart,
    totalItemsCount,
    subtotal,
    shippingFee,
    discountAmount,
    totalAmount,
    updateQuantity,
    removeFromCart,
    FREE_SHIPPING_THRESHOLD,
    isFreeShipping,
  } = useCart();

  if (!isCartOpen) return null;

  const diffForFreeShip = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShipPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  const handleCheckoutClick = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#161514]/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] shadow-2xl flex flex-col border-l border-[#E5E0D8]">
          
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-[#E5E0D8] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 text-[#C05A39]" />
              <h2 className="font-serif-luxury text-xl text-[#161514] font-normal tracking-wide">
                Túi Đồ May Đo ({totalItemsCount})
              </h2>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="w-8 h-8 flex items-center justify-center text-[#8C8476] hover:text-[#161514] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Complimentary Delivery Indicator */}
          <div className="px-6 py-3.5 bg-[#F7F5F0] border-b border-[#E5E0D8]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[11px] text-[#6B655D]">
                {isFreeShipping ? (
                  <span className="text-[#C05A39] font-medium uppercase tracking-wider">Đạt Tiêu Chuẩn Miễn Phí Vận Chuyển Tận Tay</span>
                ) : (
                  <span>
                    Đặt thêm <strong className="text-[#161514] font-semibold">{diffForFreeShip.toLocaleString('vi-VN')}₫</strong> để freeship
                  </span>
                )}
              </span>
              <span className="text-[10px] text-[#8C8476]">{freeShipPercent}%</span>
            </div>
            <div className="w-full h-[2px] bg-[#E5E0D8] overflow-hidden">
              <div
                className="h-full bg-[#C05A39] transition-all duration-500"
                style={{ width: `${freeShipPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#E5E0D8]">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-14 h-14 bg-[#F3EFE6] border border-[#E5E0D8] flex items-center justify-center text-[#8C8476] mb-4">
                  <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="font-serif-luxury text-xl text-[#161514]">Túi đồ của quý khách đang trống</h3>
                <p className="text-xs text-[#8C8476] mt-2 max-w-[240px] leading-relaxed">
                  Khám phá các thiết kế may đo đương đại và trải nghiệm ướm thử tại phòng đo riêng.
                </p>
                <Link
                  to="/catalog"
                  onClick={closeCart}
                  className="btn-noir mt-6"
                >
                  Khám Phá Cửa Hàng
                </Link>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.cartItemId} className="py-4 flex gap-4">
                  {/* Item Image */}
                  <div className="w-18 h-24 bg-[#F3EFE6] border border-[#E5E0D8] shrink-0 overflow-hidden">
                    <img
                      src={resolveImageUrl(item.image)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/samples/cloth-1.jpg';
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/products/${item.id}`}
                          onClick={closeCart}
                          className="font-serif-luxury text-base text-[#161514] font-normal hover:text-[#C05A39] transition-colors line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="text-[#A8A196] hover:text-[#C05A39] transition-colors p-0.5"
                          title="Xóa khỏi túi đồ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[10.5px] tracking-wider text-[#8C8476] uppercase mt-1 flex items-center gap-2">
                        <span>Size: <strong className="text-[#161514] font-medium">{item.selectedSize}</strong></span>
                        {item.selectedColor && (
                          <>
                            <span>&bull;</span>
                            <span>Màu: <strong className="text-[#161514] font-medium">{item.selectedColor}</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#E5E0D8]">
                      {/* Quantity stepper */}
                      <div className="inline-flex items-center border border-[#E5E0D8] bg-[#FAF8F5]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-[#8C8476] hover:text-[#161514]"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-medium text-[#161514]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-[#8C8476] hover:text-[#161514]"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      {/* Line Price */}
                      <span className="font-medium text-xs text-[#161514]">
                        {(item.rawPrice * item.quantity).toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-[#E5E0D8] bg-[#FAF8F5] space-y-3">
              <div className="space-y-1.5 text-xs text-[#6B655D]">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="text-[#161514] font-medium">{subtotal.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển tận nơi</span>
                  <span className="text-[#161514] font-medium">
                    {shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')}₫`}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#C05A39]">
                    <span>Ưu đãi áp dụng</span>
                    <span>-{discountAmount.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                <div className="flex justify-between pt-2.5 border-t border-[#E5E0D8] text-sm font-semibold text-[#161514]">
                  <span className="font-serif-luxury text-base">Tổng giá trị đơn</span>
                  <span className="font-serif-luxury text-lg">{totalAmount.toLocaleString('vi-VN')}₫</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  className="btn-terracotta w-full py-3.5 text-xs font-semibold tracking-[0.2em]"
                >
                  <span>Tiến Hành Đặt May &bull; Thanh Toán</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <Link
                  to="/cart"
                  onClick={closeCart}
                  className="btn-outline-luxury w-full py-3 text-xs font-semibold tracking-[0.18em]"
                >
                  Xem Chi Tiết Giỏ Hàng
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
