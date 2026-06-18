import { useRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { DeliveryBatch, Supplier, Material } from '../../types';

interface DeliveryTruckProps {
  delivery: DeliveryBatch;
  supplier?: Supplier;
  material: Material;
  totalDays: number;
}

export function DeliveryTruck({ delivery, supplier, material, totalDays }: DeliveryTruckProps) {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const daysUntilDelivery = delivery.scheduledDay - totalDays;
    const progress = Math.min(1, Math.max(0, 1 - daysUntilDelivery / 5));
    const startX = supplier ? supplier.position.x : -10;
    const startZ = supplier ? supplier.position.y : -10;
    const targetX = 0;
    const targetZ = 0;

    groupRef.current.position.x = startX + (targetX - startX) * progress;
    groupRef.current.position.z = startZ + (targetZ - startZ) * progress;
    groupRef.current.rotation.y = Math.atan2(
      targetX - startX,
      targetZ - startZ
    );
  });

  return (
    <group ref={groupRef} position={[-10, 0.5, -10]}>
      <RigidBody type="kinematicPosition">
        <mesh castShadow position={[0, 0.5, 0]}>
          <boxGeometry args={[2, 1, 4]} />
          <meshStandardMaterial color={material.color} />
        </mesh>

        <mesh position={[0, 1.2, 0.8]}>
          <boxGeometry args={[1.8, 0.8, 2]} />
          <meshStandardMaterial color="#333" />
        </mesh>

        <mesh position={[-0.8, 0.2, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color="#111" />
        </mesh>

        <mesh position={[0.8, 0.2, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color="#111" />
        </mesh>

        <mesh position={[-0.8, 0.2, -1.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color="#111" />
        </mesh>

        <mesh position={[0.8, 0.2, -1.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color="#111" />
        </mesh>

        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[1.5, 0.2, 1.5]} />
          <meshStandardMaterial color={material.color} emissive={material.color} emissiveIntensity={0.3} />
        </mesh>
      </RigidBody>
    </group>
  );
}
