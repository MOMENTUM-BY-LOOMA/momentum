import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logoMAsset } from '../img'
import { fetchFriends, type ApiFriendRelation, type ApiUser } from '../services/api.ts'

function relationToFriend(relation: ApiFriendRelation): ApiUser | null {
  if (relation.friend && typeof relation.friend !== 'string') return relation.friend
  if (relation.otherUser && typeof relation.otherUser !== 'string') return relation.otherUser
  if (relation.recipient && typeof relation.recipient !== 'string') return relation.recipient
  if (relation.requester && typeof relation.requester !== 'string') return relation.requester
  return null
}

function FriendsPage() {
  const navigate = useNavigate()
  const [relations, setRelations] = useState<ApiFriendRelation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const response = await fetchFriends().catch(() => [])
      setRelations(response)
      setLoading(false)
    }

    load()
  }, [])

  const friends = useMemo(() => relations.map((relation) => relationToFriend(relation)).filter((user): user is ApiUser => Boolean(user)), [relations])

  return (
    <>
      <header className="mobile-header" aria-label="Encabezado">
        <button type="button" className="mobile-header__back" onClick={() => navigate(-1)} aria-label="Volver atrás">
          ←
        </button>
        <button type="button" className="mobile-header__logo-button" aria-label="Ir a inicio" onClick={() => navigate('/inicio')}>
          <img className="mobile-header__logo" src={logoMAsset} alt="Momentum" />
        </button>
        <span className="mobile-header__side" aria-hidden="true" />
      </header>

      <section className="page-layout page-layout--module">
      <article className="page-card">
        <h1>Amigos</h1>
        <p>Lista, peticiones y sugerencias.</p>
      </article>

      <article className="page-card">
        <h2>Lista de amigos</h2>
        {loading ? <p>Cargando amigos...</p> : null}
        <ul className="module-list">
          {friends.length === 0 ? <li>Sin amigos todavia.</li> : friends.map((friend) => (
            <li key={friend._id}>
              <Link to={`/amigos/${friend._id}`}>{friend.name}</Link>
            </li>
          ))}
        </ul>
      </article>

      <article className="page-card">
        <h2>Peticiones</h2>
        <p>Espacio reservado para aceptar o rechazar solicitudes.</p>
      </article>

      <article className="page-card">
        <h2>Amigos sugeridos</h2>
        <p>Espacio reservado para recomendaciones sociales.</p>
      </article>
    </section>
    </>
  )
}

export default FriendsPage
