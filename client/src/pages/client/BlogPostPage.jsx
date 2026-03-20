import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Eye, Tag, Volume2, Play, Pause, Square, BookOpen, ChevronRight, Clock, TrendingUp } from 'lucide-react'
import api from '@/api/axios'

/* ── Block renderer ───────────────────────────────────────────────────────── */
function BlockRenderer({ blocks }) {

  useEffect(() => {
    const hasInsta   = blocks.some(b => b.type === 'instagram')
    const hasTwitter = blocks.some(b => b.type === 'twitter')

    /* ── Instagram ── */
    if (hasInsta) {
      if (window.instgrm) {
        // SDK already loaded — just re-process all blockquotes on the page
        window.instgrm.Embeds.process()
      } else {
        // First load — process() after script executes
        const s = document.createElement('script')
        s.src = 'https://www.instagram.com/embed.js'
        s.async = true
        s.onload = () => window.instgrm?.Embeds.process()
        document.body.appendChild(s)
      }
    }

    /* ── Twitter / X ── */
    if (hasTwitter) {
      if (window.twttr?.widgets) {
        // SDK already loaded — load widgets inside this container
        window.twttr.widgets.load(document.getElementById('blog-blocks'))
      } else {
        const s = document.createElement('script')
        s.src = 'https://platform.twitter.com/widgets.js'
        s.async = true
        s.onload = () =>
          window.twttr?.widgets.load(document.getElementById('blog-blocks'))
        document.body.appendChild(s)
      }
    }
  }, [blocks])

  return (
    <div id="blog-blocks" className="space-y-5">
      {blocks.map((block, i) => {
        const d = block.data || {}
        switch (block.type) {
          case 'paragraph':
            return d.text ? (
              <p key={i} className="text-gray-700 leading-relaxed text-base">{d.text}</p>
            ) : null
          case 'heading':
            const Tag = `h${d.level || 2}`
            return <Tag key={i} className={`font-display font-bold text-gray-900 ${d.level<=1?'text-3xl':d.level===2?'text-2xl':d.level===3?'text-xl':'text-lg'} mt-6 mb-2`}>{d.text}</Tag>
          case 'quote':
            return (
              <blockquote key={i} className="border-l-4 border-primary-400 bg-primary-50 rounded-r-2xl px-6 py-4">
                <p className="text-gray-700 italic text-lg leading-relaxed">"{d.text}"</p>
                {d.attribution && <cite className="text-sm text-gray-500 font-medium mt-2 block">— {d.attribution}</cite>}
              </blockquote>
            )
          case 'image':
            return d.src ? (
              <figure key={i} className="my-6">
                <img src={d.src} alt={d.alt || ''} className="w-full rounded-2xl shadow-md object-cover max-h-[500px]" />
                {d.caption && <figcaption className="text-center text-sm text-gray-500 mt-2 italic">{d.caption}</figcaption>}
              </figure>
            ) : null
          case 'video':
            return d.src ? (
              <div key={i} className="my-6">
                <video src={d.src} controls className="w-full rounded-2xl shadow-md max-h-96" />
                {d.caption && <p className="text-center text-sm text-gray-500 mt-2 italic">{d.caption}</p>}
              </div>
            ) : null
          case 'youtube':
            return d.url ? (
              <div key={i} className="my-6 rounded-2xl overflow-hidden aspect-video bg-black shadow-md">
                <iframe src={d.url.replace('watch?v=','embed/').replace('youtu.be/','youtube.com/embed/')}
                  allow="autoplay; fullscreen" allowFullScreen className="w-full h-full" />
              </div>
            ) : null
          case 'instagram':
            return d.url ? (
              <div key={i} className="my-6 flex flex-col items-center">
                {/* Instagram SDK replaces this blockquote with the full embed */}
                <blockquote
                  className="instagram-media"
                  data-instgrm-permalink={d.url}
                  data-instgrm-version="14"
                  data-instgrm-captioned
                  style={{ maxWidth: 540, minWidth: 326, width: '100%', margin: '0 auto' }}
                />
                {d.caption && <p className="text-center text-sm text-gray-500 mt-2 italic">{d.caption}</p>}
              </div>
            ) : null
          case 'twitter':
            return d.url ? (
              <div key={i} className="my-6 flex justify-center">
                {/* Twitter SDK replaces this blockquote with the full widget */}
                <blockquote className="twitter-tweet" data-dnt="true" data-theme="light">
                  {/* The SDK reads the href of the last <a> tag as the tweet URL */}
                  <a href={d.url.replace('x.com', 'twitter.com')}></a>
                </blockquote>
              </div>
            ) : null
          case 'facebook':
            return d.url ? (
              <div key={i} className="my-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                <p className="text-xs text-blue-600 font-semibold mb-2">📘 Facebook Post</p>
                <a href={d.url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline break-all">{d.url}</a>
              </div>
            ) : null
          case 'ad':
            return d.html ? (
              <div key={i} className="my-4" dangerouslySetInnerHTML={{ __html: d.html }} />
            ) : null
          case 'code':
            return (
              <div key={i} className="my-4">
                {d.language && <div className="flex items-center gap-2 bg-gray-800 text-gray-400 px-4 py-1.5 rounded-t-xl text-xs font-mono">{d.language}</div>}
                <pre className={`bg-gray-900 text-green-400 p-4 overflow-x-auto text-sm font-mono leading-relaxed ${d.language?'rounded-b-xl':'rounded-xl'}`}>
                  <code>{d.code}</code>
                </pre>
              </div>
            )
          case 'divider':
            return <hr key={i} className="my-8 border-gray-200" />
          default:
            return null
        }
      })}
    </div>
  )
}

/* ── Reading-time estimate ─────────────────────────────────────────────────── */
function readingTime(html) {
  const text = html?.replace(/<[^>]+>/g, '') || ''
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

/* ── Web Speech voice reader ───────────────────────────────────────────────── */
function useVoice(text) {
  const [playing, setPlaying] = useState(false)
  const [paused,  setPaused]  = useState(false)
  const ok = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => () => { ok && window.speechSynthesis.cancel() }, [])

  const strip = h => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent || '' }

  const speak = useCallback(() => {
    if (!ok || !text) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(strip(text))
    u.rate = 0.95; u.lang = 'en-US'
    const voices = window.speechSynthesis.getVoices()
    const v = voices.find(v => /Google|Natural|Samantha/i.test(v.name)) ||
              voices.find(v => v.lang.startsWith('en')) || voices[0]
    if (v) u.voice = v
    u.onstart  = () => { setPlaying(true);  setPaused(false) }
    u.onend    = () => { setPlaying(false); setPaused(false) }
    u.onerror  = () => { setPlaying(false); setPaused(false) }
    u.onpause  = () => setPaused(true)
    u.onresume = () => setPaused(false)
    window.speechSynthesis.speak(u)
  }, [text, ok])

  const pause  = () => { window.speechSynthesis.pause();  setPaused(true)  }
  const resume = () => { window.speechSynthesis.resume(); setPaused(false) }
  const stop   = () => { window.speechSynthesis.cancel(); setPlaying(false); setPaused(false) }

  return { ok, playing, paused, speak, pause, resume, stop }
}

/* ── Voice bar ─────────────────────────────────────────────────────────────── */
function VoiceBar({ text }) {
  const { ok, playing, paused, speak, pause, resume, stop } = useVoice(text)
  if (!ok) return null
  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-2xl px-4 py-3 mb-8">
      <Volume2 className={`w-4 h-4 text-primary-500 flex-shrink-0 ${playing && !paused ? 'animate-pulse' : ''}`} />
      <span className="text-sm font-semibold text-primary-700 flex-1">
        {playing && !paused ? 'Reading aloud…' : paused ? 'Paused' : 'Listen to this article'}
      </span>
      <div className="flex items-center gap-2">
        {!playing ? (
          <button onClick={speak} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white rounded-xl text-xs font-semibold hover:bg-primary-600 transition-colors">
            <Play className="w-3 h-3 fill-current" /> Play
          </button>
        ) : paused ? (
          <button onClick={resume} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white rounded-xl text-xs font-semibold hover:bg-primary-600 transition-colors">
            <Play className="w-3 h-3 fill-current" /> Resume
          </button>
        ) : (
          <button onClick={pause} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-semibold hover:bg-amber-600 transition-colors">
            <Pause className="w-3 h-3 fill-current" /> Pause
          </button>
        )}
        {playing && (
          <button onClick={stop} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-300 transition-colors">
            <Square className="w-3 h-3 fill-current" /> Stop
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Sidebar: popular posts ────────────────────────────────────────────────── */
function PopularPosts({ currentId }) {
  const [posts, setPosts] = useState([])
  useEffect(() => {
    api.get('/blogs/popular?limit=5').then(r => {
      setPosts((r.data.data || []).filter(p => p.id !== currentId))
    }).catch(() => {})
  }, [currentId])

  if (!posts.length) return null
  return (
    <div className="card p-5">
      <h3 className="font-display font-bold text-gray-900 flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-primary-500" /> Popular Posts
      </h3>
      <div className="space-y-3">
        {posts.map(p => (
          <Link key={p.id} to={`/blog/${p.slug || p.id}`} className="flex gap-3 group">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              {p.cover_image
                ? <img src={p.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                : <BookOpen className="w-5 h-5 text-gray-300 m-auto mt-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug">{p.title}</p>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Eye className="w-3 h-3" /> {p.view_count || 0} views
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ── Sidebar: categories ───────────────────────────────────────────────────── */
function CategoryList({ activeCatId }) {
  const [cats, setCats] = useState([])
  useEffect(() => {
    api.get('/blogs/categories').then(r => setCats(r.data.data || [])).catch(() => {})
  }, [])

  if (!cats.length) return null
  return (
    <div className="card p-5">
      <h3 className="font-display font-bold text-gray-900 flex items-center gap-2 mb-4">
        <Tag className="w-4 h-4 text-primary-500" /> Categories
      </h3>
      <div className="space-y-1">
        <Link to="/blog" className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${!activeCatId ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
          <span>All Posts</span>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        </Link>
        {cats.map(c => (
          <Link key={c.id} to={`/blog?category=${c.id}`}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors
              ${activeCatId === c.id ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span>{c.name}</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ── Related posts (same category) ────────────────────────────────────────── */
function RelatedPosts({ categoryId, currentId }) {
  const [posts, setPosts] = useState([])
  useEffect(() => {
    if (!categoryId) return
    api.get(`/blogs/by-category/${categoryId}?limit=4&exclude_id=${currentId}`)
      .then(r => setPosts(r.data.data || []))
      .catch(() => {})
  }, [categoryId, currentId])

  if (!posts.length) return null
  return (
    <div className="mt-16">
      <h2 className="font-display text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-primary-500" /> Related Articles
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {posts.map(p => (
          <Link key={p.id} to={`/blog/${p.slug || p.id}`} className="card overflow-hidden group hover:shadow-card-hover transition-all">
            <div className="aspect-video bg-gray-100 overflow-hidden">
              {p.cover_image
                ? <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-gray-200" /></div>}
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 group-hover:text-primary-600 transition-colors">{p.title}</h4>
              {p.excerpt && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.excerpt}</p>}
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(p.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ── Main page ─────────────────────────────────────────────────────────────── */
export default function BlogPostPage() {
  const { slug }              = useParams()
  const [post, setPost]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setPost(null)
    setLoading(true)
    api.get(`/blogs/${slug}`)
      .then(r => setPost(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
    window.scrollTo(0, 0)
    return () => window.speechSynthesis?.cancel()
  }, [slug])

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
    </div>
  )

  if (!post) return (
    <div className="max-w-6xl mx-auto px-4 py-20 text-center">
      <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
      <p className="text-gray-500 font-semibold text-lg">Post not found</p>
      <Link to="/blog" className="btn-primary mt-4 inline-flex">Back to Blog</Link>
    </div>
  )

  const mins      = readingTime(post.content)
  const readText  = `${post.title}. ${post.excerpt || ''}. ${post.content || ''}`

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back link */}
      <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Blog
      </Link>

      <div className="flex gap-8 lg:gap-12">
        {/* ── Main content column ── */}
        <article className="flex-1 min-w-0">

          {/* Hero media — cover image OR youtube OR video  */}
{/*          {post.cover_image && (
            <div className="rounded-2xl overflow-hidden mb-8 shadow-lg ">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full max-h-[500px] object-cover"
              />
            </div>
          )}
          {post.youtube_url && (
            <div className="rounded-2xl overflow-hidden aspect-video mb-8 bg-black shadow-lg">
              <iframe
                src={post.youtube_url.replace('watch?v=','embed/').replace('youtu.be/','www.youtube.com/embed/')}
                allow="autoplay; fullscreen" allowFullScreen className="w-full h-full"
              />
            </div>
          )}
          {post.video_url && !post.youtube_url && (
            <video src={post.video_url} controls className="w-full rounded-2xl mb-8 shadow-lg max-h-96" />
          )}*/}

          {/* Hero media — cover image OR youtube OR video */}
{post.cover_image && (
  <div className="rounded-2xl overflow-hidden mb-8 shadow-lg aspect-[3/4]">
    <img
      src={post.cover_image}
      alt={post.title}
      className="w-full h-full object-cover"
    />
  </div>
)}

{post.youtube_url && (
  <div className="rounded-2xl overflow-hidden mb-8 shadow-lg aspect-[4/2.3] bg-black">
    <iframe
      src={post.youtube_url
        .replace('watch?v=', 'embed/')
        .replace('youtu.be/', 'www.youtube.com/embed/')}
      allow="autoplay; fullscreen"
      allowFullScreen
      className="w-full h-full"
    />
  </div>
)}

{post.video_url && !post.youtube_url && (
  <div className="rounded-2xl overflow-hidden mb-8 shadow-lg aspect-[4/2.3] bg-black">
    <video
      src={post.video_url}
      controls
      className="w-full h-full object-cover"
    />
  </div>
)}

          {/* Category pill */}
          {post.category && (
            <Link to={`/blog?category=${post.category.id}`}
              className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4 hover:bg-primary-200 transition-colors uppercase tracking-wide">
              {post.category.name}
            </Link>
          )}

          {/* Title */}
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-5">
            {post.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 pb-6 mb-6 border-b border-gray-100">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(post.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />{post.view_count || 0} views
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />{mins} min read
            </span>
          </div>

          {/* Author byline */}
          {post.author_name && (
            <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-xl">
              {post.author_avatar
                ? <img src={post.author_avatar} alt={post.author_name} className="w-10 h-10 rounded-full object-cover border-2 border-primary-200 flex-shrink-0" />
                : <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-600 font-bold text-sm">{post.author_name[0]}</div>
              }
              <div>
                <p className="font-semibold text-gray-800 text-sm">{post.author_name}</p>
                <p className="text-xs text-gray-400">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})
                    : new Date(post.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})
                  }
                </p>
              </div>
            </div>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-lg text-gray-600 leading-relaxed mb-6 font-medium border-l-4 border-primary-400 pl-4">
              {post.excerpt}
            </p>
          )}

          {/* Voice reading */}
          <VoiceBar text={readText} />

          {/* Article body — blocks first, fallback to HTML */}
          {post.blocks?.length > 0
            ? <BlockRenderer blocks={post.blocks} />
            : <div
                className="prose prose-lg prose-gray max-w-none text-gray-700 leading-relaxed
                  prose-headings:font-display prose-headings:text-gray-900
                  prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-2xl prose-img:shadow-md
                  prose-blockquote:border-primary-400 prose-blockquote:bg-primary-50 prose-blockquote:rounded-r-xl"
                dangerouslySetInnerHTML={{ __html: post.content || '<p>No content available.</p>' }}
              />
          }

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-10 pt-8 border-t border-gray-100">
              <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {post.tags.map(t => (
                <Link key={t} to={`/blog?search=${t}`}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-primary-50 hover:text-primary-600 transition-colors font-medium">
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </article>

        {/* ── Right sidebar ── */}
        <aside className="hidden lg:flex flex-col gap-5 w-72 flex-shrink-0">
          <PopularPosts currentId={post.id} />
          <CategoryList activeCatId={post.category?.id} />
        </aside>
      </div>

      {/* Related posts (same category) */}
      {post.category?.id && (
        <RelatedPosts categoryId={post.category.id} currentId={post.id} />
      )}
    </div>
  )
}
