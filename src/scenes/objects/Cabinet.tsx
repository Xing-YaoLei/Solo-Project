import { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { RigidBody, CuboidCollider, usePrismaticJoint } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { Text } from '@react-three/drei';

interface CabinetProps {
  position: [number, number, number];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export function Cabinet({ position, isOpen, onOpen, onClose }: CabinetProps) {
  const cabinetRef = useRef<RapierRigidBody>(null);
  const drawerRef = useRef<RapierRigidBody>(null);
  const [hovered, setHovered] = useState(false);

  usePrismaticJoint(cabinetRef, drawerRef, [
    [0, -0.3, 0],
    [0, -0.3, 0],
    [0, 0, 1],
    [0, 0.8],
  ]);

  useFrame(() => {
    if (drawerRef.current) {
      const targetZ = isOpen ? -0.8 : 0;
      const currentZ = drawerRef.current.translation().z;
      const newZ = currentZ + (targetZ - currentZ) * 0.1;
      drawerRef.current.setNextKinematicTranslation({
        x: position[0],
        y: position[1] - 0.3,
        z: position[2] + newZ,
      });
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (isOpen) {
      onClose();
    } else {
      onOpen();
    }
  };

  return (
    <group position={position}>
      <RigidBody
        ref={cabinetRef}
        type="fixed"
        position={[0, 0, 0]}
        colliders={false}
      >
        <CuboidCollider args={[1.5, 2, 0.8]} />
        
        <mesh
          position={[0, 0, 0]}
          castShadow
          receiveShadow
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        >
          <boxGeometry args={[3, 4, 1.6]} />
          <meshStandardMaterial
            color={hovered ? '#6D4C41' : '#4E342E'}
            roughness={0.7}
            metalness={0.2}
          />
        </mesh>

        <mesh position={[0, -0.3, 0.81]}>
          <boxGeometry args={[2.8, 0.8, 0.05]} />
          <meshStandardMaterial color="#5D4037" roughness={0.6} />
        </mesh>

        {[1.2, 0.2, -0.8, -1.8].map((y, i) => (
          <mesh key={i} position={[0, y, 0.81]}>
            <boxGeometry args={[2.8, 0.05, 0.05]} />
            <meshStandardMaterial color="#3E2723" />
          </mesh>
        ))}

        <Text
          position={[0, 1.8, 0.85]}
          fontSize={0.2}
          color="#FFF8E1"
          font="/fonts/NotoSansSC-Regular.ttf"
        >
          会员档案柜
        </Text>

        {!isOpen && (
          <Text
            position={[0, -0.3, 0.9]}
            fontSize={0.12}
            color="#FFCC80"
            font="/fonts/NotoSansSC-Regular.ttf"
          >
            点击打开
          </Text>
        )}
      </RigidBody>

      <RigidBody
        ref={drawerRef}
        type="kinematicPosition"
        position={[0, -0.3, 0]}
        colliders={false}
      >
        <CuboidCollider args={[1.2, 0.35, 0.6]} />
        
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[2.4, 0.7, 1.2]} />
          <meshStandardMaterial color="#8D6E63" roughness={0.6} />
        </mesh>

        <mesh position={[0, 0, -0.65]}>
          <boxGeometry args={[2.6, 0.8, 0.1]} />
          <meshStandardMaterial color="#6D4C41" roughness={0.5} />
        </mesh>

        <mesh position={[0, 0, -0.7]}>
          <torusGeometry args={[0.15, 0.03, 8, 32]} />
          <meshStandardMaterial color="#FFD54F" metalness={0.8} roughness={0.2} />
        </mesh>

        {isOpen && (
          <>
            <Text
              position={[0, 0.15, 0]}
              fontSize={0.1}
              color="#3E2723"
              font="/fonts/NotoSansSC-Regular.ttf"
            >
              档案文件夹
            </Text>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[-0.6 + i * 0.6, -0.1, 0]}>
                <boxGeometry args={[0.5, 0.3, 0.02]} />
                <meshStandardMaterial color={['#FFECB3', '#C8E6C9', '#BBDEFB'][i]} />
              </mesh>
            ))}
          </>
        )}
      </RigidBody>
    </group>
  );
}
