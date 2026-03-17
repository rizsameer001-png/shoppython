import { useEffect, useState } from 'react'
import { ShoppingBag, Search, Eye, ChevronDown } from 'lucide-react'
import api from '@/api/axios'
import toast from 'react-hot-toast'

const STATUSES = ['','pending','confirmed','processing','shipped','delivered','cancelled','returned','refunded']
const STATUS_COLORS = {
  pending:'bg-yellow-100 text-yellow-700', confirmed:'bg-blue-100 text-blue-700',
  processing:'bg-indigo-100 text-indigo-700', shipped:'bg-purple-100 text-purple-700',
  delivered:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700',
  returned:'bg-orange-100 text-orange-700', refunded:'bg-gray-100 text-gray-600',
}

function StatusBadge({ status }) {
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
}

export default function AdminOrders() {
  const [orders, setOrders]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]           = useState(1)
  const [total, setTotal]         = useState(0)
  const [detailOrder, setDetailOrder] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [tracking, setTracking]   = useState('')
  const [updating, setUpdating]   = useState(false)
  const limit = 20

  const load = async (p = 1, status = '') => {
    setLoading(true)
    try {
      const res = await api.get('/admin/orders', { params: { page: p, limit, ...(status && { status }) } })
      setOrders(res.data.data)
      setTotal(res.data.pagination?.total || 0)
    } catch { toast.error('Failed to load orders') }
    setLoading(false)
  }

  useEffect(() => { load(page, statusFilter) }, [page, statusFilter])

  const openDetail = (order) => {
    setDetailOrder(order)
    setNewStatus(order.status)
    setTracking(order.tracking_number || '')
  }

  const handleUpdateStatus = async () => {
    if (!detailOrder) return
    setUpdating(true)
    try {
      await api.put(`/admin/orders/${detailOrder.id}/status`, { status: newStatus, tracking_number: tracking || undefined })
      toast.success('Order updated!')
      setDetailOrder(null)
      load(page, statusFilter)
    } catch { toast.error('Update failed') }
    setUpdating(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm">{total} orders total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize
              ${statusFilter === s ? 'bg-primary-500 text-white shadow-primary' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Order','Customer','Items','Total','Status','Date','Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(8).fill(0).map((_, i) => (
                <tr key={i}>{Array(7).fill(0).map((_, j) => (
                  <td key={j} className="px-5 py-4"><div className="skeleton h-4 rounded" /></td>
                ))}</tr>
              )) : orders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                  <p>No orders found</p>
                </td></tr>
              ) : orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-mono font-semibold text-gray-800 text-xs">#{order.id?.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400 capitalize">{order.payment_method}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-800 text-sm">{order.customer_name}</p>
                    <p className="text-xs text-gray-400">{order.customer_email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-700">{order.items?.length} items</p>
                    <div className="flex -space-x-1 mt-1">
                      {order.items?.slice(0,3).map((item, i) => item.image && (
                        <img key={i} src={item.image} alt="" className="w-6 h-6 rounded-md border border-white object-cover" />
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-primary-600">₹{order.total?.toLocaleString()}</p>
                    <p className={`text-xs font-semibold capitalize ${order.payment_status==='paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {order.payment_status}
                    </p>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                  <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(order.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => openDetail(order)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > limit && (
          <div className="flex justify-between items-center px-5 py-3.5 border-t border-gray-100">
            <p className="text-xs text-gray-500">{Math.min((page-1)*limit+1,total)}–{Math.min(page*limit,total)} of {total}</p>
            <div className="flex gap-1.5">
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn-ghost text-xs py-1 px-3 disabled:opacity-40">Prev</button>
              <button disabled={page*limit>=total} onClick={()=>setPage(p=>p+1)} className="btn-ghost text-xs py-1 px-3 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {detailOrder && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setDetailOrder(null)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 z-50 max-w-lg mx-auto shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-bold text-xl mb-1">Order #{detailOrder.id?.slice(-8).toUpperCase()}</h3>
            <p className="text-sm text-gray-400 mb-5">{detailOrder.customer_name} · {detailOrder.customer_email}</p>

            {/* Items */}
            <div className="space-y-2 mb-5">
              {detailOrder.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  {item.image && <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                    {item.selected_attributes?.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.selected_attributes.map((a, ai) => (
                          <span key={ai} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                            {a.name}: {a.value}
                          </span>
                        ))}
                      </div>
                    ) : item.variant ? (
                      <p className="text-xs text-gray-400">{item.variant}</p>
                    ) : null}
                    <p className="text-xs text-gray-400 mt-0.5">Qty {item.quantity} × ₹{item.price?.toLocaleString()}</p>
                  </div>
                  <span className="text-sm font-bold text-primary-600">₹{(item.price*item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Address */}
            {detailOrder.shipping_address && (
              <div className="bg-gray-50 rounded-xl p-3 mb-5 text-sm">
                <p className="font-semibold text-gray-700 mb-1">Shipping Address</p>
                <p className="text-gray-600">{detailOrder.shipping_address.street}, {detailOrder.shipping_address.city}, {detailOrder.shipping_address.state} {detailOrder.shipping_address.zip_code}</p>
              </div>
            )}

            {/* Update status */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Update Status</label>
                <select className="input text-sm py-2.5" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  {STATUSES.slice(1).map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>
              {(newStatus === 'shipped' || newStatus === 'delivered') && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Tracking Number</label>
                  <input className="input text-sm py-2.5" placeholder="TRACK123456" value={tracking} onChange={e => setTracking(e.target.value)} />
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setDetailOrder(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleUpdateStatus} disabled={updating} className="btn-primary flex-1">
                  {updating ? 'Updating...' : 'Update Order'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
