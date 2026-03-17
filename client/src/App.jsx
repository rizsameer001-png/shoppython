import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMe } from '@/store/slices/authSlice'
import { fetchCart } from '@/store/slices/cartSlice'
import { fetchWishlist } from '@/store/slices/wishlistSlice'
import { fetchCategories, fetchBrands } from '@/store/slices/productSlice'

// Layouts
import ClientLayout from '@/components/layout/ClientLayout'
import AdminLayout  from '@/components/layout/AdminLayout'

// Client pages
import HomePage        from '@/pages/client/HomePage'
import ProductsPage    from '@/pages/client/ProductsPage'
import ProductDetail   from '@/pages/client/ProductDetail'
import CartPage        from '@/pages/client/CartPage'
import WishlistPage    from '@/pages/client/WishlistPage'
import CheckoutPage    from '@/pages/client/CheckoutPage'
import OrdersPage      from '@/pages/client/OrdersPage'
import OrderDetail     from '@/pages/client/OrderDetail'
import ProfilePage     from '@/pages/client/ProfilePage'
import LoginPage       from '@/pages/client/LoginPage'
import RegisterPage    from '@/pages/client/RegisterPage'

// Admin pages
import AdminDashboard     from '@/pages/admin/AdminDashboard'
import AdminProducts      from '@/pages/admin/AdminProducts'
import AdminProductForm   from '@/pages/admin/AdminProductForm'
import AdminCategories    from '@/pages/admin/AdminCategories'
import AdminBrands        from '@/pages/admin/AdminBrands'
import AdminOrders        from '@/pages/admin/AdminOrders'
import AdminCustomers     from '@/pages/admin/AdminCustomers'
import AdminWishlistStats from '@/pages/admin/AdminWishlistStats'
import AdminAttributes  from '@/pages/admin/AdminAttributes'
import AdminBlog        from '@/pages/admin/AdminBlog'
import AdminBanners     from '@/pages/admin/AdminBanners'
import AdminBulkImport  from '@/pages/admin/AdminBulkImport'
import AdminCMS         from '@/pages/admin/AdminCMS'
import AdminSettings    from '@/pages/admin/AdminSettings'
import BlogPage         from '@/pages/client/BlogPage'
import BlogPostPage     from '@/pages/client/BlogPostPage'
import CmsPage          from '@/pages/client/CmsPage'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, initialized } = useSelector((s) => s.auth)
  const location = useLocation()

  // Show spinner only while auth state is loading — prevents flash redirects
  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // Not logged in — go to login, remember where they wanted to go
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Logged in but not admin — redirect to home, NOT to /login (already logged in)
  if (adminOnly && user.role !== 'admin' && user.role !== 'superadmin') {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  const dispatch = useDispatch()
  const { accessToken } = useSelector((s) => s.auth)

  useEffect(() => {
    dispatch(fetchCategories())
    dispatch(fetchBrands())
    if (accessToken) {
      dispatch(fetchMe())
      dispatch(fetchCart())
      dispatch(fetchWishlist())
    } else {
      // mark initialized without user
      dispatch({ type: 'auth/me/rejected' })  // correct: thunk name is 'auth/me'
    }
  }, [dispatch, accessToken])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontFamily: 'DM Sans, sans-serif', borderRadius: '12px', fontSize: '14px' },
          success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* ─── Client ─── */}
        <Route path="/" element={<ClientLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="login"    element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="blog"       element={<BlogPage />} />
          <Route path="blog/:slug" element={<BlogPostPage />} />
          <Route path="pages/:slug" element={<CmsPage />} />
        </Route>

        {/* ─── Admin ─── */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new"  element={<AdminProductForm />} />
          <Route path="products/:id"  element={<AdminProductForm />} />
          <Route path="categories"    element={<AdminCategories />} />
          <Route path="brands"        element={<AdminBrands />} />
          <Route path="orders"        element={<AdminOrders />} />
          <Route path="customers"     element={<AdminCustomers />} />
          <Route path="wishlist-stats"  element={<AdminWishlistStats />} />
          <Route path="attributes"     element={<AdminAttributes />} />
          <Route path="blog"           element={<AdminBlog />} />
          <Route path="banners"        element={<AdminBanners />} />
          <Route path="bulk"           element={<AdminBulkImport />} />
          <Route path="cms"            element={<AdminCMS />} />
          <Route path="settings"        element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
