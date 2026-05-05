import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/inicio', label: 'Inicio' },
  { to: '/buscar', label: 'Buscar' },
  { to: '/capsulas/crear', label: 'Nueva Capsula' },
  { to: '/amigos', label: 'Amigos' },
  { to: '/perfil', label: 'Mi Perfil' },
]

function AppBottomNav() {
  return (
    <nav className="app-bottom-nav" aria-label="Navegacion principal">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `app-bottom-nav__item ${isActive ? 'is-active' : ''}`}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default AppBottomNav
