import { useLocation, useParams, Link } from 'react-router-dom';
import { Package, ArrowRight, Home, Calendar, MapPin, CreditCard, Check } from 'lucide-react';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const location = useLocation();
  const order = location.state?.order || {
    id: orderId || 'ORD-894210',
    createdAt: new Date().toISOString(),
    customer: {
      fullName: 'Nguyễn Văn An',
      phone: '0912345678',
      address: 'Số 18 Nguyễn Du, Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội',
    },
    paymentMethod: 'COD',
    totalAmount: 489000,
    estimatedDelivery: '2 - 3 ngày làm việc',
    items: [],
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
      {/* Seal Icon */}
      <div className="w-14 h-14 bg-[#161514] text-[#FAF8F5] flex items-center justify-center mx-auto mb-6 border border-[#9E7A52]">
        <Check className="w-6 h-6 stroke-[1.5]" />
      </div>

      <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-1.5">
        GRAND ATELIER &bull; XÁC NHẬN ĐƠN HÀNG
      </p>

      <h1 className="font-serif-luxury text-3xl sm:text-4xl font-normal text-[#161514] tracking-wide">
        Đặt Hàng Thành Công
      </h1>

      <p className="text-xs text-[#6B655D] mt-2.5 max-w-md mx-auto leading-relaxed">
        Cảm ơn quý khách đã mua sắm tại Grand Atelier Central. Đơn hàng đã được ghi nhận và đang được chuẩn bị để bàn giao cho đơn vị vận chuyển.
      </p>

      {/* Order Info Card */}
      <div className="mt-10 p-8 bg-[#FAF8F5] border border-[#E5E0D8] text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E5E0D8] gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C8476] font-semibold">
              Mã đơn hàng
            </span>
            <p className="font-mono text-base font-semibold text-[#161514] mt-0.5 tracking-wider">
              {order.orderNumber || order.id}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C8476] font-semibold">
              Thời gian đặt hàng
            </span>
            <p className="text-xs text-[#161514] mt-0.5">
              {new Date(order.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="py-6 border-b border-[#E5E0D8] grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-[#C05A39] shrink-0 mt-0.5 stroke-[1.5]" />
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#161514]">
                Địa chỉ nhận hàng
              </p>
              <p className="text-[#6B655D] mt-1 font-medium">{order.customer?.fullName} &bull; {order.customer?.phone}</p>
              <p className="text-[#8C8476] mt-0.5 leading-relaxed">{order.customer?.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CreditCard className="w-4 h-4 text-[#C05A39] shrink-0 mt-0.5 stroke-[1.5]" />
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#161514]">
                Phương thức thanh toán
              </p>
              <p className="text-[#6B655D] mt-1">
                {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản VietQR' : 'Cổng VNPAY-QR'}
              </p>
              <p className="font-serif-luxury text-xl text-[#161514] mt-1.5 font-normal">
                {(order.totalAmount || 0).toLocaleString('vi-VN')}₫
              </p>
            </div>
          </div>
        </div>

        {/* Estimated Delivery */}
        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
          <span className="flex items-center gap-2 text-[#6B655D]">
            <Calendar className="w-4 h-4 text-[#C05A39] stroke-[1.5]" />
            <span>Thời gian giao hàng dự kiến:</span>
          </span>
          <span className="font-medium text-[#161514] tracking-wide">
            {order.estimatedDelivery || 'Trong vòng 2 - 3 ngày làm việc'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
        <Link
          to="/orders"
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#C05A39] hover:bg-[#A64B2E] text-[#FAF8F5] text-xs font-medium tracking-[0.2em] uppercase transition-all cursor-pointer"
        >
          <Package className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>Theo Dõi Đơn Hàng</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
        </Link>

        <Link
          to="/catalog"
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#FAF8F5] hover:bg-[#FFFFFF] text-[#161514] text-xs font-medium tracking-[0.2em] uppercase border border-[#161514] transition-all cursor-pointer"
        >
          <Home className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>Tiếp Tục Mua Sắm</span>
        </Link>
      </div>
    </div>
  );
}
