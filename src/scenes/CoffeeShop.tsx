import { useState, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { OrbitControls, Environment, Lightformer, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { BarCounter } from './objects/BarCounter';
import { Table } from './objects/Table';
import { Chair } from './objects/Chair';
import { Cabinet } from './objects/Cabinet';
import { CoffeeCup } from './objects/CoffeeCup';
import { ClueCard } from './objects/ClueCard';
import { CoffeeBean } from './objects/CoffeeBean';
import { ParticleSystem } from './objects/ParticleSystem';
import type { Clue } from '@/types/game';

interface CoffeeShopProps {
  clues: Clue[];
  viewedClues: string[];
  selectedClueId: string | null;
  onClueClick: (clueId: string) => void;
  onCabinetOpen: () => void;
  onCabinetClose: () => void;
  isCabinetOpen: boolean;
  isSpilling: boolean;
  onSpillComplete: () => void;
}

function Scene({
  clues,
  viewedClues,
  selectedClueId,
  onClueClick,
  onCabinetOpen,
  onCabinetClose,
  isCabinetOpen,
  isSpilling,
  onSpillComplete,
}: CoffeeShopProps) {
  const { camera } = useThree();

  return (
    <>
      <color attach="background" args={['#3E2723']} />
      <fog attach="fog" args={['#3E2723', 10, 30]} />

      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={30}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <pointLight position={[-3, 3, 2]} intensity={0.8} color="#FFE0B2" />
      <pointLight position={[3, 3, -2]} intensity={0.6} color="#FFCC80" />
      <spotLight
        position={[0, 5, 0]}
        angle={0.5}
        penumbra={0.5}
        intensity={1}
        castShadow
      />

      <Physics gravity={[0, -9.81, 0]} paused={false}>
        <BarCounter position={[0, 0, 0]} />
        
        <Table position={[3, 0, 2]} />
        <Table position={[-3, 0, 2]} />
        <Table position={[3, 0, -3]} />
        <Table position={[-3, 0, -3]} />
        
        <Chair position={[2.2, 0, 2]} rotation={[0, Math.PI / 4, 0]} />
        <Chair position={[3.8, 0, 2]} rotation={[0, -Math.PI / 4, 0]} />
        <Chair position={[-2.2, 0, 2]} rotation={[0, Math.PI / 4, 0]} />
        <Chair position={[-3.8, 0, 2]} rotation={[0, -Math.PI / 4, 0]} />
        
        <Cabinet
          position={[-6, 0, 0]}
          isOpen={isCabinetOpen}
          onOpen={onCabinetOpen}
          onClose={onCabinetClose}
        />

        <CoffeeCup
          position={[0, 1.5, 1]}
          isSpilling={isSpilling}
          onAnimationComplete={onSpillComplete}
        />

        {clues.map((clue, index) => {
          const x = -1.5 + (index % 2) * 3;
          const z = 2 + Math.floor(index / 2) * 1.5;
          return (
            <ClueCard
              key={clue.id}
              position={[x, 2.5, z]}
              title={clue.title}
              content={clue.content}
              type={clue.type}
              isViewed={viewedClues.includes(clue.id)}
              isSelected={selectedClueId === clue.id}
              onClick={() => onClueClick(clue.id)}
              importance={clue.importance}
            />
          );
        })}

        {Array.from({ length: 8 }).map((_, i) => (
          <CoffeeBean
            key={i}
            position={[
              (Math.random() - 0.5) * 8,
              5 + Math.random() * 3,
              (Math.random() - 0.5) * 8,
            ]}
            velocity={[
              (Math.random() - 0.5) * 0.5,
              -Math.random() * 0.5,
              (Math.random() - 0.5) * 0.5,
            ]}
          />
        ))}

        <RigidBody type="fixed" position={[0, -1, 0]} colliders={false}>
          <CuboidCollider args={[20, 1, 20]} />
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
            <planeGeometry args={[40, 40]} />
            <meshStandardMaterial color="#8D6E63" roughness={0.9} />
          </mesh>
        </RigidBody>

        <ContactShadows
          position={[0, -0.49, 0]}
          opacity={0.4}
          scale={30}
          blur={2}
          far={10}
          color="#000000"
        />
      </Physics>

      <ParticleSystem count={30} color="#FFCC80" size={0.08} spread={15} />

      <Environment preset="sunset" />
      <Lightformer
        position={[0, 5, -10]}
        scale={[10, 5, 1]}
        intensity={1}
        color="#FFE0B2"
      />

      <OrbitControls
        makeDefault
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={5}
        maxDistance={20}
        target={[0, 1, 0]}
      />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
        <Noise opacity={0.03} />
      </EffectComposer>
    </>
  );
}

import { RigidBody, CuboidCollider } from '@react-three/rapier';

export function CoffeeShopScene(props: CoffeeShopProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 5, 12], fov: 50 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
