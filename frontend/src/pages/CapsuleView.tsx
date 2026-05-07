import { useEffect, useState, Fragment } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { logoMAsset } from '../img'
import { fetchCapsuleById, type ApiCapsule, type ApiMediaItem } from '../services/api'
import { Model3DViewer } from '../3d/Model3DViewer'
import '../styles/capsule-view.css'

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000').replace(/\/$/, '')
const FALLBACK_MODEL = '/3d/statue%20of%20liberty%203d%20model.glb'

function resolveUrl(url: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`
}

function find3DModel(items: ApiMediaItem[] | undefined) {
  return items?.find((m) => m.type === '3d') ?? null
}

function CapsuleView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [capsule, setCapsule] = useState<ApiCapsule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  if (loading) return (
    <Fragment>
      <header className="mobile-header">
        <button type="button" className="mobile-header__left" onClick={() => navigate(-1)}>←</button>
        <Link to="/inicio" className="logo-button"><img src={logoMAsset} alt="Momentum" /></Link>
        <span className="mobile-header__right" />
      </header>
      <section className="page-layout"><p>Cargando...</p></section>
    </Fragment>
  )

  if (error || !capsule) return (
    <Fragment>
      <header className="mobile-header">
        <button type="button" className="mobile-header__left" onClick={() => navigate(-1)}>←</button>
        <Link to="/inicio" className="logo-button"><img src={logoMAsset} alt="Momentum" /></Link>
        <span className="mobile-header__right" />
      </header>
      <section className="page-layout"><p>{error}</p></section>
    </Fragment>
  )

  const model3D = find3DModel(capsule.mediaItems)
  const modelPath = model3D ? resolveUrl(model3D.url) : FALLBACK_MODEL
  const sharedUsers = capsule.sharedWith ?? []

  return (
    <Fragment>
      <header className="mobile-header" aria-label="Vista previa de cápsula">
        <button type="button" className="mobile-header__left" onClick={() => navigate(-1)} aria-label="Volver">←</button>
        <Link to="/inicio" className="logo-button" aria-label="Ir a inicio">
          <img src={logoMAsset} alt="Momentum" />
        </Link>
        <span className="mobile-header__right" aria-hidden="true" />
      </header>

      <section className="page-layout capsule-view" style={{ paddingTop: '84px' }}>

        {/* Título */}
        <h1 className="capsule-view__title">{capsule.title}</h1>

        {/* Viewer 3D */}
        <div className="capsule-view__model-wrapper">
          <Model3DViewer modelPath={modelPath} backgroundColor="transparent" />
        </div>

        {/* Botón ver interior */}
        <button
          type="button"
          className="capsule-view__button"
          onClick={() => navigate(`/capsulas/${id}/interior`)}
        >
          Ver Cápsula
        </button>

        {/* Amigos con los que se comparte — siempre visible */}
        <section className="capsule-view__shared-section">
          <p className="capsule-view__shared-label">Compartida con</p>
          {sharedUsers.length === 0 ? (
            <p className="capsule-view__shared-empty">No compartida con ningún amigo</p>
          ) : (
            <div className="capsule-view__shared-users">
              {sharedUsers.map((user) => {
                const u = typeof user === 'string' ? null : user
                const name = u?.name ?? u?.username ?? (typeof user === 'string' ? user : 'Usuario')
                const key = u?._id ?? (typeof user === 'string' ? user : Math.random().toString())
                const initials = name.charAt(0).toUpperCase()
                return (
                  <div key={key} className="capsule-view__friend-chip">
                    {u?.avatar
                      ? <img src={u.avatar} alt={name} className="capsule-view__friend-avatar" />
                      : <span className="capsule-view__friend-initial">{initials}</span>
                    }
                    <span className="capsule-view__friend-name">{name}</span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </section>
    </Fragment>
  )
}

export default CapsuleView
