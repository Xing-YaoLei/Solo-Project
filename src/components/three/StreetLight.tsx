import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StreetLightProps {
  position: [number, number, number];
}

export const StreetLight = ({ position }: StreetLightProps) => {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (lightRef.current) {
      const flicker = Math.sin(clock.getElapsedTime() * 3 + position[0]) * 0.1 + 0.9;
      lightRef.current.intensity = 1.5 * flicker;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 4, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>
      
      <mesh position={[0, 4.1, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.08, 0.2, 8]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      
      <mesh position={[0, 4.3, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial 
          color="#fbbf24" 
          emissive="#fbbf24"
          emissiveIntensity={1}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      <pointLight
        ref={lightRef}
        position={[0, 4, 0]}
        color="#fbbf24"
        intensity={1.5}
        distance={12}
        castShadow
      />
    </group>
  );
};
