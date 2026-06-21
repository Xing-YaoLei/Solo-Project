import { useMemo } from 'react';
import * as THREE from 'three';

interface RoadSegment {
  start: [number, number];
  end: [number, number];
  width: number;
}

const ROAD_SEGMENTS: RoadSegment[] = [
  { start: [-20, 0], end: [20, 0], width: 4 },
  { start: [0, -20], end: [0, 20], width: 4 },
  { start: [10, -20], end: [10, 20], width: 3 },
  { start: [-20, 8], end: [20, 8], width: 3 },
  { start: [-10, -20], end: [-10, 20], width: 3 },
  { start: [-20, -8], end: [20, -8], width: 3 },
];

function RoadStrip({ start, end, width }: RoadSegment) {
  const { position, rotation, length } = useMemo(() => {
    const dx = end[0] - start[0];
    const dz = end[1] - start[1];
    const len = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dz, dx);
    return {
      position: [(start[0] + end[0]) / 2, 0.02, (start[1] + end[1]) / 2],
      rotation: [0, -angle, 0],
      length: len,
    };
  }, [start, end]);

  return (
    <group position={position as [number, number, number]} rotation={rotation as [number, number, number]}>
      <mesh receiveShadow>
        <planeGeometry args={[length, width]} />
        <meshStandardMaterial color="#27272a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.005, 0]}>
        <planeGeometry args={[length, width * 0.96]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.98} />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <planeGeometry args={[length * 0.9, 0.08]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.7} />
      </mesh>
      {width >= 4 && (
        <>
          <mesh position={[0, 0.01, width * 0.45]}>
            <planeGeometry args={[length * 0.95, 0.05]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[0, 0.01, -width * 0.45]}>
            <planeGeometry args={[length * 0.95, 0.05]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        </>
      )}
    </group>
  );
}

function GroundPlane() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1a2e1a';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const shade = 20 + Math.random() * 30;
      ctx.fillStyle = `rgb(${shade + 10}, ${shade + 40}, ${shade + 10})`;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.strokeStyle = 'rgba(22, 78, 99, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    return tex;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial map={texture} color="#14532d" roughness={1} metalness={0} />
    </mesh>
  );
}

function IntersectionMark({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.015, z]}>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[0.6, 0.08]} />
        <meshBasicMaterial color="#f8fafc" />
      </mesh>
    </group>
  );
}

export const RoadNetwork = () => {
  const intersections = useMemo(() => {
    const pts: Array<[number, number]> = [];
    const xs = [-10, 0, 10];
    const zs = [-8, 0, 8];
    xs.forEach(x => zs.forEach(z => pts.push([x, z])));
    return pts;
  }, []);

  return (
    <group>
      <GroundPlane />
      {ROAD_SEGMENTS.map((seg, i) => (
        <RoadStrip key={i} {...seg} />
      ))}
      {intersections.map(([x, z], i) => (
        <IntersectionMark key={`int-${i}`} x={x} z={z} />
      ))}
    </group>
  );
};
