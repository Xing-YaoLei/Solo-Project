import { useRef } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Material } from '../../types';

interface MaterialStackProps {
  material: Material;
  quantity: number;
  position: [number, number, number];
}

export function MaterialStack({ material, quantity, position }: MaterialStackProps) {
  const groupRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  const stackHeight = Math.min(quantity / 50, 5);
  const opacity = Math.max(0.3, Math.min(1, quantity / 200));

  return (
    <group position={position}>
      <RigidBody type="dynamic" colliders="cuboid">
        <mesh ref={groupRef} castShadow position={[0, stackHeight / 2, 0]}>
          <boxGeometry args={[1.5, stackHeight, 1.5]} />
          <meshStandardMaterial
            color={material.color}
            transparent
            opacity={opacity}
            roughness={0.7}
          />
        </mesh>
      </RigidBody>

      {Array.from({ length: Math.min(5, Math.floor(quantity / 20)) }).map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(i) * 1.2,
            0.1 + i * 0.02,
            Math.cos(i) * 1.2
          ]}
        >
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color={material.color} />
        </mesh>
      ))}

      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshBasicMaterial color={material.color} transparent opacity={0.2} />
      </mesh>
    </group>
  );
}
