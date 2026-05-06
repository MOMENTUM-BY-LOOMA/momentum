import { Link, useNavigate } from 'react-router-dom'
import { avatarMAsset } from '../img'

type HeaderConAtrasProps = {
  onAtras?: () => void
}

function HeaderConAtras({ onAtras }: HeaderConAtrasProps) {
  const navigate = useNavigate()
  const handleAtras = onAtras ?? (() => navigate(-1))

  return (
    <header className="header-con-atras" aria-label="Encabezado interior">
      <button type="button" className="header-con-atras__back" onClick={handleAtras} aria-label="Volver atrás">
        <span className="header-con-atras__back-arrow" aria-hidden="true">←</span>
        <span className="header-con-atras__back-text">ATRÁS</span>
      </button>

      <Link to="/" className="header-con-atras__avatar-button" aria-label="Ir a Home">
        <img className="header-con-atras__avatar" src={avatarMAsset} alt="Momentum" />
      </Link>
    </header>
  )
}

export default HeaderConAtras
