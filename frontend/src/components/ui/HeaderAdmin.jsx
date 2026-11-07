import { FiLogOut, FiMenu } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const pageTitles = {
  "/admin": "Tổng quan vận hành",
  "/admin/products": "Quản lý danh mục sản phẩm",
  "/admin/orders": "Quản lý đơn đặt hàng",
  "/admin/indexing": "Đồng bộ chỉ mục tìm kiếm",
  "/admin/trash": "Thùng rác hệ thống",
  "/admin/users": "Quản lý tài khoản thành viên",
};

export const HeaderAdmin = ({ onOpenSidebar = () => {} }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const resolvedTitle = location.pathname.startsWith("/admin/indexing/")
    ? "Chi tiết tiến trình đồng bộ"
    : pageTitles[location.pathname] || "Quản trị Grand Atelier";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#E5E0D8] bg-[#FAF8F5] px-5 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="inline-flex size-9 items-center justify-center border border-[#D8D2C5] bg-white text-[#161514] lg:hidden cursor-pointer"
          aria-label="Mở thanh điều hướng quản trị"
        >
          <FiMenu className="size-4" />
        </button>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C05A39]">
            BẢNG ĐIỀU KHIỂN QUẢN TRỊ
          </p>
          <h1 className="truncate font-serif-luxury text-lg sm:text-xl font-normal leading-6 text-[#161514]">
            {resolvedTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-xs font-semibold text-[#161514]">
            {user?.fullName || user?.username || user?.email || "Quản trị viên"}
          </p>
          <p className="text-[10.5px] text-[#8C8476]">
            {user?.email || "admin@grandatelier.vn"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="cursor-pointer inline-flex items-center gap-2 border border-[#D8D2C5] bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-[#161514] transition hover:border-[#161514] hover:bg-[#161514] hover:text-[#FAF8F5]"
        >
          <FiLogOut className="size-3.5" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
};
