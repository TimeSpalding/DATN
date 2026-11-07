import { useState, useEffect, useRef } from 'react';
import { Search, Eye, X } from 'lucide-react';
import { orderService } from '../../services/orderService';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const detailDialogRef = useRef(null);

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

  useEffect(() => {
    const dialog = detailDialogRef.current;
    if (!dialog) return;
    if (selectedOrder) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [selectedOrder]);

  const handleBackdropClick = (event) => {
    const dialog = detailDialogRef.current;
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return;
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

  const getStatusClassName = (rawStatus) => {
    switch (rawStatus) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'shipping':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'processing':
      case 'confirmed':
        return 'bg-[#F3EFE6] text-[#161514] border-[#D8D2C5]';
      case 'cancelled':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-[#FAF8F5] text-[#6B655D] border-[#D8D2C5]';
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-[#E5E0D8] gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#C05A39] mb-1">
            ĐIỀU PHỐI VẬN ĐƠN
          </p>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-normal text-[#161514]">
            Quản Lý Đơn Đặt Hàng
          </h1>
          <p className="text-xs text-[#6B655D] mt-1">
            Cập nhật tiến độ xác nhận, đóng gói, vận chuyển và bàn giao đơn hàng trên toàn hệ thống
          </p>
        </div>

        <span className="text-xs text-[#6B655D] bg-white px-3.5 py-2 border border-[#E5E0D8] self-start sm:self-auto">
          Tổng số: <strong className="text-[#161514]">{orders.length}</strong> đơn hàng
        </span>
      </div>

      {/* Filter / Search */}
      <div className="my-6">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Tìm theo mã đơn hàng, họ tên khách hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#D8D2C5] text-xs text-[#161514] placeholder-[#8C8476] focus:outline-none focus:border-[#161514]"
          />
          <Search className="w-4 h-4 text-[#8C8476] absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#E5E0D8] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#6B655D] font-semibold uppercase tracking-wider text-[10.5px]">
                <th className="p-3.5">Mã đơn</th>
                <th className="p-3.5">Khách hàng</th>
                <th className="p-3.5">Điện thoại</th>
                <th className="p-3.5">Tổng thanh toán</th>
                <th className="p-3.5">Hình thức</th>
                <th className="p-3.5">Ngày đặt</th>
                <th className="p-3.5">Trạng thái xử lý</th>
                <th className="p-3.5 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D8] text-[#2A2724]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-[#8C8476]">
                    Đang tải danh sách đơn hàng...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-[#8C8476]">
                    Không tìm thấy đơn hàng nào khớp từ khóa.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const currentStatus = String(
                    order.orderStatus || order.status || 'pending'
                  ).toLowerCase();

                  return (
                    <tr key={order.id || order.orderNumber} className="hover:bg-[#FAF8F5]/70 transition-colors">
                      <td className="p-3.5 font-mono font-semibold text-[#161514]">
                        {order.orderNumber || order.id}
                      </td>
                      <td className="p-3.5 font-medium text-[#161514]">
                        {order.customer?.fullName || 'Khách vãng lai'}
                      </td>
                      <td className="p-3.5 text-[#6B655D]">{order.customer?.phone || 'N/A'}</td>
                      <td className="p-3.5 font-semibold text-[#161514]">
                        {(order.totalAmount || 0).toLocaleString('vi-VN')}₫
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 border border-[#E5E0D8] bg-[#FAF8F5] text-[10px] font-semibold uppercase text-[#161514]">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3.5 text-[#6B655D]">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-3.5">
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`px-2.5 py-1 text-[11px] font-semibold border cursor-pointer focus:outline-none ${getStatusClassName(currentStatus)}`}
                        >
                          <option value="pending">Chờ xác nhận</option>
                          <option value="confirmed">Đã xác nhận</option>
                          <option value="processing">Đang đóng gói</option>
                          <option value="shipping">Đang giao hàng</option>
                          <option value="delivered">Đã giao hàng</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-[#8C8476] hover:text-[#161514] transition-colors cursor-pointer"
                          title="Xem chi tiết đơn hàng"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <dialog
        ref={detailDialogRef}
        closedby="any"
        aria-labelledby="admin-order-detail-title"
        onClose={() => setSelectedOrder(null)}
        onClick={handleBackdropClick}
        className="m-auto w-[min(92vw,540px)] bg-[#FAF8F5] p-0 text-[#161514] border border-[#E5E0D8] shadow-2xl backdrop:bg-[#161514]/70 backdrop:backdrop-blur-xs"
      >
        {selectedOrder && (
          <div className="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C05A39]">
                  THÔNG TIN ĐƠN HÀNG
                </p>
                <h3
                  id="admin-order-detail-title"
                  className="font-serif-luxury text-xl font-normal text-[#161514]"
                >
                  Mã đơn #{selectedOrder.orderNumber || selectedOrder.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Đóng chi tiết đơn hàng"
                className="p-1 text-[#8C8476] hover:text-[#161514] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-2.5 text-xs text-[#6B655D]">
              <p>
                Người nhận:{' '}
                <strong className="text-[#161514]">{selectedOrder.customer?.fullName}</strong> (
                {selectedOrder.customer?.phone})
              </p>
              <p>Email: {selectedOrder.customer?.email || 'Chưa cung cấp'}</p>
              <p>Địa chỉ giao hàng: {selectedOrder.customer?.address}</p>
              <p>
                Phương thức giao hàng:{' '}
                {selectedOrder.shippingMethod === 'express'
                  ? 'Giao nhanh nội thành 24h'
                  : 'Giao hàng tiêu chuẩn (2–4 ngày)'}
              </p>
              {selectedOrder.notes && <p>Ghi chú: {selectedOrder.notes}</p>}

              <div className="pt-3 mt-3 border-t border-[#E5E0D8]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#161514] mb-2">
                  Danh sách sản phẩm
                </p>
                <div className="divide-y divide-[#E5E0D8] bg-white border border-[#E5E0D8] px-3">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between py-2.5">
                      <span className="text-[#161514]">
                        {item.name} (Size {item.size}) &times; {item.quantity}
                      </span>
                      <span className="font-semibold text-[#161514]">
                        {((item.price || item.rawPrice || 0) * item.quantity).toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E0D8] flex justify-between items-baseline text-[#161514]">
                <span className="text-xs font-semibold uppercase tracking-wider">Tổng giá trị đơn</span>
                <span className="font-serif-luxury text-xl">
                  {(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E0D8] text-right">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 bg-[#161514] hover:bg-[#2A2725] text-[#FAF8F5] text-xs font-semibold uppercase tracking-wider cursor-pointer"
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
