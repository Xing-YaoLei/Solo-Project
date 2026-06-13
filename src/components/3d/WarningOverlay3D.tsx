import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/useGameStore';
import { Product } from '@/types';
import { COLORS, DEFECT_TYPES } from '@/utils/constants';

export default function WarningOverlay3D() {
  const warning = useGameStore((state) => state.warning);
  const products = useGameStore((state) => state.products);

  const warningProducts = useMemo(
    () => products.filter((p) => warning.productIds.includes(p.id) || p.isWarning),
    [products, warning.productIds]
  );

  return (
    <group>
      {warning.active && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <planeGeometry args={[60, 60]} />
          <meshBasicMaterial
            color={COLORS.warning}
            transparent
            opacity={warning.intensity * 0.05}
          />
        </mesh>
      )}

      {warningProducts.map((product) => (
        <WarningIndicator
          key={`warning-${product.id}`}
          product={product}
          intensity={warning.intensity}
        />
      ))}
    </group>
  );
}

interface WarningIndicatorProps {
  product: Product;
  intensity: number;
}

function WarningIndicator({ product, intensity }: WarningIndicatorProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (ringRef.current) {
      const scale = 1 + Math.sin(time * 5) * 0.1;
      ringRef.current.scale.setScalar(scale);
      ringRef.current.rotation.y = time * 2;
    }
    if (beamRef.current) {
      const pulse = 0.5 + Math.sin(time * 4) * 0.3;
      const material = beamRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = pulse * Math.max(0.3, intensity);
    }
  });

  if (product.isProcessed) return null;

  const defectColor =
    product.defectType && DEFECT_TYPES[product.defectType as keyof typeof DEFECT_TYPES]
      ? DEFECT_TYPES[product.defectType as keyof typeof DEFECT_TYPES].color
      : COLORS.warning;

  const isShortage = product.defectType === 'shortage';

  return (
    <group position={[product.position.x, product.position.y + 1, product.position.z]}>
      <mesh ref={ringRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.75, 32]} />
        <meshBasicMaterial
          color={isShortage ? COLORS.danger : defectColor}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh ref={beamRef} position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.05, 0.3, 3, 16, 1, true]} />
        <meshBasicMaterial
          color={isShortage ? COLORS.danger : defectColor}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      <pointLight
        position={[0, 0.5, 0]}
        color={isShortage ? COLORS.danger : defectColor}
        intensity={2 + intensity * 3}
        distance={4}
      />
    </group>
  );
}
