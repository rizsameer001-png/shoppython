import { useEffect, useState } from 'react'
import { Users, Search, Mail, Phone, ShoppingBag, Heart } from 'lucide-react'
import api from '@/api/axios'
import toast from 'react-hot-toast'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [total, setTotal]         = useState(0)
  const limit = 20

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const res = await api.get('/admin/customers', { params: { page: p, limit } })
      setCustomers(res.data.data)
      setTotal(res.data.pagination?.total || 0)
    } catch { toast.error('Failed to load customers') }
    setLoading(false)
  }

  useEffect(() => { load(page) }, [page])

  const filtered = search
    ? customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()))
    : customers

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm">{total} registered customers</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9 text-sm py-2.5" placeholder="Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Customer','Email','Phone','Orders','Wishlist','Joined','Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(8).fill(0).map((_, i) => (
                <tr key={i}>{Array(7).fill(0).map((_, j) => (
                  <td key={j} className="px-5 py-4"><div className="skeleton h-4 rounded" /></td>
                ))}</tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                  <p>No customers found</p>
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-600 font-bold text-sm">{c.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <p className="font-semibold text-gray-800">{c.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">{c.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {c.phone ? (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm">{c.phone}</span>
                      </div>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                      <span className="font-semibold text-gray-700">{c.order_count || 0}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-red-400" />
                      <span className="font-semibold text-gray-700">{c.wishlist_count || 0}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={c.is_active !== false ? 'badge-success' : 'badge-danger'}>
                      {c.is_active !== false ? 'Active' : 'Blocked'}
                    </span>
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
    </div>
  )
}
