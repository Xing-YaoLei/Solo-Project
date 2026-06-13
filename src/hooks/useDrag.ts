import { useRef, useState, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface UseDragCallbacks {
  onDragStart?: (position: THREE.Vector3) => void
  onDrag?: (position: THREE.Vector3) => void
  onDragEnd?: (position: THREE.Vector3) => void
}

interface UseDragReturn {
  isDragging: boolean
  bind: {
    onPointerDown: (e: THREE.Event & { point: THREE.Vector3; stopPropagation: () => void }) => void
    onPointerMove: (e: THREE.Event & { point: THREE.Vector3; stopPropagation: () => void }) => void
    onPointerUp: () => void
  }
}

const PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1)
const BOUNDS = { minX: -4, maxX: 4, minZ: -4, maxZ: 4 }
const LERP_FACTOR = 0.15

export function useDrag(callbacks: UseDragCallbacks = {}): UseDragReturn {
  const { camera, raycaster } = useThree()
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const targetRef = useRef(new THREE.Vector3())
  const currentRef = useRef(new THREE.Vector3())
  const offsetRef = useRef(new THREE.Vector3())
  const intersectionPoint = useRef(new THREE.Vector3())
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useFrame(() => {
    if (isDraggingRef.current) {
      currentRef.current.lerp(targetRef.current, LERP_FACTOR)
      callbacksRef.current.onDrag?.(currentRef.current)
    }
  })

  const getPlanePosition = useCallback((clientX: number, clientY: number): THREE.Vector3 | null => {
    const mouse = new THREE.Vector2(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1
    )
    raycaster.setFromCamera(mouse, camera)
    const hit = raycaster.ray.intersectPlane(PLANE, intersectionPoint.current)
    if (!hit) return null
    return new THREE.Vector3(
      THREE.MathUtils.clamp(hit.x, BOUNDS.minX, BOUNDS.maxX),
      1,
      THREE.MathUtils.clamp(hit.z, BOUNDS.minZ, BOUNDS.maxZ)
    )
  }, [camera, raycaster])

  const onPointerDown = useCallback((e: THREE.Event & { point: THREE.Vector3; stopPropagation: () => void }) => {
    e.stopPropagation()
    isDraggingRef.current = true
    setIsDragging(true)

    const planePos = getPlanePosition(
      (e as unknown as { nativeEvent?: { clientX: number; clientY: number } }).nativeEvent?.clientX ?? 0,
      (e as unknown as { nativeEvent?: { clientX: number; clientY: number } }).nativeEvent?.clientY ?? 0
    )

    if (planePos) {
      targetRef.current.copy(planePos)
      currentRef.current.copy(planePos)
      offsetRef.current.set(0, 0, 0)
    } else {
      targetRef.current.copy(e.point)
      currentRef.current.copy(e.point)
    }

    callbacksRef.current.onDragStart?.(currentRef.current)
  }, [getPlanePosition])

  const onPointerMove = useCallback((e: THREE.Event & { point: THREE.Vector3; stopPropagation: () => void }) => {
    if (!isDraggingRef.current) return
    e.stopPropagation()

    const planePos = getPlanePosition(
      (e as unknown as { nativeEvent?: { clientX: number; clientY: number } }).nativeEvent?.clientX ?? 0,
      (e as unknown as { nativeEvent?: { clientX: number; clientY: number } }).nativeEvent?.clientY ?? 0
    )

    if (planePos) {
      targetRef.current.copy(planePos).add(offsetRef.current)
    }
  }, [getPlanePosition])

  const onPointerUp = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)
    callbacksRef.current.onDragEnd?.(currentRef.current)
  }, [])

  return {
    isDragging,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
  }
}
