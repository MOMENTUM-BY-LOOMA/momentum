import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Model3DViewer } from '../3d/Model3DViewer'
import { fetchCapsuleById, fetchCapsules, type ApiCapsule } from '../services/api.ts'

type CapsuleLocationState = {
  capsuleId?: string
}

function formatDate(value?: string) {
  if (!value) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function resolveUserName(user: ApiCapsule['owner']) {
  if (!user) return 'Desconocido'
  if (typeof user === 'string') return user

  return user.name
}

function CapsuleView() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('authToken')
  const locationState = location.state as CapsuleLocationState | null
  const capsuleId = locationState?.capsuleId
  const [capsule, setCapsule] = useState<ApiCapsule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    const loadCapsule = async () => {
      setLoading(true)
      setError('')

      try {
        const selectedCapsule = capsuleId ? await fetchCapsuleById(capsuleId) : (await fetchCapsules())[0] ?? null
        setCapsule(selectedCapsule)
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'No se pudo cargar la capsula'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadCapsule()
  }, [capsuleId, navigate, token])

  if (!token) {
    return null
  }

  if (loading) {
    return <section className="page-card"><p className="page-status">Cargando capsula...</p></section>
  }

  if (error) {
    return <section className="page-card"><p className="page-status page-status--error">{error}</p></section>
  }

  if (!capsule) {
    return (
      <section className="page-card">
        <h1>No hay capsulas disponibles</h1>
        <p>Sube una capsula para verla aqui.</p>
      </section>
    )
  }

  const mediaItems = capsule.mediaItems ?? []
  const firstMedia = mediaItems[0]

  return (
    <div className="capsule-view">
      <section className="page-layout">
        <article className="page-card">
          <div className="capsule-header">
            <div>
              <h1>{capsule.title}</h1>
              <p>{capsule.description || 'Sin descripcion añadida.'}</p>
            </div>
            <div className="capsule-meta">
              <span>{capsule.category || 'Sin categoria'}</span>
              <span>{formatDate(capsule.updatedAt ?? capsule.createdAt ?? capsule.date)}</span>
              <span>{mediaItems.length} archivos</span>
              <span>{capsule.sharedWith?.length ?? 0} compartidos</span>
            </div>
          </div>
        </article>
      </section>

      <div className="panel-grid capsule-view__grid">
        <article className="panel">
          <h2>Detalle</h2>
          <p className="capsule-story">Propietario: {resolveUserName(capsule.owner)}</p>
          <p className="capsule-story">Diseño: {capsule.design?.label || capsule.design?.key || 'Estándar'}</p>
          <p className="capsule-story">
            Tiempo bloqueado: {capsule.timeCapsule?.enabled ? `Sí, se abre el ${formatDate(capsule.timeCapsule.unlockAt ?? undefined)}` : 'No'}
          </p>
        </article>

        <article className="panel">
          <h2>Archivos</h2>
          {mediaItems.length === 0 ? (
            <p>No hay archivos subidos todavía.</p>
          ) : (
            <div className="capsule-media-grid">
              {mediaItems.map((mediaItem) => (
                <article key={mediaItem._id ?? mediaItem.url} className="capsule-media-card">
                  {mediaItem.type === 'image' || mediaItem.thumbnailUrl ? (
                    <img
                      src={mediaItem.thumbnailUrl || mediaItem.url}
                      alt={mediaItem.title || 'Archivo de la capsula'}
                      className="capsule-media-card__image"
                    />
                  ) : (
                    <div className="capsule-media-card__placeholder">{mediaItem.type || 'file'}</div>
                  )}
                  <strong>{mediaItem.title || 'Archivo sin titulo'}</strong>
                  <small>{mediaItem.description || mediaItem.url}</small>
                  <small>{mediaItem.comments?.length ?? 0} comentarios</small>
                </article>
              ))}
            </div>
          )}
        </article>
      </div>

      <section className="capsule-view__viewer">
        <div className="capsule-view__viewer-shell">
          <Model3DViewer
            modelPath="/3d/statue of liberty 3d model.glb"
            backgroundColor="#f5f5f5"
          />
        </div>
        {firstMedia ? <p className="page-status">Mostrando la primera pieza multimedia como referencia visual.</p> : null}
      </section>
    </div>
  )
}

export default CapsuleView