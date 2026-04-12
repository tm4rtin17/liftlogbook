import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { api, getToken, setToken, clearToken, setUnauthorizedHandler } from '../api/client'

interface User {
  id: string
  email: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  // Verify stored token on mount
  useEffect(() => {
    setUnauthorizedHandler(logout)
    if (!getToken()) {
      setLoading(false)
      return
    }
    api.get<{ user: User }>('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    })
    setToken(token)
    setUser(user)
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/register', {
      email,
      password,
    })
    setToken(token)
    setUser(user)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
