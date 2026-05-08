import { useEffect, useState, Fragment, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { logoMAsset } from '../img'
import { fetchCapsuleById, getCapsuleThumb, type ApiCapsule } from '../services/api'
import '../styles/shared-capsule-view.css'

const API_BASE = import.meta.env.VITE_API_URL || 'https://momentum-hc2x.onrender.com'
const SLIDE_REDUCTION = 92
const SLIDE_GAP = 12

function resolveUrl(url: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`
}

function SharedCapsuleView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const carouselRef = useRef<HTMLDivElement>(null)

  const [capsule, setCapsule] = useState<ApiCapsule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [slideIndex, setSlideIndex] = useState(0)
  const [slideWidth, setSlideWidth] = useState(0)

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    const measure = () => setSlideWidth(el.offsetWidth - SLIDE_REDUCTION)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [loading])

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

  const header = (
    <header className="mobile-header" aria-label="Cápsula compartida">
      <button type="button" className="mobile-header__left" onClick={() => navigate(-1)} aria-label="Volver">←</button>
      <Link to="/inicio" className="logo-button" aria-label="Ir a inicio">
        <img src={logoMAsset} alt="Momentum" />
      </Link>
      <span className="mobile-header__right" aria-hidden="true" />
    </header>
  )

  if (loading) return (
    <Fragment>
      {header}
      <section className="page-layout"><p>Cargando...</p></section>
    </Fragment>
  )

  if (error || !capsule) return (
    <Fragment>
      {header}
      <section className="page-layout"><p>{error || 'No se pudo cargar la cápsula'}</p></section>
    </Fragment>
  )

  const { thumbnailUrl } = getCapsuleThumb(capsule)
  const owner = typeof capsule.owner === 'object' ? capsule.owner : null
  const ownerName = owner?.name ?? owner?.username ?? 'Desconocido'
  const ownerAvatar = owner?.avatar ?? null

  const mediaItems = (capsule.mediaItems ?? []).filter(
    (m) => m.type === 'image' || m.type === 'video'
  )
  const totalSlides = mediaItems.length

  const translateX = slideWidth > 0
    ? `${slideIndex * -(slideWidth + SLIDE_GAP)}px`
    : `calc(${slideIndex} * -1 * (min(100vw, 600px) - ${SLIDE_REDUCTION - SLIDE_GAP}px))`

  return (
    <Fragment>
      {header}

      <section className="scv-page">
        {/* Capsule thumbnail */}
        <div className="scv-thumb-wrap">
          {thumbnailUrl
            ? <img className="scv-thumb" src={resolveUrl(thumbnailUrl)} alt={capsule.title} />
            : <div className="scv-thumb scv-thumb--placeholder" aria-hidden="true">📦</div>
          }
        </div>

        {/* Title */}
        <h1 className="scv-title">{capsule.title}</h1>

        {/* Owner info */}
        <div className="scv-owner-section">
          <span className="scv-owner-label">CÁPSULA CREADA POR</span>
          <div className="scv-owner-row">
            <div className="scv-owner__avatar">
              {ownerAvatar
                ? <img src={resolveUrl(ownerAvatar)} alt={ownerName} />
                : <span>{ownerName.charAt(0).toUpperCase()}</span>}
            </div>
            <span className="scv-owner__name">{ownerName}</span>
          </div>
        </div>

        {/* Read-only carousel */}
        {mediaItems.length > 0 && (
          <div className="scv-carousel-wrap">
            <div className="scv-carousel-outer" ref={carouselRef}>
              <div
                className="scv-carousel-track"
                style={{ transform: `translateX(${translateX})` }}
              >
                {mediaItems.map((media, idx) => (
                  <div
                    key={media._id || idx}
                    className="scv-slide"
                    style={slideWidth > 0 ? { minWidth: slideWidth + 'px' } : undefined}
                  >
                    {media.type === 'video' ? (
                      <video src={resolveUrl(media.url)} className="scv-slide__media" controls />
                    ) : (
                      <img src={resolveUrl(media.url)} alt={`Slide ${idx + 1}`} className="scv-slide__media" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {totalSlides > 1 && (
              <div className="scv-carousel-controls">
                <button
                  type="button"
                  className="scv-carousel__arrow"
                  onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                  disabled={slideIndex === 0}
                  aria-label="Anterior"
                >‹</button>
                <div className="scv-dots">
                  {Array.from({ length: totalSlides }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`scv-dot${slideIndex === i ? ' scv-dot--active' : ''}`}
                      onClick={() => setSlideIndex(i)}
                      aria-label={`Ir a slide ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="scv-carousel__arrow"
                  onClick={() => setSlideIndex((i) => Math.min(totalSlides - 1, i + 1))}
                  disabled={slideIndex >= totalSlides - 1}
                  aria-label="Siguiente"
                >›</button>
              </div>
            )}
          </div>
        )}

        {/* Description (read-only) */}
        {capsule.description && (
          <div className="scv-description">
            <p className="scv-description__text">{capsule.description}</p>
          </div>
        )}

        {/* Accept button */}
        <button
          type="button"
          className="scv-accept-btn"
          onClick={() => navigate(`/capsulas/${id}/interior`)}
        >
          Aceptar
        </button>
      </section>
    </Fragment>
  )
}

export default SharedCapsuleView
