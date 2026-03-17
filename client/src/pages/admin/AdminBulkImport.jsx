import { useState, useRef } from 'react'
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle, Package, Tags, ArrowRight } from 'lucide-react'
import api from '@/api/axios'
import toast from 'react-hot-toast'

function ProgressBar({ value, color = 'bg-primary-500' }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
    </div>
  )
}

export default function AdminBulkImport() {
  const [activeTab, setActiveTab] = useState('products')
  const [importing, setImporting] = useState(false)
  const [result, setResult]       = useState(null)
  const [dragOver, setDragOver]   = useState(false)
  const fileRef = useRef()

  const handleDownloadTemplate = async (type) => {
    try {
      const res = await api.get(`/bulk/template/${type}`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a   = document.createElement('a')
      a.href = url
      a.download = `${type}_template.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${type} template downloaded!`)
    } catch { toast.error('Download failed') }
  }

  const handleExport = async (type) => {
    try {
      const res = await api.get(`/bulk/export/${type}`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a   = document.createElement('a')
      a.href = url
      a.download = `${type}_export.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${type} exported!`)
    } catch { toast.error('Export failed') }
  }

  const handleImport = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['csv'].includes(ext)) {
      toast.error('Only CSV files are supported')
      return
    }
    setImporting(true)
    setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await api.post(`/bulk/import/${activeTab}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data)
      if (res.data.errors?.length === 0) {
        toast.success(res.data.message)
      } else {
        toast(`${res.data.message} (${res.data.errors?.length} errors)`, { icon: '⚠️' })
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Import failed')
      setResult({ success: false, message: err.response?.data?.detail || 'Import failed', errors: [] })
    }
    setImporting(false)
  }

  const total = (result?.created || 0) + (result?.updated || 0)
  const successPct = total > 0 ? Math.round(((result?.created + result?.updated) / (total + (result?.errors?.length || 0))) * 100) : 0

  const CSV_COLUMNS = {
    products: [
      { col: 'name',              req: true,  desc: 'Product name' },
      { col: 'price',             req: true,  desc: 'Sale price (number)' },
      { col: 'category_name',     req: true,  desc: 'Exact category name from system' },
      { col: 'description',       req: false, desc: 'Full description' },
      { col: 'short_description', req: false, desc: 'Short summary' },
      { col: 'compare_price',     req: false, desc: 'Original/crossed price' },
      { col: 'cost_price',        req: false, desc: 'Your cost price' },
      { col: 'sku',               req: false, desc: 'Unique SKU (used to update existing)' },
      { col: 'stock',             req: false, desc: 'Stock quantity (default: 0)' },
      { col: 'brand_name',        req: false, desc: 'Exact brand name from system' },
      { col: 'tags',              req: false, desc: 'Pipe-separated: tag1|tag2|tag3' },
      { col: 'images',            req: false, desc: 'Pipe-separated image URLs' },
      { col: 'youtube_url',       req: false, desc: 'YouTube video URL' },
      { col: 'weight',            req: false, desc: 'Weight in kg' },
      { col: 'is_active',         req: false, desc: 'True/False (default: True)' },
      { col: 'is_featured',       req: false, desc: 'True/False (default: False)' },
      { col: 'is_new_arrival',    req: false, desc: 'True/False (default: False)' },
      { col: 'is_on_sale',        req: false, desc: 'True/False (default: False)' },
    ],
    categories: [
      { col: 'name',        req: true,  desc: 'Category name' },
      { col: 'description', req: false, desc: 'Category description' },
      { col: 'parent_name', req: false, desc: 'Parent category name (for subcategories)' },
      { col: 'is_active',   req: false, desc: 'True/False (default: True)' },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Upload className="w-6 h-6 text-primary-500" /> Bulk Import / Export
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Import or export products and categories using CSV files</p>
      </div>

      {/* Tab */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1.5 w-fit">
        {[
          { key:'products',   label:'Products',   icon:Package },
          { key:'categories', label:'Categories', icon:Tags },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setActiveTab(key); setResult(null) }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
              ${activeTab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Import */}
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-display font-bold text-lg text-gray-900 mb-1 flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary-500" /> Import {activeTab}
            </h2>
            <p className="text-sm text-gray-500 mb-5">Upload a CSV file to bulk create or update {activeTab}. Existing SKUs will be updated, new ones created.</p>

            {/* Drag and drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleImport(e.dataTransfer.files[0]) }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
                ${dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}
                ${importing ? 'opacity-60 cursor-wait' : ''}`}
            >
              {importing ? (
                <div>
                  <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="font-semibold text-gray-700">Importing...</p>
                  <p className="text-sm text-gray-400 mt-1">Please wait, processing rows</p>
                </div>
              ) : (
                <div>
                  <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-7 h-7 text-primary-500" />
                  </div>
                  <p className="font-semibold text-gray-700">Drag & drop your CSV file here</p>
                  <p className="text-sm text-gray-400 mt-1">or click to browse files</p>
                  <p className="text-xs text-gray-300 mt-3">Supports: .csv</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept=".csv" className="hidden"
                onChange={e => handleImport(e.target.files[0])} disabled={importing} />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleDownloadTemplate(activeTab)}
                className="btn-secondary flex-1 text-sm py-2.5">
                <Download className="w-4 h-4" /> Download Template
              </button>
            </div>
          </div>

          {/* Import result */}
          {result && (
            <div className={`card p-5 border-l-4 ${result.success ? 'border-green-500' : 'border-red-500'} animate-slide-up`}>
              <div className="flex items-center gap-2 mb-3">
                {result.success
                  ? <CheckCircle className="w-5 h-5 text-green-500" />
                  : <XCircle className="w-5 h-5 text-red-500" />}
                <p className="font-semibold text-gray-800">{result.message}</p>
              </div>

              {result.success && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-green-50 rounded-xl">
                      <p className="text-2xl font-display font-bold text-green-600">{result.created || 0}</p>
                      <p className="text-xs text-green-600 font-medium">Created</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                      <p className="text-2xl font-display font-bold text-blue-600">{result.updated || 0}</p>
                      <p className="text-xs text-blue-600 font-medium">Updated</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-xl">
                      <p className="text-2xl font-display font-bold text-red-500">{result.errors?.length || 0}</p>
                      <p className="text-xs text-red-500 font-medium">Errors</p>
                    </div>
                  </div>
                  <ProgressBar value={successPct} />
                  <p className="text-xs text-gray-400 mt-1.5 text-right">{successPct}% success rate</p>
                </>
              )}

              {result.errors?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Errors (showing first {result.errors.length}):
                  </p>
                  <div className="bg-red-50 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600 font-mono">{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export + Column reference */}
        <div className="space-y-4">
          {/* Export */}
          <div className="card p-6">
            <h2 className="font-display font-bold text-lg text-gray-900 mb-1 flex items-center gap-2">
              <Download className="w-5 h-5 text-green-500" /> Export {activeTab}
            </h2>
            <p className="text-sm text-gray-500 mb-5">Download all your {activeTab} as a CSV file. Use this to back up data or edit in bulk.</p>
            <button onClick={() => handleExport(activeTab)} className="btn-primary w-full py-3">
              <Download className="w-5 h-5" /> Export All {activeTab === 'products' ? 'Products' : 'Categories'} to CSV
            </button>
          </div>

          {/* Column reference */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" /> CSV Column Reference
              <span className="badge-primary text-xs">{activeTab}</span>
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {CSV_COLUMNS[activeTab].map(({ col, req, desc }) => (
                <div key={col} className="flex items-start gap-3 py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex-shrink-0 mt-0.5">
                    {req
                      ? <span className="w-2 h-2 bg-red-400 rounded-full block" title="Required" />
                      : <span className="w-2 h-2 bg-gray-300 rounded-full block" title="Optional" />}
                  </div>
                  <div className="min-w-0">
                    <code className="text-xs font-mono font-semibold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">{col}</code>
                    {req && <span className="ml-1 text-xs text-red-500 font-semibold">required</span>}
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 bg-red-400 rounded-full" /> Required
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 bg-gray-300 rounded-full" /> Optional
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">💡 Import Tips</p>
            <ul className="text-xs text-blue-700 space-y-1.5">
              <li className="flex gap-1.5"><ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" /> Download the template first to see the correct format</li>
              <li className="flex gap-1.5"><ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" /> Products with matching SKU will be updated, not duplicated</li>
              <li className="flex gap-1.5"><ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" /> Category and Brand must match exact names in the system</li>
              <li className="flex gap-1.5"><ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" /> Separate multiple tags and images with pipe | character</li>
              <li className="flex gap-1.5"><ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" /> Save your file as UTF-8 CSV (not Excel .xlsx)</li>
              <li className="flex gap-1.5"><ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" /> Max recommended: 1000 rows per import file</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
