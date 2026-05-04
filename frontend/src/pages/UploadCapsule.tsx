import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCapsule, uploadMediaFile } from '../services/api.ts'

function UploadCapsule() {
  const navigate = useNavigate()
  const token = localStorage.getItem('authToken')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [designKey, setDesignKey] = useState('default')
  const [designLabel, setDesignLabel] = useState('Simple')
  const [timeCapsuleEnabled, setTimeCapsuleEnabled] = useState(false)
  const [unlockAt, setUnlockAt] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!token) {
      navigate('/login')
    }
  }, [navigate, token])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) {
      setError('El titulo es obligatorio')
      return
    }

    if (timeCapsuleEnabled && !unlockAt) {
      setError('Indica la fecha de desbloqueo')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const uploadedMedia = files
        ? await Promise.all(
          Array.from(files).map(async (file) => {
            const upload = await uploadMediaFile(file)

            return {
              type: upload.type,
              url: upload.fileUrl,
              title: upload.originalName,
              description: '',
              thumbnailUrl: upload.thumbnailUrl ?? '',
            }
          }),
        )
        : []

      const createdCapsule = await createCapsule({
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        design: {
          key: designKey,
          label: designLabel,
        },
        timeCapsule: {
          enabled: timeCapsuleEnabled,
          unlockAt: timeCapsuleEnabled ? unlockAt : null,
        },
        mediaItems: uploadedMedia,
      })

      setSuccess('Capsula creada correctamente')
      navigate('/capsula', { state: { capsuleId: createdCapsule._id } })
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'No se pudo crear la capsula'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="page-card form-card">
      <div>
        <h1>Subir capsula</h1>
        <p>Crea un nuevo recuerdo con datos reales y sube los archivos al backend.</p>
      </div>

      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Titulo</span>
          <input
            type="text"
            placeholder="Ejemplo: Mi concierto favorito"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Categoria</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Selecciona una categoria</option>
            <option value="familia">Familia</option>
            <option value="viajes">Viajes</option>
            <option value="amistad">Amistad</option>
            <option value="trabajo">Trabajo</option>
            <option value="otros">Otros</option>
          </select>
        </label>

        <label className="field">
          <span>Descripcion</span>
          <textarea
            placeholder="Describe el momento que quieres guardar"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <div className="panel upload-settings">
          <label className="field">
            <span>Diseño</span>
            <input
              type="text"
              value={designLabel}
              onChange={(event) => setDesignLabel(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Clave de diseño</span>
            <input
              type="text"
              value={designKey}
              onChange={(event) => setDesignKey(event.target.value)}
            />
          </label>

          <label className="field checkbox-field">
            <span>Capsula con desbloqueo futuro</span>
            <input
              type="checkbox"
              checked={timeCapsuleEnabled}
              onChange={(event) => setTimeCapsuleEnabled(event.target.checked)}
            />
          </label>

          {timeCapsuleEnabled ? (
            <label className="field">
              <span>Fecha de desbloqueo</span>
              <input
                type="datetime-local"
                value={unlockAt}
                onChange={(event) => setUnlockAt(event.target.value)}
              />
            </label>
          ) : null}
        </div>

        <label className="field">
          <span>Archivos</span>
          <input
            type="file"
            multiple
            onChange={(event) => setFiles(event.target.files)}
          />
        </label>

        {error ? <p className="page-status page-status--error">{error}</p> : null}
        {success ? <p className="page-status page-status--success">{success}</p> : null}

        <div className="button-row">
          <button type="submit" className="button-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar capsula'}
          </button>
          <button type="button" className="button-secondary" onClick={() => navigate('/dashboard')}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}

export default UploadCapsule