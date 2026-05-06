import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { logoMAsset } from '../img'

function CreateCapsuleFlowPage() {
  const navigate = useNavigate()
  return (
    <Fragment>
      <header className="mobile-header" aria-label="Crear capsula">
        <button type="button" className="mobile-header__left" onClick={() => navigate(-1)} aria-label="Volver atras">←</button>
        <Link to="/inicio" className="logo-button" aria-label="Ir a inicio">
          <img src={logoMAsset} alt="Momentum" />
        </Link>
        <span className="mobile-header__right" aria-hidden="true" />
      </header>
      <section className="page-layout page-layout--module">
      <article className="page-card">
        <h1>Crear capsula</h1>
        <p>Flujo en 3 pasos para construir una capsula completa.</p>
      </article>

      <article className="page-card">
        <h2>Paso 1: Informacion basica</h2>
        <p>Titulo, descripcion, categoria y fecha de desbloqueo.</p>
      </article>

      <article className="page-card">
        <h2>Paso 2: Contenido</h2>
        <p>Fotos, videos, audio, texto y archivos de recuerdos.</p>
      </article>

      <article className="page-card">
        <h2>Paso 3: Vista previa y confirmacion</h2>
        <p>Verificacion final antes de publicar la capsula.</p>
        <div className="button-row">
          <Link to="/capsulas/crear/editor" className="button-primary">Ir al creador</Link>
          <Link to="/capsulas" className="button-secondary">Volver a capsulas</Link>
        </div>
      </article>
      </section>
    </Fragment>
  )
}

export default CreateCapsuleFlowPage
