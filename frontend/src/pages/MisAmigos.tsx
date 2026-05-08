import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CapsulaThumb, { type ThumbCapsule } from '../components/CapsulaThumb'
import { logoMAsset, settingsIconAsset } from '../img'
import {
  acceptFriendRequest,
  fetchCurrentUser,
  fetchFriends,
  fetchIncomingFriendRequests,
  fetchOutgoingFriendRequests,
  fetchCommonCapsules,
  getCapsuleThumb,
  rejectFriendRequest,
  requestFriendByUserId,
  searchUsers,
  type ApiCapsule,
  type ApiFriendRelation,
  type ApiUser,
} from '../services/api'

type FriendItem = {
  friend: ApiUser
  capsules: ApiCapsule[]
}

type PendingItem = {
  relationId: string
  user: ApiUser
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
  const { thumbnailUrl, modelUrl } = getCapsuleThumb(capsule)
  return { id: capsule._id, nombre: capsule.title || 'Capsula', thumbnailUrl, modelUrl }
}

function getInitial(name: string) {
  const clean = name.trim()
  return clean ? clean.charAt(0).toUpperCase() : '?'
}

function getUserHandle(user: ApiUser) {
  const explicitUsername = String(user.username || '').trim().toLowerCase().replace(/\s+/g, '')
  if (explicitUsername) return explicitUsername

  const nameBasedUsername = String(user.name || '').trim().toLowerCase().replace(/\s+/g, '')
  return nameBasedUsername || 'usuario'
}

function MisAmigos() {
  const navigate = useNavigate()
  const searchBoxRef = useRef<HTMLDivElement | null>(null)
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null)
  const [friendData, setFriendData] = useState<FriendItem[]>([])
  const [incomingRequests, setIncomingRequests] = useState<PendingItem[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<PendingItem[]>([])
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)
  const [processingSearchUserId, setProcessingSearchUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [shareCopied, setShareCopied] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [searchResults, setSearchResults] = useState<ApiUser[]>([])
  const [sentSearchUserIds, setSentSearchUserIds] = useState<Record<string, boolean>>({})
  const [addStatus, setAddStatus] = useState<AddStatus>(null)

  const loadFriendData = async (acceptedFriends: ApiFriendRelation[]) => {
    const resolvedFriends = acceptedFriends
      .map((relation) => relationToFriend(relation))
      .filter((friend): friend is ApiUser => Boolean(friend))

    const commonCapsules = await Promise.all(
      resolvedFriends.map(async (friend) => {
        const capsules = await fetchCommonCapsules(friend._id).catch(() => [])
        return { friend, capsules }
      }),
    )

    setFriendData(commonCapsules)
  }

  const toIncomingPending = (relations: ApiFriendRelation[]): PendingItem[] => {
    return relations
      .map((relation) => ({
        relationId: relation._id,
        user: relation.requester && typeof relation.requester !== 'string' ? relation.requester : null,
      }))
      .filter((entry): entry is PendingItem => Boolean(entry.user))
  }

  const toOutgoingPending = (relations: ApiFriendRelation[]): PendingItem[] => {
    return relations
      .map((relation) => ({
        relationId: relation._id,
        user: relation.recipient && typeof relation.recipient !== 'string' ? relation.recipient : null,
      }))
      .filter((entry): entry is PendingItem => Boolean(entry.user))
  }

  const refreshFriendsAndRequests = async () => {
    const [acceptedFriends, incoming, outgoing] = await Promise.all([
      fetchFriends().catch(() => []),
      fetchIncomingFriendRequests().catch(() => []),
      fetchOutgoingFriendRequests().catch(() => []),
    ])

    setIncomingRequests(toIncomingPending(incoming))
    setOutgoingRequests(toOutgoingPending(outgoing))
    await loadFriendData(acceptedFriends)
  }

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const me = await fetchCurrentUser().catch(() => null)

        if (!active) return

        setCurrentUser(me)

        await refreshFriendsAndRequests()
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const query = busqueda.trim()

    if (query.length < 2) {
      setSearchingUsers(false)
      setSearchResults([])
      return
    }

    setSearchingUsers(true)

    const timeoutId = window.setTimeout(async () => {
      try {
        const users = await searchUsers(query)
        setSearchResults(users)
      } catch {
        setSearchResults([])
      } finally {
        setSearchingUsers(false)
      }
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [busqueda])

  useEffect(() => {
    const onDocumentPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (searchBoxRef.current && target && !searchBoxRef.current.contains(target)) {
        setSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', onDocumentPointerDown)
    return () => {
      document.removeEventListener('mousedown', onDocumentPointerDown)
    }
  }, [])

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingRequestId(requestId)
    setAddStatus(null)

    try {
      await acceptFriendRequest(requestId)
      await refreshFriendsAndRequests()
      setAddStatus({ kind: 'success', text: 'Solicitud aceptada' })
    } catch {
      setAddStatus({ kind: 'error', text: 'No se pudo aceptar la solicitud' })
    } finally {
      setProcessingRequestId(null)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequestId(requestId)
    setAddStatus(null)

    try {
      await rejectFriendRequest(requestId)
      await refreshFriendsAndRequests()
      setAddStatus({ kind: 'warning', text: 'Solicitud rechazada' })
    } catch {
      setAddStatus({ kind: 'error', text: 'No se pudo rechazar la solicitud' })
    } finally {
      setProcessingRequestId(null)
    }
  }

  const handleRequestFromSearch = async (user: ApiUser) => {
    setProcessingSearchUserId(user._id)
    setAddStatus(null)

    try {
      await requestFriendByUserId(user._id)
      setSentSearchUserIds((prev) => ({ ...prev, [user._id]: true }))
      await refreshFriendsAndRequests()
      setAddStatus({ kind: 'success', text: `Solicitud enviada a @${getUserHandle(user)}` })
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
      setProcessingSearchUserId(null)
      setBusqueda('')
      setSearchResults([])
      setSearchOpen(false)
    }
  }

  const handleSelectSearchResult = () => {
    setBusqueda('')
    setSearchResults([])
    setSearchOpen(false)
  }

  const username = useMemo(() => {
    const clean = String(currentUser?.username || currentUser?.name || '').trim().toLowerCase().replace(/\s+/g, '')
    return clean || 'usuario'
  }, [currentUser])

  const shareUrl = useMemo(() => `https://momentum.app/perfil/${username}`, [username])
  const outgoingPendingIds = useMemo(() => new Set(outgoingRequests.map((entry) => entry.user._id)), [outgoingRequests])

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 2000)
    } catch {
      setAddStatus({ kind: 'error', text: 'No se pudo copiar el enlace' })
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

      <section className="mis-amigos-page__requests" aria-label="Solicitudes de amistad">
        <article className="mis-amigos-panel" aria-label="Bloque de solicitudes recibidas">
          <h2 className="mis-amigos-page__add-title">SOLICITUDES RECIBIDAS</h2>
          {incomingRequests.length === 0 ? (
            <p className="mis-amigos-page__empty">No tienes solicitudes pendientes.</p>
          ) : (
            incomingRequests.map(({ relationId, user }) => (
              <article key={relationId} className="mis-amigos-request-row">
                <div className="mis-amigos-request-row__identity">
                  {user.profilePhoto || user.avatar ? (
                    <img className="mis-amigos-request-row__photo" src={user.profilePhoto || user.avatar} alt={user.name} />
                  ) : (
                    <div className="mis-amigos-request-row__photo-fallback" aria-label={`Sin foto de ${user.name}`}>
                      <span>{getInitial(user.name)}</span>
                    </div>
                  )}
                  <span className="mis-amigos-request-row__name">{user.name}</span>
                </div>

                <div className="mis-amigos-request-row__actions">
                  <button
                    type="button"
                    className="mis-amigos-page__button"
                    disabled={processingRequestId === relationId}
                    onClick={() => handleAcceptRequest(relationId)}
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    className="mis-amigos-page__button mis-amigos-page__button--ghost mis-amigos-page__button--icon"
                    disabled={processingRequestId === relationId}
                    onClick={() => handleRejectRequest(relationId)}
                    aria-label={`Rechazar solicitud de ${user.name}`}
                  >
                    x
                  </button>
                </div>
              </article>
            ))
          )}
        </article>

        <article className="mis-amigos-panel" aria-label="Bloque de solicitudes enviadas">
          <h2 className="mis-amigos-page__add-title">SOLICITUDES ENVIADAS</h2>
          {outgoingRequests.length === 0 ? (
            <p className="mis-amigos-page__empty">No tienes solicitudes enviadas pendientes.</p>
          ) : (
            outgoingRequests.map(({ relationId, user }) => (
              <article key={relationId} className="mis-amigos-request-row">
                <div className="mis-amigos-request-row__identity">
                  {user.profilePhoto || user.avatar ? (
                    <img className="mis-amigos-request-row__photo" src={user.profilePhoto || user.avatar} alt={user.name} />
                  ) : (
                    <div className="mis-amigos-request-row__photo-fallback" aria-label={`Sin foto de ${user.name}`}>
                      <span>{getInitial(user.name)}</span>
                    </div>
                  )}
                  <span className="mis-amigos-request-row__name">{user.name}</span>
                </div>
                <span className="mis-amigos-request-row__pending">Pendiente</span>
              </article>
            ))
          )}
        </article>
      </section>

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
            <div className="mis-amigos-page__search" ref={searchBoxRef}>
              <input
                className="mis-amigos-page__input"
                type="text"
                placeholder="Introduce el nombre de tu amigo"
                value={busqueda}
                onFocus={() => {
                  if (busqueda.trim().length >= 2) {
                    setSearchOpen(true)
                  }
                }}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setBusqueda(nextValue)
                  setSearchOpen(nextValue.trim().length >= 2)
                }}
                aria-label="Buscar amigo por nombre de usuario"
              />

              {searchOpen ? (
                <div className="mis-amigos-page__search-results" role="listbox" aria-label="Resultados de usuarios">
                  {searchingUsers ? <p className="mis-amigos-page__search-empty">Buscando usuarios...</p> : null}

                  {!searchingUsers && searchResults.length === 0 ? (
                    <p className="mis-amigos-page__search-empty">No se encontró ningún usuario</p>
                  ) : null}

                  {!searchingUsers && searchResults.map((user) => {
                    const handle = getUserHandle(user)
                    const requestAlreadySent = Boolean(sentSearchUserIds[user._id] || outgoingPendingIds.has(user._id))

                    return (
                      <article key={user._id} className="mis-amigos-page__search-item">
                        <button
                          type="button"
                          className="mis-amigos-page__search-main"
                          onClick={handleSelectSearchResult}
                          aria-label={`Seleccionar ${handle}`}
                        >
                          {user.profilePhoto || user.avatar ? (
                            <img className="mis-amigos-page__search-avatar" src={user.profilePhoto || user.avatar} alt={user.name} />
                          ) : (
                            <div className="mis-amigos-page__search-avatar-fallback" aria-hidden="true">
                              <span>{getInitial(user.name)}</span>
                            </div>
                          )}
                          <span className="mis-amigos-page__search-username">@{handle}</span>
                        </button>

                        <button
                          type="button"
                          className="mis-amigos-page__search-add"
                          onClick={() => handleRequestFromSearch(user)}
                          disabled={requestAlreadySent || processingSearchUserId === user._id}
                          aria-label={`Enviar solicitud a ${handle}`}
                        >
                          {requestAlreadySent ? 'Solicitud enviada' : '+'}
                        </button>
                      </article>
                    )
                  })}
                </div>
              ) : null}
            </div>
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
