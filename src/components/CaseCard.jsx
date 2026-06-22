import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export default function CaseCard({ caseItem, position, isSelected, isAssigned, onClick }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  const priorityColor = caseItem.priority === 1 ? '#ef4444' : caseItem.priority === 2 ? '#f59e0b' : '#22c55e';
  const priorityLabel = caseItem.priority === 1 ? '高' : caseItem.priority === 2 ? '中' : '低';

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const targetScale = isSelected ? 1.1 : hovered ? 1.05 : 1;
      const currentScale = meshRef.current.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.1;
      meshRef.current.scale.set(newScale, newScale, newScale);

      if (isSelected) {
        const floatY = Math.sin(time * 3) * 0.1;
        meshRef.current.position.y = position[1] + floatY;
      }
    }
  });

  return (
    <group position={position} onClick={onClick}>
      <mesh
        ref={meshRef}
        onPointerOver={() => !isAssigned && setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <boxGeometry args={[2, 1.2, 0.2]} />
        <meshStandardMaterial
          color={isAssigned ? '#475569' : isSelected ? '#3b82f6' : '#1e293b'}
          emissive={isSelected ? '#3b82f6' : priorityColor}
          emissiveIntensity={isSelected ? 0.4 : 0.15}
          metalness={0.2}
          roughness={0.6}
          transparent
          opacity={isAssigned ? 0.5 : 1}
        />
      </mesh>

      <mesh position={[-0.95, 0, 0.11]}>
        <boxGeometry args={[0.1, 1.2, 0.02]} />
        <meshStandardMaterial color={priorityColor} emissive={priorityColor} emissiveIntensity={0.5} />
      </mesh>

      <Text
        position={[0, 0.25, 0.11]}
        fontSize={0.25}
        color={isAssigned ? '#94a3b8' : '#f1f5f9'}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {caseItem.name}
      </Text>

      <Text
        position={[0, -0.05, 0.11]}
        fontSize={0.18}
        color={isAssigned ? '#64748b' : '#94a3b8'}
        anchorX="center"
        anchorY="middle"
      >
        客户：{caseItem.client}
      </Text>

      <group position={[-0.5, -0.35, 0.11]}>
        <mesh>
          <boxGeometry args={[0.5, 0.2, 0.02]} />
          <meshStandardMaterial color={priorityColor} />
        </mesh>
        <Text
          position={[0, 0, 0.02]}
          fontSize={0.13}
          color="#fff"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {priorityLabel}优先级
        </Text>
      </group>

      <Text
        position={[0.5, -0.35, 0.11]}
        fontSize={0.15}
        color={isAssigned ? '#64748b' : '#94a3b8'}
        anchorX="center"
        anchorY="middle"
      >
        {caseItem.duration}h
      </Text>

      {isAssigned && (
        <Text
          position={[0, 0, 0.15]}
          fontSize={0.2}
          color="#22c55e"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          已排期
        </Text>
      )}
    </group>
  );
}
