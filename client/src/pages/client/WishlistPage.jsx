import { useDispatch, useSelector } from 'react-redux'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import { toggleWishlist } from '@/store/slices/wishlistSlice'
import { addToCart } from '@/store/slices/cartSlice'
import { Link } from 'react-router-dom'

export default function WishlistPage() {
  const dispatch = useDispatch()
  const { items, loading } = useSelector(s => s.wishlist)

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="card overflow-hidden"><div className="skeleton aspect-square" /><div className="p-4 space-y-2"><div className="skeleton h-4 rounded" /><div className="skeleton h-4 rounded w-1/2" /></div></div>)}
      </div>
    </div>
  )

  if (!items.length) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <Heart className="w-20 h-20 text-gray-200 mx-auto mb-6" />
      <h2 className="font-display text-2xl font-bold text-gray-700 mb-2">Your wishlist is empty</h2>
      <p className="text-gray-400 mb-8">Save your favourite items here</p>
      <Link to="/products" className="btn-primary">Browse Products</Link>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="section-title mb-8">My Wishlist <span className="text-gray-400 text-2xl font-body font-normal">({items.length} items)</span></h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {items.map(item => (
          <div key={item.id} className="product-card">
            <div className="relative aspect-square overflow-hidden bg-gray-50">
              <Link to={`/products/${item.product_id}`}>
                {item.product?.images?.[0]
                  ? <img src={item.product.images[0]} alt={item.product?.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  : <div className="w-full h-full flex items-center justify-center"><Heart className="w-10 h-10 text-gray-200" /></div>}
              </Link>
              <button onClick={() => dispatch(toggleWishlist(item.product_id))}
                className="absolute top-3 right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <Link to={`/products/${item.product_id}`}>
                <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 hover:text-primary-600 mb-2">{item.product?.name}</h3>
              </Link>
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-lg text-gray-900">₹{item.product?.price?.toLocaleString()}</span>
                {item.product?.compare_price > item.product?.price && (
                  <span className="text-xs text-gray-400 line-through">₹{item.product.compare_price.toLocaleString()}</span>
                )}
              </div>
              <button onClick={() => dispatch(addToCart({ product_id: item.product_id, quantity: 1 }))}
                className="btn-primary w-full mt-3 py-2 text-sm">
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
