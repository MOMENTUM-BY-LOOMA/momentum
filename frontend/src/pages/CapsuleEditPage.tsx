import { useEffect, useState, Fragment, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { logoMAsset } from '../img'
import { fetchCapsuleById, type ApiCapsule, type ApiUser } from '../services/api'
import '../styles/capsule-edit.css'

interface ModalState {
  type: 'delete' | 'add-friend' | null
}

function CapsuleEditPage() {
  const { capsuleId: id } = useParams<{ capsuleId: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [capsule, setCapsule] = useState<ApiCapsule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<ModalState>({ type: null })
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [friends] = useState<ApiUser[]>([])

  const mediaItems = (capsule?.mediaItems || []).filter(
    (item) => item.type === 'image' || item.type === 'video'
  )

  useEffect(() => {
    if (!id) {
      setError('ID de cápsula no encontrado')
      setLoading(false)
      return
    }

    const token = sessionStorage.getItem('authToken')
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    let active = true

    const fetchData = async () => {
      try {
        const data = await fetchCapsuleById(id)
        
        // Verificar permiso de edición
        const authUser = sessionStorage.getItem('authUser')
        if (!authUser) throw new Error('No auth user')
        
        const user = JSON.parse(authUser)
        const ownerId = typeof data.owner === 'string' ? data.owner : data.owner?._id
        
        const canEdit = user._id === ownerId || data.collaborators?.some((c: any) =>
          (typeof c.user === 'string' ? c.user : c.user._id) === user._id && 
          (c.role === 'admin' || c.role === 'edit')
        )

        if (!canEdit) {
          throw new Error('No tienes permiso para editar esta cápsula')
        }

        if (active) {
          setCapsule(data)
          setLoading(false)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar la cápsula')
          setLoading(false)
        }
      }
    }

    fetchData()
    return () => {
      active = false
    }
  }, [id, navigate])

  const handleDeleteCapsule = async () => {
    if (!capsule || !id) return

    try {
      const token = sessionStorage.getItem('authToken')
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/capsules/${id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      )

      if (response.ok) {
        navigate('/mis-capsulas', { replace: true })
      } else {
        setError('No se pudo eliminar la cápsula')
      }
    } catch (err) {
      setError('Error al eliminar')
    } finally {
      setModal({ type: null })
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
      const uploadResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/uploads/media`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        }
      )

      if (!uploadResponse.ok) throw new Error('Upload failed')
      const uploadedMedia = await uploadResponse.json()

      // Añadir media a la cápsula
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/capsules/${id}/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            url: uploadedMedia.url,
            type: uploadedMedia.type,
            modelFormat: uploadedMedia.modelFormat,
          }),
        }
      )

      if (response.ok) {
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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/capsules/${id}/share`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: friendId }),
        }
      )

      if (response.ok) {
        const updated = await fetchCapsuleById(id)
        setCapsule(updated)
        setModal({ type: null })
      }
    } catch (err) {
      console.error('Error adding friend:', err)
    }
  }

  if (loading) {
    return (
      <Fragment>
        <header className="mobile-header" aria-label="Editar cápsula">
          <button type="button" onClick={() => navigate(-1)} aria-label="Volver">←</button>
          <Link to="/inicio" className="logo-button" aria-label="Ir a inicio">
            <img src={logoMAsset} alt="Momentum" />
          </Link>
          <span aria-hidden="true" />
        </header>
        <section className="page-layout">
          <p>Cargando...</p>
        </section>
      </Fragment>
    )
  }

  if (error || !capsule) {
    return (
      <Fragment>
        <header className="mobile-header" aria-label="Error">
          <button type="button" onClick={() => navigate(-1)} aria-label="Volver">←</button>
          <Link to="/inicio" className="logo-button" aria-label="Ir a inicio">
            <img src={logoMAsset} alt="Momentum" />
          </Link>
          <span aria-hidden="true" />
        </header>
        <section className="page-layout">
          <p>{error}</p>
        </section>
      </Fragment>
    )
  }

  return (
    <Fragment>
      <header className="mobile-header" aria-label="Editar cápsula">
        <button type="button" onClick={() => navigate(-1)} aria-label="Volver">←</button>
        <Link to="/inicio" className="logo-button" aria-label="Ir a inicio">
          <img src={logoMAsset} alt="Momentum" />
        </Link>
        <span aria-hidden="true" />
      </header>

      <section className="page-layout capsule-edit">
        {/* Fila Superior */}
        <div className="capsule-edit__header-row">
          <div className="capsule-edit__title-pill">
            <span>{capsule.title}</span>
            <button 
              type="button"
              className="capsule-edit__delete-btn"
              onClick={() => setModal({ type: 'delete' })}
              aria-label="Eliminar cápsula"
              title="Eliminar"
            >
              ×
            </button>
          </div>

          <button
            type="button"
            className="capsule-edit__cancel-btn"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </button>
        </div>

        {/* Botón Añadir Amigo */}
        <button
          type="button"
          className="capsule-edit__add-friend-btn"
          onClick={() => setModal({ type: 'add-friend' })}
        >
          + añadir amigo
        </button>

        {/* Carrusel Editable */}
        {mediaItems.length > 0 ? (
          <div className="capsule-edit__carousel-container">
            <div className="capsule-edit__carousel">
              {mediaItems.map((media, idx) => (
                <div key={media._id || idx} className="capsule-edit__slide">
                  {media.type === 'video' ? (
                    <video src={media.url} className="capsule-edit__media" />
                  ) : (
                    <img src={media.url} alt={`Slide ${idx + 1}`} className="capsule-edit__media" />
                  )}
                </div>
              ))}

              {/* Botón + para añadir foto */}
              <button
                type="button"
                className="capsule-edit__add-media-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia}
                aria-label="Añadir foto"
              >
                +
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="capsule-edit__add-media-btn capsule-edit__add-media-btn--large"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingMedia}
          >
            + Añadir fotos
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

        {/* Descripción Editable */}
        <section className="capsule-edit__description-section">
          <h3 className="capsule-edit__description-title">Descripción</h3>
          <textarea
            value={capsule.description || ''}
            onChange={(e) => {
              setCapsule({ ...capsule, description: e.target.value })
              // Auto-save aquí si lo deseas
            }}
            placeholder="Escribe la descripción de tu cápsula..."
            className="capsule-edit__description-textarea"
          />
        </section>
      </section>

      {/* Modales */}
      {modal.type === 'delete' && (
        <div className="capsule-edit__modal-overlay" onClick={() => setModal({ type: null })}>
          <div className="capsule-edit__modal" onClick={(e) => e.stopPropagation()}>
            <h2>Confirmar eliminación</h2>
            <p>¿Estás seguro de que deseas eliminar esta cápsula? Esta acción no se puede deshacer.</p>
            <div className="capsule-edit__modal-buttons">
              <button 
                type="button" 
                className="capsule-edit__modal-btn capsule-edit__modal-btn--cancel"
                onClick={() => setModal({ type: null })}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="capsule-edit__modal-btn capsule-edit__modal-btn--delete"
                onClick={handleDeleteCapsule}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {modal.type === 'add-friend' && (
        <div className="capsule-edit__modal-overlay" onClick={() => setModal({ type: null })}>
          <div className="capsule-edit__modal" onClick={(e) => e.stopPropagation()}>
            <h2>Añadir amigo</h2>
            <p className="capsule-edit__modal-subtitle">Selecciona un amigo para compartir esta cápsula</p>
            <div className="capsule-edit__friends-list">
              {friends.length > 0 ? (
                friends.map((friend) => (
                  <div key={friend._id} className="capsule-edit__friend-item">
                    <div className="capsule-edit__friend-info">
                      {friend.avatar ? (
                        <img src={friend.avatar} alt={friend.name} className="capsule-edit__friend-avatar" />
                      ) : (
                        <div className="capsule-edit__friend-avatar-fallback">
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="capsule-edit__friend-text">
                        <strong>{friend.name}</strong>
                        <small>@{friend.username || friend.name}</small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="capsule-edit__friend-add-btn"
                      onClick={() => handleAddFriend(friend._id)}
                    >
                      Añadir
                    </button>
                  </div>
                ))
              ) : (
                <p className="capsule-edit__no-friends">No tienes amigos disponibles</p>
              )}
            </div>
            <button 
              type="button" 
              className="capsule-edit__modal-close-btn"
              onClick={() => setModal({ type: null })}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </Fragment>
  )
}

export default CapsuleEditPage
