import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ParticleBurstProps {
  position: [number, number, number]
  active: boolean
}

const PARTICLE_COUNT = 20
const BURST_SPEED = 2.5
const FADE_DURATION = 1

interface ParticleState {
  velocity: THREE.Vector3
  life: number
}

export function ParticleBurst({ position, active }: ParticleBurstProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const statesRef = useRef<ParticleState[]>([])
  const startTimeRef = useRef(0)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const velocities = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, () => {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const speed = BURST_SPEED * (0.5 + Math.random() * 0.5)
      return new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      )
    })
  }, [])

  useEffect(() => {
    if (active && meshRef.current) {
      startTimeRef.current = 0
      statesRef.current = velocities.map((v) => ({
        velocity: v.clone(),
        life: 1,
      }))
    }
  }, [active, velocities])

  useFrame((_, delta) => {
    if (!meshRef.current || !active) return

    if (startTimeRef.current === 0) startTimeRef.current = delta
    startTimeRef.current += delta

    const elapsed = startTimeRef.current
    const progress = Math.min(elapsed / FADE_DURATION, 1)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const state = statesRef.current[i]
      if (!state) continue

      const t = elapsed
      const px = state.velocity.x * t
      const py = state.velocity.y * t - 0.5 * 4.9 * t * t
      const pz = state.velocity.z * t

      dummy.position.set(px, py, pz)
      dummy.scale.setScalar(1 - progress)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    const material = meshRef.current.material as THREE.MeshStandardMaterial
    material.opacity = 1 - progress
    material.transparent = true

    meshRef.current.instanceMatrix.needsUpdate = true

    if (progress >= 1) {
      dummy.position.set(0, 0, 0)
      dummy.scale.setScalar(0)
      dummy.updateMatrix()
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        meshRef.current.setMatrixAt(i, dummy.matrix)
      }
      meshRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group position={position}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <icosahedronGeometry args={[0.03, 0]} />
        <meshStandardMaterial
          color="#B76E79"
          metalness={0.6}
          roughness={0.3}
          transparent
          opacity={active ? 1 : 0}
        />
      </instancedMesh>
    </group>
  )
}
