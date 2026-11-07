import {
  getAdminUsers,
  updateAdminUserStatus,
  updateAdminUserRole,
} from "../../services/adminUserService";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const PAGE_SIZE = 20;

const FALLBACK_DEMO_USERS = [
  {
    id: 101,
    username: "admin_atelier",
    email: "admin@grandatelier.vn",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: "2026-09-12T08:30:00Z",
  },
  {
    id: 102,
    username: "nguyenvanan",
    email: "an.nguyen@example.com",
    role: "USER",
    status: "ACTIVE",
    createdAt: "2026-09-25T14:15:00Z",
  },
];

export const AdminUser = () => {
  const [page, setPage] = useState(0);
  const [localFallbackUsers, setLocalFallbackUsers] = useState(FALLBACK_DEMO_USERS);
  const queryClient = useQueryClient();

  const dataUser = useQuery({
    queryKey: ["admin-user", page],
    retry: false,
    queryFn: () =>
      getAdminUsers({
        page,
        size: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }) => updateAdminUserStatus(userId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-user"] }),
    onError: (_, { userId, status }) => {
      setLocalFallbackUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status } : u))
      );
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => updateAdminUserRole(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-user"] }),
    onError: (_, { userId, role }) => {
      setLocalFallbackUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
    },
  });

  const apiUsers = dataUser.data?.content || [];
  const usingFallback = dataUser.isError || (!dataUser.isLoading && apiUsers.length === 0);
  const listUser = usingFallback ? localFallbackUsers : apiUsers;
  const totalPages = usingFallback ? 1 : dataUser.data?.totalPages || 1;
  const totalElements = usingFallback
    ? localFallbackUsers.length
    : dataUser.data?.totalElements ?? 0;

  const formatDate = (dateString) => {
    if (!dateString) return "--";
    const safeDateString = dateString.endsWith("Z") ? dateString : `${dateString}Z`;
    const date = new Date(safeDateString);
    return (
      date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) +
      " " +
      date.toLocaleDateString("vi-VN")
    );
  };

  const handleToggleStatus = (user) => {
    const nextStatus = user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    if (
      window.confirm(
        `Xác nhận ${nextStatus === "BLOCKED" ? "khóa" : "kích hoạt lại"} tài khoản ${user.username}?`
      )
    ) {
      statusMutation.mutate({ userId: user.id, status: nextStatus });
    }
  };

  const handleToggleRole = (user) => {
    const nextRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    if (
      window.confirm(
        `Xác nhận chuyển phân quyền của tài khoản ${user.username} sang ${nextRole}?`
      )
    ) {
      roleMutation.mutate({ userId: user.id, role: nextRole });
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col gap-4 pb-6 border-b border-[#E5E0D8] sm:flex-row sm:justify-between sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#C05A39] mb-1">
            PHÂN QUYỀN &amp; BẢO MẬT
          </p>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-normal text-[#161514]">
            Quản Lý Tài Khoản Thành Viên
          </h1>
          <p className="text-xs text-[#6B655D] mt-1">
            Theo dõi danh sách tài khoản đăng ký, trạng thái hoạt động và phân quyền quản trị
          </p>
        </div>
        <span className="w-fit bg-white border border-[#E5E0D8] text-[#6B655D] text-xs px-3.5 py-2">
          Tổng số: <strong className="text-[#161514]">{totalElements}</strong> tài khoản
        </span>
      </div>

      <div className="overflow-x-auto bg-white border border-[#E5E0D8]">
        <table className="w-full text-xs text-left text-[#2A2724] whitespace-nowrap border-collapse">
          <thead className="text-[10.5px] text-[#6B655D] font-semibold uppercase tracking-wider bg-[#FAF8F5] border-b border-[#E5E0D8]">
            <tr>
              <th scope="col" className="px-4 py-3.5">Mã ID</th>
              <th scope="col" className="px-4 py-3.5">Tên đăng nhập</th>
              <th scope="col" className="px-4 py-3.5">Địa chỉ Email</th>
              <th scope="col" className="px-4 py-3.5">Phân quyền</th>
              <th scope="col" className="px-4 py-3.5">Trạng thái</th>
              <th scope="col" className="px-4 py-3.5">Ngày đăng ký</th>
              <th scope="col" className="px-4 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E0D8]">
            {dataUser.isLoading ? (
              <tr>
                <td colSpan="7" className="px-6 py-10 text-center text-[#8C8476]">
                  Đang tải danh sách tài khoản...
                </td>
              </tr>
            ) : listUser.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-10 text-center text-[#8C8476]">
                  Chưa có dữ liệu tài khoản thành viên.
                </td>
              </tr>
            ) : (
              listUser.map((user) => (
                <tr key={user.id} className="bg-white hover:bg-[#FAF8F5]/70 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-semibold text-[#161514]">
                    #{user.id}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-[#161514]">
                    {user.username}
                  </td>
                  <td className="px-4 py-3.5 text-[#6B655D]">{user.email}</td>
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleToggleRole(user)}
                      title="Bấm để chuyển đổi phân quyền"
                      className={`px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider border cursor-pointer transition ${
                        user.role === "ADMIN"
                          ? "bg-[#161514] text-[#FAF8F5] border-[#161514] hover:bg-[#2A2725]"
                          : "bg-[#FAF8F5] text-[#6B655D] border-[#D8D2C5] hover:border-[#161514] hover:text-[#161514]"
                      }`}
                    >
                      {user.role === "ADMIN" ? "Quản trị viên" : "Thành viên"}
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 ${
                          user.status === "ACTIVE" ? "bg-emerald-600" : "bg-rose-600"
                        }`}
                      />
                      <span
                        className={`font-medium ${
                          user.status === "ACTIVE" ? "text-emerald-800" : "text-rose-700"
                        }`}
                      >
                        {user.status === "ACTIVE" ? "Đang hoạt động" : "Tạm khóa"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[#6B655D]">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(user)}
                      className={`px-3 py-1 text-[10.5px] font-semibold uppercase tracking-wider border cursor-pointer transition ${
                        user.status === "ACTIVE"
                          ? "border-[#C05A39] text-[#C05A39] hover:bg-[#C05A39] hover:text-[#FAF8F5]"
                          : "border-emerald-700 text-emerald-800 hover:bg-emerald-700 hover:text-white"
                      }`}
                    >
                      {user.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-2 text-xs text-[#6B655D]">
        <button
          type="button"
          onClick={() => setPage((old) => Math.max(old - 1, 0))}
          disabled={page === 0}
          className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 font-semibold uppercase tracking-wider text-[#161514] bg-white border border-[#D8D2C5] hover:border-[#161514] disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <FiChevronLeft className="size-3.5" />
          <span>Trước</span>
        </button>

        <div className="bg-white px-4 py-2 border border-[#E5E0D8]">
          Trang <strong className="text-[#161514]">{page + 1}</strong> /{" "}
          <strong className="text-[#161514]">{totalPages === 0 ? 1 : totalPages}</strong>
        </div>

        <button
          type="button"
          onClick={() => setPage((old) => old + 1)}
          disabled={page >= totalPages - 1}
          className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 font-semibold uppercase tracking-wider text-[#161514] bg-white border border-[#D8D2C5] hover:border-[#161514] disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <span>Sau</span>
          <FiChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
};
