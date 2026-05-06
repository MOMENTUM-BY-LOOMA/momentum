type ModalCerrarSesionProps = {
  show: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
}

function ModalCerrarSesion({ show, onClose, onConfirm, loading = false }: ModalCerrarSesionProps) {
  if (!show) return null

  return (
    <div className="settings-modal__overlay" role="dialog" aria-modal="true" aria-label="Confirmar cierre de sesion">
      <article className="settings-modal__card">
        <p className="settings-modal__text">ESTAS SEGURO DE QUE QUIERES CERRAR SESION?</p>

        <div className="settings-modal__actions">
          <button type="button" className="settings-btn settings-btn--danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'CERRANDO...' : 'Si, cerrar sesion'}
          </button>
          <button type="button" className="settings-btn settings-btn--ghost" onClick={onClose} disabled={loading}>
            No, mantener sesion abierta
          </button>
        </div>
      </article>
    </div>
  )
}

export default ModalCerrarSesion
