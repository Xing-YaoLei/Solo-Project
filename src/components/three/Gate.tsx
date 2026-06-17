import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GAME_CONFIG } from '@/config/difficulty';

interface GateProps {
  position?: [number, number, number];
}

export const Gate = ({ position = GAME_CONFIG.gatePosition }: GateProps) => {
  const [hovered, setHovered] = useState(false);
  const leftGateRef = useRef<THREE.Mesh>(null);
  const rightGateRef = useRef<THREE.Mesh>(null);
  const openProgress = useRef(0);
  const targetOpen = useRef(0);

  useFrame((_, delta) => {
    if (leftGateRef.current && rightGateRef.current) {
      openProgress.current += (targetOpen.current - openProgress.current) * delta * 3;
      
      leftGateRef.current.rotation.y = openProgress.current * -Math.PI / 3;
      rightGateRef.current.rotation.y = openProgress.current * Math.PI / 3;
    }
  });

  const openGate = () => {
    targetOpen.current = 1;
    setTimeout(() => {
      targetOpen.current = 0;
    }, 3000);
  };

  return (
    <group position={position}>
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[8, 5, 0.5]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.6} roughness={0.3} />
      </mesh>
      
      <mesh position={[0, 5.2, 0]} castShadow>
        <boxGeometry args={[9, 0.4, 0.8]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.4} />
      </mesh>
      
      <mesh
        ref={leftGateRef}
        position={[-1.9, 2.5, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          openGate();
        }}
        castShadow
      >
        <boxGeometry args={[3.5, 4.5, 0.3]} />
        <meshStandardMaterial 
          color={hovered ? '#3b82f6' : '#334155'} 
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
      
      <mesh
        ref={rightGateRef}
        position={[1.9, 2.5, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          openGate();
        }}
        castShadow
      >
        <boxGeometry args={[3.5, 4.5, 0.3]} />
        <meshStandardMaterial 
          color={hovered ? '#3b82f6' : '#334155'} 
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
      
      <mesh position={[0, 4.8, 0.41]}>
        <planeGeometry args={[4, 0.6]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      
      <pointLight position={[-2, 4.5, 0.5]} color="#fbbf24" intensity={1} distance={8} />
      <pointLight position={[2, 4.5, 0.5]} color="#fbbf24" intensity={1} distance={8} />
    </group>
  );
};
