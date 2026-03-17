import { useEffect, useState } from 'react'
import { Heart, TrendingUp, Package } from 'lucide-react'
import api from '@/api/axios'
import toast from 'react-hot-toast'

export default function AdminWishlistStats() {
  const [stats, setStats]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/wishlist-stats')
      .then(r => { setStats(r.data.data); setLoading(false) })
      .catch(() => { toast.error('Failed to load'); setLoading(false) })
  }, [])

  const maxCount = stats[0]?.total_wishlists || 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" /> Wishlist Statistics
        </h1>
        <p className="text-gray-500 text-sm mt-1">Products ranked by how many customers have wishlisted them</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-2xl font-display font-bold text-gray-900">{stats.length}</p>
          <p className="text-sm text-gray-500">Wishlisted Products</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-display font-bold text-primary-600">
            {stats.reduce((a, b) => a + b.total_wishlists, 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Total Wishlist Saves</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-display font-bold text-gray-900">{stats[0]?.total_wishlists || 0}</p>
          <p className="text-sm text-gray-500">Most Wishlisted</p>
        </div>
      </div>

      {/* Product rankings */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-500" />
          <h2 className="font-semibold text-gray-800">Product Wishlist Rankings</h2>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : stats.length === 0 ? (
          <div className="py-16 text-center">
            <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">No wishlist data yet</p>
            <p className="text-gray-400 text-sm mt-1">Products will appear here once customers start wishlisting</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {stats.map((item, idx) => (
              <div key={item.product_id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                  ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-300 text-white' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {idx + 1}
                </div>

                {/* Image */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.image
                    ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    : <Package className="w-5 h-5 text-gray-300 m-auto mt-3" />}
                </div>

                {/* Name & price */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                  <p className="text-sm text-gray-500">₹{item.price?.toLocaleString()}</p>
                </div>

                {/* Bar */}
                <div className="hidden sm:flex items-center gap-3 flex-shrink-0 w-40">
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${(item.total_wishlists / maxCount) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Count */}
                <div className="flex items-center gap-1.5 flex-shrink-0 min-w-[60px] justify-end">
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                  <span className="font-bold text-gray-900 text-lg">{item.total_wishlists.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
