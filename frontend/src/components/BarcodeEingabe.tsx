import { useState, type FormEvent } from 'react'
import { AnzahlFeld } from '@/components/AnzahlFeld'
import { ProduktNameFeld } from '@/components/ProduktNameFeld'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { BarcodeErgebnis, ProduktTyp } from '@/lib/api'
import { anzahlAusEingabe, barcodeGueltig } from '@/lib/eingabe'
import { useBarcodeEinbuchen, useBarcodeNachschlagen } from '@/lib/queries'

/** Barcode eintippen, über die eigene Zuordnung oder Open Food Facts nachschlagen, bestätigen. */
export function BarcodeEingabe() {
  const nachschlagen = useBarcodeNachschlagen()
  const [barcode, setBarcode] = useState('')
  const [ergebnis, setErgebnis] = useState<BarcodeErgebnis | null>(null)
  const [eingebucht, setEingebucht] = useState<ProduktTyp | null>(null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!barcodeGueltig(barcode)) return
    setEingebucht(null)
    nachschlagen.mutate(barcode, { onSuccess: setErgebnis })
  }

  function zuruecksetzen() {
    setBarcode('')
    setErgebnis(null)
    nachschlagen.reset()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Per Barcode</CardTitle>
      </CardHeader>
      <CardContent>
        {ergebnis ? (
          <Bestaetigen
            ergebnis={ergebnis}
            onEingebucht={(produkttyp) => {
              setEingebucht(produkttyp)
              zuruecksetzen()
            }}
            onAbbrechen={zuruecksetzen}
          />
        ) : (
          <form onSubmit={onSubmit} className="flex flex-wrap gap-2">
            <Input
              placeholder="Barcode, z. B. 4000417025005"
              value={barcode}
              inputMode="numeric"
              autoComplete="off"
              maxLength={14}
              aria-label="Barcode"
              className="min-w-0 flex-1 basis-48 tabular-nums"
              // Nur Ziffern übernehmen, auch beim Einfügen mit Leerzeichen
              onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ''))}
            />
            <Button type="submit" disabled={!barcodeGueltig(barcode) || nachschlagen.isPending}>
              {nachschlagen.isPending ? 'Sucht …' : 'Nachschlagen'}
            </Button>
          </form>
        )}
        {!ergebnis && barcode.length > 0 && !barcodeGueltig(barcode) && (
          <p className="mt-2 text-sm text-muted-foreground">
            Ein Barcode hat 8, 12, 13 oder 14 Ziffern.
          </p>
        )}
        {nachschlagen.isError && (
          <p className="mt-2 text-sm text-destructive">Nachschlagen fehlgeschlagen.</p>
        )}
        {eingebucht && (
          <p className="mt-2 text-sm text-muted-foreground">
            {eingebucht.name} eingebucht, jetzt {eingebucht.anzahl} im Bestand.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

type BestaetigenProps = {
  ergebnis: BarcodeErgebnis
  onEingebucht: (produkttyp: ProduktTyp) => void
  onAbbrechen: () => void
}

function Bestaetigen({ ergebnis, onEingebucht, onAbbrechen }: BestaetigenProps) {
  const einbuchen = useBarcodeEinbuchen()
  // Vorschlag: eigene Zuordnung vor Open Food Facts. Die Autovervollständigung zeigt dazu
  // ähnliche vorhandene Produkttypen, z. B. „Karotten“ zu „Bio-Karotten“ von Open Food Facts.
  const [name, setName] = useState(ergebnis.produkttyp?.name ?? ergebnis.off_name ?? '')
  const [anzahl, setAnzahl] = useState('1')

  const anzahlZahl = anzahlAusEingabe(anzahl)
  const gueltig = name.trim() !== '' && anzahlZahl !== null

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!gueltig || anzahlZahl === null) return
    einbuchen.mutate(
      { barcode: ergebnis.barcode, name: name.trim(), anzahl: anzahlZahl },
      { onSuccess: onEingebucht },
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        <span className="text-muted-foreground tabular-nums">{ergebnis.barcode}: </span>
        <Herkunft ergebnis={ergebnis} />
      </p>
      <form onSubmit={onSubmit} className="flex flex-wrap gap-2">
        <ProduktNameFeld value={name} onChange={setName} autoFocus />
        <AnzahlFeld value={anzahl} onChange={setAnzahl} />
        <Button type="submit" disabled={!gueltig || einbuchen.isPending}>
          Einbuchen
        </Button>
        <Button type="button" variant="ghost" onClick={onAbbrechen}>
          Abbrechen
        </Button>
      </form>
      {einbuchen.isError && <p className="text-sm text-destructive">Speichern fehlgeschlagen.</p>}
    </div>
  )
}

function Herkunft({ ergebnis }: { ergebnis: BarcodeErgebnis }) {
  if (ergebnis.produkttyp) {
    return <>bekannt als „{ergebnis.produkttyp.name}“.</>
  }
  if (ergebnis.off_name) {
    const marke = ergebnis.off_marke ? ` (${ergebnis.off_marke})` : ''
    return (
      <>
        laut Open Food Facts „{ergebnis.off_name}“{marke}. Passt der Produkttyp?
      </>
    )
  }
  if (ergebnis.off_fehler) {
    return <>Open Food Facts ist nicht erreichbar. Bitte Produkt selbst eingeben.</>
  }
  return <>bei Open Food Facts unbekannt. Bitte Produkt selbst eingeben.</>
}
