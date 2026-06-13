import { Lightbulb, Snowflake, Wand2, Shield } from 'lucide-react'
import { useItemSystem } from '@/hooks/useItemSystem'

const ITEM_DEFS = [
  { id: 'hint-card', icon: Lightbulb, name: '提示卡' },
  { id: 'time-freeze', icon: Snowflake, name: '时间冻结' },
  { id: 'auto-match', icon: Wand2, name: '自动匹配' },
  { id: 'shield', icon: Shield, name: '护盾' },
] as const

export function ItemBar() {
  const { activateItem, isOnCooldown, getCooldownRemaining } = useItemSystem()

  return (
    <div className="flex items-center justify-center gap-3 w-full px-4 py-2">
      {ITEM_DEFS.map(({ id, icon: Icon, name }) => {
        const onCooldown = isOnCooldown(id)
        const remaining = getCooldownRemaining(id)
        const cooldownSec = remaining > 0 ? (remaining / 1000).toFixed(1) : ''

        return (
          <button
            key={id}
            onClick={() => activateItem(id)}
            disabled={onCooldown}
            className={`
              relative flex flex-col items-center justify-center gap-1
              w-20 h-20 rounded-lg
              bg-[#1a0f0a] border
              ${onCooldown ? 'border-[#3E2723]/50 opacity-60 cursor-not-allowed' : 'border-[#3E2723] hover:border-[#B76E79]/60 active:scale-95'}
              transition-all duration-200
            `}
          >
            {!onCooldown && (
              <div className="absolute inset-0 rounded-lg border border-[#B76E79]/30 shadow-[0_0_8px_rgba(183,110,121,0.3)]" />
            )}

            <Icon
              className={`w-6 h-6 ${onCooldown ? 'text-[#3E2723]' : 'text-[#B76E79]'}`}
            />

            <span className="text-[10px] text-[#FFFFF0]/70 leading-tight">
              {name}
            </span>

            {onCooldown && (
              <div className="absolute inset-0 rounded-lg bg-black/60 flex items-center justify-center">
                <span className="text-sm font-mono text-[#FFFFF0]/90">
                  {cooldownSec}
                </span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
