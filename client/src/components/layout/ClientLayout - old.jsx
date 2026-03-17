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
  const [storeSettings, setStore] = useState({})
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
    api.get('/cms/public').then(r => {
      const pages = r.data.data || []
      setCmsPages(pages.filter(p => p.menu_location && p.menu_location !== 'none'))
    }).catch(() => {})
    api.get('/settings').then(r => setStore(r.data.data || {})).catch(() => {})
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
              {storeSettings.logo_url
                ? <img src={storeSettings.logo_url} alt={storeSettings.store_name || 'Logo'} className="h-9 w-auto object-contain max-w-[140px]" />
                : <>
                    <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-display font-bold text-xl text-gray-900">
                      {storeSettings.logo_text || storeSettings.store_name || <>Market<span className="text-primary-500">Pro</span></>}
                    </span>
                  </>
              }
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((l) => {
                const fullPath = location.pathname + location.search
                const active = l.to.includes('?')
                  ? fullPath === l.to
                  : location.pathname === l.to
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150
                      ${active ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                  >
                    {l.label}
                  </Link>
                )
              })}
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
              {NAV_LINKS.map((l) => {
                const fullPath = location.pathname + location.search
                const active = l.to.includes('?') ? fullPath === l.to : location.pathname === l.to
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors
                      ${active ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {l.label}
                  </Link>
                )
              })}
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
              {storeSettings.logo_url
                ? <img src={storeSettings.logo_url} alt={storeSettings.store_name || 'Logo'} className="h-8 w-auto object-contain max-w-[120px] brightness-0 invert opacity-90" />
                : <>
                    <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-display font-bold text-xl">
                      {storeSettings.store_name || <span>Market<span className="text-primary-400">Pro</span></span>}
                    </span>
                  </>
              }
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {storeSettings.footer_description || 'Premium products, delivered fast. Shop with confidence.'}
            </p>
            {/* Social links */}
            {(storeSettings.social_instagram || storeSettings.social_twitter || storeSettings.social_facebook || storeSettings.social_youtube) && (
              <div className="flex gap-3 mt-4">
                {storeSettings.social_instagram && <a href={storeSettings.social_instagram} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-primary-400 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>}
                {storeSettings.social_twitter && <a href={storeSettings.social_twitter} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-primary-400 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>}
                {storeSettings.social_facebook && <a href={storeSettings.social_facebook} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-primary-400 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>}
                {storeSettings.social_youtube && <a href={storeSettings.social_youtube} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-primary-400 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>}
              </div>
            )}
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
