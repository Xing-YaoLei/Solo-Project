import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, ContactShadows } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { RoadNetwork } from './RoadNetwork';
import { BuildingCluster } from './Building';
import { OrderNode, OrderNodeType } from './OrderNode';
import { RouteLine } from './RouteLine';
import { Rider } from './Rider';

interface SceneOrder {
  id: string;
  orderNo: string;
  fromPoint: [number, number, number];
  toPoint: [number, number, number];
  fromLabel?: string;
  toLabel?: string;
  highlighted?: boolean;
}

interface SceneLightingProps {
  children: React.ReactNode;
}

function SceneLighting({ children }: SceneLightingProps) {
  return (
    <>
      <ambientLight intensity={0.35} color="#93c5fd" />
      <directionalLight
        position={[12, 18, 8]}
        intensity={1.4}
        color="#fef3c7"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-near={0.1}
        shadow-camera-far={60}
      />
      <directionalLight position={[-10, 10, -8]} intensity={0.3} color="#bfdbfe" />
      <pointLight position={[0, 6, 0]} intensity={0.5} color="#fbbf24" distance={25} />
      <hemisphereLight args={['#60a5fa', '#166534', 0.25]} />
      <fog attach="fog" args={['#0f172a', 30, 70]} />
      {children}
    </>
  );
}

interface SceneContentProps {
  orders: SceneOrder[];
  riderPath?: Array<[number, number, number]>;
  activeOrderId?: string;
  onRiderProgress?: (orderId: string, progress: number) => void;
  onRiderComplete?: (orderId: string) => void;
  riderName?: string;
  riderAnimate?: boolean;
}

function SceneContent({
  orders,
  riderPath,
  activeOrderId,
  onRiderProgress,
  onRiderComplete,
  riderName = '骑手小李',
  riderAnimate = true,
}: SceneContentProps) {
  const activeOrder = orders.find(o => o.id === activeOrderId) || orders[0];
  const defaultPath = useMemo<Array<[number, number, number]>>(() => {
    if (!activeOrder) return [[0, 0, 0]];
    const midX = (activeOrder.fromPoint[0] + activeOrder.toPoint[0]) / 2;
    const midZ = (activeOrder.fromPoint[2] + activeOrder.toPoint[2]) / 2;
    return [
      activeOrder.fromPoint,
      [midX * 0.6, 0, midZ * 0.9],
      [midX, 0, midZ],
      [midX * 1.3, 0, midZ * 1.1],
      activeOrder.toPoint,
    ];
  }, [activeOrder]);

  const finalPath = riderPath || defaultPath;

  return (
    <SceneLighting>
      <RoadNetwork />
      <BuildingCluster count={28} seed={88} />
      <BuildingCluster count={14} seed={156} bounds={{ minX: -30, maxX: -20, minZ: -10, maxZ: 10 }} />

      {orders.map(order => (
        <group key={order.id}>
          <OrderNode
            position={order.fromPoint as [number, number, number]}
            type="pickup"
            label={order.fromLabel || '取货点'}
            orderNo={order.orderNo}
            highlighted={order.id === activeOrderId}
          />
          <OrderNode
            position={order.toPoint as [number, number, number]}
            type="delivery"
            label={order.toLabel || '收货点'}
            orderNo={order.orderNo}
            highlighted={order.id === activeOrderId}
          />
          <RouteLine
            start={order.fromPoint as [number, number, number]}
            end={order.toPoint as [number, number, number]}
            color={order.id === activeOrderId ? '#f97316' : '#64748b'}
            highlight={order.id === activeOrderId}
            animated={order.id === activeOrderId}
          />
        </group>
      ))}

      {activeOrder && riderAnimate && (
        <Physics gravity={[0, 0, 0]} paused>
          <Rider
            path={finalPath}
            speed={0.006}
            riderName={riderName}
            onProgress={(p) => onRiderProgress?.(activeOrder.id, p)}
            onComplete={() => onRiderComplete?.(activeOrder.id)}
          />
        </Physics>
      )}

      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.35}
        scale={60}
        blur={2.2}
        far={10}
        color="#000000"
      />
      <Stars radius={80} depth={40} count={1500} factor={3} saturation={0.2} fade speed={0.5} />
    </SceneLighting>
  );
}

interface CameraControllerProps {
  targetOrder?: SceneOrder | null;
}

function CameraController({ targetOrder }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetPos = useRef(new THREE.Vector3(0, 14, 18));
  const lookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (targetOrder) {
      const cx = (targetOrder.fromPoint[0] + targetOrder.toPoint[0]) / 2;
      const cz = (targetOrder.fromPoint[2] + targetOrder.toPoint[2]) / 2;
      lookAt.current.set(cx, 0, cz);
      targetPos.current.set(cx + 10, 14, cz + 14);
    } else {
      lookAt.current.set(0, 0, 0);
      targetPos.current.set(0, 14, 18);
    }
  }, [targetOrder]);

  useFrame((_, delta) => {
    camera.position.lerp(targetPos.current, delta * 1.5);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(lookAt.current, delta * 1.5);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate
      maxPolarAngle={Math.PI / 2.1}
      minDistance={6}
      maxDistance={35}
      target={[0, 0, 0]}
      makeDefault
    />
  );
}

export interface CitySceneProps {
  orders?: SceneOrder[];
  activeOrderId?: string;
  riderPath?: Array<[number, number, number]>;
  riderName?: string;
  riderAnimate?: boolean;
  onRiderProgress?: (orderId: string, progress: number) => void;
  onRiderComplete?: (orderId: string) => void;
  className?: string;
  height?: string;
}

const DEFAULT_ORDERS: SceneOrder[] = [
  {
    id: 'demo-001',
    orderNo: 'PT20240115234501',
    fromPoint: [-8, 0, -6],
    toPoint: [10, 0, 8],
    fromLabel: 'SOHO现代城',
    toLabel: '百子湾小区',
    highlighted: true,
  },
  {
    id: 'demo-002',
    orderNo: 'PT20240115081502',
    fromPoint: [-12, 0, 4],
    toPoint: [-5, 0, -3],
    fromLabel: '中关村',
    toLabel: '银科大厦',
  },
];

export const CityScene = ({
  orders = DEFAULT_ORDERS,
  activeOrderId,
  riderPath,
  riderName,
  riderAnimate = true,
  onRiderProgress,
  onRiderComplete,
  className = '',
  height = '100%',
}: CitySceneProps) => {
  const targetOrder = orders.find(o => o.id === activeOrderId) || orders[0];

  return (
    <div className={`w-full relative ${className}`} style={{ height }}>
      <Canvas
        shadows
        camera={{ position: [0, 14, 18], fov: 50, near: 0.1, far: 200 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#0f172a']} />
        <Suspense fallback={<Html center><div className="text-slate-300 text-sm">场景加载中...</div></Html>}>
          <CameraController targetOrder={targetOrder} />
          <SceneContent
            orders={orders}
            activeOrderId={activeOrderId}
            riderPath={riderPath}
            riderName={riderName}
            riderAnimate={riderAnimate}
            onRiderProgress={onRiderProgress}
            onRiderComplete={onRiderComplete}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
