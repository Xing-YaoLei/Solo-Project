import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';

interface RiderProps {
  path: Array<[number, number, number]>;
  speed?: number;
  riderId?: string;
  riderName?: string;
  onProgress?: (progress: number, position: [number, number, number]) => void;
  onComplete?: () => void;
  color?: string;
}

export const Rider = ({
  path,
  speed = 0.008,
  riderId = 'rider-001',
  riderName = '骑手小李',
  onProgress,
  onComplete,
  color = '#f97316',
}: RiderProps) => {
  const bodyRef = useRef<any>(null);
  const wheelRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);
  const completedRef = useRef(false);

  const curve = useMemoCurve(path);

  useEffect(() => {
    progressRef.current = 0;
    completedRef.current = false;
  }, [path]);

  useFrame(() => {
    if (!curve || !bodyRef.current) return;

    if (progressRef.current < 1) {
      progressRef.current = Math.min(1, progressRef.current + speed);

      const point = curve.getPointAt(progressRef.current);
      const tangent = curve.getTangentAt(progressRef.current);
      const angle = Math.atan2(tangent.x, tangent.z);

      bodyRef.current.setTranslation({ x: point.x, y: point.y + 0.6, z: point.z }, true);
      bodyRef.current.setRotation({ x: 0, y: angle, z: 0, w: Math.cos(angle / 2) }, true);

      if (wheelRef.current) {
        wheelRef.current.rotation.x -= speed * 30;
      }

      onProgress?.(progressRef.current, [point.x, point.y + 0.6, point.z]);

      if (progressRef.current >= 1 && !completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    }
  });

  if (!curve) return null;

  return (
    <RigidBody
      ref={bodyRef}
      type={'kinematicPosition'}
      colliders="cuboid"
      position={[path[0][0], 0.6, path[0][2]]}
      userData={{ riderId }}
    >
      <group>
        <group ref={wheelRef} position={[0, -0.25, 0]}>
          <mesh position={[0, 0, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.08, 16]} />
            <meshStandardMaterial color="#18181b" roughness={0.8} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0, -0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.08, 16]} />
            <meshStandardMaterial color="#18181b" roughness={0.8} metalness={0.3} />
          </mesh>
        </group>

        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.25, 0.18, 1.1]} />
          <meshStandardMaterial color="#3f3f46" metalness={0.6} roughness={0.4} />
        </mesh>

        <mesh position={[0, 0.32, 0.2]}>
          <boxGeometry args={[0.3, 0.3, 0.35]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
        </mesh>

        <mesh position={[0, 0.58, 0.2]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.3} roughness={0.5} />
        </mesh>

        <mesh position={[0, 0.65, 0.2]}>
          <sphereGeometry args={[0.1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#ef4444" metalness={0.2} roughness={0.6} />
        </mesh>

        <mesh position={[0, 0.22, -0.15]}>
          <boxGeometry args={[0.35, 0.35, 0.35]} />
          <meshStandardMaterial
            color="#f97316"
            emissive="#ea580c"
            emissiveIntensity={0.2}
            metalness={0.3}
            roughness={0.5}
          />
        </mesh>

        <Billboard position={[0, 1.3, 0]}>
          <Text
            fontSize={0.2}
            color="#f8fafc"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#0f172a"
          >
            {riderName}
          </Text>
        </Billboard>
      </group>
    </RigidBody>
  );
};

function useMemoCurve(path: Array<[number, number, number]>) {
  return useMemoCatmullRom(path);
}

function useMemoCatmullRom(path: Array<[number, number, number]>) {
  return useMemoOnly(() => {
    if (path.length < 2) return null;
    const pts = path.map(p => new THREE.Vector3(p[0], p[1] || 0, p[2]));
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2);
  }, [JSON.stringify(path)]);
}

function useMemoOnly<T>(fn: () => T, deps: unknown[]): T {
  const ref = useRef<{ deps: unknown[]; value: T } | null>(null);
  if (!ref.current || !depsEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: fn() };
  }
  return ref.current.value;
}

function depsEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}
