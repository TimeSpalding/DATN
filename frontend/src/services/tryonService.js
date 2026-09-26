import apiClient from "./apiClient";

/**
 * Gửi ảnh người + ảnh trang phục lên backend để thử đồ AI.
 * @param {File} personImage
 * @param {File} clothImage
 * @param {string} category - "upper" | "lower" | "overall"
 * @returns {Promise<{data: {historyId, resultImageUrl, category, processingTimeMs, createdAt}}>}
 */
export const requestTryOn = async ({ personImage, clothImage, category = "overall" }) => {
  const formData = new FormData();
  formData.append("person_image", personImage);
  formData.append("cloth_image", clothImage);
  formData.append("category", category);

  const response = await apiClient.post("/tryon", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 130000, // 130s — dài hơn server timeout 120s một chút
  });

  return response.data;
};

/**
 * Lấy lịch sử thử đồ của user hiện tại.
 */
export const getTryOnHistory = async ({ page = 0, size = 20 } = {}) => {
  const response = await apiClient.get("/tryon/history", { params: { page, size } });
  return response.data;
};

/**
 * Xóa một record lịch sử thử đồ.
 */
export const deleteTryOnHistory = async (historyId) => {
  const response = await apiClient.delete(`/tryon/history/${historyId}`);
  return response.data;
};
