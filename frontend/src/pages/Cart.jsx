import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Truck,
  Tag,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { resolveImageUrl } from '../utils/imageUrl';

export default function Cart() {
  const navigate = useNavigate();
  const {
    cartItems,
    subtotal,
    shippingFee,
    discountAmount,
    totalAmount,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    appliedCoupon,
    removeCoupon,
    FREE_SHIPPING_THRESHOLD,
    isFreeShipping,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  const diffForFreeShip = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShipPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const res = applyCoupon(couponCode);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponCode('');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-28 text-center bg-[#FAF8F5]">
        <div className="w-16 h-16 bg-[#F3EFE6] border border-[#E5E0D8] flex items-center justify-center text-[#8C8476] mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h1 className="font-serif-luxury text-3xl sm:text-4xl font-normal text-[#161514]">
          Túi Đồ Của Quý Khách Đang Trống
        </h1>
        <p className="text-xs sm:text-sm text-[#8C8476] mt-3 max-w-md mx-auto leading-relaxed">
          Chưa có trang phục nào trong danh sách. Kính mời quý khách khám phá bộ sưu tập may đo và trải nghiệm ướm thử tại phòng đo riêng.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/catalog"
            className="btn-noir"
          >
            Khám Phá Cửa Hàng
          </Link>
          <Link
            to="/try-on"
            className="btn-outline-luxury"
          >
            Vào Phòng Ướm Thử
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-[#FAF8F5]">
      {/* Title */}
      <div className="mb-8 pb-4 border-b border-[#E5E0D8] flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-1">
            HAUTE ATELIER &bull; SHOPPING BAG
          </p>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl font-normal text-[#161514] tracking-wide">
            Túi Đồ Của Quý Khách
          </h1>
          <p className="text-xs text-[#8C8476] mt-1">
            Có <strong>{cartItems.length}</strong> thiết kế trong danh sách may đo
          </p>
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-[#8C8476] hover:text-[#C05A39] transition-colors cursor-pointer tracking-wider uppercase text-[11px]"
        >
          Xóa toàn bộ giỏ
        </button>
      </div>

      {/* Free Shipping Alert Box */}
      <div className="mb-8 p-4 bg-[#F7F5F0] border border-[#E5E0D8]">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="flex items-center gap-2 text-[#2A2724]">
            <Truck className="w-4 h-4 text-[#C05A39]" />
            {isFreeShipping ? (
              <span className="text-[#C05A39] font-medium uppercase tracking-wider">
                Đơn hàng của quý khách đủ điều kiện MIỄN PHÍ VẬN CHUYỂN &bull; CHỈNH SIZE TẬN TAY
              </span>
            ) : (
              <span>
                Đặt may thêm <strong className="text-[#161514] font-semibold">{diffForFreeShip.toLocaleString('vi-VN')}₫</strong> để nhận đặc quyền miễn phí giao hàng
              </span>
            )}
          </span>
          <span className="text-[11px] text-[#8C8476]">{freeShipPercent}%</span>
        </div>
        <div className="w-full h-[2px] bg-[#E5E0D8] overflow-hidden">
          <div
            className="h-full bg-[#C05A39] transition-all duration-500"
            style={{ width: `${freeShipPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left 8 Cols: Cart Table */}
        <div className="lg:col-span-8 border border-[#E5E0D8] bg-[#FAF8F5]">
          <div className="p-4 bg-[#F7F5F0] border-b border-[#E5E0D8] text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#6B655D] hidden sm:grid grid-cols-12 gap-4">
            <span className="col-span-6">Thiết Kế</span>
            <span className="col-span-2 text-center">Đơn Giá</span>
            <span className="col-span-2 text-center">Số Lượng</span>
            <span className="col-span-2 text-right">Tổng Cộng</span>
          </div>

          <div className="divide-y divide-[#E5E0D8] p-4 sm:p-6">
            {cartItems.map((item) => (
              <div
                key={item.cartItemId || item.id}
                className="py-5 first:pt-0 last:pb-0 flex flex-col sm:grid sm:grid-cols-12 gap-4 items-center"
              >
                {/* Product Column */}
                <div className="col-span-6 flex items-center gap-4 w-full">
                  <div className="w-20 h-28 bg-[#F3EFE6] border border-[#E5E0D8] overflow-hidden shrink-0">
                    <img
                      src={resolveImageUrl(item.product?.image || item.image)}
                      alt={item.product?.name || item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/samples/cloth-1.jpg';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${item.productId || item.id}`}
                      className="font-serif-luxury text-base text-[#161514] font-normal hover:text-[#C05A39] transition-colors line-clamp-1"
                    >
                      {item.product?.name || item.name}
                    </Link>
                    <div className="mt-1 text-[10.5px] tracking-wider text-[#8C8476] uppercase flex items-center gap-2">
                      <span>Size: <strong className="text-[#161514] font-medium">{item.selectedSize || item.size}</strong></span>
                      {(item.selectedColor || item.color) && (
                        <>
                          <span>&bull;</span>
                          <span>Màu: <strong className="text-[#161514] font-medium">{item.selectedColor || item.color}</strong></span>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cartItemId || item.id)}
                      className="mt-2 text-[10px] tracking-widest uppercase text-[#8C8476] hover:text-[#C05A39] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>

                {/* Price Column */}
                <div className="col-span-2 text-center text-xs font-medium text-[#161514] hidden sm:block">
                  {(item.rawPrice || item.product?.rawPrice || 0).toLocaleString('vi-VN')}₫
                </div>

                {/* Quantity Column */}
                <div className="col-span-2 flex justify-center">
                  <div className="inline-flex items-center border border-[#E5E0D8] bg-[#FAF8F5]">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center text-[#8C8476] hover:text-[#161514] cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-medium text-[#161514]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-[#8C8476] hover:text-[#161514] cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* Item Total Column */}
                <div className="col-span-2 text-right w-full sm:w-auto flex justify-between sm:block">
                  <span className="sm:hidden text-xs text-[#8C8476]">Tổng tiền:</span>
                  <span className="text-sm font-medium text-[#161514]">
                    {((item.rawPrice || item.product?.rawPrice || 0) * item.quantity).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#F7F5F0] border-t border-[#E5E0D8] flex items-center justify-between">
            <Link
              to="/catalog"
              className="text-xs font-medium tracking-wider uppercase text-[#161514] hover:text-[#C05A39] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tiếp tục chọn thiết kế</span>
            </Link>
          </div>
        </div>

        {/* Right 4 Cols: Order Summary & Coupon */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Coupon Box */}
          <div className="p-6 bg-[#FAF8F5] border border-[#E5E0D8]">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#161514] mb-3 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-[#C05A39]" />
              <span>Mã Ưu Đãi Atelier</span>
            </h3>

            {appliedCoupon ? (
              <div className="p-3 bg-[#F7F5F0] border border-[#E5E0D8] flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-[#161514]">{appliedCoupon.code}</p>
                  <p className="text-[11px] text-[#C05A39]">Đã áp dụng giảm {appliedCoupon.discountPercent}%</p>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-xs text-[#8C8476] hover:text-[#C05A39] uppercase tracking-wider"
                >
                  Gỡ bỏ
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Mã quà tặng..."
                  className="flex-1 px-3 py-2 text-xs border border-[#D8D2C5] bg-[#FAF8F5] text-[#161514] focus:outline-none focus:border-[#161514] tracking-widest uppercase"
                />
                <button
                  type="submit"
                  className="btn-noir py-2 px-4 text-xs tracking-wider"
                >
                  Áp Dụng
                </button>
              </form>
            )}

            {couponError && (
              <p className="text-xs text-[#C05A39] mt-2">{couponError}</p>
            )}
          </div>

          {/* Summary Box */}
          <div className="p-6 bg-[#FAF8F5] border border-[#E5E0D8] space-y-4">
            <h3 className="font-serif-luxury text-xl text-[#161514] font-normal pb-3 border-b border-[#E5E0D8]">
              Tóm Tắt Đơn May Đo
            </h3>

            <div className="space-y-2 text-xs text-[#6B655D]">
              <div className="flex justify-between">
                <span>Tạm tính ({cartItems.length} sản phẩm)</span>
                <span className="text-[#161514] font-medium">{subtotal.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển tận tay</span>
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
            </div>

            <div className="pt-3 border-t border-[#E5E0D8] flex items-baseline justify-between text-[#161514]">
              <span className="font-serif-luxury text-base">Tổng giá trị</span>
              <span className="font-serif-luxury text-2xl font-normal">{totalAmount.toLocaleString('vi-VN')}₫</span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="btn-terracotta w-full py-4 text-xs font-semibold tracking-[0.2em] mt-4"
            >
              <span>Tiến Hành Đặt May &bull; Thanh Toán</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
