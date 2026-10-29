import Fuse from 'fuse.js'
import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import { FELD_KLASSE, MAX_NAME } from '@/lib/eingabe'
import { useProdukttypen } from '@/lib/queries'
import { cn } from '@/lib/utils'

const MAX_VORSCHLAEGE = 5

type Props = {
  id?: string
  value: string
  onChange: (name: string) => void
  autoFocus?: boolean
}

/** Eingabefeld für den Produktnamen mit unscharfer Autovervollständigung über alle Produkttypen. */
export function ProduktNameFeld({ id, value, onChange, autoFocus }: Props) {
  const { data: produkttypen = [] } = useProdukttypen()
  const [offen, setOffen] = useState(false)
  const [aktiv, setAktiv] = useState(-1)
  const listeId = useId()

  // Durchsucht alle Produkttypen, auch aufgebrauchte, damit keine Dubletten entstehen
  const fuse = useMemo(
    () => new Fuse(produkttypen, { keys: ['name'], threshold: 0.4, ignoreLocation: true }),
    [produkttypen],
  )
  const vorschlaege = useMemo(
    () =>
      value.trim()
        ? fuse.search(value.trim(), { limit: MAX_VORSCHLAEGE }).map((treffer) => treffer.item)
        : [],
    [fuse, value],
  )
  const listeSichtbar = offen && vorschlaege.length > 0
  // Die Liste kann sich durch das Neuladen im Intervall ändern, während ein Eintrag markiert ist
  const markiert = aktiv < vorschlaege.length ? aktiv : -1

  function auswaehlen(gewaehlt: string) {
    onChange(gewaehlt)
    setOffen(false)
    setAktiv(-1)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!listeSichtbar) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAktiv((markiert + 1) % vorschlaege.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAktiv(markiert <= 0 ? vorschlaege.length - 1 : markiert - 1)
    } else if (e.key === 'Enter' && markiert >= 0) {
      e.preventDefault()
      auswaehlen(vorschlaege[markiert].name)
    } else if (e.key === 'Escape') {
      setOffen(false)
      setAktiv(-1)
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        className={FELD_KLASSE}
        placeholder="z. B. Hafermilch Barista"
        value={value}
        autoComplete="off"
        autoFocus={autoFocus}
        maxLength={MAX_NAME}
        role="combobox"
        aria-expanded={listeSichtbar}
        aria-controls={listeId}
        aria-activedescendant={markiert >= 0 ? `${listeId}-${markiert}` : undefined}
        onChange={(e) => {
          onChange(e.target.value)
          setOffen(true)
          setAktiv(-1)
        }}
        onFocus={() => setOffen(true)}
        onBlur={() => setOffen(false)}
        onKeyDown={onKeyDown}
      />
      {listeSichtbar && (
        <ul
          id={listeId}
          role="listbox"
          className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg bg-surface-container-lowest shadow-[0_4px_20px_rgba(58,48,42,0.12)]"
        >
          {vorschlaege.map((p, i) => (
            <li
              key={p.id}
              id={`${listeId}-${i}`}
              role="option"
              aria-selected={i === markiert}
              className={cn(
                'flex cursor-pointer justify-between gap-2 px-4 py-2.5 text-sm',
                i === markiert && 'bg-surface-container',
              )}
              // mousedown statt click, damit das Feld nicht vorher den Fokus verliert
              onMouseDown={(e) => {
                e.preventDefault()
                auswaehlen(p.name)
              }}
              onMouseEnter={() => setAktiv(i)}
            >
              <span className="truncate">{p.name}</span>
              <span className="shrink-0 text-xs text-on-surface-variant">
                {p.anzahl > 0 ? `${p.anzahl} im Bestand` : 'aufgebraucht'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
