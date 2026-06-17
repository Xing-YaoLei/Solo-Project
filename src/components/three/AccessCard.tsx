import { useState, useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import type { AccessRecord } from '@/types';
import { useAccessControl } from '@/hooks/useAccessControl';

interface AccessCardProps {
  record: AccessRecord;
  onDragStart?: () => void;
  onDragEnd?: (position: [number, number, number]) => void;
}

export const AccessCard = ({ record, onDragStart, onDragEnd }: AccessCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const dragOffset = useRef(new THREE.Vector3());
  const targetPosition = useRef(new THREE.Vector3());
  const startPosition = useRef(new THREE.Vector3());
  
  const { camera, raycaster, pointer } = useThree();
  const { assignRecordToNearestSpot, phase } = useAccessControl();
  
  useEffect(() => {
    startPosition.current.set(
      record.id.charCodeAt(0) % 10 - 5,
      1.5,
      10
    );
    targetPosition.current.copy(startPosition.current);
  }, [record.id]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    if (isDragging) {
      raycaster.setFromCamera(pointer, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);
      
      if (intersection) {
        targetPosition.current.copy(intersection).add(dragOffset.current);
      }
    }
    
    groupRef.current.position.lerp(targetPosition.current, delta * 10);
    groupRef.current.rotation.y += delta * (hovered ? 0.5 : 0.2);
    
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = hovered || isDragging ? 0.5 : 0.1;
    }
  });

  const handlePointerDown = (e: any) => {
    if (phase !== 'access_control' || record.isProcessed) return;
    if (record.assignedSpotId) return;
    
    e.stopPropagation();
    setIsDragging(true);
    onDragStart?.();
    
    raycaster.setFromCamera(pointer, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    
    if (intersection && groupRef.current) {
      dragOffset.current.copy(groupRef.current.position).sub(intersection);
    }
    
    document.body.style.cursor = 'grabbing';
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    document.body.style.cursor = 'default';
    
    if (groupRef.current) {
      const dropPos: [number, number, number] = [
        groupRef.current.position.x,
        groupRef.current.position.y,
        groupRef.current.position.z,
      ];
      
      const success = assignRecordToNearestSpot(record.id, dropPos);
      
      if (!success) {
        targetPosition.current.copy(startPosition.current);
      } else {
        onDragEnd?.(dropPos);
      }
    }
  };

  const getVehicleTypeColor = () => {
    switch (record.vehicleType) {
      case 'truck': return '#f59e0b';
      case 'motorcycle': return '#10b981';
      default: return '#3b82f6';
    }
  };

  if (record.isProcessed || record.assignedSpotId) {
    return null;
  }

  return (
    <group ref={groupRef} position={startPosition.current}>
      <RigidBody type="kinematicPosition" colliders={false}>
        <mesh
          ref={meshRef}
          onPointerOver={() => {
            setHovered(true);
            document.body.style.cursor = 'grab';
          }}
          onPointerOut={() => {
            setHovered(false);
            if (!isDragging) document.body.style.cursor = 'default';
          }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <boxGeometry args={[1.5, 0.1, 2]} />
          <meshStandardMaterial
            color={getVehicleTypeColor()}
            transparent
            opacity={0.85}
            emissive={getVehicleTypeColor()}
            emissiveIntensity={0.1}
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
        
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[1.3, 0.02, 1.8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
        
        <CuboidCollider args={[0.75, 0.05, 1]} />
      </RigidBody>
      
      <group position={[0, 0.2, 0]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[1.2, 0.6]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
      </group>
    </group>
  );
};
