import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import StudentDesk from './StudentDesk';
import TeacherDesk from './TeacherDesk';
import { useGameStore } from '../../stores/useGameStore';
import { getLevelById } from '../../data/levels';
import { useSettingsStore } from '../../stores/useSettingsStore';

interface ClassroomSceneProps {
  onStudentClick: (studentId: string) => void;
}

export default function ClassroomScene({ onStudentClick }: ClassroomSceneProps) {
  const { selectedStudentId, currentLevelId, isPaused } = useGameStore();
  const { sensitivity, isTouchMode } = useSettingsStore();
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const level = useMemo(() => {
    if (!currentLevelId) return null;
    return getLevelById(currentLevelId);
  }, [currentLevelId]);

  const deskRows = useMemo(() => {
    if (!level) return [];
    const rows: { x: number; z: number }[][] = [];
    const studentsPerRow = 4;
    const totalRows = Math.ceil(level.students.length / studentsPerRow);
    
    for (let row = 0; row < totalRows; row++) {
      const rowDesks: { x: number; z: number }[] = [];
      const studentsInRow = Math.min(studentsPerRow, level.students.length - row * studentsPerRow);
      const startX = -((studentsInRow - 1) * 2) / 2;
      
      for (let col = 0; col < studentsInRow; col++) {
        rowDesks.push({
          x: startX + col * 2,
          z: 3 - row * 2.5,
        });
      }
      rows.push(rowDesks);
    }
    return rows;
  }, [level]);

  useFrame((_, delta) => {
    if (!isPaused) {
      const elapsed = Date.now() * 0.0001;
      camera.position.x = Math.sin(elapsed) * 0.3;
      camera.position.y = 1.6 + Math.sin(elapsed * 0.7) * 0.1;
    }
  });

  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#D7CCC8';
    ctx.fillRect(0, 0, 256, 256);
    
    ctx.fillStyle = '#BCAAA4';
    for (let i = 0; i < 20; i++) {
      ctx.fillRect(0, i * 13, 256, 1);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
  }, []);

  const wallTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#EFEBE9';
    ctx.fillRect(0, 0, 256, 256);
    
    ctx.fillStyle = '#D7CCC8';
    for (let i = 0; i < 30; i++) {
      for (let j = 0; j < 30; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(i * 9, j * 9, 8, 8);
        }
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 4);
    return texture;
  }, []);

  if (!level) return null;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, -3]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={30}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[-4, 4, 2]} intensity={0.5} color="#FFE0B2" />
      <pointLight position={[4, 4, 2]} intensity={0.5} color="#FFE0B2" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 15]} />
        <meshStandardMaterial map={floorTexture} />
      </mesh>

      <mesh position={[0, 3, -7.5]} receiveShadow>
        <boxGeometry args={[20, 6, 0.5]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>

      <mesh position={[-10, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[15, 6, 0.5]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>

      <mesh position={[10, 3, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[15, 6, 0.5]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>

      <mesh position={[-8, 3, 2]}>
        <boxGeometry args={[0.1, 2, 2.5]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} />
      </mesh>
      <mesh position={[-8, 3, -3]}>
        <boxGeometry args={[0.1, 2, 2.5]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} />
      </mesh>

      <mesh position={[8, 3, 2]}>
        <boxGeometry args={[0.1, 2, 2.5]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} />
      </mesh>
      <mesh position={[8, 3, -3]}>
        <boxGeometry args={[0.1, 2, 2.5]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} />
      </mesh>

      <mesh position={[0, 5.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 15]} />
        <meshStandardMaterial color="#FAFAFA" side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, 3, -7]}>
        <boxGeometry args={[4, 2.5, 0.1]} />
        <meshStandardMaterial color="#2E7D32" />
      </mesh>
      <mesh position={[0, 3.2, -6.9]}>
        <boxGeometry args={[4.2, 2.7, 0.05]} />
        <meshStandardMaterial color="#8D6E63" />
      </mesh>

      <TeacherDesk />

      {deskRows.map((row, rowIndex) =>
        row.map((pos, colIndex) => {
          const studentIndex = rowIndex * 4 + colIndex;
          const student = level.students[studentIndex];
          if (!student) return null;
          return (
            <StudentDesk
              key={student.id}
              student={student}
              isSelected={selectedStudentId === student.id}
              onClick={() => onStudentClick(student.id)}
              position={[pos.x, 0, pos.z]}
            />
          );
        })
      )}

      <mesh position={[0, 0.1, -5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 64]} />
        <meshBasicMaterial color="#F9A825" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={3}
        maxDistance={15}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={sensitivity * 0.5}
        zoomSpeed={sensitivity * 0.8}
        enableZoom={!isTouchMode}
        target={[0, 1, 0]}
      />

      <fog attach="fog" args={['#EFEBE9', 10, 25]} />
    </>
  );
}
