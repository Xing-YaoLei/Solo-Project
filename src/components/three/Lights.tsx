import { useMemo } from 'react';
import type { Station } from '@/types';

interface LightsProps {
  stations?: Station[];
}

export default function Lights({ stations = [] }: LightsProps) {
  const stationLights = useMemo(() => {
    return stations.map((station) => ({
      id: station.id,
      position: [station.positionX, 4, station.positionZ] as [number, number, number],
    }));
  }, [stations]);

  return (
    <>
      <ambientLight intensity={0.4} color="#94a3b8" />

      <directionalLight
        position={[15, 25, 15]}
        intensity={1.2}
        color="#f8fafc"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0001}
      />

      <directionalLight
        position={[-10, 15, -10]}
        intensity={0.3}
        color="#60a5fa"
      />

      <hemisphereLight
        args={['#64748b', '#0f172a', 0.5]}
        intensity={0.6}
      />

      {stationLights.map((light) => (
        <pointLight
          key={light.id}
          position={light.position}
          intensity={0.8}
          color="#fbbf24"
          distance={8}
          decay={2}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-camera-near={0.5}
          shadow-camera-far={10}
        />
      ))}
    </>
  );
}
