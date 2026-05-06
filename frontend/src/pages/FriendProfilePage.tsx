import { Fragment, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { logoMAsset } from '../img'
import { fetchFriends, type ApiFriendRelation, type ApiUser } from '../services/api.ts'

function pickFriend(relation: ApiFriendRelation): ApiUser | null {
  if (relation.friend && typeof relation.friend !== 'string') return relation.friend
  if (relation.otherUser && typeof relation.otherUser !== 'string') return relation.otherUser
  if (relation.recipient && typeof relation.recipient !== 'string') return relation.recipient
  if (relation.requester && typeof relation.requester !== 'string') return relation.requester
  return null
}

function FriendProfilePage() {
  const navigate = useNavigate()
  const { friendId } = useParams()
  const [friend, setFriend] = useState<ApiUser | null>(null)

  useEffect(() => {
    const load = async () => {
      const relations = await fetchFriends().catch(() => [])
      const selected = relations
        .map((relation) => pickFriend(relation))
        .find((candidate) => candidate?._id === friendId) || null
      setFriend(selected)
    }

    load()
  }, [friendId])

  return (
    <Fragment>
      <header className="mobile-header" aria-label="Perfil de amigo">
        <button type="button" className="mobile-header__left" onClick={() => navigate(-1)} aria-label="Volver atras">←</button>
        <Link to="/inicio" className="logo-button" aria-label="Ir a inicio">
          <img src={logoMAsset} alt="Momentum" />
        </Link>
        <span className="mobile-header__right" aria-hidden="true" />
      </header>
      <section className="page-layout page-layout--module">
      <article className="page-card">
        <h1>Perfil de amigo</h1>
        <p>{friend ? friend.name : 'No se encontro el perfil solicitado.'}</p>
      </article>

      <article className="page-card">
        <h2>Estadisticas</h2>
        <ul className="module-list">
          <li>Amigos: pendiente de datos</li>
          <li>Capsulas: pendiente de datos</li>
        </ul>
      </article>

      <article className="page-card">
        <h2>Capsulas del amigo</h2>
        <p>Vista equivalente a capsulas propias con permisos de acceso.</p>
      </article>
      </section>
    </Fragment>
  )
}

export default FriendProfilePage
