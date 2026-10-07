import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Truck } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

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
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-800" />
              <h2 className="text-base font-bold text-slate-900 tracking-wide uppercase">
                Túi Đồ ({totalItemsCount})
              </h2>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Truck className="w-4 h-4 text-blue-700" />
                {isFreeShipping ? (
                  <span className="text-emerald-700 font-bold">Bạn đã được Miễn phí vận chuyển!</span>
                ) : (
                  <span>
                    Mua thêm <strong className="text-blue-700">{diffForFreeShip.toLocaleString('vi-VN')}₫</strong> để freeship
                  </span>
                )}
              </span>
              <span className="text-[11px] text-slate-400">{freeShipPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-700 transition-all duration-500 rounded-full"
                style={{ width: `${freeShipPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-slate-100">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Túi đồ của bạn đang trống</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                  Khám phá các mẫu trang phục mới nhất và ướm thử cùng công nghệ AI.
                </p>
                <Link
                  to="/catalog"
                  onClick={closeCart}
                  className="mt-5 px-5 py-2.5 rounded-full bg-slate-950 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-900 transition-all shadow-xs"
                >
                  Mua sắm ngay
                </Link>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="py-4 flex gap-3.5 items-start group">
                  {/* Thumbnail */}
                  <div className="w-18 h-24 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
                      {item.product.name}
                    </h4>
                    
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>Size: <strong>{item.size}</strong></span>
                      <span>&bull;</span>
                      <span className="truncate">Màu: <strong>{item.color}</strong></span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      {/* Quantity Selector */}
                      <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-950"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-950"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-950">
                          {((item.product.rawPrice || 0) * item.quantity).toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                    title="Xóa khỏi túi đồ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-slate-200 bg-slate-50/50 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Tạm tính:</span>
                <span className="font-semibold text-slate-900">
                  {subtotal.toLocaleString('vi-VN')}₫
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-rose-600">
                  <span>Giảm giá:</span>
                  <span className="font-semibold">
                    -{discountAmount.toLocaleString('vi-VN')}₫
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Phí vận chuyển:</span>
                <span className="font-semibold text-slate-900">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-600 font-bold">Miễn phí</span>
                  ) : (
                    `${shippingFee.toLocaleString('vi-VN')}₫`
                  )}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Tổng cộng:</span>
                <span className="text-base font-extrabold text-blue-900">
                  {totalAmount.toLocaleString('vi-VN')}₫
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <Link
                  to="/cart"
                  onClick={closeCart}
                  className="py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold text-center uppercase tracking-wider transition-colors"
                >
                  Xem giỏ hàng
                </Link>

                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  className="py-3 rounded-xl bg-slate-950 hover:bg-blue-900 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-slate-950/20"
                >
                  <span>Thanh toán</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
