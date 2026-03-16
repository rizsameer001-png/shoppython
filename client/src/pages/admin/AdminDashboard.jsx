import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingBag, Users, Tags, DollarSign, TrendingUp, Eye, Heart } from 'lucide-react'
import api from '@/api/axios'

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="card p-6 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        {sub && <p className="text-xs text-green-600 font-semibold mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const STATUS_COLORS = {
  pending:'bg-yellow-100 text-yellow-700', confirmed:'bg-blue-100 text-blue-700',
  processing:'bg-indigo-100 text-indigo-700', shipped:'bg-purple-100 text-purple-700',
  delivered:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700',
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard').then(r => { setData(r.data.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
    </div>
  )

  const stats = data?.stats || {}
  const STAT_CARDS = [
    { label: 'Total Revenue',   value: `₹${(stats.total_revenue||0).toLocaleString()}`, icon: DollarSign, color: 'bg-green-500',   sub: 'All time' },
    { label: 'Total Orders',    value: stats.total_orders || 0,    icon: ShoppingBag, color: 'bg-blue-500' },
    { label: 'Total Products',  value: stats.total_products || 0,  icon: Package,     color: 'bg-primary-500' },
    { label: 'Customers',       value: stats.total_users || 0,     icon: Users,       color: 'bg-purple-500' },
    { label: 'Categories',      value: stats.total_categories || 0,icon: Tags,        color: 'bg-orange-500' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {STAT_CARDS.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-lg text-gray-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-primary-600 hover:text-primary-700 font-semibold">View all →</Link>
          </div>
          {data?.recent_orders?.length === 0 && <p className="text-gray-400 text-sm">No orders yet</p>}
          <div className="space-y-3">
            {data?.recent_orders?.map(order => (
              <Link key={order.id} to={`/admin/orders`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-800">#{order.id?.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{order.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary-600">₹{order.total?.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Wishlisted */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" /> Top Wishlisted
            </h2>
            <Link to="/admin/wishlist-stats" className="text-sm text-primary-600 hover:text-primary-700 font-semibold">View all →</Link>
          </div>
          {!data?.top_wishlisted_products?.length && <p className="text-gray-400 text-sm">No wishlist data yet</p>}
          <div className="space-y-3">
            {data?.top_wishlisted_products?.slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="w-6 text-xs font-bold text-gray-400">#{i+1}</span>
                {p.image && <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">₹{p.price?.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1 text-red-500">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span className="text-sm font-bold">{p.wishlist_count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:'Add Product',  to:'/admin/products/new',    icon:Package,    color:'text-primary-600 bg-primary-50' },
          { label:'Manage Orders',to:'/admin/orders',          icon:ShoppingBag,color:'text-blue-600 bg-blue-50' },
          { label:'Customers',    to:'/admin/customers',       icon:Users,      color:'text-purple-600 bg-purple-50' },
          { label:'Categories',   to:'/admin/categories',      icon:Tags,       color:'text-orange-600 bg-orange-50' },
        ].map(({ label, to, icon: Icon, color }) => (
          <Link key={to} to={to} className={`card p-5 flex flex-col items-center gap-3 hover:shadow-card-hover transition-shadow ${color}`}>
            <Icon className="w-7 h-7" />
            <span className="text-sm font-semibold text-center">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
