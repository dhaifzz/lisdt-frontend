// --- API Base ----------------------------------------------------------------

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')

const BASE_URL = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://lisdt.onrender.com/api')

// --- Token Helpers -----------------------------------------------------------

export const getToken = (): string | null => {
  try { return localStorage.getItem('lisdt_token') } catch { return null }
}

export const setToken = (token: string) => {
  try { localStorage.setItem('lisdt_token', token) } catch {}
}

export const removeToken = () => {
  try { localStorage.removeItem('lisdt_token') } catch {}
}

// --- Image Helpers -----------------------------------------------------------

export const isValidCoverUrl = (url?: string | null): boolean => {
  if (!url || !url.trim()) return false
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
      return false
    }
  }
  return true
}

// --- Core Fetch Wrapper ------------------------------------------------------

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || `API error ${res.status}`)
  }

  return data as T
}

// --- Auth --------------------------------------------------------------------

export interface AuthUser {
  id: number
  username: string
  email: string
  avatar: string | null
  createdAt?: string
  _count?: {
    categories: number
    mediaItems: number
  }
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export const authApi = {
  register: (body: { username: string; email: string; password: string }) =>
    apiFetch<{ message: string; pendingEmail?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  verifyEmail: (token: string) =>
    apiFetch<AuthResponse>(`/auth/verify-email?token=${token}`),

  resendVerification: (body: { email: string }) =>
    apiFetch<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { login: string; password: string }) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  forgotPassword: (body: { email: string }) =>
    apiFetch<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  resetPassword: (body: { token: string; password: string }) =>
    apiFetch<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: () =>
    apiFetch<{ user: AuthUser }>('/auth/me'),

  uploadAvatar: (avatar: string) =>
    apiFetch<{ user: AuthUser }>('/auth/avatar', {
      method: 'PUT',
      body: JSON.stringify({ avatar }),
    }),

  updateProfile: (body: { username?: string }) =>
    apiFetch<{ message: string; user: AuthUser; token?: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    apiFetch<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteAccount: (body: { password: string }) =>
    apiFetch<{ message: string }>('/auth/account', {
      method: 'DELETE',
      body: JSON.stringify(body),
    }),
}

// --- Categories --------------------------------------------------------------

export interface ApiCategory {
  id: string
  slug: string
  label: string
  tag: string
  headline: string
  subhead: string
  description: string
  type: 'series' | 'movies'
  unitLabel?: string | null
  userId: number
  createdAt: string
  updatedAt: string
}

export const categoryApi = {
  list: () =>
    apiFetch<{ categories: ApiCategory[] }>('/categories'),

  create: (body: Omit<ApiCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    apiFetch<{ category: ApiCategory }>('/categories', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Partial<Omit<ApiCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) =>
    apiFetch<{ category: ApiCategory }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    apiFetch<{ message: string; defaultCategory?: ApiCategory | null; remainingCount?: number }>(`/categories/${id}`, { method: 'DELETE' }),
}

// --- Media Items -------------------------------------------------------------

export interface ApiMediaItem {
  id: number
  category: string
  title: string
  year: number
  rating: number | null
  status: 'watching' | 'watched' | 'stalled' | 'dropped'
  studio?: string | null
  cover: string
  seasonsFinished: number
  parts?: number | null
  moviesCount?: number | null
  notes?: string | null
  topRank?: number | null
  userId: number
  createdAt: string
  updatedAt: string
}

export type MediaItemInput = Omit<ApiMediaItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>

export const mediaApi = {
  list: (params?: {
    category?: string
    status?: string
    search?: string
    sort?: string
    order?: string
  }) => {
    const qs = params
      ? '?' + new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
          ) as Record<string, string>
        ).toString()
      : ''
    return apiFetch<{ items: ApiMediaItem[] }>(`/media${qs}`)
  },

  get: (id: number) =>
    apiFetch<{ item: ApiMediaItem }>(`/media/${id}`),

  create: (body: MediaItemInput) =>
    apiFetch<{ item: ApiMediaItem }>('/media', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: number, body: Partial<MediaItemInput>) =>
    apiFetch<{ item: ApiMediaItem }>(`/media/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  stepper: (id: number, delta: number, field: 'seasonsFinished' | 'parts' = 'seasonsFinished') =>
    apiFetch<{ item: ApiMediaItem }>(`/media/${id}/stepper`, {
      method: 'PATCH',
      body: JSON.stringify({ delta, field }),
    }),

  delete: (id: number) =>
    apiFetch<{ message: string }>(`/media/${id}`, { method: 'DELETE' }),
}

// --- Upload ------------------------------------------------------------------

export const uploadApi = {
  uploadCover: async (file: File, previousUrl?: string): Promise<{ url: string; message: string }> => {
    const token = getToken()
    const formData = new FormData()
    formData.append('image', file)
    if (previousUrl && !previousUrl.startsWith('data:')) {
      formData.append('previousUrl', previousUrl)
    }

    const res = await fetch(`${BASE_URL}/upload/cover`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to upload image')
    }

    return data
  },

  uploadAvatar: async (file: File): Promise<{ url: string; user: AuthUser; message: string }> => {
    const token = getToken()
    const formData = new FormData()
    formData.append('image', file)

    const res = await fetch(`${BASE_URL}/upload/avatar`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to upload avatar')
    }

    return data
  },

  deleteCover: async (url: string): Promise<boolean> => {
    if (!url || url.startsWith('data:')) return false
    try {
      const res = await apiFetch<{ success: boolean; deleted: boolean }>('/upload/delete', {
        method: 'POST',
        body: JSON.stringify({ url }),
      })
      return res.deleted
    } catch {
      return false
    }
  },
}

