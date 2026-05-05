import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { type ReactNode } from 'react'
import PrivateLayout from './components/PrivateLayout.tsx'
import CapsuleEditPage from './pages/CapsuleEditPage.tsx'
import CapsulesPage from './pages/CapsulesPage.tsx'
import CapsuleView from './pages/CapsuleView.tsx'
import CreateCapsuleFlowPage from './pages/CreateCapsuleFlowPage.tsx'
import Dashboard from './pages/Dashboard.tsx'
import FriendProfilePage from './pages/FriendProfilePage.tsx'
import FriendsPage from './pages/FriendsPage.tsx'
import InitialLoading from './pages/InitialLoading.tsx'
import Login from './pages/Login.tsx'
import Register from './pages/Register.tsx'
import RegisterConfirmation from './pages/RegisterConfirmation.tsx'
import RegisterDetails from './pages/RegisterDetails.tsx'
import SearchPage from './pages/SearchPage.tsx'
import SettingsAccountPage from './pages/SettingsAccountPage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import SettingsPreferencesPage from './pages/SettingsPreferencesPage.tsx'
import SettingsSessionPage from './pages/SettingsSessionPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import UploadCapsule from './pages/UploadCapsule.tsx'
import './styles/app.css'

function RequireAuth({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('authToken')
  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppLayout() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<InitialLoading />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/registro/datos" element={<RegisterDetails />} />
        <Route path="/registro/confirmacion" element={<RegisterConfirmation />} />

        <Route
          element={(
            <RequireAuth>
              <PrivateLayout />
            </RequireAuth>
          )}
        >
          <Route path="/inicio" element={<Dashboard />} />

          <Route path="/capsulas" element={<CapsulesPage />} />
          <Route path="/capsulas/crear" element={<CreateCapsuleFlowPage />} />
          <Route path="/capsulas/crear/editor" element={<UploadCapsule />} />
          <Route path="/capsulas/:capsuleId" element={<CapsuleView />} />
          <Route path="/capsulas/:capsuleId/editar" element={<CapsuleEditPage />} />

          <Route path="/buscar" element={<SearchPage />} />

          <Route path="/amigos" element={<FriendsPage />} />
          <Route path="/amigos/:friendId" element={<FriendProfilePage />} />

          <Route path="/perfil" element={<ProfilePage />} />

          <Route path="/ajustes" element={<SettingsPage />} />
          <Route path="/ajustes/cuenta" element={<SettingsAccountPage />} />
          <Route path="/ajustes/preferencias" element={<SettingsPreferencesPage />} />
          <Route path="/ajustes/sesion" element={<SettingsSessionPage />} />

          <Route path="/capsula" element={<CapsuleView />} />
          <Route path="/subir" element={<UploadCapsule />} />
          <Route path="/dashboard" element={<Navigate to="/inicio" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
