import { useRef } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';

interface TableProps {
  position: [number, number, number];
}

export function Table({ position }: TableProps) {
  const tableRef = useRef<RapierRigidBody>(null);

  return (
    <group position={position}>
      <RigidBody
        ref={tableRef}
        type="fixed"
        position={[0, 0, 0]}
        colliders={false}
      >
        <CuboidCollider args={[1.2, 0.05, 1.2]} />
        
        <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.2, 1.2, 0.08, 32]} />
          <meshStandardMaterial color="#6D4C41" roughness={0.7} />
        </mesh>

        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.8, 16]} />
          <meshStandardMaterial color="#5D4037" roughness={0.8} />
        </mesh>

        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.35, 0.05, 16]} />
          <meshStandardMaterial color="#4E342E" roughness={0.9} />
        </mesh>
      </RigidBody>
    </group>
  );
}
