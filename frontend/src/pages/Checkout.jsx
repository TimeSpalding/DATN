import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  QrCode,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../services/orderService';

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    subtotal,
    shippingFee,
    discountAmount,
    totalAmount,
    clearCart,
    showToast,
  } = useCart();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || 'Nguyễn Văn An',
    phone: '0912345678',
    email: user?.email || 'an.nguyen@example.com',
    city: 'Hà Nội',
    district: 'Quận Hoàn Kiếm',
    address: 'Số 18, Phố Nguyễn Du, Phường Hàng Bài',
    notes: 'Giao trong giờ hành chính, gọi trước khi đến',
  });

  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('COD'); // COD | BANK_TRANSFER | VNPAY
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  if (cartItems.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-24 text-center">
        <h2 className="text-lg font-bold text-slate-900">Giỏ hàng của bạn đang trống</h2>
        <p className="text-xs text-slate-500 mt-2">Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.</p>
        <Link
          to="/catalog"
          className="mt-6 inline-flex px-6 py-2.5 bg-slate-950 text-white text-xs font-bold uppercase rounded-full"
        >
          Đến cửa hàng
        </Link>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Vui lòng nhập họ tên người nhận';
    if (!formData.phone.trim()) errors.phone = 'Vui lòng nhập số điện thoại';
    if (!formData.address.trim()) errors.address = 'Vui lòng nhập địa chỉ nhận hàng';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await orderService.createOrder({
        customer: formData,
        items: cartItems,
        shippingMethod,
        paymentMethod,
        subtotal,
        shippingFee: shippingMethod === 'express' ? shippingFee + 20000 : shippingFee,
        discountAmount,
        totalAmount: shippingMethod === 'express' ? totalAmount + 20000 : totalAmount,
        notes: formData.notes,
      });

      if (result?.success && result?.data) {
        clearCart();
        showToast('Đặt hàng thành công! Đơn hàng đang được đóng gói.');
        navigate(`/order-success/${result.data.id}`, { state: { order: result.data } });
      }
    } catch (err) {
      console.error('Order error', err);
      showToast('Có lỗi xảy ra khi tạo đơn hàng, vui lòng thử lại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalTotal = shippingMethod === 'express' ? totalAmount + 20000 : totalAmount;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title */}
      <div className="mb-8 pb-4 border-b border-slate-200">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
          Thanh Toán Đơn Hàng
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Vui lòng hoàn tất thông tin nhận hàng và chọn phương thức thanh toán an toàn
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column (Inputs): 7 cols */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* 1. Customer Information */}
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-2xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-950 text-white text-[10px] flex items-center justify-center font-bold">1</span>
              <span>Thông Tin Người Nhận</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none ${
                    formErrors.fullName ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-slate-950'
                  }`}
                  placeholder="Ví dụ: Nguyễn Văn An"
                />
                {formErrors.fullName && <p className="text-[11px] text-rose-600 mt-1">{formErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none ${
                    formErrors.phone ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-slate-950'
                  }`}
                  placeholder="Ví dụ: 0912345678"
                />
                {formErrors.phone && <p className="text-[11px] text-rose-600 mt-1">{formErrors.phone}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ Email (Nhận thông báo đơn hàng)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-slate-950"
                  placeholder="Ví dụ: email@domain.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tỉnh / Thành phố
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quận / Huyện
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-slate-950"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ chi tiết (Số nhà, tên đường, tòa nhà) *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none ${
                    formErrors.address ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-slate-950'
                  }`}
                  placeholder="Ví dụ: Số 18 Nguyễn Du, Phường Hàng Bài"
                />
                {formErrors.address && <p className="text-[11px] text-rose-600 mt-1">{formErrors.address}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú đơn hàng (Tùy chọn)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-slate-950 resize-none"
                  placeholder="Ghi chú thêm về thời gian giao hàng, hướng dẫn chỉ đường..."
                />
              </div>
            </div>
          </div>

          {/* 2. Shipping Methods */}
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-2xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-950 text-white text-[10px] flex items-center justify-center font-bold">2</span>
              <span>Phương Thức Vận Chuyển</span>
            </h2>

            <div className="space-y-3">
              <label
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  shippingMethod === 'standard' ? 'border-slate-950 bg-slate-50 shadow-2xs' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    value="standard"
                    checked={shippingMethod === 'standard'}
                    onChange={() => setShippingMethod('standard')}
                    className="accent-slate-950"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Giao hàng tiêu chuẩn (VNPost / Viettel Post)</p>
                    <p className="text-[11px] text-slate-500">Thời gian nhận hàng dự kiến: 2 - 3 ngày làm việc</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {shippingFee === 0 ? <span className="text-emerald-700">Miễn phí</span> : `${shippingFee.toLocaleString('vi-VN')}₫`}
                </span>
              </label>

              <label
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  shippingMethod === 'express' ? 'border-slate-950 bg-slate-50 shadow-2xs' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    value="express"
                    checked={shippingMethod === 'express'}
                    onChange={() => setShippingMethod('express')}
                    className="accent-slate-950"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Giao hàng hỏa tốc trong 24h</p>
                    <p className="text-[11px] text-slate-500">Áp dụng nội thành Hà Nội &amp; TP. Hồ Chí Minh</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {((shippingFee === 0 ? 0 : shippingFee) + 20000).toLocaleString('vi-VN')}₫
                </span>
              </label>
            </div>
          </div>

          {/* 3. Payment Methods */}
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-2xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-950 text-white text-[10px] flex items-center justify-center font-bold">3</span>
              <span>Phương Thức Thanh Toán</span>
            </h2>

            <div className="space-y-3">
              {/* COD */}
              <label
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'COD' ? 'border-slate-950 bg-slate-50 shadow-2xs' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="accent-slate-950"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Thanh toán khi nhận hàng (COD)</p>
                    <p className="text-[11px] text-slate-500">Nhận hàng, kiểm tra trang phục trước khi gửi tiền cho shipper</p>
                  </div>
                </div>
                <Truck className="w-4 h-4 text-slate-500" />
              </label>

              {/* VietQR Bank Transfer */}
              <label
                className={`p-4 rounded-2xl border flex flex-col cursor-pointer transition-all ${
                  paymentMethod === 'BANK_TRANSFER' ? 'border-slate-950 bg-slate-50 shadow-2xs' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="BANK_TRANSFER"
                      checked={paymentMethod === 'BANK_TRANSFER'}
                      onChange={() => setPaymentMethod('BANK_TRANSFER')}
                      className="accent-slate-950"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Chuyển khoản ngân hàng 24/7 (VietQR)</p>
                      <p className="text-[11px] text-slate-500">Quét mã QR tự động xác nhận trong 3 giây</p>
                    </div>
                  </div>
                  <QrCode className="w-4 h-4 text-blue-700" />
                </div>

                {paymentMethod === 'BANK_TRANSFER' && (
                  <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-600 bg-white p-3 rounded-xl">
                    <p className="font-semibold text-slate-900">Ngân hàng: TMCP Ngoại Thương Việt Nam (Vietcombank)</p>
                    <p>Số tài khoản: <strong>0011004899999</strong></p>
                    <p>Chủ tài khoản: <strong>CÔNG TY TNHH THỜI TRANG L'ATELIER</strong></p>
                    <p>Nội dung: <strong>LATELIER [Số điện thoại của bạn]</strong></p>
                  </div>
                )}
              </label>

              {/* VNPay Mock */}
              <label
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'VNPAY' ? 'border-slate-950 bg-slate-50 shadow-2xs' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="VNPAY"
                    checked={paymentMethod === 'VNPAY'}
                    onChange={() => setPaymentMethod('VNPAY')}
                    className="accent-slate-950"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Cổng thanh toán điện tử VNPAY-QR</p>
                    <p className="text-[11px] text-slate-500">Hỗ trợ tất cả ứng dụng Mobile Banking &amp; Ví điện tử</p>
                  </div>
                </div>
                <CreditCard className="w-4 h-4 text-blue-700" />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column (Order Summary): 5 cols */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="p-6 bg-slate-50/80 border border-slate-200 rounded-3xl flex flex-col gap-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950 pb-3 border-b border-slate-200 flex items-center justify-between">
              <span>Đơn Hàng Của Bạn</span>
              <span className="text-xs text-slate-500 font-semibold">{cartItems.length} sản phẩm</span>
            </h3>

            {/* Items mini list */}
            <div className="divide-y divide-slate-200 max-h-64 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="py-3 flex items-center gap-3">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-12 h-16 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {item.size} &bull; {item.color} &bull; SL: {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {((item.product.rawPrice || 0) * item.quantity).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="pt-3 border-t border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Tạm tính hàng hóa:</span>
                <span className="font-semibold text-slate-900">{subtotal.toLocaleString('vi-VN')}₫</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Giảm giá khuyến mãi:</span>
                  <span className="font-semibold">-{discountAmount.toLocaleString('vi-VN')}₫</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>
                <span className="font-semibold text-slate-900">
                  {shippingMethod === 'express'
                    ? `${(shippingFee + 20000).toLocaleString('vi-VN')}₫ (Hỏa tốc)`
                    : shippingFee === 0
                    ? <span className="text-emerald-700 font-bold">Miễn phí</span>
                    : `${shippingFee.toLocaleString('vi-VN')}₫`}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-950">Tổng thanh toán:</span>
                <span className="text-xl font-extrabold text-blue-900">
                  {finalTotal.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full py-4 rounded-2xl bg-slate-950 hover:bg-blue-900 text-white text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-slate-950/20 transition-all hover:-translate-y-0.5 cursor-pointer disabled:bg-slate-400"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>{isSubmitting ? 'Đang tạo đơn hàng...' : 'Xác Nhận Đặt Hàng'}</span>
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center mt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Thông tin đơn hàng được mã hóa bảo mật chuẩn SSL 256-bit</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
