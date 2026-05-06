type ModalEliminarCuentaProps = {
  show: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
}

function ModalEliminarCuenta({ show, onClose, onConfirm, loading = false }: ModalEliminarCuentaProps) {
  if (!show) return null

  return (
    <div className="settings-modal__overlay" role="dialog" aria-modal="true" aria-label="Confirmar eliminacion de cuenta">
      <article className="settings-modal__card">
        <p className="settings-modal__text">ESTAS SEGURO DE QUE QUIERES ELIMINAR TU CUENTA?</p>

        <div className="settings-modal__actions">
          <button type="button" className="settings-btn settings-btn--danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'ELIMINANDO...' : 'Si, eliminar cuenta'}
          </button>
          <button type="button" className="settings-btn settings-btn--ghost" onClick={onClose} disabled={loading}>
            No, quiero a esta cuenta
          </button>
        </div>
      </article>
    </div>
  )
}

export default ModalEliminarCuenta
