import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';

export type OrderNodeType = 'pickup' | 'delivery' | 'waypoint';

interface OrderNodeProps {
  position: [number, number, number];
  type: OrderNodeType;
  label?: string;
  orderNo?: string;
  highlighted?: boolean;
  onClick?: () => void;
}

export const OrderNode = ({
  position,
  type,
  label,
  orderNo,
  highlighted = false,
  onClick,
}: OrderNodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const colors: Record<OrderNodeType, { main: string; ring: string; emissive: string }> = {
    pickup: { main: '#10b981', ring: '#34d399', emissive: '#059669' },
    delivery: { main: '#f97316', ring: '#fb923c', emissive: '#ea580c' },
    waypoint: { main: '#6366f1', ring: '#818cf8', emissive: '#4f46e5' },
  };
  const c = colors[type];
  const active = highlighted || hovered || clicked;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + 0.8 + Math.sin(t * 2) * 0.15;
      meshRef.current.rotation.y = t * 0.8;
    }
    if (ringRef.current) {
      const scale = 1 + Math.sin(t * 3) * 0.15 + (active ? 0.3 : 0);
      ringRef.current.scale.set(scale, 1, scale);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = active ? 0.9 : 0.4;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setClicked(p => !p);
    onClick?.();
  };

  const iconMap: Record<OrderNodeType, string> = {
    pickup: '📦',
    delivery: '🏠',
    waypoint: '📍',
  };

  return (
    <group position={[position[0], 0, position[2]]}>
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.03, 0]}
      >
        <ringGeometry args={[0.6, 0.85, 48]} />
        <meshBasicMaterial
          color={c.ring}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={handleClick}
        castShadow
      >
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshStandardMaterial
          color={c.main}
          emissive={c.emissive}
          emissiveIntensity={active ? 1.2 : 0.6}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      <Billboard position={[0, 1.8, 0]}>
        <Text
          fontSize={0.5}
          color="#f8fafc"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#0f172a"
        >
          {iconMap[type]}
        </Text>
        {label && (
          <Text
            position={[0, -0.5, 0]}
            fontSize={0.22}
            color="#f8fafc"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#0f172a"
            maxWidth={4}
          >
            {label}
          </Text>
        )}
        {orderNo && (
          <Text
            position={[0, -0.85, 0]}
            fontSize={0.16}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#0f172a"
          >
            {orderNo}
          </Text>
        )}
      </Billboard>
    </group>
  );
};
