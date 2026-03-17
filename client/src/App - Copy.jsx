import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, initialized } = useSelector((s) => s.auth)
  if (!initialized) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin' && user.role !== 'superadmin') return <Navigate to="/" replace />
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
      dispatch({ type: 'auth/me/rejected' })
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
          <Route path="wishlist-stats" element={<AdminWishlistStats />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
