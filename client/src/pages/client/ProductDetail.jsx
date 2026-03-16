import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProduct, clearCurrentProduct, fetchProducts } from '@/store/slices/productSlice'
import { addToCart } from '@/store/slices/cartSlice'
import { toggleWishlist } from '@/store/slices/wishlistSlice'
import {
  Heart, ShoppingCart, Star, Truck, RefreshCw, Shield,
  ChevronRight, ZoomIn, Play, Minus, Plus, Share2, ArrowLeft
} from 'lucide-react'
import ProductCard, { ProductCardSkeleton } from '@/components/product/ProductCard'

function StarRow({ rating, count }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(s => (
          <Star key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}`} />
        ))}
      </div>
      <span className="text-sm text-gray-500">{rating?.toFixed(1)} ({count} reviews)</span>
    </div>
  )
}

function ImageGallery({ images = [], productName }) {
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top)  / rect.height) * 100
    setZoomPos({ x, y })
  }

  const fallback = ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop']
  const imgs = images.length > 0 ? images : fallback

  return (
    <div className="flex gap-4">
      {/* Thumbnails */}
      <div className="hidden sm:flex flex-col gap-2.5 w-16 flex-shrink-0">
        {imgs.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-150 flex-shrink-0
              ${active === i ? 'border-primary-500 shadow-primary' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div className="flex-1">
        <div
          className="relative rounded-2xl overflow-hidden bg-gray-50 aspect-square cursor-zoom-in group"
          onMouseEnter={() => setZoomed(true)}
          onMouseLeave={() => setZoomed(false)}
          onMouseMove={handleMouseMove}
        >
          <img
            src={imgs[active]}
            alt={productName}
            className={`w-full h-full object-cover transition-transform duration-200 ${zoomed ? 'scale-150' : 'scale-100'}`}
            style={zoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
          />
          {!zoomed && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1.5 text-xs font-medium text-gray-600 shadow-sm">
              <ZoomIn className="w-3.5 h-3.5" /> Hover to zoom
            </div>
          )}
        </div>

        {/* Mobile thumbnails */}
        <div className="sm:hidden flex gap-2 mt-3 overflow-x-auto pb-1">
          {imgs.map((src, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all
                ${active === i ? 'border-primary-500' : 'border-gray-200'}`}>
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function YouTubeEmbed({ url }) {
  if (!url) return null
  // Convert watch URL to embed if needed
  const embedUrl = url.includes('embed') ? url :
    url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')

  return (
    <div className="rounded-2xl overflow-hidden aspect-video bg-black shadow-lg">
      <iframe
        src={embedUrl}
        title="Product Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { currentProduct: product, productLoading, list: related } = useSelector((s) => s.products)
  const { ids: wishIds } = useSelector((s) => s.wishlist)
  const [qty, setQty] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [activeTab, setActiveTab] = useState('description')

  const isWished = wishIds.includes(product?.id)

  useEffect(() => {
    dispatch(fetchProduct(id))
    dispatch(fetchProducts({ limit: 4 }))
    return () => dispatch(clearCurrentProduct())
  }, [id, dispatch])

  useEffect(() => { window.scrollTo(0, 0) }, [id])

  if (productLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-2 gap-10 animate-pulse">
          <div className="aspect-square skeleton rounded-2xl" />
          <div className="space-y-4">
            <div className="skeleton h-6 rounded w-1/3" />
            <div className="skeleton h-10 rounded w-2/3" />
            <div className="skeleton h-5 rounded w-1/4" />
            <div className="skeleton h-16 rounded" />
            <div className="skeleton h-12 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Product not found.</p>
      <Link to="/products" className="btn-primary mt-4 inline-flex">Back to Products</Link>
    </div>
  )

  const discount = product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-primary-500 transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/products" className="hover:text-primary-500 transition-colors">Products</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-700 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 mb-16">
        {/* Gallery */}
        <div>
          <ImageGallery images={product.images} productName={product.name} />
          {/* Video section */}
          {product.youtube_url && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Play className="w-4 h-4 text-primary-500" />
                <h3 className="font-semibold text-gray-800">Product Video</h3>
              </div>
              <YouTubeEmbed url={product.youtube_url} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {product.is_new_arrival && <span className="badge bg-emerald-500 text-white">NEW</span>}
            {product.is_on_sale && <span className="badge bg-red-500 text-white">SALE</span>}
            {product.is_featured && <span className="badge bg-primary-500 text-white">FEATURED</span>}
            {product.stock === 0 && <span className="badge bg-gray-500 text-white">OUT OF STOCK</span>}
          </div>

          {/* Brand */}
          {product.brand && (
            <p className="text-primary-500 font-semibold text-sm uppercase tracking-widest">{product.brand.name}</p>
          )}

          {/* Name */}
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            {product.name}
          </h1>

          {/* Rating */}
          <StarRow rating={product.avg_rating} count={product.review_count} />

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="font-display text-4xl font-bold text-gray-900">
              ₹{product.price?.toLocaleString()}
            </span>
            {product.compare_price > product.price && (
              <>
                <span className="text-xl text-gray-400 line-through font-medium mb-0.5">
                  ₹{product.compare_price?.toLocaleString()}
                </span>
                <span className="badge bg-red-100 text-red-600 font-bold text-sm mb-1">
                  Save {discount}%
                </span>
              </>
            )}
          </div>

          {/* Short description */}
          {product.short_description && (
            <p className="text-gray-600 text-sm leading-relaxed">{product.short_description}</p>
          )}

          {/* Variants */}
          {product.variants?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Select Variant</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => setSelectedVariant(v.name)}
                    className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all
                      ${selectedVariant === v.name
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty + Add to Cart */}
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-0 bg-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="px-4 py-3 hover:bg-gray-200 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-bold text-gray-900">{qty}</span>
              <button
                onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))}
                className="px-4 py-3 hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => dispatch(addToCart({ product_id: product.id, quantity: qty, variant: selectedVariant }))}
              disabled={product.stock === 0}
              className="btn-primary flex-1 py-3"
            >
              <ShoppingCart className="w-5 h-5" />
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>

            <button
              onClick={() => dispatch(toggleWishlist(product.id))}
              className={`p-3 rounded-xl border-2 transition-all duration-200
                ${isWished ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500'}`}
            >
              <Heart className={`w-5 h-5 ${isWished ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Stock info */}
          {product.stock > 0 && product.stock <= 10 && (
            <p className="text-orange-500 text-sm font-semibold">⚡ Only {product.stock} left in stock!</p>
          )}

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
            {[
              { icon: Truck,      label: 'Free Delivery', sub: 'Above ₹500' },
              { icon: RefreshCw,  label: '30-Day Return', sub: 'Hassle-free' },
              { icon: Shield,     label: 'Secure Pay',    sub: '100% safe' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center gap-1 p-3 rounded-xl bg-gray-50">
                <Icon className="w-5 h-5 text-primary-500" />
                <p className="text-xs font-semibold text-gray-700">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-16">
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1.5 w-fit mb-6">
          {['description','details','reviews'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-200
                ${activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'description' && (
          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
            <p>{product.description || 'No description available.'}</p>
          </div>
        )}
        {activeTab === 'details' && (
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
            {[
              ['SKU',      product.sku || '—'],
              ['Brand',    product.brand?.name || '—'],
              ['Category', product.category?.name || '—'],
              ['Weight',   product.weight ? `${product.weight}kg` : '—'],
              ['Stock',    product.stock ?? '—'],
              ['Tags',     product.tags?.join(', ') || '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-100 text-sm">
                <span className="text-gray-500 font-medium">{label}</span>
                <span className="text-gray-800 font-semibold">{value}</span>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'reviews' && (
          <div className="text-center py-10 text-gray-400">
            <Star className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="font-semibold">Reviews coming soon</p>
          </div>
        )}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="section-title mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.filter(p => p.id !== product.id).slice(0, 4).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
