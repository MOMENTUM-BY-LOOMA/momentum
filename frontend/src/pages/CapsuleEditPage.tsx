import { useParams } from 'react-router-dom'

function CapsuleEditPage() {
  const { capsuleId } = useParams()

  return (
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
  )
}

export default CapsuleEditPage
