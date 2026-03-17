import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useState } from 'react'
import {
  LayoutDashboard, Package, Tags, Award, ShoppingBag,
  Users, Heart, LogOut, Menu, X, ChevronRight, ShoppingCart
} from 'lucide-react'
import { logout } from '@/store/slices/authSlice'

const NAV = [
  { label: 'Dashboard',     to: '/admin',               icon: LayoutDashboard },
  { label: 'Products',      to: '/admin/products',       icon: Package },
  { label: 'Categories',    to: '/admin/categories',     icon: Tags },
  { label: 'Brands',        to: '/admin/brands',         icon: Award },
  { label: 'Orders',        to: '/admin/orders',         icon: ShoppingBag },
  { label: 'Customers',     to: '/admin/customers',      icon: Users },
  { label: 'Wishlist Stats',to: '/admin/wishlist-stats', icon: Heart },
]

export default function AdminLayout() {
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (to) => to === '/admin'
    ? location.pathname === '/admin'
    : location.pathname.startsWith(to)

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-body">
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-gray-900 text-white
        transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-800 flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg">Market<span className="text-primary-400">Pro</span></span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors ml-auto"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {NAV.map(({ label, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${isActive(to)
                  ? 'bg-primary-500 text-white shadow-primary'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-800 p-3 flex-shrink-0">
          {!collapsed && user && (
            <div className="flex items-center gap-3 mb-2 px-1">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{user.name[0]}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => { dispatch(logout()); navigate('/login') }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-gray-800 text-lg">
            {NAV.find(n => isActive(n.to))?.label || 'Admin'}
          </h1>
          <Link to="/" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View Store →
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
