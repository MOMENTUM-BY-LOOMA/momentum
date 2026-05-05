import { Link } from 'react-router-dom'

function StartAccess() {
  return (
    <section className="onboarding-screen onboarding-screen--entry" aria-label="Pantalla de acceso">
      <img className="onboarding-screen__mark" src="/img/logo_m.png" alt="M" />

      <div className="onboarding-screen__entry-actions">
        <Link className="onboarding-screen__button onboarding-screen__button--light" to="/login">
          INICIA SESIÓN
        </Link>
        <Link className="onboarding-screen__button onboarding-screen__button--dark" to="/registro">
          REGÍSTRATE
        </Link>
      </div>

      <div className="onboarding-screen__footer">
        <p>Captura tus recuerdos</p>
        <img className="onboarding-screen__wordmark" src="/img/logo_looma.png" alt="looma" />
      </div>
    </section>
  )
}

export default StartAccess
