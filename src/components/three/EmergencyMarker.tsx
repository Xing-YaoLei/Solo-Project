import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { EmergencyEvent } from '@/types';
import { useEmergency } from '@/hooks/useEmergency';

interface EmergencyMarkerProps {
  emergency: EmergencyEvent;
}

export const EmergencyMarker = ({ emergency }: EmergencyMarkerProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const alarmRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  
  const { resolveCurrentEmergency, isAtEmergencyLocation, getEmergencyIcon, getEmergencyColor, getEmergencyStatus } = useEmergency();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    
    const time = clock.getElapsedTime();
    const bounce = Math.abs(Math.sin(time * 4)) * 0.5;
    groupRef.current.position.y = 2 + bounce;
    groupRef.current.rotation.y += 0.05;
    
    if (alarmRef.current) {
      const flash = Math.sin(time * 10) > 0 ? 1 : 0.3;
      const material = alarmRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = flash * 2;
    }
    
    if (pulseRef.current) {
      const scale = 1 + Math.sin(time * 3) * 0.3;
      pulseRef.current.scale.set(scale, 1, scale);
      const material = pulseRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.5 - Math.sin(time * 3) * 0.2;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (emergency.isResolved) return;
    resolveCurrentEmergency();
  };

  const color = getEmergencyColor(emergency.type);
  const status = getEmergencyStatus;
  const canResolve = isAtEmergencyLocation && !emergency.isResolved;

  return (
    <group 
      ref={groupRef} 
      position={[emergency.position[0], 2, emergency.position[2]]}
      onClick={handleClick}
    >
      <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1, 1.5, 16]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <mesh ref={alarmRef}>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 16]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={1}
        />
      </mesh>
      
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
        />
      </mesh>
      
      {emergency.isResolved && (
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.5} />
        </mesh>
      )}
      
      {canResolve && (
        <mesh position={[0, 1.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.6, 8]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
};
