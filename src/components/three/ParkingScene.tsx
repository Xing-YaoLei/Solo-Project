import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Sky, Stars, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { PlayerController } from './PlayerController';
import { ParkingSpot } from './ParkingSpot';
import { AccessCard } from './AccessCard';
import { Building } from './Building';
import { Gate } from './Gate';
import { StreetLight } from './StreetLight';
import { PatrolPointMarker } from './PatrolPointMarker';
import { EmergencyMarker } from './EmergencyMarker';
import { useGameStore } from '@/store/gameStore';
import { usePatrol } from '@/hooks/usePatrol';
import { useBilling } from '@/hooks/useBilling';
import { useGameLoop } from '@/hooks/useGameLoop';
import { loadSettings } from '@/utils/storage';
import { useBillPanel } from '@/pages/GameScene';

const Ground = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#1e293b" roughness={0.8} />
    </mesh>
  );
};

const ParkingLines = () => {
  const lines = useMemo(() => {
    const result: { start: [number, number, number]; end: [number, number, number] }[] = [];
    for (let i = -10; i <= 10; i += 5) {
      result.push({ start: [i, 0.02, -15], end: [i, 0.02, 15] });
    }
    return result;
  }, []);

  return (
    <group>
      {lines.map((line, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([...line.start, ...line.end])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#fbbf24" linewidth={2} />
        </line>
      ))}
    </group>
  );
};

const SceneContent = () => {
  const spots = useGameStore(state => state.spots);
  const accessRecords = useGameStore(state => state.accessRecords);
  const emergencies = useGameStore(state => state.emergencies);
  const { getPatrolOrder } = usePatrol();
  const { getBillForSpot } = useBilling();
  const { openBillPanel } = useBillPanel();
  const settings = loadSettings();
  
  useGameLoop();
  
  const patrolOrder = getPatrolOrder();
  const streetLightPositions: [number, number, number][] = [
    [-12, 0, -12], [12, 0, -12], [-12, 0, 12], [12, 0, 12],
    [0, 0, -14], [0, 0, 14], [-14, 0, 0], [14, 0, 0],
  ];

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      >
        <orthographicCamera attach="shadow-camera" args={[-25, 25, 25, -25, 0.1, 50]} />
      </directionalLight>
      
      <hemisphereLight args={['#ff8a00', '#3b82f6', 0.4]} />
      
      <Sky sunPosition={[100, 20, 100]} turbidity={10} rayleigh={2} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {settings.postProcessingEnabled && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={0.5} />
          <Vignette eskil={false} offset={0.1} darkness={0.5} />
        </EffectComposer>
      )}
      
      <Ground />
      <ParkingLines />
      
      <Physics>
        <PlayerController speed={5} />
        
        {spots.map(spot => (
          <ParkingSpot
            key={spot.id}
            spot={spot}
            onClick={() => {
              const bill = getBillForSpot(spot.id);
              if (bill) {
                openBillPanel(bill.id);
              }
            }}
          />
        ))}
        
        {accessRecords.map(record => (
          <AccessCard key={record.id} record={record} />
        ))}
      </Physics>
      
      {patrolOrder.map((point, index) => (
        <PatrolPointMarker
          key={point.id}
          point={point}
          isCurrent={point.isCurrent}
          isNext={point.isNext}
        />
      ))}
      
      {emergencies.map(emergency => (
        <EmergencyMarker key={emergency.id} emergency={emergency} />
      ))}
      
      <Building position={[0, 0, -12]} size={[10, 8, 6]} color="#334155" />
      <Building position={[-12, 0, 8]} size={[6, 6, 8]} color="#475569" />
      <Building position={[12, 0, 8]} size={[6, 5, 7]} color="#475569" />
      
      <Gate />
      
      {streetLightPositions.map((pos, i) => (
        <StreetLight key={i} position={pos} />
      ))}
      
      <Environment preset="sunset" />
    </>
  );
};

export const ParkingScene = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 5], fov: 75, near: 0.1, far: 1000 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneContent />
    </Canvas>
  );
};
