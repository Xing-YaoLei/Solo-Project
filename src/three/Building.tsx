import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface BuildingProps {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  windowColor?: string;
  emissiveIntensity?: number;
}

export const Building = ({
  position,
  size,
  color,
  windowColor = '#fbbf24',
  emissiveIntensity = 0.6,
}: BuildingProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const windowMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const windowsTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 128);

    const windowW = 6;
    const windowH = 8;
    const gapX = 10;
    const gapY = 12;
    const cols = 5;
    const rows = Math.floor((size[1] * 8) / gapY);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = 8 + col * gapX;
        const y = 8 + row * gapY;
        const lit = Math.random() > 0.35;
        ctx.fillStyle = lit ? windowColor : '#1e293b';
        ctx.globalAlpha = lit ? 0.95 : 0.5;
        ctx.fillRect(x, y, windowW, windowH);
      }
    }
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.NearestFilter;
    return tex;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, windowColor, size[1]]);

  useFrame((state) => {
    if (windowMatRef.current) {
      const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      windowMatRef.current.emissiveIntensity = emissiveIntensity * pulse;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          ref={windowMatRef}
          map={windowsTexture}
          color={color}
          emissive={windowColor}
          emissiveIntensity={emissiveIntensity * 0.2}
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>
      <mesh position={[0, size[1] / 2 + 0.05, 0]}>
        <boxGeometry args={[size[0] * 0.95, 0.1, size[2] * 0.95]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
    </group>
  );
};

interface BuildingClusterProps {
  seed?: number;
  count?: number;
  bounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export const BuildingCluster = ({
  seed = 42,
  count = 30,
  bounds = { minX: -18, maxX: 18, minZ: -18, maxZ: 18 },
}: BuildingClusterProps) => {
  const buildings = useMemo(() => {
    const result: Array<{
      key: number;
      position: [number, number, number];
      size: [number, number, number];
      color: string;
    }> = [];

    const colors = ['#1e293b', '#334155', '#475569', '#3f3f46', '#27272a'];
    let s = seed;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    let i = 0;
    let attempts = 0;
    while (i < count && attempts < count * 10) {
      attempts++;
      const x = bounds.minX + 2 + rand() * (bounds.maxX - bounds.minX - 4);
      const z = bounds.minZ + 2 + rand() * (bounds.maxZ - bounds.minZ - 4);

      const onRoad =
        (Math.abs(x) < 2.2) ||
        (Math.abs(z) < 2.2) ||
        (Math.abs(x - 10) < 1.5) ||
        (Math.abs(z - 8) < 1.5) ||
        (Math.abs(x + 10) < 1.5) ||
        (Math.abs(z + 8) < 1.5);
      if (onRoad) continue;

      const overlaps = result.some(b => {
        const dx = Math.abs(b.position[0] - x);
        const dz = Math.abs(b.position[2] - z);
        return dx < b.size[0] / 2 + 2.5 && dz < b.size[2] / 2 + 2.5;
      });
      if (overlaps) continue;

      const w = 2 + rand() * 2.5;
      const d = 2 + rand() * 2.5;
      const h = 2 + rand() * 10;
      const color = colors[Math.floor(rand() * colors.length)];

      result.push({
        key: i,
        position: [Math.round(x * 10) / 10, h / 2, Math.round(z * 10) / 10],
        size: [Math.round(w * 10) / 10, Math.round(h * 10) / 10, Math.round(d * 10) / 10],
        color,
      });
      i++;
    }

    return result;
  }, [seed, count, bounds]);

  return (
    <group>
      {buildings.map(b => (
        <Building
          key={b.key}
          position={b.position}
          size={b.size}
          color={b.color}
        />
      ))}
    </group>
  );
};
