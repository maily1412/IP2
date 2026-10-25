import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  value: number
  onChange: (anzahl: number) => void
  min?: number
  max?: number
  /** Beschriftung für Screenreader, z. B. der Produktname */
  bezeichnung?: string
  klein?: boolean
}

/** Zähler mit −/+, wie im Design-Entwurf */
export function Mengenwahl({ value, onChange, min, max, bezeichnung = 'Menge', klein }: Props) {
  const knopf = cn(
    'flex items-center justify-center rounded-lg text-on-surface-variant transition-transform hover:bg-surface-variant hover:text-on-surface active:scale-90 disabled:opacity-40 disabled:active:scale-100',
    klein ? 'size-8' : 'size-9',
  )
  return (
    <div className="flex items-center rounded-lg bg-surface-container-low p-1">
      <button
        type="button"
        aria-label={`${bezeichnung} verringern`}
        className={knopf}
        disabled={min !== undefined && value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="size-[18px]" />
      </button>
      <span
        className={cn(
          'text-center text-sm font-semibold text-on-surface tabular-nums select-none',
          klein ? 'w-7' : 'w-10',
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={`${bezeichnung} erhöhen`}
        className={knopf}
        disabled={max !== undefined && value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="size-[18px]" />
      </button>
    </div>
  )
}
