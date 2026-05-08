import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IconoTema from '../components/IconoTema'
import CapsulaThumb from '../components/CapsulaThumb'
import { logoMAsset, settingsIconAsset } from '../img'
import { clearSession, getCapsuleThumb, type ApiCapsule } from '../services/api'
import '../styles/home.css'

const API_BASE = import.meta.env.VITE_API_URL || 'https://momentum-hc2x.onrender.com'

type SharedCapsuleFriend = {
  _id: string
  name: string
  username: string
  avatar?: string
  capsules: ApiCapsule[]
}

function getCapsuleOwnerId(capsule: ApiCapsule) {
  const owner = capsule.owner
  if (!owner) return ''
  if (typeof owner === 'string') return owner
  return owner._id || ''
}

const CATEGORIAS = [
  { label: 'Viajes', valor: 'viajes' },
  { label: 'Familia', valor: 'familia' },
  { label: 'Amistad', valor: 'amistad' },
  { label: 'Trabajo', valor: 'trabajo' },
  { label: 'Otros', valor: 'otros' },
]

function Dashboard() {
  const navigate = useNavigate()
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('')
  const [capsulasDesbloqueadas, setCapsulasDesbloqueadas] = useState<ApiCapsule[]>([])
  const [misCapsulas, setMisCapsulas] = useState<ApiCapsule[]>([])
  const [amigosCompartidos, setAmigosCompartidos] = useState<SharedCapsuleFriend[]>([])
  const [loadingTiempo, setLoadingTiempo] = useState(false)
  const [loadingPerfil, setLoadingPerfil] = useState(false)
  const [loadingCompartidas, setLoadingCompartidas] = useState(false)

  useEffect(() => {
    console.log('VITE_API_URL en Dashboard:', import.meta.env.VITE_API_URL)
    console.log('window.location.origin:', window.location.origin)
  }, [])

  useEffect(() => {
    const token = sessionStorage.getItem('authToken')
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    let active = true

    const parseStoredUserId = () => {
      try {
        const storedUser = sessionStorage.getItem('authUser')
        if (!storedUser) return ''

        const parsed = JSON.parse(storedUser) as { _id?: string }
        return String(parsed._id || '')
      } catch {
        return ''
      }
    }

    const requestJson = async (path: string) => {
      console.log('API_BASE:', import.meta.env.VITE_API_URL)
      console.log('URL completa de la llamada:', `${API_BASE}${path}`)
      const response = await fetch(`${API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401) {
        clearSession()
        navigate('/login', { replace: true })
        return null
      }

      if (!response.ok) {
        return null
      }

      return response.json()
    }

    const load = async () => {
      setLoadingTiempo(true)
      setLoadingPerfil(true)
      setLoadingCompartidas(true)

      const userId = parseStoredUserId()

      try {
        const [capsulesData, sharedData, unlockedData] = await Promise.all([
          requestJson('/api/capsules'),
          requestJson('/api/friends/shared'),
          requestJson('/api/capsules?timeCapsule=unlocked'),
        ])

        if (!active) return

        if (Array.isArray(capsulesData)) {
          const ownedCapsules = userId
            ? capsulesData.filter((capsule) => getCapsuleOwnerId(capsule) === userId)
            : capsulesData

          setMisCapsulas(ownedCapsules.slice(0, 3))
        } else {
          setMisCapsulas([])
        }

        if (Array.isArray(sharedData)) {
          setAmigosCompartidos(sharedData)
        } else {
          setAmigosCompartidos([])
        }

        if (Array.isArray(unlockedData)) {
          setCapsulasDesbloqueadas(unlockedData)
        } else {
          setCapsulasDesbloqueadas([])
        }
      } finally {
        if (active) {
          setLoadingTiempo(false)
          setLoadingPerfil(false)
          setLoadingCompartidas(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [navigate])

  return (
    <>
      <header className="home-header" aria-label="Encabezado principal">
        <span className="home-header__left" aria-hidden="true">
          <IconoTema />
        </span>
        <button type="button" className="home-header__logo-button" aria-label="Recargar inicio" onClick={() => navigate('/inicio')}>
          <img className="mobile-header__logo" src={logoMAsset} alt="Momentum" />
        </button>
        <button type="button" className="home-header__settings" aria-label="Abrir ajustes" onClick={() => navigate('/ajustes')}>
          <img src={settingsIconAsset} alt="" aria-hidden="true" />
        </button>
      </header>

      <section className="home-page" aria-label="Pantalla principal de Momentum">
        {loadingTiempo ? (
          <div className="home-card home-card--unlock">
            <span className="home-loading-text">Cargando...</span>
          </div>
        ) : capsulasDesbloqueadas.length > 0 ? (
          <article className="home-card home-card--unlock">
            <span className="home-card__icon" aria-hidden="true">
              ⏰
            </span>
            <div className="home-card__body">
              <p className="home-card__title">¡Tu cápsula del tiempo está lista!</p>
              <p className="home-card__subtitle">
                {capsulasDesbloqueadas.length === 1 ? (
                  <em>{capsulasDesbloqueadas[0].title}</em>
                ) : (
                  `Tienes ${capsulasDesbloqueadas.length} cápsulas listas para abrir`
                )}
              </p>
            </div>
            <button
              type="button"
              className="home-card__action"
              onClick={() => {
                if (capsulasDesbloqueadas.length === 1) {
                  navigate(`/capsulas/${capsulasDesbloqueadas[0]._id}`)
                } else {
                  navigate('/mis-capsulas?filter=unlocked')
                }
              }}
            >
              Abrir
            </button>
          </article>
        ) : null}

        <section className="home-profile-card" aria-labelledby="home-profile-title">
          <div className="home-profile-card__content">
            <h1 id="home-profile-title">MI PERFIL</h1>
            <div className="home-profile-card__thumbs" aria-label="Cápsulas recientes">
              {loadingPerfil ? (
                <span className="home-loading-text">Cargando...</span>
              ) : misCapsulas.length > 0 ? (
                misCapsulas.map((capsula) => (
                  <div key={capsula._id} className="home-thumb home-thumb--profile">
                    <div
                      className="home-thumb__halo"
                      style={{ background: `radial-gradient(circle, ${capsula.colorHalo || '#C8B89A'} 0%, transparent 72%)` }}
                      aria-hidden="true"
                    />
                    <div className="home-thumb__inner">
                      <CapsulaThumb
                        capsula={{ id: capsula._id, nombre: capsula.title || '', ...getCapsuleThumb(capsula) }}
                        onOpen={(id) => navigate(`/capsulas/${id}`)}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="home-empty-text">Aún no tienes cápsulas visibles.</p>
              )}
            </div>
          </div>
          <button type="button" className="home-profile-card__button" onClick={() => navigate('/perfil')}>
            Ir
          </button>
        </section>

        <section className="home-search" aria-label="Filtro por categoría y búsqueda">
          <form
            className="home-search__form"
            onSubmit={(event) => {
              event.preventDefault()
              navigate(`/buscar${categoriaSeleccionada ? `?category=${encodeURIComponent(categoriaSeleccionada)}` : ''}`)
            }}
          >
            <div className="home-search__field">
              <select
                className="home-search__input"
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                aria-label="Buscar por categoría"
              >
                <option value="">Selecciona una categoría</option>
                {CATEGORIAS.map((cat) => (
                  <option key={cat.valor} value={cat.valor}>{cat.label}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="home-search__button">
              Buscar
            </button>
          </form>
        </section>

        <section className="home-shared" aria-labelledby="home-shared-title">
          <h2 id="home-shared-title">Comparte tus cápsulas</h2>

          {loadingCompartidas ? (
            <p className="home-loading-text">Cargando...</p>
          ) : amigosCompartidos.length > 0 ? (
            amigosCompartidos.map((amigo) => (
              <article key={amigo._id} className="home-shared-card">
                {amigo.avatar ? (
                  <img className="home-shared-card__avatar" src={amigo.avatar} alt={amigo.name} />
                ) : (
                  <div className="home-shared-card__avatar home-shared-card__avatar--fallback" aria-hidden="true">
                    {amigo.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="home-shared-card__main">
                  <p className="home-shared-card__user">@{amigo.username}</p>
                  <div className="home-shared-card__thumbs" aria-label={`Cápsulas compartidas con ${amigo.name}`}>
                    {amigo.capsules.slice(0, 4).map((capsula) => (
                      <div key={capsula._id} className="home-thumb home-thumb--friend">
                        <div
                          className="home-thumb__halo"
                          style={{ background: `radial-gradient(circle, ${capsula.colorHalo || '#C8B89A'} 0%, transparent 72%)` }}
                          aria-hidden="true"
                        />
                        <div className="home-thumb__inner">
                          <CapsulaThumb
                            capsula={{ id: capsula._id, nombre: capsula.title || '', ...getCapsuleThumb(capsula) }}
                            onOpen={(id) => navigate(`/capsulas/${id}`)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="button" className="home-shared-card__more" onClick={() => navigate(`/amigos/${amigo._id}`)}>
                  Ver más &gt;
                </button>
              </article>
            ))
          ) : (
            <div className="home-shared__empty">
              <p>Aún no has compartido cápsulas con nadie.</p>
              <button type="button" className="home-shared__empty-link" onClick={() => navigate('/amigos')}>
                Ir a mis amigos &gt;
              </button>
            </div>
          )}
        </section>
      </section>
    </>
  )
}

export default Dashboard