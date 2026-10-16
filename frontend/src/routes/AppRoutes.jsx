import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';

// Public & Customer Store Pages
import Home from '../pages/Home';
import Catalog from '../pages/Catalog';
import ProductDetail from '../pages/ProductDetail';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import OrderSuccess from '../pages/OrderSuccess';
import Orders from '../pages/Orders';
import TryOn from '../pages/TryOn';
import { SearchResult } from '../pages/SearchResult';
import { BookMark } from '../pages/BookMark';
import { BookmarkTrash } from '../pages/BookmarkTrash';
import { SearchHistory } from '../pages/SearchHistory';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import AboutStory from '../pages/AboutStory';

// Admin Portal Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminProducts from '../pages/admin/AdminProducts';
import AdminOrders from '../pages/admin/AdminOrders';
import { AdminIndexing } from '../pages/admin/AdminIndexing';
import { AdminUser } from '../pages/admin/AdminUser';
import { AdminJobDetail } from '../pages/admin/AdminJobDetail';
import { AdminTrash } from '../pages/admin/AdminTrash';

import AdminRoute from './AdminRoute';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth Pages */}
      <Route
        path="/login"
        element={
          <AuthLayout>
            <Login />
          </AuthLayout>
        }
      />
      <Route
        path="/register"
        element={
          <AuthLayout>
            <Register />
          </AuthLayout>
        }
      />

      {/* Public Storefront & E-Commerce Pages */}
      <Route
        path="/"
        element={
          <MainLayout>
            <Home />
          </MainLayout>
        }
      />
      <Route
        path="/catalog"
        element={
          <MainLayout>
            <Catalog />
          </MainLayout>
        }
      />
      <Route
        path="/products/:id"
        element={
          <MainLayout>
            <ProductDetail />
          </MainLayout>
        }
      />
      <Route
        path="/cart"
        element={
          <MainLayout>
            <Cart />
          </MainLayout>
        }
      />
      <Route
        path="/checkout"
        element={
          <MainLayout>
            <Checkout />
          </MainLayout>
        }
      />
      <Route
        path="/order-success/:orderId"
        element={
          <MainLayout>
            <OrderSuccess />
          </MainLayout>
        }
      />
      <Route
        path="/orders"
        element={
          <MainLayout>
            <Orders />
          </MainLayout>
        }
      />
      <Route
        path="/try-on"
        element={
          <MainLayout>
            <TryOn />
          </MainLayout>
        }
      />
      <Route
        path="/search-result"
        element={
          <MainLayout>
            <SearchResult />
          </MainLayout>
        }
      />
      <Route
        path="/about"
        element={
          <MainLayout>
            <AboutStory />
          </MainLayout>
        }
      />

      {/* Member Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/bookmarks"
          element={
            <MainLayout>
              <BookMark />
            </MainLayout>
          }
        />
        <Route
          path="/bookmarks/trash"
          element={
            <MainLayout>
              <BookmarkTrash />
            </MainLayout>
          }
        />
        <Route
          path="/search-history"
          element={
            <MainLayout>
              <SearchHistory />
            </MainLayout>
          }
        />
      </Route>

      {/* Admin Portal Protected Routes */}
      <Route element={<AdminRoute />}>
        <Route
          path="/admin"
          element={
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminLayout>
              <AdminProducts />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminLayout>
              <AdminOrders />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/indexing"
          element={
            <AdminLayout>
              <AdminIndexing />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/indexing/:jobId"
          element={
            <AdminLayout>
              <AdminJobDetail />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminLayout>
              <AdminUser />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/trash"
          element={
            <AdminLayout>
              <AdminTrash />
            </AdminLayout>
          }
        />
      </Route>
    </Routes>
  );
}
