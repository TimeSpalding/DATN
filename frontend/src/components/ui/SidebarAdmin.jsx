import { useEffect } from "react";
import {
  FiBarChart2,
  FiDatabase,
  FiUsers,
  FiExternalLink,
  FiTrash2,
  FiShoppingBag,
  FiPackage,
  FiX,
} from "react-icons/fi";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const navItems = [
  { to: "/admin", label: "Tổng quan hệ thống", icon: FiBarChart2, end: true },
  { to: "/admin/products", label: "Quản lý sản phẩm", icon: FiShoppingBag },
  { to: "/admin/orders", label: "Quản lý đơn hàng", icon: FiPackage },
  { to: "/admin/indexing", label: "Đồng bộ tìm kiếm", icon: FiDatabase },
  { to: "/admin/trash", label: "Thùng rác hệ thống", icon: FiTrash2 },
  { to: "/admin/users", label: "Tài khoản thành viên", icon: FiUsers },
];

export const SidebarAdmin = ({ isOpen = false, onClose = () => {} }) => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    onClose();
  }, [location.pathname]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#161514]/60 transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#E5E0D8] bg-[#FAF8F5] transition-transform duration-300 ease-in-out lg:static lg:min-h-screen lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#E5E0D8] px-6">
          <div>
            <p className="font-brand text-base font-medium leading-6 text-[#161514] tracking-[0.22em] uppercase">
              GRAND ATELIER
            </p>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-[#C05A39]">
              Quản trị hệ thống
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng thanh điều hướng"
            className="text-[#6B655D] hover:text-[#161514] lg:hidden cursor-pointer"
          >
            <FiX className="size-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium tracking-wide transition ${
                  isActive
                    ? "bg-[#161514] text-[#FAF8F5]"
                    : "text-[#6B655D] hover:bg-[#F3EFE6] hover:text-[#161514]"
                }`
              }
            >
              <Icon className="size-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="pt-4 mt-auto">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 border border-[#D8D2C5] bg-white px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#161514] transition hover:border-[#161514] hover:bg-[#161514] hover:text-[#FAF8F5]"
            >
              <FiExternalLink className="size-3.5" />
              <span>Quay lại cửa hàng</span>
            </Link>
          </div>
        </nav>

        <div className="shrink-0 border-t border-[#E5E0D8] p-4">
          <div className="flex items-center gap-3 bg-white px-3 py-2.5 border border-[#E5E0D8]">
            <div className="flex size-8 shrink-0 items-center justify-center bg-[#161514] text-xs font-semibold text-[#FAF8F5] uppercase">
              {(user?.username || user?.email || "A").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#161514]">
                {user?.fullName || user?.username || user?.email || "Quản trị viên"}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[#8C8476]">
                Quản trị viên
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SidebarAdmin;
