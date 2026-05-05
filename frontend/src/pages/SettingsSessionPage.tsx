import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSession, logoutUser } from '../services/api.ts'

function SettingsSessionPage() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    setMessage('')
    setError('')

    try {
      await logoutUser()
      clearSession()
      setMessage('Sesion cerrada correctamente')
      navigate('/login')
    } catch (logoutError) {
      const detail = logoutError instanceof Error ? logoutError.message : 'No se pudo cerrar sesion'
      setError(detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page-layout page-layout--module">
      <article className="page-card">
        <h1>Sesion y eliminar cuenta</h1>
        <p>Confirmaciones de seguridad para acciones destructivas.</p>
        <div className="button-row">
          <button type="button" className="button-primary" disabled={loading} onClick={handleLogout}>
            {loading ? 'Cerrando...' : 'Cerrar sesion'}
          </button>
          <button type="button" className="button-secondary" disabled>
            Eliminar cuenta
          </button>
        </div>
        {message ? <p className="page-status page-status--success">{message}</p> : null}
        {error ? <p className="page-status page-status--error">{error}</p> : null}
      </article>
    </section>
  )
}

export default SettingsSessionPage
