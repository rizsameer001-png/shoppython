import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { fetchProducts, setFilters } from '@/store/slices/productSlice'
import ProductCard, { ProductCardSkeleton } from '@/components/product/ProductCard'
import { SlidersHorizontal, Grid2x2, List, ChevronDown, X, Search } from 'lucide-react'

const SORT_OPTIONS = [
  { value: 'createdAt',  label: 'Latest' },
  { value: 'popular',   label: 'Most Popular' },
  { value: 'rating',    label: 'Top Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc',label: 'Price: High to Low' },
]

export default function ProductsPage() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const { list: products, pagination, categories, brands, loading } = useSelector((s) => s.products)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [gridView, setGridView] = useState(true)

  const currentFilters = {
    page:         Number(searchParams.get('page')) || 1,
    sort:         searchParams.get('sort') || 'createdAt',
    search:       searchParams.get('search') || '',
    category:     searchParams.get('category') || '',
    brand:        searchParams.get('brand') || '',
    min_price:    searchParams.get('min_price') || '',
    max_price:    searchParams.get('max_price') || '',
    on_sale:      searchParams.get('on_sale') === 'true',
    new_arrival:  searchParams.get('new_arrival') === 'true',
    featured:     searchParams.get('featured') === 'true',
  }

  useEffect(() => {
    const params = {}
    Object.entries(currentFilters).forEach(([k, v]) => { if (v) params[k] = v })
    dispatch(fetchProducts(params))
  }, [searchParams, dispatch])

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.set('page', '1')
    setSearchParams(next)
  }

  const clearFilters = () => setSearchParams({})

  const hasActiveFilters = currentFilters.category || currentFilters.brand
    || currentFilters.min_price || currentFilters.max_price
    || currentFilters.on_sale || currentFilters.new_arrival

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="section-title mb-2">
          {currentFilters.search ? `Results for "${currentFilters.search}"` : 'All Products'}
        </h1>
        <p className="text-gray-500 text-sm">{pagination?.total || 0} products found</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters — desktop */}
        <aside className="hidden lg:block w-60 flex-shrink-0 space-y-6">
          <FilterPanel
            categories={categories}
            brands={brands}
            currentFilters={currentFilters}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5 gap-3">
            <button
              onClick={() => setFiltersOpen(true)}
              className="lg:hidden btn-ghost border border-gray-200 text-sm py-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters {hasActiveFilters && <span className="badge-primary ml-1">!</span>}
            </button>

            <select
              value={currentFilters.sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="ml-auto input py-2 w-44 text-sm"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button onClick={() => setGridView(true)}
                className={`p-1.5 rounded ${gridView ? 'bg-white shadow-sm text-primary-500' : 'text-gray-400'}`}>
                <Grid2x2 className="w-4 h-4" />
              </button>
              <button onClick={() => setGridView(false)}
                className={`p-1.5 rounded ${!gridView ? 'bg-white shadow-sm text-primary-500' : 'text-gray-400'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active filters chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {currentFilters.category && (
                <Chip label={`Category: ${categories.find(c => c.id === currentFilters.category)?.name || currentFilters.category}`}
                  onRemove={() => updateFilter('category', '')} />
              )}
              {currentFilters.brand && (
                <Chip label={`Brand: ${brands.find(b => b.id === currentFilters.brand)?.name || currentFilters.brand}`}
                  onRemove={() => updateFilter('brand', '')} />
              )}
              {currentFilters.on_sale && <Chip label="On Sale" onRemove={() => updateFilter('on_sale', '')} />}
              {currentFilters.new_arrival && <Chip label="New Arrival" onRemove={() => updateFilter('new_arrival', '')} />}
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-semibold">Clear all</button>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className={`grid gap-4 ${gridView ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {Array(12).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-600 mb-2">No products found</h3>
              <p className="text-sm text-gray-400">Try adjusting your filters</p>
              <button onClick={clearFilters} className="btn-primary mt-4 text-sm py-2 px-6">Clear Filters</button>
            </div>
          ) : (
            <div className={`grid gap-4 ${gridView ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => updateFilter('page', p)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                    p === currentFilters.page
                      ? 'bg-primary-500 text-white shadow-primary'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setFiltersOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-lg">Filters</h3>
              <button onClick={() => setFiltersOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <FilterPanel
              categories={categories}
              brands={brands}
              currentFilters={currentFilters}
              updateFilter={(k, v) => { updateFilter(k, v); setFiltersOpen(false) }}
              clearFilters={() => { clearFilters(); setFiltersOpen(false) }}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </>
      )}
    </div>
  )
}

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 ml-0.5"><X className="w-3 h-3" /></button>
    </span>
  )
}

function FilterPanel({ categories, brands, currentFilters, updateFilter, clearFilters, hasActiveFilters }) {
  return (
    <div className="space-y-6">
      {hasActiveFilters && (
        <button onClick={clearFilters} className="text-sm text-red-500 font-semibold hover:text-red-700">
          Clear all filters
        </button>
      )}

      {/* Categories */}
      <div>
        <h3 className="font-display font-bold text-gray-900 mb-3">Categories</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="cat" checked={!currentFilters.category} onChange={() => updateFilter('category', '')} className="accent-primary-500" />
            <span className="text-sm text-gray-700">All Categories</span>
          </label>
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="cat" checked={currentFilters.category === cat.id} onChange={() => updateFilter('category', cat.id)} className="accent-primary-500" />
              <span className="text-sm text-gray-700">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-gray-900 mb-3">Brands</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="brand" checked={!currentFilters.brand} onChange={() => updateFilter('brand', '')} className="accent-primary-500" />
              <span className="text-sm text-gray-700">All Brands</span>
            </label>
            {brands.map(b => (
              <label key={b.id} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="brand" checked={currentFilters.brand === b.id} onChange={() => updateFilter('brand', b.id)} className="accent-primary-500" />
                <span className="text-sm text-gray-700">{b.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price */}
      <div>
        <h3 className="font-display font-bold text-gray-900 mb-3">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={currentFilters.min_price}
            onChange={(e) => updateFilter('min_price', e.target.value)}
            className="input text-sm py-2 px-3 w-24"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            placeholder="Max"
            value={currentFilters.max_price}
            onChange={(e) => updateFilter('max_price', e.target.value)}
            className="input text-sm py-2 px-3 w-24"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        {[
          { key: 'on_sale', label: '🔥 On Sale' },
          { key: 'new_arrival', label: '✨ New Arrivals' },
          { key: 'featured', label: '⭐ Featured' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!currentFilters[key]}
              onChange={(e) => updateFilter(key, e.target.checked ? 'true' : '')}
              className="accent-primary-500 w-4 h-4"
            />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
