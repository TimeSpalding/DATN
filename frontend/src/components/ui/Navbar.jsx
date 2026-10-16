import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Search, User, Menu, X, LogOut, Shield, Clock, Bookmark, Package, Compass } from 'lucide-react';
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
    `text-[11px] font-medium tracking-[0.2em] uppercase transition-all py-1.5 border-b ${
      isActive
        ? 'text-[#161514] border-[#161514] font-semibold'
        : 'text-[#6B655D] border-transparent hover:text-[#161514] hover:border-[#D8D2C5]'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E5E0D8] transition-all">
      {/* Top Heritage Utility Bar */}
      <div className="bg-[#161514] text-[#D8D2C5] text-[10px] font-medium tracking-[0.22em] uppercase py-2 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="hidden md:inline text-[#A8A196]">
            HAUTE COUTURE &bull; DIGITAL FITTING SUITE &bull; BARCELONA &amp; HÀ NỘI
          </span>
          <span className="mx-auto md:mx-0">
            DỊCH VỤ ƯỚM THỬ TẠI GIA &bull; GIAO HÀNG VÀ CHỈNH SỬA TẬN TAY MIỄN PHÍ
          </span>
          <span className="hidden lg:inline text-[#A8A196]">
            CONCIERGE: +84 (0) 24 3868 6868
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Main Header Layout: Balanced Editorial Presentation */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Left: Primary Collections Navigation */}
          <nav className="hidden lg:flex items-center gap-7">
            <NavLink to="/" className={navLinkClass}>
              Trang Chủ
            </NavLink>
            <NavLink to="/catalog" className={navLinkClass}>
              Bộ Sưu Tập
            </NavLink>
            <NavLink to="/catalog?category=upper" className={navLinkClass}>
              Áo &amp; Tops
            </NavLink>
            <NavLink to="/catalog?category=dress" className={navLinkClass}>
              Đầm &amp; Váy
            </NavLink>
          </nav>

          {/* Center: Grand Logo & Maison Identity */}
          <div className="flex flex-col items-center text-center">
            <Link to="/" className="group flex flex-col items-center">
              <span className="font-brand text-xl sm:text-2xl lg:text-3xl font-medium tracking-[0.24em] text-[#161514] uppercase transition-colors group-hover:text-[#C05A39]">
                GRAND ATELIER
              </span>
              <span className="text-[8.5px] tracking-[0.32em] text-[#8C8476] uppercase font-medium -mt-0.5">
                CENTRAL &bull; MAISON DE COUTURE
              </span>
            </Link>
          </div>

          {/* Right: Bespoke Services & Utilities */}
          <div className="flex items-center gap-5 sm:gap-6 text-[#161514]">
            {/* Desktop Experience Links */}
            <nav className="hidden xl:flex items-center gap-6 mr-2">
              <NavLink
                to="/try-on"
                className={({ isActive }) =>
                  `text-[11px] font-medium tracking-[0.2em] uppercase transition-all py-1 border-b ${
                    isActive
                      ? 'text-[#C05A39] border-[#C05A39] font-semibold'
                      : 'text-[#6B655D] border-transparent hover:text-[#C05A39]'
                  }`
                }
              >
                Phòng Thử Đồ Tư Gia
              </NavLink>

              <NavLink
                to="/search-result"
                className={({ isActive }) =>
                  `text-[11px] font-medium tracking-[0.2em] uppercase transition-all py-1 border-b ${
                    isActive
                      ? 'text-[#161514] border-[#161514] font-semibold'
                      : 'text-[#6B655D] border-transparent hover:text-[#161514]'
                  }`
                }
              >
                Visual Concierge
              </NavLink>

              <NavLink
                to="/about"
                className={navLinkClass}
              >
                Câu Chuyện
              </NavLink>
            </nav>

            {/* Visual Search Icon */}
            <Link
              to="/search-result"
              className="p-1.5 text-[#161514] hover:text-[#C05A39] transition-colors"
              title="Visual Concierge — Tìm kiếm qua hình ảnh"
            >
              <Search className="w-4 h-4 stroke-[1.75]" />
            </Link>

            {/* Wishlist Button */}
            <Link
              to="/bookmarks"
              className="p-1.5 text-[#161514] hover:text-[#C05A39] transition-colors relative"
              title="Danh sách yêu thích"
            >
              <Heart className="w-4 h-4 stroke-[1.75]" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#C05A39] text-white text-[8.5px] font-medium rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag Trigger Button */}
            <button
              type="button"
              onClick={openCart}
              className="flex items-center gap-2 bg-[#161514] text-[#FAF8F5] px-3.5 py-1.5 text-[10.5px] font-medium tracking-[0.16em] uppercase transition-all hover:bg-[#C05A39] cursor-pointer"
              title="Mở túi đồ"
            >
              <ShoppingBag className="w-3.5 h-3.5 stroke-[1.75]" />
              <span className="hidden sm:inline">Túi Đồ</span>
              <span className="text-[10px] opacity-80">({totalItemsCount})</span>
            </button>

            {/* User Account / Auth Dropdown */}
            <div className="relative">
              {isAuthenticated ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1 text-[#161514] hover:text-[#C05A39] transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 border border-[#161514] text-[#161514] flex items-center justify-center text-[10px] font-medium uppercase">
                      {displayName.charAt(0)}
                    </div>
                    <span className="hidden lg:inline text-[11px] font-medium tracking-wider text-[#161514] max-w-[90px] truncate">
                      {displayName}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-[#FAF8F5] border border-[#E5E0D8] shadow-xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-[#E5E0D8]">
                        <p className="text-xs font-semibold text-[#161514] truncate">{displayName}</p>
                        <p className="text-[10px] tracking-widest text-[#8C8476] uppercase mt-0.5">{role || 'Thành viên Maison'}</p>
                      </div>

                      <Link
                        to="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#2A2724] hover:bg-[#F3EFE6] font-normal"
                      >
                        <Package className="w-3.5 h-3.5 text-[#8C8476]" />
                        <span>Đơn hàng &amp; May đo</span>
                      </Link>

                      <Link
                        to="/bookmarks"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#2A2724] hover:bg-[#F3EFE6] font-normal"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-[#8C8476]" />
                        <span>Bộ sưu tập đã lưu</span>
                      </Link>

                      <Link
                        to="/search-history"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#2A2724] hover:bg-[#F3EFE6] font-normal"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#8C8476]" />
                        <span>Nhật ký tìm kiếm</span>
                      </Link>

                      {role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#C05A39] hover:bg-[#F3EFE6] font-medium border-t border-[#E5E0D8] mt-1"
                        >
                          <Shield className="w-3.5 h-3.5 text-[#C05A39]" />
                          <span>Quản trị Atelier</span>
                        </Link>
                      )}

                      <div className="border-t border-[#E5E0D8] mt-1 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#8C8476] hover:text-[#C05A39] hover:bg-[#F3EFE6] font-normal cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#161514] hover:text-[#C05A39] transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <span className="text-[#D8D2C5]">/</span>
                  <Link
                    to="/register"
                    className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#6B655D] hover:text-[#161514] transition-colors"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-[#161514] lg:hidden hover:text-[#C05A39] transition-colors"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 stroke-[1.5]" /> : <Menu className="w-5 h-5 stroke-[1.5]" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E5E0D8] bg-[#FAF8F5] px-6 py-6 flex flex-col gap-4 shadow-xl">
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-medium tracking-[0.2em] uppercase text-[#161514] py-2 border-b border-[#E5E0D8]"
          >
            Trang Chủ
          </NavLink>
          <NavLink
            to="/catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-medium tracking-[0.2em] uppercase text-[#161514] py-2 border-b border-[#E5E0D8]"
          >
            Bộ Sưu Tập Đầy Đủ
          </NavLink>
          <NavLink
            to="/catalog?category=upper"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-medium tracking-[0.2em] uppercase text-[#161514] py-2 border-b border-[#E5E0D8]"
          >
            Áo &amp; Tops
          </NavLink>
          <NavLink
            to="/catalog?category=dress"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-medium tracking-[0.2em] uppercase text-[#161514] py-2 border-b border-[#E5E0D8]"
          >
            Đầm &amp; Váy
          </NavLink>
          <NavLink
            to="/try-on"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-medium tracking-[0.2em] uppercase text-[#C05A39] py-2 border-b border-[#E5E0D8]"
          >
            Phòng Thử Đồ Tư Gia (Fitting Suite)
          </NavLink>
          <NavLink
            to="/search-result"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-medium tracking-[0.2em] uppercase text-[#161514] py-2 border-b border-[#E5E0D8]"
          >
            Visual Concierge
          </NavLink>
          <NavLink
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-medium tracking-[0.2em] uppercase text-[#161514] py-2 border-b border-[#E5E0D8]"
          >
            Câu Chuyện Maison
          </NavLink>

          {!isAuthenticated && (
            <div className="flex gap-3 pt-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-3 text-center text-[11px] font-medium tracking-[0.18em] uppercase border border-[#161514] text-[#161514]"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-3 text-center text-[11px] font-medium tracking-[0.18em] uppercase bg-[#161514] text-[#FAF8F5]"
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
