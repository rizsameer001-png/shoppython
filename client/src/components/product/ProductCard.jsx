import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Heart, ShoppingCart, Star, Eye, Zap } from 'lucide-react'
import { toggleWishlist } from '@/store/slices/wishlistSlice'
import { addToCart } from '@/store/slices/cartSlice'

function StarRating({ rating = 0, count = 0 }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
        />
      ))}
      {count > 0 && <span className="text-xs text-gray-400 ml-1">({count})</span>}
    </div>
  )
}

export default function ProductCard({ product }) {
  const dispatch = useDispatch()
  const { ids: wishIds } = useSelector((s) => s.wishlist)
  const isWished = wishIds.includes(product.id)

  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0

  return (
    <div className="product-card animate-fade-in">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Link to={`/products/${product.id}`}>
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-gray-200" />
            </div>
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="badge bg-red-500 text-white font-bold">-{discount}%</span>
          )}
          {product.is_new_arrival && (
            <span className="badge bg-emerald-500 text-white font-bold">NEW</span>
          )}
          {product.is_featured && (
            <span className="badge bg-primary-500 text-white font-bold">
              <Zap className="w-3 h-3 mr-0.5" />HOT
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); dispatch(toggleWishlist(product.id)) }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center
            backdrop-blur-sm transition-all duration-200 shadow-sm
            ${isWished ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-500 hover:text-red-500 hover:bg-white'}`}
        >
          <Heart className={`w-4 h-4 ${isWished ? 'fill-current' : ''}`} />
        </button>

        {/* Quick view / Add to cart overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={() => dispatch(addToCart({ product_id: product.id, quantity: 1 }))}
            className="w-full btn-primary py-2 text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        {product.brand && (
          <p className="text-xs text-primary-500 font-semibold uppercase tracking-wide mb-1">
            {product.brand.name}
          </p>
        )}
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 hover:text-primary-600 transition-colors mb-2">
            {product.name}
          </h3>
        </Link>
        <StarRating rating={product.avg_rating} count={product.review_count} />
        <div className="flex items-center gap-2 mt-2">
          <span className="font-display font-bold text-lg text-gray-900">
            ₹{product.price?.toLocaleString()}
          </span>
          {product.compare_price > product.price && (
            <span className="text-sm text-gray-400 line-through">
              ₹{product.compare_price?.toLocaleString()}
            </span>
          )}
        </div>
        {product.stock === 0 && (
          <span className="text-xs text-red-500 font-medium mt-1 block">Out of stock</span>
        )}
      </div>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-square" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-3 rounded w-1/3" />
        <div className="skeleton h-4 rounded w-full" />
        <div className="skeleton h-4 rounded w-3/4" />
        <div className="skeleton h-5 rounded w-1/3 mt-3" />
      </div>
    </div>
  )
}
