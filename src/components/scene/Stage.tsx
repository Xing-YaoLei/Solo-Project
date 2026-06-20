import { useMemo } from 'react';
import * as THREE from 'three';

interface StageProps {
  position?: [number, number, number];
}

export function Stage({ position = [0, 0.5, -10] }: StageProps) {
  const curtainColor = useMemo(() => new THREE.Color(0x8B0000), []);

  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[16, 1, 4]} />
        <meshStandardMaterial color={0x2a2a2a} metalness={0.6} roughness={0.3} />
      </mesh>

      <mesh position={[0, -0.05, 2.05]}>
        <boxGeometry args={[16, 0.08, 0.2]} />
        <meshStandardMaterial
          color={0x1e293b}
          metalness={0.8}
          roughness={0.2}
          emissive={0x0f172a}
          emissiveIntensity={0.5}
        />
      </mesh>

      {[-1, 0, 1].map((i) => (
        <mesh key={`spot-${i}`} position={[i * 4, 3.5, -1.5]}>
          <spotLight
            castShadow
            angle={0.5}
            penumbra={0.6}
            intensity={1.5}
            distance={15}
            color={0xfef3c7}
            shadow-mapSize-width={512}
            shadow-mapSize-height={512}
            target-position={[i * 4, 0, 5]}
          />
          <coneGeometry args={[0.3, 0.5, 8]} />
          <meshStandardMaterial color={0x1f2937} metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {[-7.5, 7.5].map((x, i) => (
        <group key={`pillar-${i}`} position={[x, 2.5, -1.5]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.15, 0.2, 6, 12]} />
            <meshStandardMaterial color={0x78350f} metalness={0.3} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {[-6, -3, 0, 3, 6].map((x, i) => (
        <mesh key={`curtain-${i}`} position={[x, 2.5, -2]} castShadow>
          <boxGeometry args={[2.8, 5.5, 0.15]} />
          <meshStandardMaterial
            color={curtainColor}
            side={THREE.DoubleSide}
            metalness={0.05}
            roughness={0.95}
          />
        </mesh>
      ))}

      <mesh position={[0, 4.5, -1.8]}>
        <boxGeometry args={[15.5, 0.4, 0.3]} />
        <meshStandardMaterial color={0x451a03} metalness={0.2} roughness={0.8} />
      </mesh>

      <mesh position={[0, -0.2, 0]}>
        <circleGeometry args={[6, 48]} />
        <meshStandardMaterial
          color={0x0c0a09}
          metalness={0.4}
          roughness={0.5}
          emissive={0x78350f}
          emissiveIntensity={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
