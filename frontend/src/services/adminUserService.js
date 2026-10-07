import apiClient from "./apiClient";

const unwrapResponse = (respone) => respone.data.data;

export const getAdminUsers = async ({ page, size, role, status }) => {
  const response = await apiClient.get("/admin/users", {
    params: { page, size, role, status }
  });
  return unwrapResponse(response);
};

export const getAdminUserDetail = async (userId) => {
  const response = await apiClient.get(`/admin/users/${userId}`);
  return unwrapResponse(response);
};

export const updateAdminUserStatus = async (userId, status) => {
  const response = await apiClient.put(`/admin/users/${userId}/status`, { status });
  return unwrapResponse(response);
};

export const updateAdminUserRole = async (userId, role) => {
  const response = await apiClient.put(`/admin/users/${userId}/role`, { role });
  return unwrapResponse(response);
};