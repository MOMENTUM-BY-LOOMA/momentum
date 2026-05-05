import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Model3DViewer } from '../3d/Model3DViewer'
import { fetchCapsuleById, fetchCapsules, fetchFriends, type ApiCapsule, type ApiFriendRelation, type ApiUser } from '../services/api.ts'

type CapsuleLocationState = {
  capsuleId?: string
}

const DEFAULT_MODEL_PATH = '/3d/statue of liberty 3d model.glb'

function is3DModelUrl(value?: string) {
  if (!value) return false
  return /\.(glb|gltf|obj|fbx|stl)(\?.*)?$/i.test(value)
}

function resolveApiAssetUrl(url?: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('//')) return url

  const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000').replace(/\/$/, '')
  if (!base) return url

  return `${base}${url.startsWith('/') ? url : `/${url}`}`
}

function resolveCapsuleModelPath(capsule: ApiCapsule) {
  const mediaItems = capsule.mediaItems ?? []
  const primary3d = mediaItems.find((item) => item.type === '3d' && item.url)
  if (primary3d?.url) return resolveApiAssetUrl(primary3d.url)

  const first3dByExt = mediaItems.find((item) => is3DModelUrl(item.url))
  if (first3dByExt?.url) return resolveApiAssetUrl(first3dByExt.url)

  if (is3DModelUrl(capsule.mediaFile)) return resolveApiAssetUrl(capsule.mediaFile)

  return DEFAULT_MODEL_PATH
}

function resolveCapsuleGlowColor(capsule: ApiCapsule) {
  const rawKey = `${capsule.design?.key ?? ''} ${capsule.design?.label ?? ''} ${capsule.category ?? ''}`.toLowerCase()

  if (rawKey.includes('gold') || rawKey.includes('oro') || rawKey.includes('sun')) {
    return '255, 204, 102'
  }

  if (rawKey.includes('green') || rawKey.includes('forest') || rawKey.includes('nature') || rawKey.includes('verde')) {
    return '122, 203, 140'
  }

  if (rawKey.includes('red') || rawKey.includes('warm') || rawKey.includes('rojo')) {
    return '239, 136, 136'
  }

  if (rawKey.includes('purple') || rawKey.includes('violet') || rawKey.includes('morado')) {
    return '176, 152, 238'
  }

  return '106, 168, 230'
}

function resolveUserAvatar(user: ApiUser | string | undefined) {
  if (!user || typeof user === 'string') return undefined

  return user.avatar || user.profilePhoto
}

function getUserId(user: ApiUser | string | undefined) {
  if (!user || typeof user === 'string') return user

  return user._id
}

function friendFromRelation(relation: ApiFriendRelation, currentUserId?: string) {
  const requesterId = getUserId(relation.requester)
  const recipientId = getUserId(relation.recipient)

  if (currentUserId && requesterId === currentUserId) {
    return relation.recipient
  }

  if (currentUserId && recipientId === currentUserId) {
    return relation.requester
  }

  return relation.friend ?? relation.otherUser ?? relation.recipient ?? relation.requester
}

function CapsuleView() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('authToken')
  const locationState = location.state as CapsuleLocationState | null
  const capsuleId = locationState?.capsuleId
  const [capsule, setCapsule] = useState<ApiCapsule | null>(null)
  const [friends, setFriends] = useState<ApiFriendRelation[]>([])
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
        const [capsuleResponse, friendsResponse] = await Promise.all([
          capsuleId ? fetchCapsuleById(capsuleId).catch(() => null) : Promise.resolve(null),
          fetchFriends().catch(() => []),
        ])

        const selectedCapsule = capsuleResponse ?? (await fetchCapsules())[0] ?? null
        setCapsule(selectedCapsule)
        setFriends(friendsResponse)
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

  const sharedUsers = (capsule.sharedWith ?? []).filter((sharedUser) => {
    const sharedUserId = typeof sharedUser === 'string' ? sharedUser : sharedUser._id
    return friends.some((relation) => {
      const friend = friendFromRelation(relation)
      const friendId = getUserId(friend)
      return friendId === sharedUserId
    })
  })
  const glowColor = resolveCapsuleGlowColor(capsule)
  const modelPath = resolveCapsuleModelPath(capsule)

  return (
    <div className="capsule-view">
      <section className="page-layout">
        <div
          className="capsule-header capsule-header--plain"
          style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '100%' }}
        >
          <h1 style={{ width: '100%', textAlign: 'center', margin: 0 }}>{capsule.title}</h1>
        </div>

        <section className="capsule-view__viewer">
          <div
            className="capsule-view__viewer-shell"
            style={{
              width: '100vw',
              height: '600px',
              minHeight: '600px',
              position: 'relative',
              overflow: 'visible',
              border: '0',
              outline: 'none',
              boxShadow: 'none',
              borderRadius: 0,
              background: 'transparent',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '12% 10% 8%',
                borderRadius: '999px',
                background: `radial-gradient(circle, rgba(${glowColor}, 0.24) 0%, rgba(${glowColor}, 0.14) 38%, rgba(${glowColor}, 0.06) 60%, rgba(${glowColor}, 0) 78%)`,
                filter: 'blur(26px)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
            <Model3DViewer
              modelPath={modelPath}
              backgroundColor="transparent"
            />
            </div>
          </div>
        </section>

        <section className="capsule-friends-section" style={{ textAlign: 'center', justifyItems: 'center', width: '100%' }}>
          <h2 className="capsule-friends-section__title" style={{ width: '100%', textAlign: 'center', margin: 0 }}>
            Amigos que comparten esta capsula
          </h2>
          {sharedUsers.length === 0 ? (
            <p className="capsule-friends-section__empty">No hay amigos tuyos compartiendo esta capsula todavía.</p>
          ) : (
            <ul className="capsule-friends-list">
              {sharedUsers.map((sharedUser) => {
                const sharedUserId = typeof sharedUser === 'string' ? sharedUser : sharedUser._id
                const friendRelation = friends.find((relation) => {
                  const friend = friendFromRelation(relation)
                  return getUserId(friend) === sharedUserId
                })
                const friend = friendRelation ? friendFromRelation(friendRelation) : sharedUser
                const avatar = resolveUserAvatar(friend)
                const name = typeof friend === 'string' ? friend : friend.name

                return (
                  <li key={sharedUserId} className="capsule-friend-chip">
                    {avatar ? (
                      <img src={avatar} alt={name} className="capsule-friend-chip__avatar" />
                    ) : (
                      <span className="capsule-friend-chip__avatar capsule-friend-chip__avatar--fallback" aria-hidden="true">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="capsule-friend-chip__text">
                      <strong>{name}</strong>
                      <small>Amigo compartido</small>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </section>
    </div>
  )
}

export default CapsuleView