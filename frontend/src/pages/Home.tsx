import { Link } from 'react-router-dom'
import HeaderSimple from '../components/HeaderSimple'

function Home() {
  return (
    <div className="home-public-page">
      <HeaderSimple />
      <section className="onboarding-screen onboarding-screen--welcome" aria-label="Pantalla de bienvenida">
        <div className="onboarding-screen__welcome-copy">
          <h1>BIENVENIDO A MOMENTUM</h1>
          <p>
            Captura tus recuerdos en cápsulas,
            <br />
            compártelas con tus amigos o
            <br />
            quédatelas para ti solo.
          </p>
          <p>
            Puedes acceder a ellas cuando quieras, también puedes guardarlas
            <br />
            y traerlas en el futuro.
          </p>
        </div>

        <div className="home-public-bottom">
          <img className="onboarding-screen__wordmark" src="/img/logo_looma.svg" alt="looma" />
          <Link className="onboarding-screen__cta" to="/inicio-registro">
            Inicia sesión para empezar la experiencia
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home