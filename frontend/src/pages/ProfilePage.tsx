import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCapsules, fetchCurrentUser, fetchFriends, type ApiUser, type ApiCapsule } from '../services/api.ts'

function ProfilePage() {
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
        setCapsules(allCapsules || [])
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const recentCapsules = capsules.slice(0, 3)

  if (loading) {
    return <div className="page-layout"><p>Cargando...</p></div>
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <header className="profile-header">
        <h1 className="profile-header__title">MI PERFIL</h1>
        <div className="profile-header__logo">M</div>
        <button className="profile-header__settings" onClick={() => navigate('/ajustes')}>
          ⚙️
        </button>
      </header>

      {/* Profile Info */}
      <section className="profile-info">
        <img
          src={user?.profilePhoto || user?.avatar || '/img/default-avatar.png'}
          alt={user?.name}
          className="profile-info__image"
        />
        <div className="profile-info__username">
          @{user?.name?.toLowerCase().replace(/\s+/g, '') || 'usuario'}
        </div>
        <div className="profile-info__stats">
          {friendsCount} amigos
        </div>
      </section>

      {/* Recent Memories */}
      <section className="profile-memories">
        <h2 className="profile-memories__title">Últimos recuerdos</h2>

        {recentCapsules.length > 0 ? (
          <>
            <div className="profile-memories__grid">
              {recentCapsules.map((capsule) => (
                <div
                  key={capsule._id}
                  className="profile-memory-card"
                  onClick={() => navigate(`/capsulas/${capsule._id}`, { state: { capsule } })}
                  role="button"
                  tabIndex={0}
                >
                  {capsule.previewImage && (
                    <img src={capsule.previewImage} alt={capsule.title} />
                  )}
                  {capsule.mediaItems?.[0]?.thumbnailUrl && (
                    <img src={capsule.mediaItems[0].thumbnailUrl} alt={capsule.title} />
                  )}
                  <div className="profile-memory-card__overlay">
                    <p>{capsule.title}</p>
                  </div>
                </div>
              ))}
            </div>

            {capsules.length > 3 && (
              <button
                className="profile-memories__more"
                onClick={() => navigate('/capsulas')}
              >
                Ver más &gt;
              </button>
            )}
          </>
        ) : (
          <p className="profile-memories__empty">
            No tienes recuerdos aún. ¡Crea tu primera cápsula!
          </p>
        )}
      </section>
    </div>
  )
}

export default ProfilePage
