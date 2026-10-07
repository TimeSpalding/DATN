import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Search, Sparkles, User, Menu, X, LogOut, Shield, Clock, Bookmark, Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, role, logout } = useAuth();
  const { totalItemsCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const displayName =
    user?.fullName ||
    user?.name ||
    user?.username ||
    user?.email?.split('@')[0] ||
    'Quý khách';

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `text-xs font-bold tracking-wider uppercase transition-colors py-1 ${
      isActive ? 'text-blue-900 border-b-2 border-blue-900' : 'text-slate-600 hover:text-slate-950'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Announcement Bar */}
      <div className="bg-slate-950 text-slate-200 text-[10px] font-medium tracking-[0.18em] uppercase py-1.5 px-4 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>Phòng Thử Đồ Trực Tuyến &bull; Miễn Phí Đổi Size Tận Nhà Trong 30 Ngày &bull; Hotline: 1800 6868</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-3 flex items-center justify-between gap-4">
        {/* Left: Brand logo & Navigation */}
        <div className="flex items-center gap-8 lg:gap-10">
          <Link to="/" className="flex flex-col group">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-[0.2em] text-slate-950 uppercase transition-colors group-hover:text-blue-900">
              L'ATELIER
            </span>
            <span className="text-[8.5px] tracking-[0.28em] text-slate-400 uppercase font-semibold -mt-0.5">
              Studio &bull; Fitting Lab
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            <NavLink to="/" className={navLinkClass}>
              Trang Chủ
            </NavLink>
            <NavLink to="/catalog" className={navLinkClass}>
              Bộ Sưu Tập
            </NavLink>
            <NavLink to="/catalog?category=upper" className={navLinkClass}>
              Áo Nam &amp; Nữ
            </NavLink>
            <NavLink to="/catalog?category=lower" className={navLinkClass}>
              Quần &amp; Váy
            </NavLink>
            
            {/* Try-On Highlight Pill */}
            <NavLink
              to="/try-on"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-950 hover:text-white'
                }`
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Phòng Thử Đồ Ảo</span>
            </NavLink>
          </nav>
        </div>

        {/* Right utility actions */}
        <div className="flex items-center gap-2 sm:gap-3.5 text-slate-700">
          {/* Visual Search Shortcut */}
          <Link
            to="/search-result"
            className="p-2 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-colors hidden sm:flex cursor-pointer"
            title="Tìm kiếm hình ảnh thông minh"
          >
            <Search className="w-4 h-4" />
          </Link>

          {/* Wishlist Button */}
          <Link
            to="/bookmarks"
            className="p-2 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-colors relative cursor-pointer"
            title="Sản phẩm đã lưu"
          >
            <Heart className="w-4 h-4" />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Shopping Bag Trigger Button */}
          <button
            type="button"
            onClick={openCart}
            className="flex items-center gap-2 bg-slate-950 text-white px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all hover:bg-blue-950 shadow-xs cursor-pointer"
            title="Mở túi đồ"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Túi Đồ</span>
            <span className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center text-[10px]">
              {totalItemsCount}
            </span>
          </button>

          {/* User Account / Auth Dropdown */}
          <div className="relative">
            {isAuthenticated ? (
              <div>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold uppercase">
                    {displayName.charAt(0)}
                  </div>
                  <span className="hidden md:inline text-xs font-semibold text-slate-800 max-w-[100px] truncate">
                    {displayName}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{role || 'Thành viên'}</p>
                    </div>

                    <Link
                      to="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Package className="w-4 h-4 text-blue-700" />
                      <span>Đơn hàng của tôi</span>
                    </Link>

                    <Link
                      to="/bookmarks"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Bookmark className="w-4 h-4 text-rose-500" />
                      <span>Sản phẩm đã lưu</span>
                    </Link>

                    <Link
                      to="/search-history"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>Lịch sử tìm kiếm</span>
                    </Link>

                    {role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-indigo-700 hover:bg-indigo-50 font-bold border-t border-slate-100 mt-1"
                      >
                        <Shield className="w-4 h-4 text-indigo-600" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors uppercase tracking-wider"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-900 border border-slate-200 text-xs font-bold hover:bg-slate-200 transition-colors uppercase tracking-wider"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-700 hover:text-slate-950 lg:hidden rounded-lg hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-5 flex flex-col gap-3 shadow-lg">
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold text-slate-800 py-1.5 border-b border-slate-100"
          >
            Trang Chủ
          </NavLink>
          <NavLink
            to="/catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold text-slate-800 py-1.5 border-b border-slate-100"
          >
            Bộ Sưu Tập
          </NavLink>
          <NavLink
            to="/catalog?category=upper"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold text-slate-800 py-1.5 border-b border-slate-100"
          >
            Áo Nam &amp; Nữ
          </NavLink>
          <NavLink
            to="/catalog?category=lower"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold text-slate-800 py-1.5 border-b border-slate-100"
          >
            Quần &amp; Váy
          </NavLink>
          <NavLink
            to="/try-on"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold text-blue-900 py-1.5 border-b border-slate-100 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Phòng Thử Đồ Ảo (Virtual Try-On)</span>
          </NavLink>
          <NavLink
            to="/search-result"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold text-slate-800 py-1.5 border-b border-slate-100"
          >
            Tìm Kiếm Hình Ảnh AI
          </NavLink>

          {!isAuthenticated && (
            <div className="flex gap-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center text-xs font-bold uppercase rounded-xl border border-slate-300 text-slate-800"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center text-xs font-bold uppercase rounded-xl bg-slate-950 text-white"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
