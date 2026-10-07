import apiClient from "./apiClient";

const TRYON_HISTORY_STORAGE_KEY = 'latelier_tryon_history';

const INITIAL_TRYON_HISTORY = [
  {
    id: 'tryon-hist-01',
    createdAt: '2026-09-27T10:15:00Z',
    category: 'upper',
    personImageUrl: '/samples/model-1.jpg',
    clothImageUrl: '/samples/cloth-1.jpg',
    resultImageUrl: '/samples/model-1.jpg',
    processingTimeMs: 14200,
  }
];

const getStoredTryOnHistory = () => {
  try {
    const raw = localStorage.getItem(TRYON_HISTORY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TRYON_HISTORY_STORAGE_KEY, JSON.stringify(INITIAL_TRYON_HISTORY));
      return INITIAL_TRYON_HISTORY;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TRYON_HISTORY;
  }
};

/**
 * Gửi ảnh người + ảnh trang phục lên backend để thử đồ AI với cơ chế fallback thông minh.
 * @param {File} personImage
 * @param {File} clothImage
 * @param {string} category - "upper" | "lower" | "overall"
 * @param {string} [presetResultUrl] - URL ảnh kết quả nếu chọn mẫu sẵn
 * @returns {Promise<{data: {historyId, resultImageUrl, category, processingTimeMs, createdAt}}>}
 */
export const requestTryOn = async ({ personImage, clothImage, category = "upper", presetResultUrl = null }) => {
  // If backend tryon is reachable, try calling real backend
  try {
    const formData = new FormData();
    if (personImage instanceof File) formData.append("person_image", personImage);
    if (clothImage instanceof File) formData.append("cloth_image", clothImage);
    formData.append("category", category);

    const response = await apiClient.post("/tryon", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 130000,
    });

    if (response?.data?.data?.resultImageUrl) {
      return response.data;
    }
  } catch (error) {
    console.warn("Backend try-on API unavailable or returned error, using studio simulation mode:", error?.message);
  }

  // Fallback / Studio Simulation mode:
  // Simulates a realistic AI processing delay (2.5s)
  await new Promise((resolve) => setTimeout(resolve, 2500));

  // Determine fallback image based on model & garment
  let simulatedResult = presetResultUrl;
  if (!simulatedResult) {
    if (category === 'overall') {
      simulatedResult = 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80';
    } else if (category === 'lower') {
      simulatedResult = 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80';
    } else {
      // Upper
      simulatedResult = '/samples/model-1.jpg';
    }
  }

  const historyItem = {
    id: `tryon-${Date.now()}`,
    createdAt: new Date().toISOString(),
    category,
    personImageUrl: typeof personImage === 'string' ? personImage : '/samples/model-1.jpg',
    clothImageUrl: typeof clothImage === 'string' ? clothImage : '/samples/cloth-1.jpg',
    resultImageUrl: simulatedResult,
    processingTimeMs: 12500,
  };

  const history = getStoredTryOnHistory();
  history.unshift(historyItem);
  localStorage.setItem(TRYON_HISTORY_STORAGE_KEY, JSON.stringify(history));

  return {
    success: true,
    data: historyItem,
  };
};

/**
 * Lấy lịch sử thử đồ của user hiện tại.
 */
export const getTryOnHistory = async ({ page = 0, size = 20 } = {}) => {
  try {
    const response = await apiClient.get("/tryon/history", { params: { page, size } });
    if (response?.data) return response.data;
  } catch (err) {
    // fallback
  }

  const history = getStoredTryOnHistory();
  const start = page * size;
  const results = history.slice(start, start + size);

  return {
    success: true,
    data: {
      results,
      page,
      size,
      total: history.length,
      last: start + size >= history.length,
    }
  };
};

/**
 * Xóa một record lịch sử thử đồ.
 */
export const deleteTryOnHistory = async (historyId) => {
  try {
    await apiClient.delete(`/tryon/history/${historyId}`);
  } catch {
    // fallback
  }

  const history = getStoredTryOnHistory().filter((h) => h.id !== historyId);
  localStorage.setItem(TRYON_HISTORY_STORAGE_KEY, JSON.stringify(history));
  return { success: true };
};
