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
      <div className="w-full max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
          Túi đồ của bạn đang trống
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Chưa có trang phục nào trong giỏ. Hãy khám phá bộ sưu tập may đo và trải nghiệm ướm thử cùng AI ngay bây giờ.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/catalog"
            className="px-6 py-3 rounded-full bg-slate-950 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-900 transition-all shadow-md"
          >
            Khám phá bộ sưu tập
          </Link>
          <Link
            to="/try-on"
            className="px-6 py-3 rounded-full bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-all"
          >
            Vào phòng thử đồ ảo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title */}
      <div className="mb-8 pb-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
            Giỏ Hàng Của Bạn
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Có <strong>{cartItems.length}</strong> sản phẩm trong danh sách
          </p>
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
        >
          Xóa toàn bộ giỏ hàng
        </button>
      </div>

      {/* Free Shipping Alert Box */}
      <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="flex items-center gap-2 text-slate-800">
            <Truck className="w-4 h-4 text-blue-700" />
            {isFreeShipping ? (
              <span className="text-emerald-700 font-bold">
                Đơn hàng của bạn đã đủ điều kiện MIỄN PHÍ VẬN CHUYỂN toàn quốc!
              </span>
            ) : (
              <span>
                Mua thêm <strong className="text-blue-800 font-bold">{diffForFreeShip.toLocaleString('vi-VN')}₫</strong> để được miễn phí vận chuyển
              </span>
            )}
          </span>
          <span className="text-slate-500">{freeShipPercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-700 transition-all duration-500 rounded-full"
            style={{ width: `${freeShipPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left 2 Cols: Cart Table */}
        <div className="lg:col-span-2 border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-2xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600 hidden sm:grid grid-cols-12 gap-4">
            <span className="col-span-6">Sản phẩm</span>
            <span className="col-span-2 text-center">Đơn giá</span>
            <span className="col-span-2 text-center">Số lượng</span>
            <span className="col-span-2 text-right">Tổng cộng</span>
          </div>

          <div className="divide-y divide-slate-100 p-4 sm:p-6">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:grid sm:grid-cols-12 gap-4 items-center"
              >
                {/* Product Column */}
                <div className="col-span-6 flex items-center gap-3.5 w-full">
                  <div className="w-20 h-26 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={resolveImageUrl(item.product.image)}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/samples/cloth-1.jpg';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${item.productId}`}
                      className="text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-800 transition-colors line-clamp-2"
                    >
                      {item.product.name}
                    </Link>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span>Size: <strong>{item.size}</strong></span>
                      <span>&bull;</span>
                      <span>Màu: <strong>{item.color}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="mt-2 text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>

                {/* Price Column */}
                <div className="col-span-2 text-center text-xs font-semibold text-slate-700 hidden sm:block">
                  {(item.product.rawPrice || 0).toLocaleString('vi-VN')}₫
                </div>

                {/* Quantity Column */}
                <div className="col-span-2 flex justify-center">
                  <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-950 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-950 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Item Total Column */}
                <div className="col-span-2 text-right w-full sm:w-auto flex justify-between sm:block">
                  <span className="sm:hidden text-xs text-slate-500">Tổng tiền:</span>
                  <span className="text-xs sm:text-sm font-extrabold text-blue-900">
                    {((item.product.rawPrice || 0) * item.quantity).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <Link
              to="/catalog"
              className="text-xs font-bold text-slate-700 hover:text-slate-950 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tiếp tục mua sắm</span>
            </Link>
          </div>
        </div>

        {/* Right Col: Order Summary & Coupon */}
        <div className="flex flex-col gap-6">
          {/* Coupon Box */}
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-800" />
              <span>Mã Ưu Đãi / Khuyến Mãi</span>
            </h3>

            {appliedCoupon ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{appliedCoupon.code}</span>
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">{appliedCoupon.description}</p>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  Gỡ bỏ
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập ATELIER10 hoặc FREESHIP"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase focus:outline-none focus:border-slate-950"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-950 hover:bg-blue-900 text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Áp dụng
                </button>
              </form>
            )}

            {couponError && (
              <p className="text-xs text-rose-600 mt-2 font-medium">{couponError}</p>
            )}
          </div>

          {/* Order Summary Box */}
          <div className="p-6 bg-slate-50/70 border border-slate-200 rounded-3xl flex flex-col gap-3.5 shadow-2xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950 pb-3 border-b border-slate-200">
              Tóm Tắt Đơn Hàng
            </h3>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Tạm tính hàng hóa:</span>
              <span className="font-semibold text-slate-900">
                {subtotal.toLocaleString('vi-VN')}₫
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-rose-600">
                <span>Giảm giá khuyến mãi:</span>
                <span className="font-semibold">
                  -{discountAmount.toLocaleString('vi-VN')}₫
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Phí vận chuyển:</span>
              <span className="font-semibold text-slate-900">
                {shippingFee === 0 ? (
                  <span className="text-emerald-700 font-bold">Miễn phí</span>
                ) : (
                  `${shippingFee.toLocaleString('vi-VN')}₫`
                )}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-950">Tổng thanh toán:</span>
              <span className="text-xl font-extrabold text-blue-900">
                {totalAmount.toLocaleString('vi-VN')}₫
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="mt-3 w-full py-4 rounded-2xl bg-slate-950 hover:bg-blue-900 text-white text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-slate-950/20 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Tiến Hành Đặt Hàng</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
