import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Upload, Link as LinkIcon, X, ZoomIn, Play, Plus,
  Save, ArrowLeft, Image as ImageIcon, Video, Tag, Package,
  GripVertical, Star, ChevronDown, ChevronRight, Layers
} from 'lucide-react'
import api from '@/api/axios'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  name:'', description:'', short_description:'', price:'', compare_price:'', cost_price:'',
  sku:'', stock:'', category_id:'', subcategory_id:'', brand_id:'', tags:[],
  images:[], image_public_ids:[], youtube_url:'', video_url:'',
  variants:[], attributes:[], weight:'', is_active:true, is_featured:false,
  is_new_arrival:false, is_on_sale:false, meta_title:'', meta_description:'',
}

/* ── Draggable sortable image grid ─────────────────────────────────────────── */
function DraggableImageGrid({ images, publicIds, onReorder, onRemove, onSetMain, onZoom, uploading }) {
  const dragIdx = useRef(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)

  const onDragStart = (e, i) => { dragIdx.current = i; e.dataTransfer.effectAllowed = 'move' }
  const onDragEnter = i => setDragOverIdx(i)
  const onDragEnd = () => { dragIdx.current = null; setDragOverIdx(null) }
  const onDrop = (e, to) => {
    e.preventDefault()
    const from = dragIdx.current
    if (from === null || from === to) return
    const imgs = [...images]; const pids = [...publicIds]
    const [img] = imgs.splice(from, 1); const [pid] = pids.splice(from, 1)
    imgs.splice(to, 0, img); pids.splice(to, 0, pid)
    onReorder(imgs, pids)
    dragIdx.current = null; setDragOverIdx(null)
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
      {images.map((url, i) => (
        <div key={`${url}-${i}`}
          draggable
          onDragStart={e => onDragStart(e, i)}
          onDragEnter={() => onDragEnter(i)}
          onDragOver={e => e.preventDefault()}
          onDragEnd={onDragEnd}
          onDrop={e => onDrop(e, i)}
          className={`relative group aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-grab active:cursor-grabbing border-2 transition-all
            ${dragOverIdx === i ? 'border-primary-500 scale-95 opacity-60' : i === 0 ? 'border-primary-400' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-white drop-shadow" />
          </div>
          {i === 0 && (
            <span className="absolute top-1 left-1 text-[9px] bg-primary-500 text-white font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-current" /> MAIN
            </span>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center gap-1.5 pb-2 opacity-0 group-hover:opacity-100">
            {i !== 0 && (
              <button type="button" onClick={() => onSetMain(i)}
                className="text-[10px] bg-primary-500 text-white font-bold px-2 py-1 rounded-lg">
                Set Main
              </button>
            )}
            <button type="button" onClick={() => onZoom(url)}
              className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
              <ZoomIn className="w-3 h-3 text-gray-700" />
            </button>
            <button type="button" onClick={() => onRemove(i)}
              className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      ))}
      {uploading && (
        <div className="aspect-square rounded-xl bg-primary-50 border-2 border-primary-200 border-dashed flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-1" />
            <p className="text-xs text-primary-500 font-medium">Uploading</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Video section ────────────────────────────────────────────────────────── */
function VideoSection({ form, setForm, inputCls, labelCls }) {
  const [uploading, setUploading] = useState(false)
  const videoRef = useRef()

  const handleVideoFile = async file => {
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('files', file)
    fd.append('folder', 'marketpro/videos')
    try {
      const res = await api.post('/upload/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(f => ({ ...f, video_url: res.data.data[0]?.url || '' }))
      toast.success('Video uploaded!')
    } catch { toast.error('Video upload failed') }
    setUploading(false)
  }

  return (
    <div className="card p-6 space-y-4">
      <h2 className="font-semibold text-gray-800 flex items-center gap-2">
        <Video className="w-4 h-4 text-primary-500" /> Product Video
      </h2>
      <div>
        <label className={labelCls}>YouTube URL</label>
        <div className="relative">
          <Play className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className={`${inputCls} pl-9`} placeholder="https://www.youtube.com/watch?v=..."
            value={form.youtube_url} onChange={e => setForm(f => ({ ...f, youtube_url: e.target.value }))} />
        </div>
      </div>
      {form.youtube_url && (
        <div className="rounded-2xl overflow-hidden aspect-video bg-black">
          <iframe src={form.youtube_url.replace('watch?v=','embed/').replace('youtu.be/','www.youtube.com/embed/')}
            allow="autoplay" allowFullScreen className="w-full h-full" />
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Upload Video File</label>
          <div onClick={() => videoRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-all">
            {uploading
              ? <p className="text-xs text-primary-500 animate-pulse">Uploading...</p>
              : <><Upload className="w-5 h-5 text-gray-300 mx-auto mb-1" /><p className="text-xs text-gray-400">MP4, WebM, MOV</p></>}
            <input ref={videoRef} type="file" accept="video/*" className="hidden"
              onChange={e => handleVideoFile(e.target.files[0])} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Or Paste Cloudinary Video URL</label>
          <input className={inputCls} placeholder="https://res.cloudinary.com/..."
            value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} />
          {form.video_url && <video src={form.video_url} controls className="mt-2 w-full rounded-xl max-h-32" />}
        </div>
      </div>
    </div>
  )
}

/* ── Attribute selector ───────────────────────────────────────────────────── */
function AttributeSelector({ form, setForm, categoryId }) {
  const [attributes, setAttributes] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get('/attributes', { params: categoryId ? { category_id: categoryId } : {} })
      .then(r => setAttributes(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [categoryId])

  const toggleAttr = attrId => {
    setForm(f => {
      if (f.attributes.find(a => a.attribute_id === attrId))
        return { ...f, attributes: f.attributes.filter(a => a.attribute_id !== attrId) }
      const attr = attributes.find(a => a.id === attrId)
      return { ...f, attributes: [...f.attributes, {
        attribute_id:  attrId,
        name:          attr?.name || '',
        type:          attr?.type || 'select',
        selected_values: [],
        // store full value objects so color_hex travels with the product
        values_meta:   attr?.values || [],
      }] }
    })
  }

  const toggleValue = (attrId, value) => {
    setForm(f => ({
      ...f,
      attributes: f.attributes.map(a => {
        if (a.attribute_id !== attrId) return a
        const vals = a.selected_values.includes(value)
          ? a.selected_values.filter(v => v !== value)
          : [...a.selected_values, value]
        return { ...a, selected_values: vals }
      })
    }))
  }

  const isAttrOn = id => form.attributes.some(a => a.attribute_id === id)
  const getVals = id => form.attributes.find(a => a.attribute_id === id)?.selected_values || []

  return (
    <div className="card p-5">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary-500" /> Product Attributes
          {form.attributes.length > 0 && <span className="badge-primary text-xs">{form.attributes.length} selected</span>}
        </h2>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {loading && <p className="text-xs text-gray-400 animate-pulse">Loading attributes...</p>}
          {!loading && attributes.length === 0 && (
            <div className="text-center py-5 text-sm text-gray-400">
              No attributes yet.{' '}
              <a href="/admin/attributes" target="_blank" className="text-primary-500 hover:underline font-medium">Create attributes →</a>
            </div>
          )}
          {attributes.map(attr => (
            <div key={attr.id} className={`border-2 rounded-xl p-3 transition-all ${isAttrOn(attr.id) ? 'border-primary-300 bg-primary-50' : 'border-gray-200'}`}>
              <label className="flex items-center gap-3 cursor-pointer mb-2">
                <input type="checkbox" className="accent-primary-500 w-4 h-4"
                  checked={isAttrOn(attr.id)} onChange={() => toggleAttr(attr.id)} />
                <span className="font-semibold text-sm text-gray-800">{attr.name}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">{attr.type}</span>
                {attr.size_chart && <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">📏 Size chart</span>}
              </label>
              {isAttrOn(attr.id) && attr.values?.length > 0 && (
                <div className="ml-7 flex flex-wrap gap-1.5">
                  {attr.values.map(v => {
                    const sel = getVals(attr.id).includes(v.value)
                    return (
                      <button key={v.value} type="button" onClick={() => toggleValue(attr.id, v.value)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all
                          ${sel ? 'border-primary-500 bg-primary-100 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-primary-300'}`}>
                        {attr.type === 'color' && v.color_hex && (
                          <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: v.color_hex }} />
                        )}
                        {v.value}
                      </button>
                    )
                  })}
                </div>
              )}
              {isAttrOn(attr.id) && attr.size_chart && (
                <details className="ml-7 mt-2">
                  <summary className="text-xs text-indigo-600 cursor-pointer font-medium">View size chart</summary>
                  <div className="overflow-x-auto mt-2">
                    <table className="text-xs border-collapse">
                      <thead><tr>{attr.size_chart.cols.map((c,ci) => <th key={ci} className="bg-gray-100 border border-gray-200 px-2 py-1 font-semibold whitespace-nowrap">{c}</th>)}</tr></thead>
                      <tbody>{attr.size_chart.data.map((row,ri) => <tr key={ri}>{row.map((cell,ci) => <td key={ci} className={`border border-gray-200 px-2 py-1 ${ci===0?'font-semibold bg-gray-50':''}`}>{cell}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main form ────────────────────────────────────────────────────────────── */
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
          price: p.price || '', compare_price: p.compare_price || '',
          cost_price: p.cost_price || '', stock: p.stock ?? '',
          weight: p.weight || '', tags: p.tags || [],
          images: p.images || [], image_public_ids: p.image_public_ids || [],
          variants: p.variants || [], attributes: p.attributes || [],
        })
      }).catch(() => toast.error('Failed to load product'))
    }
  }, [id])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleFileUpload = async files => {
    if (!files.length) return
    setUploading(true)
    const fd = new FormData()
    Array.from(files).forEach(f => fd.append('files', f))
    fd.append('folder', 'marketpro/products')
    try {
      const res = await api.post('/upload/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const u = res.data.data
      setForm(f => ({ ...f, images: [...f.images, ...u.map(x=>x.url)], image_public_ids: [...f.image_public_ids, ...u.map(x=>x.public_id)] }))
      toast.success(`${u.length} image(s) uploaded!`)
    } catch { toast.error('Upload failed') }
    setUploading(false)
  }

  const handleUrlUpload = async () => {
    if (!imageUrl.trim()) return
    setUploading(true)
    try {
      const res = await api.post('/upload/image-url', { url: imageUrl.trim() })
      const u = res.data.data
      setForm(f => ({ ...f, images: [...f.images, u.url], image_public_ids: [...f.image_public_ids, u.public_id] }))
      setImageUrl(''); toast.success('Image uploaded!')
    } catch { toast.error('URL upload failed') }
    setUploading(false)
  }

  const removeImage = i => setForm(f => ({
    ...f,
    images: f.images.filter((_,idx) => idx !== i),
    image_public_ids: f.image_public_ids.filter((_,idx) => idx !== i),
  }))

  const setMainImage = i => {
    setForm(f => {
      const imgs = [...f.images]; const pids = [...f.image_public_ids]
      const [img] = imgs.splice(i,1); const [pid] = pids.splice(i,1)
      imgs.unshift(img); pids.unshift(pid)
      toast.success('Main image updated!')
      return { ...f, images: imgs, image_public_ids: pids }
    })
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }))
    setTagInput('')
  }

  const addVariant = () => setForm(f => ({ ...f, variants: [...f.variants, { name:'', price:'', stock:'' }] }))
  const updateVariant = (i,k,v) => { const vars=[...form.variants]; vars[i]={...vars[i],[k]:v}; setForm(f=>({...f,variants:vars})) }
  const removeVariant = i => setForm(f => ({ ...f, variants: f.variants.filter((_,idx) => idx !== i) }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name || !form.price || !form.category_id) { toast.error('Name, price and category are required'); return }
    setLoading(true)
    const payload = {
      ...form,
      price: parseFloat(form.price),
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      stock: parseInt(form.stock) || 0,
      weight: form.weight ? parseFloat(form.weight) : null,
      variants: form.variants.map(v => ({ ...v, price: parseFloat(v.price)||0, stock: parseInt(v.stock)||0 })),
    }
    try {
      if (isEdit) { await api.put(`/products/${id}`, payload); toast.success('✅ Product updated!') }
      else { await api.post('/products', payload); toast.success('✅ Product created!') }
      navigate('/admin/products')
    } catch (err) { toast.error(err.response?.data?.detail || 'Save failed') }
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
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Package className="w-4 h-4 text-primary-500" /> Basic Information</h2>
              <div><label className={labelCls}>Product Name *</label><input className={inputCls} placeholder="e.g. Wireless Headphones Pro" required value={form.name} onChange={set('name')} /></div>
              <div><label className={labelCls}>Short Description</label><input className={inputCls} placeholder="One-line summary..." value={form.short_description} onChange={set('short_description')} /></div>
              <div><label className={labelCls}>Full Description</label><textarea rows={5} className={`${inputCls} resize-none`} placeholder="Detailed product description..." value={form.description} onChange={set('description')} /></div>
            </div>

            {/* Images with drag/reorder */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary-500" /> Product Images
                {form.images.length > 0 && <span className="text-xs text-gray-400 font-normal">— drag to reorder · first image = main</span>}
              </h2>
              <div
                onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={e=>{e.preventDefault();setDragOver(false);handleFileUpload(e.dataTransfer.files)}}
                onClick={()=>fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
                  ${dragOver?'border-primary-500 bg-primary-50':'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}`}
              >
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-600">Drag & drop images, or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP · multiple allowed</p>
                <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={e=>handleFileUpload(e.target.files)} />
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input className={`${inputCls} pl-9`} placeholder="Paste image URL to fetch from web..."
                    value={imageUrl} onChange={e=>setImageUrl(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),handleUrlUpload())} />
                </div>
                <button type="button" onClick={handleUrlUpload} disabled={uploading||!imageUrl.trim()}
                  className="btn-primary py-2.5 text-sm px-4 flex-shrink-0 disabled:opacity-50">
                  {uploading?'...':'Upload'}
                </button>
              </div>
              <DraggableImageGrid
                images={form.images} publicIds={form.image_public_ids}
                onReorder={(imgs,pids)=>setForm(f=>({...f,images:imgs,image_public_ids:pids}))}
                onRemove={removeImage} onSetMain={setMainImage}
                onZoom={setZoomedImg} uploading={uploading}
              />
            </div>

            {/* Video */}
            <VideoSection form={form} setForm={setForm} inputCls={inputCls} labelCls={labelCls} />

            {/* Attributes */}
            <AttributeSelector form={form} setForm={setForm} categoryId={form.category_id} />

            {/* Variants */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">Variants (optional)</h2>
                <button type="button" onClick={addVariant} className="btn-ghost text-sm py-1.5 px-3"><Plus className="w-3.5 h-3.5" /> Add</button>
              </div>
              {form.variants.map((v,i)=>(
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <input className="input text-xs py-2 flex-1" placeholder="Name (e.g. Red / L)" value={v.name} onChange={e=>updateVariant(i,'name',e.target.value)} />
                  <input className="input text-xs py-2 w-24" placeholder="Price" type="number" value={v.price} onChange={e=>updateVariant(i,'price',e.target.value)} />
                  <input className="input text-xs py-2 w-20" placeholder="Stock" type="number" value={v.stock} onChange={e=>updateVariant(i,'stock',e.target.value)} />
                  <button type="button" onClick={()=>removeVariant(i)} className="p-2 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                </div>
              ))}
              {!form.variants.length && <p className="text-xs text-gray-400">No variants — product uses single price/stock.</p>}
            </div>

            {/* Tags */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Tag className="w-4 h-4 text-primary-500" /> Tags</h2>
              <div className="flex gap-2">
                <input className={`${inputCls} flex-1`} placeholder="Add a tag and press Enter"
                  value={tagInput} onChange={e=>setTagInput(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addTag())} />
                <button type="button" onClick={addTag} className="btn-primary py-2.5 text-sm px-4">Add</button>
              </div>
              {form.tags.length>0&&(
                <div className="flex flex-wrap gap-2">
                  {form.tags.map(t=>(
                    <span key={t} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold">
                      {t}<button type="button" onClick={()=>setForm(f=>({...f,tags:f.tags.filter(x=>x!==t)}))}>
                        <X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT sidebar */}
          <div className="space-y-5">
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-gray-800">Pricing & Stock</h2>
              {[{key:'price',label:'Sale Price *',placeholder:'999'},{key:'compare_price',label:'Compare At Price',placeholder:'1499'},{key:'cost_price',label:'Cost Price',placeholder:'500'}].map(({key,label,placeholder})=>(
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₹</span>
                    <input type="number" step="0.01" className={`${inputCls} pl-7`} placeholder={placeholder} required={key==='price'} value={form[key]} onChange={set(key)} />
                  </div>
                </div>
              ))}
              <div><label className={labelCls}>Stock Quantity</label><input type="number" className={inputCls} placeholder="0" value={form.stock} onChange={set('stock')} /></div>
              <div><label className={labelCls}>SKU</label><input className={inputCls} placeholder="PROD-001" value={form.sku} onChange={set('sku')} /></div>
              <div><label className={labelCls}>Weight (kg)</label><input type="number" step="0.01" className={inputCls} placeholder="0.5" value={form.weight} onChange={set('weight')} /></div>
            </div>

            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-gray-800">Organisation</h2>
              <div><label className={labelCls}>Category *</label>
                <select className={inputCls} required value={form.category_id} onChange={set('category_id')}>
                  <option value="">Select category...</option>
                  {allCats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Brand</label>
                <select className={inputCls} value={form.brand_id} onChange={set('brand_id')}>
                  <option value="">Select brand...</option>
                  {brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>

            <div className="card p-5 space-y-3">
              <h2 className="font-semibold text-gray-800">Status & Flags</h2>
              {[{key:'is_active',label:'Active (visible in store)'},{key:'is_featured',label:'Featured product'},{key:'is_new_arrival',label:'New Arrival'},{key:'is_on_sale',label:'On Sale'}].map(({key,label})=>(
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" checked={!!form[key]} onChange={set(key)} />
                    <div className="w-10 h-5 bg-gray-200 peer-checked:bg-primary-500 rounded-full transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{label}</span>
                </label>
              ))}
            </div>

            <div className="card p-5 space-y-3">
              <h2 className="font-semibold text-gray-800">SEO</h2>
              <div><label className={labelCls}>Meta Title</label><input className={inputCls} placeholder="SEO page title" value={form.meta_title} onChange={set('meta_title')} /></div>
              <div><label className={labelCls}>Meta Description</label><textarea rows={2} className={`${inputCls} resize-none`} value={form.meta_description} onChange={set('meta_description')} /></div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </div>
      </form>

      {zoomedImg && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={()=>setZoomedImg(null)}>
          <img src={zoomedImg} alt="" className="max-w-full max-h-full rounded-2xl shadow-2xl" />
          <button className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"><X className="w-5 h-5" /></button>
        </div>
      )}
    </div>
  )
}
