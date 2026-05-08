import { useEffect, useState, Fragment, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { logoMAsset } from '../img'
import iconDeleteN from '../img/icon_delete_n.svg'
import iconCreate from '../img/icon_create.svg'
import {
  fetchCapsuleById,
  fetchFriends,
  type ApiCapsule,
  type ApiUser,
  type ApiFriendRelation,
} from '../services/api'
import '../styles/capsule-edit.css'

const API_BASE = import.meta.env.VITE_API_URL
const SLIDE_REDUCTION = 92
const SLIDE_GAP = 12

function resolveUrl(url: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`
}

function AvatarStack({ users, max = 4, size = 26 }: { users: any[]; max?: number; size?: number }) {
  if (!users.length) return null
  const visible = users.slice(0, max)
  return (
    <div className="ce-avatar-stack" aria-hidden="true">
      {visible.map((u, i) => {
        const name = typeof u === 'string' ? u : (u?.name || u?.username || '?')
        const avatar = typeof u === 'string' ? null : u?.avatar
        return (
          <div key={i} className="ce-avatar-stack__item" style={{ width: size, height: size, zIndex: max - i }}>
            {avatar
              ? <img src={resolveUrl(avatar)} alt={name} />
              : <span>{name.charAt(0).toUpperCase()}</span>}
          </div>
        )
      })}
    </div>
  )
}

function CapsuleEditPage() {
  const { capsuleId: id } = useParams<{ capsuleId: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  const [capsule, setCapsule] = useState<ApiCapsule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [friends, setFriends] = useState<ApiUser[]>([])
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [slideWidth, setSlideWidth] = useState(0)
  const [canManage, setCanManage] = useState(false)

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [savingTitle, setSavingTitle] = useState(false)

  const mediaItems = (capsule?.mediaItems || []).filter(
    (m) => m.type === 'image' || m.type === 'video'
  )
  const totalSlides = mediaItems.length

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    const measure = () => setSlideWidth(el.offsetWidth - SLIDE_REDUCTION)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [loading])

  useEffect(() => {
    if (!id) { setError('ID de cápsula no encontrado'); setLoading(false); return }
    const token = sessionStorage.getItem('authToken')
    if (!token) { navigate('/login', { replace: true }); return }
    let active = true

    const load = async () => {
      try {
        const [data, friendsData] = await Promise.all([
          fetchCapsuleById(id),
          fetchFriends().catch(() => [] as ApiFriendRelation[]),
        ])

        const authUser = sessionStorage.getItem('authUser')
        if (!authUser) throw new Error('No auth user')
        const user = JSON.parse(authUser)
        const userId = user._id

        const ownerId = typeof data.owner === 'string' ? data.owner : data.owner?._id
        const isOwner = userId === ownerId
        const isAdmin = data.collaborators?.some((c: any) =>
          (typeof c.user === 'string' ? c.user : c.user._id) === userId && c.role === 'admin'
        ) ?? false
        const isEditor = data.collaborators?.some((c: any) =>
          (typeof c.user === 'string' ? c.user : c.user._id) === userId && c.role === 'edit'
        ) ?? false

        if (!isOwner && !isAdmin && !isEditor) {
          throw new Error('No tienes permiso para editar esta cápsula')
        }

        const alreadySharedIds = new Set([
          ...(data.sharedWith ?? []).map((u: any) => typeof u === 'string' ? u : u._id),
          ...(data.collaborators ?? []).map((c: any) => typeof c.user === 'string' ? c.user : c.user._id),
          ownerId,
        ])

        const friendUsers: ApiUser[] = friendsData
          .filter((r) => r.status === 'accepted')
          .map((r) => {
            const u = r.otherUser ?? r.friend ?? (
              typeof r.requester === 'object' && (r.requester as ApiUser)._id !== userId
                ? r.requester as ApiUser
                : typeof r.recipient === 'object' ? r.recipient as ApiUser : null
            )
            return u as ApiUser
          })
          .filter(Boolean)
          .filter((u) => !alreadySharedIds.has(u._id))

        if (active) {
          setCapsule(data)
          setCanManage(isOwner || isAdmin)
          setFriends(friendUsers)
          setLoading(false)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar la cápsula')
          setLoading(false)
        }
      }
    }

    load()
    return () => { active = false }
  }, [id, navigate])

  const patchCapsule = useCallback(async (body: Record<string, unknown>) => {
    if (!id) return
    const token = sessionStorage.getItem('authToken')
    await fetch(`${API_BASE}/api/capsules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body),
    })
  }, [id])

  const handleSaveTitle = async () => {
    if (!capsule) return
    const trimmed = titleDraft.trim()
    if (!trimmed || trimmed === capsule.title) { setEditingTitle(false); return }
    setSavingTitle(true)
    try {
      await patchCapsule({ title: trimmed })
      setCapsule({ ...capsule, title: trimmed })
    } finally {
      setSavingTitle(false)
      setEditingTitle(false)
    }
  }

  const handleDescriptionBlur = async (value: string) => {
    if (!capsule || value === (capsule.description ?? '')) return
    setCapsule({ ...capsule, description: value })
    await patchCapsule({ description: value })
  }

  const handleDeleteMedia = async (mediaId: string) => {
    if (!id) return
    const token = sessionStorage.getItem('authToken')
    try {
      const res = await fetch(`${API_BASE}/api/capsules/${id}/media/${mediaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const updated = await fetchCapsuleById(id)
        setCapsule(updated)
        const newCount = (updated.mediaItems ?? []).filter(
          (m) => m.type === 'image' || m.type === 'video'
        ).length
        setSlideIndex((prev) => Math.min(prev, Math.max(0, newCount - 1)))
      }
    } catch (err) {
      console.error('Error deleting media:', err)
    }
  }

  const handleDeleteCapsule = async () => {
    if (!capsule || !id) return
    try {
      const token = sessionStorage.getItem('authToken')
      const res = await fetch(`${API_BASE}/api/capsules/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        navigate('/mis-capsulas', { replace: true })
      } else {
        setError('No se pudo eliminar la cápsula')
      }
    } catch {
      setError('Error al eliminar')
    } finally {
      setShowDeleteModal(false)
    }
  }

  const handleAddMedia = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !capsule || !id) return
    setUploadingMedia(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const token = sessionStorage.getItem('authToken')

      const uploadRes = await fetch(`${API_BASE}/api/uploads/media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const uploaded = await uploadRes.json()

      const addRes = await fetch(`${API_BASE}/api/capsules/${id}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ url: uploaded.url, type: uploaded.type, modelFormat: uploaded.modelFormat }),
      })
      if (addRes.ok) {
        const updated = await fetchCapsuleById(id)
        setCapsule(updated)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('Error uploading media:', err)
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleAddFriend = async (friendId: string) => {
    if (!id) return
    try {
      const token = sessionStorage.getItem('authToken')
      const res = await fetch(`${API_BASE}/api/capsules/${id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userIds: [friendId] }),
      })
      if (res.ok) {
        const updated = await fetchCapsuleById(id)
        setCapsule(updated)
        setFriends((prev) => prev.filter((f) => f._id !== friendId))
        setShowAddFriend(false)
      }
    } catch (err) {
      console.error('Error adding friend:', err)
    }
  }

  const handleSave = async () => {
    const desc = descriptionRef.current?.value ?? ''
    if (capsule && desc !== (capsule.description ?? '')) {
      await patchCapsule({ description: desc })
    }
    navigate(-1)
  }

  const translateX = slideWidth > 0
    ? `${slideIndex * -(slideWidth + SLIDE_GAP)}px`
    : `calc(${slideIndex} * -1 * (min(100vw, 600px) - ${SLIDE_REDUCTION - SLIDE_GAP}px))`

  const header = (
    <header className="mobile-header" aria-label="Editar cápsula">
      <button type="button" className="mobile-header__left" onClick={() => navigate(-1)} aria-label="Volver">←</button>
      <Link to="/inicio" className="logo-button" aria-label="Ir a inicio">
        <img src={logoMAsset} alt="Momentum" />
      </Link>
      <span className="mobile-header__right" aria-hidden="true" />
    </header>
  )

  if (loading) return (
    <Fragment>
      {header}
      <section className="page-layout"><p>Cargando...</p></section>
    </Fragment>
  )

  if (error || !capsule) return (
    <Fragment>
      {header}
      <section className="page-layout"><p>{error || 'No se pudo cargar la cápsula'}</p></section>
    </Fragment>
  )

  const collaborators = [
    ...(capsule.sharedWith ?? []),
    ...(capsule.collaborators ?? []).map((c: any) =>
      typeof c.user === 'string' ? { _id: c.user } : c.user
    ),
  ]

  return (
    <Fragment>
      {header}

      <section className="ce-page">
        {/* Header row */}
        <div className="ce-header">
          <div className="ce-header__left">
            {editingTitle ? (
              <div className="ce-title-edit">
                <input
                  className="ce-title-edit__input"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleSaveTitle() }
                    if (e.key === 'Escape') setEditingTitle(false)
                  }}
                  autoFocus
                  disabled={savingTitle}
                />
                <button
                  type="button"
                  className="ce-title-edit__cancel"
                  onMouseDown={(e) => { e.preventDefault(); setEditingTitle(false) }}
                  aria-label="Cancelar edición"
                >×</button>
              </div>
            ) : (
              <button
                type="button"
                className="ce-title__btn"
                onClick={() => { setTitleDraft(capsule.title || ''); setEditingTitle(true) }}
              >
                <span className="ce-title__text">{capsule.title}</span>
                <span className="ce-title__pencil" aria-hidden="true">✎</span>
              </button>
            )}
            <AvatarStack users={collaborators} size={26} />
          </div>

          <button type="button" className="ce-header__cancel" onClick={() => navigate(-1)}>
            Cancelar
          </button>
        </div>

        {/* Add friend — owner/admin only */}
        {canManage && (
          <button type="button" className="ce-add-friend-btn" onClick={() => setShowAddFriend(true)}>
            + añadir amigo
          </button>
        )}

        {/* Carousel */}
        {mediaItems.length > 0 ? (
          <div className="ce-carousel-wrap">
            <div className="ce-carousel-outer" ref={carouselRef}>
              <div
                className="ce-carousel-track"
                style={{ transform: `translateX(${translateX})` }}
              >
                {mediaItems.map((media, idx) => (
                  <div
                    key={media._id || idx}
                    className="ce-slide"
                    style={slideWidth > 0 ? { minWidth: slideWidth + 'px' } : undefined}
                  >
                    {media.type === 'video' ? (
                      <video src={resolveUrl(media.url)} className="ce-slide__media" />
                    ) : (
                      <img src={resolveUrl(media.url)} alt={`Slide ${idx + 1}`} className="ce-slide__media" />
                    )}
                    <button
                      type="button"
                      className="ce-slide__delete"
                      onClick={() => media._id && handleDeleteMedia(media._id)}
                      aria-label="Eliminar foto"
                    >
                      <img src={iconDeleteN} alt="" width={16} height={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}

                {/* + add slide */}
                <div
                  className="ce-slide ce-slide--add"
                  style={slideWidth > 0 ? { minWidth: slideWidth + 'px' } : undefined}
                >
                  <button
                    type="button"
                    className="ce-slide__add-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingMedia}
                    aria-label="Añadir foto"
                  >
                    {uploadingMedia
                      ? '…'
                      : <img src={iconCreate} alt="" width={22} height={22} aria-hidden="true" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="ce-carousel-controls">
              <button
                type="button"
                className="ce-carousel__arrow"
                onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                disabled={slideIndex === 0}
                aria-label="Anterior"
              >‹</button>
              <div className="ce-dots">
                {Array.from({ length: totalSlides + 1 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`ce-dot${slideIndex === i ? ' ce-dot--active' : ''}`}
                    onClick={() => setSlideIndex(i)}
                    aria-label={`Ir a slide ${i + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                className="ce-carousel__arrow"
                onClick={() => setSlideIndex((i) => Math.min(totalSlides, i + 1))}
                disabled={slideIndex >= totalSlides}
                aria-label="Siguiente"
              >›</button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="ce-add-media-empty"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingMedia}
          >
            {uploadingMedia ? 'Subiendo…' : '+ Añadir fotos'}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleAddMedia}
          style={{ display: 'none' }}
          aria-hidden="true"
        />

        {/* Description */}
        <section className="ce-description">
          <h3 className="ce-description__label">Descripción</h3>
          <textarea
            ref={descriptionRef}
            className="ce-description__textarea"
            defaultValue={capsule.description || ''}
            onBlur={(e) => handleDescriptionBlur(e.target.value)}
            placeholder="Escribe la descripción de tu cápsula…"
          />
        </section>

        {/* Guardar */}
        <button type="button" className="ce-save-btn" onClick={handleSave}>
          Guardar
        </button>

        {/* Delete capsule — owner/admin only */}
        {canManage && (
          <button type="button" className="ce-delete-capsule-btn" onClick={() => setShowDeleteModal(true)}>
            Eliminar cápsula
          </button>
        )}
      </section>

      {/* Delete confirm modal */}
      {showDeleteModal && (
        <div className="ce-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="ce-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Confirmar eliminación</h2>
            <p>¿Estás seguro de que deseas eliminar esta cápsula? Esta acción no se puede deshacer.</p>
            <div className="ce-modal__buttons">
              <button type="button" className="ce-modal__btn ce-modal__btn--cancel" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
              <button type="button" className="ce-modal__btn ce-modal__btn--delete" onClick={handleDeleteCapsule}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add friend modal */}
      {showAddFriend && (
        <div className="ce-modal-overlay" onClick={() => setShowAddFriend(false)}>
          <div className="ce-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Añadir amigo</h2>
            <p className="ce-modal__subtitle">Selecciona un amigo para compartir esta cápsula</p>
            <div className="ce-friends-list">
              {friends.length > 0 ? friends.map((friend) => (
                <div key={friend._id} className="ce-friend-item">
                  <div className="ce-friend__info">
                    {friend.avatar
                      ? <img src={resolveUrl(friend.avatar)} alt={friend.name} className="ce-friend__avatar" />
                      : <div className="ce-friend__avatar ce-friend__avatar--fallback">{friend.name.charAt(0).toUpperCase()}</div>
                    }
                    <div className="ce-friend__text">
                      <strong>{friend.name}</strong>
                      <small>@{friend.username || friend.name}</small>
                    </div>
                  </div>
                  <button type="button" className="ce-friend__add-btn" onClick={() => handleAddFriend(friend._id)}>
                    Añadir
                  </button>
                </div>
              )) : (
                <p className="ce-friends-empty">No tienes amigos disponibles para añadir</p>
              )}
            </div>
            <button type="button" className="ce-modal__close-btn" onClick={() => setShowAddFriend(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </Fragment>
  )
}

export default CapsuleEditPage
