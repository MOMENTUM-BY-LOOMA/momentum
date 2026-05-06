import { useEffect, useState, Fragment } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { logoMAsset } from '../img'
import { fetchCapsuleById, type ApiCapsule } from '../services/api'
import '../styles/capsule-view.css'

function CapsuleView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [capsule, setCapsule] = useState<ApiCapsule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  if (loading) {
    return (
      <Fragment>
        <header className="mobile-header" aria-label="Cargar cápsula">
          <button type="button" className="mobile-header__left" onClick={() => navigate(-1)} aria-label="Volver">←</button>
          <Link to="/inicio" className="logo-button" aria-label="Ir a inicio">
            <img src={logoMAsset} alt="Momentum" />
          </Link>
          <span className="mobile-header__right" aria-hidden="true" />
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
          <button type="button" className="mobile-header__left" onClick={() => navigate(-1)} aria-label="Volver">←</button>
          <Link to="/inicio" className="logo-button" aria-label="Ir a inicio">
            <img src={logoMAsset} alt="Momentum" />
          </Link>
          <span className="mobile-header__right" aria-hidden="true" />
        </header>
        <section className="page-layout">
          <p>{error}</p>
        </section>
      </Fragment>
    )
  }

  const isShared = (capsule.sharedWith?.length || 0) > 0
  
  return (
    <Fragment>
      <header className="mobile-header" aria-label="Vista previa de cápsula">
        <button type="button" className="mobile-header__left" onClick={() => navigate(-1)} aria-label="Volver">←</button>
        <Link to="/inicio" className="logo-button" aria-label="Ir a inicio">
          <img src={logoMAsset} alt="Momentum" />
        </Link>
        <span className="mobile-header__right" aria-hidden="true" />
      </header>

      <section className="page-layout capsule-view">
        {/* 3D Model / Thumbnail */}
        <div className="capsule-view__model-wrapper">
          {capsule.previewImage ? (
            <img src={capsule.previewImage} alt={capsule.title} className="capsule-view__thumbnail" />
          ) : (
            <div className="capsule-view__placeholder">
              {capsule.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="capsule-view__title">
          {capsule.title}
          {isShared && <span className="capsule-view__shared-icon" title="Cápsula compartida">👥</span>}
        </h1>

        {/* Ver Cápsula Button */}
        <button 
          type="button"
          className="capsule-view__button"
          onClick={() => navigate(`/capsulas/${id}/interior`)}
          aria-label="Ver cápsula interior"
        >
          Ver Cápsula
        </button>

        {/* Shared Section */}
        {isShared && (
          <section className="capsule-view__shared-section">
            <div className="capsule-view__shared-badge">
              <span className="capsule-view__shared-icon-inline">👥</span>
              <span>Cápsula compartida</span>
            </div>

            <div className="capsule-view__shared-users">
              {(capsule.sharedWith || []).map((user) => {
                const username = typeof user === 'string' ? user : (user.username || user.name || 'Usuario')
                return (
                  <div key={typeof user === 'string' ? user : user._id} className="capsule-view__shared-user">
                    <span className="capsule-view__group-icon">👥</span>
                    <span className="capsule-view__username">@{username}</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </section>
    </Fragment>
  )
}

export default CapsuleView