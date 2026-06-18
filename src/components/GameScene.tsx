import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { OrbitControls, Environment } from '@react-three/drei';
import { Ground } from './three/Ground';
import { SupplierNode } from './three/SupplierNode';
import { MaterialStack } from './three/MaterialStack';
import { DeliveryTruck } from './three/DeliveryTruck';
import { useGameStore } from '../store/gameStore';
import { MATERIALS } from '../config/gameConfig';

export function GameScene() {
  const suppliers = useGameStore(state => state.suppliers);
  const inventory = useGameStore(state => state.inventory);
  const deliveries = useGameStore(state => state.deliveries);
  const currentDay = useGameStore(state => state.currentDay);
  const updateSupplierPosition = useGameStore(state => state.updateSupplierPosition);

  const pendingDeliveries = deliveries.filter(d => d.status === 'pending' && d.scheduledDay >= currentDay);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 15, 20], fov: 45 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#87CEEB']} />
      <ambientLight intensity={0.4} />
      <directionalLight
        castShadow
        position={[10, 20, 10]}
        intensity={1}
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />

      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>

      <Physics gravity={[0, -9.81, 0]}>
        <Ground />

        {suppliers.map((supplier) => (
          <SupplierNode
            key={supplier.id}
            supplier={supplier}
            onPositionChange={(x, y) => updateSupplierPosition(supplier.id, x, y)}
          />
        ))}

        {inventory.map((inv) => {
          const material = MATERIALS[inv.materialType];
          const index = inventory.indexOf(inv);
          const x = -6 + (index % 4) * 3;
          return (
            <MaterialStack
              key={inv.materialType}
              material={material}
              quantity={inv.quantity}
              position={[x, 0, -5]}
            />
          );
        })}

        {pendingDeliveries.slice(0, 3).map((delivery) => {
          const supplier = suppliers.find(s => s.id === delivery.supplierId);
          const material = MATERIALS[delivery.materialType];
          return (
            <DeliveryTruck
              key={delivery.id}
              delivery={delivery}
              supplier={supplier}
              material={material}
              totalDays={currentDay}
            />
          );
        })}
      </Physics>

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.2}
      />
    </Canvas>
  );
}
