import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchProducts } from '@/store/slices/productSlice'
import { ArrowRight, Shield, Truck, RefreshCw, Headphones, Star, TrendingUp, Zap } from 'lucide-react'
import ProductCard, { ProductCardSkeleton } from '@/components/product/ProductCard'

const HERO_FEATURES = [
  { icon: Truck,       label: 'Free Shipping',   sub: 'On orders above ₹500' },
  { icon: RefreshCw,   label: 'Easy Returns',     sub: '30-day return policy' },
  { icon: Shield,      label: 'Secure Payments',  sub: '100% protected' },
  { icon: Headphones,  label: '24/7 Support',     sub: 'Always here for you' },
]

function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Background dots pattern */}
      <div className="absolute inset-0 bg-hero-pattern opacity-50" />

      {/* Gradient orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full filter blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-600/10 rounded-full filter blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-500/30 rounded-full px-4 py-2 text-primary-300 text-sm font-semibold mb-6">
              <Zap className="w-4 h-4" />
              New Season Sale — Up to 70% Off
            </div>
            <h1 className="font-display text-5xl lg:text-7xl font-bold leading-tight mb-6">
              Shop <span className="text-primary-400">Premium</span><br />
              Products
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-lg">
              Discover thousands of curated products across all categories. Quality guaranteed, delivered fast.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="btn-primary text-base px-8 py-4 shadow-primary">
                Shop Now <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/products?new_arrival=true" className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/20 text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-200">
                New Arrivals
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-12">
              {[['50K+','Products'],['200K+','Customers'],['4.8★','Rating']].map(([n,l]) => (
                <div key={l}>
                  <p className="font-display font-bold text-2xl text-white">{n}</p>
                  <p className="text-gray-400 text-sm">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero image collage */}
          <div className="hidden lg:grid grid-cols-2 gap-4 animate-fade-in">
            {[
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
              'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
              'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=300&fit=crop',
              'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop',
            ].map((src, i) => (
              <div
                key={i}
                className={`rounded-2xl overflow-hidden ${i === 0 || i === 3 ? 'aspect-square' : 'aspect-[4/3]'} animate-float`}
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features bar */}
      <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {HERO_FEATURES.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="font-semibold text-sm text-white">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CategoryGrid({ categories }) {
  const CATEGORY_IMGS = [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&h=400&fit=crop',
  ]
  const displayed = categories.slice(0, 6)

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-primary-500 font-semibold text-sm uppercase tracking-widest mb-2">Browse by</p>
          <h2 className="section-title">Shop by Category</h2>
        </div>
        <Link to="/products" className="text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1 text-sm">
          All Categories <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {displayed.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORY_IMGS.map((src, i) => (
            <Link key={i} to={`/products`}
              className="group relative rounded-2xl overflow-hidden aspect-square bg-gray-100 cursor-pointer hover:shadow-lg transition-all duration-300">
              <img src={src} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <p className="absolute bottom-3 left-3 right-3 text-white font-display font-bold text-sm text-center">
                {['Fashion','Photography','Electronics','Clothing','Home & Living','Footwear'][i]}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {displayed.map((cat, i) => (
            <Link key={cat.id} to={`/products?category=${cat.id}`}
              className="group relative rounded-2xl overflow-hidden aspect-square bg-gray-100 cursor-pointer hover:shadow-lg transition-all duration-300">
              {cat.image ? (
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <img src={CATEGORY_IMGS[i % CATEGORY_IMGS.length]} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <p className="absolute bottom-3 left-3 right-3 text-white font-display font-bold text-sm text-center">{cat.name}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

function BannerSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="relative rounded-3xl overflow-hidden h-52 group cursor-pointer">
          <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=400&fit=crop" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center px-8">
            <div>
              <p className="text-primary-300 font-semibold text-sm">Up to 50% Off</p>
              <h3 className="font-display font-bold text-white text-2xl mt-1">Fashion Sale</h3>
              <Link to="/products?on_sale=true" className="mt-3 inline-flex items-center gap-1 text-white font-semibold text-sm underline underline-offset-2 hover:text-primary-300">
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
        <div className="relative rounded-3xl overflow-hidden h-52 group cursor-pointer">
          <img src="https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&h=400&fit=crop" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center px-8">
            <div>
              <p className="text-primary-300 font-semibold text-sm">New Collection</p>
              <h3 className="font-display font-bold text-white text-2xl mt-1">Sports & Fitness</h3>
              <Link to="/products?new_arrival=true" className="mt-3 inline-flex items-center gap-1 text-white font-semibold text-sm underline underline-offset-2 hover:text-primary-300">
                Explore <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const dispatch = useDispatch()
  const { list: products, categories, loading } = useSelector((s) => s.products)

  useEffect(() => {
    dispatch(fetchProducts({ featured: true, limit: 8 }))
  }, [dispatch])

  return (
    <div>
      <HeroSection />
      <CategoryGrid categories={categories} />
      <BannerSection />

      {/* Featured Products */}
      <section className="py-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              <p className="text-primary-500 font-semibold text-sm uppercase tracking-widest">Trending</p>
            </div>
            <h2 className="section-title">Featured Products</h2>
          </div>
          <Link to="/products" className="text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1 text-sm">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {loading
            ? Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.length > 0
              ? products.map((p) => <ProductCard key={p.id} product={p} />)
              : Array(4).fill(0).map((_, i) => (
                  <div key={i} className="product-card overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Star className="w-8 h-8 text-gray-300" />
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-primary-500 font-semibold mb-1">Sample Brand</p>
                      <h3 className="font-semibold text-gray-800 text-sm mb-2">Sample Product {i+1}</h3>
                      <p className="font-display font-bold text-lg">₹{(Math.random()*5000+500).toFixed(0)}</p>
                    </div>
                  </div>
                ))
          }
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-primary-500 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-3">Get Exclusive Deals</h2>
          <p className="text-primary-100 mb-8">Subscribe to our newsletter for the best deals and new arrivals.</p>
          <form className="flex gap-3 max-w-md mx-auto" onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-white/40 text-sm" />
            <button type="submit" className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors text-sm flex-shrink-0">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
