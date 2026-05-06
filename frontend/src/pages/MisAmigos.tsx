import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CapsulaThumb, { type ThumbCapsule } from '../components/CapsulaThumb'
import { logoMAsset, settingsIconAsset } from '../img'
import {
  fetchCurrentUser,
  fetchFriends,
  fetchCommonCapsules,
  requestFriendByUsername,
  type ApiCapsule,
  type ApiFriendRelation,
  type ApiUser,
} from '../services/api'

type FriendItem = {
  friend: ApiUser
  capsules: ApiCapsule[]
}

type AddStatus =
  | { kind: 'success'; text: string }
  | { kind: 'error'; text: string }
  | { kind: 'warning'; text: string }
  | null

function relationToFriend(relation: ApiFriendRelation): ApiUser | null {
  if (relation.friend && typeof relation.friend !== 'string') return relation.friend
  if (relation.otherUser && typeof relation.otherUser !== 'string') return relation.otherUser
  if (relation.recipient && typeof relation.recipient !== 'string') return relation.recipient
  if (relation.requester && typeof relation.requester !== 'string') return relation.requester
  return null
}

function mapCapsule(capsule: ApiCapsule): ThumbCapsule {
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

function getInitial(name: string) {
  const clean = name.trim()
  return clean ? clean.charAt(0).toUpperCase() : '?'
}

function MisAmigos() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null)
  const [friendData, setFriendData] = useState<FriendItem[]>([])
  const [loading, setLoading] = useState(true)
  const [shareCopied, setShareCopied] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [sending, setSending] = useState(false)
  const [addStatus, setAddStatus] = useState<AddStatus>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const [me, acceptedFriends] = await Promise.all([
          fetchCurrentUser().catch(() => null),
          fetchFriends().catch(() => []),
        ])

        if (!active) return

        setCurrentUser(me)

        const resolvedFriends = acceptedFriends
          .map((relation) => relationToFriend(relation))
          .filter((friend): friend is ApiUser => Boolean(friend))

        const commonCapsules = await Promise.all(
          resolvedFriends.map(async (friend) => {
            const capsules = await fetchCommonCapsules(friend._id).catch(() => [])
            return { friend, capsules }
          }),
        )

        if (active) {
          setFriendData(commonCapsules)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const username = useMemo(() => {
    const clean = String(currentUser?.username || currentUser?.name || '').trim().toLowerCase().replace(/\s+/g, '')
    return clean || 'usuario'
  }, [currentUser])

  const shareUrl = useMemo(() => `https://momentum.app/perfil/${username}`, [username])

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 2000)
    } catch {
      setAddStatus({ kind: 'error', text: 'No se pudo copiar el enlace' })
    }
  }

  const handleAddFriend = async () => {
    const query = busqueda.trim()
    if (!query) {
      setAddStatus({ kind: 'warning', text: 'Introduce un nombre de usuario' })
      return
    }

    setSending(true)
    setAddStatus(null)

    try {
      await requestFriendByUsername(query)
      setAddStatus({ kind: 'success', text: `Solicitud enviada a @${query}` })
      setBusqueda('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error'

      if (message === 'User not found') {
        setAddStatus({ kind: 'error', text: 'Usuario no encontrado' })
      } else if (message === 'You are already friends') {
        setAddStatus({ kind: 'error', text: 'Ya sois amigos' })
      } else if (message === 'Friend request already sent') {
        setAddStatus({ kind: 'warning', text: 'Solicitud ya enviada' })
      } else {
        setAddStatus({ kind: 'error', text: 'No se pudo enviar la solicitud' })
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="mis-amigos-page" aria-label="Mis amigos">
      <header className="mis-amigos-page__header" aria-label="Encabezado de amigos">
        <span className="mis-amigos-page__header-spacer" aria-hidden="true" />

        <a className="mis-amigos-page__logo-button" href="/inicio" aria-label="Ir a inicio">
          <img className="mis-amigos-page__logo" src={logoMAsset} alt="Momentum" />
        </a>

        <button type="button" className="mis-amigos-page__settings-button" onClick={() => navigate('/ajustes')} aria-label="Abrir ajustes">
          <img className="mis-amigos-page__settings-icon" src={settingsIconAsset} alt="" aria-hidden="true" />
        </button>
      </header>

      <h1 className="mis-amigos-page__title">MIS AMIGOS</h1>

        <section className="mis-amigos-page__list" aria-label="Lista de amigos">
          {loading ? <p className="mis-amigos-page__empty">Cargando amigos...</p> : null}
          {!loading && friendData.length === 0 ? <p className="mis-amigos-page__empty">Todavía no tienes amigos aceptados.</p> : null}

          {friendData.map(({ friend, capsules }) => {
            const visibleCapsules = capsules.slice(0, 3)
            const hasMore = capsules.length > 3

            return (
              <article key={friend._id} className="mis-amigos-row">
                <div className="mis-amigos-row__photo-wrap">
                  {friend.profilePhoto || friend.avatar ? (
                    <img className="mis-amigos-row__photo" src={friend.profilePhoto || friend.avatar} alt={friend.name} />
                  ) : (
                    <div className="mis-amigos-row__photo-fallback" aria-label={`Sin foto de ${friend.name}`}>
                      <span>{getInitial(friend.name)}</span>
                    </div>
                  )}
                </div>

                <div className="mis-amigos-row__capsules" aria-label={`Cápsulas compartidas con ${friend.name}`}>
                  {visibleCapsules.map((capsule) => (
                    <CapsulaThumb key={capsule._id} capsula={mapCapsule(capsule)} onOpen={(capsuleId) => navigate(`/capsulas/${capsuleId}`)} />
                  ))}
                </div>

                {hasMore ? (
                  <button
                    type="button"
                    className="mis-amigos-row__more"
                    onClick={() => navigate(`/amigos/${friend._id}`)}
                    aria-label={`Ver más cápsulas compartidas con ${friend.name}`}
                  >
                    Ver más &gt;
                  </button>
                ) : null}
              </article>
            )
          })}
        </section>

        <section className="mis-amigos-page__add" aria-label="Añadir amigos">
          <h2 className="mis-amigos-page__add-title">AÑADIR AMIGOS</h2>

          <div className="mis-amigos-page__row">
            <input className="mis-amigos-page__input" type="text" value={shareUrl} readOnly aria-label="URL para compartir perfil" />
            <button type="button" className="mis-amigos-page__button" onClick={handleCopyUrl}>
              {shareCopied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>

          <div className="mis-amigos-page__row">
            <input
              className="mis-amigos-page__input"
              type="text"
              placeholder="Introduce el nombre de tu amigo"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              aria-label="Buscar amigo por nombre de usuario"
            />
            <button type="button" className="mis-amigos-page__button" onClick={handleAddFriend} disabled={sending}>
              {sending ? '...' : 'Añadir'}
            </button>
          </div>

          {addStatus ? (
            <p
              className={`mis-amigos-page__message mis-amigos-page__message--${addStatus.kind}`}
              aria-live="polite"
            >
              {addStatus.text}
            </p>
          ) : null}
        </section>

      <div className="mis-amigos-page__bottom-space" aria-hidden="true" />
    </section>
  )
}

export default MisAmigos
