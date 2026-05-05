import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../services/api'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await loginUser(email, password)
      localStorage.setItem('authToken', response.token)
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken)
      }
      localStorage.setItem('authUser', JSON.stringify(response.user))
      navigate('/inicio')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-screen" aria-label="Pantalla de inicio de sesión">
      <img className="auth-screen__brand auth-screen__brand-image" src="/img/logo_m.png" alt="M" />

      <article className="auth-screen__card">
        <form className="auth-screen__form" onSubmit={handleLogin}>
          <label className="field auth-field" htmlFor="login-email">
            <span>Correo electrónico</span>
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="ejemplo@gmail.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field auth-field" htmlFor="login-password">
            <span>Contraseña</span>
            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="**********"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="button" className="auth-screen__forgot">
            He olvidado mi contraseña
          </button>

          {error ? <p className="auth-screen__error">{error}</p> : null}

          <div className="auth-screen__actions">
            <Link to="/inicio-registro" className="auth-screen__back" aria-label="Volver a inicio">
              ←
            </Link>

            <button type="submit" className="auth-screen__submit" disabled={loading}>
              {loading ? 'Accediendo...' : 'Acceder'}
            </button>
          </div>
        </form>

        <div className="auth-screen__footer">
          <p>Captura tus recuerdos</p>
          <img className="auth-screen__looma-logo" src="/img/logo_looma.png" alt="looma" />
        </div>
      </article>
    </section>
  )
}

export default Login