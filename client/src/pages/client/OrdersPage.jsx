import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ChevronRight, Clock, Truck, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import api from '@/api/axios'

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed:  { label: 'Confirmed',  color: 'bg-blue-100 text-blue-700',    icon: CheckCircle },
  processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-700', icon: RefreshCw },
  shipped:    { label: 'Shipped',    color: 'bg-purple-100 text-purple-700', icon: Truck },
  delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-700',      icon: XCircle },
  returned:   { label: 'Returned',   color: 'bg-orange-100 text-orange-700', icon: RefreshCw },
  refunded:   { label: 'Refunded',   color: 'bg-gray-100 text-gray-700',    icon: RefreshCw },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-600', icon: Clock }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders').then(r => { setOrders(r.data.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
      {[1,2,3].map(i => <div key={i} className="card p-5 skeleton h-24" />)}
    </div>
  )

  if (!orders.length) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <Package className="w-20 h-20 text-gray-200 mx-auto mb-6" />
      <h2 className="font-display text-2xl font-bold text-gray-700 mb-2">No orders yet</h2>
      <p className="text-gray-400 mb-8">Your order history will appear here</p>
      <Link to="/products" className="btn-primary">Start Shopping</Link>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="section-title mb-8">My Orders</h1>
      <div className="space-y-4">
        {orders.map(order => (
          <Link key={order.id} to={`/orders/${order.id}`}
            className="card p-5 block hover:shadow-card-hover transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400 font-mono">#{order.id?.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(order.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {order.items?.slice(0,3).map((item, i) => (
                    <div key={i} className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border-2 border-white">
                      {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-gray-500">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg text-primary-600">₹{order.total?.toLocaleString()}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
