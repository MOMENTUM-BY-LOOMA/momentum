import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type ApiNotification,
} from '../services/api.ts'
import { useTranslate } from '../services/useTranslate'

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000').replace(/\/$/, '')

type NotificationBellProps = {
  token: string | null
  iconSrc?: string
}

function resolveUrl(url: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`
}

function resolveNotificationText(notification: ApiNotification, fallbackActor: string) {
  const actorName = typeof notification.actor === 'object' && notification.actor
    ? notification.actor.name
    : fallbackActor
  const message = notification.data?.message ?? notification.type.replaceAll('_', ' ')
  return `${actorName} ${message}`
}

function formatDate(value: string | undefined, locale: string, nowLabel: string) {
  if (!value) return nowLabel
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function NotificationBell({ token, iconSrc }: NotificationBellProps) {
  const { language } = useTranslate()
  const txt = (es: string, en: string) => (language === 'en' ? en : es)
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
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
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

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
      setError(err instanceof Error ? err.message : txt('No se pudieron marcar como leidas', 'Could not mark all as read'))
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
      setError(err instanceof Error ? err.message : txt('No se pudo actualizar la notificacion', 'Could not update notification'))
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
  const actorName = actor?.name ?? txt('Alguien', 'Someone')
  const actorAvatar = actor?.avatar ?? null

  return (
    <>
      <div className="notification-bell" ref={containerRef}>
        <button
          type="button"
          className="notification-bell__button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={txt('Abrir notificaciones', 'Open notifications')}
          aria-expanded={open}
        >
          {iconSrc
            ? <img src={iconSrc} alt="" aria-hidden="true" className="notification-bell__icon" />
            : <span aria-hidden="true">🔔</span>}
          {unreadCount > 0 && <span className="notification-bell__badge">{unreadCount}</span>}
        </button>

        {open && (
          <div className="notification-bell__panel">
            <div className="notification-bell__panel-header">
              <strong>{txt('Notificaciones', 'Notifications')}</strong>
              <button type="button" className="notification-bell__link" onClick={handleMarkAllRead}>
                {txt('Marcar todo como leido', 'Mark all as read')}
              </button>
            </div>

            {error && <p className="notification-bell__status">{error}</p>}

            {loading ? (
              <p className="notification-bell__status">{txt('Cargando...', 'Loading...')}</p>
            ) : notifications.length === 0 ? (
              <p className="notification-bell__status">{txt('No tienes notificaciones.', 'You have no notifications.')}</p>
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
                        {resolveNotificationText(notification, txt('Alguien', 'Someone'))}
                      </span>
                      <span className="notification-bell__item-meta">
                        {formatDate(notification.createdAt, language === 'en' ? 'en-US' : 'es-ES', txt('Hace un momento', 'Just now'))}
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
                <strong>{actorName}</strong> {txt('te ha compartido una capsula', 'shared a capsule with you')}
              </p>
            </div>

            <div className="nb-sharing-modal__actions">
              <button
                type="button"
                className="nb-sharing-modal__btn nb-sharing-modal__btn--reject"
                onClick={() => handleRejectSharing(sharingModal)}
                disabled={rejectingId === sharingModal._id}
              >
                {txt('Rechazar', 'Reject')}
              </button>
              <button
                type="button"
                className="nb-sharing-modal__btn nb-sharing-modal__btn--accept"
                onClick={() => handleAcceptSharing(sharingModal)}
              >
                {txt('Aceptar', 'Accept')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default NotificationBell
