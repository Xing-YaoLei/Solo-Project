import { useMemo, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { Seat } from '../../types';
import { SeatsGroup } from './SeatsGroup';
import { Stage } from './Stage';

interface VenueSceneProps {
  seats: Seat[];
  selectedSeatIds: string[];
  hoveredSeatId: string | null;
  onSeatClick: (seatId: string) => void;
  onSeatHover: (seatId: string | null) => void;
  stagePosition?: [number, number, number];
  interactive?: boolean;
  cameraResetKey?: number;
  onSeatLongPress?: (seatId: string) => void;
}

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 12, 14);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);

function CameraResetController({ resetKey }: { resetKey: number }) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const animating = useRef(false);
  const animStart = useRef(0);
  const startPos = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const prevKey = useRef(0);

  useEffect(() => {
    if (resetKey !== prevKey.current) {
      prevKey.current = resetKey;
      startPos.current.copy(camera.position);
      startTarget.current.copy(controlsRef.current?.target || DEFAULT_CAMERA_TARGET);
      animStart.current = performance.now();
      animating.current = true;
    }
  }, [resetKey, camera]);

  useFrame(() => {
    if (!animating.current) return;
    const elapsed = performance.now() - animStart.current;
    const duration = 800;
    const t = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);

    camera.position.lerpVectors(startPos.current, DEFAULT_CAMERA_POS, eased);
    if (controlsRef.current) {
      controlsRef.current.target.lerpVectors(startTarget.current, DEFAULT_CAMERA_TARGET, eased);
      controlsRef.current.update();
    }

    if (t >= 1) {
      animating.current = false;
    }
  });

  return <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.08} minDistance={6} maxDistance={35} minPolarAngle={0.2} maxPolarAngle={Math.PI / 2.1} enablePan panSpeed={0.8} rotateSpeed={0.6} zoomSpeed={0.9} />;
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.4} color={0xe0e7ff} />
      <directionalLight
        position={[8, 15, 5]}
        intensity={0.7}
        color={0xfef3c7}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
      <directionalLight position={[-10, 12, 8]} intensity={0.3} color={0xbfdbfe} />
      <pointLight position={[0, 8, 0]} intensity={0.5} color={0xfef9c3} distance={30} />
    </>
  );
}

function VenueFloor() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.05, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color={0x1e293b} metalness={0.5} roughness={0.7} />
    </mesh>
  );
}

function VenueWalls({ seatDepth = 8 }: { seatDepth?: number }) {
  const wallMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.1, roughness: 0.95 }),
    []
  );

  return (
    <>
      <mesh position={[0, 5, -seatDepth - 8]} castShadow>
        <boxGeometry args={[24, 12, 0.5]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[-12, 5, -seatDepth]} castShadow>
        <boxGeometry args={[0.5, 12, seatDepth * 2 + 10]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[12, 5, -seatDepth]} castShadow>
        <boxGeometry args={[0.5, 12, seatDepth * 2 + 10]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
    </>
  );
}

function SceneContent({
  seats,
  selectedSeatIds,
  hoveredSeatId,
  onSeatClick,
  onSeatHover,
  stagePosition,
  interactive,
  onSeatLongPress,
}: VenueSceneProps) {
  const maxZ = useMemo(() => {
    if (seats.length === 0) return 8;
    return Math.max(...seats.map((s) => Math.abs(s.z))) + 4;
  }, [seats]);

  return (
    <>
      <SceneLights />
      <Environment preset="apartment" />
      <VenueFloor />
      <VenueWalls seatDepth={maxZ} />
      <Stage position={stagePosition} />
      <SeatsGroup
        seats={seats}
        selectedSeatIds={selectedSeatIds}
        hoveredSeatId={hoveredSeatId}
        onSeatClick={interactive ? onSeatClick : () => {}}
        onSeatHover={interactive ? onSeatHover : () => {}}
        onSeatLongPress={interactive ? onSeatLongPress : undefined}
      />
      <EffectComposer multisampling={8}>
        <Bloom
          luminanceThreshold={0.4}
          luminanceSmoothing={0.3}
          intensity={0.6}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.3} darkness={0.7} />
      </EffectComposer>
    </>
  );
}

export function VenueScene(props: VenueSceneProps) {
  const cameraPosition: [number, number, number] = [0, 12, 14];

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default';
    };
  }, []);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      camera={{ position: cameraPosition, fov: 50, near: 0.1, far: 200 }}
    >
      <SceneContent {...props} />
      <CameraResetController resetKey={props.cameraResetKey || 0} />
    </Canvas>
  );
}
