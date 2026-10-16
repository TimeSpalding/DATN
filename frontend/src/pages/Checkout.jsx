import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  Lock,
  ArrowRight,
  QrCode,
  Building,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../services/orderService';
import { resolveImageUrl } from '../utils/imageUrl';

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
      <div className="w-full max-w-xl mx-auto px-4 py-28 text-center bg-[#FAF8F5]">
        <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-2">
          LA COMMANDE &bull; BESPOKE SERVICE
        </p>
        <h2 className="font-serif-luxury text-3xl font-normal text-[#161514]">
          Túi Đồ May Đo Đang Trống
        </h2>
        <p className="text-xs text-[#6B655D] mt-2 max-w-sm mx-auto leading-relaxed">
          Quý khách chưa lựa chọn thiết kế nào. Vui lòng khám phá danh mục tuyển chọn để thêm tác phẩm vào túi đồ trước khi tiến hành may đo.
        </p>
        <Link
          to="/catalog"
          className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 bg-[#161514] hover:bg-[#2A2725] text-[#FAF8F5] text-xs font-medium tracking-[0.2em] uppercase transition-all"
        >
          <span>Khám Phá Danh Mục Tuyển Chọn</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
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
    if (!formData.fullName.trim()) errors.fullName = 'Vui lòng cung cấp danh xưng hoặc họ tên';
    if (!formData.phone.trim()) errors.phone = 'Vui lòng cung cấp số điện thoại liên hệ';
    if (!formData.address.trim()) errors.address = 'Vui lòng cung cấp địa chỉ nhận trang phục';
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
        showToast('Đơn đặt may đã được ghi nhận. Maison sẽ liên hệ chuẩn bị trang phục.');
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Title Header */}
      <div className="mb-10 pb-6 border-b border-[#E5E0D8]">
        <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-1.5">
          SERVICE SUR-MESURE &bull; FINALISATION
        </p>
        <h1 className="font-serif-luxury text-3xl sm:text-4xl font-normal text-[#161514] tracking-wide">
          Hoàn Tất Đơn Đặt May &amp; Giao Nhận
        </h1>
        <p className="text-xs text-[#6B655D] mt-2 max-w-xl leading-relaxed">
          Quý khách vui lòng xác nhận thông tin tư gia và nghi thức giao nhận. Đội ngũ L'Atelier sẽ kiểm định từng đường may và đóng gói trang phục theo chuẩn mực boutique.
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column (Inputs): 7 cols */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* I. Thông tin người nhận */}
          <div className="p-7 bg-[#FAF8F5] border border-[#E5E0D8]">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-[#E5E0D8]">
              <span className="font-serif-luxury text-sm font-semibold text-[#C05A39]">I.</span>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#161514]">
                Thông Tin Tư Gia &amp; Người Nhận
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B655D] mb-1.5">
                  Họ và tên quý khách *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 bg-[#FAF8F5] border text-xs text-[#161514] placeholder-[#8C8476] focus:outline-none ${
                    formErrors.fullName ? 'border-[#C05A39]' : 'border-[#D8D2C5] focus:border-[#161514]'
                  }`}
                  placeholder="Ví dụ: Nguyễn Văn An"
                />
                {formErrors.fullName && <p className="text-[10px] text-[#C05A39] mt-1">{formErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B655D] mb-1.5">
                  Số điện thoại liên hệ *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 bg-[#FAF8F5] border text-xs text-[#161514] placeholder-[#8C8476] focus:outline-none ${
                    formErrors.phone ? 'border-[#C05A39]' : 'border-[#D8D2C5] focus:border-[#161514]'
                  }`}
                  placeholder="Ví dụ: 0912345678"
                />
                {formErrors.phone && <p className="text-[10px] text-[#C05A39] mt-1">{formErrors.phone}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B655D] mb-1.5">
                  Thư điện tử (Nhận xác thực đơn hàng &amp; chứng thư vải)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D8D2C5] text-xs text-[#161514] placeholder-[#8C8476] focus:outline-none focus:border-[#161514]"
                  placeholder="Ví dụ: client@domain.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B655D] mb-1.5">
                  Tỉnh / Thành phố
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D8D2C5] text-xs text-[#161514] focus:outline-none focus:border-[#161514]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B655D] mb-1.5">
                  Quận / Huyện
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D8D2C5] text-xs text-[#161514] focus:outline-none focus:border-[#161514]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B655D] mb-1.5">
                  Địa chỉ chi tiết (Số nhà, tòa nhà, căn hộ) *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 bg-[#FAF8F5] border text-xs text-[#161514] placeholder-[#8C8476] focus:outline-none ${
                    formErrors.address ? 'border-[#C05A39]' : 'border-[#D8D2C5] focus:border-[#161514]'
                  }`}
                  placeholder="Ví dụ: Số 18 Nguyễn Du, Phường Hàng Bài"
                />
                {formErrors.address && <p className="text-[10px] text-[#C05A39] mt-1">{formErrors.address}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B655D] mb-1.5">
                  Ghi chú riêng cho nghệ nhân xưởng may (Tùy chọn)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-2 bg-[#FAF8F5] border border-[#D8D2C5] text-xs text-[#161514] placeholder-[#8C8476] focus:outline-none focus:border-[#161514] resize-none"
                  placeholder="Ví dụ: Yêu cầu hộp may đo đặc biệt, hướng dẫn chuông cửa hoặc khung giờ nhận đồ thuận tiện..."
                />
              </div>
            </div>
          </div>

          {/* II. Phương thức giao nhận */}
          <div className="p-7 bg-[#FAF8F5] border border-[#E5E0D8]">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-[#E5E0D8]">
              <span className="font-serif-luxury text-sm font-semibold text-[#C05A39]">II.</span>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#161514]">
                Nghi Thức Vận Chuyển &amp; Giao Nhận
              </h2>
            </div>

            <div className="space-y-3">
              <label
                className={`p-4 border flex items-center justify-between cursor-pointer transition-all ${
                  shippingMethod === 'standard' ? 'border-[#161514] bg-[#F3EFE6]' : 'border-[#E5E0D8] hover:border-[#D8D2C5]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    value="standard"
                    checked={shippingMethod === 'standard'}
                    onChange={() => setShippingMethod('standard')}
                    className="accent-[#161514]"
                  />
                  <div>
                    <p className="text-xs font-medium text-[#161514]">Chuyển phát tiêu chuẩn Maison (2 - 3 ngày làm việc)</p>
                    <p className="text-[11px] text-[#8C8476]">Đóng gói túi vải canvas chống ẩm &amp; móc treo bảo quản</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#161514]">
                  {shippingFee === 0 ? <span className="text-[#C05A39]">Đặc quyền miễn phí</span> : `${shippingFee.toLocaleString('vi-VN')}₫`}
                </span>
              </label>

              <label
                className={`p-4 border flex items-center justify-between cursor-pointer transition-all ${
                  shippingMethod === 'express' ? 'border-[#161514] bg-[#F3EFE6]' : 'border-[#E5E0D8] hover:border-[#D8D2C5]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    value="express"
                    checked={shippingMethod === 'express'}
                    onChange={() => setShippingMethod('express')}
                    className="accent-[#161514]"
                  />
                  <div>
                    <p className="text-xs font-medium text-[#161514]">Chuyển phát đặc phái trong 24 giờ</p>
                    <p className="text-[11px] text-[#8C8476]">Giao tận cửa có hẹn giờ trước &amp; nhân sự kiểm định riêng</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#161514]">
                  {((shippingFee === 0 ? 0 : shippingFee) + 20000).toLocaleString('vi-VN')}₫
                </span>
              </label>
            </div>
          </div>

          {/* III. Phương thức thanh toán */}
          <div className="p-7 bg-[#FAF8F5] border border-[#E5E0D8]">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-[#E5E0D8]">
              <span className="font-serif-luxury text-sm font-semibold text-[#C05A39]">III.</span>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#161514]">
                Phương Thức Thanh Toán
              </h2>
            </div>

            <div className="space-y-3">
              {/* COD */}
              <label
                className={`p-4 border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'COD' ? 'border-[#161514] bg-[#F3EFE6]' : 'border-[#E5E0D8] hover:border-[#D8D2C5]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="accent-[#161514]"
                  />
                  <div>
                    <p className="text-xs font-medium text-[#161514]">Thanh toán khi nhận trang phục (COD)</p>
                    <p className="text-[11px] text-[#8C8476]">Quý khách kiểm tra chất lượng sợi vải và đường may trước khi thanh toán</p>
                  </div>
                </div>
                <Truck className="w-4 h-4 text-[#8C8476] stroke-[1.5]" />
              </label>

              {/* VietQR Bank Transfer */}
              <label
                className={`p-4 border flex flex-col cursor-pointer transition-all ${
                  paymentMethod === 'BANK_TRANSFER' ? 'border-[#161514] bg-[#F3EFE6]' : 'border-[#E5E0D8] hover:border-[#D8D2C5]'
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
                      className="accent-[#161514]"
                    />
                    <div>
                      <p className="text-xs font-medium text-[#161514]">Chuyển khoản trực tiếp xưởng may (VietQR)</p>
                      <p className="text-[11px] text-[#8C8476]">Xác nhận thanh toán tự động qua hệ thống Maison Concierge</p>
                    </div>
                  </div>
                  <QrCode className="w-4 h-4 text-[#C05A39] stroke-[1.5]" />
                </div>

                {paymentMethod === 'BANK_TRANSFER' && (
                  <div className="mt-3 pt-3 border-t border-[#D8D2C5] text-[11px] text-[#6B655D] bg-[#FAF8F5] p-3 border">
                    <p className="font-semibold text-[#161514]">Ngân hàng: TMCP Ngoại Thương Việt Nam (Vietcombank)</p>
                    <p>Số tài khoản: <strong className="text-[#161514]">0011004899999</strong></p>
                    <p>Chủ tài khoản: <strong className="text-[#161514]">GRAND ATELIER CENTRAL CO., LTD</strong></p>
                    <p>Nội dung: <strong className="text-[#C05A39]">ATELIER [Số điện thoại của quý khách]</strong></p>
                  </div>
                )}
              </label>

              {/* VNPAY */}
              <label
                className={`p-4 border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'VNPAY' ? 'border-[#161514] bg-[#F3EFE6]' : 'border-[#E5E0D8] hover:border-[#D8D2C5]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="VNPAY"
                    checked={paymentMethod === 'VNPAY'}
                    onChange={() => setPaymentMethod('VNPAY')}
                    className="accent-[#161514]"
                  />
                  <div>
                    <p className="text-xs font-medium text-[#161514]">Cổng thanh toán thẻ quốc tế &amp; VNPAY-QR</p>
                    <p className="text-[11px] text-[#8C8476]">Chấp nhận thẻ Visa, Mastercard, JCB và ứng dụng ngân hàng</p>
                  </div>
                </div>
                <CreditCard className="w-4 h-4 text-[#C05A39] stroke-[1.5]" />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column (Order Summary): 5 cols */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="p-7 bg-[#FAF8F5] border border-[#E5E0D8] flex flex-col gap-4">
            <div className="pb-3 border-b border-[#E5E0D8] flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#161514]">
                Bản Kê May Đo
              </h3>
              <span className="text-[10px] text-[#8C8476] tracking-wider uppercase">
                {cartItems.length} tác phẩm
              </span>
            </div>

            {/* Items mini list */}
            <div className="divide-y divide-[#E5E0D8] max-h-72 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="py-3 flex items-center gap-3">
                  <img
                    src={resolveImageUrl(item.product.image)}
                    alt={item.product.name}
                    className="w-12 h-16 object-cover bg-[#F3EFE6] border border-[#E5E0D8] shrink-0"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/samples/cloth-1.jpg';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-serif-luxury text-sm font-normal text-[#161514] truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[10px] text-[#8C8476] tracking-wider uppercase mt-0.5">
                      Cỡ: {item.size} &bull; {item.color} &bull; SL: {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[#161514] tracking-wide">
                    {((item.product.rawPrice || 0) * item.quantity).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="pt-4 border-t border-[#E5E0D8] space-y-2.5 text-xs text-[#6B655D]">
              <div className="flex justify-between">
                <span>Tạm tính giá trị tác phẩm:</span>
                <span className="font-medium text-[#161514]">{subtotal.toLocaleString('vi-VN')}₫</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-[#C05A39]">
                  <span>Đặc quyền ưu đãi:</span>
                  <span className="font-medium">-{discountAmount.toLocaleString('vi-VN')}₫</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Nghi thức vận chuyển:</span>
                <span className="font-medium text-[#161514]">
                  {shippingMethod === 'express'
                    ? `${(shippingFee + 20000).toLocaleString('vi-VN')}₫ (Hỏa tốc 24h)`
                    : shippingFee === 0
                    ? <span className="text-[#C05A39] font-medium">Miễn phí</span>
                    : `${shippingFee.toLocaleString('vi-VN')}₫`}
                </span>
              </div>

              <div className="pt-3 border-t border-[#E5E0D8] flex justify-between items-baseline">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#161514]">
                  Tổng giá trị đơn may:
                </span>
                <span className="font-serif-luxury text-2xl font-normal text-[#161514]">
                  {finalTotal.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 w-full py-4 bg-[#C05A39] hover:bg-[#A64B2E] text-[#FAF8F5] text-xs font-medium tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all cursor-pointer disabled:bg-[#D8D2C5]"
            >
              <Lock className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>{isSubmitting ? 'Đang xác nhận đơn hàng...' : 'Xác Nhận Đặt Hàng May Đo'}</span>
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-[#8C8476] tracking-wide text-center mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C05A39] stroke-[1.5]" />
              <span>Thông tin đơn hàng được bảo mật theo quy chuẩn Maison Atelier</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
