import { Link } from 'react-router-dom'
import IconoTema from './IconoTema'
import { logoMAsset } from '../img'

function HeaderSimple() {
  return (
    <header className="header-simple" aria-label="Encabezado simple">
      <IconoTema />
      <Link to="/" className="header-simple__logo-button" aria-label="Ir a Home">
        <img className="header-simple__logo" src={logoMAsset} alt="Momentum" />
      </Link>
    </header>
  )
}

export default HeaderSimple
