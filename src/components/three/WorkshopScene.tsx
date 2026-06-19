import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import Ground from './Ground';
import Lights from './Lights';
import Station from './Station';
import Vehicle3D from './Vehicle3D';
import type { Station as StationType, Vehicle as VehicleType, WorkOrder } from '@/types';

interface WorkshopSceneProps {
  stations: StationType[];
  vehicles: VehicleType[];
  workOrders?: WorkOrder[];
  selectedStationId?: string | null;
  selectedVehicleId?: string | null;
  onSelectStation?: (station: StationType) => void;
  onSelectVehicle?: (vehicle: VehicleType) => void;
  vehiclePlacements?: Record<string, { stationId?: string; positionX?: number; positionZ?: number }>;
}

function SceneContent({
  stations,
  vehicles,
  workOrders = [],
  selectedStationId,
  selectedVehicleId,
  onSelectStation,
  onSelectVehicle,
  vehiclePlacements = {},
}: WorkshopSceneProps) {
  const stationStatusMap = useMemo(() => {
    const map = new Map<string, 'idle' | 'working' | 'occupied'>();
    stations.forEach((s) => {
      map.set(s.id, 'idle');
    });
    workOrders.forEach((wo) => {
      if (wo.stationId && (wo.status === 'assigned' || wo.status === 'in_progress' || wo.status === 'rework')) {
        map.set(wo.stationId, wo.status === 'in_progress' ? 'working' : 'occupied');
      }
    });
    stations.forEach((s) => {
      if (s.busy && map.get(s.id) === 'idle') {
        map.set(s.id, 'occupied');
      }
    });
    return map;
  }, [stations, workOrders]);

  const vehicleWorkOrderMap = useMemo(() => {
    const map = new Map<string, WorkOrder>();
    workOrders.forEach((wo) => {
      if (wo.status === 'assigned' || wo.status === 'in_progress' || wo.status === 'rework') {
        map.set(wo.vehicleId, wo);
      }
    });
    return map;
  }, [workOrders]);

  const renderVehicles = () => {
    return vehicles.map((vehicle) => {
      const placement = vehiclePlacements[vehicle.id];
      const workOrder = vehicleWorkOrderMap.get(vehicle.id);
      let posX: number;
      let posZ: number;

      if (placement?.stationId) {
        const station = stations.find((s) => s.id === placement.stationId);
        if (station) {
          posX = station.positionX;
          posZ = station.positionZ;
        } else {
          posX = placement.positionX ?? 0;
          posZ = placement.positionZ ?? 0;
        }
      } else if (placement?.positionX !== undefined && placement?.positionZ !== undefined) {
        posX = placement.positionX;
        posZ = placement.positionZ;
      } else {
        const idx = vehicles.indexOf(vehicle);
        const row = Math.floor(idx / 3);
        const col = idx % 3;
        posX = -12 + col * 4;
        posZ = 12 - row * 3;
      }

      const isRepairing = workOrder?.status === 'in_progress';

      return (
        <Vehicle3D
          key={vehicle.id}
          vehicle={vehicle}
          position={[posX, 0, posZ]}
          isRepairing={isRepairing}
          selected={selectedVehicleId === vehicle.id}
          onSelect={onSelectVehicle}
        />
      );
    });
  };

  return (
    <>
      <Lights stations={stations} />

      <Environment preset="city" />

      <Ground />

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.5}
        scale={50}
        blur={2.5}
        far={10}
        resolution={1024}
        color="#000000"
      />

      <group>
        {stations.map((station) => (
          <Station
            key={station.id}
            station={station}
            status={stationStatusMap.get(station.id) ?? 'idle'}
            selected={selectedStationId === station.id}
            onSelect={onSelectStation}
          />
        ))}
      </group>

      <group>{renderVehicles()}</group>
    </>
  );
}

export default function WorkshopScene(props: WorkshopSceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 18, 22], fov: 45, near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}
    >
      <fog attach="fog" args={['#0f172a', 30, 60]} />

      <Suspense fallback={null}>
        <Physics
          gravity={[0, -9.81, 0]}
          paused={true}
          timeStep="vary"
        >
          <SceneContent {...props} />
        </Physics>
      </Suspense>

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={8}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 8}
        target={[0, 0, 0]}
        enablePan={true}
        panSpeed={0.8}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
      />
    </Canvas>
  );
}
