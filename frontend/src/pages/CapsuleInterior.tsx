import { useEffect, useState, Fragment } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { logoMAsset } from '../img'
import { fetchCapsuleById, type ApiCapsule } from '../services/api'
import '../styles/capsule-interior.css'

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000').replace(/\/$/, '')

function resolveUrl(url: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`
}

interface Comment {
  _id?: string
  author: { _id: string; username?: string; name: string; avatar?: string } | string
  text: string
  createdAt?: string
}

function CapsuleInterior() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [capsule, setCapsule] = useState<ApiCapsule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [generalCommentText, setGeneralCommentText] = useState('')
  const [photoCommentText, setPhotoCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // Filtrar solo imágenes y videos
  const mediaItems = (capsule?.mediaItems || []).filter(
    (item) => item.type === 'image' || item.type === 'video'
  )

  useEffect(() => {
    if (!id) {
      setError('ID de cápsula no encontrado')
      setLoading(false)
      return
    }

    const token = sessionStorage.getItem('authToken')
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    let active = true

    const fetchData = async () => {
      try {
        const data = await fetchCapsuleById(id)
        if (active) {
          setCapsule(data)
          setLoading(false)
        }
      } catch (err) {
        if (active) {
          setError('No se pudo cargar la cápsula')
          setLoading(false)
        }
      }
    }

    fetchData()
    return () => {
      active = false
    }
  }, [id, navigate])

  const goToSlide = (index: number) => {
    if (index >= 0 && index < mediaItems.length) setActiveSlideIndex(index)
  }

  const handleSubmitGeneralComment = async () => {
    if (!generalCommentText.trim() || !capsule || !id) return

    setSubmittingComment(true)
    try {
      const token = sessionStorage.getItem('authToken')
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/capsules/${id}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ text: generalCommentText }),
        }
      )

      if (response.ok) {
        setGeneralCommentText('')
        // Recargar cápsula para obtener comentario nuevo
        const updated = await fetchCapsuleById(id)
        setCapsule(updated)
      }
    } catch (err) {
      console.error('Error submitting comment:', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleSubmitPhotoComment = async () => {
    if (!photoCommentText.trim() || !capsule || !mediaItems[activeSlideIndex] || !id) return

    const mediaId = mediaItems[activeSlideIndex]._id
    if (!mediaId) return

    setSubmittingComment(true)
    try {
      const token = sessionStorage.getItem('authToken')
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/capsules/${id}/media/${mediaId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ text: photoCommentText }),
        }
      )

      if (response.ok) {
        setPhotoCommentText('')
        // Recargar cápsula para obtener comentario nuevo
        const updated = await fetchCapsuleById(id)
        setCapsule(updated)
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
      return user._id === ownerId || capsule.collaborators?.some(c => 
        (typeof c.user === 'string' ? c.user : c.user._id) === user._id && (c.role === 'admin' || c.role === 'edit')
      )
    } catch {
      return false
    }
  }

  if (loading) {
    return (
      <Fragment>
        <header className="mobile-header" aria-label="Cargar cápsula">
          <button type="button" onClick={() => navigate(-1)} aria-label="Volver">←</button>
          <Link to="/inicio" className="logo-button" aria-label="Ir a inicio">
            <img src={logoMAsset} alt="Momentum" />
          </Link>
          <span aria-hidden="true" />
        </header>
        <section className="page-layout">
          <p>Cargando...</p>
        </section>
      </Fragment>
    )
  }

  if (error || !capsule) {
    return (
      <Fragment>
        <header className="mobile-header" aria-label="Error">
          <button type="button" onClick={() => navigate(-1)} aria-label="Volver">←</button>
          <Link to="/inicio" className="logo-button" aria-label="Ir a inicio">
            <img src={logoMAsset} alt="Momentum" />
          </Link>
          <span aria-hidden="true" />
        </header>
        <section className="page-layout">
          <p>{error}</p>
        </section>
      </Fragment>
    )
  }

  const currentMedia = mediaItems[activeSlideIndex]
  const photoComments = currentMedia?.comments || []

  return (
    <Fragment>
      <header className="mobile-header" aria-label="Interior de cápsula">
        <button type="button" className="mobile-header__left" onClick={() => navigate(-1)} aria-label="Volver">←</button>
        <Link to="/inicio" className="logo-button" aria-label="Ir a inicio">
          <img src={logoMAsset} alt="Momentum" />
        </Link>
        <span className="mobile-header__right" aria-hidden="true" />
      </header>

      <section className="page-layout capsule-interior" style={{ paddingTop: '84px' }}>
        {/* Título + Botón Editar */}
        <div className="capsule-interior__header">
          <h1 className="capsule-interior__title">{capsule.title}</h1>
          {canEdit() && (
            <button
              type="button"
              className="capsule-interior__edit-btn"
              onClick={() => navigate(`/capsulas/${id}/editar`)}
              aria-label="Editar cápsula"
            >✏️ editar</button>
          )}
        </div>

        {/* Carrusel de fotos */}
        {mediaItems.length > 0 ? (
          <div className="capsule-interior__carousel-container">
            <div className="capsule-interior__slide" role="region" aria-label="Foto actual">
              {(() => {
                const media = mediaItems[activeSlideIndex]
                const src = resolveUrl(media.url)
                return media.type === 'video' ? (
                  <video src={src} className="capsule-interior__media" controls />
                ) : (
                  <img src={src} alt={`Foto ${activeSlideIndex + 1}`} className="capsule-interior__media" />
                )
              })()}

              {/* Timestamp */}
              {(() => {
                const media = mediaItems[activeSlideIndex]
                const ts = (media as any).createdAt
                return ts ? (
                  <div className="capsule-interior__timestamp">
                    {new Date(ts).toLocaleDateString('es-ES', { month: '2-digit', year: 'numeric' })}
                  </div>
                ) : null
              })()}

              {/* Flechas */}
              {mediaItems.length > 1 && (
                <>
                  <button
                    type="button"
                    className="capsule-interior__arrow capsule-interior__arrow--left"
                    onClick={() => goToSlide(activeSlideIndex - 1)}
                    disabled={activeSlideIndex === 0}
                    aria-label="Foto anterior"
                  >‹</button>
                  <button
                    type="button"
                    className="capsule-interior__arrow capsule-interior__arrow--right"
                    onClick={() => goToSlide(activeSlideIndex + 1)}
                    disabled={activeSlideIndex === mediaItems.length - 1}
                    aria-label="Foto siguiente"
                  >›</button>
                </>
              )}
            </div>

            {/* Dots */}
            {mediaItems.length > 1 && (
              <div className="capsule-interior__dots">
                {mediaItems.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`capsule-interior__dot${idx === activeSlideIndex ? ' active' : ''}`}
                    onClick={() => goToSlide(idx)}
                    aria-label={`Ir a foto ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="capsule-interior__no-media">No hay fotos/videos en esta cápsula</p>
        )}

        {/* Descripción */}
        {capsule.description && (
          <section className="capsule-interior__description">
            <p>{capsule.description}</p>
          </section>
        )}

        {/* Comentarios Generales */}
        <section className="capsule-interior__comments-section">
          <h2 className="capsule-interior__comments-title">
            💬 Comentarios
          </h2>

          {(capsule as any)?.generalComments?.length > 0 ? (
            <div className="capsule-interior__comments-list">
              {(capsule as any).generalComments.map((comment: Comment) => {
                const author = typeof comment.author === 'string' 
                  ? { name: comment.author } 
                  : comment.author
                const username = (author as any).username || (author as any).name || 'Usuario'
                return (
                  <div key={comment._id || Math.random()} className="capsule-interior__comment">
                    <div className="capsule-interior__comment-avatar">
                      {(author as any).avatar ? (
                        <img src={(author as any).avatar} alt={username} />
                      ) : (
                        <div className="capsule-interior__comment-avatar-fallback">
                          {username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="capsule-interior__comment-content">
                      <strong className="capsule-interior__comment-author">@{username}</strong>
                      <p className="capsule-interior__comment-text">{comment.text}</p>
                      <button type="button" className="capsule-interior__reply-btn">
                        Contestar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="capsule-interior__no-comments">Sin comentarios todavía</p>
          )}

          {/* Input nuevo comentario general */}
          <div className="capsule-interior__comment-input">
            <textarea
              value={generalCommentText}
              onChange={(e) => setGeneralCommentText(e.target.value)}
              placeholder="Escribe un comentario..."
              className="capsule-interior__comment-textarea"
            />
            <button
              type="button"
              className="capsule-interior__submit-comment-btn"
              onClick={handleSubmitGeneralComment}
              disabled={submittingComment || !generalCommentText.trim()}
            >
              Enviar
            </button>
          </div>
        </section>

        {/* Comentarios de Foto */}
        {currentMedia && photoComments.length > 0 && (
          <section className="capsule-interior__photo-comments-section">
            <h3 className="capsule-interior__photo-comments-title">Comentarios de esta foto</h3>
            <div className="capsule-interior__comments-list">
              {photoComments.map((comment) => {
                const author = typeof comment.author === 'string' 
                  ? { name: comment.author } 
                  : comment.author
                const username = (author as any).username || (author as any).name || 'Usuario'
                return (
                  <div key={comment._id || Math.random()} className="capsule-interior__comment">
                    <div className="capsule-interior__comment-avatar">
                      {(author as any).avatar ? (
                        <img src={(author as any).avatar} alt={username} />
                      ) : (
                        <div className="capsule-interior__comment-avatar-fallback">
                          {username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="capsule-interior__comment-content">
                      <strong className="capsule-interior__comment-author">@{username}</strong>
                      <p className="capsule-interior__comment-text">{comment.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Input nuevo comentario de foto */}
            <div className="capsule-interior__comment-input">
              <textarea
                value={photoCommentText}
                onChange={(e) => setPhotoCommentText(e.target.value)}
                placeholder="Comenta esta foto..."
                className="capsule-interior__comment-textarea"
              />
              <button
                type="button"
                className="capsule-interior__submit-comment-btn"
                onClick={handleSubmitPhotoComment}
                disabled={submittingComment || !photoCommentText.trim()}
              >
                Enviar
              </button>
            </div>
          </section>
        )}
      </section>
    </Fragment>
  )
}

export default CapsuleInterior
