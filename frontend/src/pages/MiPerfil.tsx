import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CapsulaThumb, { type ThumbCapsule } from '../components/CapsulaThumb'
import HeaderConTitulo from '../components/HeaderConTitulo'
import { defaultAvatarAsset } from '../img'
import { fetchCapsules, fetchCurrentUser, fetchFriends, type ApiCapsule, type ApiUser } from '../services/api'

function ownerId(capsule: ApiCapsule) {
  if (!capsule.owner) return ''
  return typeof capsule.owner === 'string' ? capsule.owner : capsule.owner._id
}

function mapToThumb(capsule: ApiCapsule): ThumbCapsule {
  const imageThumb = capsule.previewImage
    || capsule.mediaItems?.find((item) => item.thumbnailUrl)?.thumbnailUrl
    || capsule.mediaItems?.find((item) => item.type === 'image')?.url

  const modelUrl = capsule.mediaItems?.find((item) => item.type === '3d')?.url

  return {
    id: capsule._id,
    nombre: capsule.title || 'Capsula',
    thumbnailUrl: imageThumb,
    modelUrl,
  }
}

function MiPerfil() {
  const navigate = useNavigate()
  const [user, setUser] = useState<ApiUser | null>(null)
  const [friendsCount, setFriendsCount] = useState(0)
  const [capsules, setCapsules] = useState<ApiCapsule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [me, friends, allCapsules] = await Promise.all([
          fetchCurrentUser().catch(() => null),
          fetchFriends().catch(() => []),
          fetchCapsules().catch(() => []),
        ])

        setUser(me)
        setFriendsCount(friends.length)

        if (me?._id) {
          const mine = (allCapsules || []).filter((capsule) => ownerId(capsule) === me._id)
          setCapsules(mine)
        } else {
          setCapsules([])
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const username = useMemo(() => {
    const name = (user?.name || '').trim()
    return name ? name.toLowerCase().replace(/\s+/g, '') : 'usuario'
  }, [user?.name])

  const latestCapsules = useMemo(() => {
    const sorted = [...capsules].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
      return dateB - dateA
    })

    return sorted.slice(0, 5).map(mapToThumb)
  }, [capsules])

  const profilePhoto = user?.profilePhoto || user?.avatar || defaultAvatarAsset

  return (
    <>
      <HeaderConTitulo titulo="Mi perfil" iconoDerecha="⚙" onIconoDerecha={() => navigate('/ajustes')} />

      <section className="mi-perfil" aria-label="Pantalla de mi perfil">

      {loading ? (
        <div className="mi-perfil__photo-fallback"><span>...</span></div>
      ) : profilePhoto ? (
        <img src={profilePhoto} alt={user?.name || 'Usuario'} className="mi-perfil__photo" />
      ) : (
        <div className="mi-perfil__photo-fallback">
          <span>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
        </div>
      )}

      <section className="mi-perfil__info-row">
        <span>@{username}</span>
        <span>{friendsCount} amigos</span>
      </section>

      <section className="mi-perfil__recuerdos">
        <h2>Ultimos recuerdos</h2>

        <div className="mi-perfil__thumbs-row" role="list" aria-label="Ultimas capsulas">
          {latestCapsules.length === 0 ? (
            <div className="mi-perfil__empty">Sin recuerdos todavia</div>
          ) : (
            latestCapsules.map((capsula) => (
              <div key={capsula.id} role="listitem">
                <CapsulaThumb capsula={capsula} onOpen={(capsuleId) => navigate(`/capsulas/${capsuleId}`)} />
              </div>
            ))
          )}
        </div>
      </section>

      <div className="mi-perfil__more-wrap">
        <button type="button" className="mi-perfil__more" onClick={() => navigate('/mis-capsulas')}>
          Ver mas {'>'}
        </button>
      </div>
    </section>
    </>
  )
}

export default MiPerfil
