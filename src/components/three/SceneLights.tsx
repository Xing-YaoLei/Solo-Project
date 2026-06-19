import { useRef } from 'react'
import * as THREE from 'three'

interface SceneLightsProps {
  sunIntensity?: number
  ambientIntensity?: number
  lampIntensity?: number
}

export default function SceneLights({
  sunIntensity = 1.2,
  ambientIntensity = 0.5,
  lampIntensity = 0.8,
}: SceneLightsProps) {
  const sunRef = useRef<THREE.DirectionalLight>(null)
  const lampRef = useRef<THREE.PointLight>(null)

  return (
    <>
      <ambientLight intensity={ambientIntensity} color="#fff5e6" />
      <directionalLight
        ref={sunRef}
        position={[8, 12, 6]}
        intensity={sunIntensity}
        color="#ffeedd"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0005}
      />
      <pointLight
        ref={lampRef}
        position={[-3, 2.5, -3]}
        intensity={lampIntensity}
        color="#ffcc88"
        distance={10}
        decay={2}
      />
      <pointLight
        position={[3, 2.5, 3]}
        intensity={lampIntensity * 0.6}
        color="#ffbb77"
        distance={8}
        decay={2}
      />
    </>
  )
}
