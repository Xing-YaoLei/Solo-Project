import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, BallCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { useMemo } from 'react';

interface CoffeeBeanProps {
  position: [number, number, number];
  velocity?: [number, number, number];
}

export function CoffeeBean({ position, velocity = [0, 0, 0] }: CoffeeBeanProps) {
  const beanRef = useRef<RapierRigidBody>(null);

  const rotation = useMemo(() => [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number], []);

  useFrame(() => {
    if (beanRef.current) {
      const pos = beanRef.current.translation();
      if (pos.y < -5) {
        beanRef.current.setTranslation({ x: position[0], y: position[1], z: position[2] }, true);
        beanRef.current.setLinvel({ x: velocity[0], y: velocity[1], z: velocity[2] }, true);
      }
    }
  });

  return (
    <RigidBody
      ref={beanRef}
      type="dynamic"
      position={position}
      colliders={false}
      mass={0.05}
      restitution={0.6}
      friction={0.8}
      linearVelocity={velocity}
    >
      <BallCollider args={[0.15]} />
      
      <group rotation={rotation}>
        <mesh castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#3E2723" roughness={0.5} />
        </mesh>
        
        <mesh position={[0, 0, 0.14]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#1B0000" roughness={0.3} />
        </mesh>
      </group>
    </RigidBody>
  );
}
