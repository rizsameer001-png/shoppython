import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Eye, Tag } from 'lucide-react'
import api from '@/api/axios'

export default function BlogPostPage() {
  const { slug } = useParams()
  const [post, setPost]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/blogs/${slug}`)
      .then(r => setPost(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
    window.scrollTo(0, 0)
  }, [slug])

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" /></div>
  if (!post) return <div className="max-w-3xl mx-auto px-4 py-20 text-center"><p className="text-gray-500">Post not found.</p><Link to="/blog" className="btn-primary mt-4 inline-flex">Back to Blog</Link></div>

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Blog
      </Link>

      {post.cover_image && (
        <div className="rounded-2xl overflow-hidden aspect-video mb-8">
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      {post.category && <p className="text-primary-500 font-semibold text-sm uppercase tracking-widest mb-2">{post.category.name}</p>}
      <h1 className="section-title mb-4">{post.title}</h1>

      <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-100">
        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(post.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</span>
        <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{post.view_count||0} views</span>
      </div>

      {/* Content */}
      <div
        className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: post.content || '<p>No content available.</p>' }}
      />

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-gray-100">
          <Tag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          {post.tags.map(t => (
            <Link key={t} to={`/blog?search=${t}`}
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-primary-50 hover:text-primary-600 transition-colors">
              {t}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
