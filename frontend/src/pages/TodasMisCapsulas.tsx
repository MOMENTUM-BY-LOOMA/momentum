import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCapsules, type ApiCapsule } from '../services/api'
import { logoMAsset } from '../img'
import CapsulaThumb from '../components/CapsulaThumb'

export default function TodasMisCapsulas() {
  const navigate = useNavigate()
  const [capsulas, setCapsulas] = useState<ApiCapsule[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const data = await fetchCapsules()
        if (!active) return
        setCapsulas(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error('Error cargando cápsulas', e)
        setCapsulas([])
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const capsulasFiltradas = useMemo(() => {
    const q = String(busqueda || '').trim()
    if (q === '') return capsulas

    return capsulas.filter((c) => {
      const cat = (c.category as string) || (c as any).categoria || ''
      return String(cat).toLowerCase().includes(q.toLowerCase())
    })
  }, [capsulas, busqueda])

  const title = busqueda.trim() === '' ? 'TODAS TUS CÁPSULAS' : 'TODOS LOS RESULTADOS'

  return (
    <div className="todas-capsulas-page">
      <header className="mobile-header" aria-label="Mis capsulas">
        <button type="button" className="mobile-header__left" onClick={() => navigate(-1)} aria-label="Volver atras">←</button>
        <a href="/inicio" className="logo-button" aria-label="Ir a inicio">
          <img className="mobile-header__logo" src={logoMAsset} alt="Momentum" />
        </a>
        <span className="mobile-header__right" aria-hidden="true" />
      </header>

      <h2 className="todas-capsulas__title">{title}</h2>

      <div className={`todas-capsulas__search ${busqueda.trim() ? 'is-active' : ''}`}>
        <input
          className="todas-capsulas__input"
          placeholder="Buscar por categoría"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar cápsulas"
        />
        {busqueda.trim() && (
          <button type="button" className="search-clear" onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda">×</button>
        )}
      </div>

      <main className="todas-capsulas__grid-wrap">
        {loading ? null : capsulasFiltradas.length === 0 ? (
          busqueda.trim() ? (
            <p className="todas-capsulas__empty">No se encontraron cápsulas en '{busqueda}'</p>
          ) : (
            <div className="todas-capsulas__empty">
              <p>Aún no tienes cápsulas. ¡Crea tu primera!</p>
              <button type="button" className="todas-capsulas__create" onClick={() => navigate('/crear-capsula')}>Crear cápsula</button>
            </div>
          )
        ) : (
          <section className="todas-capsulas__grid">
            {capsulasFiltradas.map((capsula) => (
              <div
                key={capsula._id}
                className="todas-capsulas__cell"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/capsulas/${capsula._id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') navigate(`/capsulas/${capsula._id}`)
                }}
                aria-label={capsula.title || 'Abrir cápsula'}
              >
                <div className="thumb-wrap">
                  <div
                    className="thumb-halo"
                    style={{ background: `radial-gradient(circle, ${( (capsula as any).colorHalo || '#C8B89A')} 0%, transparent 70%)` }}
                    aria-hidden="true"
                  />

                  <div className="thumb-inner">
                    <CapsulaThumb
                      capsula={{ id: capsula._id, nombre: capsula.title || '', thumbnailUrl: capsula.previewImage || (capsula.mediaItems && capsula.mediaItems[0] && capsula.mediaItems[0].thumbnailUrl), modelUrl: capsula.mediaItems && capsula.mediaItems[0] && capsula.mediaItems[0].url }}
                      onOpen={(id) => navigate(`/capsulas/${id}`)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
