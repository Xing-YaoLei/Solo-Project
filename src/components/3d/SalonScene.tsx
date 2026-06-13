import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Bloom, Vignette, EffectComposer } from '@react-three/postprocessing'
import { Lighting } from './Lighting'
import { HandBadge } from './HandBadge'
import { DraggableCard } from './DraggableCard'
import { InventoryCabinet } from './InventoryCabinet'
import { ParticleBurst } from './ParticleBurst'
import type { Technician, ConsumptionRecord, InventoryItem } from '@/types'

interface SalonSceneProps {
  technicians: Technician[]
  records: ConsumptionRecord[]
  items: InventoryItem[]
  selectedTechId: string | null
  matchedTechIds: string[]
  burstPosition: [number, number, number] | null
  onMatch: (recordId: string, technicianId: string) => void
  onTechSelect: (techId: string) => void
  onItemSelect: (itemId: string) => void
}

function BadgeRow({ technicians, selectedTechId, matchedTechIds, onTechSelect }: {
  technicians: Technician[]
  selectedTechId: string | null
  matchedTechIds: string[]
  onTechSelect: (techId: string) => void
}) {
  const spacing = 1.8

  return (
    <group position={[0, 2, 2]}>
      {technicians.map((tech, i) => {
        const offset = (technicians.length - 1) * spacing * 0.5
        const x = i * spacing - offset
        return (
          <HandBadge
            key={tech.id}
            technician={tech}
            position={[x, 0, 0]}
            isSelected={selectedTechId === tech.id}
            isMatched={matchedTechIds.includes(tech.id)}
            onPointerDown={() => onTechSelect(tech.id)}
          />
        )
      })}
    </group>
  )
}

function CardRow({ records, badgePositions, onMatch }: {
  records: ConsumptionRecord[]
  badgePositions: { technicianId: string; position: [number, number, number] }[]
  onMatch: (recordId: string, technicianId: string) => void
}) {
  const spacing = 1.2

  return (
    <group position={[0, 1, 0]}>
      {records.map((record, i) => {
        const offset = (records.length - 1) * spacing * 0.5
        const x = i * spacing - offset
        return (
          <DraggableCard
            key={record.id}
            record={record}
            position={[x, 0, 0]}
            badgePositions={badgePositions}
            onMatch={onMatch}
          />
        )
      })}
    </group>
  )
}

function SceneContent({ technicians, records, items, selectedTechId, matchedTechIds, burstPosition, onMatch, onTechSelect, onItemSelect }: SalonSceneProps) {
  const badgePositions = useMemo(() => {
    const spacing = 1.8
    return technicians.map((tech, i) => {
      const offset = (technicians.length - 1) * spacing * 0.5
      return {
        technicianId: tech.id,
        position: [i * spacing - offset, 2, 2] as [number, number, number],
      }
    })
  }, [technicians])

  return (
    <>
      <color attach="background" args={['#1a0f0a']} />
      <Lighting />
      <Physics gravity={[0, 0, 0]}>
        <BadgeRow
          technicians={technicians}
          selectedTechId={selectedTechId}
          matchedTechIds={matchedTechIds}
          onTechSelect={onTechSelect}
        />
        <CardRow
          records={records}
          badgePositions={badgePositions}
          onMatch={onMatch}
        />
        <InventoryCabinet
          items={items}
          onItemSelect={onItemSelect}
          position={[0, 0.5, -2]}
        />
      </Physics>
      {burstPosition && (
        <ParticleBurst position={burstPosition} active={!!burstPosition} />
      )}
      <EffectComposer>
        <Bloom intensity={0.5} luminanceThreshold={0.8} />
        <Vignette darkness={0.5} />
      </EffectComposer>
      <OrbitControls
        enableRotate
        enableZoom
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={15}
      />
    </>
  )
}

export function SalonScene(props: SalonSceneProps) {
  return (
    <Canvas
      camera={{ fov: 50, position: [0, 5, 8] }}
      shadows
    >
      <SceneContent {...props} />
    </Canvas>
  )
}
