import { Link } from 'react-router-dom'

function SettingsPage() {
  return (
    <section className="page-layout page-layout--module">
      <article className="page-card">
        <h1>Ajustes</h1>
        <p>Cuenta, preferencias y sesion.</p>
      </article>

      <article className="page-card">
        <h2>Cuenta</h2>
        <p>Editar datos personales, email, contrasena y foto.</p>
        <Link to="/ajustes/cuenta" className="button-secondary">Abrir cuenta</Link>
      </article>

      <article className="page-card">
        <h2>Preferencias</h2>
        <p>Intereses, contenido sugerido y filtros predefinidos.</p>
        <Link to="/ajustes/preferencias" className="button-secondary">Abrir preferencias</Link>
      </article>

      <article className="page-card">
        <h2>Sesion y seguridad</h2>
        <p>Cerrar sesion y eliminar cuenta con confirmaciones.</p>
        <Link to="/ajustes/sesion" className="button-secondary">Abrir seguridad</Link>
      </article>
    </section>
  )
}

export default SettingsPage
