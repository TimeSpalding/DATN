import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, Search, User, Menu, X, LogOut, Shield, Clock, Bookmark, Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, role, logout } = useAuth();
  const { totalItemsCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll detection for homepage transparent header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';
  const isTransparent = isHome && !isScrolled;

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

  // Exact path & query param matching to prevent multiple links being active simultaneously
  const searchParams = new URLSearchParams(location.search);
  const categoryParam = searchParams.get('category');

  const isHomeActive = location.pathname === '/';
  const isCatalogActive = location.pathname === '/catalog' && !categoryParam;
  const isUpperActive = location.pathname === '/catalog' && categoryParam === 'upper';
  const isDressActive = location.pathname === '/catalog' && categoryParam === 'dress';
  const isTryOnActive = location.pathname === '/try-on';
  const isVisualSearchActive = location.pathname === '/search-result';
  const isAboutActive = location.pathname === '/about';

  const getNavLinkClass = (isActive) =>
    `whitespace-nowrap text-[11px] font-medium tracking-[0.16em] uppercase transition-all py-1.5 border-b ${
      isActive
        ? isTransparent
          ? 'text-[#FAF8F5] border-[#FAF8F5] font-semibold'
          : 'text-[#161514] border-[#161514] font-semibold'
        : isTransparent
          ? 'text-[#FAF8F5]/75 border-transparent hover:text-[#FAF8F5] hover:border-[#FAF8F5]/40'
          : 'text-[#6B655D] border-transparent hover:text-[#161514] hover:border-[#D8D2C5]'
    }`;

  return (
    <header
      className={`transition-all duration-300 z-40 ${
        isHome
          ? isTransparent
            ? 'fixed top-0 inset-x-0 bg-gradient-to-b from-[#161514]/70 via-[#161514]/25 to-transparent border-b border-transparent text-[#FAF8F5]'
            : 'fixed top-0 inset-x-0 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E5E0D8] text-[#161514] shadow-xs'
          : 'sticky top-0 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E5E0D8] text-[#161514]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Left: Primary Collections Navigation */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 shrink-0">
            <Link to="/" className={getNavLinkClass(isHomeActive)}>
              Trang Chủ
            </Link>
            <Link to="/catalog" className={getNavLinkClass(isCatalogActive)}>
              Bộ Sưu Tập
            </Link>
            <Link to="/catalog?category=upper" className={getNavLinkClass(isUpperActive)}>
              Áo &amp; Tops
            </Link>
            <Link to="/catalog?category=dress" className={getNavLinkClass(isDressActive)}>
              Đầm &amp; Váy
            </Link>
          </nav>

          {/* Center: Grand Logo & Maison Identity */}
          <div className="flex flex-col items-center text-center shrink-0">
            <Link to="/" className="group flex flex-col items-center">
              <span
                className={`font-brand text-lg sm:text-2xl font-medium tracking-[0.24em] uppercase transition-colors whitespace-nowrap ${
                  isTransparent
                    ? 'text-[#FAF8F5] group-hover:text-[#D8D2C5]'
                    : 'text-[#161514] group-hover:text-[#C05A39]'
                }`}
              >
                GRAND ATELIER
              </span>
              <span
                className={`text-[8px] sm:text-[8.5px] tracking-[0.32em] uppercase font-medium -mt-0.5 whitespace-nowrap ${
                  isTransparent ? 'text-[#D8D2C5]/80' : 'text-[#8C8476]'
                }`}
              >
                CENTRAL &bull; MAISON DE COUTURE
              </span>
            </Link>
          </div>

          {/* Right: Bespoke Services & Utilities */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            {/* Desktop Experience Links */}
            <nav className="hidden xl:flex items-center gap-5 mr-1">
              <Link
                to="/try-on"
                className={`whitespace-nowrap text-[11px] font-medium tracking-[0.16em] uppercase transition-all py-1.5 border-b ${
                  isTryOnActive
                    ? isTransparent
                      ? 'text-[#C05A39] border-[#C05A39] font-semibold'
                      : 'text-[#C05A39] border-[#C05A39] font-semibold'
                    : isTransparent
                      ? 'text-[#FAF8F5]/80 border-transparent hover:text-[#C05A39]'
                      : 'text-[#6B655D] border-transparent hover:text-[#C05A39]'
                }`}
              >
                Phòng Thử Đồ
              </Link>

              <Link
                to="/search-result"
                className={getNavLinkClass(isVisualSearchActive)}
              >
                Tìm Kiếm Thị Giác
              </Link>

              <Link
                to="/about"
                className={getNavLinkClass(isAboutActive)}
              >
                Câu Chuyện
              </Link>
            </nav>

            {/* Visual Search Icon */}
            <Link
              to="/search-result"
              className={`p-1.5 transition-colors ${
                isTransparent ? 'text-[#FAF8F5] hover:text-[#C05A39]' : 'text-[#161514] hover:text-[#C05A39]'
              }`}
              title="Tìm kiếm qua hình ảnh &amp; mô tả"
            >
              <Search className="w-4 h-4 stroke-[1.75]" />
            </Link>

            {/* Wishlist Button */}
            <Link
              to="/bookmarks"
              className={`p-1.5 transition-colors relative ${
                isTransparent ? 'text-[#FAF8F5] hover:text-[#C05A39]' : 'text-[#161514] hover:text-[#C05A39]'
              }`}
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
              className={`whitespace-nowrap flex items-center gap-2 px-3 py-1.5 text-[10.5px] font-medium tracking-[0.16em] uppercase transition-all cursor-pointer ${
                isTransparent
                  ? 'bg-[#FAF8F5]/15 backdrop-blur-xs text-[#FAF8F5] border border-[#FAF8F5]/40 hover:bg-[#FAF8F5] hover:text-[#161514]'
                  : 'bg-[#161514] text-[#FAF8F5] hover:bg-[#C05A39]'
              }`}
              title="Mở túi đồ"
            >
              <ShoppingBag className="w-3.5 h-3.5 stroke-[1.75]" />
              <span className="inline whitespace-nowrap">Túi Đồ</span>
              <span className="text-[10px] opacity-80 whitespace-nowrap">({totalItemsCount})</span>
            </button>

            {/* User Account / Auth Dropdown */}
            <div className="relative">
              {isAuthenticated ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className={`flex items-center gap-2 p-1 transition-colors cursor-pointer ${
                      isTransparent ? 'text-[#FAF8F5] hover:text-[#C05A39]' : 'text-[#161514] hover:text-[#C05A39]'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 border flex items-center justify-center text-[10px] font-medium uppercase ${
                        isTransparent
                          ? 'border-[#FAF8F5] text-[#FAF8F5]'
                          : 'border-[#161514] text-[#161514]'
                      }`}
                    >
                      {displayName.charAt(0)}
                    </div>
                    <span
                      className={`hidden lg:inline text-[11px] font-medium tracking-wider max-w-[90px] truncate ${
                        isTransparent ? 'text-[#FAF8F5]' : 'text-[#161514]'
                      }`}
                    >
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
                        <span>Đơn hàng của tôi</span>
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
                <div className="hidden sm:flex items-center gap-2.5 whitespace-nowrap">
                  <Link
                    to="/login"
                    className={`text-[11px] font-medium tracking-[0.16em] uppercase transition-colors ${
                      isTransparent ? 'text-[#FAF8F5] hover:text-[#C05A39]' : 'text-[#161514] hover:text-[#C05A39]'
                    }`}
                  >
                    Đăng nhập
                  </Link>
                  <span className={isTransparent ? 'text-[#FAF8F5]/40' : 'text-[#D8D2C5]'}>/</span>
                  <Link
                    to="/register"
                    className={`text-[11px] font-medium tracking-[0.16em] uppercase transition-colors ${
                      isTransparent ? 'text-[#FAF8F5]/75 hover:text-[#FAF8F5]' : 'text-[#6B655D] hover:text-[#161514]'
                    }`}
                  >
                    Đăng ký
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-1.5 lg:hidden hover:text-[#C05A39] transition-colors ${
                  isTransparent ? 'text-[#FAF8F5]' : 'text-[#161514]'
                }`}
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
        <div className="lg:hidden border-t border-[#E5E0D8] bg-[#FAF8F5] px-6 py-6 flex flex-col gap-4 shadow-xl text-[#161514]">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-medium tracking-[0.18em] uppercase py-2 border-b border-[#E5E0D8]"
          >
            Trang Chủ
          </Link>
          <Link
            to="/catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-medium tracking-[0.18em] uppercase py-2 border-b border-[#E5E0D8]"
          >
            Bộ Sưu Tập Đầy Đủ
          </Link>
          <Link
            to="/catalog?category=upper"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-medium tracking-[0.18em] uppercase py-2 border-b border-[#E5E0D8]"
          >
            Áo &amp; Tops
          </Link>
          <Link
            to="/catalog?category=dress"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-medium tracking-[0.18em] uppercase py-2 border-b border-[#E5E0D8]"
          >
            Đầm &amp; Váy
          </Link>
          <Link
            to="/try-on"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-medium tracking-[0.18em] uppercase text-[#C05A39] py-2 border-b border-[#E5E0D8]"
          >
            Phòng Thử Đồ (Fitting Suite)
          </Link>
          <Link
            to="/search-result"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-medium tracking-[0.18em] uppercase py-2 border-b border-[#E5E0D8]"
          >
            Tìm Kiếm Thị Giác
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-medium tracking-[0.18em] uppercase py-2 border-b border-[#E5E0D8]"
          >
            Câu Chuyện Maison
          </Link>

          {!isAuthenticated && (
            <div className="flex gap-3 pt-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-3 text-center text-[11px] font-medium tracking-[0.16em] uppercase border border-[#161514] text-[#161514]"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-3 text-center text-[11px] font-medium tracking-[0.16em] uppercase bg-[#161514] text-[#FAF8F5]"
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
