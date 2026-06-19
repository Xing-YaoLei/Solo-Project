import { useState, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { Vehicle as VehicleType } from '@/types';

interface Vehicle3DProps {
  vehicle: VehicleType;
  position?: [number, number, number];
  rotation?: [number, number, number];
  isRepairing?: boolean;
  selected?: boolean;
  onSelect?: (vehicle: VehicleType) => void;
}

export default function Vehicle3D({
  vehicle,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isRepairing = false,
  selected = false,
  onSelect,
}: Vehicle3DProps) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const floatRef = useRef<THREE.Group>(null);

  const bodyColor = useMemo(() => {
    return new THREE.Color(vehicle.color || '#64748b');
  }, [vehicle.color]);

  const wheelColor = useMemo(() => new THREE.Color('#1f2937'), []);
  const windowColor = useMemo(() => new THREE.Color('#0ea5e9'), []);

  useFrame((state) => {
    if (floatRef.current && isRepairing) {
      const t = state.clock.getElapsedTime();
      floatRef.current.position.y = Math.sin(t * 2.5) * 0.06;
      floatRef.current.rotation.x = Math.sin(t * 1.8) * 0.01;
      floatRef.current.rotation.z = Math.cos(t * 2.2) * 0.01;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(vehicle);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <group ref={floatRef}>
        <group position={[0, 0.4, 0]}>
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.6, 0.55, 3.6]} />
            <meshStandardMaterial
              color={bodyColor}
              metalness={0.7}
              roughness={0.25}
            />
          </mesh>

          <mesh position={[0, 0.85, -0.2]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.55, 1.9]} />
            <meshStandardMaterial
              color={bodyColor}
              metalness={0.7}
              roughness={0.25}
            />
          </mesh>

          <mesh position={[0, 0.9, 0.45]} castShadow>
            <boxGeometry args={[1.42, 0.4, 0.04]} />
            <meshStandardMaterial
              color={windowColor}
              metalness={0.9}
              roughness={0.1}
              transparent
              opacity={0.7}
            />
          </mesh>

          <mesh position={[0, 0.9, -0.45]} castShadow>
            <boxGeometry args={[1.42, 0.4, 0.04]} />
            <meshStandardMaterial
              color={windowColor}
              metalness={0.9}
              roughness={0.1}
              transparent
              opacity={0.7}
            />
          </mesh>

          <mesh position={[0.78, 0.9, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <boxGeometry args={[0.86, 0.4, 0.04]} />
            <meshStandardMaterial
              color={windowColor}
              metalness={0.9}
              roughness={0.1}
              transparent
              opacity={0.7}
            />
          </mesh>

          <mesh position={[-0.78, 0.9, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <boxGeometry args={[0.86, 0.4, 0.04]} />
            <meshStandardMaterial
              color={windowColor}
              metalness={0.9}
              roughness={0.1}
              transparent
              opacity={0.7}
            />
          </mesh>

          <mesh position={[0, 0.38, 1.75]} castShadow>
            <boxGeometry args={[1.5, 0.4, 0.08]} />
            <meshStandardMaterial
              color="#e5e7eb"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>

          <mesh position={[0.55, 0.38, 1.77]} castShadow>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial
              color="#fef3c7"
              emissive="#fbbf24"
              emissiveIntensity={hovered || selected ? 1 : 0.5}
            />
          </mesh>
          <mesh position={[-0.55, 0.38, 1.77]} castShadow>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial
              color="#fef3c7"
              emissive="#fbbf24"
              emissiveIntensity={hovered || selected ? 1 : 0.5}
            />
          </mesh>

          <mesh position={[0.55, 0.38, -1.77]} castShadow>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#dc2626"
              emissiveIntensity={hovered || selected ? 1 : 0.4}
            />
          </mesh>
          <mesh position={[-0.55, 0.38, -1.77]} castShadow>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#dc2626"
              emissiveIntensity={hovered || selected ? 1 : 0.4}
            />
          </mesh>
        </group>

        <group position={[0, 0.25, 0]}>
          {[
            [0.85, 1.2] as [number, number],
            [-0.85, 1.2] as [number, number],
            [0.85, -1.2] as [number, number],
            [-0.85, -1.2] as [number, number],
          ].map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.28, 0.28, 0.2, 24]} />
                <meshStandardMaterial
                  color={wheelColor}
                  metalness={0.8}
                  roughness={0.4}
                />
              </mesh>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.18, 0.18, 0.22, 12]} />
                <meshStandardMaterial
                  color="#9ca3af"
                  metalness={0.9}
                  roughness={0.3}
                />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      <mesh
        position={[0, 0.03, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[1.1, 1.25, 64]} />
        <meshBasicMaterial
          color={selected ? '#3b82f6' : hovered ? '#60a5fa' : '#22c55e'}
          transparent
          opacity={selected ? 0.9 : hovered ? 0.5 : isRepairing ? 0.35 : 0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {selected && (
        <mesh
          position={[0, 0.04, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[1.25, 1.35, 64]} />
          <meshBasicMaterial
            color="#3b82f6"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {isRepairing && (
        <pointLight
          position={[0, 1.8, 0]}
          color="#fbbf24"
          intensity={0.6}
          distance={4}
          decay={2}
        />
      )}
    </group>
  );
}
