import { lazy, Suspense } from 'react'

type ThumbCapsule = {
  id: string
  nombre: string
  thumbnailUrl?: string
  modelUrl?: string
}

type CapsulaThumbProps = {
  capsula: ThumbCapsule
  onOpen: (capsuleId: string) => void
}

const LazyCapsulaThumb3D = lazy(() => import('./CapsulaThumb3D'))

function getInitial(name: string) {
  const value = name.trim()
  return value ? value.charAt(0).toUpperCase() : '?'
}

function isGltfModel(url: string) {
  const clean = url.split('?')[0].toLowerCase()
  return clean.endsWith('.glb') || clean.endsWith('.gltf')
}

function CapsulaThumb({ capsula, onOpen }: CapsulaThumbProps) {
  const title = capsula.nombre || 'Capsula'

  return (
    <button
      type="button"
      className="capsula-thumb-button"
      aria-label={`Abrir capsula ${title}`}
      onClick={() => onOpen(capsula.id)}
    >
      {capsula.thumbnailUrl ? (
        <img className="capsula-thumb" src={capsula.thumbnailUrl} alt={title} loading="lazy" />
      ) : capsula.modelUrl && isGltfModel(capsula.modelUrl) ? (
        <Suspense fallback={<div className="capsula-thumb capsula-thumb--fallback"><span>{getInitial(title)}</span></div>}>
          <LazyCapsulaThumb3D modelUrl={capsula.modelUrl} title={title} />
        </Suspense>
      ) : (
        <div className="capsula-thumb capsula-thumb--fallback" aria-label={`Sin miniatura para ${title}`}>
          <span>{getInitial(title)}</span>
        </div>
      )}
    </button>
  )
}

export type { ThumbCapsule }
export default CapsulaThumb
