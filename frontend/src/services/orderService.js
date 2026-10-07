import apiClient from './apiClient';

const ORDER_STORAGE_KEY = 'latelier_customer_orders';

const INITIAL_MOCK_ORDERS = [
  {
    id: 'ORD-894210',
    orderNumber: 'ORD-894210',
    createdAt: '2026-09-25T14:32:00Z',
    orderStatus: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'COD',
    customer: {
      fullName: 'Nguyễn Văn An',
      phone: '0912345678',
      email: 'an.nguyen@example.com',
      address: 'Số 18, Phố Nguyễn Du, Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội',
    },
    items: [
      {
        id: 'polo-retro-knit-L-Navy',
        name: 'Áo Polo Dệt Kim Họa Tiết Retro Khóa Zip',
        size: 'L',
        color: 'Xanh Navy Họa Tiết',
        price: 489000,
        quantity: 1,
        image: '/samples/cloth-1.jpg',
      },
      {
        id: 'graphic-tee-owl-M-White',
        name: 'Áo Thun Cổ Tròn Graphic Owl Heavyweight 280gsm',
        size: 'M',
        color: 'Trắng Ngà Off-White',
        price: 350000,
        quantity: 2,
        image: '/samples/cloth-2.webp',
      }
    ],
    shippingMethod: 'standard',
    subtotal: 1189000,
    shippingFee: 0,
    discountAmount: 118900,
    totalAmount: 1070100,
    trackingNumber: 'VNPOST-8829410',
    estimatedDelivery: '2026-09-28',
    notes: 'Giao giờ hành chính, gọi trước khi đến',
  },
  {
    id: 'ORD-752109',
    orderNumber: 'ORD-752109',
    createdAt: '2026-09-27T09:15:00Z',
    orderStatus: 'shipping',
    paymentStatus: 'paid',
    paymentMethod: 'VNPAY',
    customer: {
      fullName: 'Trần Thị Mai',
      phone: '0987654321',
      email: 'mai.tran@example.com',
      address: 'Tòa Landmark 81, 720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh',
    },
    items: [
      {
        id: 'linen-maxi-dress-M-Beige',
        name: 'Váy Đầm Dài Linen Thắt Eo Nữ Tính',
        size: 'M',
        color: 'Beige Mộc',
        price: 890000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
      }
    ],
    shippingMethod: 'express',
    subtotal: 890000,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: 890000,
    trackingNumber: 'GHN-9941032',
    estimatedDelivery: '2026-09-29',
    notes: '',
  }
];

const getStoredOrders = () => {
  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_ORDERS));
      return INITIAL_MOCK_ORDERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_ORDERS;
  }
};

export const orderService = {
  createOrder: async ({ customer, items, shippingMethod, paymentMethod, subtotal, shippingFee, discountAmount, totalAmount, notes = '' }) => {
    try {
      const payload = {
        recipientName: customer?.fullName || 'Khách hàng',
        phoneNumber: customer?.phone || '0987654321',
        shippingAddress: customer?.address || 'Hà Nội',
        shippingMethod: shippingMethod || 'standard',
        paymentMethod: paymentMethod || 'COD',
        notes: notes || '',
        items: items.map((i) => ({
          variantId: i.variantId || (typeof i.id === 'number' ? i.id : 1),
          quantity: i.quantity || 1,
        })),
      };

      const res = await apiClient.post('/orders/checkout', payload);
      if (res.data && res.data.success && res.data.data) {
        const orderData = res.data.data;
        const orders = getStoredOrders();
        orders.unshift(orderData);
        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
        return { success: true, data: orderData };
      }
    } catch (err) {
      console.warn('Backend order checkout API error, falling back to local simulation:', err.message);
    }

    // Fallback simulation
    await new Promise((resolve) => setTimeout(resolve, 300));

    const orders = getStoredOrders();
    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder = {
      id: orderId,
      orderNumber: orderId,
      createdAt: new Date().toISOString(),
      orderStatus: 'pending',
      paymentStatus: 'pending',
      paymentMethod,
      customer,
      items: items.map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.product?.name || i.name,
        size: i.size,
        color: i.color,
        price: i.product?.rawPrice || i.price,
        quantity: i.quantity,
        image: i.product?.image || i.image,
      })),
      shippingMethod,
      subtotal,
      shippingFee,
      discountAmount,
      totalAmount,
      trackingNumber: `VNPOST-${Math.floor(1000000 + Math.random() * 9000000)}`,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes,
    };

    orders.unshift(newOrder);
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));

    return {
      success: true,
      data: newOrder,
    };
  },

  getOrders: async () => {
    try {
      const res = await apiClient.get('/orders/my-orders');
      if (res.data && res.data.success && res.data.data) {
        return {
          success: true,
          data: res.data.data.content || [],
        };
      }
    } catch (err) {
      console.warn('Backend my-orders API error, falling back to local orders:', err.message);
    }

    return {
      success: true,
      data: getStoredOrders(),
    };
  },

  getAllOrdersAdmin: async () => {
    try {
      const res = await apiClient.get('/admin/orders');
      if (res.data && res.data.success && res.data.data) {
        return {
          success: true,
          data: res.data.data.content || [],
        };
      }
    } catch (err) {
      console.warn('Backend admin orders API error, falling back to local orders:', err.message);
    }

    return {
      success: true,
      data: getStoredOrders(),
    };
  },

  getOrderById: async (orderId) => {
    try {
      const res = await apiClient.get(`/orders/${orderId}`);
      if (res.data && res.data.success && res.data.data) {
        return {
          success: true,
          data: res.data.data,
        };
      }
    } catch (err) {
      console.warn(`Backend order ${orderId} API error, falling back to local:`, err.message);
    }

    const orders = getStoredOrders();
    const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) {
      throw new Error(`Không tìm thấy đơn hàng mã ${orderId}`);
    }
    return {
      success: true,
      data: order,
    };
  },

  updateOrderStatus: async (orderId, newStatus) => {
    try {
      if (typeof orderId === 'number') {
        const res = await apiClient.put(`/admin/orders/${orderId}/status`, { orderStatus: newStatus });
        if (res.data && res.data.success && res.data.data) {
          return { success: true, data: res.data.data };
        }
      }
    } catch (err) {
      console.warn('Backend updateOrderStatus API error:', err.message);
    }

    const orders = getStoredOrders();
    const index = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    if (index === -1) throw new Error('Order not found');

    orders[index].orderStatus = newStatus;
    orders[index].status = newStatus;
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
    return { success: true, data: orders[index] };
  },

  cancelOrder: async (orderId) => {
    return orderService.updateOrderStatus(orderId, 'cancelled');
  }
};
