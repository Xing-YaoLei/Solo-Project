import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Product } from '@/types';
import { COLORS, DEFECT_TYPES } from '@/utils/constants';
import { useGameStore } from '@/store/useGameStore';

interface Product3DProps {
  product: Product;
  onClick?: (product: Product) => void;
}

export default function Product3D({ product, onClick }: Product3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const selectedProductId = useGameStore((state) => state.selectedProductId);
  const isSelected = selectedProductId === product.id;

  useFrame((state) => {
    if (!meshRef.current) return;

    if (product.isWarning || isSelected) {
      const time = state.clock.getElapsedTime();
      const pulse = 1 + Math.sin(time * 4) * 0.1;
      meshRef.current.scale.setScalar(pulse);
    } else {
      meshRef.current.scale.setScalar(hovered ? 1.05 : 1);
    }

    if (product.isWarning && !pulsing) {
      setPulsing(true);
    }
  });

  const getBaseColor = () => {
    if (product.isProcessed) return COLORS.lightGray;
    if (product.isDefective) {
      const defectType = product.defectType;
      if (defectType && DEFECT_TYPES[defectType as keyof typeof DEFECT_TYPES]) {
        return DEFECT_TYPES[defectType as keyof typeof DEFECT_TYPES].color;
      }
      return COLORS.danger;
    }
    return product.tagColor;
  };

  const getEmissiveColor = () => {
    if (product.isWarning) return COLORS.warning;
    if (isSelected) return COLORS.primary;
    if (hovered) return product.tagColor;
    return '#000000';
  };

  if (product.isProcessed) {
    return null;
  }

  return (
    <group position={[product.position.x, product.position.y + 1, product.position.z]}>
      <RigidBody
        type="dynamic"
        mass={1}
        restitution={0.2}
        friction={0.8}
        enabledTranslations={[true, true, false]}
        position={[product.position.x, product.position.y + 2, product.position.z]}
      >
        <CuboidCollider args={[product.size.x / 2, product.size.y / 2, product.size.z / 2]} />
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(product);
          }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          castShadow
        >
          <boxGeometry args={[product.size.x, product.size.y, product.size.z]} />
          <meshStandardMaterial
            color={getBaseColor()}
            emissive={getEmissiveColor()}
            emissiveIntensity={product.isWarning ? 0.5 : isSelected ? 0.3 : 0.1}
            metalness={0.3}
            roughness={0.5}
            transparent={product.isDefective}
            opacity={product.isDefective ? 0.9 : 1}
          />
        </mesh>

        <mesh position={[0, product.size.y / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[product.size.x * 0.8, 0.3]} />
          <meshBasicMaterial color={product.tagColor} transparent opacity={0.9} />
        </mesh>

        {hovered && (
          <Html
            position={[0, product.size.y / 2 + 0.5, 0]}
            center
            distanceFactor={8}
            zIndexRange={[100, 0]}
          >
            <div className="bg-gray-900/95 border border-blue-500/50 rounded-lg px-3 py-2 text-white text-sm whitespace-nowrap shadow-lg backdrop-blur-sm">
              <div className="font-bold text-blue-400">{product.name}</div>
              <div className="text-xs text-gray-300">SKU: {product.sku}</div>
              <div className="text-xs text-yellow-400">¥{product.price.toFixed(2)}</div>
              {product.isDefective && (
                <div className="text-xs text-red-400 mt-1">
                  ⚠️ {product.defectType && DEFECT_TYPES[product.defectType as keyof typeof DEFECT_TYPES]?.label}
                </div>
              )}
            </div>
          </Html>
        )}
      </RigidBody>

      {product.isWarning && (
        <pointLight position={[0, 0.5, 0]} color={COLORS.warning} intensity={2} distance={3} />
      )}
    </group>
  );
}
