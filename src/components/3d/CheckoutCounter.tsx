import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Settlement } from '@/types';
import { COLORS } from '@/utils/constants';
import { useGameStore } from '@/store/useGameStore';

interface CheckoutCounterProps {
  settlement: Settlement;
  position: [number, number, number];
  index: number;
}

export default function CheckoutCounter({
  settlement,
  position,
  index,
}: CheckoutCounterProps) {
  const counterRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const selectedProductId = useGameStore((state) => state.selectedProductId);
  const submitProduct = useGameStore((state) => state.submitProduct);
  const selectProduct = useGameStore((state) => state.selectProduct);

  const hasSelectedProduct = selectedProductId !== null;

  useFrame((state) => {
    if (!counterRef.current) return;

    if (hasSelectedProduct && hovered) {
      const time = state.clock.getElapsedTime();
      const glow = 0.5 + Math.sin(time * 3) * 0.3;
      counterRef.current.scale.setScalar(1 + glow * 0.02);
    }
  });

  const handleClick = () => {
    if (selectedProductId) {
      submitProduct(selectedProductId, settlement.id);
      selectProduct(null);
    }
  };

  const counterWidth = 2.5;
  const counterHeight = 1;
  const counterDepth = 1.5;

  return (
    <group ref={counterRef} position={position}>
      <RigidBody type="fixed" position={position}>
        <CuboidCollider args={[counterWidth / 2, counterHeight / 2, counterDepth / 2]} />
      </RigidBody>

      <group
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <mesh position={[0, counterHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[counterWidth, counterHeight, counterDepth]} />
          <meshStandardMaterial
            color={hovered && hasSelectedProduct ? COLORS.primary : COLORS.darkGray}
            emissive={hovered && hasSelectedProduct ? COLORS.primary : settlement.batchId ? `hsl(${settlement.batchId * 60}, 70%, 40%)` : COLORS.dark}
            emissiveIntensity={hovered && hasSelectedProduct ? 0.4 : 0.1}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>

        <mesh position={[0, counterHeight + 0.05, 0]}>
          <boxGeometry args={[counterWidth * 0.9, 0.1, counterDepth * 0.9]} />
          <meshStandardMaterial
            color={COLORS.neonBlue}
            emissive={COLORS.neonBlue}
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>

        {[...Array(3)].map((_, i) => (
          <mesh
            key={i}
            position={[
              -counterWidth / 2 + 0.3 + i * (counterWidth * 0.6 / 2),
              counterHeight + 0.3 + i * 0.02,
              0,
            ]}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
            <meshBasicMaterial color={COLORS.neonBlue} transparent opacity={0.6} />
          </mesh>
        ))}

        <Html
          position={[0, counterHeight + 1.2, 0]}
          center
          distanceFactor={6}
          zIndexRange={[50, 0]}
        >
          <div
            className={`
              px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap
              border-2 backdrop-blur-sm
              ${hovered && hasSelectedProduct
                ? 'bg-blue-500/30 border-blue-400 text-blue-200 scale-105'
                : 'bg-gray-900/80 border-gray-600 text-gray-200'
              }
              transition-all duration-200
            `}
          >
            <div className="text-center">
              <div className="text-base" style={{ color: `hsl(${settlement.batchId * 60 + 180}, 80%, 60%)` }}>
                {settlement.customerName}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                取货码: {settlement.pickupCode}
              </div>
              <div className="text-xs text-yellow-400 mt-1">
                ¥{settlement.totalAmount.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {settlement.productIds.length} 件商品
              </div>
            </div>
          </div>
        </Html>
      </group>

      <pointLight
        position={[0, counterHeight + 0.5, 0]}
        color={hovered && hasSelectedProduct ? COLORS.primary : COLORS.neonBlue}
        intensity={hovered && hasSelectedProduct ? 3 : 1.5}
        distance={4}
      />
    </group>
  );
}
