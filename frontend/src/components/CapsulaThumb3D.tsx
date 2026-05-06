import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Group } from 'three'

type CapsulaThumb3DProps = {
  modelUrl: string
  title: string
}

function StaticModel({ modelUrl }: { modelUrl: string }) {
  const gltf = useGLTF(modelUrl)

  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true)
    cloned.position.set(0, -0.45, 0)
    cloned.scale.setScalar(0.9)
    return cloned
  }, [gltf.scene])

  return <primitive object={scene as Group} />
}

function CapsulaThumb3D({ modelUrl, title }: CapsulaThumb3DProps) {
  return (
    <div className="capsula-thumb capsula-thumb--3d" aria-label={`Miniatura 3D de ${title}`}>
      <Canvas camera={{ position: [0, 0, 2.2], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[1.2, 1.8, 2.4]} intensity={1.1} />
        <Suspense fallback={null}>
          <StaticModel modelUrl={modelUrl} />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default CapsulaThumb3D
