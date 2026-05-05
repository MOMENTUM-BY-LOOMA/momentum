import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type Tab = {
  id: string
  to: string
  aria: string
}

const TABS: Tab[] = [
  { id: 'home', to: '/inicio-publico', aria: 'Ir a Home' },
  { id: 'search', to: '/buscar', aria: 'Buscar' },
  { id: 'create', to: '/capsulas/crear', aria: 'Crear capsula' },
  { id: 'friends', to: '/amigos', aria: 'Ir a Amigos' },
  { id: 'profile', to: '/perfil', aria: 'Ir a Mi Perfil' },
]

const ACTIVE_KEY = 'app.bottomNav.active'

function AppBottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Ensure a default active tab
    const current = sessionStorage.getItem(ACTIVE_KEY)
    if (!current) sessionStorage.setItem(ACTIVE_KEY, 'home')
  }, [])

  // When user is exactly on a top-level tab route, update active.
  useEffect(() => {
    const pathname = location.pathname
    // Map dashboard -> home so logged-in start maps to Home tab
    let matchedId: string | undefined
    if (pathname === '/dashboard' || pathname === '/inicio-publico') matchedId = 'home'
    else {
      const match = TABS.find((t) => t.to === pathname)
      if (match) matchedId = match.id
    }

    if (matchedId && matchedId !== 'create') {
      sessionStorage.setItem(ACTIVE_KEY, matchedId)
    }
  }, [location.pathname])

  const active = sessionStorage.getItem(ACTIVE_KEY) || 'home'

  // Hide rules: splash '/', registro, login, onboarding intro '/inicio-registro',
  // and any create flow steps that start with '/capsulas/crear'
  const hidePaths = ['/', '/registro', '/login', '/inicio-registro']
  const shouldHide = hidePaths.includes(location.pathname) || location.pathname.startsWith('/capsulas/crear')

  if (shouldHide) return null

  function onTabClick(tab: Tab) {
    if (tab.id === 'create') {
      // create button: never becomes active
      navigate(tab.to)
      return
    }

    // Home behaves differently if user is authenticated
    if (tab.id === 'home') {
      const isAuth = Boolean(localStorage.getItem('authToken'))
      const dest = isAuth ? '/dashboard' : '/inicio-publico'
      sessionStorage.setItem(ACTIVE_KEY, 'home')
      navigate(dest)
      return
    }

    sessionStorage.setItem(ACTIVE_KEY, tab.id)
    navigate(tab.to)
  }

  return (
    <nav className="app-bottom-nav" role="navigation" aria-label="Navegación inferior">
      {TABS.map((tab) => {
        const isCreate = tab.id === 'create'
        const isActive = !isCreate && active === tab.id

        return (
          <button
            key={tab.id}
            aria-label={tab.aria}
            className={`app-bottom-nav__item ${isActive ? 'is-active' : ''} ${isCreate ? 'is-create' : ''}`}
            onClick={() => onTabClick(tab)}
            type="button"
          >
            {tab.id === 'create' ? (
              <span className="app-bottom-nav__create">+</span>
            ) : tab.id === 'home' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 11.5L12 4l9 7.5" />
                <path d="M9 21V12h6v9" />
              </svg>
            ) : tab.id === 'search' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="6" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            ) : tab.id === 'friends' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M7 21v-2a4 4 0 0 1 3-3.87" />
                <path d="M12 7a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            )}
          </button>
        )
      })}
    </nav>
  )
}

export default AppBottomNav

