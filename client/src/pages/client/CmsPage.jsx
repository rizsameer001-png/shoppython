import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import api from '@/api/axios'

export default function CmsPage() {
  const { slug }              = useParams()
  const [page, setPage]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/cms/${slug}`)
      .then(r => setPage(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
    window.scrollTo(0, 0)
  }, [slug])

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" /></div>
  if (!page || page.status !== 'published') return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
      <p className="text-gray-500 font-semibold">Page not found</p>
      <Link to="/" className="btn-primary mt-4 inline-flex">Go Home</Link>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Home
      </Link>

      {page.cover_image && (
        <div className="rounded-2xl overflow-hidden aspect-video mb-8">
          <img src={page.cover_image} alt={page.title} className="w-full h-full object-cover" />
        </div>
      )}

      <h1 className="section-title mb-6">{page.title}</h1>

      {/* Page content */}
      <div
        className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: page.content || '' }}
      />

      {/* Downloadable files */}
      {page.allow_download && page.downloadable_files?.length > 0 && (
        <div className="mt-10 pt-8 border-t border-gray-100">
          <h2 className="font-display font-bold text-xl text-gray-900 mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-primary-500" /> Downloads
          </h2>
          <div className="space-y-3">
            {page.downloadable_files.map((file, i) => (
              <a
                key={i}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                download={file.name}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Download className="w-5 h-5 text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors truncate">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {file.type} {file.size ? `· ${Math.round(file.size/1024)}KB` : ''}
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary-500 flex-shrink-0">Download →</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
