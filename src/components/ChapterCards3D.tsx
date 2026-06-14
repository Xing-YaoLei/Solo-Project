import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { Chapter } from '../types';
import * as Icons from 'lucide-react';

interface ChapterCardProps {
  chapter: Chapter;
  position: [number, number, number];
  index: number;
  onSelect: (chapterId: string) => void;
}

function ChapterCard({ chapter, position, index, onSelect }: ChapterCardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  
  const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    'BookOpen': Icons.BookOpen,
    'Calendar': Icons.Calendar,
    'Calculator': Icons.Calculator,
    'Users': Icons.Users,
    'Trophy': Icons.Trophy
  };
  
  const IconComponent = iconMap[chapter.icon] || Icons.BookOpen;

  useFrame(({ clock }) => {
    if (meshRef.current && !pressed) {
      const time = clock.getElapsedTime();
      const offset = index * 0.5;
      meshRef.current.position.y = position[1] + Math.sin(time + offset) * 0.2;
      meshRef.current.rotation.y = Math.sin(time * 0.3 + offset) * 0.1;
    }
  });

  const handleClick = (e: { stopPropagation: () => void; }) => {
    e.stopPropagation();
    if (chapter.unlocked) {
      setPressed(true);
      setTimeout(() => {
        setPressed(false);
        onSelect(chapter.id);
      }, 200);
    }
  };

  const baseColor = chapter.unlocked ? chapter.color : '#64748b';
  const scale = hovered ? 1.05 : 1;
  const opacity = chapter.unlocked ? 1 : 0.5;

  return (
    <group position={position}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[1.8, 2.5, 0.1]} />
        <mesh
          ref={meshRef}
          position={[0, 0, 0]}
          scale={[scale, scale, scale]}
          onClick={handleClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          castShadow
        >
          <boxGeometry args={[3.2, 4.5, 0.2]} />
          <meshStandardMaterial
            color={baseColor}
            metalness={0.3}
            roughness={0.4}
            transparent
            opacity={opacity}
            emissive={hovered && chapter.unlocked ? baseColor : '#000000'}
            emissiveIntensity={hovered && chapter.unlocked ? 0.3 : 0}
          />
        </mesh>

        <mesh position={[0, 0, 0.11]}>
          <boxGeometry args={[3, 4.3, 0.02]} />
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.1}
            roughness={0.8}
            transparent
            opacity={opacity}
          />
        </mesh>

        <Text
          position={[0, 1.5, 0.13]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={2.5}
        >
          {`第 ${chapter.order} 章`}
        </Text>

        <Text
          position={[0, 0.9, 0.13]}
          fontSize={0.35}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={2.5}
          fontWeight="bold"
        >
          {chapter.title}
        </Text>

        <Html
          position={[0, 0, 0.13]}
          center
          distanceFactor={10}
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ 
                backgroundColor: chapter.unlocked ? `${chapter.color}40` : '#64748b40',
                border: `2px solid ${chapter.unlocked ? chapter.color : '#64748b'}`
              }}
            >
              <IconComponent size={32} className="text-white" />
            </div>
          </div>
        </Html>

        <Text
          position={[0, -0.8, 0.13]}
          fontSize={0.18}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
          maxWidth={2.5}
        >
          {chapter.description}
        </Text>

        {chapter.completed && (
          <Text
            position={[0, -1.5, 0.13]}
            fontSize={0.2}
            color="#10b981"
            anchorX="center"
            anchorY="middle"
          >
            ✓ 已完成
          </Text>
        )}

        {!chapter.unlocked && (
          <Text
            position={[0, -1.5, 0.13]}
            fontSize={0.2}
            color="#f59e0b"
            anchorX="center"
            anchorY="middle"
          >
            🔒 未解锁
          </Text>
        )}

        {chapter.unlocked && !chapter.completed && chapter.progress > 0 && (
          <group position={[0, -1.7, 0.13]}>
            <mesh>
              <boxGeometry args={[2.5, 0.15, 0.02]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[-1.25 + (chapter.progress / 100) * 1.25, 0, 0.01]}>
              <boxGeometry args={[(chapter.progress / 100) * 2.5, 0.12, 0.03]} />
              <meshStandardMaterial color={chapter.color} emissive={chapter.color} emissiveIntensity={0.5} />
            </mesh>
          </group>
        )}
      </RigidBody>
    </group>
  );
}

export default function ChapterCards3D() {
  const { chapters, selectChapter, setView } = useGameStore();

  const handleSelectChapter = (chapterId: string) => {
    selectChapter(chapterId);
    setView('game');
  };

  const cardPositions: [number, number, number][] = [
    [-6, 0, 0],
    [-3, 0.5, 1],
    [0, 0.8, 1.5],
    [3, 0.5, 1],
    [6, 0, 0]
  ];

  return (
    <group position={[0, 0, 0]}>
      {chapters.map((chapter, index) => (
        <ChapterCard
          key={chapter.id}
          chapter={chapter}
          position={cardPositions[index] || [0, 0, 0]}
          index={index}
          onSelect={handleSelectChapter}
        />
      ))}
    </group>
  );
}
