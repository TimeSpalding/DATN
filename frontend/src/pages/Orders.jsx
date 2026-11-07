import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, Check, Truck, XCircle, ArrowRight, RefreshCw, X } from 'lucide-react';
import { orderService } from '../services/orderService';
import { useCart } from '../contexts/CartContext';
import { resolveImageUrl } from '../utils/imageUrl';

export default function Orders() {
  const { showToast } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const dialogRef = useRef(null);

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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (selectedOrder) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }

    const handleClose = () => setSelectedOrder(null);
    dialog.addEventListener('close', handleClose);

    const handleBackdropClick = (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!isDialogContent) {
        dialog.close();
      }
    };

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', handleBackdropClick);
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        dialog.removeEventListener('click', handleBackdropClick);
      }
    };
  }, [selectedOrder]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Xác nhận hủy đơn hàng ${orderId}?`)) return;
    try {
      await orderService.cancelOrder(orderId);
      showToast('Đã hủy đơn hàng thành công', 'info');
      fetchOrders();
    } catch {
      showToast('Không thể hủy đơn hàng này', 'error');
    }
  };

  const getOrderStatus = (order) =>
    String(order?.orderStatus || order?.status || 'pending').toLowerCase();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#161514] bg-[#161514] text-[#FAF8F5] text-[10px] font-medium tracking-widest uppercase">
            <Check className="w-3 h-3 stroke-[2]" />
            <span>Đã Giao Hàng</span>
          </span>
        );
      case 'shipping':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#C05A39] bg-[#C05A39]/10 text-[#C05A39] text-[10px] font-medium tracking-widest uppercase">
            <Truck className="w-3 h-3 stroke-[1.5]" />
            <span>Đang Giao Hàng</span>
          </span>
        );
      case 'processing':
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#9E7A52] bg-[#9E7A52]/10 text-[#9E7A52] text-[10px] font-medium tracking-widest uppercase">
            <RefreshCw className="w-3 h-3 stroke-[1.5]" />
            <span>{status === 'confirmed' ? 'Đã Xác Nhận' : 'Đang Đóng Gói'}</span>
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
            GRAND ATELIER &bull; THEO DÕI ĐƠN HÀNG
          </p>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl font-normal text-[#161514] tracking-wide">
            Lịch Sử Đơn Hàng
          </h1>
          <p className="text-xs text-[#6B655D] mt-2 max-w-xl leading-relaxed">
            Theo dõi trạng thái xử lý, đóng gói và tiến trình vận chuyển các đơn hàng đã đặt.
          </p>
        </div>

        <Link
          to="/catalog"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#161514] hover:text-[#C05A39] tracking-wider uppercase transition-colors"
        >
          <span>Tiếp tục mua sắm</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
        </Link>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border border-[#161514] border-t-transparent animate-spin" />
          <span className="text-[11px] uppercase tracking-widest text-[#8C8476]">Đang tải danh sách đơn hàng...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-16 text-center bg-[#FAF8F5] border border-[#E5E0D8] max-w-lg mx-auto">
          <Package className="w-10 h-10 text-[#8C8476] mx-auto mb-4 stroke-[1.25]" />
          <h3 className="font-serif-luxury text-2xl font-normal text-[#161514]">
            Chưa Có Đơn Hàng Nào
          </h3>
          <p className="text-xs text-[#6B655D] mt-2 leading-relaxed">
            Chưa có đơn hàng nào được ghi nhận. Khám phá bộ sưu tập và thử trang phục trực tuyến trước khi đặt mua.
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
          {orders.map((order) => {
            const status = getOrderStatus(order);
            const orderCode = order.orderNumber || order.id;

            return (
              <div
                key={orderCode}
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
                        {orderCode}
                      </span>
                      <p className="text-[10px] text-[#8C8476] tracking-wider uppercase mt-0.5">
                        Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {getStatusBadge(status)}
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
                {status !== 'cancelled' && (
                  <div className="pt-5 border-t border-[#E5E0D8]">
                    <div className="grid grid-cols-4 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-[#8C8476]">
                      <span className="text-[#161514] font-semibold">I. Đã Tiếp Nhận</span>
                      <span className={['confirmed', 'processing', 'shipping', 'delivered'].includes(status) ? 'text-[#161514] font-semibold' : ''}>
                        II. Đóng Gói
                      </span>
                      <span className={['shipping', 'delivered'].includes(status) ? 'text-[#161514] font-semibold' : ''}>
                        III. Đang Giao
                      </span>
                      <span className={status === 'delivered' ? 'text-[#C05A39] font-semibold' : ''}>
                        IV. Hoàn Tất
                      </span>
                    </div>
                    <div className="w-full h-1 bg-[#E5E0D8] mt-3 overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-500 ${
                          status === 'delivered'
                            ? 'w-full bg-[#C05A39]'
                            : status === 'shipping'
                            ? 'w-3/4 bg-[#161514]'
                            : ['confirmed', 'processing'].includes(status)
                            ? 'w-2/4 bg-[#161514]'
                            : 'w-1/4 bg-[#161514]'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="mt-5 pt-4 border-t border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
                  <span className="text-[10.5px] text-[#8C8476] tracking-wider uppercase">
                    Mã vận đơn: <strong className="text-[#161514] font-mono">{order.trackingNumber || 'Đang cập nhật'}</strong>
                  </span>

                  <div className="flex items-center gap-3">
                    {status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(order.id)}
                        className="text-xs text-[#C05A39] hover:underline cursor-pointer tracking-wider uppercase font-medium"
                      >
                        Hủy đơn hàng
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="px-4 py-2 border border-[#161514] text-[#161514] hover:bg-[#161514] hover:text-[#FAF8F5] text-[10.5px] font-medium tracking-widest uppercase transition-all cursor-pointer"
                    >
                      Xem chi tiết đơn
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Native Dialog */}
      <dialog
        ref={dialogRef}
        {...{ closedby: 'any' }}
        aria-label="Chi tiết đơn hàng"
        className="m-auto w-[min(92vw,34rem)] bg-[#FAF8F5] border border-[#E5E0D8] p-0 text-[#161514] shadow-2xl"
      >
        {selectedOrder && (
          <div className="p-7 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-[#C05A39] uppercase">
                  CHI TIẾT ĐƠN HÀNG
                </p>
                <h3 className="font-serif-luxury text-xl font-normal text-[#161514] mt-0.5">
                  Đơn Hàng #{selectedOrder.orderNumber || selectedOrder.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Đóng chi tiết đơn hàng"
                className="w-8 h-8 flex items-center justify-center border border-[#E5E0D8] text-[#161514] hover:border-[#161514] cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <div className="py-5 space-y-3 text-xs text-[#6B655D]">
              <p>Người nhận: <strong className="text-[#161514]">{selectedOrder.customer?.fullName}</strong> ({selectedOrder.customer?.phone})</p>
              <p>Địa chỉ nhận hàng: <span className="text-[#161514]">{selectedOrder.customer?.address}</span></p>
              <p>Phương thức thanh toán: <span className="text-[#161514] font-medium">{selectedOrder.paymentMethod}</span></p>
              {selectedOrder.notes && <p>Ghi chú giao hàng: <span className="italic text-[#161514]">{selectedOrder.notes}</span></p>}

              <div className="pt-4 border-t border-[#E5E0D8]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#161514] mb-2">
                  Danh sách sản phẩm:
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
                  Tổng thanh toán:
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
        )}
      </dialog>
    </div>
  );
}
