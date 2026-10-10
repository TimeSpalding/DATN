import React, { useState, useEffect } from 'react';
import { Package, Search, CheckCircle2, Clock, Truck, XCircle, RefreshCw, Eye, X } from 'lucide-react';
import { orderService } from '../../services/orderService';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getAllOrdersAdmin();
      setOrders(res?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchTerm.toLowerCase();
    const orderCode = (o.orderNumber || String(o.id)).toLowerCase();
    return (
      orderCode.includes(q) ||
      o.customer?.fullName?.toLowerCase().includes(q) ||
      o.customer?.phone?.includes(q)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-950">Quản Lý Đơn Hàng</h1>
          <p className="text-xs text-slate-500 mt-1">Cập nhật trạng thái xử lý, vận chuyển và giao hàng toàn hệ thống</p>
        </div>

        <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          Tổng cộng: <strong>{orders.length}</strong> đơn hàng
        </span>
      </div>

      {/* Filter / Search */}
      <div className="my-6">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Tìm theo mã đơn hàng, tên khách, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-slate-950"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-2xl bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Mã đơn</th>
                <th className="p-3.5">Khách hàng</th>
                <th className="p-3.5">Số ĐT</th>
                <th className="p-3.5">Tổng tiền</th>
                <th className="p-3.5">Thanh toán</th>
                <th className="p-3.5">Ngày đặt</th>
                <th className="p-3.5">Trạng thái xử lý</th>
                <th className="p-3.5 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">Đang tải danh sách...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">Không tìm thấy đơn hàng nào.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id || order.orderNumber} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-900">{order.orderNumber || order.id}</td>
                    <td className="p-3 font-semibold text-slate-900">{order.customer?.fullName || 'Khách vãng lai'}</td>
                    <td className="p-3 text-slate-500">{order.customer?.phone || 'N/A'}</td>
                    <td className="p-3 font-extrabold text-slate-950">
                      {(order.totalAmount || 0).toLocaleString('vi-VN')}₫
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-3">
                      <select
                        value={order.orderStatus?.toLowerCase() || order.status?.toLowerCase() || 'pending'}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer focus:outline-none ${
                          (order.orderStatus?.toLowerCase() || order.status) === 'delivered'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : (order.orderStatus?.toLowerCase() || order.status) === 'shipping'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : (order.orderStatus?.toLowerCase() || order.status) === 'processing'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : (order.orderStatus?.toLowerCase() || order.status) === 'confirmed'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : (order.orderStatus?.toLowerCase() || order.status) === 'cancelled'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <option value="pending">Chờ xác nhận</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="processing">Đang đóng gói</option>
                        <option value="shipping">Đang giao hàng</option>
                        <option value="delivered">Đã giao hàng</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 text-slate-400 hover:text-slate-950 transition-colors cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950">
                Chi Tiết Đơn Hàng {selectedOrder.id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600">
              <p>Khách hàng: <strong>{selectedOrder.customer?.fullName}</strong> ({selectedOrder.customer?.phone})</p>
              <p>Email: {selectedOrder.customer?.email || 'N/A'}</p>
              <p>Địa chỉ nhận: {selectedOrder.customer?.address}</p>
              <p>Vận chuyển: {selectedOrder.shippingMethod === 'express' ? 'Hỏa tốc 24h' : 'Tiêu chuẩn 2-3 ngày'}</p>
              {selectedOrder.notes && <p>Ghi chú: {selectedOrder.notes}</p>}

              <div className="pt-2 border-t border-slate-100">
                <p className="font-bold text-slate-900 mb-2">Sản phẩm trong đơn:</p>
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
                className="px-5 py-2 bg-slate-950 text-white rounded-xl text-xs font-bold uppercase"
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
