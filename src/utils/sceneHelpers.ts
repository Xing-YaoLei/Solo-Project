import * as THREE from 'three';
import type { Seat, TicketType } from '../types';

export const TICKET_COLORS: Record<TicketType, number> = {
  VIP: 0xf59e0b,
  PREMIUM: 0x8b5cf6,
  STANDARD: 0x10b981,
  ECONOMY: 0x64748b,
};

export const STATUS_COLORS: Record<string, number> = {
  AVAILABLE: 0x475569,
  LOCKED: 0x3b82f6,
  SOLD: 0x22c55e,
  CHECKED_IN: 0x16a34a,
  REFUNDED: 0xa855f7,
  CONFLICT: 0xf43f5e,
  SELECTED: 0xf59e0b,
  HOVERED: 0xfbbf24,
};

export function getSeatDisplayColor(
  seat: Seat,
  isSelected: boolean,
  isHovered: boolean
): number {
  if (isSelected) return STATUS_COLORS.SELECTED;
  if (seat.status === 'CONFLICT') return STATUS_COLORS.CONFLICT;
  if (isHovered) return STATUS_COLORS.HOVERED;
  switch (seat.status) {
    case 'CHECKED_IN':
      return STATUS_COLORS.CHECKED_IN;
    case 'SOLD':
      return STATUS_COLORS.SOLD;
    case 'LOCKED':
      return STATUS_COLORS.LOCKED;
    case 'REFUNDED':
      return STATUS_COLORS.REFUNDED;
    case 'AVAILABLE':
    default:
      return TICKET_COLORS[seat.ticketType];
  }
}

export function createSeatGeometry() {
  const seatBackGeo = new THREE.BoxGeometry(0.45, 0.55, 0.08);
  const seatBottomGeo = new THREE.BoxGeometry(0.5, 0.08, 0.45);
  return { seatBackGeo, seatBottomGeo };
}

export function createSeatMaterial(color: number) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.15,
    roughness: 0.75,
    emissive: new THREE.Color(color).multiplyScalar(0.05),
  });
}

export function lerpColor(a: number, b: number, t: number): number {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return ca.lerp(cb, t).getHex();
}

export function formatSeatLabel(row: string, number: number) {
  return `${row}排${number}座`;
}
