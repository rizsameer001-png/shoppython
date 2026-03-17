import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Palette, Ruler, Tag, X, GripVertical, Grid } from 'lucide-react'
import api from '@/api/axios'
import toast from 'react-hot-toast'

const ATTR_TYPES = [
  { value: 'select',  label: 'Dropdown Select',  icon: '▾' },
  { value: 'color',   label: 'Color Swatch',      icon: '●' },
  { value: 'image',   label: 'Image Swatch',      icon: '▣' },
  { value: 'text',    label: 'Text Input',         icon: 'T' },
  { value: 'number',  label: 'Number Input',       icon: '#' },
]

const PRESET_ATTRS = [
  { name:'Size',        type:'select', values:['XS','S','M','L','XL','XXL','XXXL'], has_chart:true },
  { name:'Color',       type:'color',  values:['Red','Blue','Green','Black','White','Yellow','Pink','Orange'] },
  { name:'Material',    type:'select', values:['Cotton','Polyester','Wool','Silk','Linen','Leather','Denim'] },
  { name:'Storage',     type:'select', values:['64GB','128GB','256GB','512GB','1TB'] },
  { name:'RAM',         type:'select', values:['4GB','6GB','8GB','12GB','16GB'] },
  { name:'Book Format', type:'select', values:['Paperback','Hardcover','E-Book','Audio'] },
  { name:'Package',     type:'select', values:['Basic','Standard','Premium','Enterprise'] },
  { name:'Weight',      type:'select', values:['100g','250g','500g','1kg','2kg','5kg'] },
]

const EMPTY_ATTR = {
  name:'', type:'select', values:[], category_ids:[],
  is_required:false, is_variant:true, is_filterable:true,
  sort_order:0, size_chart:null, description:'',
}

const EMPTY_VAL = { value:'', label:'', color_hex:'#000000', image:'', sort_order:0 }

// Default size chart template
const DEFAULT_SIZE_CHART = {
  cols: ['Size','Chest (in)','Waist (in)','Hip (in)','Length (in)'],
  rows: ['XS','S','M','L','XL','XXL'],
  data: [
    ['XS','32-33','24-25','34-35','27'],
    ['S', '34-35','26-27','36-37','27.5'],
    ['M', '36-37','28-29','38-39','28'],
    ['L', '38-40','30-32','40-42','28.5'],
    ['XL','41-43','33-35','43-45','29'],
    ['XXL','44-46','36-38','46-48','29.5'],
  ]
}

export default function AdminAttributes() {
  const [attrs, setAttrs]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY_ATTR)
  const [valInput, setValInput] = useState(EMPTY_VAL)
  const [saving, setSaving]     = useState(false)
  const [sizeChartOpen, setSizeChartOpen] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/attributes')
      setAttrs(res.data.data)
    } catch { toast.error('Failed to load') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = (preset = null) => {
    setEditing(null)
    if (preset) {
      setForm({
        ...EMPTY_ATTR,
        name: preset.name,
        type: preset.type,
        values: preset.values.map((v, i) => ({ value: v, label: v, color_hex: '#000000', image: '', sort_order: i })),
        size_chart: preset.has_chart ? DEFAULT_SIZE_CHART : null,
      })
    } else {
      setForm(EMPTY_ATTR)
    }
    setModal(true)
  }

  const openEdit = (attr) => {
    setEditing(attr)
    setForm({ ...EMPTY_ATTR, ...attr, values: attr.values || [] })
    setModal(true)
  }

  const addValue = () => {
    if (!valInput.value.trim()) return
    setForm(f => ({
      ...f,
      values: [...f.values, { ...valInput, sort_order: f.values.length }]
    }))
    setValInput(EMPTY_VAL)
  }

  const removeValue = (idx) => setForm(f => ({ ...f, values: f.values.filter((_,i) => i !== idx) }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name required'); return }
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/attributes/${editing.id}`, form)
        toast.success('Attribute updated!')
      } else {
        await api.post('/attributes', form)
        toast.success('Attribute created!')
      }
      setModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Save failed') }
    setSaving(false)
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete attribute "${name}"?`)) return
    try {
      await api.delete(`/attributes/${id}`)
      toast.success('Deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  const updateSizeChartCell = (ri, ci, val) => {
    const sc = JSON.parse(JSON.stringify(form.size_chart || DEFAULT_SIZE_CHART))
    if (!sc.data[ri]) sc.data[ri] = []
    sc.data[ri][ci] = val
    setForm(f => ({ ...f, size_chart: sc }))
  }

  const inputCls = 'input text-sm py-2.5'

  const TYPE_ICON = { select:'▾', color:'●', image:'▣', text:'T', number:'#' }
  const TYPE_COLOR = { select:'bg-blue-100 text-blue-700', color:'bg-pink-100 text-pink-700', image:'bg-purple-100 text-purple-700', text:'bg-gray-100 text-gray-700', number:'bg-orange-100 text-orange-700' }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Grid className="w-6 h-6 text-primary-500" /> Product Attribute Setup
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Define sizes, colors, and custom attributes used across products</p>
        </div>
        <button onClick={() => openCreate()} className="btn-primary text-sm py-2.5">
          <Plus className="w-4 h-4" /> New Attribute
        </button>
      </div>

      {/* Presets */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-3 text-sm">Quick Presets — click to create instantly</h2>
        <div className="flex flex-wrap gap-2">
          {PRESET_ATTRS.map(p => (
            <button key={p.name} onClick={() => openCreate(p)}
              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-sm font-medium text-gray-600 border border-gray-200 hover:border-primary-200 transition-all">
              {p.type === 'color' ? '🎨' : p.name === 'Size' ? '📏' : '📦'} {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Attributes list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : attrs.length === 0 ? (
        <div className="card p-16 text-center">
          <Grid className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">No attributes yet</p>
          <p className="text-gray-400 text-sm mt-1">Use a preset above or create a custom attribute</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {attrs.map((attr, idx) => (
            <div key={attr.id} className={idx > 0 ? 'border-t border-gray-100' : ''}>
              <div className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                <GripVertical className="w-4 h-4 text-gray-300 cursor-grab flex-shrink-0" />
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{attr.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TYPE_COLOR[attr.type] || 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_ICON[attr.type]} {attr.type}
                      </span>
                      {attr.is_variant && <span className="badge-primary text-xs">variant</span>}
                      {attr.is_filterable && <span className="badge-success text-xs">filterable</span>}
                      {attr.size_chart && <span className="badge bg-indigo-100 text-indigo-700 text-xs">📏 size chart</span>}
                    </div>
                    {attr.description && <p className="text-xs text-gray-400 mt-0.5">{attr.description}</p>}
                  </div>
                </div>

                {/* Value preview */}
                <div className="hidden md:flex items-center gap-1.5 flex-wrap max-w-xs">
                  {(attr.values || []).slice(0, 6).map((v, vi) => (
                    attr.type === 'color' && v.color_hex ? (
                      <span key={vi} title={v.label || v.value}
                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                        style={{ backgroundColor: v.color_hex }} />
                    ) : (
                      <span key={vi} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                        {v.value}
                      </span>
                    )
                  ))}
                  {attr.values?.length > 6 && (
                    <span className="text-xs text-gray-400">+{attr.values.length - 6}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setExpandedId(expandedId === attr.id ? null : attr.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                    {expandedId === attr.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(attr)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(attr.id, attr.name)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded values */}
              {expandedId === attr.id && (
                <div className="px-14 pb-4 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-3 mt-3 uppercase tracking-wide">
                    {attr.values?.length || 0} Values
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {attr.values?.map((v, vi) => (
                      <div key={vi} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-gray-200 text-sm">
                        {attr.type === 'color' && v.color_hex && (
                          <span className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                            style={{ backgroundColor: v.color_hex }} />
                        )}
                        <span className="font-medium text-gray-700">{v.value}</span>
                        {v.label && v.label !== v.value && <span className="text-gray-400">({v.label})</span>}
                      </div>
                    ))}
                  </div>

                  {/* Size chart preview */}
                  {attr.size_chart && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Size Chart</p>
                      <div className="overflow-x-auto">
                        <table className="text-xs border-collapse">
                          <thead>
                            <tr>
                              {attr.size_chart.cols.map((col, ci) => (
                                <th key={ci} className="bg-gray-100 border border-gray-200 px-3 py-1.5 font-semibold text-gray-700 whitespace-nowrap">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {attr.size_chart.data.map((row, ri) => (
                              <tr key={ri}>
                                {row.map((cell, ci) => (
                                  <td key={ci} className={`border border-gray-200 px-3 py-1.5 text-gray-600 ${ci===0?'font-semibold bg-gray-50':''}`}>{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setModal(false)} />
          <div className="fixed inset-x-4 top-4 bottom-4 bg-white rounded-2xl z-50 max-w-3xl mx-auto shadow-2xl flex flex-col animate-scale-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-display font-bold text-xl">
                {editing ? `Edit: ${editing.name}` : 'Create Attribute'}
              </h3>
              <button onClick={() => setModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Attribute Name *</label>
                    <input className={inputCls} required placeholder="e.g. Size, Color, Material"
                      value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Type</label>
                    <select className={inputCls} value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                      {ATTR_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Description</label>
                  <input className={inputCls} placeholder="Optional description"
                    value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
                </div>

                {/* Flags */}
                <div className="flex flex-wrap gap-4">
                  {[
                    { key:'is_variant',    label:'Used for variants (generates combinations)' },
                    { key:'is_filterable', label:'Filterable in shop' },
                    { key:'is_required',   label:'Required when adding product' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="accent-primary-500 w-4 h-4"
                        checked={!!form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.checked}))} />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>

                {/* Add values */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-2">
                    Attribute Values ({form.values.length})
                  </label>
                  <div className={`flex ${form.type === 'color' ? 'flex-col' : ''} gap-2`}>
                    {form.type === 'color' ? (
                      <div className="flex gap-2">
                        <input className={`${inputCls} flex-1`} placeholder="Color name (e.g. Red)"
                          value={valInput.value} onChange={e => setValInput(v => ({...v, value: e.target.value, label: e.target.value}))} />
                        <div className="flex items-center gap-2">
                          <input type="color" className="w-10 h-10 rounded-xl cursor-pointer border border-gray-200"
                            value={valInput.color_hex} onChange={e => setValInput(v => ({...v, color_hex: e.target.value}))} />
                          <span className="text-xs text-gray-400 font-mono">{valInput.color_hex}</span>
                        </div>
                        <button type="button" onClick={addValue} className="btn-primary py-2 px-4 text-sm flex-shrink-0">Add</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input className={`${inputCls} flex-1`} placeholder="Add value and press Enter or click Add"
                          value={valInput.value}
                          onChange={e => setValInput(v => ({...v, value: e.target.value, label: e.target.value}))}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addValue())} />
                        <button type="button" onClick={addValue} className="btn-primary py-2 px-4 text-sm flex-shrink-0">Add</button>
                      </div>
                    )}
                  </div>

                  {/* Values chips */}
                  {form.values.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {form.values.map((v, vi) => (
                        <div key={vi} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 group">
                          {form.type === 'color' && v.color_hex && (
                            <span className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: v.color_hex }} />
                          )}
                          <span>{v.value}</span>
                          <button type="button" onClick={() => removeValue(vi)}
                            className="w-4 h-4 rounded-full bg-gray-300 hover:bg-red-400 text-white flex items-center justify-center transition-colors ml-1">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Size chart toggle */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <button type="button" onClick={() => setSizeChartOpen(!sizeChartOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-indigo-500" />
                      <span className="font-semibold text-sm text-gray-800">Size Chart (optional)</span>
                      {form.size_chart && <span className="badge-primary text-xs">Enabled</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button"
                        onClick={e => {
                          e.stopPropagation()
                          setForm(f => ({ ...f, size_chart: f.size_chart ? null : JSON.parse(JSON.stringify(DEFAULT_SIZE_CHART)) }))
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${form.size_chart ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {form.size_chart ? 'Remove' : 'Add Chart'}
                      </button>
                      {sizeChartOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {sizeChartOpen && form.size_chart && (
                    <div className="p-4 border-t border-gray-100 overflow-x-auto">
                      <p className="text-xs text-gray-500 mb-3">Edit cells directly. Columns: <strong>{form.size_chart.cols.join(', ')}</strong></p>
                      <table className="text-xs border-collapse w-full">
                        <thead>
                          <tr>
                            {form.size_chart.cols.map((col, ci) => (
                              <th key={ci} className="bg-gray-100 border border-gray-200 px-2 py-1.5">
                                <input className="bg-transparent font-semibold text-gray-700 w-full min-w-[70px] outline-none"
                                  value={col}
                                  onChange={e => {
                                    const cols = [...form.size_chart.cols]
                                    cols[ci] = e.target.value
                                    setForm(f => ({ ...f, size_chart: { ...f.size_chart, cols } }))
                                  }} />
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {form.size_chart.data.map((row, ri) => (
                            <tr key={ri}>
                              {form.size_chart.cols.map((_, ci) => (
                                <td key={ci} className="border border-gray-200">
                                  <input
                                    className={`w-full px-2 py-1.5 outline-none text-xs ${ci===0?'font-semibold bg-gray-50':''}`}
                                    value={row[ci] || ''}
                                    onChange={e => updateSizeChartCell(ri, ci, e.target.value)}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="flex gap-2 mt-3">
                        <button type="button"
                          onClick={() => {
                            const sc = { ...form.size_chart, rows: [...form.size_chart.rows, ''], data: [...form.size_chart.data, Array(form.size_chart.cols.length).fill('')] }
                            setForm(f => ({ ...f, size_chart: sc }))
                          }}
                          className="btn-ghost text-xs py-1.5 border border-gray-200">+ Add Row</button>
                        <button type="button"
                          onClick={() => {
                            const sc = { ...form.size_chart, cols: [...form.size_chart.cols, 'New Column'], data: form.size_chart.data.map(r => [...r, '']) }
                            setForm(f => ({ ...f, size_chart: sc }))
                          }}
                          className="btn-ghost text-xs py-1.5 border border-gray-200">+ Add Column</button>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving...' : editing ? 'Update Attribute' : 'Create Attribute'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
