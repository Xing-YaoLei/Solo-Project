import { EffectComposer } from '@react-three/postprocessing'
import { Bloom } from '@react-three/postprocessing'
import { Vignette } from '@react-three/postprocessing'

interface PostEffectsProps {
  bloomIntensity?: number
  bloomLuminanceThreshold?: number
  bloomLuminanceSmoothing?: number
  vignetteOffset?: number
  vignetteDarkness?: number
}

export default function PostEffects({
  bloomIntensity = 0.6,
  bloomLuminanceThreshold = 0.6,
  bloomLuminanceSmoothing = 0.2,
  vignetteOffset = 0.3,
  vignetteDarkness = 0.5,
}: PostEffectsProps) {
  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={bloomLuminanceThreshold}
        luminanceSmoothing={bloomLuminanceSmoothing}
        mipmapBlur
      />
      <Vignette offset={vignetteOffset} darkness={vignetteDarkness} />
    </EffectComposer>
  )
}
