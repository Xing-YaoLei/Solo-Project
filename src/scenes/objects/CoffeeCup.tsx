import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';

interface CoffeeCupProps {
  position: [number, number, number];
  isSpilling?: boolean;
  onAnimationComplete?: () => void;
}

export function CoffeeCup({ position, isSpilling = false, onAnimationComplete }: CoffeeCupProps) {
  const cupRef = useRef<RapierRigidBody>(null);
  const [spillProgress, setSpillProgress] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useFrame((_, delta) => {
    if (isSpilling && !hasAnimated) {
      setSpillProgress((prev) => {
        const next = prev + delta * 2;
        if (next >= 1) {
          setHasAnimated(true);
          onAnimationComplete?.();
          return 1;
        }
        return next;
      });

      if (cupRef.current && spillProgress < 0.5) {
        const rotation = spillProgress * Math.PI * 0.6;
        const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rotation));
        cupRef.current.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }, true);
      }
    }
  });

  return (
    <group position={position}>
      <RigidBody
        ref={cupRef}
        type="dynamic"
        position={[0, 0, 0]}
        colliders={false}
        mass={0.3}
        friction={0.8}
      >
        <CuboidCollider args={[0.4, 0.5, 0.4]} />
        
        <mesh castShadow position={[0, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.4, 0.8, 32]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.1} />
        </mesh>

        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.1, 32]} />
          <meshStandardMaterial color="#5D4037" roughness={0.2} />
        </mesh>

        {isSpilling && spillProgress > 0.3 && (
          <mesh position={[0.5 * spillProgress, -0.2 * spillProgress, 0]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#3E2723" roughness={0.1} />
          </mesh>
        )}

        {!isSpilling && (
          <mesh position={[0, 0.35, 0]}>
            <torusGeometry args={[0.15, 0.02, 8, 32, Math.PI]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
          </mesh>
        )}
      </RigidBody>
    </group>
  );
}
