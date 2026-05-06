import { Link, useNavigate } from 'react-router-dom'
import HeaderConAtras from '../components/HeaderConAtras'

function SettingsPage() {
  const navigate = useNavigate()

  return (
    <>
      <HeaderConAtras onAtras={() => navigate(-1)} />

      <section className="settings-mobile settings-mobile--menu" aria-label="Pantalla de ajustes">
        <h1 className="settings-title">AJUSTES</h1>

        <div className="settings-menu settings-menu--lowered">
          <Link to="/ajustes/cuenta" className="settings-menu__item">Cuenta</Link>
          <Link to="/ajustes/preferencias" className="settings-menu__item">Preferencias</Link>
          <Link to="/ajustes/sesion" className="settings-menu__item">Sesion y seguridad</Link>
        </div>
      </section>
    </>
  )
}

export default SettingsPage
