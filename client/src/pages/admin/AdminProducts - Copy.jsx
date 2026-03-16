import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Search, Eye, Package } from 'lucide-react'
import api from '@/api/axios'
import toast from 'react-hot-toast'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  const fetch = async (p = 1, s = '') => {
    setLoading(true)
    try {
      const res = await api.get('/products/admin/all', { params: { page: p, limit, ...(s && { search: s }) } })
      setProducts(res.data.data)
      setTotal(res.data.pagination?.total || 0)
    } catch { toast.error('Failed to load products') }
    setLoading(false)
  }

  useEffect(() => { fetch(page, search) }, [page])

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetch(1, search) }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await api.delete(`/products/${id}`)
      toast.success('Product deleted')
      fetch(page, search)
    } catch { toast.error('Delete failed') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm">{total} products total</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary text-sm py-2.5">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9 text-sm py-2.5" placeholder="Search products..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary py-2.5 text-sm">Search</button>
      </form>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Product','Price','Stock','Status','Sales','Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(8).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(6).fill(0).map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="skeleton h-4 rounded" /></td>
                  ))}
                </tr>
              )) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">
                    <Package className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p>No products found</p>
                  </td>
                </tr>
              ) : products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                          : <Package className="w-5 h-5 text-gray-300 m-auto mt-2.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate max-w-[200px]">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.sku || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-bold text-gray-900">₹{p.price?.toLocaleString()}</p>
                      {p.compare_price > p.price && (
                        <p className="text-xs text-gray-400 line-through">₹{p.compare_price?.toLocaleString()}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`font-semibold ${p.stock === 0 ? 'text-red-500' : p.stock < 10 ? 'text-orange-500' : 'text-gray-700'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      {p.is_active
                        ? <span className="badge-success">Active</span>
                        : <span className="badge-gray">Inactive</span>}
                      {p.is_on_sale && <span className="badge-danger">Sale</span>}
                      {p.is_featured && <span className="badge-primary">Featured</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-xs text-gray-500">
                      <p>{p.sales_count || 0} sold</p>
                      <p>{p.view_count || 0} views</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/products/${p.id}`} target="_blank"
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link to={`/admin/products/${p.id}`}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
            <p className="text-xs text-gray-500">Showing {Math.min((page-1)*limit+1, total)}–{Math.min(page*limit, total)} of {total}</p>
            <div className="flex gap-1.5">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="btn-ghost text-xs py-1 px-3 disabled:opacity-40">Prev</button>
              <button disabled={page*limit>=total} onClick={() => setPage(p=>p+1)} className="btn-ghost text-xs py-1 px-3 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
