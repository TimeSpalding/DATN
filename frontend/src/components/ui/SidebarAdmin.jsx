import { useState, useEffect } from "react";
import { FiBarChart2, FiDatabase, FiUsers, FiExternalLink, FiTrash2, FiShoppingBag, FiPackage, FiMenu, FiX } from "react-icons/fi";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const navItems = [
  { to: "/admin", label: "Tổng quan Dashboard", icon: FiBarChart2, end: true },
  { to: "/admin/products", label: "Quản lý sản phẩm", icon: FiShoppingBag },
  { to: "/admin/orders", label: "Quản lý đơn hàng", icon: FiPackage },
  { to: "/admin/indexing", label: "Vector Indexing", icon: FiDatabase },
  { to: "/admin/trash", label: "Thùng rác", icon: FiTrash2 },
  { to: "/admin/users", label: "Người dùng", icon: FiUsers },
];

export const SidebarAdmin = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-md bg-slate-950 p-2 text-white shadow-md lg:hidden"
      >
        <FiMenu className="size-6" />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:min-h-screen lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-6">
          <div>
            <p className="text-lg font-bold leading-7 text-slate-950 tracking-wider">L'ATELIER</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-900">Admin Console</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-500 lg:hidden">
            <FiX className="size-6" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-4">
          {navItems.map(({ to, label, icon: Icon, end }) => {
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold tracking-wide transition ${
                    isActive
                      ? "bg-slate-950 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                  }`
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            );
          })}

          <div className="pt-4 mt-auto">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-100"
            >
              <FiExternalLink className="size-4" />
              <span>Xem trang Storefront</span>
            </Link>
          </div>
        </nav>

        <div className="shrink-0 border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 border border-slate-200">
            <div className="flex size-9 items-center justify-center rounded-full bg-blue-900 text-xs font-bold text-white uppercase">
              {(user?.username || user?.email || "A").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-950">
                {user?.username || user?.email || "Quản trị viên"}
              </p>
              <p className="text-[10px] text-slate-400">System Administrator</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SidebarAdmin;
