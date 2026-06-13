import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { InventoryItem } from '@/types'

interface InventoryCabinetProps {
  items: InventoryItem[]
  onItemSelect: (itemId: string) => void
  position: [number, number, number]
}

const DRAWER_COUNT = 3
const CABINET_WIDTH = 2
const CABINET_HEIGHT = 1.5
const CABINET_DEPTH = 0.8
const DRAWER_GAP = 0.02

export function InventoryCabinet({ items, onItemSelect, position }: InventoryCabinetProps) {
  const [openDrawer, setOpenDrawer] = useState<number | null>(null)
  const drawerRefs = useRef<(THREE.Mesh | null)[]>([])
  const drawerTargets = useRef<number[]>(Array(DRAWER_COUNT).fill(0))

  const itemsPerDrawer = Math.ceil(items.length / DRAWER_COUNT)

  useFrame(() => {
    for (let i = 0; i < DRAWER_COUNT; i++) {
      const mesh = drawerRefs.current[i]
      if (!mesh) continue
      const target = drawerTargets.current[i]
      mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, target, 0.12)
    }
  })

  const handleDrawerClick = (index: number) => {
    const isOpen = openDrawer === index
    setOpenDrawer(isOpen ? null : index)

    for (let i = 0; i < DRAWER_COUNT; i++) {
      drawerTargets.current[i] = i === index && !isOpen ? 0.5 : 0
    }
  }

  const handleItemClick = (itemId: string) => {
    onItemSelect(itemId)
  }

  const drawerHeight = (CABINET_HEIGHT - (DRAWER_COUNT + 1) * DRAWER_GAP) / DRAWER_COUNT

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[CABINET_WIDTH, CABINET_HEIGHT, CABINET_DEPTH]} />
        <meshStandardMaterial color="#3E2723" roughness={0.7} metalness={0.2} />
      </mesh>

      {Array.from({ length: DRAWER_COUNT }).map((_, i) => {
        const yOffset = -CABINET_HEIGHT / 2 + DRAWER_GAP + drawerHeight / 2 + i * (drawerHeight + DRAWER_GAP)
        const drawerItems = items.slice(i * itemsPerDrawer, (i + 1) * itemsPerDrawer)

        return (
          <group key={i} position={[0, yOffset, 0]}>
            <mesh
              ref={(el) => { drawerRefs.current[i] = el }}
              position={[0, 0, 0]}
              onClick={() => handleDrawerClick(i)}
            >
              <boxGeometry args={[CABINET_WIDTH - 0.1, drawerHeight - 0.04, CABINET_DEPTH - 0.1]} />
              <meshStandardMaterial color="#5D4037" roughness={0.6} metalness={0.1} />
            </mesh>

            <mesh position={[0, 0, -(CABINET_DEPTH / 2 - 0.05)]}>
              <boxGeometry args={[0.2, 0.05, 0.03]} />
              <meshStandardMaterial color="#B76E79" metalness={0.6} roughness={0.3} />
            </mesh>

            {openDrawer === i && drawerItems.map((item, j) => {
              const isProblem = item.status === 'expired' || item.status === 'shortage'
              const color = isProblem ? '#ff4444' : '#50C878'

              return (
                <group key={item.id} position={[0, yOffset === 0 ? -0.1 + j * 0.18 : 0.1 - j * 0.18, 0.5]}>
                  <mesh onClick={() => handleItemClick(item.id)}>
                    <planeGeometry args={[1.4, 0.15]} />
                    <meshStandardMaterial
                      color={color}
                      transparent
                      opacity={0.3}
                      emissive={color}
                      emissiveIntensity={0.3}
                    />
                  </mesh>
                  <Text
                    position={[0, 0, 0.01]}
                    fontSize={0.06}
                    color="#FFFFF0"
                    anchorX="center"
                    anchorY="middle"
                  >
                    {`${item.name} x${item.quantity}`}
                  </Text>
                </group>
              )
            })}
          </group>
        )
      })}
    </group>
  )
}
