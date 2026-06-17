import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { GAME_CONFIG } from '@/config/difficulty';

interface PlayerControllerProps {
  speed?: number;
  sensitivity?: number;
}

export const PlayerController = ({ 
  speed = 5, 
  sensitivity = 0.002 
}: PlayerControllerProps) => {
  const { camera, gl } = useThree();
  const keys = useRef<Set<string>>(new Set());
  const mouseDown = useRef(false);
  const rotation = useRef({ x: 0, y: 0 });
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  
  const updatePlayerPosition = useGameStore(state => state.updatePlayerPosition);
  const updateCameraRotation = useGameStore(state => state.updateCameraRotation);
  const playerPosition = useGameStore(state => state.playerPosition);
  const isPaused = useGameStore(state => state.isPaused);
  const isFailed = useGameStore(state => state.isFailed);
  const phase = useGameStore(state => state.phase);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase());
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        mouseDown.current = true;
        gl.domElement.requestPointerLock();
      }
    };
    
    const handleMouseUp = () => {
      mouseDown.current = false;
      document.exitPointerLock();
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === gl.domElement) {
        rotation.current.y -= e.movementX * sensitivity;
        rotation.current.x -= e.movementY * sensitivity;
        rotation.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotation.current.x));
      }
    };
    
    const handlePointerLockChange = () => {
      if (document.pointerLockElement !== gl.domElement) {
        mouseDown.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.exitPointerLock();
    };
  }, [gl, sensitivity]);

  useFrame((_, delta) => {
    if (isPaused || isFailed || phase === 'ended') return;

    const moveSpeed = keys.current.has('shift') ? speed * 1.5 : speed;
    
    velocity.current.x -= velocity.current.x * 10.0 * delta;
    velocity.current.z -= velocity.current.z * 10.0 * delta;
    
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.current.y);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3(1, 0, 0);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.current.y);
    right.y = 0;
    right.normalize();
    
    direction.current.set(0, 0, 0);
    
    if (keys.current.has('w')) direction.current.add(forward);
    if (keys.current.has('s')) direction.current.sub(forward);
    if (keys.current.has('a')) direction.current.sub(right);
    if (keys.current.has('d')) direction.current.add(right);
    
    if (direction.current.length() > 0) {
      direction.current.normalize();
      velocity.current.x += direction.current.x * moveSpeed * delta * 50;
      velocity.current.z += direction.current.z * moveSpeed * delta * 50;
    }
    
    const newX = playerPosition[0] + velocity.current.x * delta;
    const newZ = playerPosition[2] + velocity.current.z * delta;
    
    const clampedX = Math.max(-15, Math.min(15, newX));
    const clampedZ = Math.max(-15, Math.min(15, newZ));
    
    if (Math.abs(clampedX - playerPosition[0]) > 0.001 || 
        Math.abs(clampedZ - playerPosition[2]) > 0.001) {
      updatePlayerPosition([clampedX, 2, clampedZ]);
    }
    
    updateCameraRotation([rotation.current.x, rotation.current.y, 0]);
    
    camera.position.set(clampedX, 2, clampedZ);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = rotation.current.y;
    camera.rotation.x = rotation.current.x;
  });

  return null;
};
