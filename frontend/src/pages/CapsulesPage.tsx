import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logoMAsset } from '../img'
import { fetchCapsules, type ApiCapsule } from '../services/api.ts'

function CapsulesPage() {
  const navigate = useNavigate()
  const [capsules, setCapsules] = useState<ApiCapsule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetchCapsules()
        setCapsules(response)
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'No se pudieron cargar las capsulas'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const ownCapsules = useMemo(() => capsules.slice(0, 6), [capsules])
  const recommendedCapsules = useMemo(() => capsules.slice(0, 3), [capsules])
  const friendCapsules = useMemo(() => capsules.filter((capsule) => (capsule.sharedWith?.length ?? 0) > 0).slice(0, 3), [capsules])

  return (
    <Fragment>
      <header className="mobile-header" aria-label="Mis capsulas">
        <button type="button" className="mobile-header__left" onClick={() => navigate(-1)} aria-label="Volver atras">←</button>
        <Link to="/inicio" className="logo-button" aria-label="Ir a inicio">
          <img src={logoMAsset} alt="Momentum" />
        </Link>
        <span className="mobile-header__right" aria-hidden="true" />
      </header>
      <section className="page-layout page-layout--module">
      <article className="page-card">
        <h1>Capsulas</h1>
        <p>Mis capsulas, recomendaciones y contenido de amigos.</p>
        <div className="button-row">
          <Link to="/capsulas/crear" className="button-primary">Crear capsula</Link>
        </div>
      </article>

      {loading ? <p className="page-status">Cargando capsulas...</p> : null}
      {error ? <p className="page-status page-status--error">{error}</p> : null}

      <article className="page-card">
        <h2>Mis capsulas</h2>
        <div className="capsule-list">
          {ownCapsules.length === 0 ? <p>No hay capsulas todavia.</p> : ownCapsules.map((capsule) => (
            <Link key={capsule._id} to={`/capsulas/${capsule._id}`} className="capsule-list__item capsule-list__item--link">
              <strong>{capsule.title}</strong>
              <span>{capsule.category || 'Sin categoria'}</span>
            </Link>
          ))}
        </div>
      </article>

      <article className="page-card">
        <h2>Capsulas recomendadas</h2>
        <ul className="module-list">
          {recommendedCapsules.length === 0 ? <li>Sin recomendaciones por ahora.</li> : recommendedCapsules.map((capsule) => (
            <li key={`recommended-${capsule._id}`}>{capsule.title}</li>
          ))}
        </ul>
      </article>

      <article className="page-card">
        <h2>Capsulas de amigos</h2>
        <ul className="module-list">
          {friendCapsules.length === 0 ? <li>No hay capsulas compartidas.</li> : friendCapsules.map((capsule) => (
            <li key={`friend-${capsule._id}`}>{capsule.title}</li>
          ))}
        </ul>
      </article>
      </section>
    </Fragment>
  )
}

export default CapsulesPage
