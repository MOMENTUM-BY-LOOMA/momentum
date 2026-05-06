import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { avatarMAsset } from '../img'

type HeaderConTituloProps = {
  titulo: string
  iconoDerecha: ReactNode
  onIconoDerecha: () => void
}

function HeaderConTitulo({ titulo, iconoDerecha, onIconoDerecha }: HeaderConTituloProps) {
  return (
    <header className="header-con-titulo" aria-label={titulo}>
      <h1 className="header-con-titulo__title">{titulo.toUpperCase()}</h1>

      <Link to="/" className="header-con-titulo__avatar-button" aria-label="Ir a Home">
        <img className="header-con-titulo__avatar" src={avatarMAsset} alt="Momentum" />
      </Link>

      <button type="button" className="header-con-titulo__icon-button" onClick={onIconoDerecha} aria-label={`${titulo} acciones`}>
        {iconoDerecha}
      </button>
    </header>
  )
}

export default HeaderConTitulo
