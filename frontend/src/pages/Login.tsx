import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../services/api.ts'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError('Completa correo y contraseña')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const result = await loginUser(email.trim(), password)
      localStorage.setItem('authToken', result.token)
      if (result.refreshToken) {
        localStorage.setItem('refreshToken', result.refreshToken)
      }
      localStorage.setItem('authUser', JSON.stringify(result.user))
      navigate('/dashboard')
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Error de autenticación'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-screen" aria-label="Pantalla de inicio de sesión">
      <div className="auth-screen__brand" aria-hidden="true">M</div>
      <article className="auth-screen__card">

        <form className="auth-screen__form" onSubmit={handleSubmit}>
          <label className="field auth-field" htmlFor="login-email">
            <span>Correo electrónico</span>
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="ejemplo@gmail.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <p className="auth-screen__error">{error}</p> : null}

          <button type="button" className="auth-screen__forgot">He olvidado mi contraseña</button>

          <div className="auth-screen__actions">
            <Link to="/" className="auth-screen__back" aria-label="Volver a inicio">←</Link>
            <button type="submit" className="auth-screen__submit" disabled={isSubmitting}>
              {isSubmitting ? 'Accediendo...' : 'Acceder'}
            </button>
          </div>
        </form>
      </article>
    </section>
  )
}

export default Login