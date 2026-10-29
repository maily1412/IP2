import { Plus, Search, Sprout, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Mengenwahl } from '@/components/Mengenwahl'
import { FELD_KLASSE, MAX_ANZAHL } from '@/lib/eingabe'
import { useAnzahlAendern, useEntfernen, useProdukttypen } from '@/lib/queries'

const SCHATTEN = 'shadow-[0_2px_16px_rgba(58,48,42,0.03)]'

export function Bestand({ zuHinzufuegen }: { zuHinzufuegen: () => void }) {
  const { data, isPending, isError } = useProdukttypen()
  const aendern = useAnzahlAendern()
  const entfernen = useEntfernen()
  const [suche, setSuche] = useState<string | null>(null)

  // Anzahl 0 ist ausgeblendet, bleibt aber für die Autovervollständigung in der DB
  const vorhanden = (data ?? [])
    .filter((p) => p.anzahl > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
  const suchbegriff = suche?.trim().toLocaleLowerCase('de') ?? ''
  const angezeigt = suchbegriff
    ? vorhanden.filter((p) => p.name.toLocaleLowerCase('de').includes(suchbegriff))
    : vorhanden

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-baseline justify-between pt-2">
        <div>
          <h1 className="font-headline text-3xl font-medium tracking-tight">Bestand</h1>
          <p className="mt-1 text-xs tracking-wider text-on-surface-variant/80 uppercase">
            {vorhanden.length === 1 ? '1 Artikel' : `${vorhanden.length} Artikel`} im Vorrat
          </p>
        </div>
        <button
          type="button"
          aria-label={suche === null ? 'Suchen' : 'Suche schließen'}
          className={`flex size-10 items-center justify-center rounded-full bg-surface-container-low text-primary transition-colors hover:bg-surface-container active:scale-95 ${SCHATTEN}`}
          onClick={() => setSuche(suche === null ? '' : null)}
        >
          {suche === null ? <Search className="size-5" /> : <X className="size-5" />}
        </button>
      </div>

      {suche !== null && (
        <input
          type="search"
          autoFocus
          aria-label="Bestand durchsuchen"
          placeholder="Im Bestand suchen"
          className={FELD_KLASSE}
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />
      )}

      {isPending ? (
        <p className="text-sm text-on-surface-variant">Lädt …</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Backend nicht erreichbar.</p>
      ) : vorhanden.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-surface-container text-primary">
            <Sprout className="size-8" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-headline text-2xl">Vorratskammer leer</p>
            <p className="mx-auto max-w-xs text-sm text-on-surface-variant">
              Ruhe und Platz für frische Inspiration. Fügen Sie neue Schätze hinzu.
            </p>
          </div>
        </div>
      ) : angezeigt.length === 0 ? (
        <p className="text-sm text-on-surface-variant">Nichts gefunden.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {angezeigt.map((p) => (
            <li
              key={p.id}
              className={`flex items-center justify-between gap-4 rounded-xl bg-surface-container-lowest p-5 ${SCHATTEN}`}
            >
              <p className="line-clamp-2 min-w-0 flex-1 text-base font-medium tracking-tight break-words">
                {p.name}
              </p>
              <div className="flex shrink-0 items-center gap-3">
                <Mengenwahl
                  klein
                  value={p.anzahl}
                  max={MAX_ANZAHL}
                  bezeichnung={p.name}
                  onChange={(neu) => aendern.mutate({ id: p.id, delta: neu - p.anzahl })}
                />
                <button
                  type="button"
                  aria-label={`${p.name} entfernen`}
                  className="flex size-8 items-center justify-center rounded-lg text-on-surface-variant/40 transition-colors hover:text-tertiary"
                  onClick={() => entfernen.mutate(p.id)}
                >
                  <Trash2 className="size-[18px]" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(aendern.isError || entfernen.isError) && (
        <p className="text-sm text-destructive">Änderung fehlgeschlagen.</p>
      )}

      <button
        type="button"
        className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-[0_2px_16px_rgba(194,101,42,0.2)] transition-all hover:bg-primary/95 active:scale-[0.99]"
        onClick={zuHinzufuegen}
      >
        <Plus className="size-5" />
        Weiteren Artikel erfassen
      </button>
    </div>
  )
}
