import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import AppBottomNav from './components/AppBottomNav.tsx'
import CapsuleView from './pages/CapsuleView.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Home from './pages/Home.tsx'
import InitialLoading from './pages/InitialLoading.tsx'
import Login from './pages/Login.tsx'
import Register from './pages/Register.tsx'
import StartAccess from './pages/StartAccess.tsx'
import UploadCapsule from './pages/UploadCapsule.tsx'
import Busqueda from './pages/Busqueda.tsx'
import CapsulesPage from './pages/CapsulesPage.tsx'
import TodasMisCapsulas from './pages/TodasMisCapsulas.tsx'
import CreateCapsuleFlowPage from './pages/CreateCapsuleFlowPage.tsx'
import CapsuleEditPage from './pages/CapsuleEditPage.tsx'
import MisAmigos from './pages/MisAmigos.tsx'
import PerfilAmigo from './pages/PerfilAmigo.tsx'
import MiPerfil from './pages/MiPerfil.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import SettingsAccountPage from './pages/SettingsAccountPage.tsx'
import SettingsPreferencesPage from './pages/SettingsPreferencesPage.tsx'
import SettingsSessionPage from './pages/SettingsSessionPage.tsx'
import { clearSession, fetchCurrentUser } from './services/api.ts'
import { applyStoredUserPreferences } from './services/userPreferences.ts'
import './styles/app.css'
import './styles/busqueda.css'

type GuardStatus = 'checking' | 'authenticated' | 'unauthenticated'

function AuthCheckingScreen() {
  return (
    <section className="page-layout" aria-label="Comprobando autenticacion">
      <p>Cargando...</p>
    </section>
  )
}

function RequireAuth() {
  const location = useLocation()
  const [status, setStatus] = useState<GuardStatus>('checking')

  useEffect(() => {
    let active = true

    const verify = async () => {
      const token = sessionStorage.getItem('authToken')

      if (!token) {
        if (active) setStatus('unauthenticated')
        return
      }

      try {
        await fetchCurrentUser()
        if (active) setStatus('authenticated')
      } catch {
        clearSession()
        if (active) setStatus('unauthenticated')
      }
    }

    verify()

    return () => {
      active = false
    }
  }, [location.pathname])

  if (status === 'checking') return <AuthCheckingScreen />
  if (status === 'unauthenticated') return <Navigate to="/login" replace />

  return <Outlet />
}

function RequireGuest() {
  const location = useLocation()
  const [status, setStatus] = useState<GuardStatus>('checking')

  useEffect(() => {
    let active = true

    const verify = async () => {
      const token = sessionStorage.getItem('authToken')

      if (!token) {
        if (active) setStatus('unauthenticated')
        return
      }

      try {
        await fetchCurrentUser()
        if (active) setStatus('authenticated')
      } catch {
        clearSession()
        if (active) setStatus('unauthenticated')
      }
    }

    verify()

    return () => {
      active = false
    }
  }, [location.pathname])

  if (status === 'checking') return <AuthCheckingScreen />
  if (status === 'authenticated') return <Navigate to="/inicio" replace />

  return <Outlet />
}

function AppLayout() {
  const location = useLocation()
  const hideNavbar = [
    '/',
    '/inicio-publico',
    '/inicio-registro',
    '/login',
    '/registro',
    '/inicio',
    '/buscar',
    '/mis-capsulas',
    '/amigos',
    '/perfil',
    '/ajustes',
    '/ajustes/cuenta',
    '/ajustes/preferencias',
    '/ajustes/sesion',
  ].includes(location.pathname)

  return (
    <div className="app-shell">
      <main className={`app-content ${hideNavbar ? 'app-content--auth' : ''}`}>
        <Routes>
          <Route element={<RequireGuest />}>
            <Route path="/" element={<InitialLoading />} />
            <Route path="/inicio-publico" element={<Home />} />
            <Route path="/inicio-registro" element={<StartAccess />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/inicio" element={<Dashboard />} />
            <Route path="/dashboard" element={<Navigate to="/inicio" replace />} />
            <Route path="/capsula" element={<CapsuleView />} />
            <Route path="/subir" element={<UploadCapsule />} />
            <Route path="/buscar" element={<Busqueda />} />
            <Route path="/capsulas" element={<CapsulesPage />} />
            <Route path="/capsulas/crear" element={<CreateCapsuleFlowPage />} />
            <Route path="/capsulas/crear/editor" element={<CapsuleEditPage />} />
            <Route path="/capsulas/:capsuleId" element={<CapsuleView />} />
            <Route path="/amigos" element={<MisAmigos />} />
            <Route path="/amigos/:amigoId" element={<PerfilAmigo />} />
            <Route path="/amigos/:friendId" element={<PerfilAmigo />} />
            <Route path="/perfil" element={<MiPerfil />} />
            <Route path="/mis-capsulas" element={<TodasMisCapsulas />} />
            <Route path="/ajustes" element={<SettingsPage />} />
            <Route path="/ajustes/cuenta" element={<SettingsAccountPage />} />
            <Route path="/ajustes/preferencias" element={<SettingsPreferencesPage />} />
            <Route path="/ajustes/sesion" element={<SettingsSessionPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  useEffect(() => {
    applyStoredUserPreferences()

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'authUser') {
        applyStoredUserPreferences()
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <BrowserRouter>
      <AppLayout />
      <AppBottomNav />
    </BrowserRouter>
  )
}

export default App
