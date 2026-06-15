import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface TeacherDeskProps {
  onClick?: () => void;
}

export default function TeacherDesk({ onClick }: TeacherDeskProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
    }
  });

  const deskColor = hovered ? '#8D6E63' : '#6D4C41';

  return (
    <group
      ref={groupRef}
      position={[0, 0, -6]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={() => {
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[2.5, 0.1, 1.2]} />
        <meshStandardMaterial color={deskColor} />
      </mesh>

      <mesh position={[-1, 0.4, 0.4]} castShadow>
        <boxGeometry args={[0.08, 1.2, 0.08]} />
        <meshStandardMaterial color={deskColor} />
      </mesh>
      <mesh position={[1, 0.4, 0.4]} castShadow>
        <boxGeometry args={[0.08, 1.2, 0.08]} />
        <meshStandardMaterial color={deskColor} />
      </mesh>
      <mesh position={[-1, 0.4, -0.4]} castShadow>
        <boxGeometry args={[0.08, 1.2, 0.08]} />
        <meshStandardMaterial color={deskColor} />
      </mesh>
      <mesh position={[1, 0.4, -0.4]} castShadow>
        <boxGeometry args={[0.08, 1.2, 0.08]} />
        <meshStandardMaterial color={deskColor} />
      </mesh>

      <mesh position={[0.5, 1.1, 0]}>
        <boxGeometry args={[0.3, 0.02, 0.2]} />
        <meshStandardMaterial color="#FAFAFA" />
      </mesh>

      <mesh position={[-0.5, 1.1, -0.2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.15, 8]} />
        <meshStandardMaterial color="#2E7D32" />
      </mesh>
      <mesh position={[-0.5, 1.2, -0.2]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.15, 0.01, 0.1]} />
        <meshStandardMaterial color="#2E7D32" />
      </mesh>

      <mesh position={[-0.3, 1.07, 0.2]} rotation={[-0.3, 0.2, 0]}>
        <boxGeometry args={[0.25, 0.02, 0.18]} />
        <meshStandardMaterial color="#F9A825" />
      </mesh>

      <Text
        position={[0, 1.3, 0]}
        fontSize={0.15}
        color="#FAFAFA"
        anchorX="center"
        anchorY="middle"
      >
        讲台
      </Text>
    </group>
  );
}
