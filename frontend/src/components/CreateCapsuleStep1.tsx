import { Fragment, useState, useEffect, useRef } from 'react'
import type { CreateCapsuleFormState } from '../pages/CreateCapsuleFlowPage'
import { fetchCapsuleModels, uploadModel3DFile, type ApiCapsuleModel } from '../services/api'
import { useTranslate } from '../services/useTranslate'

interface CreateCapsuleStep1Props {
  form: CreateCapsuleFormState
  updateForm: (updates: Partial<CreateCapsuleFormState>) => void
  onContinue: () => void
  isLoading: boolean
}

function CreateCapsuleStep1({ form, updateForm, onContinue, isLoading }: CreateCapsuleStep1Props) {
  const { language } = useTranslate()
  const txt = (es: string, en: string) => (language === 'en' ? en : es)
  const [models, setModels] = useState<ApiCapsuleModel[]>([])
  const [carouselIndex, setCarouselIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [loadingModels, setLoadingModels] = useState(true)
  const [uploadingFile, setUploadingFile] = useState(false)

  useEffect(() => {
    const loadModels = async () => {
      try {
        const fetchedModels = await fetchCapsuleModels()
        setModels(fetchedModels)
      } catch (err) {
        console.error('Error loading capsule models:', err)
      } finally {
        setLoadingModels(false)
      }
    }
    loadModels()
  }, [])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateForm({ title: e.target.value })
    setError('')
  }

  const handleModelSelect = (modelId: string) => {
    const selected = models.find(m => m.id === modelId)
    if (selected) {
      updateForm({
        modelId,
        modelFile: null,
        modelUrl: selected.modelUrl,
        thumbnailUrl: selected.thumbnailUrl,
      })
    }
  }

  const handleCustomModelClick = () => {
    fileInputRef.current?.click()
  }

  const handleModelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const validExts = new Set(['glb', 'gltf', 'obj', 'fbx', 'stl'])
    if (!validExts.has(ext)) {
      setError(txt('Formato 3D no soportado. Usa .glb, .gltf, .obj, .fbx o .stl', 'Unsupported 3D format. Use .glb, .gltf, .obj, .fbx or .stl'))
      e.target.value = ''
      return
    }

    setError('')
    setUploadingFile(true)

    try {
      // Upload the 3D model file
      const response = await uploadModel3DFile(file)
      
      updateForm({
        modelId: null,
        modelFile: null,
        modelUrl: response.fileUrl,
        thumbnailUrl: response.thumbnailUrl || '',
      })
    } catch (err) {
      console.error('Error uploading 3D model:', err)
      setError(txt('Error al subir el archivo 3D', 'Error uploading 3D file'))
    } finally {
      setUploadingFile(false)
      e.target.value = ''
    }
  }

  const handleAddMedia = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*'
    input.multiple = true
    input.onchange = (e: any) => {
      const files = Array.from(e.target.files ?? []) as File[]
      if (files.length > 0) {
        updateForm({ mediaFiles: [...form.mediaFiles, ...files] })
      }
    }
    input.click()
  }

  const handleRemoveMedia = (index: number) => {
    updateForm({
      mediaFiles: form.mediaFiles.filter((_, i) => i !== index),
    })
  }

  const handleContinue = () => {
    if (!form.title.trim()) {
      setError(txt('El nombre de la cápsula es obligatorio', 'Capsule name is required'))
      return
    }

    if (!form.modelId && !form.modelUrl) {
      setError(txt('Debe seleccionar un diseño de cápsula', 'You must select a capsule design'))
      return
    }

    setError('')
    onContinue()
  }

  const isModelSelected = form.modelId || form.modelUrl
  const isCustomModelSelected = !form.modelId && Boolean(form.modelUrl) && carouselIndex === models.length
  const nextIndex = (carouselIndex + 1) % (models.length + 1)
  const prevIndex = carouselIndex === 0 ? models.length : carouselIndex - 1

  return (
    <Fragment>
      {/* NOMBRE DE CÁPSULA */}
      <div style={{ padding: '0 20px', marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8750rem', fontWeight: 500 }}>
          {txt('Nombre de Cápsula', 'Capsule Name')}
        </label>
        <input
          type="text"
          placeholder={txt('Viaje a Lanzarote', 'Trip to Lanzarote')}
          value={form.title}
          onChange={handleTitleChange}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px 20px',
            border: '1px solid var(--color-borde)',
            borderRadius: '8px',
            fontSize: '1rem',
            backgroundColor: 'var(--color-fondo-principal)',
            color: 'var(--color-texto-principal)',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* DISEÑO DE CÁPSULA */}
      <div style={{ padding: '0 20px', marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.8750rem', fontWeight: 500 }}>
          {txt('Diseño de Cápsula', 'Capsule Design')}
        </label>

        {/* Carrusel */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
            }}
          >
            {/* Flecha izquierda */}
            <button
              type="button"
              onClick={() => setCarouselIndex(prevIndex)}
              disabled={isLoading}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5000rem',
                color: 'var(--color-texto-principal)',
                cursor: 'pointer',
                padding: '8px',
              }}
              aria-label={txt('Modelo anterior', 'Previous model')}
            >
              ‹
            </button>

            {/* Modelo central */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '140px',
              }}
            >
              {carouselIndex < models.length ? (
                <>
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'var(--color-fondo-secundario)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: isModelSelected && form.modelId === models[carouselIndex].id ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.2s ease',
                      cursor: 'pointer',
                      outline: isModelSelected && form.modelId === models[carouselIndex].id ? '2px solid var(--color-texto-principal)' : 'none',
                    }}
                    onClick={() => handleModelSelect(models[carouselIndex].id)}
                  >
                    <img
                      src={models[carouselIndex].thumbnailUrl}
                      alt={models[carouselIndex].nombre}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                      <p style={{ fontSize: '0.6875rem', marginTop: '8px', textAlign: 'center', color: 'var(--color-texto-secundario)' }}>
                    {models[carouselIndex].nombre}
                  </p>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '12px',
                      background: 'var(--color-fondo-secundario)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      gap: '4px',
                      border: '1.5px dashed var(--color-borde)',
                      transform: isCustomModelSelected ? 'scale(1.15)' : 'scale(1)',
                      outline: isCustomModelSelected ? '2px solid var(--color-texto-principal)' : 'none',
                    }}
                    onClick={handleCustomModelClick}
                  >
                    <span style={{ fontSize: '1.7500rem', lineHeight: 1 }}>+</span>
                    <span style={{ fontSize: '0.6875rem', textAlign: 'center', color: 'var(--color-texto-secundario)' }}>
                      {txt('Cápsula personalizada', 'Custom capsule')}
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".glb,.gltf"
                    onChange={handleModelFileChange}
                    style={{ display: 'none' }}
                  />
                </>
              )}
            </div>

            {/* Flecha derecha */}
            <button
              type="button"
              onClick={() => setCarouselIndex(nextIndex)}
              disabled={isLoading}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5000rem',
                color: 'var(--color-texto-principal)',
                cursor: 'pointer',
                padding: '8px',
              }}
              aria-label={txt('Modelo siguiente', 'Next model')}
            >
              ›
            </button>
          </div>
        </div>

        {form.modelFile && (
          <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-fondo-secundario)', borderRadius: '6px', fontSize: '0.8125rem', color: 'var(--color-texto-principal)' }}>
            {txt('Archivo', 'File')}: {form.modelFile.name}
          </div>
        )}
      </div>

      {/* SUBIR ARCHIVOS */}
      <div
        style={{
          border: '1px solid var(--color-borde)',
          borderRadius: '12px',
          padding: '16px',
          margin: '0 20px',
          marginBottom: '24px',
        }}
      >
        <label style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--color-texto-principal)', display: 'block', marginBottom: '12px' }}>
          {txt('Subir archivos', 'Upload files')}
        </label>

        {/* Grilla de miniaturas */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '12px',
          }}
        >
          {form.mediaFiles.map((file, index) => {
            const isVideo = file.type.startsWith('video')
            const isImage = file.type.startsWith('image')
            const preview = isImage || isVideo ? URL.createObjectURL(file) : null

            return (
              <div
                key={index}
                style={{
                  position: 'relative',
                  width: '80px',
                  height: '80px',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '8px',
                    background: preview ? `url(${preview}) center/cover` : 'var(--color-fondo-secundario)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                  }}
                >
                  {isVideo && (
                    <div style={{ position: 'absolute', top: '4px', left: '4px', background: 'rgba(0, 0, 0, 0.7)', color: 'white', padding: '2px 6px', fontSize: '0.6250rem', borderRadius: '3px' }}>
                      VID
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(index)}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#8B2020',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                    }}
                    aria-label={txt('Eliminar archivo', 'Remove file')}
                  >
                    ×
                  </button>
                </div>
              </div>
            )
          })}

          {/* Botón + para añadir más */}
          <button
            type="button"
            onClick={handleAddMedia}
            disabled={isLoading}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '8px',
              background: 'var(--color-fondo-secundario)',
              border: '2px dashed var(--color-borde)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              color: 'var(--color-texto-principal)',
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: '#8B2020', fontSize: '0.8750rem', padding: '0 20px', marginBottom: '16px' }}>
          {error}
        </p>
      )}

      {/* BOTÓN CONTINUAR */}
      <div style={{ padding: '0 20px', marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleContinue}
          disabled={isLoading || loadingModels || uploadingFile || !form.title.trim() || !isModelSelected}
          style={{
            padding: '12px 32px',
            backgroundColor: isLoading || loadingModels || uploadingFile || !form.title.trim() || !isModelSelected ? 'var(--color-borde)' : 'var(--color-boton-primario)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoading || loadingModels || uploadingFile || !form.title.trim() || !isModelSelected ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 500,
          }}
        >
          {uploadingFile ? txt('Subiendo...', 'Uploading...') : txt('Continuar', 'Continue')}
        </button>
      </div>
    </Fragment>
  )
}

export default CreateCapsuleStep1
