import { useEffect, useState, useRef, Fragment } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { logoMAsset } from '../img'
import iconEdit from '../img/icon_edit.svg'
import { fetchCapsuleById, getCapsuleThumb, type ApiCapsule } from '../services/api'
import '../styles/capsule-interior.css'

const API_BASE = import.meta.env.VITE_API_URL || 'https://momentum-hc2x.onrender.com'

function resolveUrl(url: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`
}

interface Comment {
  _id?: string
  author: { _id?: string; username?: string; name: string; avatar?: string } | string
  text: string
  createdAt?: string
}

function CommentRow({ comment, showReply }: { comment: Comment; showReply?: boolean }) {
  const a = typeof comment.author === 'string' ? { name: comment.author } : comment.author
  const username = (a as any).username || (a as any).name || 'Usuario'
  const avatar = (a as any).avatar ?? null
  return (
    <div className="ci-comment">
      <div className="ci-comment__avatar">
        {avatar ? <img src={avatar} alt={username} /> : <span>{username.charAt(0).toUpperCase()}</span>}
      </div>
      <div className="ci-comment__body">
        <div className="ci-comment__header">
          <strong className="ci-comment__author">@{username}</strong>
          {showReply && <button type="button" className="ci-comment__reply">Contestar</button>}
        </div>
        <p className="ci-comment__text">{comment.text}</p>
      </div>
    </div>
  )
}

function AvatarStack({ users, max = 4 }: { users: any[]; max?: number }) {
  if (!users.length) return null
  return (
    <div className="ci-avatar-stack">
      {users.slice(0, max).map((u, i) => {
        const name = typeof u === 'string' ? u : (u?.name || u?.username || '?')
        const avatar = typeof u === 'string' ? null : u?.avatar
        return (
          <div key={i} className="ci-avatar-stack__item" style={{ zIndex: max - i }}>
            {avatar ? <img src={avatar} alt={name} /> : <span>{name.charAt(0).toUpperCase()}</span>}
          </div>
        )
      })}
    </div>
  )
}

/* Carousel constants (must match CSS):
   padding-left: 16px, gap: 12px, slide = outerW - 92px → peek always 64px */
const SLIDE_GAP = 12
const SLIDE_REDUCTION = 92  // outerW - SLIDE_REDUCTION = slideWidth

function CapsuleInterior() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [capsule, setCapsule] = useState<ApiCapsule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [generalCommentText, setGeneralCommentText] = useState('')
  const [photoCommentText, setPhotoCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // Measure carousel container so slides use container width, not 100vw
  const carouselRef = useRef<HTMLDivElement>(null)
  const [slideWidth, setSlideWidth] = useState(0)

  // Runs again when loading→false so the carousel is in the DOM before we measure
  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    const measure = () => setSlideWidth(el.offsetWidth - SLIDE_REDUCTION)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [loading])

  const mediaItems = (capsule?.mediaItems || []).filter(
    (item) => item.type === 'image' || item.type === 'video'
  )

  useEffect(() => {
    if (!id) { setError('ID de cápsula no encontrado'); setLoading(false); return }
    const token = sessionStorage.getItem('authToken')
    if (!token) { navigate('/login', { replace: true }); return }
    let active = true
    fetchCapsuleById(id)
      .then((data) => { if (active) { setCapsule(data); setLoading(false) } })
      .catch(() => { if (active) { setError('No se pudo cargar la cápsula'); setLoading(false) } })
    return () => { active = false }
  }, [id, navigate])

  const goToSlide = (index: number) => {
    if (index >= 0 && index < mediaItems.length) setActiveSlideIndex(index)
  }

  const handleSubmitGeneralComment = async () => {
    if (!generalCommentText.trim() || !capsule || !id) return
    setSubmittingComment(true)
    try {
      const token = sessionStorage.getItem('authToken')
      const res = await fetch(
        `${API_BASE}/api/capsules/${id}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ text: generalCommentText }),
        }
      )
      if (res.ok) {
        setGeneralCommentText('')
        setCapsule(await fetchCapsuleById(id))
      }
    } catch (err) {
      console.error('Error submitting comment:', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleSubmitPhotoComment = async () => {
    const mediaIndex = lightboxIndex ?? activeSlideIndex
    const media = mediaItems[mediaIndex]
    if (!photoCommentText.trim() || !capsule || !media || !id) return
    const mediaId = media._id
    if (!mediaId) return
    setSubmittingComment(true)
    try {
      const token = sessionStorage.getItem('authToken')
      const res = await fetch(
        `${API_BASE}/api/capsules/${id}/media/${mediaId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ text: photoCommentText }),
        }
      )
      if (res.ok) {
        setPhotoCommentText('')
        setCapsule(await fetchCapsuleById(id))
      }
    } catch (err) {
      console.error('Error submitting photo comment:', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  const canEdit = () => {
    const authUser = sessionStorage.getItem('authUser')
    if (!authUser || !capsule) return false
    try {
      const user = JSON.parse(authUser)
      const ownerId = typeof capsule.owner === 'string' ? capsule.owner : capsule.owner?._id
      return (
        user._id === ownerId ||
        capsule.collaborators?.some(
          (c) =>
            (typeof c.user === 'string' ? c.user : c.user._id) === user._id &&
            (c.role === 'admin' || c.role === 'edit')
        )
      )
    } catch {
      return false
    }
  }

  const header = (
    <header className="mobile-header" aria-label="Interior de cápsula">
      <button type="button" className="mobile-header__left" onClick={() => navigate(-1)} aria-label="Volver">←</button>
      <Link to="/inicio" className="logo-button" aria-label="Ir a inicio">
        <img src={logoMAsset} alt="Momentum" />
      </Link>
      <span className="mobile-header__right" aria-hidden="true" />
    </header>
  )

  if (loading) return (
    <Fragment>{header}<section className="page-layout"><p>Cargando...</p></section></Fragment>
  )

  if (error || !capsule) return (
    <Fragment>{header}<section className="page-layout"><p>{error}</p></section></Fragment>
  )

  const generalComments: Comment[] = (capsule as any)?.generalComments || []
  const sharedUsers = capsule.sharedWith ?? []

  const owner = capsule.owner
  const ownerName = typeof owner === 'string' ? owner : ((owner as any)?.name || (owner as any)?.username || 'Usuario')
  const ownerUsername = typeof owner === 'string' ? owner : ((owner as any)?.username || ownerName)
  const ownerAvatar = typeof owner === 'string' ? null : (owner as any)?.avatar ?? null

  // Thumbnail: usa la imagen del 3D model (igual que en el inicio) o la primera imagen
  const { thumbnailUrl: capsuleThumbUrl } = getCapsuleThumb(capsule)
  const thumbSrc = capsuleThumbUrl ? resolveUrl(capsuleThumbUrl) : null

  // Lightbox
  const lightboxMedia = lightboxIndex !== null ? mediaItems[lightboxIndex] : null
  const lightboxComments: Comment[] = (lightboxMedia as any)?.comments || []

  // Carousel translate — JS uses measured px; CSS fallback caps at 600px (no black margins)
  const translateX = slideWidth > 0
    ? `${activeSlideIndex * -(slideWidth + SLIDE_GAP)}px`
    : `calc(${activeSlideIndex} * -1 * (min(100vw, 600px) - ${SLIDE_REDUCTION - SLIDE_GAP}px))`

  return (
    <Fragment>
      {header}

      {/* ── Lightbox: foto ampliada + comentarios de esa foto ── */}
      {lightboxIndex !== null && lightboxMedia && (
        <div
          className="ci-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Ver foto"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            className="ci-lightbox__close"
            onClick={() => setLightboxIndex(null)}
            aria-label="Cerrar"
          >×</button>

          <div className="ci-lightbox__content" onClick={(e) => e.stopPropagation()}>
            <div className="ci-lightbox__img-wrap">
              {lightboxMedia.type === 'video' ? (
                <video src={resolveUrl(lightboxMedia.url)} className="ci-lightbox__media" controls />
              ) : (
                <img src={resolveUrl(lightboxMedia.url)} alt="Foto ampliada" className="ci-lightbox__media" />
              )}
            </div>

            <div className="ci-lightbox__comments">
              <h3 className="ci-lightbox__comments-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Comentarios
              </h3>

              {lightboxComments.length > 0 ? (
                <div className="ci-comments__list">
                  {lightboxComments.map((c) => (
                    <CommentRow key={c._id || String(Math.random())} comment={c} />
                  ))}
                </div>
              ) : (
                <p className="ci-comments__empty">Sin comentarios todavía</p>
              )}

              <div className="ci-comment-input">
                <input
                  type="text"
                  className="ci-comment-input__field"
                  placeholder="comentar algo..."
                  value={photoCommentText}
                  onChange={(e) => setPhotoCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitPhotoComment() }}
                  aria-label="Comentar esta foto"
                />
                <button
                  type="button"
                  className="ci-comment-input__send-text"
                  onClick={handleSubmitPhotoComment}
                  disabled={submittingComment || !photoCommentText.trim()}
                >Enviar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="ci-page">

        {/* ── Header: thumbnail + título + avatares + editar ── */}
        <div className="ci-header">
          <div className="ci-header__left">
            {thumbSrc && (
              <img src={thumbSrc} alt="" className="ci-header__thumb" aria-hidden="true" />
            )}
            <div className="ci-header__text">
              <h1 className="ci-header__title">{capsule.title}</h1>
              <AvatarStack users={sharedUsers} />
            </div>
          </div>
          {canEdit() && (
            <button
              type="button"
              className="ci-header__edit"
              onClick={() => navigate(`/capsulas/${id}/editar`)}
              aria-label="Editar cápsula"
            >
              editar
              <img src={iconEdit} alt="" width={13} height={13} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* ── Carrusel con peek ── */}
        {mediaItems.length > 0 ? (
          <div className="ci-carousel-wrap" aria-label="Fotos de la cápsula">
            <div className="ci-carousel-outer" ref={carouselRef}>
              <div
                className="ci-carousel-track"
                style={{ transform: `translateX(${translateX})` }}
              >
                {mediaItems.map((media, idx) => {
                  const src = resolveUrl(media.url)
                  const ts = (media as any).createdAt
                  return (
                    <div
                      key={media._id || idx}
                      className="ci-slide"
                      style={slideWidth > 0 ? { minWidth: `${slideWidth}px` } : undefined}
                    >
                      {media.type === 'video' ? (
                        <video src={src} className="ci-slide__media" controls />
                      ) : (
                        <img
                          src={src}
                          alt={`Foto ${idx + 1}`}
                          className="ci-slide__media"
                          onClick={() => { setActiveSlideIndex(idx); setLightboxIndex(idx) }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { setActiveSlideIndex(idx); setLightboxIndex(idx) }
                          }}
                          aria-label="Ver imagen ampliada"
                        />
                      )}
                      {ts && (
                        <div className="ci-slide__timestamp">
                          {new Date(ts).toLocaleDateString('es-ES', { month: '2-digit', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {mediaItems.length > 1 && (
              <div className="ci-carousel-controls">
                <button
                  type="button"
                  className="ci-carousel__arrow"
                  onClick={() => goToSlide(activeSlideIndex - 1)}
                  disabled={activeSlideIndex === 0}
                  aria-label="Foto anterior"
                >‹</button>
                <div className="ci-dots" role="tablist">
                  {mediaItems.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      role="tab"
                      aria-selected={idx === activeSlideIndex}
                      className={`ci-dot${idx === activeSlideIndex ? ' ci-dot--active' : ''}`}
                      onClick={() => goToSlide(idx)}
                      aria-label={`Foto ${idx + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="ci-carousel__arrow"
                  onClick={() => goToSlide(activeSlideIndex + 1)}
                  disabled={activeSlideIndex === mediaItems.length - 1}
                  aria-label="Foto siguiente"
                >›</button>
              </div>
            )}
          </div>
        ) : (
          <p className="ci-no-media">No hay fotos o videos en esta cápsula</p>
        )}

        {/* ── Descripción ── */}
        {capsule.description && (
          <div className="ci-description">
            <h2 className="ci-description__label">Descripción</h2>
            <div className="ci-description__owner">
              <div className="ci-description__avatar">
                {ownerAvatar
                  ? <img src={ownerAvatar} alt={ownerName} />
                  : <span>{ownerName.charAt(0).toUpperCase()}</span>}
              </div>
              <span className="ci-description__username">@{ownerUsername}</span>
            </div>
            <p className="ci-description__text">{capsule.description}</p>
          </div>
        )}

        {/* ── Comentarios generales ── */}
        <section className="ci-comments" aria-label="Comentarios">
          <h2 className="ci-comments__title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Comentarios
          </h2>

          {generalComments.length > 0 ? (
            <div className="ci-comments__list">
              {generalComments.map((c) => (
                <CommentRow key={c._id || String(Math.random())} comment={c} showReply />
              ))}
            </div>
          ) : (
            <p className="ci-comments__empty">Sin comentarios todavía</p>
          )}

          <div className="ci-comment-input">
            <input
              type="text"
              className="ci-comment-input__field"
              placeholder="comentar algo..."
              value={generalCommentText}
              onChange={(e) => setGeneralCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitGeneralComment() }}
              aria-label="Nuevo comentario"
            />
            <button
              type="button"
              className="ci-comment-input__send-text"
              onClick={handleSubmitGeneralComment}
              disabled={submittingComment || !generalCommentText.trim()}
            >Enviar</button>
          </div>
        </section>

      </section>
    </Fragment>
  )
}

export default CapsuleInterior
