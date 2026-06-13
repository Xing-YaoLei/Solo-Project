import { useRef } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { COLORS } from '@/utils/constants';

interface ShelfProps {
  position?: [number, number, number];
  rows?: number;
  cols?: number;
  width?: number;
  height?: number;
  depth?: number;
}

export default function Shelf({
  position = [0, 0, -3],
  rows = 3,
  cols = 6,
  width = 12,
  height = 6,
  depth = 1.5,
}: ShelfProps) {
  const groupRef = useRef<THREE.Group>(null);

  const shelfThickness = 0.1;
  const rowHeight = height / rows;
  const colWidth = width / cols;

  const shelves = [];
  for (let row = 0; row <= rows; row++) {
    shelves.push(
      <mesh
        key={`shelf-${row}`}
        position={[0, row * rowHeight - height / 2, 0]}
        receiveShadow
      >
        <boxGeometry args={[width, shelfThickness, depth]} />
        <meshStandardMaterial
          color={COLORS.darkGray}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
    );
  }

  const verticalSupports = [];
  for (let col = 0; col <= cols; col++) {
    verticalSupports.push(
      <mesh
        key={`v-support-${col}`}
        position={[
          col * colWidth - width / 2,
          0,
          depth / 2 - shelfThickness / 2,
        ]}
        castShadow
      >
        <boxGeometry args={[shelfThickness, height, shelfThickness]} />
        <meshStandardMaterial
          color={COLORS.dark}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    );
    verticalSupports.push(
      <mesh
        key={`v-support-back-${col}`}
        position={[
          col * colWidth - width / 2,
          0,
          -depth / 2 + shelfThickness / 2,
        ]}
        castShadow
      >
        <boxGeometry args={[shelfThickness, height, shelfThickness]} />
        <meshStandardMaterial
          color={COLORS.dark}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    );
  }

  const neonLights = [];
  for (let row = 0; row < rows; row++) {
    neonLights.push(
      <mesh
        key={`neon-${row}`}
        position={[0, row * rowHeight - height / 2 + rowHeight * 0.9, depth / 2 + 0.05]}
      >
        <boxGeometry args={[width * 0.95, 0.02, 0.01]} />
        <meshBasicMaterial color={COLORS.neonBlue} transparent opacity={0.8} />
      </mesh>
    );
  }

  return (
    <group ref={groupRef} position={position}>
      <RigidBody type="fixed" position={position} colliders={false}>
        <CuboidCollider args={[width / 2, shelfThickness / 2, depth / 2]} />
      </RigidBody>

      {shelves}
      {verticalSupports}
      {neonLights}

      <mesh position={[0, -height / 2 - 0.05, 0]} receiveShadow>
        <boxGeometry args={[width + 0.5, 0.1, depth + 0.5]} />
        <meshStandardMaterial
          color={COLORS.dark}
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}
