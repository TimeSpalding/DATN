import apiClient from './apiClient';
import { CATALOG_PRODUCTS } from '../mocks/catalogData';

const LOCAL_STORAGE_CUSTOM_PRODUCTS = 'latelier_custom_products';

const getMergedProducts = () => {
  try {
    const custom = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_PRODUCTS) || '[]');
    return [...custom, ...CATALOG_PRODUCTS];
  } catch {
    return CATALOG_PRODUCTS;
  }
};

export const catalogService = {
  getProducts: async ({
    category = 'all',
    search = '',
    sort = 'popular',
    minPrice = 0,
    maxPrice = 5000000,
    size = 'all',
    gender = 'all',
    page = 1,
    limit = 12
  } = {}) => {
    try {
      const response = await apiClient.get('/products', {
        params: {
          category,
          search: search || undefined,
          sort,
          minPrice: minPrice > 0 ? minPrice : undefined,
          maxPrice: maxPrice < 5000000 ? maxPrice : undefined,
          size,
          gender,
          page,
          limit
        }
      });
      if (response.data && response.data.success && response.data.data) {
        const pageData = response.data.data;
        return {
          success: true,
          data: pageData.content || [],
          pagination: {
            page: (pageData.page || 0) + 1,
            limit: pageData.size || limit,
            total: pageData.totalElements || 0,
            totalPages: pageData.totalPages || 1
          }
        };
      }
    } catch (err) {
      console.warn('Backend products API unavailable, falling back to local catalog data:', err.message);
    }

    // Fallback to local mock data
    let items = getMergedProducts();

    if (category && category !== 'all') {
      items = items.filter((p) => p.category === category || p.subCategory === category);
    }

    if (gender && gender !== 'all') {
      items = items.filter((p) => p.gender === gender || p.gender === 'unisex');
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.material?.toLowerCase().includes(q)
      );
    }

    if (minPrice > 0) {
      items = items.filter((p) => p.rawPrice >= minPrice);
    }

    if (maxPrice < 5000000) {
      items = items.filter((p) => p.rawPrice <= maxPrice);
    }

    if (size && size !== 'all') {
      items = items.filter((p) => p.sizes?.some((s) => s.size === size && s.stock > 0));
    }

    switch (sort) {
      case 'price-asc':
        items.sort((a, b) => a.rawPrice - b.rawPrice);
        break;
      case 'price-desc':
        items.sort((a, b) => b.rawPrice - a.rawPrice);
        break;
      case 'rating':
        items.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        items.sort((a, b) => (b.badge === 'Mới về' ? 1 : 0) - (a.badge === 'Mới về' ? 1 : 0));
        break;
      case 'popular':
      default:
        items.sort((a, b) => (b.badge === 'Bán chạy' ? 1 : 0) - (a.badge === 'Bán chạy' ? 1 : 0));
        break;
    }

    const total = items.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  getProductById: async (id) => {
    try {
      const response = await apiClient.get(`/products/${id}`);
      if (response.data && response.data.success && response.data.data) {
        return { success: true, data: response.data.data };
      }
    } catch (err) {
      console.warn(`Backend product ${id} API error, falling back to mock:`, err.message);
    }

    const all = getMergedProducts();
    const product = all.find((p) => String(p.id) === String(id) || p.sku === id);
    if (!product) {
      throw new Error(`Không tìm thấy sản phẩm mã ${id}`);
    }
    return { success: true, data: product };
  },

  getFeaturedProducts: async (limit = 4) => {
    try {
      const response = await apiClient.get('/products', {
        params: { sort: 'popular', limit }
      });
      if (response.data && response.data.success && response.data.data) {
        return { success: true, data: response.data.data.content || [] };
      }
    } catch (err) {
      console.warn('Backend featured products API error, falling back to mock:', err.message);
    }

    const all = getMergedProducts();
    const featured = all.filter((p) => p.featured).slice(0, limit);
    return { success: true, data: featured };
  },

  getRelatedProducts: async (currentId, category, limit = 4) => {
    try {
      const response = await apiClient.get(`/products/${currentId}/related`);
      if (response.data && response.data.success && response.data.data) {
        return { success: true, data: response.data.data };
      }
    } catch (err) {
      console.warn('Backend related products API error, falling back to mock:', err.message);
    }

    const all = getMergedProducts();
    const related = all
      .filter((p) => String(p.id) !== String(currentId) && (p.category === category || p.featured))
      .slice(0, limit);
    return { success: true, data: related };
  },

  // Admin capabilities for managing products
  addProduct: async (newProduct) => {
    const current = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_PRODUCTS) || '[]');
    const productWithId = {
      ...newProduct,
      id: `custom-prod-${Date.now()}`,
      sku: newProduct.sku || `LAT-CUS-${Math.floor(100 + Math.random() * 900)}`,
      rawPrice: Number(newProduct.rawPrice) || 350000,
      price: `${(Number(newProduct.rawPrice) || 350000).toLocaleString('vi-VN')}₫`,
      rating: 5.0,
      reviewsCount: 1,
      inStock: true
    };
    current.unshift(productWithId);
    localStorage.setItem(LOCAL_STORAGE_CUSTOM_PRODUCTS, JSON.stringify(current));
    return { success: true, data: productWithId };
  },

  deleteProduct: async (id) => {
    const current = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_PRODUCTS) || '[]');
    const filtered = current.filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_CUSTOM_PRODUCTS, JSON.stringify(filtered));
    return { success: true };
  }
};
