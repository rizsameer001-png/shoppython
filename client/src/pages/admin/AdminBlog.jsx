import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Plus, Edit, Trash2, Eye, Grid, List, Search, BookOpen, Calendar,
  Tag, X, Save, Upload, Video, Image as ImageIcon, FolderOpen,
  AlignLeft, Image, Film, Instagram, Twitter, Facebook, LayoutGrid,
  ChevronUp, ChevronDown, GripVertical, Link2, Code, Quote, Heading
} from 'lucide-react'
import api from '@/api/axios'
import toast from 'react-hot-toast'

const EMPTY = {
  title:'', slug:'', content:'', blocks:[], excerpt:'', cover_image:'',
  category_id:'', tags:[], status:'draft', youtube_url:'', video_url:'',
  is_featured:false, author_name:'', author_avatar:'', published_at:'',
  meta_title:'', meta_description:'',
}

const slugify = t => t.toLowerCase().trim().replace(/[^\w\s-]/g,'').replace(/[\s_-]+/g,'-')
const STATUS = { published:'bg-green-100 text-green-700', draft:'bg-yellow-100 text-yellow-700' }

/* ═══════════════════════════════════════════════════════════════════════════
   BLOCK EDITOR
   Each block: { id, type, data:{} }
   Types: paragraph | heading | image | video | youtube | instagram | twitter
          facebook | ad | quote | code | divider
═══════════════════════════════════════════════════════════════════════════ */

const BLOCK_TYPES = [
  { type:'paragraph', icon:AlignLeft,   label:'Text' },
  { type:'heading',   icon:Heading,     label:'Heading' },
  { type:'quote',     icon:Quote,       label:'Quote' },
  { type:'image',     icon:Image,       label:'Image' },
  { type:'video',     icon:Film,        label:'Video' },
  { type:'youtube',   icon:Film,        label:'YouTube' },
  { type:'instagram', icon:Instagram,   label:'Instagram' },
  { type:'twitter',   icon:Twitter,     label:'Twitter' },
  { type:'facebook',  icon:Facebook,    label:'Facebook' },
  { type:'ad',        icon:LayoutGrid,  label:'Ad / Embed' },
  { type:'code',      icon:Code,        label:'Code' },
  { type:'divider',   icon:Link2,       label:'Divider' },
]

function uid() { return Math.random().toString(36).slice(2,9) }

function BlockEditor({ blocks, setBlocks }) {
  const [addMenu, setAddMenu] = useState(null) // index where to insert
  const fileRefs = useRef({})

  const insert = (afterIdx, type) => {
    const defaults = {
      paragraph:{ text:'' },
      heading:  { text:'', level:2 },
      quote:    { text:'', attribution:'' },
      image:    { src:'', alt:'', caption:'', width:'full' },
      video:    { src:'', caption:'' },
      youtube:  { url:'', caption:'' },
      instagram:{ url:'', caption:'' },
      twitter:  { url:'', caption:'' },
      facebook: { url:'', type:'post' },
      ad:       { html:'' },
      code:     { code:'', language:'html' },
      divider:  {},
    }
    const nb = { id:uid(), type, data: defaults[type] || {} }
    const next = [...blocks]
    next.splice(afterIdx + 1, 0, nb)
    setBlocks(next)
    setAddMenu(null)
  }

  const remove  = id => setBlocks(b => b.filter(x => x.id !== id))
  const moveUp  = id => setBlocks(b => { const i=b.findIndex(x=>x.id===id); if(i<=0)return b; const n=[...b];[n[i-1],n[i]]=[n[i],n[i-1]];return n })
  const moveDown= id => setBlocks(b => { const i=b.findIndex(x=>x.id===id); if(i>=b.length-1)return b; const n=[...b];[n[i],n[i+1]]=[n[i+1],n[i]];return n })
  const update  = (id, data) => setBlocks(b => b.map(x => x.id===id ? {...x,data:{...x.data,...data}} : x))

  const uploadImg = async (id) => {
    const input = fileRefs.current[id]
    if(!input?.files[0]) return
    const fd = new FormData(); fd.append('files',input.files[0]); fd.append('folder','marketpro/blog')
    try {
      const r = await api.post('/upload/images',fd,{headers:{'Content-Type':'multipart/form-data'}})
      update(id, { src: r.data.data[0]?.url || '' })
      toast.success('Image uploaded!')
    } catch { toast.error('Upload failed') }
  }

  const inputCls = 'input text-sm py-2'
  const lbl = 'text-xs font-semibold text-gray-500 block mb-1'

  // Add-block toolbar
  const AddBar = ({ idx }) => (
    <div className="relative flex justify-center my-1 group">
      <div className="w-full h-px bg-gray-200 group-hover:bg-primary-300 transition-colors" />
      <button type="button" onClick={() => setAddMenu(addMenu===idx ? null : idx)}
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center transition-all z-10">
        <Plus className="w-3 h-3 text-gray-500 hover:text-primary-500" />
      </button>
      {addMenu === idx && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 z-20 w-80">
          <p className="text-xs font-bold text-gray-500 mb-2 px-1">Insert block</p>
          <div className="grid grid-cols-4 gap-1">
            {BLOCK_TYPES.map(({ type, icon: Icon, label }) => (
              <button key={type} type="button" onClick={() => insert(idx, type)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-primary-50 hover:text-primary-600 text-gray-600 transition-colors">
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const BlockShell = ({ block, children }) => (
    <div className="group relative border border-transparent hover:border-primary-200 rounded-xl p-3 bg-gray-50 hover:bg-white transition-all">
      {/* Controls */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button type="button" onClick={() => moveUp(block.id)} className="w-6 h-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50">
          <ChevronUp className="w-3 h-3 text-gray-500" />
        </button>
        <button type="button" onClick={() => moveDown(block.id)} className="w-6 h-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50">
          <ChevronDown className="w-3 h-3 text-gray-500" />
        </button>
        <button type="button" onClick={() => remove(block.id)} className="w-6 h-6 bg-white border border-red-200 rounded-lg flex items-center justify-center hover:bg-red-50">
          <Trash2 className="w-3 h-3 text-red-400" />
        </button>
      </div>
      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 cursor-grab">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      <div className="pl-4">{children}</div>
    </div>
  )

  const renderBlock = (block) => {
    const { id, type, data } = block
    const up = (k,v) => update(id, {[k]:v})

    switch(type) {
      case 'paragraph':
        return (
          <BlockShell block={block}>
            <label className={lbl}>¶ Paragraph</label>
            <textarea rows={3} className={`${inputCls} resize-none w-full`}
              placeholder="Write your paragraph here..."
              value={data.text||''} onChange={e=>up('text',e.target.value)} />
          </BlockShell>
        )
      case 'heading':
        return (
          <BlockShell block={block}>
            <div className="flex gap-2 items-center mb-1">
              <label className={lbl + ' mb-0'}>H Heading</label>
              <select className="input text-xs py-1 w-20" value={data.level||2} onChange={e=>up('level',Number(e.target.value))}>
                {[1,2,3,4].map(n=><option key={n} value={n}>H{n}</option>)}
              </select>
            </div>
            <input className={`${inputCls} w-full font-bold`} placeholder="Heading text..."
              value={data.text||''} onChange={e=>up('text',e.target.value)} />
          </BlockShell>
        )
      case 'quote':
        return (
          <BlockShell block={block}>
            <label className={lbl}>" Quote</label>
            <textarea rows={2} className={`${inputCls} resize-none w-full mb-2`}
              placeholder="Quote text..." value={data.text||''} onChange={e=>up('text',e.target.value)} />
            <input className={`${inputCls} w-full`} placeholder="— Attribution (optional)"
              value={data.attribution||''} onChange={e=>up('attribution',e.target.value)} />
          </BlockShell>
        )
      case 'image':
        return (
          <BlockShell block={block}>
            <label className={lbl}>🖼 Image</label>
            <div className="flex gap-2 mb-2">
              <input className={`${inputCls} flex-1`} placeholder="Image URL or upload →"
                value={data.src||''} onChange={e=>up('src',e.target.value)} />
              <button type="button" onClick={() => fileRefs.current[id]?.click()}
                className="btn-secondary text-xs py-2 px-3 flex-shrink-0 flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" /> Upload
              </button>
              <input ref={el=>fileRefs.current[id]=el} type="file" accept="image/*" className="hidden"
                onChange={() => uploadImg(id)} />
            </div>
            {data.src && <img src={data.src} alt="" className="rounded-xl max-h-48 object-cover w-full mb-2" />}
            <div className="grid grid-cols-2 gap-2">
              <input className={`${inputCls}`} placeholder="Alt text" value={data.alt||''} onChange={e=>up('alt',e.target.value)} />
              <input className={`${inputCls}`} placeholder="Caption (optional)" value={data.caption||''} onChange={e=>up('caption',e.target.value)} />
            </div>
          </BlockShell>
        )
      case 'video':
        return (
          <BlockShell block={block}>
            <label className={lbl}>🎬 Video File</label>
            <div className="flex gap-2 mb-2">
              <input className={`${inputCls} flex-1`} placeholder="Video URL"
                value={data.src||''} onChange={e=>up('src',e.target.value)} />
              <button type="button" onClick={() => fileRefs.current[`v${id}`]?.click()}
                className="btn-secondary text-xs py-2 px-3 flex-shrink-0 flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" /> Upload
              </button>
              <input ref={el=>fileRefs.current[`v${id}`]=el} type="file" accept="video/*" className="hidden"
                onChange={async () => {
                  const f = fileRefs.current[`v${id}`]?.files[0]; if(!f) return
                  const fd=new FormData(); fd.append('files',f); fd.append('folder','marketpro/blog')
                  try { const r=await api.post('/upload/images',fd,{headers:{'Content-Type':'multipart/form-data'}}); up('src',r.data.data[0]?.url||''); toast.success('Uploaded!') }
                  catch { toast.error('Failed') }
                }} />
            </div>
            {data.src && <video src={data.src} controls className="rounded-xl w-full max-h-48 mb-2" />}
            <input className={`${inputCls} w-full`} placeholder="Caption (optional)"
              value={data.caption||''} onChange={e=>up('caption',e.target.value)} />
          </BlockShell>
        )
      case 'youtube':
        return (
          <BlockShell block={block}>
            <label className={lbl}>▶ YouTube</label>
            <input className={`${inputCls} w-full mb-2`} placeholder="https://youtube.com/watch?v=..."
              value={data.url||''} onChange={e=>up('url',e.target.value)} />
            {data.url && (
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                <iframe src={data.url.replace('watch?v=','embed/').replace('youtu.be/','youtube.com/embed/')}
                  allowFullScreen className="w-full h-full" />
              </div>
            )}
          </BlockShell>
        )
      case 'instagram':
        return (
          <BlockShell block={block}>
            <label className={lbl}>📷 Instagram Post</label>
            <input className={`${inputCls} w-full mb-2`} placeholder="https://www.instagram.com/p/..."
              value={data.url||''} onChange={e=>up('url',e.target.value)} />
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-pink-200 rounded-xl p-3 text-xs text-pink-700">
              <p className="font-semibold mb-1">Instagram embed preview</p>
              {data.url
                ? <p className="font-mono break-all opacity-70">{data.url}</p>
                : <p className="opacity-60">Paste Instagram post URL above. Will render as embed on the blog.</p>
              }
            </div>
            <input className={`${inputCls} w-full mt-2`} placeholder="Caption (optional)"
              value={data.caption||''} onChange={e=>up('caption',e.target.value)} />
          </BlockShell>
        )
      case 'twitter':
        return (
          <BlockShell block={block}>
            <label className={lbl}>🐦 X / Twitter Post</label>
            <input className={`${inputCls} w-full mb-2`} placeholder="https://twitter.com/user/status/..."
              value={data.url||''} onChange={e=>up('url',e.target.value)} />
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
              <p className="font-semibold mb-1">X/Twitter embed preview</p>
              {data.url
                ? <p className="font-mono break-all opacity-70">{data.url}</p>
                : <p className="opacity-60">Paste tweet URL above. Will render as embed on the blog.</p>
              }
            </div>
          </BlockShell>
        )
      case 'facebook':
        return (
          <BlockShell block={block}>
            <label className={lbl}>📘 Facebook Post</label>
            <input className={`${inputCls} w-full mb-2`} placeholder="https://www.facebook.com/..."
              value={data.url||''} onChange={e=>up('url',e.target.value)} />
            <select className={`${inputCls} w-full`} value={data.type||'post'} onChange={e=>up('type',e.target.value)}>
              <option value="post">Post</option>
              <option value="video">Video</option>
            </select>
          </BlockShell>
        )
      case 'ad':
        return (
          <BlockShell block={block}>
            <label className={lbl}>📣 Ad / Custom Embed</label>
            <textarea rows={4} className={`${inputCls} resize-none w-full font-mono text-xs`}
              placeholder={'<!-- Paste ad code, banner HTML, or any embed code -->\n<script src="..."></script>'}
              value={data.html||''} onChange={e=>up('html',e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Supports Google AdSense, custom HTML banners, affiliate widgets</p>
          </BlockShell>
        )
      case 'code':
        return (
          <BlockShell block={block}>
            <div className="flex gap-2 items-center mb-1">
              <label className={lbl + ' mb-0'}>{'</>'} Code Block</label>
              <input className="input text-xs py-1 w-24" placeholder="language" value={data.language||'html'} onChange={e=>up('language',e.target.value)} />
            </div>
            <textarea rows={5} className={`${inputCls} resize-none w-full font-mono text-xs bg-gray-900 text-green-400 border-gray-700`}
              placeholder="// paste code here"
              value={data.code||''} onChange={e=>up('code',e.target.value)} />
          </BlockShell>
        )
      case 'divider':
        return (
          <BlockShell block={block}>
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="text-xs text-gray-400 font-medium">— divider —</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>
          </BlockShell>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-1">
      <AddBar idx={-1} />
      {blocks.map((block, idx) => (
        <div key={block.id}>
          {renderBlock(block)}
          <AddBar idx={idx} />
        </div>
      ))}
      {blocks.length === 0 && (
        <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <LayoutGrid className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="font-semibold text-sm">Click + to add content blocks</p>
          <p className="text-xs mt-1">Text, images, videos, social posts, ads and more</p>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function AdminBlog() {
  const [blogs, setBlogs]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [viewMode, setViewMode]     = useState('grid')
  const [search, setSearch]         = useState('')
  const [catFilter, setCatFilter]   = useState('')
  const [statusFilter, setStatus]   = useState('')
  const [page, setPage]             = useState(1)
  const [total, setTotal]           = useState(0)
  const limit = 12

  const [categories, setCategories] = useState([])
  const [catTab, setCatTab]         = useState('posts')
  const [catForm, setCatForm]       = useState({ name:'', description:'' })
  const [savingCat, setSavingCat]   = useState(false)

  const [modal, setModal]           = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(EMPTY)
  const [blocks, setBlocks]         = useState([])
  const [slugEdited, setSlugEdited] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [tagInput, setTagInput]     = useState('')
  const [editorTab, setEditorTab]   = useState('blocks') // 'blocks' | 'html'
  const coverRef = useRef()
  const videoRef = useRef()

  const loadCats = async () => {
    try { const r = await api.get('/blogs/categories/all'); setCategories(r.data.data || []) } catch {}
  }

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, limit }
      if (catFilter) params.category_id = catFilter
      if (statusFilter) params.status = statusFilter
      if (search) params.search = search
      const r = await api.get('/blogs', { params })
      setBlogs(r.data.data); setTotal(r.data.pagination?.total || 0)
    } catch { toast.error('Failed to load blogs') }
    setLoading(false)
  }

  useEffect(() => { load(page) }, [page, catFilter, statusFilter])
  useEffect(() => { loadCats() }, [])

  const saveCat = async e => {
    e.preventDefault()
    if (!catForm.name.trim()) return
    setSavingCat(true)
    try { await api.post('/blogs/categories', catForm); setCatForm({name:'',description:''}); loadCats(); toast.success('Category created!') }
    catch { toast.error('Failed') }
    setSavingCat(false)
  }

  const deleteCat = async (id, name) => {
    if (!confirm(`Delete category "${name}"?`)) return
    try { await api.delete(`/blogs/categories/${id}`); loadCats(); toast.success('Deleted') }
    catch { toast.error('Delete failed') }
  }

  const openCreate = () => {
    setEditing(null); setForm(EMPTY); setBlocks([]); setSlugEdited(false); setEditorTab('blocks'); setModal(true)
  }
  const openEdit = b => {
    setEditing(b)
    setForm({...EMPTY,...b, tags:b.tags||[], category_id:b.category_id||''})
    setBlocks(b.blocks || [])
    setSlugEdited(true)
    setEditorTab(b.blocks?.length > 0 ? 'blocks' : 'html')
    setModal(true)
  }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      blocks,
      // if blocks exist, generate HTML from them as content fallback
      content: editorTab === 'html' ? form.content : blocksToHtml(blocks),
    }
    try {
      editing ? await api.put(`/blogs/${editing.id}`, payload) : await api.post('/blogs', payload)
      toast.success(editing ? 'Updated!' : 'Created!')
      setModal(false); load(page)
    } catch (err) { toast.error(err.response?.data?.detail || 'Save failed') }
    setSaving(false)
  }

  // Convert blocks to plain HTML for backward compat / SEO
  const blocksToHtml = (blks) => blks.map(b => {
    const d = b.data
    switch(b.type) {
      case 'paragraph': return `<p>${d.text||''}</p>`
      case 'heading':   return `<h${d.level||2}>${d.text||''}</h${d.level||2}>`
      case 'quote':     return `<blockquote><p>${d.text||''}</p>${d.attribution?`<cite>— ${d.attribution}</cite>`:''}</blockquote>`
      case 'image':     return `<figure><img src="${d.src||''}" alt="${d.alt||''}" />${d.caption?`<figcaption>${d.caption}</figcaption>`:''}</figure>`
      case 'video':     return `<video src="${d.src||''}" controls></video>${d.caption?`<p class="caption">${d.caption}</p>`:''}`
      case 'youtube':   return `<div class="embed-youtube"><iframe src="${(d.url||'').replace('watch?v=','embed/').replace('youtu.be/','youtube.com/embed/')}" allowfullscreen></iframe></div>`
      case 'instagram': return `<blockquote class="instagram-media" data-instgrm-permalink="${d.url||''}"></blockquote><script async src="//www.instagram.com/embed.js"></script>${d.caption?`<p>${d.caption}</p>`:''}`
      case 'twitter':   return `<blockquote class="twitter-tweet"><a href="${d.url||''}"></a></blockquote><script async src="https://platform.twitter.com/widgets.js"></script>`
      case 'facebook':  return `<div class="fb-post" data-href="${d.url||''}" data-width="500"></div>`
      case 'ad':        return d.html || ''
      case 'code':      return `<pre><code class="language-${d.language||'html'}">${d.code||''}</code></pre>`
      case 'divider':   return `<hr />`
      default:          return ''
    }
  }).join('\n')

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return
    try { await api.delete(`/blogs/${id}`); toast.success('Deleted'); load(page) }
    catch { toast.error('Delete failed') }
  }

  const uploadFile = async (file, field) => {
    if (!file) return
    setUploading(true)
    const fd = new FormData(); fd.append('files', file); fd.append('folder', 'marketpro/blog')
    try {
      const r = await api.post('/upload/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(f => ({ ...f, [field]: r.data.data[0]?.url || '' }))
      toast.success('Uploaded!')
    } catch { toast.error('Upload failed') }
    setUploading(false)
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !form.tags.includes(t)) setForm(f => ({...f, tags:[...f.tags,t]}))
    setTagInput('')
  }

  const inputCls = 'input text-sm py-2.5'
  const lbl = 'text-xs font-semibold text-gray-600 block mb-1.5'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary-500" /> Blog Management
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} posts · {categories.length} categories</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm py-2.5">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[['posts','Posts',BookOpen],['categories','Categories',FolderOpen]].map(([k,label,Icon])=>(
          <button key={k} onClick={()=>setCatTab(k)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${catTab===k?'bg-white shadow-sm text-gray-900':'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* CATEGORIES TAB */}
      {catTab === 'categories' && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="font-display font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary-500" /> Add Category
            </h2>
            <form onSubmit={saveCat} className="space-y-3">
              <div>
                <label className={lbl}>Category Name *</label>
                <input className={inputCls} placeholder="e.g. Tips & Tricks" required
                  value={catForm.name} onChange={e=>setCatForm(f=>({...f,name:e.target.value}))} />
              </div>
              <div>
                <label className={lbl}>Description (optional)</label>
                <input className={inputCls} placeholder="Short description"
                  value={catForm.description} onChange={e=>setCatForm(f=>({...f,description:e.target.value}))} />
              </div>
              <button type="submit" disabled={savingCat} className="btn-primary w-full py-2.5">
                {savingCat ? 'Saving...' : 'Create Category'}
              </button>
            </form>
          </div>
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-800">All Categories ({categories.length})</h2>
            </div>
            {categories.length === 0 ? (
              <div className="py-12 text-center">
                <FolderOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No categories yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
                      {c.description && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
                    </div>
                    <button onClick={()=>deleteCat(c.id,c.name)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* POSTS TAB */}
      {catTab === 'posts' && (<>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9 text-sm py-2.5 w-full" placeholder="Search posts..."
              value={search} onChange={e=>setSearch(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&load(1)} />
          </div>
          <select className="input text-sm py-2.5 w-44" value={catFilter} onChange={e=>{setCatFilter(e.target.value);setPage(1)}}>
            <option value="">All Categories</option>
            {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input text-sm py-2.5 w-36" value={statusFilter} onChange={e=>{setStatus(e.target.value);setPage(1)}}>
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg ml-auto">
            <button onClick={()=>setViewMode('grid')} className={`p-1.5 rounded ${viewMode==='grid'?'bg-white shadow-sm text-primary-500':'text-gray-400'}`}><Grid className="w-4 h-4" /></button>
            <button onClick={()=>setViewMode('list')} className={`p-1.5 rounded ${viewMode==='list'?'bg-white shadow-sm text-primary-500':'text-gray-400'}`}><List className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Posts grid/list */}
        {loading ? (
          <div className={`grid gap-4 ${viewMode==='grid'?'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3':'grid-cols-1'}`}>
            {Array(6).fill(0).map((_,i)=><div key={i} className="skeleton h-48 rounded-2xl" />)}
          </div>
        ) : blogs.length === 0 ? (
          <div className="card p-16 text-center">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold">No blog posts yet</p>
            <button onClick={openCreate} className="btn-primary text-sm mt-4">Write First Post</button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {blogs.map(b=>(
              <div key={b.id} className="card overflow-hidden group">
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  {b.cover_image
                    ? <img src={b.cover_image} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-10 h-10 text-gray-200" /></div>}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS[b.status]||'bg-gray-100 text-gray-600'}`}>{b.status}</span>
                    {b.is_featured && <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-semibold">Featured</span>}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button onClick={()=>openEdit(b)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow"><Edit className="w-3.5 h-3.5 text-gray-700" /></button>
                    <button onClick={()=>handleDelete(b.id,b.title)} className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow"><Trash2 className="w-3.5 h-3.5 text-white" /></button>
                  </div>
                </div>
                <div className="p-4">
                  {b.category && <p className="text-xs text-primary-500 font-semibold uppercase tracking-wide mb-1">{b.category.name}</p>}
                  <h3 className="font-semibold text-gray-800 mt-1 line-clamp-2 text-sm">{b.title}</h3>
                  {b.author_name && <p className="text-xs text-gray-400 mt-1">By {b.author_name}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 text-xs text-gray-400"><Eye className="w-3 h-3" />{b.view_count||0}</div>
                    <p className="text-xs text-gray-400">{b.created_at?new Date(b.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):''}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Title','Category','Author','Status','Views','Date','Actions'].map(h=>(
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {blogs.map(b=>(
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {b.cover_image?<img src={b.cover_image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />:<div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><BookOpen className="w-4 h-4 text-gray-300" /></div>}
                        <p className="font-semibold text-gray-800 line-clamp-1 max-w-[200px]">{b.title}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{b.category?.name||'—'}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{b.author_name||'—'}</td>
                    <td className="px-5 py-4"><span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS[b.status]||'bg-gray-100 text-gray-600'}`}>{b.status}</span></td>
                    <td className="px-5 py-4 text-sm text-gray-500">{b.view_count||0}</td>
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{b.created_at?new Date(b.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):''}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <a href={`/blog/${b.slug||b.id}`} target="_blank" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><Eye className="w-4 h-4" /></a>
                        <button onClick={()=>openEdit(b)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={()=>handleDelete(b.id,b.title)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            {Math.ceil(total/limit) > 1 && (
              <div className="flex justify-between items-center px-5 py-3.5 border-t border-gray-100">
                <p className="text-xs text-gray-500">{total} posts</p>
                <div className="flex gap-1.5">
                  <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="btn-ghost text-xs py-1 px-3 disabled:opacity-40">Prev</button>
                  <span className="text-xs text-gray-500 self-center">Page {page} of {Math.ceil(total/limit)}</span>
                  <button disabled={page*limit>=total} onClick={()=>setPage(p=>p+1)} className="btn-ghost text-xs py-1 px-3 disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </div>
        )}
      </>)}

      {/* BLOG EDITOR MODAL */}
      {modal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={()=>setModal(false)} />
          <div className="fixed inset-x-4 top-4 bottom-4 bg-white rounded-2xl z-50 max-w-5xl mx-auto shadow-2xl flex flex-col animate-scale-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-display font-bold text-xl">{editing?'Edit Post':'New Blog Post'}</h3>
              <button onClick={()=>setModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <form onSubmit={handleSave} id="blog-form">
                <div className="grid lg:grid-cols-3 gap-6">

                  {/* ── LEFT: Title, slug, content ── */}
                  <div className="lg:col-span-2 space-y-4">

                    {/* Title */}
                    <div>
                      <label className={lbl}>Title *</label>
                      <input className={`${inputCls} text-base font-semibold`} required placeholder="Blog post title"
                        value={form.title}
                        onChange={e => {
                          const t = e.target.value
                          setForm(f => ({ ...f, title: t, slug: slugEdited ? f.slug : slugify(t) }))
                        }} />
                    </div>

                    {/* Slug */}
                    <div>
                      <label className={lbl}>
                        URL Slug
                        <span className="ml-2 text-xs text-gray-400 font-normal">auto-generated from title</span>
                      </label>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-gray-400 flex-shrink-0">/blog/</span>
                        <input className={`${inputCls} flex-1`} placeholder="auto-slug"
                          value={form.slug}
                          onChange={e=>{ setSlugEdited(true); setForm(f=>({...f,slug:e.target.value})) }} />
                        {!slugEdited && <span className="text-xs text-green-600 font-medium flex-shrink-0">✓ Auto</span>}
                        {slugEdited && <button type="button" onClick={()=>{ setSlugEdited(false); setForm(f=>({...f,slug:slugify(f.title)})) }} className="text-xs text-primary-500 hover:underline flex-shrink-0">Reset</button>}
                      </div>
                    </div>

                    {/* Excerpt */}
                    <div>
                      <label className={lbl}>Excerpt <span className="font-normal text-gray-400">(shown in listings)</span></label>
                      <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Brief summary of the article"
                        value={form.excerpt} onChange={e=>setForm(f=>({...f,excerpt:e.target.value}))} />
                    </div>

                    {/* Cover image — OLD setup kept */}
                    <div>
                      <label className={lbl}>Cover Image</label>
                      <div className="flex gap-2">
                        <input className={`${inputCls} flex-1`} placeholder="https://... or upload →"
                          value={form.cover_image} onChange={e=>setForm(f=>({...f,cover_image:e.target.value}))} />
                        <button type="button" onClick={()=>coverRef.current?.click()}
                          className="btn-secondary text-sm py-2.5 px-3 flex-shrink-0 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4" />{uploading?'…':'Upload'}
                        </button>
                        <input ref={coverRef} type="file" accept="image/*" className="hidden"
                          onChange={e=>uploadFile(e.target.files[0],'cover_image')} />
                      </div>
                      {form.cover_image && <img src={form.cover_image} alt="" className="mt-2 h-36 w-full object-cover rounded-xl border border-gray-200" />}
                    </div>

                    {/* Video — OLD setup kept */}
                    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-primary-500" /> Cover Video (optional)
                      </p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className={lbl}>YouTube URL</label>
                          <input className={inputCls} placeholder="https://youtube.com/watch?v=..."
                            value={form.youtube_url||''} onChange={e=>setForm(f=>({...f,youtube_url:e.target.value}))} />
                        </div>
                        <div>
                          <label className={lbl}>Upload Video File</label>
                          <div onClick={()=>videoRef.current?.click()}
                            className="border-2 border-dashed rounded-xl p-3 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-all">
                            {uploading?<p className="text-xs text-primary-500 animate-pulse">Uploading...</p>
                              :<><Upload className="w-4 h-4 text-gray-300 mx-auto mb-1"/><p className="text-xs text-gray-400">MP4, WebM, MOV</p></>}
                            <input ref={videoRef} type="file" accept="video/*" className="hidden"
                              onChange={e=>uploadFile(e.target.files[0],'video_url')} />
                          </div>
                        </div>
                      </div>
                      {form.youtube_url && <div className="rounded-xl overflow-hidden aspect-video bg-black"><iframe src={form.youtube_url.replace('watch?v=','embed/').replace('youtu.be/','youtube.com/embed/')} allowFullScreen className="w-full h-full" /></div>}
                      {form.video_url && !form.youtube_url && <video src={form.video_url} controls className="w-full rounded-xl max-h-48" />}
                    </div>

                    {/* Content editor: blocks OR raw HTML */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className={lbl + ' mb-0'}>Content</label>
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                          <button type="button" onClick={()=>setEditorTab('blocks')}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${editorTab==='blocks'?'bg-white shadow-sm text-gray-900':'text-gray-500'}`}>
                            Block Editor
                          </button>
                          <button type="button" onClick={()=>setEditorTab('html')}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${editorTab==='html'?'bg-white shadow-sm text-gray-900':'text-gray-500'}`}>
                            HTML
                          </button>
                        </div>
                      </div>

                      {editorTab === 'blocks'
                        ? <BlockEditor blocks={blocks} setBlocks={setBlocks} />
                        : <textarea rows={16} className={`${inputCls} resize-none font-mono text-xs`}
                            placeholder="<p>Write your article content here...</p>"
                            value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} />
                      }
                    </div>

                    {/* Tags */}
                    <div>
                      <label className={lbl}>Tags</label>
                      <div className="flex gap-2">
                        <input className={`${inputCls} flex-1`} placeholder="Add tag and press Enter"
                          value={tagInput} onChange={e=>setTagInput(e.target.value)}
                          onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addTag())} />
                        <button type="button" onClick={addTag} className="btn-primary py-2.5 px-4 text-sm">Add</button>
                      </div>
                      {form.tags.length>0&&(
                        <div className="flex flex-wrap gap-2 mt-2">
                          {form.tags.map(t=>(
                            <span key={t} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold">
                              {t}<button type="button" onClick={()=>setForm(f=>({...f,tags:f.tags.filter(x=>x!==t)}))}><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── RIGHT: Settings ── */}
                  <div className="space-y-4">
                    {/* Status */}
                    <div className="card p-4 space-y-3">
                      <h3 className="font-semibold text-gray-800 text-sm">Publish Settings</h3>
                      <div>
                        <label className={lbl}>Status</label>
                        <select className={inputCls} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Publish Date</label>
                        <input type="date" className={inputCls} value={form.published_at||''}
                          onChange={e=>setForm(f=>({...f,published_at:e.target.value}))} />
                      </div>
                      <div>
                        <label className={lbl}>Category</label>
                        <select className={inputCls} value={form.category_id} onChange={e=>setForm(f=>({...f,category_id:e.target.value}))}>
                          <option value="">No Category</option>
                          {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="accent-primary-500 w-4 h-4" checked={form.is_featured} onChange={e=>setForm(f=>({...f,is_featured:e.target.checked}))} />
                        <span className="text-sm text-gray-700">Featured post</span>
                      </label>
                    </div>

                    {/* Author */}
                    <div className="card p-4 space-y-3">
                      <h3 className="font-semibold text-gray-800 text-sm">Author / Byline</h3>
                      <div>
                        <label className={lbl}>Author Name</label>
                        <input className={inputCls} placeholder="e.g. Ravi Kumar"
                          value={form.author_name||''} onChange={e=>setForm(f=>({...f,author_name:e.target.value}))} />
                      </div>
                      <div>
                        <label className={lbl}>Author Avatar URL</label>
                        <input className={inputCls} placeholder="https://..."
                          value={form.author_avatar||''} onChange={e=>setForm(f=>({...f,author_avatar:e.target.value}))} />
                        {form.author_avatar && (
                          <img src={form.author_avatar} alt="" className="mt-2 w-10 h-10 rounded-full object-cover border-2 border-primary-200" />
                        )}
                      </div>
                    </div>

                    {/* SEO */}
                    <div className="card p-4 space-y-3">
                      <h3 className="font-semibold text-gray-800 text-sm">SEO</h3>
                      <div>
                        <label className={lbl}>Meta Title</label>
                        <input className={inputCls} placeholder={form.title||'SEO title'}
                          value={form.meta_title} onChange={e=>setForm(f=>({...f,meta_title:e.target.value}))} />
                      </div>
                      <div>
                        <label className={lbl}>Meta Description</label>
                        <textarea rows={2} className={`${inputCls} resize-none`} placeholder={form.excerpt||'SEO description'}
                          value={form.meta_description} onChange={e=>setForm(f=>({...f,meta_description:e.target.value}))} />
                      </div>
                    </div>

                    <button form="blog-form" type="submit" disabled={saving} className="btn-primary w-full py-3">
                      <Save className="w-4 h-4" />{saving?'Saving…':editing?'Update Post':'Publish Post'}
                    </button>
                    <button type="button" onClick={()=>setModal(false)} className="btn-secondary w-full py-2.5">Cancel</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
