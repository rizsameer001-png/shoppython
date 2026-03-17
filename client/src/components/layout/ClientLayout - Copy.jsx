import { Outlet } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  ShoppingCart, Heart, User, Search, Menu, X, ChevronDown,
  Package, LogOut, LayoutDashboard, MapPin
} from 'lucide-react'
import { toggleCart, closeCart } from '@/store/slices/uiSlice'
import { logout } from '@/store/slices/authSlice'
import { updateCartItem } from '@/store/slices/cartSlice'
import CartDrawer from '@/components/cart/CartDrawer'
import api from '@/api/axios'

const NAV_LINKS = [
  { label: 'Home',     to: '/' },
  { label: 'Shop',     to: '/products' },
  { label: 'Deals',    to: '/products?on_sale=true' },
  { label: 'New In',   to: '/products?new_arrival=true' },
  { label: 'Blog',     to: '/blog' },
]

export default function ClientLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((s) => s.auth)
  const { item_count } = useSelector((s) => s.cart)
  const { ids: wishIds } = useSelector((s) => s.wishlist)
  const { cartOpen } = useSelector((s) => s.ui)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [cmsPages, setCmsPages]   = useState([])
  const [searchVal, setSearchVal] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    // Load CMS pages that have menu_location set
    api.get('/cms/public').then(r => {
      const pages = r.data.data || []
      setCmsPages(pages.filter(p => p.menu_location && p.menu_location !== 'none'))
    }).catch(() => {})
  }, [])

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchVal.trim())}`)
      setSearchVal('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── Top bar ── */}
      <div className="bg-primary-500 text-white text-xs text-center py-2 font-body hidden sm:block">
        🎉 Free shipping on orders over ₹500 &nbsp;|&nbsp; Use code <strong>FIRST10</strong> for 10% off your first order
      </div>

      {/* ── Navbar ── */}
      <header className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm border-b border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-gray-900">Market<span className="text-primary-500">Pro</span></span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150
                    ${location.pathname === l.to ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Search */}
            <form onSubmit={handleSearch} className="hidden lg:flex items-center gap-2 flex-1 max-w-sm mx-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-gray-50"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Wishlist */}
              <Link to="/wishlist" className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Heart className="w-5 h-5 text-gray-600" />
                {wishIds.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishIds.length > 9 ? '9+' : wishIds.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button onClick={() => dispatch(toggleCart())} className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                {item_count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item_count > 9 ? '9+' : item_count}
                  </span>
                )}
              </button>

              {/* User */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-xs">{user.name[0].toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 hidden sm:block">{user.name.split(' ')[0]}</span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 animate-slide-down z-50">
                      <div className="px-4 py-2 border-b border-gray-100 mb-1">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      {user.role === 'admin' || user.role === 'superadmin' ? (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                        </Link>
                      ) : null}
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      <Link to="/orders" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Package className="w-4 h-4" /> My Orders
                      </Link>
                      <button
                        onClick={() => { dispatch(logout()); setUserMenuOpen(false) }}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left mt-1 border-t border-gray-100"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="btn-primary py-2 px-4 text-sm ml-1">Sign In</Link>
              )}

              {/* Mobile hamburger */}
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-50">
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden border-t border-gray-100 py-3 animate-slide-down">
              <form onSubmit={handleSearch} className="mb-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="input text-sm flex-1"
                />
                <button type="submit" className="btn-primary py-2 px-4 text-sm">Go</button>
              </form>
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── Cart Drawer ── */}
      <CartDrawer />

      {/* ── Main ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-xl">Market<span className="text-primary-400">Pro</span></span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">Premium products, delivered fast. Shop with confidence.</p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-primary-400 transition-colors">Home</Link></li>
              <li><Link to="/products" className="hover:text-primary-400 transition-colors">Shop</Link></li>
              <li><Link to="/products?new_arrival=true" className="hover:text-primary-400 transition-colors">New Arrivals</Link></li>
              <li><Link to="/products?on_sale=true" className="hover:text-primary-400 transition-colors">Sale</Link></li>
              <li><Link to="/blog" className="hover:text-primary-400 transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Dynamic CMS footer pages */}
          <div>
            <h4 className="font-semibold mb-4">Information</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {cmsPages.filter(p => p.menu_location === 'footer' || p.menu_location === 'both').length > 0
                ? cmsPages.filter(p => p.menu_location === 'footer' || p.menu_location === 'both').map(p => (
                    <li key={p.id}>
                      <Link
                        to={`/pages/${p.slug}`}
                        target={p.open_in_new_tab ? '_blank' : undefined}
                        className="hover:text-primary-400 transition-colors"
                      >
                        {p.title}
                      </Link>
                    </li>
                  ))
                : ['About Us','Privacy Policy','Terms & Conditions','Returns'].map(l => (
                    <li key={l}><span className="text-gray-600">{l}</span></li>
                  ))
              }
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <p>📧 hello@marketpro.com</p>
              <p>📞 +91 98765 43210</p>
              <p>📍 Mumbai, India</p>
            </div>
            <div className="mt-4 flex gap-3">
              <Link to="/pages/about-us" className="text-xs text-gray-500 hover:text-primary-400 transition-colors">About</Link>
              <Link to="/blog" className="text-xs text-gray-500 hover:text-primary-400 transition-colors">Blog</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} MarketPro. All rights reserved.
          {cmsPages.filter(p => p.menu_location === 'footer' || p.menu_location === 'both').length > 0 && (
            <span className="ml-4">
              {cmsPages.filter(p => p.menu_location === 'footer' || p.menu_location === 'both').slice(0,3).map((p, i) => (
                <span key={p.id}>
                  {i > 0 && ' · '}
                  <Link to={`/pages/${p.slug}`} className="hover:text-primary-400 transition-colors">{p.title}</Link>
                </span>
              ))}
            </span>
          )}
        </div>
      </footer>
    </div>
  )
}
