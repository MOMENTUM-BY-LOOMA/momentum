import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCapsules, fetchCurrentUser, type ApiCapsule, type ApiUser } from '../services/api.ts'

function formatDate(value?: string) {
  if (!value) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function Dashboard() {
  const navigate = useNavigate()
  const token = localStorage.getItem('authToken')
  const [user, setUser] = useState<ApiUser | null>(null)
  const [capsules, setCapsules] = useState<ApiCapsule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const [currentUser, capsuleList] = await Promise.all([
          fetchCurrentUser(),
          fetchCapsules(),
        ])

        setUser(currentUser)
        setCapsules(capsuleList)
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'No se pudo cargar el dashboard'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [navigate, token])

  const totalCapsules = capsules.length
  const capsulesWithMedia = capsules.filter((capsule) => (capsule.mediaItems?.length ?? 0) > 0).length
  const sharedCapsules = capsules.filter((capsule) => (capsule.sharedWith?.length ?? 0) > 0).length
  const recentCapsules = capsules.slice(0, 3)

  return (
    <section className="page-layout">
      <div className="hero-panel">
        <h1>Dashboard</h1>
        <p>
          {user ? `Hola, ${user.name}.` : 'Vista general de actividad, recuerdos recientes y estado de tu coleccion.'}
        </p>
        <p>Todo lo que ves aquí sale del backend real.</p>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Capsulas totales', value: totalCapsules.toString() },
          { label: 'Con multimedia', value: capsulesWithMedia.toString() },
          { label: 'Compartidas', value: sharedCapsules.toString() },
        ].map((stat) => (
          <article key={stat.label} className="stat-card">
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </div>

      {error ? <p className="page-status page-status--error">{error}</p> : null}
      {loading ? <p className="page-status">Cargando capsulas...</p> : null}

      <div className="panel-grid">
        <article className="panel">
          <h2>Ultimas capsulas</h2>
          {recentCapsules.length === 0 ? (
            <p>No tienes capsulas todavia. Sube la primera para empezar.</p>
          ) : (
            <div className="capsule-list">
              {recentCapsules.map((capsule) => (
                <button
                  key={capsule._id}
                  type="button"
                  className="capsule-list__item"
                  onClick={() => navigate('/capsula', { state: { capsuleId: capsule._id } })}
                >
                  <strong>{capsule.title}</strong>
                  <span>{capsule.category || 'Sin categoria'}</span>
                  <small>{formatDate(capsule.updatedAt ?? capsule.createdAt)}</small>
                </button>
              ))}
            </div>
          )}
        </article>
        <article className="panel">
          <h2>Proxima accion</h2>
          <p>Sube una nueva capsula con fotos, videos o documentos y deja todo guardado en el backend.</p>
          <div className="button-row">
            <button type="button" className="button-primary" onClick={() => navigate('/subir')}>
              Crear capsula
            </button>
          </div>
        </article>
      </div>
    </section>
  )
}

export default Dashboard