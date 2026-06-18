import { useState, useRef, useCallback } from 'react';
import { Mesh, Group } from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Supplier } from '../../types';
import { MATERIALS } from '../../config/gameConfig';
import { Html } from '@react-three/drei';

interface SupplierNodeProps {
  supplier: Supplier;
  onPositionChange: (x: number, y: number) => void;
}

export function SupplierNode({ supplier, onPositionChange }: SupplierNodeProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const supplierColors = ['#4A90D9', '#50C878', '#E67E22', '#9B59B6'];
  const colorIndex = parseInt(supplier.id.replace(/\D/g, '')) % supplierColors.length;
  const baseColor = supplierColors[colorIndex] || '#4A90D9';

  useFrame((state) => {
    if (meshRef.current && !isDragging) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(true);
    const target = e.target as unknown as HTMLElement;
    if (target && 'setPointerCapture' in target) {
      target.setPointerCapture(e.pointerId);
    }
  }, []);

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(false);
    if (groupRef.current) {
      const pos = groupRef.current.position;
      onPositionChange(pos.x, pos.z);
    }
  }, [onPositionChange]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !groupRef.current) return;
    e.stopPropagation();

    const x = e.point.x;
    const z = e.point.z;

    groupRef.current.position.x = Math.max(-15, Math.min(15, x));
    groupRef.current.position.z = Math.max(-10, Math.min(10, z));
  }, [isDragging]);

  const handlePointerOver = useCallback(() => {
    setIsHovered(true);
    document.body.style.cursor = 'grab';
  }, []);

  const handlePointerOut = useCallback(() => {
    setIsHovered(false);
    document.body.style.cursor = 'auto';
  }, []);

  return (
    <group
      ref={groupRef}
      position={[supplier.position.x, 0, supplier.position.y]}
    >
      <RigidBody type="dynamic" colliders={false} position={[supplier.position.x, 2, supplier.position.y]}>
        <CuboidCollider args={[1.5, 2, 1.5]} />
        <mesh
          ref={meshRef}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={() => setShowInfo(!showInfo)}
          castShadow
          position={[0, 2, 0]}
          scale={isHovered ? 1.1 : 1}
        >
          <boxGeometry args={[3, 4, 3]} />
          <meshStandardMaterial
            color={baseColor}
            emissive={isHovered ? '#ffffff' : '#000000'}
            emissiveIntensity={isHovered ? 0.2 : 0}
            roughness={0.5}
            metalness={0.3}
          />
        </mesh>

        <mesh position={[0, 4.2, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
          <meshStandardMaterial color="#FFD700" />
        </mesh>

        <mesh position={[0, 4.5, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={0.5} />
        </mesh>
      </RigidBody>

      {showInfo && (
        <Html
          position={[0, 5, 0]}
          center
          distanceFactor={10}
        >
          <div className="bg-white rounded-lg p-4 shadow-xl min-w-[200px] border-2 border-gray-200">
            <h3 className="font-bold text-lg mb-2 text-gray-800">{supplier.name}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>配送时间:</strong> {supplier.deliveryTime}天</p>
              <p><strong>可靠性:</strong> {supplier.reliability * 100}%</p>
              <p><strong>供应材料:</strong></p>
              <div className="flex flex-wrap gap-1 mt-1">
                {supplier.materials.map(m => (
                  <span
                    key={m}
                    className="px-2 py-1 rounded text-xs"
                    style={{ backgroundColor: MATERIALS[m].color + '30', color: MATERIALS[m].color }}
                  >
                    {MATERIALS[m].icon} {MATERIALS[m].name}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">点击关闭</p>
          </div>
        </Html>
      )}

      <Html position={[0, -0.5, 0]} center>
        <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
          {supplier.name}
        </div>
      </Html>
    </group>
  );
}
