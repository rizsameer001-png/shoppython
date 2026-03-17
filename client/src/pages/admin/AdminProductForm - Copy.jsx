import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Upload, Link as LinkIcon, X, ZoomIn, Play, Plus, Minus,
  Save, ArrowLeft, Image as ImageIcon, Video, Tag, Package
} from 'lucide-react'
import api from '@/api/axios'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  name:'', description:'', short_description:'', price:'', compare_price:'', cost_price:'',
  sku:'', stock:'', category_id:'', subcategory_id:'', brand_id:'', tags:[],
  images:[], image_public_ids:[], youtube_url:'', video_url:'',
  variants:[], weight:'', is_active:true, is_featured:false, is_new_arrival:false, is_on_sale:false,
  meta_title:'', meta_description:'',
}

export default function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { categories, brands } = useSelector(s => s.products)
  const isEdit = !!id

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [zoomedImg, setZoomedImg] = useState(null)
  const [tagInput, setTagInput] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  // All categories flattened including subs
  const allCats = []
  categories.forEach(c => {
    allCats.push(c)
    c.subcategories?.forEach(s => allCats.push({ ...s, name: `  └ ${s.name}` }))
  })

  useEffect(() => {
    if (isEdit) {
      api.get(`/products/${id}`).then(r => {
        const p = r.data.data
        setForm({
          ...EMPTY_FORM, ...p,
          price: p.price || '',
          compare_price: p.compare_price || '',
          cost_price: p.cost_price || '',
          stock: p.stock ?? '',
          weight: p.weight || '',
          tags: p.tags || [],
          images: p.images || [],
          image_public_ids: p.image_public_ids || [],
          variants: p.variants || [],
        })
      }).catch(() => toast.error('Failed to load product'))
    }
  }, [id])

  const set = (k) => (e) => setForm(f => ({...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value}))

  // ── Image upload (file) ──────────────────────────────────────────────────────
  const handleFileUpload = async (files) => {
    if (!files.length) return
    setUploading(true)
    const fd = new FormData()
    Array.from(files).forEach(f => fd.append('files', f))
    fd.append('folder', 'marketpro/products')
    try {
      const res = await api.post('/upload/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const uploaded = res.data.data
      setForm(f => ({
        ...f,
        images: [...f.images, ...uploaded.map(u => u.url)],
        image_public_ids: [...f.image_public_ids, ...uploaded.map(u => u.public_id)],
      }))
      toast.success(`${uploaded.length} image(s) uploaded!`)
    } catch { toast.error('Upload failed') }
    setUploading(false)
  }

  // ── Image upload (URL) ───────────────────────────────────────────────────────
  const handleUrlUpload = async () => {
    if (!imageUrl.trim()) return
    setUploading(true)
    try {
      const res = await api.post('/upload/image-url', { url: imageUrl.trim() })
      const u = res.data.data
      setForm(f => ({
        ...f,
        images: [...f.images, u.url],
        image_public_ids: [...f.image_public_ids, u.public_id],
      }))
      setImageUrl('')
      toast.success('Image uploaded from URL!')
    } catch { toast.error('URL upload failed') }
    setUploading(false)
  }

  const removeImage = (idx) => {
    setForm(f => ({
      ...f,
      images: f.images.filter((_, i) => i !== idx),
      image_public_ids: f.image_public_ids.filter((_, i) => i !== idx),
    }))
  }

  // ── Tags ─────────────────────────────────────────────────────────────────────
  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !form.tags.includes(t)) setForm(f => ({...f, tags: [...f.tags, t]}))
    setTagInput('')
  }

  // ── Variants ─────────────────────────────────────────────────────────────────
  const addVariant = () => setForm(f => ({...f, variants: [...f.variants, { name:'', price:'', stock:'' }]}))
  const updateVariant = (i, k, v) => {
    const vars = [...form.variants]
    vars[i] = { ...vars[i], [k]: v }
    setForm(f => ({...f, variants: vars}))
  }
  const removeVariant = (i) => setForm(f => ({...f, variants: f.variants.filter((_, idx) => idx !== i)}))

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.category_id) {
      toast.error('Name, price and category are required')
      return
    }
    setLoading(true)
    const payload = {
      ...form,
      price: parseFloat(form.price),
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      cost_price:    form.cost_price    ? parseFloat(form.cost_price)    : null,
      stock: parseInt(form.stock) || 0,
      weight: form.weight ? parseFloat(form.weight) : null,
      variants: form.variants.map(v => ({
        ...v,
        price: parseFloat(v.price) || 0,
        stock: parseInt(v.stock) || 0,
      })),
    }
    try {
      if (isEdit) {
        await api.put(`/products/${id}`, payload)
        toast.success('Product updated!')
      } else {
        await api.post('/products', payload)
        toast.success('Product created!')
        navigate('/admin/products')
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed')
    }
    setLoading(false)
  }

  const inputCls = 'input text-sm py-2.5'
  const labelCls = 'text-xs font-semibold text-gray-600 block mb-1.5'

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/products')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="text-gray-400 text-sm">{isEdit ? 'Update product details' : 'Fill in the details below'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left: Main Info ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Basic info */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Package className="w-4 h-4 text-primary-500" /> Basic Information</h2>
              <div>
                <label className={labelCls}>Product Name *</label>
                <input className={inputCls} placeholder="e.g. Wireless Headphones Pro" required value={form.name} onChange={set('name')} />
              </div>
              <div>
                <label className={labelCls}>Short Description</label>
                <input className={inputCls} placeholder="One-line summary..." value={form.short_description} onChange={set('short_description')} />
              </div>
              <div>
                <label className={labelCls}>Full Description</label>
                <textarea rows={5} className={`${inputCls} resize-none`} placeholder="Detailed product description..."
                  value={form.description} onChange={set('description')} />
              </div>
            </div>

            {/* Images */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary-500" /> Product Images</h2>

              {/* Drag & drop upload */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files) }}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
                  ${dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}`}
              >
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-600">Drag & drop images, or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 10MB each</p>
                {uploading && <p className="text-primary-500 text-sm mt-2 animate-pulse-soft">Uploading...</p>}
                <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
                  onChange={e => handleFileUpload(e.target.files)} />
              </div>

              {/* URL upload */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input className={`${inputCls} pl-9`} placeholder="Paste image URL to upload from web..."
                    value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleUrlUpload())} />
                </div>
                <button type="button" onClick={handleUrlUpload} disabled={uploading || !imageUrl.trim()}
                  className="btn-primary py-2.5 text-sm px-4 flex-shrink-0">
                  {uploading ? '...' : 'Upload'}
                </button>
              </div>

              {/* Image previews */}
              {form.images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button type="button" onClick={() => setZoomedImg(url)}
                          className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <ZoomIn className="w-3.5 h-3.5 text-gray-700" />
                        </button>
                        <button type="button" onClick={() => removeImage(i)}
                          className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                      {i === 0 && <span className="absolute top-1 left-1 text-[9px] bg-primary-500 text-white font-bold px-1.5 py-0.5 rounded-md">MAIN</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Video className="w-4 h-4 text-primary-500" /> Product Video</h2>
              <div>
                <label className={labelCls}>YouTube Video URL</label>
                <div className="relative">
                  <Play className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input className={`${inputCls} pl-9`}
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={form.youtube_url} onChange={set('youtube_url')} />
                </div>
              </div>
              {form.youtube_url && (
                <div className="rounded-2xl overflow-hidden aspect-video bg-black">
                  <iframe
                    src={form.youtube_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                    allow="autoplay" allowFullScreen className="w-full h-full"
                  />
                </div>
              )}
            </div>

            {/* Variants */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">Variants (optional)</h2>
                <button type="button" onClick={addVariant} className="btn-ghost text-sm py-1.5 px-3">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              {form.variants.map((v, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <input className="input text-xs py-2 flex-1" placeholder="Name (e.g. Red / L)"
                    value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)} />
                  <input className="input text-xs py-2 w-24" placeholder="Price"
                    type="number" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} />
                  <input className="input text-xs py-2 w-20" placeholder="Stock"
                    type="number" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} />
                  <button type="button" onClick={() => removeVariant(i)}
                    className="p-2 text-red-400 hover:text-red-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {!form.variants.length && <p className="text-xs text-gray-400">No variants — product has a single price/stock above.</p>}
            </div>

            {/* Tags */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Tag className="w-4 h-4 text-primary-500" /> Tags</h2>
              <div className="flex gap-2">
                <input className={`${inputCls} flex-1`} placeholder="Add a tag and press Enter"
                  value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                <button type="button" onClick={addTag} className="btn-primary py-2.5 text-sm px-4 flex-shrink-0">Add</button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold">
                      {t}
                      <button type="button" onClick={() => setForm(f => ({...f, tags: f.tags.filter(x => x !== t)}))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Pricing, Category, Settings ── */}
          <div className="space-y-5">
            {/* Pricing */}
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-gray-800">Pricing & Stock</h2>
              {[
                { key:'price',         label:'Sale Price *',    placeholder:'999' },
                { key:'compare_price', label:'Compare At Price', placeholder:'1499' },
                { key:'cost_price',    label:'Cost Price',       placeholder:'500' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₹</span>
                    <input type="number" step="0.01" className={`${inputCls} pl-7`} placeholder={placeholder}
                      required={key==='price'} value={form[key]} onChange={set(key)} />
                  </div>
                </div>
              ))}
              <div>
                <label className={labelCls}>Stock Quantity</label>
                <input type="number" className={inputCls} placeholder="0" value={form.stock} onChange={set('stock')} />
              </div>
              <div>
                <label className={labelCls}>SKU</label>
                <input className={inputCls} placeholder="PROD-001" value={form.sku} onChange={set('sku')} />
              </div>
              <div>
                <label className={labelCls}>Weight (kg)</label>
                <input type="number" step="0.01" className={inputCls} placeholder="0.5" value={form.weight} onChange={set('weight')} />
              </div>
            </div>

            {/* Category & Brand */}
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-gray-800">Organisation</h2>
              <div>
                <label className={labelCls}>Category *</label>
                <select className={inputCls} required value={form.category_id} onChange={set('category_id')}>
                  <option value="">Select category...</option>
                  {allCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Brand</label>
                <select className={inputCls} value={form.brand_id} onChange={set('brand_id')}>
                  <option value="">Select brand...</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>

            {/* Status flags */}
            <div className="card p-5 space-y-3">
              <h2 className="font-semibold text-gray-800">Status & Flags</h2>
              {[
                { key:'is_active',      label:'Active (visible in store)' },
                { key:'is_featured',    label:'Featured product' },
                { key:'is_new_arrival', label:'Mark as New Arrival' },
                { key:'is_on_sale',     label:'On Sale' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" checked={!!form[key]} onChange={set(key)} />
                    <div className="w-10 h-5 bg-gray-200 peer-checked:bg-primary-500 rounded-full transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900">{label}</span>
                </label>
              ))}
            </div>

            {/* SEO */}
            <div className="card p-5 space-y-3">
              <h2 className="font-semibold text-gray-800">SEO</h2>
              <div>
                <label className={labelCls}>Meta Title</label>
                <input className={inputCls} placeholder="SEO page title" value={form.meta_title} onChange={set('meta_title')} />
              </div>
              <div>
                <label className={labelCls}>Meta Description</label>
                <textarea rows={2} className={`${inputCls} resize-none`} placeholder="SEO description..."
                  value={form.meta_description} onChange={set('meta_description')} />
              </div>
            </div>

            {/* Save */}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </div>
      </form>

      {/* Zoom modal */}
      {zoomedImg && (
        <>
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setZoomedImg(null)}>
            <img src={zoomedImg} alt="" className="max-w-full max-h-full rounded-2xl shadow-2xl" />
            <button className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
