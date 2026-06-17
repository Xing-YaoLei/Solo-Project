import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BuildingProps {
  position: [number, number, number];
  size?: [number, number, number];
  color?: string;
  windows?: boolean;
}

export const Building = ({ 
  position, 
  size = [8, 6, 8], 
  color = '#475569',
  windows = true 
}: BuildingProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const windowsRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D());

  useFrame(({ clock }) => {
    if (windowsRef.current && windows) {
      const time = clock.getElapsedTime();
      for (let i = 0; i < windowsRef.current.count; i++) {
        const flicker = Math.sin(time * 2 + i) * 0.1 + 0.9;
        dummy.current.position.set(
          (i % 3 - 1) * 2.5,
          Math.floor(i / 3) * 1.5 + 1,
          size[2] / 2 + 0.01
        );
        dummy.current.scale.set(1, 1, 1);
        dummy.current.updateMatrix();
        windowsRef.current.setMatrixAt(i, dummy.current.matrix);
        const color = new THREE.Color('#fbbf24');
        color.multiplyScalar(flicker);
        windowsRef.current.setColorAt(i, color);
      }
      windowsRef.current.instanceMatrix.needsUpdate = true;
      if (windowsRef.current.instanceColor) {
        windowsRef.current.instanceColor.needsUpdate = true;
      }
    }
  });

  const windowCount = Math.floor(size[1] / 1.5) * 3;

  return (
    <group ref={groupRef} position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
      </mesh>
      
      <mesh position={[0, size[1] / 2 + 0.2, 0]} castShadow>
        <boxGeometry args={[size[0] + 0.4, 0.4, size[2] + 0.4]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      
      {windows && (
        <instancedMesh
          ref={windowsRef}
          args={[undefined, undefined, windowCount]}
          position={[0, 0, 0]}
        >
          <planeGeometry args={[1.5, 1]} />
          <meshStandardMaterial 
            color="#fbbf24" 
            emissive="#fbbf24"
            emissiveIntensity={0.5}
            transparent
            opacity={0.9}
          />
        </instancedMesh>
      )}
      
      <mesh position={[0, 1, size[2] / 2 + 0.02]}>
        <boxGeometry args={[2, 2.5, 0.05]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
};
