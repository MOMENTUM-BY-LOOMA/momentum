import { Fragment, type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { logoMAsset } from '../img'
import { createCapsule, uploadMediaFile, type ApiMediaItem } from '../services/api.ts'

const MODEL_THUMB_SIZE = 640
const MODEL_EXTS = new Set(['glb', 'gltf', 'obj', 'fbx', 'stl'])

function resolveApiUrl(url: string) {
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url
  const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000').replace(/\/$/, '')
  return `${base}${url.startsWith('/') ? url : `/${url}`}`
}

async function generate3DThumbnail(modelUrl: string): Promise<Blob> {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000)

  scene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const key = new THREE.DirectionalLight(0xffffff, 1.0)
  key.position.set(3, 5, 4)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xffffff, 0.5)
  fill.position.set(-3, 2, -2)
  scene.add(fill)

  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(modelUrl)
  const model = gltf.scene.clone(true)
  scene.add(model)

  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  model.position.sub(center)
  model.scale.setScalar(2 / Math.max(size.x, size.y, size.z, 0.0001))

  const d = 3.2
  camera.position.set(d, d * 0.5, d)
  camera.lookAt(0, 0, 0)

  const canvas = document.createElement('canvas')
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setSize(MODEL_THUMB_SIZE, MODEL_THUMB_SIZE, false)
  renderer.setPixelRatio(1)
  renderer.setClearColor(0x000000, 0)
  renderer.render(scene, camera)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('No se pudo generar miniatura 3D'))),
      'image/png',
    )
  })
  renderer.dispose()
  return blob
}

function CreateCapsuleFlowPage() {
  const navigate = useNavigate()

  // Información básica
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')

  // Fotos y vídeos de la cápsula
  const [mediaFiles, setMediaFiles] = useState<File[]>([])

  // Modelo 3D (uno solo)
  const [model3DFile, setModel3DFile] = useState<File | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  function handleMediaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length > 0) setMediaFiles((prev) => [...prev, ...selected])
    e.target.value = ''
  }

  function removeMedia(idx: number) {
    setMediaFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleModelChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!MODEL_EXTS.has(ext)) {
      setError('Formato 3D no soportado. Usa .glb, .gltf, .obj, .fbx o .stl')
      return
    }
    setError('')
    setModel3DFile(file)
    e.target.value = ''
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('El título es obligatorio')
      return
    }

    setIsSubmitting(true)
    setError('')
    setProgress('')

    try {
      const mediaItems: ApiMediaItem[] = []

      // 1. Subir fotos y vídeos
      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i]
        setProgress(`Subiendo foto/vídeo ${i + 1} de ${mediaFiles.length}…`)
        const uploaded = await uploadMediaFile(file)
        mediaItems.push({
          type: uploaded.type as ApiMediaItem['type'],
          url: uploaded.fileUrl,
          modelFormat: undefined,
          fileSize: uploaded.size,
          title: file.name,
          description: '',
          thumbnailUrl: uploaded.thumbnailUrl ?? '',
        })
      }

      // 2. Subir modelo 3D si se seleccionó
      if (model3DFile) {
        setProgress('Subiendo modelo 3D…')
        const uploaded = await uploadMediaFile(model3DFile)

        let thumbnailUrl = ''
        try {
          setProgress('Generando miniatura del modelo 3D…')
          const blob = await generate3DThumbnail(resolveApiUrl(uploaded.fileUrl))
          const thumbFile = new File(
            [blob],
            `${model3DFile.name.replace(/\.[^.]+$/, '')}-thumb.png`,
            { type: 'image/png' },
          )
          const thumbUploaded = await uploadMediaFile(thumbFile)
          thumbnailUrl = thumbUploaded.fileUrl
        } catch {
          thumbnailUrl = ''
        }

        mediaItems.push({
          type: '3d',
          url: uploaded.fileUrl,
          modelFormat: (uploaded.modelFormat ?? '') as ApiMediaItem['modelFormat'],
          fileSize: uploaded.size,
          title: model3DFile.name,
          description: '',
          thumbnailUrl,
        })
      }

      setProgress('Creando cápsula…')
      const capsule = await createCapsule({
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        mediaItems,
      })

      navigate(`/capsulas/${capsule._id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cápsula')
    } finally {
      setIsSubmitting(false)
      setProgress('')
    }
  }

  return (
    <Fragment>
      <header className="mobile-header" aria-label="Crear cápsula">
        <button
          type="button"
          className="mobile-header__left"
          onClick={() => navigate(-1)}
          aria-label="Volver"
        >
          ←
        </button>
        <Link to="/inicio" className="logo-button" aria-label="Ir a inicio">
          <img src={logoMAsset} alt="Momentum" />
        </Link>
        <span className="mobile-header__right" aria-hidden="true" />
      </header>

      <section className="page-card form-card">
        <h1 className="create-capsule__title">CREA TU CÁPSULA</h1>

        <form className="upload-form" onSubmit={handleSubmit}>

          {/* ── Información básica ── */}
          <label className="field">
            <span>Título *</span>
            <input
              type="text"
              placeholder="Ej: Mi concierto favorito"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </label>

          <label className="field">
            <span>Categoría</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={isSubmitting}>
              <option value="">Selecciona una categoría</option>
              <option value="familia">Familia</option>
              <option value="viajes">Viajes</option>
              <option value="amistad">Amistad</option>
              <option value="trabajo">Trabajo</option>
              <option value="otros">Otros</option>
            </select>
          </label>

          <label className="field">
            <span>Descripción</span>
            <textarea
              placeholder="Describe el momento que quieres guardar"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </label>

          {/* ── Fotos y vídeos ── */}
          <div className="create-capsule__section">
            <p className="create-capsule__section-title">Fotos y vídeos</p>
            <p className="create-capsule__section-desc">Añade las imágenes y vídeos del recuerdo.</p>

            <label className="create-capsule__upload-zone">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleMediaChange}
                disabled={isSubmitting}
                style={{ display: 'none' }}
              />
              <svg className="create-capsule__upload-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 20H16M4 16V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="create-capsule__upload-label">Añadir fotos o vídeos</span>
            </label>

            {mediaFiles.length > 0 && (
              <ul className="create-capsule__file-list">
                {mediaFiles.map((f, i) => (
                  <li key={i} className="create-capsule__file-item">
                    <span className={`create-capsule__file-badge create-capsule__file-badge--${f.type.startsWith('video') ? 'video' : 'image'}`}>
                      {f.type.startsWith('video') ? 'VID' : 'IMG'}
                    </span>
                    <span className="create-capsule__file-name">{f.name}</span>
                    <button
                      type="button"
                      className="create-capsule__file-remove"
                      onClick={() => removeMedia(i)}
                      disabled={isSubmitting}
                      aria-label={`Quitar ${f.name}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── Modelo 3D ── */}
          <div className="create-capsule__section">
            <p className="create-capsule__section-title">Modelo 3D de la cápsula</p>
            <p className="create-capsule__section-desc">
              El modelo 3D que se mostrará en la web como representación de esta cápsula.
              Formatos: .glb, .gltf, .obj, .fbx, .stl
            </p>

            <label className="create-capsule__upload-zone create-capsule__upload-zone--model">
              <input
                type="file"
                accept=".glb,.gltf,.obj,.fbx,.stl"
                onChange={handleModelChange}
                disabled={isSubmitting}
                style={{ display: 'none' }}
              />
              <svg className="create-capsule__upload-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 3L2 7.5L12 12L22 7.5L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 16.5L12 21L22 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 16.5L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="create-capsule__upload-label">
                {model3DFile ? 'Cambiar modelo 3D' : 'Seleccionar modelo 3D'}
              </span>
            </label>

            {model3DFile && (
              <div className="create-capsule__model-selected">
                <span className="create-capsule__file-badge create-capsule__file-badge--model3d">3D</span>
                <span className="create-capsule__file-name">{model3DFile.name}</span>
                <button
                  type="button"
                  className="create-capsule__file-remove"
                  onClick={() => setModel3DFile(null)}
                  disabled={isSubmitting}
                  aria-label="Quitar modelo 3D"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {error && <p className="page-status page-status--error">{error}</p>}
          {progress && <p className="page-status">{progress}</p>}

          <div className="button-row">
            <button type="submit" className="button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Crear cápsula'}
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          </div>
        </form>
      </section>
    </Fragment>
  )
}

export default CreateCapsuleFlowPage
