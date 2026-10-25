import { Input } from '@/components/ui/input'
import { MAX_ANZAHL } from '@/lib/eingabe'

type Props = {
  value: string
  onChange: (anzahl: string) => void
}

export function AnzahlFeld({ value, onChange }: Props) {
  return (
    <Input
      type="number"
      min={1}
      max={MAX_ANZAHL}
      step={1}
      inputMode="numeric"
      aria-label="Stückzahl"
      className="w-20"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
