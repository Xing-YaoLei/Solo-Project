import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import Shelf from './Shelf';
import Product3D from './Product3D';
import CheckoutCounter from './CheckoutCounter';
import PhysicsWorld from './PhysicsWorld';
import WarningOverlay3D from './WarningOverlay3D';
import { useGameStore } from '@/store/useGameStore';
import { Product, Settlement } from '@/types';
import { COLORS, SHELF_CONFIG } from '@/utils/constants';

interface GameSceneProps {
  onSelectProduct?: (product: Product) => void;
}

export default function GameScene({ onSelectProduct }: GameSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const products = useGameStore((state) => state.products);
  const settlements = useGameStore((state) => state.settlements);
  const warning = useGameStore((state) => state.warning);
  const selectProduct = useGameStore((state) => state.selectProduct);
  const selectedProductId = useGameStore((state) => state.selectedProductId);
  const phase = useGameStore((state) => state.phase);
  const setTimeRemaining = useGameStore((state) => state.setTimeRemaining);
  const endGame = useGameStore((state) => state.endGame);
  const timeRemaining = useGameStore((state) => state.timeRemaining);

  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 1, 0);
  }, [camera]);

  useFrame((_, delta) => {
    if (phase !== 'playing') return;

    lastTickRef.current += delta;
    if (lastTickRef.current >= 1) {
      lastTickRef.current = 0;
      const newTime = Math.max(0, timeRemaining - 1);
      setTimeRemaining(newTime);
      if (newTime <= 0) {
        endGame();
      }
    }
  });

  const counterPositions = useMemo(() => {
    const spacing = 3.5;
    const totalWidth = (settlements.length - 1) * spacing;
    return settlements.map((_, i) => {
      const x = -totalWidth / 2 + i * spacing;
      return [x, 0, 3] as [number, number, number];
    });
  }, [settlements.length]);

  const handleProductClick = (product: Product) => {
    if (product.isProcessed) return;
    if (selectedProductId === product.id) {
      selectProduct(null);
    } else {
      selectProduct(product.id);
      onSelectProduct?.(product);
    }
  };

  return (
    <>
      <color attach="background" args={[COLORS.bgDark]} />
      <fog attach="fog" args={[COLORS.bgDark, 15, 40]} />

      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[-8, 8, -5]} color={COLORS.neonBlue} intensity={1.5} distance={20} />
      <pointLight position={[8, 8, -5]} color={COLORS.neonPink} intensity={1} distance={15} />

      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      <PhysicsWorld>
        <group ref={groupRef}>
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.01, 0]}
            receiveShadow
          >
            <planeGeometry args={[60, 60]} />
            <meshStandardMaterial
              color={COLORS.dark}
              metalness={0.3}
              roughness={0.8}
            />
          </mesh>

          <gridHelper
            args={[60, 60, COLORS.darkGray, COLORS.darkGray]}
            position={[0, 0.01, 0]}
          />

          <Shelf
            position={[0, SHELF_CONFIG.height / 2, -3]}
            rows={SHELF_CONFIG.rows}
            cols={SHELF_CONFIG.cols}
            width={SHELF_CONFIG.width}
            height={SHELF_CONFIG.height}
            depth={SHELF_CONFIG.depth}
          />

          {products.map((product) => (
            <Product3D
              key={product.id}
              product={product}
              onClick={handleProductClick}
            />
          ))}

          {settlements.map((settlement: Settlement, index: number) => (
            <CheckoutCounter
              key={settlement.id}
              settlement={settlement}
              position={counterPositions[index]}
              index={index}
            />
          ))}
        </group>
      </PhysicsWorld>

      <Environment preset="night" />

      {warning.active && (
        <pointLight
          position={[0, 6, 0]}
          color={COLORS.warning}
          intensity={warning.intensity * 5}
          distance={30}
        />
      )}

      <WarningOverlay3D />

      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={18}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 1, 0]}
      />
    </>
  );
}
