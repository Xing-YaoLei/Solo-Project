import { useState, useCallback, useRef, useEffect } from 'react';

export interface DragItem<T = unknown> {
  id: string;
  data: T;
  index?: number;
}

export interface DropZoneState {
  isOver: boolean;
  canDrop: boolean;
}

interface UseDragDropOptions<T> {
  onDragStart?: (item: DragItem<T>) => void;
  onDragEnd?: (item: DragItem<T>) => void;
  onDrop?: (item: DragItem<T>, zoneId: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

export const useDragDrop = <T = unknown>(options: UseDragDropOptions<T> = {}) => {
  const [draggingItem, setDraggingItem] = useState<DragItem<T> | null>(null);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const draggedElementRef = useRef<HTMLElement | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);

  const { onDragStart, onDragEnd, onDrop } = options;

  const createGhost = useCallback((e: React.PointerEvent, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const ghost = element.cloneNode(true) as HTMLDivElement;
    ghost.style.position = 'fixed';
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.pointerEvents = 'none';
    ghost.style.opacity = '0.9';
    ghost.style.zIndex = '9999';
    ghost.style.transform = 'rotate(2deg) scale(1.05)';
    ghost.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
    return { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
  }, []);

  const removeGhost = useCallback(() => {
    if (ghostRef.current) {
      ghostRef.current.remove();
      ghostRef.current = null;
    }
  }, []);

  const offsets = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (ghostRef.current) {
      ghostRef.current.style.left = `${e.clientX - offsets.current.x}px`;
      ghostRef.current.style.top = `${e.clientY - offsets.current.y}px`;
    }
  }, []);

  const handlePointerUp = useCallback((_e: PointerEvent) => {
    void _e;
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    if (draggingItem && activeZone && onDrop) {
      onDrop(draggingItem, activeZone);
    }
    if (onDragEnd && draggingItem) {
      onDragEnd(draggingItem);
    }
    removeGhost();
    setDraggingItem(null);
    setActiveZone(null);
  }, [draggingItem, activeZone, onDrop, onDragEnd, handlePointerMove, removeGhost]);

  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      removeGhost();
    };
  }, [handlePointerMove, handlePointerUp, removeGhost]);

  const handleDragStart = useCallback((e: React.PointerEvent, item: DragItem<T>) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    draggedElementRef.current = target;
    const off = createGhost(e, target);
    offsets.current = { x: off.offsetX, y: off.offsetY };
    setDraggingItem(item);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    if (onDragStart) onDragStart(item);
  }, [createGhost, handlePointerMove, handlePointerUp, onDragStart]);

  const handleDropZoneEnter = useCallback((zoneId: string) => {
    setActiveZone(zoneId);
  }, []);

  const handleDropZoneLeave = useCallback(() => {
    setActiveZone(null);
  }, []);

  const getDragHandlers = useCallback((item: DragItem<T>) => ({
    onPointerDown: (e: React.PointerEvent) => handleDragStart(e, item),
    style: {
      cursor: draggingItem?.id === item.id ? 'grabbing' : 'grab',
      touchAction: 'none',
      userSelect: 'none' as const,
    },
  }), [handleDragStart, draggingItem]);

  const getDropZoneProps = useCallback((zoneId: string) => ({
    onPointerEnter: () => handleDropZoneEnter(zoneId),
    onPointerLeave: handleDropZoneLeave,
    'data-drop-zone': zoneId,
  }), [handleDropZoneEnter, handleDropZoneLeave]);

  return {
    draggingItem,
    activeZone,
    isDragging: draggingItem !== null,
    getDragHandlers,
    getDropZoneProps,
  };
};
