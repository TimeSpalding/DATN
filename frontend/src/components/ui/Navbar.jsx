import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, Search, Menu, X, LogOut, Shield, Clock, Bookmark, Package, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';

const APPAREL_LINKS = [
  { to: '/catalog', label: 'Bộ Sưu Tập', matchCategory: null },
  { to: '/catalog?category=upper', label: 'Áo & Tops', matchCategory: 'upper' },
  { to: '/catalog?category=dress', label: 'Đầm & Váy', matchCategory: 'dress' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, role, logout } = useAuth();
  const { totalItemsCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileApparelOpen, setMobileApparelOpen] = useState(true);
  const [apparelDropdownOpen, setApparelDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const apparelDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Scroll detection for homepage transparent header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Outside click and Escape dismissal for dropdowns
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (apparelDropdownRef.current && !apparelDropdownRef.current.contains(event.target)) {
        setApparelDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setApparelDropdownOpen(false);
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
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
  const isApparelActive = location.pathname === '/catalog';
  const isTryOnActive = location.pathname === '/try-on';
  const isSearchActive = location.pathname === '/search-result';
  const isAboutActive = location.pathname === '/about';

  const isApparelItemActive = (matchCategory) => {
    if (location.pathname !== '/catalog') return false;
    if (matchCategory === null) return !categoryParam;
    return categoryParam === matchCategory;
  };

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
          <nav aria-label="Điều hướng chính" className="hidden lg:flex items-center gap-5 xl:gap-7 shrink-0">
            <Link to="/" className={getNavLinkClass(isHomeActive)}>
              Trang Chủ
            </Link>

            <div
              ref={apparelDropdownRef}
              className="relative"
              onMouseEnter={() => setApparelDropdownOpen(true)}
              onMouseLeave={() => setApparelDropdownOpen(false)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setApparelDropdownOpen(false);
                }
              }}
            >
              <button
                type="button"
                aria-expanded={apparelDropdownOpen}
                onClick={() => setApparelDropdownOpen((prev) => !prev)}
                className={`${getNavLinkClass(isApparelActive)} inline-flex items-center gap-1.5 cursor-pointer`}
              >
                <span>Trang Phục</span>
                <ChevronDown
                  aria-hidden="true"
                  className={`w-3.5 h-3.5 stroke-[1.75] transition-transform duration-200 ${
                    apparelDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {apparelDropdownOpen && (
                <div className="absolute left-0 top-full pt-2.5 z-50">
                  <div className="w-52 bg-[#FAF8F5] border border-[#E5E0D8] shadow-xl py-1.5 text-[#161514]">
                    {APPAREL_LINKS.map((item) => {
                      const active = isApparelItemActive(item.matchCategory);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setApparelDropdownOpen(false)}
                          className={`flex items-center justify-between px-4 py-2.5 text-[11px] tracking-[0.15em] uppercase transition-colors ${
                            active
                              ? 'bg-[#F3EFE6] text-[#C05A39] font-semibold'
                              : 'text-[#2A2724] font-medium hover:bg-[#F3EFE6] hover:text-[#161514]'
                          }`}
                        >
                          <span>{item.label}</span>
                          {active && <span aria-hidden="true" className="w-1.5 h-1.5 bg-[#C05A39]" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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
            <nav aria-label="Tiện ích cửa hàng" className="hidden lg:flex items-center gap-4 xl:gap-5 mr-1">
              <Link
                to="/try-on"
                className={`whitespace-nowrap text-[11px] font-medium tracking-[0.16em] uppercase transition-all py-1.5 border-b ${
                  isTryOnActive
                    ? 'text-[#C05A39] border-[#C05A39] font-semibold'
                    : isTransparent
                      ? 'text-[#FAF8F5]/80 border-transparent hover:text-[#C05A39]'
                      : 'text-[#6B655D] border-transparent hover:text-[#C05A39]'
                }`}
              >
                Phòng Thử Đồ
              </Link>

              <Link
                to="/search-result"
                className={getNavLinkClass(isSearchActive)}
              >
                Tìm Kiếm
              </Link>

              <Link
                to="/about"
                className={getNavLinkClass(isAboutActive)}
              >
                Câu Chuyện
              </Link>
            </nav>

            {/* Search Icon */}
            <Link
              to="/search-result"
              aria-label="Tìm kiếm trang phục"
              className={`p-1.5 transition-colors ${
                isTransparent ? 'text-[#FAF8F5] hover:text-[#C05A39]' : 'text-[#161514] hover:text-[#C05A39]'
              }`}
              title="Tìm kiếm trang phục"
            >
              <Search aria-hidden="true" className="w-4 h-4 stroke-[1.75]" />
            </Link>

            {/* Wishlist Button */}
            <Link
              to="/bookmarks"
              aria-label="Danh sách yêu thích"
              className={`p-1.5 transition-colors relative ${
                isTransparent ? 'text-[#FAF8F5] hover:text-[#C05A39]' : 'text-[#161514] hover:text-[#C05A39]'
              }`}
              title="Danh sách yêu thích"
            >
              <Heart aria-hidden="true" className="w-4 h-4 stroke-[1.75]" />
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
              <ShoppingBag aria-hidden="true" className="w-3.5 h-3.5 stroke-[1.75]" />
              <span className="inline whitespace-nowrap">Túi Đồ</span>
              <span className="text-[10px] opacity-80 whitespace-nowrap">({totalItemsCount})</span>
            </button>

            {/* User Account / Auth Dropdown */}
            <div ref={userDropdownRef} className="relative">
              {isAuthenticated ? (
                <div>
                  <button
                    type="button"
                    aria-expanded={userDropdownOpen}
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
                        <Package aria-hidden="true" className="w-3.5 h-3.5 text-[#8C8476]" />
                        <span>Đơn hàng của tôi</span>
                      </Link>

                      <Link
                        to="/bookmarks"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#2A2724] hover:bg-[#F3EFE6] font-normal"
                      >
                        <Bookmark aria-hidden="true" className="w-3.5 h-3.5 text-[#8C8476]" />
                        <span>Bộ sưu tập đã lưu</span>
                      </Link>

                      <Link
                        to="/search-history"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#2A2724] hover:bg-[#F3EFE6] font-normal"
                      >
                        <Clock aria-hidden="true" className="w-3.5 h-3.5 text-[#8C8476]" />
                        <span>Lịch sử tìm kiếm</span>
                      </Link>

                      {role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#C05A39] hover:bg-[#F3EFE6] font-medium border-t border-[#E5E0D8] mt-1"
                        >
                          <Shield aria-hidden="true" className="w-3.5 h-3.5 text-[#C05A39]" />
                          <span>Quản trị Atelier</span>
                        </Link>
                      )}

                      <div className="border-t border-[#E5E0D8] mt-1 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#8C8476] hover:text-[#C05A39] hover:bg-[#F3EFE6] font-normal cursor-pointer"
                        >
                          <LogOut aria-hidden="true" className="w-3.5 h-3.5" />
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
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-1.5 lg:hidden hover:text-[#C05A39] transition-colors ${
                  isTransparent ? 'text-[#FAF8F5]' : 'text-[#161514]'
                }`}
                aria-label="Mở menu điều hướng"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 stroke-[1.5]" /> : <Menu className="w-5 h-5 stroke-[1.5]" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E5E0D8] bg-[#FAF8F5] px-6 py-6 flex flex-col gap-3 shadow-xl text-[#161514]">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-medium tracking-[0.18em] uppercase py-2 border-b border-[#E5E0D8]"
          >
            Trang Chủ
          </Link>

          <div className="border-b border-[#E5E0D8] pb-2">
            <button
              type="button"
              aria-expanded={mobileApparelOpen}
              onClick={() => setMobileApparelOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-medium tracking-[0.18em] uppercase py-2 cursor-pointer"
            >
              <span>Trang Phục</span>
              <ChevronDown
                aria-hidden="true"
                className={`w-4 h-4 stroke-[1.5] transition-transform duration-200 ${
                  mobileApparelOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {mobileApparelOpen && (
              <div className="mt-1 pl-4 flex flex-col gap-1 border-l border-[#D8D2C5]">
                {APPAREL_LINKS.map((item) => {
                  const active = isApparelItemActive(item.matchCategory);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`py-2 text-[11px] tracking-[0.16em] uppercase ${
                        active ? 'text-[#C05A39] font-semibold' : 'text-[#6B655D] hover:text-[#161514]'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            to="/try-on"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-medium tracking-[0.18em] uppercase text-[#C05A39] py-2 border-b border-[#E5E0D8]"
          >
            Phòng Thử Đồ
          </Link>
          <Link
            to="/search-result"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-medium tracking-[0.18em] uppercase py-2 border-b border-[#E5E0D8]"
          >
            Tìm Kiếm
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-medium tracking-[0.18em] uppercase py-2 border-b border-[#E5E0D8]"
          >
            Câu Chuyện
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
