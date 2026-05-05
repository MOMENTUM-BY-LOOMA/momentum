import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../services/api'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'choice' | 'login'>('choice')

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

  if (mode === 'choice') {
    return (
      <section className="onboarding-screen onboarding-screen--entry" aria-label="Pantalla de acceso">
        <img className="onboarding-screen__mark" src="/img/logo_m.png" alt="M" />

        <div className="onboarding-screen__entry-actions">
          <button
            type="button"
            className="onboarding-screen__button onboarding-screen__button--light"
            onClick={() => setMode('login')}
          >
            INICIA SESIÓN
          </button>
          <button
            type="button"
            className="onboarding-screen__button onboarding-screen__button--dark"
            onClick={() => navigate('/registro')}
          >
            REGÍSTRATE
          </button>
        </div>

        <div className="onboarding-screen__footer">
          <p>Captura tus recuerdos</p>
          <img className="onboarding-screen__wordmark" src="/img/logo_looma.png" alt="looma" />
        </div>
      </section>
    )
  }

  return (
    <section className="onboarding-screen onboarding-screen--entry" aria-label="Pantalla de login">
      <img className="onboarding-screen__mark" src="/img/logo_m.png" alt="M" />

      <form onSubmit={handleLogin} className="onboarding-screen__form">
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Inicia Sesión</h1>

        {error && (
          <div style={{ color: '#d32f2f', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ marginBottom: '1rem', padding: '0.75rem', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ marginBottom: '1.5rem', padding: '0.75rem', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
        />

        <button
          type="submit"
          disabled={loading}
          className="onboarding-screen__button onboarding-screen__button--light"
          style={{ width: '100%' }}
        >
          {loading ? 'Iniciando...' : 'Iniciar Sesión'}
        </button>

        <button
          type="button"
          onClick={() => setMode('choice')}
          style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}
        >
          Volver
        </button>
      </form>

      <div className="onboarding-screen__footer">
        <p>Captura tus recuerdos</p>
        <img className="onboarding-screen__wordmark" src="/img/logo_looma.png" alt="looma" />
      </div>
    </section>
  )
}

export default Login