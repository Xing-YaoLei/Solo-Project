import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import * as THREE from 'three'

interface CleanerProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  moveDirection?: [number, number, number]
  speed?: number
  onPositionChange?: (position: [number, number, number]) => void
  uniformColor?: string
}

export default function Cleaner({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  moveDirection = [0, 0, 0],
  speed = 2,
  onPositionChange,
  uniformColor = '#4da6ff',
}: CleanerProps) {
  const rigidBodyRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)
  const leftLegRef = useRef<THREE.Mesh>(null)
  const rightLegRef = useRef<THREE.Mesh>(null)
  const leftArmRef = useRef<THREE.Mesh>(null)
  const rightArmRef = useRef<THREE.Mesh>(null)
  const velRef = useRef(new THREE.Vector3())

  useEffect(() => {
    if (rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation(
        { x: position[0], y: position[1], z: position[2] },
        true
      )
      const euler = new THREE.Euler(rotation[0], rotation[1], rotation[2])
      const quat = new THREE.Quaternion().setFromEuler(euler)
      rigidBodyRef.current.setRotation(
        { x: quat.x, y: quat.y, z: quat.z, w: quat.w },
        true
      )
    }
  }, [])

  useFrame((state) => {
    const time = state.clock.elapsedTime

    if (rigidBodyRef.current) {
      const rigidBody = rigidBodyRef.current
      const translation = rigidBody.translation()
      const currentPos: [number, number, number] = [translation.x, translation.y, translation.z]

      const hasMovement =
        Math.abs(moveDirection[0]) > 0.01 || Math.abs(moveDirection[2]) > 0.01

      if (hasMovement) {
        velRef.current.set(
          moveDirection[0] * speed,
          0,
          moveDirection[2] * speed
        )
        rigidBody.setLinvel({ x: velRef.current.x, y: rigidBody.linvel().y, z: velRef.current.z }, true)

        const targetAngle = Math.atan2(moveDirection[0], moveDirection[2])
        if (groupRef.current) {
          const currentY = groupRef.current.rotation.y
          const diff = Math.atan2(
            Math.sin(targetAngle - currentY),
            Math.cos(targetAngle - currentY)
          )
          groupRef.current.rotation.y = currentY + diff * 0.15
        }
      } else {
        const currentVel = rigidBody.linvel()
        rigidBody.setLinvel({ x: currentVel.x * 0.8, y: currentVel.y, z: currentVel.z * 0.8 }, true)
      }

      if (onPositionChange) {
        onPositionChange(currentPos)
      }
    }

    const walkCycle = hasMovement ? Math.sin(time * 8) : 0
    if (leftLegRef.current) leftLegRef.current.rotation.x = walkCycle * 0.6
    if (rightLegRef.current) rightLegRef.current.rotation.x = -walkCycle * 0.6
    if (leftArmRef.current) leftArmRef.current.rotation.x = -walkCycle * 0.5
    if (rightArmRef.current) rightArmRef.current.rotation.x = walkCycle * 0.5
  })

  const hasMovement =
    Math.abs(moveDirection[0]) > 0.01 || Math.abs(moveDirection[2]) > 0.01

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      rotation={rotation}
      colliders={false}
      mass={70}
      linearDamping={0.5}
      angularDamping={1}
      type="dynamic"
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider args={[0.8, 0.35]} position={[0, 0.9, 0]} />
      <group ref={groupRef}>
        <group position={[0, 0.3, 0]}>
          <mesh ref={leftLegRef} position={[-0.12, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
            <meshStandardMaterial color="#2d2d2d" roughness={0.8} />
          </mesh>
          <mesh ref={rightLegRef} position={[0.12, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
            <meshStandardMaterial color="#2d2d2d" roughness={0.8} />
          </mesh>
        </group>

        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[0.55, 0.7, 0.35]} />
          <meshStandardMaterial color={uniformColor} roughness={0.7} />
        </mesh>

        <mesh ref={leftArmRef} position={[-0.38, 1.0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.6, 8]} />
          <meshStandardMaterial color="#f0e6d3" roughness={0.8} />
        </mesh>
        <mesh ref={rightArmRef} position={[0.38, 1.0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.6, 8]} />
          <meshStandardMaterial color="#f0e6d3" roughness={0.8} />
        </mesh>

        <group position={[0, 1.5, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshStandardMaterial color="#f5deb3" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.24, 0.1, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
        </group>
      </group>
    </RigidBody>
  )
}
