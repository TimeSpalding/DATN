import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, Check, Truck, XCircle, ArrowRight, Eye, RefreshCw, X } from 'lucide-react';
import { orderService } from '../services/orderService';
import { useCart } from '../contexts/CartContext';
import { resolveImageUrl } from '../utils/imageUrl';

export default function Orders() {
  const { showToast } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getOrders();
      setOrders(res?.data || []);
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Quý khách có chắc chắn muốn hủy đơn đặt may ${orderId}?`)) return;
    try {
      await orderService.cancelOrder(orderId);
      showToast('Đã hủy đơn đặt may thành công', 'info');
      fetchOrders();
    } catch {
      showToast('Không thể hủy đơn đặt may này', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#161514] bg-[#161514] text-[#FAF8F5] text-[10px] font-medium tracking-widest uppercase">
            <Check className="w-3 h-3 stroke-[2]" />
            <span>Đã Giao Tư Gia</span>
          </span>
        );
      case 'shipping':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#C05A39] bg-[#C05A39]/10 text-[#C05A39] text-[10px] font-medium tracking-widest uppercase">
            <Truck className="w-3 h-3 stroke-[1.5]" />
            <span>Đang Chuyển Phát</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#9E7A52] bg-[#9E7A52]/10 text-[#9E7A52] text-[10px] font-medium tracking-widest uppercase">
            <RefreshCw className="w-3 h-3 animate-spin stroke-[1.5]" />
            <span>Xưởng Đang Hoàn Thiện</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#D8D2C5] bg-[#FAF8F5] text-[#8C8476] text-[10px] font-medium tracking-widest uppercase">
            <XCircle className="w-3 h-3 stroke-[1.5]" />
            <span>Đã Hủy</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#D8D2C5] bg-[#F3EFE6] text-[#6B655D] text-[10px] font-medium tracking-widest uppercase">
            <Clock className="w-3 h-3 stroke-[1.5]" />
            <span>Chờ Xác Nhận</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Title Header */}
      <div className="mb-10 pb-6 border-b border-[#E5E0D8] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-1.5">
            L'ARCHIVE DES COMMANDES &bull; SUIVI BESPOKE
          </p>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl font-normal text-[#161514] tracking-wide">
            Nhật Ký May Đo &amp; Đơn Hàng Của Quý Khách
          </h1>
          <p className="text-xs text-[#6B655D] mt-2 max-w-xl leading-relaxed">
            Theo dõi tiến trình kiểm định vải, hoàn thiện đường may và hành trình chuyển phát tới tư gia.
          </p>
        </div>

        <Link
          to="/catalog"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#161514] hover:text-[#C05A39] tracking-wider uppercase transition-colors"
        >
          <span>Khám phá thêm tác phẩm</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
        </Link>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border border-[#161514] border-t-transparent animate-spin" />
          <span className="text-[11px] uppercase tracking-widest text-[#8C8476]">Đang tải dữ liệu may đo...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-16 text-center bg-[#FAF8F5] border border-[#E5E0D8] max-w-lg mx-auto">
          <Package className="w-10 h-10 text-[#8C8476] mx-auto mb-4 stroke-[1.25]" />
          <h3 className="font-serif-luxury text-2xl font-normal text-[#161514]">
            Chưa Có Đơn May Đo Nào
          </h3>
          <p className="text-xs text-[#6B655D] mt-2 leading-relaxed">
            Quý khách chưa tạo đơn hàng nào. Hãy khám phá bộ sưu tập may đo và trải nghiệm phòng ướm thử tư gia trực tuyến.
          </p>
          <Link
            to="/catalog"
            className="mt-6 inline-flex px-8 py-3.5 bg-[#161514] hover:bg-[#2A2725] text-[#FAF8F5] text-xs font-medium tracking-[0.2em] uppercase transition-all"
          >
            Khám Phá Bộ Sưu Tập
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-7 bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#161514] transition-all duration-300"
            >
              {/* Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E0D8] gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#F3EFE6] border border-[#E5E0D8] flex items-center justify-center text-[#161514]">
                    <Package className="w-4 h-4 stroke-[1.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-[#161514] tracking-wider">
                      {order.id}
                    </span>
                    <p className="text-[10px] text-[#8C8476] tracking-wider uppercase mt-0.5">
                      Thời điểm đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {getStatusBadge(order.status)}
                  <span className="font-serif-luxury text-xl font-normal text-[#161514]">
                    {(order.totalAmount || 0).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="py-5 space-y-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img
                      src={resolveImageUrl(item.image)}
                      alt={item.name}
                      className="w-14 h-18 object-cover bg-[#F3EFE6] border border-[#E5E0D8] shrink-0"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/samples/cloth-1.jpg';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-serif-luxury text-base font-normal text-[#161514] truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-[#8C8476] tracking-wider uppercase mt-1">
                        Cỡ: {item.size} &bull; {item.color} &bull; Số lượng: {item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-[#161514] tracking-wide">
                      {((item.price || 0) * item.quantity).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress Step Bar */}
              {order.status !== 'cancelled' && (
                <div className="pt-5 border-t border-[#E5E0D8]">
                  <div className="grid grid-cols-4 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-[#8C8476]">
                    <span className="text-[#161514] font-semibold">I. Đã Ghi Nhận</span>
                    <span className={['processing', 'shipping', 'delivered'].includes(order.status) ? 'text-[#161514] font-semibold' : ''}>
                      II. Chuẩn Bị Vải
                    </span>
                    <span className={['shipping', 'delivered'].includes(order.status) ? 'text-[#161514] font-semibold' : ''}>
                      III. Chuyển Phát
                    </span>
                    <span className={order.status === 'delivered' ? 'text-[#C05A39] font-semibold' : ''}>
                      IV. Đã Giao Tư Gia
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#E5E0D8] mt-3 overflow-hidden flex">
                    <div
                      className={`h-full bg-[#161514] transition-all duration-500 ${
                        order.status === 'delivered'
                          ? 'w-full bg-[#C05A39]'
                          : order.status === 'shipping'
                          ? 'w-3/4'
                          : order.status === 'processing'
                          ? 'w-2/4'
                          : 'w-1/4'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="mt-5 pt-4 border-t border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
                <span className="text-[10.5px] text-[#8C8476] tracking-wider uppercase">
                  Mã kiện hàng: <strong className="text-[#161514] font-mono">{order.trackingNumber || 'Đang cấp mã vận đơn'}</strong>
                </span>

                <div className="flex items-center gap-3">
                  {order.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleCancelOrder(order.id)}
                      className="text-xs text-[#C05A39] hover:underline cursor-pointer tracking-wider uppercase font-medium"
                    >
                      Hủy đơn may
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="px-4 py-2 border border-[#161514] text-[#161514] hover:bg-[#161514] hover:text-[#FAF8F5] text-[10.5px] font-medium tracking-widest uppercase transition-all cursor-pointer"
                  >
                    Xem chi tiết chứng từ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#161514]/70 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] border border-[#E5E0D8] max-w-lg w-full p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-[#C05A39] uppercase">
                  CERTIFICAT DE COMMANDE
                </p>
                <h3 className="font-serif-luxury text-xl font-normal text-[#161514] mt-0.5">
                  Đơn May Đo #{selectedOrder.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 flex items-center justify-center border border-[#E5E0D8] text-[#161514] hover:border-[#161514] cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <div className="py-5 space-y-3.5 text-xs text-[#6B655D]">
              <p>Khách hàng: <strong className="text-[#161514]">{selectedOrder.customer?.fullName}</strong> ({selectedOrder.customer?.phone})</p>
              <p>Địa chỉ tư gia: <span className="text-[#161514]">{selectedOrder.customer?.address}</span></p>
              <p>Nghi thức thanh toán: <span className="text-[#161514] font-medium">{selectedOrder.paymentMethod}</span></p>
              {selectedOrder.notes && <p>Ghi chú nghệ nhân: <span className="italic text-[#161514]">{selectedOrder.notes}</span></p>}

              <div className="pt-4 border-t border-[#E5E0D8]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#161514] mb-2">
                  Danh mục tác phẩm may đo:
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between py-1 text-xs border-b border-[#E5E0D8]/50">
                      <span className="text-[#161514]">{item.name} ({item.size}) &times; {item.quantity}</span>
                      <span className="font-medium text-[#161514]">
                        {((item.price || 0) * item.quantity).toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E0D8] flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#161514]">
                  Tổng giá trị thanh toán:
                </span>
                <span className="font-serif-luxury text-2xl font-normal text-[#161514]">
                  {(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>

            <div className="pt-5 border-t border-[#E5E0D8] text-right">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 bg-[#161514] text-[#FAF8F5] text-xs font-medium tracking-widest uppercase hover:bg-[#2A2725] cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
