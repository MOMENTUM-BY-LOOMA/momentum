import { useNavigate } from 'react-router-dom'
import IconoTema from '../components/IconoTema'
import { logoMAsset } from '../img'

function Dashboard() {
  const navigate = useNavigate()

  return (
    <>
      <header className="mobile-header" aria-label="Encabezado">
        <span className="mobile-header__side mobile-header__side--left" aria-hidden="true">
          <IconoTema />
        </span>
        <button type="button" className="mobile-header__logo-button" aria-label="Ir a inicio">
          <img className="mobile-header__logo" src={logoMAsset} alt="Momentum" />
        </button>
        <button
          type="button"
          className="mobile-header__settings"
          aria-label="Abrir ajustes"
          onClick={() => navigate('/ajustes')}
        >
          ⚙
        </button>
      </header>

      <section className="dashboard-mobile" aria-label="Pantalla principal de Momentum">

      <section className="dashboard-mobile__profile-panel" aria-labelledby="mi-perfil-title">
        <div className="dashboard-mobile__profile-head">
          <h1 id="mi-perfil-title">MI PERFIL</h1>
        </div>

        <div className="dashboard-mobile__profile-main">
          <div className="dashboard-mobile__capsule-previews" aria-label="Cápsulas destacadas">
            <div className="dashboard-mobile__preview">
              <span>imagen</span>
            </div>
            <div className="dashboard-mobile__preview dashboard-mobile__preview--active">
              <span>imagen</span>
            </div>
          </div>

          <button type="button" className="dashboard-mobile__go-btn" onClick={() => navigate('/perfil')}>
            Ir
          </button>
        </div>
      </section>

      <section className="dashboard-mobile__search-section" aria-label="Búsqueda de cápsulas">
        <div className="dashboard-mobile__search-row">
          <label className="dashboard-mobile__select-wrap" htmlFor="category-select">
            <select id="category-select" defaultValue="">
              <option value="" disabled>
                Elige categoría
              </option>
              <option value="conocimiento">Conocimiento</option>
              <option value="recuerdos">Recuerdos</option>
              <option value="proyectos">Proyectos</option>
            </select>
          </label>

          <button type="button" className="dashboard-mobile__search-btn" onClick={() => navigate('/buscar')}>
            Buscar
          </button>
        </div>
      </section>

      <section className="dashboard-mobile__capsules-section" aria-labelledby="compartir-capsulas-title">
        <h2 id="compartir-capsulas-title">Comparte tus cápsulas</h2>

        <article className="dashboard-mobile__share-card">
          <div className="dashboard-mobile__avatar dashboard-mobile__avatar--placeholder" aria-hidden="true">
            <span>img</span>
          </div>

          <div className="dashboard-mobile__share-content">
            <strong className="dashboard-mobile__share-user">@angeel21</strong>

            <div className="dashboard-mobile__share-row">
              <div className="dashboard-mobile__capsule-items dashboard-mobile__capsule-items--stacked" aria-hidden="true">
                <div className="dashboard-mobile__mini-item">img</div>
                <div className="dashboard-mobile__mini-item">img</div>
                <div className="dashboard-mobile__mini-item">img</div>
              </div>

              <div className="dashboard-mobile__share-art" aria-hidden="true">
                <span>img</span>
              </div>
            </div>

            <a className="dashboard-mobile__see-more" href="/amigos">
              Ver más &gt;
            </a>
          </div>
        </article>
      </section>
    </section>
    </>
  )
}

export default Dashboard