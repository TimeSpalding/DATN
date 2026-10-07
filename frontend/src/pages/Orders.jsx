import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle2, Truck, XCircle, ArrowRight, Eye, RefreshCw } from 'lucide-react';
import { orderService } from '../services/orderService';
import { useCart } from '../contexts/CartContext';

export default function Orders() {
  const { showToast, addToCart } = useCart();
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
    if (!window.confirm(`Bạn có chắc muốn hủy đơn hàng ${orderId}?`)) return;
    try {
      await orderService.cancelOrder(orderId);
      showToast('Đã hủy đơn hàng thành công', 'info');
      fetchOrders();
    } catch {
      showToast('Không thể hủy đơn hàng này', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã giao hàng</span>
          </span>
        );
      case 'shipping':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200">
            <Truck className="w-3.5 h-3.5" />
            <span>Đang giao hàng</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200">
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Đang xử lý</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>Đã hủy</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ xác nhận</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title */}
      <div className="mb-8 pb-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
            Đơn Hàng Của Tôi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tiến trình vận chuyển và lịch sử mua sắm của bạn
          </p>
        </div>

        <Link
          to="/catalog"
          className="text-xs font-bold text-blue-800 hover:underline flex items-center gap-1"
        >
          <span>Mua sắm thêm</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-slate-950 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-200 max-w-md mx-auto">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-900">Bạn chưa có đơn hàng nào</p>
          <p className="text-xs text-slate-500 mt-1">Hãy bắt đầu lựa chọn sản phẩm và tạo đơn hàng đầu tiên!</p>
          <Link
            to="/catalog"
            className="mt-5 inline-flex px-6 py-2.5 bg-slate-950 text-white rounded-full text-xs font-bold uppercase"
          >
            Khám phá bộ sưu tập
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-6 bg-white border border-slate-200 rounded-3xl shadow-2xs hover:shadow-md transition-shadow"
            >
              {/* Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                    <Package className="w-5 h-5 text-blue-800" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-950">{order.id}</span>
                    <p className="text-[11px] text-slate-500">
                      Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(order.status)}
                  <span className="text-sm font-extrabold text-blue-900">
                    {(order.totalAmount || 0).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="py-4 space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-16 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Phân loại: {item.size} &bull; {item.color} &bull; Số lượng: {item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-800">
                      {((item.price || 0) * item.quantity).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress Step Bar */}
              {order.status !== 'cancelled' && (
                <div className="mt-2 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span className="text-slate-950">1. Đã đặt hàng</span>
                    <span className={['processing', 'shipping', 'delivered'].includes(order.status) ? 'text-slate-950' : ''}>
                      2. Đang chuẩn bị
                    </span>
                    <span className={['shipping', 'delivered'].includes(order.status) ? 'text-slate-950' : ''}>
                      3. Đang giao hàng
                    </span>
                    <span className={order.status === 'delivered' ? 'text-emerald-700' : ''}>
                      4. Đã giao thành công
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden flex">
                    <div
                      className={`h-full bg-blue-700 transition-all ${
                        order.status === 'delivered'
                          ? 'w-full bg-emerald-600'
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
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  Mã vận đơn: <strong>{order.trackingNumber || 'Đang cập nhật'}</strong>
                </span>

                <div className="flex items-center gap-3">
                  {order.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleCancelOrder(order.id)}
                      className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Hủy đơn hàng
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="px-3.5 py-1.5 rounded-full border border-slate-300 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950 pb-3 border-b border-slate-200">
              Chi Tiết Đơn Hàng {selectedOrder.id}
            </h3>

            <div className="py-4 space-y-3 text-xs text-slate-600">
              <p>Người nhận: <strong>{selectedOrder.customer?.fullName}</strong> ({selectedOrder.customer?.phone})</p>
              <p>Địa chỉ: {selectedOrder.customer?.address}</p>
              <p>Phương thức thanh toán: {selectedOrder.paymentMethod}</p>
              {selectedOrder.notes && <p>Ghi chú: {selectedOrder.notes}</p>}

              <div className="pt-2 border-t border-slate-100">
                <p className="font-bold text-slate-900 mb-2">Sản phẩm:</p>
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between py-1">
                    <span>{item.name} ({item.size}) x {item.quantity}</span>
                    <span className="font-semibold text-slate-900">
                      {((item.price || 0) * item.quantity).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-950">
                <span>Tổng tiền:</span>
                <span className="text-blue-900">{(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')}₫</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-slate-950 text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
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
