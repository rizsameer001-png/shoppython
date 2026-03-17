import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchProducts } from '@/store/slices/productSlice'
import { ArrowRight, Shield, Truck, RefreshCw, Headphones, Star, TrendingUp, Zap, Download, FileText, BookOpen } from 'lucide-react'
import ProductCard, { ProductCardSkeleton } from '@/components/product/ProductCard'
import api from '@/api/axios'

const HERO_FEATURES = [
  { icon: Truck,       label: 'Free Shipping',   sub: 'On orders above ₹500' },
  { icon: RefreshCw,   label: 'Easy Returns',     sub: '30-day return policy' },
  { icon: Shield,      label: 'Secure Payments',  sub: '100% protected' },
  { icon: Headphones,  label: '24/7 Support',     sub: 'Always here for you' },
]

function HeroSection({ banners = [] }) {
  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Background dots pattern */}
      <div className="absolute inset-0 bg-hero-pattern opacity-50" />

      {/* Gradient orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full filter blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-600/10 rounded-full filter blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        {banners.length > 0 ? (
          /* ── Dynamic hero banner from admin ── */
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              {banners[0].badge_text && (
                <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-500/30 rounded-full px-4 py-2 text-primary-300 text-sm font-semibold mb-6">
                  <Zap className="w-4 h-4" />
                  {banners[0].badge_text}
                </div>
              )}
              <h1 className="font-display text-5xl lg:text-6xl font-bold leading-tight mb-4" style={{ color: banners[0].text_color || undefined }}>
                {banners[0].title}
              </h1>
              {banners[0].subtitle && (
                <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-lg">{banners[0].subtitle}</p>
              )}
              <div className="flex flex-wrap gap-4">
                {banners[0].link_url && (
                  <Link to={banners[0].link_url} className="btn-primary text-base px-8 py-4 shadow-primary">
                    {banners[0].link_text || 'Shop Now'} <ArrowRight className="w-5 h-5" />
                  </Link>
                )}
                <Link to="/products?new_arrival=true" className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/20 text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-200">
                  New Arrivals
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center animate-fade-in">
              {banners[0].image
                ? <img src={banners[0].image} alt={banners[0].title} className="max-h-96 w-full object-cover rounded-3xl shadow-2xl" />
                : <div className="grid grid-cols-2 gap-4 w-full">
                    {['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop','https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop','https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=300&fit=crop','https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop'].map((src, i) => (
                      <div key={i} className={`rounded-2xl overflow-hidden ${i===0||i===3?'aspect-square':'aspect-[4/3]'}`}>
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        ) : (
          /* ── Default static hero (shown when no banners configured) ── */
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-500/30 rounded-full px-4 py-2 text-primary-300 text-sm font-semibold mb-6">
                <Zap className="w-4 h-4" />
                New Season Sale — Up to 70% Off
              </div>
              <h1 className="font-display text-5xl lg:text-7xl font-bold leading-tight mb-6">
                Shop <span className="text-primary-400">Premium</span><br />Products
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-lg">
                Discover thousands of curated products across all categories. Quality guaranteed, delivered fast.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/products" className="btn-primary text-base px-8 py-4 shadow-primary">Shop Now <ArrowRight className="w-5 h-5" /></Link>
                <Link to="/products?new_arrival=true" className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/20 text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-200">New Arrivals</Link>
              </div>
              <div className="flex gap-8 mt-12">
                {[['50K+','Products'],['200K+','Customers'],['4.8★','Rating']].map(([n,l]) => (
                  <div key={l}><p className="font-display font-bold text-2xl text-white">{n}</p><p className="text-gray-400 text-sm">{l}</p></div>
                ))}
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-4 animate-fade-in">
              {['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop','https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop','https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=300&fit=crop','https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop'].map((src,i)=>(
                <div key={i} className={`rounded-2xl overflow-hidden ${i===0||i===3?'aspect-square':'aspect-[4/3]'} animate-float`} style={{animationDelay:`${i*0.3}s`}}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
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
  const [heroBanners, setHeroBanners]     = useState([])
  const [sideBanners, setSideBanners]     = useState([])
  const [recentBlogs, setRecentBlogs]     = useState([])
  const [cmsCards, setCmsCards]           = useState([])
  const [activePopup, setActivePopup]     = useState(null)

  useEffect(() => {
    dispatch(fetchProducts({ featured: true, limit: 8 }))

    // Load hero banners
    api.get('/banners?position=home').then(r => setHeroBanners(r.data.data || [])).catch(()=>{})
    // Load sidebar banners
    api.get('/banners?position=sidebar').then(r => setSideBanners(r.data.data || [])).catch(()=>{})
    // Load recent blogs
    api.get('/blogs?status=published&limit=3').then(r => setRecentBlogs(r.data.data || [])).catch(()=>{})
    // Load CMS cards for home
    api.get('/cms/public?show_on_home=true').then(r => setCmsCards(r.data.data || [])).catch(()=>{})
    // Load popup
    api.get('/banners?type=popup').then(r => {
      const popup = r.data.data?.[0]
      if (!popup) return
      const key = `popup_seen_${popup.id}`
      if (popup.popup_once_per_session && sessionStorage.getItem(key)) return
      setTimeout(() => {
        setActivePopup(popup)
        if (popup.popup_once_per_session) sessionStorage.setItem(key, '1')
      }, popup.popup_delay_ms || 3000)
    }).catch(()=>{})
  }, [dispatch])

  return (
    <div>
      <HeroSection banners={heroBanners} />
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

      {/* Side banners / CMS cards / Blog section */}
      {(sideBanners.length > 0 || cmsCards.length > 0 || recentBlogs.length > 0) && (
        <section className="py-6 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent blog posts */}
            {recentBlogs.length > 0 && (
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-xl font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary-500" /> Latest Articles
                  </h2>
                  <Link to="/blog" className="text-sm text-primary-600 font-semibold hover:text-primary-700">View all →</Link>
                </div>
                <div className="space-y-4">
                  {recentBlogs.map(b => (
                    <Link key={b.id} to={`/blog/${b.slug||b.id}`}
                      className="card p-4 flex gap-4 hover:shadow-card-hover transition-shadow group">
                      {b.cover_image && <img src={b.cover_image} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        {b.category && <p className="text-xs text-primary-500 font-semibold mb-0.5">{b.category.name}</p>}
                        <h3 className="font-semibold text-gray-800 line-clamp-2 text-sm group-hover:text-primary-600">{b.title}</h3>
                        {b.excerpt && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{b.excerpt}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Side banners + CMS download cards */}
            <div className="space-y-4">
              {sideBanners.map(banner => (
                <div key={banner.id} className="rounded-2xl overflow-hidden relative"
                  style={{ backgroundColor: banner.bg_color || '#f3f4f6' }}>
                  {banner.image && <img src={banner.image} alt={banner.title} className="w-full h-48 object-cover" />}
                  <div className="p-4">
                    {banner.badge_text && <span className="badge-primary text-xs mb-2 inline-block">{banner.badge_text}</span>}
                    <h3 className="font-bold text-gray-900" style={{ color: banner.text_color || undefined }}>{banner.title}</h3>
                    {banner.subtitle && <p className="text-sm text-gray-600 mt-0.5">{banner.subtitle}</p>}
                    {banner.link_url && (
                      <Link to={banner.link_url} className="mt-3 btn-primary text-sm py-2 inline-flex">
                        {banner.link_text || 'Shop Now'} <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              {cmsCards.filter(p => p.allow_download && p.downloadable_files?.length > 0).map(page => (
                <div key={page.id} className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-primary-500" />
                    <h3 className="font-semibold text-gray-800 text-sm">{page.title}</h3>
                  </div>
                  {page.excerpt && <p className="text-xs text-gray-500 mb-3">{page.excerpt}</p>}
                  {page.downloadable_files.slice(0,2).map((file, i) => (
                    <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" download={file.name}
                      className="flex items-center gap-2 p-2 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors mb-1.5">
                      <Download className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                      <span className="text-xs font-medium text-primary-700 truncate">{file.name}</span>
                    </a>
                  ))}
                  <Link to={`/pages/${page.slug}`} className="text-xs text-primary-600 hover:underline font-medium mt-1 block">
                    View page →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popup banner */}
      {activePopup && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setActivePopup(null)}>
            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-in"
              onClick={e => e.stopPropagation()}>
              {activePopup.image && <img src={activePopup.image} alt="" className="w-full h-48 object-cover" />}
              <div className="p-6">
                {activePopup.badge_text && (
                  <span className="badge-primary text-xs mb-2 inline-block">{activePopup.badge_text}</span>
                )}
                <h3 className="font-display font-bold text-xl text-gray-900">{activePopup.title}</h3>
                {activePopup.subtitle && <p className="text-gray-600 mt-1 text-sm">{activePopup.subtitle}</p>}
                <div className="flex gap-3 mt-5">
                  {activePopup.link_url && (
                    <Link to={activePopup.link_url} onClick={() => setActivePopup(null)}
                      className="btn-primary flex-1 text-sm py-2.5 text-center">
                      {activePopup.link_text || 'Shop Now'}
                    </Link>
                  )}
                  <button onClick={() => setActivePopup(null)}
                    className="btn-secondary flex-1 text-sm py-2.5">Close</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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
