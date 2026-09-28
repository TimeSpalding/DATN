const ORDER_STORAGE_KEY = 'latelier_customer_orders';

const INITIAL_MOCK_ORDERS = [
  {
    id: 'ORD-894210',
    createdAt: '2026-09-25T14:32:00Z',
    status: 'delivered', // pending | processing | shipping | delivered | cancelled
    customer: {
      fullName: 'Nguyễn Văn An',
      phone: '0912345678',
      email: 'an.nguyen@example.com',
      address: 'Số 18, Phố Nguyễn Du, Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội',
    },
    items: [
      {
        id: 'polo-retro-knit-L-Navy',
        productId: 'polo-retro-knit',
        name: 'Áo Polo Dệt Kim Họa Tiết Retro Khóa Zip',
        size: 'L',
        color: 'Xanh Navy Họa Tiết',
        price: 489000,
        quantity: 1,
        image: '/samples/cloth-1.jpg',
      },
      {
        id: 'graphic-tee-owl-M-White',
        productId: 'graphic-tee-owl',
        name: 'Áo Thun Cổ Tròn Graphic Owl Heavyweight 280gsm',
        size: 'M',
        color: 'Trắng Ngà Off-White',
        price: 350000,
        quantity: 2,
        image: '/samples/cloth-2.webp',
      }
    ],
    shippingMethod: 'standard',
    paymentMethod: 'COD',
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
    createdAt: '2026-09-27T09:15:00Z',
    status: 'shipping',
    customer: {
      fullName: 'Trần Thị Mai',
      phone: '0987654321',
      email: 'mai.tran@example.com',
      address: 'Tòa Landmark 81, 720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh',
    },
    items: [
      {
        id: 'linen-maxi-dress-M-Beige',
        productId: 'linen-maxi-dress',
        name: 'Váy Đầm Dài Linen Thắt Eo Nữ Tính',
        size: 'M',
        color: 'Beige Mộc',
        price: 890000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
      }
    ],
    shippingMethod: 'express',
    paymentMethod: 'VNPAY',
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
    await new Promise((resolve) => setTimeout(resolve, 300));

    const orders = getStoredOrders();
    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder = {
      id: orderId,
      createdAt: new Date().toISOString(),
      status: 'pending',
      customer,
      items: items.map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.product.name,
        size: i.size,
        color: i.color,
        price: i.product.rawPrice,
        quantity: i.quantity,
        image: i.product.image,
      })),
      shippingMethod,
      paymentMethod,
      subtotal,
      shippingFee,
      discountAmount,
      totalAmount,
      trackingNumber: `LAT-${Math.floor(1000000 + Math.random() * 9000000)}`,
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
    await new Promise((resolve) => setTimeout(resolve, 150));
    return {
      success: true,
      data: getStoredOrders(),
    };
  },

  getOrderById: async (orderId) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const orders = getStoredOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error(`Không tìm thấy đơn hàng mã ${orderId}`);
    }
    return {
      success: true,
      data: order,
    };
  },

  updateOrderStatus: async (orderId, newStatus) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const orders = getStoredOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) throw new Error('Order not found');

    orders[index].status = newStatus;
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
    return { success: true, data: orders[index] };
  },

  cancelOrder: async (orderId) => {
    return orderService.updateOrderStatus(orderId, 'cancelled');
  }
};
