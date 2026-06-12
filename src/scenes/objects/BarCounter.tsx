import { useRef } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';

interface BarCounterProps {
  position: [number, number, number];
}

export function BarCounter({ position }: BarCounterProps) {
  const counterRef = useRef<RapierRigidBody>(null);

  return (
    <group position={position}>
      <RigidBody
        ref={counterRef}
        type="fixed"
        position={[0, 0, 0]}
        colliders={false}
      >
        <CuboidCollider args={[3, 0.5, 1]} />
        
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[6, 1, 2]} />
          <meshStandardMaterial color="#5D4037" roughness={0.8} />
        </mesh>

        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[6.2, 0.1, 2.2]} />
          <meshStandardMaterial color="#4E342E" roughness={0.6} metalness={0.2} />
        </mesh>

        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[6, 0.5, 0.1]} />
          <meshStandardMaterial color="#3E2723" roughness={0.4} />
        </mesh>

        <mesh position={[-2, 0.8, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.5, 16]} />
          <meshStandardMaterial color="#212121" metalness={0.8} roughness={0.2} />
        </mesh>

        <mesh position={[-1.5, 0.8, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.4, 16]} />
          <meshStandardMaterial color="#757575" metalness={0.6} roughness={0.3} />
        </mesh>

        {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((x, i) => (
          <mesh key={i} position={[x, 0.85, 0.6]}>
            <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
            <meshStandardMaterial color={['#D32F2F', '#388E3C', '#1976D2', '#FFA000', '#7B1FA2', '#00796B'][i]} />
          </mesh>
        ))}
      </RigidBody>
    </group>
  );
}
