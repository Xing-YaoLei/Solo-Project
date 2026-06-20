import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import type { Seat } from '../../types';
import { TICKET_COLORS, STATUS_COLORS } from '../../utils/sceneHelpers';

interface SeatsGroupProps {
  seats: Seat[];
  selectedSeatIds: string[];
  hoveredSeatId: string | null;
  onSeatClick: (seatId: string) => void;
  onSeatHover: (seatId: string | null) => void;
  onSeatLongPress?: (seatId: string) => void;
}

const LONG_PRESS_MS = 500;

export function SeatsGroup({ seats, selectedSeatIds, hoveredSeatId, onSeatClick, onSeatHover, onSeatLongPress }: SeatsGroupProps) {
  const backRef = useRef<THREE.InstancedMesh>(null);
  const bottomRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressInstanceIdRef = useRef<number | null>(null);

  const seatCount = seats.length;

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressInstanceIdRef.current = null;
  };

  const startLongPressTimer = (instanceId: number) => {
    clearLongPressTimer();
    longPressInstanceIdRef.current = instanceId;
    longPressTimerRef.current = window.setTimeout(() => {
      const inst = longPressInstanceIdRef.current;
      if (inst !== null && inst < seats.length && onSeatLongPress) {
        onSeatLongPress(seats[inst].id);
      }
      clearLongPressTimer();
    }, LONG_PRESS_MS);
  };

  const { backGeo, bottomGeo } = useMemo(() => ({
    backGeo: new THREE.BoxGeometry(0.45, 0.55, 0.08),
    bottomGeo: new THREE.BoxGeometry(0.5, 0.08, 0.45),
  }), []);

  const initialColors = useMemo(() => {
    const colors: number[] = [];
    seats.forEach((seat) => {
      colors.push(TICKET_COLORS[seat.ticketType]);
    });
    return colors;
  }, [seats]);

  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!backRef.current || !bottomRef.current) return;

    seats.forEach((seat, idx) => {
      const isSelected = selectedSeatIds.includes(seat.id);
      const isHovered = hoveredSeatId === seat.id;
      let colorHex: number;

      if (isSelected) colorHex = STATUS_COLORS.SELECTED;
      else if (seat.status === 'CONFLICT') colorHex = STATUS_COLORS.CONFLICT;
      else if (isHovered) colorHex = STATUS_COLORS.HOVERED;
      else if (seat.status === 'CHECKED_IN') colorHex = STATUS_COLORS.CHECKED_IN;
      else if (seat.status === 'SOLD') colorHex = STATUS_COLORS.SOLD;
      else if (seat.status === 'LOCKED') colorHex = STATUS_COLORS.LOCKED;
      else if (seat.status === 'REFUNDED') colorHex = STATUS_COLORS.REFUNDED;
      else colorHex = initialColors[idx];

      tmpColor.setHex(colorHex);
      backRef.current!.setColorAt(idx, tmpColor);
      bottomRef.current!.setColorAt(idx, tmpColor);

      dummy.position.set(seat.x, seat.y + 0.35, seat.z);
      dummy.rotation.x = -0.3;
      dummy.updateMatrix();
      backRef.current!.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(seat.x, seat.y + 0.06, seat.z + 0.15);
      dummy.rotation.x = 0;
      dummy.updateMatrix();
      bottomRef.current!.setMatrixAt(idx, dummy.matrix);
    });

    backRef.current.instanceColor!.needsUpdate = true;
    bottomRef.current.instanceColor!.needsUpdate = true;
    backRef.current.instanceMatrix.needsUpdate = true;
    bottomRef.current.instanceMatrix.needsUpdate = true;
  }, [seats, selectedSeatIds, hoveredSeatId, initialColors, dummy, tmpColor]);

  useFrame((state) => {
    if (!backRef.current) return;
    const t = state.clock.elapsedTime;

    selectedSeatIds.forEach((sid) => {
      const idx = seats.findIndex((s) => s.id === sid);
      if (idx === -1) return;
      const seat = seats[idx];
      const pulse = Math.sin(t * 3) * 0.02 + 0.03;

      dummy.position.set(seat.x, seat.y + 0.35 + pulse, seat.z);
      dummy.rotation.x = -0.3;
      dummy.updateMatrix();
      backRef.current.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(seat.x, seat.y + 0.06 + pulse, seat.z + 0.15);
      dummy.rotation.x = 0;
      dummy.updateMatrix();
      bottomRef.current.setMatrixAt(idx, dummy.matrix);
    });

    if (hoveredSeatId) {
      const idx = seats.findIndex((s) => s.id === hoveredSeatId);
      if (idx !== -1 && !selectedSeatIds.includes(hoveredSeatId)) {
        const seat = seats[idx];
        const lift = 0.02;
        dummy.position.set(seat.x, seat.y + 0.35 + lift, seat.z);
        dummy.rotation.x = -0.3;
        dummy.updateMatrix();
        backRef.current.setMatrixAt(idx, dummy.matrix);

        dummy.position.set(seat.x, seat.y + 0.06 + lift, seat.z + 0.15);
        dummy.rotation.x = 0;
        dummy.updateMatrix();
        bottomRef.current.setMatrixAt(idx, dummy.matrix);
      }
    }

    if (selectedSeatIds.length > 0 || hoveredSeatId) {
      backRef.current.instanceMatrix.needsUpdate = true;
      bottomRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const handlePointerMissed = () => {
    onSeatHover(null);
  };

  const handleClick = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    clearLongPressTimer();
    const instanceId = (e as any).instanceId;
    if (instanceId !== undefined && instanceId < seats.length) {
      onSeatClick(seats[instanceId].id);
    }
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const instanceId = (e as any).instanceId;
    if (instanceId !== undefined && instanceId < seats.length) {
      startLongPressTimer(instanceId);
    }
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    clearLongPressTimer();
  };

  const handlePointerCancel = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    clearLongPressTimer();
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const instanceId = (e as any).instanceId;
    if (instanceId !== undefined && instanceId < seats.length) {
      onSeatHover(seats[instanceId].id);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    clearLongPressTimer();
    onSeatHover(null);
    document.body.style.cursor = 'default';
  };

  return (
    <group onPointerMissed={handlePointerMissed}>
      <instancedMesh
        ref={backRef}
        args={[backGeo, undefined, Math.max(seatCount, 1)]}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial metalness={0.15} roughness={0.75} vertexColors />
      </instancedMesh>
      <instancedMesh
        ref={bottomRef}
        args={[bottomGeo, undefined, Math.max(seatCount, 1)]}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial metalness={0.1} roughness={0.85} vertexColors />
      </instancedMesh>
    </group>
  );
}
