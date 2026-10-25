import { Check, CircleCheck, NotebookPen, ScanBarcode, Search } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react'
import { Mengenwahl } from '@/components/Mengenwahl'
import { ProduktNameFeld } from '@/components/ProduktNameFeld'
import type { BarcodeErgebnis, ProduktTyp } from '@/lib/api'
import { barcodeGueltig, FELD_KLASSE, LABEL_KLASSE, MAX_ANZAHL } from '@/lib/eingabe'
import { useBarcodeEinbuchen, useBarcodeNachschlagen, useHinzufuegen } from '@/lib/queries'
import { cn } from '@/lib/utils'

type Modus = 'barcode' | 'manuell'

export function Hinzufuegen() {
  const [modus, setModus] = useState<Modus>('barcode')
  // Die Anzahl gilt für beide Modi, wie im Entwurf
  const [anzahl, setAnzahl] = useState(1)
  const [gespeichert, setGespeichert] = useState<ProduktTyp | null>(null)

  // Rückmeldung nach dem Speichern kurz einblenden
  useEffect(() => {
    if (!gespeichert) return
    const timer = setTimeout(() => setGespeichert(null), 2200)
    return () => clearTimeout(timer)
  }, [gespeichert])

  function onGespeichert(produkttyp: ProduktTyp) {
    setAnzahl(1)
    setGespeichert(produkttyp)
  }

  const mengenwahl = (
    <div className="flex items-center justify-between pt-1">
      <span className="text-sm font-medium">Anzahl</span>
      <Mengenwahl value={anzahl} onChange={setAnzahl} min={1} max={MAX_ANZAHL} />
    </div>
  )

  return (
    <div className="flex flex-col gap-8 pt-2">
      <div className="flex justify-center">
        <div className="inline-flex rounded-full bg-surface-container p-1 shadow-sm">
          <ModusKnopf aktiv={modus === 'barcode'} onClick={() => setModus('barcode')}>
            <ScanBarcode className="size-4" />
            Barcode
          </ModusKnopf>
          <ModusKnopf aktiv={modus === 'manuell'} onClick={() => setModus('manuell')}>
            <NotebookPen className="size-4" />
            Manuell
          </ModusKnopf>
        </div>
      </div>

      <div className="flex flex-col gap-7 rounded-xl bg-surface-container-lowest p-7 shadow-sm sm:p-9">
        {modus === 'barcode' ? (
          <BarcodeModus anzahl={anzahl} mengenwahl={mengenwahl} onGespeichert={onGespeichert} />
        ) : (
          <ManuellModus anzahl={anzahl} mengenwahl={mengenwahl} onGespeichert={onGespeichert} />
        )}
      </div>

      <div
        aria-live="polite"
        className={cn(
          'pointer-events-none flex justify-center transition-opacity duration-300',
          !gespeichert && 'opacity-0',
        )}
      >
        {gespeichert && (
          <div className="flex items-center gap-2 rounded-full bg-surface-container-high px-4 py-2 text-xs font-medium shadow-sm">
            <CircleCheck className="size-4 text-primary" />
            {gespeichert.name} gespeichert, jetzt {gespeichert.anzahl} im Vorrat
          </div>
        )}
      </div>
    </div>
  )
}

function ModusKnopf(props: { aktiv: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={props.aktiv}
      onClick={props.onClick}
      className={cn(
        'flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold tracking-wide transition-all duration-200',
        props.aktiv
          ? 'bg-surface-container-lowest text-primary shadow-sm'
          : 'text-on-surface-variant hover:text-on-surface',
      )}
    >
      {props.children}
    </button>
  )
}

function Hauptknopf(props: { disabled: boolean; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={props.disabled}
      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-medium tracking-wide text-primary-foreground shadow-sm transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100"
    >
      {props.icon}
      {props.children}
    </button>
  )
}

function Fehler({ children }: { children: ReactNode }) {
  return <p className="-mt-3 text-sm text-destructive">{children}</p>
}

type ModusProps = {
  anzahl: number
  mengenwahl: ReactNode
  onGespeichert: (produkttyp: ProduktTyp) => void
}

function ManuellModus({ anzahl, mengenwahl, onGespeichert }: ModusProps) {
  const hinzufuegen = useHinzufuegen()
  const [name, setName] = useState('')
  const nameId = useId()

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    hinzufuegen.mutate(
      { name: name.trim(), anzahl },
      {
        onSuccess: (produkttyp) => {
          setName('')
          onGespeichert(produkttyp)
        },
      },
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameId} className={LABEL_KLASSE}>
          Artikelname
        </label>
        <ProduktNameFeld id={nameId} value={name} onChange={setName} />
      </div>
      {mengenwahl}
      <Hauptknopf
        disabled={!name.trim() || hinzufuegen.isPending}
        icon={<Check className="size-[18px]" />}
      >
        Hinzufügen
      </Hauptknopf>
      {hinzufuegen.isError && <Fehler>Speichern fehlgeschlagen.</Fehler>}
    </form>
  )
}

/**
 * Zwei Schritte: Barcode nachschlagen (eigene Zuordnung, sonst Open Food Facts),
 * dann den vorgeschlagenen Artikelnamen bestätigen oder korrigieren und einbuchen.
 */
function BarcodeModus({ anzahl, mengenwahl, onGespeichert }: ModusProps) {
  const nachschlagen = useBarcodeNachschlagen()
  const einbuchen = useBarcodeEinbuchen()
  const [barcode, setBarcode] = useState('')
  const [ergebnis, setErgebnis] = useState<BarcodeErgebnis | null>(null)
  const [name, setName] = useState('')
  const barcodeId = useId()
  const nameId = useId()

  function zuruecksetzen() {
    setBarcode('')
    setErgebnis(null)
    setName('')
    nachschlagen.reset()
    einbuchen.reset()
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!ergebnis) {
      if (!barcodeGueltig(barcode)) return
      nachschlagen.mutate(barcode, {
        onSuccess: (gefunden) => {
          setErgebnis(gefunden)
          // Vorschlag: eigene Zuordnung vor Open Food Facts
          setName(gefunden.produkttyp?.name ?? gefunden.off_name ?? '')
        },
      })
    } else if (name.trim()) {
      einbuchen.mutate(
        { barcode: ergebnis.barcode, name: name.trim(), anzahl },
        {
          onSuccess: (produkttyp) => {
            zuruecksetzen()
            onGespeichert(produkttyp)
          },
        },
      )
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={barcodeId} className={LABEL_KLASSE}>
          EAN / Barcode
        </label>
        <input
          id={barcodeId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={14}
          placeholder="z. B. 4012345678901"
          className={cn(FELD_KLASSE, 'tabular-nums')}
          value={barcode}
          // Nur Ziffern übernehmen. Ein geänderter Barcode muss neu nachgeschlagen werden.
          onChange={(e) => {
            setBarcode(e.target.value.replace(/\D/g, ''))
            setErgebnis(null)
            nachschlagen.reset()
          }}
        />
        {!ergebnis && barcode.length > 0 && !barcodeGueltig(barcode) && (
          <p className="text-xs text-on-surface-variant">
            Ein Barcode hat 8, 12, 13 oder 14 Ziffern.
          </p>
        )}
        {ergebnis && (
          <p className="text-xs text-on-surface-variant">
            <Herkunft ergebnis={ergebnis} />
          </p>
        )}
      </div>

      {ergebnis && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={nameId} className={LABEL_KLASSE}>
            Artikelname
          </label>
          <ProduktNameFeld id={nameId} value={name} onChange={setName} autoFocus />
        </div>
      )}

      {mengenwahl}

      {ergebnis ? (
        <div className="flex flex-col gap-2">
          <Hauptknopf
            disabled={!name.trim() || einbuchen.isPending}
            icon={<Check className="size-[18px]" />}
          >
            Einbuchen
          </Hauptknopf>
          <button
            type="button"
            className="py-2 text-sm text-on-surface-variant hover:text-on-surface"
            onClick={zuruecksetzen}
          >
            Abbrechen
          </button>
        </div>
      ) : (
        <Hauptknopf
          disabled={!barcodeGueltig(barcode) || nachschlagen.isPending}
          icon={<Search className="size-[18px]" />}
        >
          {nachschlagen.isPending ? 'Sucht …' : 'Nachschlagen'}
        </Hauptknopf>
      )}

      {nachschlagen.isError && <Fehler>Nachschlagen fehlgeschlagen.</Fehler>}
      {einbuchen.isError && <Fehler>Speichern fehlgeschlagen.</Fehler>}
    </form>
  )
}

function Herkunft({ ergebnis }: { ergebnis: BarcodeErgebnis }) {
  if (ergebnis.produkttyp) {
    return <>Bekannt als „{ergebnis.produkttyp.name}“.</>
  }
  if (ergebnis.off_name) {
    const marke = ergebnis.off_marke ? ` (${ergebnis.off_marke})` : ''
    return (
      <>
        Laut Open Food Facts „{ergebnis.off_name}“{marke}. Artikelname prüfen oder anpassen.
      </>
    )
  }
  if (ergebnis.off_fehler) {
    return <>Open Food Facts ist nicht erreichbar. Bitte Artikelname selbst eingeben.</>
  }
  return <>Bei Open Food Facts unbekannt. Bitte Artikelname selbst eingeben.</>
}
