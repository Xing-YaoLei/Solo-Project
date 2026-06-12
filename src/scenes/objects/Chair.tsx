import { useRef } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';

interface ChairProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

export function Chair({ position, rotation = [0, 0, 0] }: ChairProps) {
  const chairRef = useRef<RapierRigidBody>(null);

  return (
    <group position={position} rotation={rotation}>
      <RigidBody
        ref={chairRef}
        type="fixed"
        position={[0, 0, 0]}
        colliders={false}
      >
        <CuboidCollider args={[0.4, 0.5, 0.4]} />
        
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.8, 0.05, 0.8]} />
          <meshStandardMaterial color="#8D6E63" roughness={0.7} />
        </mesh>

        <mesh position={[0, 0.8, -0.35]} castShadow>
          <boxGeometry args={[0.8, 0.8, 0.05]} />
          <meshStandardMaterial color="#8D6E63" roughness={0.7} />
        </mesh>

        {[-0.3, 0.3].map((x) =>
          [-0.3, 0.3].map((z, i) => (
            <mesh key={`${x}-${z}`} position={[x, 0.2, z]}>
              <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
              <meshStandardMaterial color="#5D4037" roughness={0.8} />
            </mesh>
          ))
        )}
      </RigidBody>
    </group>
  );
}
