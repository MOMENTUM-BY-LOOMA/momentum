import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'

type CapsulaThumb3DProps = {
  modelUrl: string
  title: string
}

function PlaceholderBox() {
  return (
    <mesh position={[0, -0.45, 0]}>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial color="#999" />
    </mesh>
  )
}

function CapsulaThumb3D({ modelUrl, title }: CapsulaThumb3DProps) {
  // For now, just show a placeholder
  // TODO: Implement 3D model loading when models are properly configured
  return (
    <div className="capsula-thumb capsula-thumb--3d" aria-label={`Miniatura 3D de ${title}`}>
      <Canvas camera={{ position: [0, 0, 2.2], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[1.2, 1.8, 2.4]} intensity={1.1} />
        <PlaceholderBox />
      </Canvas>
    </div>
  )
}

export default CapsulaThumb3D
