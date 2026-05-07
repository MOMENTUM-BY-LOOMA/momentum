import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type ApiNotification,
} from '../services/api.ts'

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000').replace(/\/$/, '')

type NotificationBellProps = {
  token: string | null
}

function resolveUrl(url: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`
}

function resolveNotificationText(notification: ApiNotification) {
  const actorName = typeof notification.actor === 'object' && notification.actor
    ? notification.actor.name
    : 'Alguien'
  const message = notification.data?.message ?? notification.type.replaceAll('_', ' ')
  return `${actorName} ${message}`
}

function formatDate(value?: string) {
  if (!value) return 'Hace un momento'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function NotificationBell({ token }: NotificationBellProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading] = useState(false)
  const [error, setError] = useState('')
  const [sharingModal, setSharingModal] = useState<ApiNotification | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const loadAll = async () => {
    try {
      const [countResult, notificationsResult] = await Promise.all([
        fetchUnreadNotificationCount(),
        fetchNotifications(),
      ])
      setUnreadCount(countResult.unreadCount)
      setNotifications(notificationsResult)

      const pending = notificationsResult.find(
        (n) => !n.read && n.type === 'collaborator_added'
      )
      if (pending) setSharingModal(pending)
    } catch {
      setUnreadCount(0)
    }
  }

  useEffect(() => {
    if (!token) {
      setNotifications([])
      setUnreadCount(0)
      setOpen(false)
      setSharingModal(null)
      return
    }

    loadAll()
    const intervalId = window.setInterval(loadAll, 60000)
    return () => window.clearInterval(intervalId)
  }, [token])

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead()
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron marcar como leídas')
    }
  }

  async function handleMarkRead(notificationId: string) {
    try {
      await markNotificationRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => n._id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la notificación')
    }
  }

  async function handleAcceptSharing(notification: ApiNotification) {
    const capsuleId = notification.data?.capsuleId
    await markNotificationRead(notification._id).catch(() => {})
    setNotifications((prev) => prev.map((n) => n._id === notification._id ? { ...n, read: true } : n))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    setSharingModal(null)
    if (capsuleId) navigate(`/capsulas/${capsuleId}/compartida`)
  }

  async function handleRejectSharing(notification: ApiNotification) {
    const capsuleId = notification.data?.capsuleId
    if (!capsuleId) { setSharingModal(null); return }

    const authUser = sessionStorage.getItem('authUser')
    const currentUserId = authUser ? JSON.parse(authUser)._id : null
    if (!currentUserId) { setSharingModal(null); return }

    setRejectingId(notification._id)
    try {
      const token = sessionStorage.getItem('authToken')
      await fetch(`${API_BASE}/api/capsules/${capsuleId}/collaborators/${currentUserId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      await markNotificationRead(notification._id).catch(() => {})
      setNotifications((prev) => prev.map((n) => n._id === notification._id ? { ...n, read: true } : n))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // silently dismiss
    } finally {
      setRejectingId(null)
      setSharingModal(null)
    }
  }

  if (!token) return null

  const actor = sharingModal
    ? (typeof sharingModal.actor === 'object' ? sharingModal.actor : null)
    : null
  const actorName = actor?.name ?? 'Alguien'
  const actorAvatar = actor?.avatar ?? null

  return (
    <>
      <div className="notification-bell">
        <button
          type="button"
          className="notification-bell__button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Abrir notificaciones"
          aria-expanded={open}
        >
          <span aria-hidden="true">🔔</span>
          {unreadCount > 0 && <span className="notification-bell__badge">{unreadCount}</span>}
        </button>

        {open && (
          <div className="notification-bell__panel">
            <div className="notification-bell__panel-header">
              <strong>Notificaciones</strong>
              <button type="button" className="notification-bell__link" onClick={handleMarkAllRead}>
                Marcar todo como leído
              </button>
            </div>

            {error && <p className="notification-bell__status">{error}</p>}

            {loading ? (
              <p className="notification-bell__status">Cargando...</p>
            ) : notifications.length === 0 ? (
              <p className="notification-bell__status">No tienes notificaciones.</p>
            ) : (
              <ul className="notification-bell__list">
                {notifications.map((notification) => (
                  <li
                    key={notification._id}
                    className={`notification-bell__item ${notification.read ? 'is-read' : ''}`}
                  >
                    <button
                      type="button"
                      className="notification-bell__item-button"
                      onClick={() => handleMarkRead(notification._id)}
                    >
                      <span className="notification-bell__item-text">
                        {resolveNotificationText(notification)}
                      </span>
                      <span className="notification-bell__item-meta">
                        {formatDate(notification.createdAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Sharing modal overlay */}
      {sharingModal && (
        <div className="nb-sharing-overlay">
          <div className="nb-sharing-modal">
            <div className="nb-sharing-modal__actor">
              <div className="nb-sharing-modal__avatar">
                {actorAvatar
                  ? <img src={resolveUrl(actorAvatar)} alt={actorName} />
                  : <span>{actorName.charAt(0).toUpperCase()}</span>}
              </div>
              <p className="nb-sharing-modal__text">
                <strong>{actorName}</strong> te ha compartido una cápsula
              </p>
            </div>

            <div className="nb-sharing-modal__actions">
              <button
                type="button"
                className="nb-sharing-modal__btn nb-sharing-modal__btn--reject"
                onClick={() => handleRejectSharing(sharingModal)}
                disabled={rejectingId === sharingModal._id}
              >
                Rechazar
              </button>
              <button
                type="button"
                className="nb-sharing-modal__btn nb-sharing-modal__btn--accept"
                onClick={() => handleAcceptSharing(sharingModal)}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default NotificationBell
