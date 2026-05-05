import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.tsx'
import AppBottomNav from './components/AppBottomNav.tsx'
import CapsuleView from './pages/CapsuleView.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Home from './pages/Home.tsx'
import InitialLoading from './pages/InitialLoading.tsx'
import Login from './pages/Login.tsx'
import Register from './pages/Register.tsx'
import StartAccess from './pages/StartAccess.tsx'
import UploadCapsule from './pages/UploadCapsule.tsx'
import SearchPage from './pages/SearchPage.tsx'
import CapsulesPage from './pages/CapsulesPage.tsx'
import CreateCapsuleFlowPage from './pages/CreateCapsuleFlowPage.tsx'
import CapsuleEditPage from './pages/CapsuleEditPage.tsx'
import FriendsPage from './pages/FriendsPage.tsx'
import FriendProfilePage from './pages/FriendProfilePage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import './styles/app.css'

function AppLayout() {
  const location = useLocation()
  const hideNavbar = ['/', '/inicio-publico', '/inicio-registro', '/login', '/registro', '/dashboard', '/buscar', '/amigos', '/perfil'].includes(location.pathname)

  return (
    <div className="app-shell">
      {!hideNavbar && <Navbar />}
      <main className={`app-content ${hideNavbar ? 'app-content--auth' : ''}`}>
        <Routes>
          <Route path="/" element={<InitialLoading />} />
          <Route path="/inicio-publico" element={<Home />} />
          <Route path="/inicio-registro" element={<StartAccess />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/capsula" element={<CapsuleView />} />
          <Route path="/subir" element={<UploadCapsule />} />
          <Route path="/buscar" element={<SearchPage />} />
          <Route path="/capsulas" element={<CapsulesPage />} />
          <Route path="/capsulas/crear" element={<CreateCapsuleFlowPage />} />
          <Route path="/capsulas/crear/editor" element={<CapsuleEditPage />} />
          <Route path="/capsulas/:capsuleId" element={<CapsuleView />} />
          <Route path="/amigos" element={<FriendsPage />} />
          <Route path="/amigos/:friendId" element={<FriendProfilePage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/ajustes" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
      <AppBottomNav />
    </BrowserRouter>
  )
}

export default App
