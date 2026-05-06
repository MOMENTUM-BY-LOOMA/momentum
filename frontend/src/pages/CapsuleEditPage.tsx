import { Fragment } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { logoMAsset } from '../img'

function CapsuleEditPage() {
  const navigate = useNavigate()
  const { capsuleId } = useParams()

  return (
    <Fragment>
      <header className="mobile-header" aria-label="Editar capsula">
        <button type="button" className="mobile-header__left" onClick={() => navigate(-1)} aria-label="Volver atras">←</button>
        <Link to="/inicio" className="logo-button" aria-label="Ir a inicio">
          <img src={logoMAsset} alt="Momentum" />
        </Link>
        <span className="mobile-header__right" aria-hidden="true" />
      </header>
      <section className="page-layout page-layout--module">
      <article className="page-card">
        <h1>Editar capsula</h1>
        <p>{capsuleId ? `Capsula: ${capsuleId}` : 'Selecciona una capsula para editar.'}</p>
      </article>

      <article className="page-card">
        <h2>Edicion disponible</h2>
        <ul className="module-list">
          <li>Editar titulo y descripcion</li>
          <li>Cambiar portada</li>
          <li>Anadir, eliminar y reordenar contenido</li>
          <li>Guardar cambios</li>
        </ul>
      </article>
      </section>
    </Fragment>
  )
}

export default CapsuleEditPage
