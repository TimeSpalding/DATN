import React from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Home, Calendar, MapPin, CreditCard } from 'lucide-react';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const location = useLocation();
  const order = location.state?.order || {
    id: orderId || 'ORD-894210',
    createdAt: new Date().toISOString(),
    customer: {
      fullName: 'Quý khách',
      phone: '0912345678',
      address: 'Địa chỉ đã đăng ký',
    },
    paymentMethod: 'COD',
    totalAmount: 489000,
    estimatedDelivery: '3 ngày tới',
    items: [],
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
      {/* Success Icon */}
      <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 border border-emerald-200 shadow-sm animate-bounce-in">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-2">
        <span>Giao dịch thành công</span>
      </div>

      <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
        Cảm Ơn Bạn Đã Đặt Hàng!
      </h1>

      <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto">
        Đơn hàng của bạn đã được tiếp nhận và chuyển đến xưởng may đo L'Atelier để đóng gói chuẩn mực.
      </p>

      {/* Order Info Card */}
      <div className="mt-8 p-6 sm:p-8 bg-slate-50 border border-slate-200 rounded-3xl text-left shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-2">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Mã đơn hàng</span>
            <p className="text-lg font-mono font-extrabold text-blue-900">{order.id}</p>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Ngày tạo</span>
            <p className="text-xs font-semibold text-slate-800">
              {new Date(order.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="py-6 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Địa chỉ giao hàng</p>
              <p className="text-slate-600 mt-0.5">{order.customer?.fullName} &bull; {order.customer?.phone}</p>
              <p className="text-slate-500 mt-0.5">{order.customer?.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CreditCard className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Phương thức thanh toán</p>
              <p className="text-slate-600 mt-0.5">
                {order.paymentMethod === 'COD' ? 'Thanh toán tiền mặt khi nhận hàng (COD)' : order.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản VietQR' : 'Cổng VNPay'}
              </p>
              <p className="text-blue-900 font-extrabold text-sm mt-1">
                {(order.totalAmount || 0).toLocaleString('vi-VN')}₫
              </p>
            </div>
          </div>
        </div>

        {/* Estimated Delivery */}
        <div className="pt-6 flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 text-slate-700">
            <Calendar className="w-4 h-4 text-blue-700" />
            <span>Thời gian dự kiến nhận hàng:</span>
          </span>
          <span className="font-bold text-slate-900">{order.estimatedDelivery || 'Trong vòng 2 - 3 ngày'}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
        <Link
          to="/orders"
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-slate-950 hover:bg-blue-900 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md"
        >
          <Package className="w-4 h-4" />
          <span>Theo dõi đơn hàng của tôi</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        <Link
          to="/catalog"
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Tiếp tục mua sắm</span>
        </Link>
      </div>
    </div>
  );
}
