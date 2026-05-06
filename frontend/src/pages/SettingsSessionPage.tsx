import { Fragment, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import HeaderConAtras from '../components/HeaderConAtras'
import ModalCerrarSesion from '../components/ModalCerrarSesion'
import { clearSession, logoutUser } from '../services/api.ts'

function SettingsSessionPage() {
  const navigate = useNavigate()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    setMessage('')
    setError('')

    try {
      await logoutUser()
      clearSession()
      navigate('/login')
    } catch (logoutError) {
      const detail = logoutError instanceof Error ? logoutError.message : 'No se pudo cerrar sesion'
      setError(detail)
    } finally {
      setLoading(false)
      setShowLogoutModal(false)
    }
  }

  return (
    <Fragment>
      <HeaderConAtras onAtras={() => navigate(-1)} />
      <section className="settings-mobile settings-mobile--session" aria-label="Sesion y seguridad">

      <h1 className="settings-title">SESION Y SEGURIDAD</h1>

      <div className="settings-form settings-form--spacious settings-form--session-lowered">
        <button type="button" className="settings-btn settings-btn--danger settings-btn--full" onClick={() => setShowLogoutModal(true)}>
          CERRAR SESION
        </button>

        <Link to="/ajustes/cuenta" className="settings-btn settings-btn--ghost settings-btn--full settings-link-btn">
          GESTIONAR ELIMINACION DE CUENTA
        </Link>

        {message ? <p className="settings-success">{message}</p> : null}
        {error ? <p className="settings-error">{error}</p> : null}
      </div>

      <ModalCerrarSesion
        show={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        loading={loading}
      />
      </section>
    </Fragment>
  )
}

export default SettingsSessionPage
