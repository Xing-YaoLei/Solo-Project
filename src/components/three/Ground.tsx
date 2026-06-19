import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { Grid } from '@react-three/drei';

const SIZE = 40;

export default function Ground() {
  const meshRef = useRef<THREE.Mesh>(null);

  const gridProps = useMemo(
    () => ({
      args: [SIZE, SIZE] as [number, number],
      cellSize: 1,
      cellThickness: 0.5,
      cellColor: '#1e293b',
      sectionSize: 5,
      sectionThickness: 1,
      sectionColor: '#334155',
      fadeDistance: 40,
      fadeStrength: 1,
      followCamera: false,
      infiniteGrid: false,
    }),
    []
  );

  return (
    <group>
      <RigidBody type="fixed" colliders="cuboid" friction={0.8} restitution={0.1}>
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[SIZE, SIZE]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.9}
            roughness={0.3}
            envMapIntensity={1.2}
          />
        </mesh>
      </RigidBody>

      <Grid position={[0, 0.01, 0]} {...gridProps} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[SIZE - 0.5, SIZE - 0.5]} />
        <meshBasicMaterial color="#1e293b" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
