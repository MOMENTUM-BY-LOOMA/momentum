import { Link } from 'react-router-dom'

function Home() {
  return (
    <section className="onboarding-screen onboarding-screen--welcome" aria-label="Pantalla de bienvenida">
      <img className="onboarding-screen__mark" src="/img/logo_m.png" alt="M" />

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

      <img className="onboarding-screen__wordmark" src="/img/logo_looma.png" alt="looma" />

      <Link className="onboarding-screen__cta" to="/inicio-registro">
        Inicia sesión para empezar la experiencia
      </Link>
    </section>
  )
}

export default Home