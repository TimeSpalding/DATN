import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const CART_STORAGE_KEY = 'latelier_shopping_cart';
const COUPON_STORAGE_KEY = 'latelier_applied_coupon';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem(COUPON_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  const showToast = (message, type = 'success') => {
    setToastNotification({ message, type, id: Date.now() });
  };

  const addToCart = (product, size = 'M', color = null, quantity = 1, openDrawer = true) => {
    if (!product) return;

    const selectedColor = color || product.colors?.[0]?.name || 'Tiêu chuẩn';
    const itemUniqueId = `${product.id}-${size}-${selectedColor}`;

    const matchingVariant = product.variants?.find(
      (v) => v.size?.toUpperCase() === (size || 'M').toUpperCase() && (!color || v.color?.toLowerCase() === selectedColor.toLowerCase())
    ) || product.sizes?.find((s) => s.size?.toUpperCase() === (size || 'M').toUpperCase());
    const variantId = matchingVariant?.id || matchingVariant?.variantId || 1;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === itemUniqueId);

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: itemUniqueId,
            productId: product.id,
            variantId,
            product,
            size,
            color: selectedColor,
            quantity: Math.max(1, quantity),
            addedAt: Date.now(),
          },
        ];
      }
    });

    showToast(`Đã thêm "${product.name}" vào giỏ hàng!`);

    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (cartItemId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
    showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
  };

  const updateQuantity = (cartItemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity: newQty } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(COUPON_STORAGE_KEY);
  };

  const applyCoupon = (code) => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (cleanCode === 'ATELIER10' || cleanCode === 'DISCOUNT10') {
      const coupon = { code: cleanCode, discountPercent: 10, description: 'Giảm 10% tổng đơn hàng' };
      setAppliedCoupon(coupon);
      localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
      showToast('Áp dụng mã giảm giá 10% thành công!');
      return { success: true, message: 'Áp dụng mã thành công' };
    } else if (cleanCode === 'FREESHIP') {
      const coupon = { code: cleanCode, freeShipping: true, description: 'Miễn phí vận chuyển toàn quốc' };
      setAppliedCoupon(coupon);
      localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
      showToast('Áp dụng mã miễn phí vận chuyển!');
      return { success: true, message: 'Áp dụng mã thành công' };
    } else {
      showToast('Mã khuyến mãi không hợp lệ hoặc đã hết hạn', 'error');
      return { success: false, message: 'Mã khuyến mãi không hợp lệ' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem(COUPON_STORAGE_KEY);
    showToast('Đã hủy áp dụng mã giảm giá', 'info');
  };

  // Calculations
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.product.rawPrice || 0;
    return acc + price * item.quantity;
  }, 0);

  // Free shipping threshold: 500.000 VND
  const FREE_SHIPPING_THRESHOLD = 500000;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || appliedCoupon?.freeShipping;
  const shippingFee = cartItems.length === 0 ? 0 : isFreeShipping ? 0 : 30000;

  let discountAmount = 0;
  if (appliedCoupon?.discountPercent) {
    discountAmount = Math.round((subtotal * appliedCoupon.discountPercent) / 100);
  }

  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItemsCount,
        subtotal,
        shippingFee,
        discountAmount,
        totalAmount,
        FREE_SHIPPING_THRESHOLD,
        isFreeShipping,
        appliedCoupon,
        isCartOpen,
        toastNotification,
        setIsCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
