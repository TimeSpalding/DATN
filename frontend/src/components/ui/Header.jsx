import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { FiMenu, FiX } from "react-icons/fi";

export const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user, role } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const displayName =
    user?.fullName ||
    user?.name ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Thành viên";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinkClass = ({ isActive }) =>
    `pb-1 transition font-semibold text-xs uppercase tracking-wider ${
      isActive
        ? "border-b border-[#161514] text-[#161514]"
        : "text-[#6B655D] hover:text-[#161514]"
    }`;

  return (
    <header className="bg-[#FAF8F5] flex flex-col gap-4 border-b border-[#E5E0D8] px-4 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="font-brand text-xl font-medium tracking-[0.22em] text-[#161514] uppercase"
        >
          GRAND ATELIER
        </Link>

        <button
          type="button"
          className="p-1 text-[#6B655D] lg:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <FiX className="size-6" /> : <FiMenu className="size-6" />}
        </button>
      </div>

      <nav
        className={`${
          isMenuOpen ? "flex flex-col" : "hidden"
        } lg:flex lg:flex-row flex-wrap gap-4 lg:gap-6`}
      >
        <NavLink to="/" onClick={() => setIsMenuOpen(false)} className={navLinkClass}>
          Trang chủ
        </NavLink>
        <NavLink
          to="/search-history"
          onClick={() => setIsMenuOpen(false)}
          className={navLinkClass}
        >
          Lịch sử tìm kiếm
        </NavLink>
        <NavLink
          to="/bookmarks"
          onClick={() => setIsMenuOpen(false)}
          className={navLinkClass}
        >
          Ảnh đã lưu
        </NavLink>
        <NavLink
          to="/try-on"
          onClick={() => setIsMenuOpen(false)}
          className={navLinkClass}
        >
          Phòng thử đồ
        </NavLink>
      </nav>

      {isAuthenticated ? (
        <div
          className={`${
            isMenuOpen ? "flex flex-col items-start" : "hidden"
          } lg:flex lg:flex-row flex-wrap lg:items-center gap-3`}
        >
          {role === "ADMIN" && (
            <Link
              to="/admin"
              onClick={() => setIsMenuOpen(false)}
              className="border border-[#161514] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#161514] transition hover:bg-[#161514] hover:text-[#FAF8F5]"
            >
              Trang quản trị
            </Link>
          )}

          <span className="text-xs font-semibold text-[#161514]">
            Xin chào, {displayName}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="cursor-pointer border border-[#D8D2C5] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#161514] transition hover:border-[#161514]"
          >
            Đăng xuất
          </button>
        </div>
      ) : (
        <div
          className={`${
            isMenuOpen ? "flex flex-col items-start" : "hidden"
          } lg:flex lg:flex-row gap-3`}
        >
          <Link
            to="/register"
            onClick={() => setIsMenuOpen(false)}
            className="border border-[#161514] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#161514] transition hover:bg-[#161514] hover:text-[#FAF8F5]"
          >
            Đăng ký
          </Link>
          <Link
            to="/login"
            onClick={() => setIsMenuOpen(false)}
            className="bg-[#161514] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] transition hover:bg-[#2A2725]"
          >
            Đăng nhập
          </Link>
        </div>
      )}
    </header>
  );
};
