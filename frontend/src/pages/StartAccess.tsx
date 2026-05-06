import { Link } from 'react-router-dom'
import { logoMAsset } from '../img'

function StartAccess() {
  return (
    <section className="onboarding-screen onboarding-screen--entry" aria-label="Pantalla de acceso">
      <header className="mobile-header" aria-label="Encabezado">
        <span className="mobile-header__side" aria-hidden="true" />
        <button type="button" className="mobile-header__logo-button" aria-label="Ir a inicio">
          <img className="mobile-header__logo" src={logoMAsset} alt="Momentum" />
        </button>
        <span className="mobile-header__side" aria-hidden="true" />
      </header>

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
        <img className="onboarding-screen__wordmark" src="/img/logo_looma.svg" alt="looma" />
      </div>
    </section>
  )
}

export default StartAccess
