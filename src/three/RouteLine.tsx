import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface RouteLineProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  animated?: boolean;
  highlight?: boolean;
  width?: number;
}

export const RouteLine = ({
  start,
  end,
  color = '#f97316',
  animated = true,
  highlight = false,
  width = 0.2,
}: RouteLineProps) => {
  const tubeRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const { curve, positions } = useMemo(() => {
    const midY = 0.3;
    const points: THREE.Vector3[] = [];
    const segments = 40;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = start[0] + (end[0] - start[0]) * t;
      const z = start[2] + (end[2] - start[2]) * t;
      const arcHeight = Math.sin(t * Math.PI) * 1.2;
      const y = midY + arcHeight;
      points.push(new THREE.Vector3(x, y, z));
    }

    const c = new THREE.CatmullRomCurve3(points);
    const sampled = c.getPoints(100);

    return { curve: c, positions: sampled };
  }, [start, end]);

  const particlePositions = useMemo(() => {
    const count = 12;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = 0;
      arr[i * 3 + 1] = 0;
      arr[i * 3 + 2] = 0;
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (tubeRef.current) {
      const mat = tubeRef.current.material as THREE.MeshBasicMaterial;
      if (animated) {
        mat.opacity = 0.5 + Math.sin(t * 2) * 0.2;
      }
    }

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      const pulse = (highlight ? 0.5 : 0.18) + Math.sin(t * 2.5) * 0.1;
      mat.opacity = pulse;
      const scale = 1 + Math.sin(t * 1.5) * 0.08 + (highlight ? 0.2 : 0);
      glowRef.current.scale.set(scale, scale + 0.3, scale);
    }

    if (particlesRef.current && animated) {
      const geo = particlesRef.current.geometry as THREE.BufferGeometry;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const count = posAttr.count;
      for (let i = 0; i < count; i++) {
        const progress = ((t * 0.3 + i / count) % 1);
        const p = curve.getPointAt(progress);
        posAttr.setXYZ(i, p.x, p.y + 0.1, p.z);
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group>
      <mesh ref={glowRef}>
        <tubeGeometry args={[curve, 100, width * 2.5, 12, false]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={tubeRef}>
        <tubeGeometry args={[curve, 100, width, 8, false]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>

      {animated && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particlePositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#fef3c7"
            size={0.22}
            transparent
            opacity={0.9}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>
      )}

      <mesh position={[positions[0].x, positions[0].y, positions[0].z]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[positions[positions.length - 1].x, positions[positions.length - 1].y, positions[positions.length - 1].z]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
};
