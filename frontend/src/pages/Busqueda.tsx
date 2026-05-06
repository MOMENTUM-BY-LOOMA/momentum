import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logoMAsset } from '../img'
import CapsulaThumb from '../components/CapsulaThumb'
import type { ApiCapsule } from '../services/api'

interface Categoria {
  nombre: string
  icono: React.ReactNode
}

const categorias: Categoria[] = [
  {
    nombre: 'VIAJES',
    icono: (
      <svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 12H40V36H8V12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 12V8C16 6.9 16.9 6 18 6H30C31.1 6 32 6.9 32 8V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 24L32 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    nombre: 'ESTUDIO',
    icono: (
      <svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 14L24 6L40 14V28C40 36 24 42 24 42C24 42 8 36 8 28V14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 24C27.3137 24 30 21.3137 30 18C30 14.6863 27.3137 12 24 12C20.6863 12 18 14.6863 18 18C18 21.3137 20.6863 24 24 24Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    nombre: 'AMIGOS',
    icono: (
      <svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 36C8 32 14 30 18 30C22 30 28 32 28 36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 24C23.3137 24 26 21.3137 26 18C26 14.6863 23.3137 12 20 12C16.6863 12 14 14.6863 14 18C14 21.3137 16.6863 24 20 24Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M32 36C32 32 36 30 40 30C44 30 48 32 48 36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M40 24C42.7614 24 45 21.7614 45 19C45 16.2386 42.7614 14 40 14C37.2386 14 35 16.2386 35 19C35 21.7614 37.2386 24 40 24Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    nombre: 'OTROS',
    icono: null,
  },
]

export default function Busqueda() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null)
  const [resultados, setResultados] = useState<ApiCapsule[]>([])
  const [buscando, setBuscando] = useState(false)
  const [token, setToken] = useState('')

  const hayFiltro = query.trim() !== '' || categoriaActiva !== null

  useEffect(() => {
    const token = sessionStorage.getItem('authToken')
    setToken(token || '')
  }, [])

  useEffect(() => {
    if (!hayFiltro || !token) {
      setResultados([])
      return
    }

    const timer = setTimeout(async () => {
      setBuscando(true)
      try {
        let url = '/api/capsules?'
        const params = []
        if (query.trim()) params.push(`q=${encodeURIComponent(query)}`)
        if (categoriaActiva) params.push(`category=${encodeURIComponent(categoriaActiva)}`)
        url += params.join('&')

        console.log('Buscando:', url, 'Token:', token.substring(0, 10) + '...')

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (res.ok) {
          const data = await res.json()
          setResultados(Array.isArray(data) ? data : [])
        } else {
          console.error('Error en búsqueda:', res.status, res.statusText, 'URL:', url)
          setResultados([])
        }
      } catch (e) {
        console.error('Error buscando cápsulas:', e)
        setResultados([])
      } finally {
        setBuscando(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, categoriaActiva, token])

  return (
    <div className="busqueda-page">
      <header className="mobile-header" aria-label="Búsqueda">
        <span className="mobile-header__left" aria-hidden="true" />
        <a href="/inicio" className="logo-button" aria-label="Ir a inicio">
          <img className="mobile-header__logo" src={logoMAsset} alt="Momentum" />
        </a>
        <span className="mobile-header__right" aria-hidden="true" />
      </header>

      <h2 className="busqueda__title">BÚSQUEDA</h2>

      {categoriaActiva && (
        <div className="busqueda__pill-container">
          <div className="pill-categoria">
            <span>{categoriaActiva}</span>
            <button
              type="button"
              className="pill-categoria__close"
              onClick={() => setCategoriaActiva(null)}
              aria-label={`Quitar filtro ${categoriaActiva}`}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="busqueda__search-box">
        <div className="busqueda__search-row">
          <input
            className="busqueda__input"
            type="text"
            placeholder="Busca cápsulas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar cápsulas"
          />
          {hayFiltro && (
            <button
              type="button"
              className="busqueda__clear-btn"
              onClick={() => {
                setQuery('')
                setCategoriaActiva(null)
                setResultados([])
              }}
              aria-label="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </div>

        {hayFiltro && (
          <button
            type="button"
            className="busqueda__search-btn"
            onClick={() => {
              // La búsqueda ya se dispara automáticamente en el useEffect
            }}
          >
            Buscar
          </button>
        )}
      </div>

      {!hayFiltro ? (
        <div className="busqueda__categorias-wrap">
          <p className="busqueda__categorias-hint">Elige una categoría y encuentra tu cápsula</p>
          <div className="busqueda__categorias-grid">
            {categorias.map((cat) => (
              <button
                key={cat.nombre}
                type="button"
                className="busqueda__categoria-card"
                onClick={() => {
                  setCategoriaActiva(cat.nombre)
                  setQuery('')
                }}
                aria-label={`Buscar por categoría ${cat.nombre}`}
              >
                {cat.icono && <div className="busqueda__categoria-icono">{cat.icono}</div>}
                <span className="busqueda__categoria-nombre">{cat.nombre}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="busqueda__resultados-wrap">
          {buscando ? (
            <div className="busqueda__resultados-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="busqueda__skeleton">
                  <div className="busqueda__skeleton-circle" />
                </div>
              ))}
            </div>
          ) : resultados.length > 0 ? (
            <section className="busqueda__resultados-grid">
              {resultados.map((capsula) => (
                <div
                  key={capsula._id}
                  className="busqueda__cell"
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
                      style={{
                        background: `radial-gradient(circle, ${(capsula as any).colorHalo || '#C8B89A'} 0%, transparent 70%)`,
                      }}
                      aria-hidden="true"
                    />
                    <div className="thumb-inner">
                      <CapsulaThumb
                        capsula={{
                          id: capsula._id,
                          nombre: capsula.title || '',
                          thumbnailUrl: capsula.previewImage || (capsula.mediaItems && capsula.mediaItems[0] && capsula.mediaItems[0].thumbnailUrl),
                          modelUrl: capsula.mediaItems && capsula.mediaItems[0] && capsula.mediaItems[0].url,
                        }}
                        onOpen={(id) => navigate(`/capsulas/${id}`)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </section>
          ) : (
            <p className="busqueda__no-results">
              No se encontraron cápsulas{query && ` para '${query}'`}{categoriaActiva && ` en ${categoriaActiva}`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
