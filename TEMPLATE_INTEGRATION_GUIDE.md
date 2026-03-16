# 🔄 React Template Integration Guide
## Connecting Any New React Template to the MarketPro Server & Admin

This guide walks you **step-by-step** through wiring a new React template
into the existing backend. Every file that needs to change is listed,
with exactly what to keep, what to replace, and what new code to paste.

---

## 📋 Table of Contents

1. [Understand What to Keep vs Replace](#1-understand-what-to-keep-vs-replace)
2. [Install Dependencies](#2-install-dependencies)
3. [Environment & Vite Config](#3-environment--vite-config)
4. [main.jsx — App Entry Point](#4-mainjsx--app-entry-point)
5. [Store — Redux State (never change)](#5-store--redux-state-never-change)
6. [api/axios.js — HTTP Client (never change)](#6-apiaxxiosjs--http-client-never-change)
7. [App.jsx — Router](#7-appjsx--router)
8. [ClientLayout — Header & Footer](#8-clientlayout--header--footer)
9. [AdminLayout — Sidebar](#9-adminlayout--sidebar)
10. [CartDrawer Component](#10-cartdrawer-component)
11. [ProductCard Component](#11-productcard-component)
12. [Client Pages — What to Wire](#12-client-pages--what-to-wire)
13. [Admin Pages — What to Wire](#13-admin-pages--what-to-wire)
14. [index.css — Global Styles](#14-indexcss--global-styles)
15. [Tailwind Config](#15-tailwind-config)
16. [Quick Wiring Cheatsheet](#16-quick-wiring-cheatsheet)

---

## 1. Understand What to Keep vs Replace

```
YOUR NEW TEMPLATE          WHAT TO DO
──────────────────────     ──────────────────────────────────────────
Design / HTML / CSS   →    ✅ USE — this is your new look
Components (Header,   →    ✅ USE — but wire Redux into them (see below)
  Footer, Cards, etc)
Routing (pages)       →    ⚠️  ADAPT — keep route paths, swap page content

EXISTING MARKETPRO         WHAT TO DO
──────────────────────     ──────────────────────────────────────────
store/                →    🔒 KEEP EXACTLY — all Redux slices unchanged
api/axios.js          →    🔒 KEEP EXACTLY — JWT refresh logic stays
App.jsx (routes list) →    🔒 KEEP EXACTLY — all route paths stay
Admin pages           →    🔒 KEEP EXACTLY — admin dashboard is complete
server/               →    🔒 NEVER TOUCH — backend is separate
```

**Golden rule:** the store and API layer are the "brain". The template is
just the "skin". You swap the skin, never the brain.

---

## 2. Install Dependencies

Your new template may need extra packages. Always keep the existing ones:

```bash
cd client

# These MUST stay — they power the data layer
npm install @reduxjs/toolkit react-redux react-router-dom axios react-hot-toast

# Add your template's dependencies on top
# e.g. if template uses Swiper:
npm install swiper
# e.g. if template uses Framer Motion:
npm install framer-motion
# e.g. if template uses React Query instead of Redux — DON'T replace Redux,
# just add React Query for server state if you want, keep Redux for UI state
```

---

## 3. Environment & Vite Config

**`client/.env.local`** — create this file:
```
VITE_API_URL=http://localhost:8000/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

**`client/vite.config.js`** — keep the `@` alias, it's used everywhere:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // ← MUST KEEP — used in all imports
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

---

## 4. main.jsx — App Entry Point

**`src/main.jsx`** — Keep exactly as-is. The only thing that matters here
is that `<Provider store={store}>` wraps everything:

```jsx
// src/main.jsx — DO NOT CHANGE
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './App'
import './index.css'           // ← swap this to your template's global CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>   {/* ← MUST wrap everything */}
      <App />
    </Provider>
  </React.StrictMode>
)
```

**Only change:** swap `'./index.css'` to your template's CSS entry file.

---

## 5. Store — Redux State (never change)

**`src/store/`** — **Leave every file untouched.**

```
store/
  index.js              ← DO NOT CHANGE
  slices/
    authSlice.js        ← DO NOT CHANGE  (login, register, logout, user)
    cartSlice.js        ← DO NOT CHANGE  (cart items, totals, add/remove)
    wishlistSlice.js    ← DO NOT CHANGE  (wishlist items, ids)
    productSlice.js     ← DO NOT CHANGE  (products list, categories, brands)
    uiSlice.js          ← DO NOT CHANGE  (cartOpen, menuOpen, searchOpen)
```

**How to USE store data in your template components:**

```jsx
import { useSelector, useDispatch } from 'react-redux'

// ── Auth ──────────────────────────────────────────────────────────────
const { user, loading }              = useSelector(s => s.auth)
const dispatch                       = useDispatch()

// ── Cart ──────────────────────────────────────────────────────────────
const { items, total, item_count }   = useSelector(s => s.cart)

// ── Wishlist ──────────────────────────────────────────────────────────
const { items: wishItems, ids }      = useSelector(s => s.wishlist)
// ids = ['productId1', 'productId2', ...] — use for isWishlisted check

// ── Products ──────────────────────────────────────────────────────────
const { list, categories, brands, loading, pagination } = useSelector(s => s.products)

// ── UI (drawer/menu open state) ───────────────────────────────────────
const { cartOpen, menuOpen }         = useSelector(s => s.ui)
```

**All available dispatch actions:**

```jsx
// Auth
import { login, register, logout, fetchMe } from '@/store/slices/authSlice'
dispatch(login({ email, password }))
dispatch(register({ name, email, password }))
dispatch(logout())

// Cart
import { fetchCart, addToCart, updateCartItem, clearCart } from '@/store/slices/cartSlice'
dispatch(addToCart({ product_id: '...', quantity: 1, variant: 'Red/L' }))
dispatch(updateCartItem({ productId: '...', quantity: 2 }))  // quantity 0 = remove
dispatch(clearCart())

// Wishlist
import { fetchWishlist, toggleWishlist } from '@/store/slices/wishlistSlice'
dispatch(toggleWishlist(productId))  // toggles on/off, shows toast

// Products
import { fetchProducts, fetchProduct, fetchCategories, fetchBrands, setFilters } from '@/store/slices/productSlice'
dispatch(fetchProducts({ page: 1, category: 'id', sort: 'price_asc' }))
dispatch(fetchProduct(productId))
dispatch(fetchCategories())
dispatch(fetchBrands())

// UI
import { toggleCart, closeCart, toggleMenu } from '@/store/slices/uiSlice'
dispatch(toggleCart())   // open/close cart drawer
dispatch(closeCart())
```

---

## 6. api/axios.js — HTTP Client (never change)

**`src/api/axios.js`** — **Leave untouched.**

This file handles:
- Base URL from `VITE_API_URL`
- Auto-attach JWT Bearer token to every request
- Auto-refresh token on 401 and retry the request
- Redirect to `/login` if refresh fails

If your template has its own fetch utility, **don't use it for API calls**.
Always import `api` from `@/api/axios`:

```jsx
import api from '@/api/axios'

// Then use it like fetch:
const res = await api.get('/products')
const res = await api.post('/orders', orderData)
const res = await api.put(`/products/${id}`, productData)
const res = await api.delete(`/products/${id}`)
```

---

## 7. App.jsx — Router

**`src/App.jsx`** — Keep the route structure. Only change the imported
page components if you rename/move them.

```jsx
// src/App.jsx — keep all routes, only swap import paths if needed
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
import { fetchMe } from '@/store/slices/authSlice'
import { fetchCart } from '@/store/slices/cartSlice'
import { fetchWishlist } from '@/store/slices/wishlistSlice'
import { fetchCategories, fetchBrands } from '@/store/slices/productSlice'

// ↓↓ Swap ONLY these import paths to match your new file names ↓↓
import ClientLayout from '@/components/layout/ClientLayout'   // your new layout
import AdminLayout  from '@/components/layout/AdminLayout'    // keep as-is

import HomePage      from '@/pages/client/HomePage'
import ProductsPage  from '@/pages/client/ProductsPage'
// ... etc

export default function App() {
  const dispatch = useDispatch()
  const { accessToken } = useSelector(s => s.auth)

  // ── MUST KEEP: boot sequence loads user + cart + wishlist on startup ──
  useEffect(() => {
    dispatch(fetchCategories())
    dispatch(fetchBrands())
    if (accessToken) {
      dispatch(fetchMe())
      dispatch(fetchCart())
      dispatch(fetchWishlist())
    } else {
      dispatch({ type: 'auth/me/rejected' })
    }
  }, [dispatch, accessToken])

  return (
    <BrowserRouter>
      <Toaster position="top-right" />  {/* ← keep for toast notifications */}
      <Routes>
        {/* Client routes — keep ALL paths exactly as-is */}
        <Route path="/"              element={<ClientLayout />}>
          <Route index               element={<HomePage />} />
          <Route path="products"     element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="cart"         element={<CartPage />} />
          <Route path="wishlist"     element={<WishlistPage />} />
          <Route path="checkout"     element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="orders"       element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="orders/:id"   element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="profile"      element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="login"        element={<LoginPage />} />
          <Route path="register"     element={<RegisterPage />} />
        </Route>

        {/* Admin routes — keep ALL paths exactly as-is */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route index                 element={<AdminDashboard />} />
          <Route path="products"       element={<AdminProducts />} />
          <Route path="products/new"   element={<AdminProductForm />} />
          <Route path="products/:id"   element={<AdminProductForm />} />
          <Route path="categories"     element={<AdminCategories />} />
          <Route path="brands"         element={<AdminBrands />} />
          <Route path="orders"         element={<AdminOrders />} />
          <Route path="customers"      element={<AdminCustomers />} />
          <Route path="wishlist-stats" element={<AdminWishlistStats />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

---

## 8. ClientLayout — Header & Footer

**`src/components/layout/ClientLayout.jsx`** — This is the main file you
replace with your template's design. Wire these Redux hooks into it:

```jsx
// src/components/layout/ClientLayout.jsx
import { Outlet } from 'react-router-dom'           // ← MUST: renders child pages
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { logout } from '@/store/slices/authSlice'
import { toggleCart } from '@/store/slices/uiSlice'
import CartDrawer from '@/components/cart/CartDrawer' // ← MUST include

export default function ClientLayout() {
  const dispatch    = useDispatch()
  const { user }    = useSelector(s => s.auth)
  const { item_count } = useSelector(s => s.cart)       // cart badge number
  const { ids }     = useSelector(s => s.wishlist)      // wishlist badge number
  const { cartOpen } = useSelector(s => s.ui)

  // ── Replace the JSX below with your template's header/footer ──────────

  return (
    <div>
      {/* ── YOUR TEMPLATE HEADER ── */}
      <header>
        {/* Logo — use Link to="/" */}
        <Link to="/">MyStore</Link>

        {/* Navigation links */}
        <nav>
          <Link to="/">Home</Link>
          <Link to="/products">Shop</Link>
          <Link to="/products?on_sale=true">Sale</Link>
        </nav>

        {/* Cart icon — dispatch(toggleCart()) to open drawer */}
        <button onClick={() => dispatch(toggleCart())}>
          Cart ({item_count})
        </button>

        {/* Wishlist icon */}
        <Link to="/wishlist">♡ ({ids.length})</Link>

        {/* User menu */}
        {user ? (
          <>
            <Link to="/profile">{user.name}</Link>
            <Link to="/orders">Orders</Link>
            {(user.role === 'admin') && <Link to="/admin">Admin</Link>}
            <button onClick={() => dispatch(logout())}>Logout</button>
          </>
        ) : (
          <Link to="/login">Sign In</Link>
        )}
      </header>

      {/* ── MUST: Cart Drawer (hidden until cartOpen=true) ── */}
      <CartDrawer />

      {/* ── MUST: renders the current page ── */}
      <main>
        <Outlet />
      </main>

      {/* ── YOUR TEMPLATE FOOTER ── */}
      <footer>
        Footer content here
      </footer>
    </div>
  )
}
```

**Key points for the header:**

| Feature | Code |
|---|---|
| Open cart drawer | `dispatch(toggleCart())` |
| Cart badge count | `useSelector(s => s.cart.item_count)` |
| Wishlist badge count | `useSelector(s => s.wishlist.ids.length)` |
| Current user | `useSelector(s => s.auth.user)` — null if logged out |
| Logout | `dispatch(logout())` |
| Admin link (only for admins) | `user?.role === 'admin' \|\| user?.role === 'superadmin'` |
| `<Outlet />` | **Required** — renders the page content |
| `<CartDrawer />` | **Required** — the slide-in cart |

---

## 9. AdminLayout — Sidebar

**`src/components/layout/AdminLayout.jsx`** — You can replace the visual
design but these wires must stay:

```jsx
// src/components/layout/AdminLayout.jsx
import { Outlet } from 'react-router-dom'   // ← renders admin page content
import { Link, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '@/store/slices/authSlice'

// These are all the admin sidebar navigation links — keep all paths
const NAV_LINKS = [
  { label: 'Dashboard',      to: '/admin' },
  { label: 'Products',       to: '/admin/products' },
  { label: 'Categories',     to: '/admin/categories' },
  { label: 'Brands',         to: '/admin/brands' },
  { label: 'Orders',         to: '/admin/orders' },
  { label: 'Customers',      to: '/admin/customers' },
  { label: 'Wishlist Stats', to: '/admin/wishlist-stats' },
]

export default function AdminLayout() {
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)

  return (
    <div style={{ display: 'flex' }}>
      {/* ── YOUR TEMPLATE SIDEBAR ── */}
      <aside>
        <div>Admin Panel</div>
        <nav>
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{ fontWeight: location.pathname === link.to ? 'bold' : 'normal' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div>
          <span>{user?.name}</span>
          <button onClick={() => dispatch(logout())}>Logout</button>
        </div>
      </aside>

      {/* ── MUST: renders the admin page content ── */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  )
}
```

---

## 10. CartDrawer Component

**`src/components/cart/CartDrawer.jsx`** — Replace the design but keep
all this logic. The drawer needs:
- `cartOpen` from `s.ui` to show/hide
- `items`, `total` from `s.cart`
- `dispatch(closeCart())` to close
- `dispatch(updateCartItem({...}))` to change quantity

```jsx
// src/components/cart/CartDrawer.jsx — key wires to keep
import { useSelector, useDispatch } from 'react-redux'
import { closeCart } from '@/store/slices/uiSlice'
import { updateCartItem } from '@/store/slices/cartSlice'
import { Link } from 'react-router-dom'

export default function CartDrawer() {
  const dispatch = useDispatch()
  const { cartOpen } = useSelector(s => s.ui)
  const { items, total, loading } = useSelector(s => s.cart)

  // ── Replace JSX with your template's cart drawer design ──
  if (!cartOpen) return null   // or use CSS to hide/show

  return (
    <div className="cart-drawer">
      <button onClick={() => dispatch(closeCart())}>✕ Close</button>

      {items.map(item => (
        <div key={item.product_id}>
          <img src={item.product?.images?.[0]} alt={item.product?.name} />
          <span>{item.product?.name}</span>
          <span>₹{item.product?.price}</span>

          {/* Decrease qty / remove if 0 */}
          <button onClick={() =>
            dispatch(updateCartItem({ productId: item.product_id, quantity: item.quantity - 1 }))
          }>−</button>
          <span>{item.quantity}</span>
          {/* Increase qty */}
          <button onClick={() =>
            dispatch(updateCartItem({ productId: item.product_id, quantity: item.quantity + 1 }))
          }>+</button>
        </div>
      ))}

      <div>Total: ₹{total}</div>
      <Link to="/checkout" onClick={() => dispatch(closeCart())}>Checkout</Link>
    </div>
  )
}
```

---

## 11. ProductCard Component

**`src/components/product/ProductCard.jsx`** — Replace the card design,
keep these wires:

```jsx
// src/components/product/ProductCard.jsx — key wires
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { addToCart } from '@/store/slices/cartSlice'
import { toggleWishlist } from '@/store/slices/wishlistSlice'

export default function ProductCard({ product }) {
  const dispatch = useDispatch()
  const { ids: wishIds } = useSelector(s => s.wishlist)
  const isWishlisted = wishIds.includes(product.id)  // true/false

  // product shape from API:
  // product.id, product.name, product.price, product.compare_price
  // product.images[] (array of URLs), product.avg_rating, product.review_count
  // product.brand?.name, product.category?.name
  // product.is_on_sale, product.is_new_arrival, product.is_featured
  // product.stock (0 = out of stock)

  return (
    <div className="product-card">
      {/* Image — link to detail page */}
      <Link to={`/products/${product.id}`}>
        <img src={product.images?.[0]} alt={product.name} />
      </Link>

      {/* Badges */}
      {product.is_on_sale && <span>SALE</span>}
      {product.is_new_arrival && <span>NEW</span>}

      {/* Wishlist toggle */}
      <button onClick={() => dispatch(toggleWishlist(product.id))}>
        {isWishlisted ? '♥' : '♡'}
      </button>

      {/* Info */}
      <Link to={`/products/${product.id}`}>{product.name}</Link>
      <div>₹{product.price}</div>
      {product.compare_price > product.price && (
        <del>₹{product.compare_price}</del>
      )}

      {/* Add to cart */}
      <button
        disabled={product.stock === 0}
        onClick={() => dispatch(addToCart({ product_id: product.id, quantity: 1 }))}
      >
        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  )
}
```

---

## 12. Client Pages — What to Wire

For each page, here's the minimum data-wiring needed:

### `pages/client/HomePage.jsx`
```jsx
import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
import { fetchProducts } from '@/store/slices/productSlice'

export default function HomePage() {
  const dispatch = useDispatch()
  const { list: products, categories, loading } = useSelector(s => s.products)

  useEffect(() => {
    dispatch(fetchProducts({ featured: true, limit: 8 }))  // load featured
  }, [dispatch])

  // Render your template's home page using:
  // products  — featured products array
  // categories — categories array (for category grid)
  // loading   — boolean skeleton state
}
```

### `pages/client/ProductsPage.jsx`
```jsx
import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchProducts } from '@/store/slices/productSlice'

export default function ProductsPage() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const { list, pagination, categories, brands, loading } = useSelector(s => s.products)

  useEffect(() => {
    // Pass all URL params as filters to the API
    const params = Object.fromEntries(searchParams.entries())
    dispatch(fetchProducts(params))
  }, [searchParams, dispatch])

  // Filter update helper — call this when user changes a filter
  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.set('page', '1')
    setSearchParams(next)
  }

  // Render your template's products listing using:
  // list         — array of products
  // pagination   — { page, limit, total, pages }
  // categories   — for filter sidebar
  // brands       — for filter sidebar
  // loading      — boolean
  // updateFilter — call with (key, value) to filter
}
```

### `pages/client/ProductDetail.jsx`
```jsx
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchProduct, clearCurrentProduct } from '@/store/slices/productSlice'
import { addToCart } from '@/store/slices/cartSlice'
import { toggleWishlist } from '@/store/slices/wishlistSlice'

export default function ProductDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { currentProduct: product, productLoading } = useSelector(s => s.products)
  const { ids: wishIds } = useSelector(s => s.wishlist)
  const [qty, setQty] = useState(1)
  const isWishlisted = wishIds.includes(product?.id)

  useEffect(() => {
    dispatch(fetchProduct(id))
    return () => dispatch(clearCurrentProduct())  // cleanup on unmount
  }, [id, dispatch])

  // product shape:
  // product.id, name, price, compare_price, description, short_description
  // product.images[] — array of image URLs
  // product.youtube_url — YouTube embed URL (if set)
  // product.brand, product.category
  // product.variants[] — [{name, price, stock}, ...]
  // product.avg_rating, review_count, stock

  return (
    <div>
      {/* Your template's product detail design */}
      <button onClick={() => dispatch(addToCart({ product_id: product?.id, quantity: qty }))}>
        Add to Cart
      </button>
      <button onClick={() => dispatch(toggleWishlist(product?.id))}>
        {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      </button>

      {/* YouTube embed — product.youtube_url */}
      {product?.youtube_url && (
        <iframe src={product.youtube_url.replace('watch?v=', 'embed/')} allowFullScreen />
      )}
    </div>
  )
}
```

### `pages/client/LoginPage.jsx`
```jsx
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login } from '@/store/slices/authSlice'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector(s => s.auth)

  const handleSubmit = async ({ email, password }) => {
    const result = await dispatch(login({ email, password }))
    if (!result.error) navigate('/')  // redirect on success
  }

  // Render your template's login form
  // Call handleSubmit({ email, password }) on form submit
  // Use loading for disabled/spinner state
}
```

### `pages/client/CheckoutPage.jsx`
```jsx
import api from '@/api/axios'
import { useSelector, useDispatch } from 'react-redux'
import { fetchCart } from '@/store/slices/cartSlice'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const { items, total } = useSelector(s => s.cart)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const placeOrder = async (addressData, paymentMethod) => {
    try {
      const res = await api.post('/orders', {
        shipping_address: addressData,
        payment_method: paymentMethod,  // 'cod' | 'upi' | 'card'
      })
      dispatch(fetchCart())  // clears cart after order
      navigate(`/orders/${res.data.data.id}`)
      toast.success('Order placed!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed')
    }
  }
}
```

### `pages/client/OrdersPage.jsx` and `OrderDetail.jsx`
```jsx
// Use api directly — not in Redux store
import api from '@/api/axios'
import { useEffect, useState } from 'react'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders').then(r => setOrders(r.data.data)).finally(() => setLoading(false))
  }, [])

  // order shape:
  // order.id, status, total, created_at
  // order.items[] — [{name, price, quantity, image}, ...]
  // order.shipping_address, payment_method, tracking_number
}
```

### `pages/client/WishlistPage.jsx`
```jsx
import { useSelector, useDispatch } from 'react-redux'
import { toggleWishlist } from '@/store/slices/wishlistSlice'
import { addToCart } from '@/store/slices/cartSlice'

export default function WishlistPage() {
  const dispatch = useDispatch()
  const { items, loading } = useSelector(s => s.wishlist)

  // item shape:
  // item.product_id, item.product.name, item.product.price
  // item.product.images[], item.product.compare_price
}
```

### `pages/client/ProfilePage.jsx`
```jsx
import { useSelector, useDispatch } from 'react-redux'
import { updateProfile } from '@/store/slices/authSlice'

export default function ProfilePage() {
  const dispatch = useDispatch()
  const { user, loading } = useSelector(s => s.auth)

  const handleSave = (formData) => {
    dispatch(updateProfile(formData))  // { name, phone, avatar }
  }
}
```

---

## 13. Admin Pages — What to Wire

**Admin pages use `api` directly (not Redux store)** since admin data
doesn't need global state. Keep all admin pages as-is — only replace
the visual design if needed:

```jsx
// Pattern used by ALL admin pages:
import api from '@/api/axios'
import { useEffect, useState } from 'react'

// ── AdminDashboard ─────────────────────────────────────────────────────
// GET /admin/dashboard → { stats, recent_orders, top_wishlisted_products }

// ── AdminProducts ──────────────────────────────────────────────────────
// GET /products/admin/list?page=1&limit=20&search=...
// DELETE /products/:id

// ── AdminProductForm ───────────────────────────────────────────────────
// POST  /products (create)
// PUT   /products/:id (update)
// POST  /upload/images (multipart, Cloudinary upload)
// POST  /upload/image-url { url, folder } (URL upload)

// ── AdminCategories ────────────────────────────────────────────────────
// GET    /categories/all
// POST   /categories
// PUT    /categories/:id
// DELETE /categories/:id

// ── AdminBrands ────────────────────────────────────────────────────────
// GET    /brands
// POST   /brands
// PUT    /brands/:id
// DELETE /brands/:id

// ── AdminOrders ────────────────────────────────────────────────────────
// GET /admin/orders?page=1&status=pending
// PUT /admin/orders/:id/status { status, tracking_number }

// ── AdminCustomers ─────────────────────────────────────────────────────
// GET /admin/customers?page=1

// ── AdminWishlistStats ─────────────────────────────────────────────────
// GET /admin/wishlist-stats
```

---

## 14. index.css — Global Styles

**Replace the body of `src/index.css` with your template's CSS.**
Keep these Tailwind directives at the top if you're using Tailwind:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Your template's global styles below */
```

If your template uses plain CSS or SCSS instead of Tailwind, just
remove the `@tailwind` lines and import your template's CSS file
in `main.jsx` instead.

---

## 15. Tailwind Config

If your template uses **different colors** from Tailwind, update
`tailwind.config.js` to match:

```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Replace with your template's primary color
        primary: {
          50:  '#...',
          500: '#...',
          600: '#...',
        },
      },
      fontFamily: {
        // Replace with your template's fonts
        body:    ['Your Font', 'sans-serif'],
        display: ['Your Display Font', 'serif'],
      },
    },
  },
}
```

---

## 16. Quick Wiring Cheatsheet

Print this out and tick off each item:

```
SETUP
□ npm install (keep existing packages + add template's)
□ .env.local has VITE_API_URL=http://localhost:8000/api
□ vite.config.js has @ alias pointing to ./src

NEVER CHANGE THESE
□ src/store/index.js
□ src/store/slices/authSlice.js
□ src/store/slices/cartSlice.js
□ src/store/slices/wishlistSlice.js
□ src/store/slices/productSlice.js
□ src/store/slices/uiSlice.js
□ src/api/axios.js
□ All files in src/pages/admin/

MUST WIRE IN EVERY LAYOUT/COMPONENT
□ ClientLayout:   <Outlet /> renders child pages
□ ClientLayout:   <CartDrawer /> included
□ ClientLayout:   dispatch(toggleCart()) for cart icon
□ ClientLayout:   useSelector(s => s.cart.item_count) for badge
□ ClientLayout:   useSelector(s => s.auth.user) for user menu
□ AdminLayout:    <Outlet /> renders admin pages
□ CartDrawer:     useSelector(s => s.ui.cartOpen) for open/close
□ ProductCard:    dispatch(addToCart({...})) for add button
□ ProductCard:    dispatch(toggleWishlist(id)) for heart button
□ ProductCard:    Link to={/products/${product.id}} for card click

PER-PAGE DATA HOOKS
□ HomePage:       dispatch(fetchProducts({ featured: true }))
□ ProductsPage:   dispatch(fetchProducts(searchParams))
□ ProductDetail:  dispatch(fetchProduct(id))
□ LoginPage:      dispatch(login({ email, password }))
□ RegisterPage:   dispatch(register({ name, email, password }))
□ WishlistPage:   useSelector(s => s.wishlist.items)
□ CartPage:       useSelector(s => s.cart)
□ ProfilePage:    dispatch(updateProfile(data))
□ CheckoutPage:   api.post('/orders', { shipping_address, payment_method })
□ OrdersPage:     api.get('/orders')

App.jsx BOOT SEQUENCE (in useEffect)
□ dispatch(fetchCategories())
□ dispatch(fetchBrands())
□ if (accessToken) dispatch(fetchMe())
□ if (accessToken) dispatch(fetchCart())
□ if (accessToken) dispatch(fetchWishlist())
```

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| `<Outlet />` missing from layout | Page content won't render at all |
| `<CartDrawer />` missing from layout | Cart icon clicks do nothing |
| Forgot `dispatch(fetchCategories())` in App.jsx | Category filters empty |
| Calling `bool(db)` in Python after template change triggers new API | Already fixed in server — not a concern |
| Using template's own fetch instead of `api` from `@/api/axios` | JWT won't attach, all authenticated requests return 401 |
| Changing route paths in App.jsx | Admin dashboard links break, Flutter integration breaks |
| Replacing store files | All data goes offline |
