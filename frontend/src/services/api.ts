const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'https://momentum-hc2x.onrender.com'

export type ApiUser = {
  _id: string
  name: string
  email: string
  avatar?: string
  profilePhoto?: string
}

export type ApiMediaItem = {
  _id?: string
  type?: 'image' | 'video' | 'audio' | 'file'
  url: string
  title?: string
  description?: string
  thumbnailUrl?: string
  comments?: Array<{
    _id?: string
    author: ApiUser | string
    text: string
    createdAt?: string
  }>
}

export type ApiCapsule = {
  _id: string
  title: string
  description?: string
  category?: string
  design?: {
    key?: string
    label?: string
  }
  timeCapsule?: {
    enabled?: boolean
    unlockAt?: string | null
  }
  owner?: ApiUser | string
  sharedWith?: Array<ApiUser | string>
  collaborators?: Array<{ user: ApiUser | string; role: 'admin' | 'edit' | 'view' }>
  mediaItems?: ApiMediaItem[]
  previewImage?: string
  mediaFile?: string
  date?: string
  createdAt?: string
  updatedAt?: string
}

export type ApiNotification = {
  _id: string
  type: 'friend_request' | 'friend_accepted' | 'comment_added' | 'collaborator_added'
  read: boolean
  createdAt?: string
  actor?: ApiUser | string
  recipient?: ApiUser | string
  data?: {
    relationId?: string
    capsuleId?: string
    commentId?: string
    role?: string
    message?: string
  }
}

export type LoginResponse = {
  token: string
  refreshToken?: string
  user: ApiUser
}

export type RegisterResponse = {
  _id: string
  name: string
  email: string
  avatar?: string
}

export type UploadResponse = {
  fileUrl: string
  fileName: string
  originalName: string
  mimeType: string
  size: number
  type: 'image' | 'video' | 'audio' | 'file'
  thumbnailUrl?: string
}

function getStoredToken() {
  return localStorage.getItem('authToken')
}

function getStoredRefreshToken() {
  return localStorage.getItem('refreshToken')
}

function buildHeaders(token?: string, isJsonBody = true) {
  const headers = new Headers()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (isJsonBody) {
    headers.set('Content-Type', 'application/json')
  }

  return headers
}

async function requestJson<T>(path: string, init: RequestInit = {}, authRequired = true): Promise<T> {
  const token = authRequired ? getStoredToken() : null
  const isFormData = init.body instanceof FormData
  const headers = buildHeaders(token ?? undefined, !isFormData)

  if (init.headers) {
    new Headers(init.headers).forEach((value, key) => {
      headers.set(key, value)
    })
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  const data = await response.json().catch(() => ({})) as Record<string, unknown>

  if (!response.ok) {
    const message = typeof data.message === 'string' ? data.message : 'Request failed'
    throw new Error(message)
  }

  return data as T
}

export function clearSession() {
  localStorage.removeItem('authToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('authUser')
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const data = await requestJson<LoginResponse>('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, false)

  return data
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  avatar?: string,
): Promise<RegisterResponse> {
  return requestJson<RegisterResponse>('/api/users/register', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      password,
      ...(avatar ? { avatar, profilePhoto: avatar } : {}),
    }),
  }, false)
}

export async function fetchCurrentUser(): Promise<ApiUser> {
  return requestJson<ApiUser>('/api/users/me')
}

export async function fetchCapsules(): Promise<ApiCapsule[]> {
  return requestJson<ApiCapsule[]>('/api/capsules')
}

export async function fetchCapsuleById(capsuleId: string): Promise<ApiCapsule> {
  return requestJson<ApiCapsule>(`/api/capsules/${capsuleId}`)
}

export async function createCapsule(payload: {
  title: string
  description?: string
  category?: string
  design?: {
    key?: string
    label?: string
  }
  timeCapsule?: {
    enabled?: boolean
    unlockAt?: string | null
  }
  mediaItems?: ApiMediaItem[]
  collaborators?: Array<{ userId?: string; email?: string; role?: 'admin' | 'edit' | 'view' }>
}) {
  return requestJson<ApiCapsule>('/api/capsules', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function uploadMediaFile(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)

  return requestJson<UploadResponse>('/api/uploads/media', {
    method: 'POST',
    body: formData,
  })
}

export async function fetchNotifications(): Promise<ApiNotification[]> {
  return requestJson<ApiNotification[]>('/api/notifications')
}

export async function fetchUnreadNotificationCount(): Promise<{ unreadCount: number }> {
  return requestJson<{ unreadCount: number }>('/api/notifications/unread/count')
}

export async function markNotificationRead(notificationId: string): Promise<ApiNotification> {
  return requestJson<ApiNotification>(`/api/notifications/${notificationId}/read`, {
    method: 'PUT',
  })
}

export async function markAllNotificationsRead(): Promise<{ message: string }> {
  return requestJson<{ message: string }>('/api/notifications/read/all', {
    method: 'PUT',
  })
}

export async function logoutUser() {
  const refreshToken = getStoredRefreshToken()

  return requestJson<{ message: string }>('/api/users/logout', {
    method: 'POST',
    body: JSON.stringify(refreshToken ? { refreshToken } : {}),
  })
}

export async function pingServer() {
  const response = await fetch(`${API_BASE_URL}/health`)

  if (!response.ok) {
    throw new Error('No se pudo conectar con el servidor')
  }

  return response.json()
}