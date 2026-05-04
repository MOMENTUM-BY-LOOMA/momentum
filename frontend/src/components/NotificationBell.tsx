import { useEffect, useState } from 'react'
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type ApiNotification,
} from '../services/api.ts'

type NotificationBellProps = {
  token: string | null
}

function resolveNotificationText(notification: ApiNotification) {
  const actorName = typeof notification.actor === 'object' && notification.actor ? notification.actor.name : 'Alguien'
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
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setNotifications([])
      setUnreadCount(0)
      setOpen(false)
      return
    }

    const loadUnreadCount = async () => {
      try {
        const result = await fetchUnreadNotificationCount()
        setUnreadCount(result.unreadCount)
      } catch {
        setUnreadCount(0)
      }
    }

    loadUnreadCount()

    const intervalId = window.setInterval(loadUnreadCount, 60000)

    return () => window.clearInterval(intervalId)
  }, [token])

  useEffect(() => {
    if (!token || !open) return

    const loadNotifications = async () => {
      setLoading(true)
      setError('')

      try {
        const result = await fetchNotifications()
        setNotifications(result)
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'No se pudieron cargar las notificaciones'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [open, token])

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead()
      setUnreadCount(0)
      setNotifications((currentNotifications) => currentNotifications.map((item) => ({ ...item, read: true })))
    } catch (markError) {
      const message = markError instanceof Error ? markError.message : 'No se pudieron marcar como leidas'
      setError(message)
    }
  }

  async function handleMarkRead(notificationId: string) {
    try {
      await markNotificationRead(notificationId)
      setNotifications((currentNotifications) => currentNotifications.map((item) => (
        item._id === notificationId ? { ...item, read: true } : item
      )))
      setUnreadCount((currentUnread) => Math.max(0, currentUnread - 1))
    } catch (markError) {
      const message = markError instanceof Error ? markError.message : 'No se pudo actualizar la notificacion'
      setError(message)
    }
  }

  if (!token) {
    return null
  }

  return (
    <div className="notification-bell">
      <button
        type="button"
        className="notification-bell__button"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        aria-label="Abrir notificaciones"
        aria-expanded={open}
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 ? <span className="notification-bell__badge">{unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="notification-bell__panel">
          <div className="notification-bell__panel-header">
            <strong>Notificaciones</strong>
            <button type="button" className="notification-bell__link" onClick={handleMarkAllRead}>
              Marcar todo como leido
            </button>
          </div>

          {error ? <p className="notification-bell__status">{error}</p> : null}

          {loading ? (
            <p className="notification-bell__status">Cargando...</p>
          ) : notifications.length === 0 ? (
            <p className="notification-bell__status">No tienes notificaciones.</p>
          ) : (
            <ul className="notification-bell__list">
              {notifications.map((notification) => (
                <li key={notification._id} className={`notification-bell__item ${notification.read ? 'is-read' : ''}`}>
                  <button
                    type="button"
                    className="notification-bell__item-button"
                    onClick={() => handleMarkRead(notification._id)}
                  >
                    <span className="notification-bell__item-text">{resolveNotificationText(notification)}</span>
                    <span className="notification-bell__item-meta">{formatDate(notification.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default NotificationBell