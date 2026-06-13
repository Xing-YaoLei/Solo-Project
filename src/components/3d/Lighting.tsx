import { Environment } from '@react-three/drei'

const WALL_LAMP_POSITIONS: [number, number, number][] = [
  [3, 3, 3],
  [-3, 3, 3],
  [3, 3, -3],
  [-3, 3, -3],
]

export function Lighting() {
  return (
    <>
      <directionalLight
        color={0xfff5e1}
        intensity={1.2}
        position={[5, 8, 5]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {WALL_LAMP_POSITIONS.map((pos, i) => (
        <pointLight
          key={i}
          color={0xffd180}
          intensity={0.6}
          position={pos}
        />
      ))}
      <ambientLight color={0xfff5e1} intensity={0.3} />
      <Environment preset="city" />
    </>
  )
}
