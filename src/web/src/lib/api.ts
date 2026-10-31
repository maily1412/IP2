export type ProduktTyp = {
  id: number
  name: string
  anzahl: number
}

async function anfrage<T>(pfad: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${pfad}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!response.ok) {
    throw new Error('Anfrage fehlgeschlagen')
  }
  return response.json() as Promise<T>
}

async function bildAnfrage<T>(pfad: string, bild: File): Promise<T> {
  const daten = new FormData()
  daten.append('bild', bild)
  const response = await fetch(`/api${pfad}`, { method: 'POST', body: daten })
  if (!response.ok) {
    throw new Error('Anfrage fehlgeschlagen')
  }
  return response.json() as Promise<T>
}

/** Alle Produkttypen, auch mit Anzahl 0. */
export function produkttypenLaden() {
  return anfrage<ProduktTyp[]>('/produkttypen')
}

/** Erhöht einen bekannten Produkttyp oder legt ihn neu an. */
export function produkttypHinzufuegen(name: string, anzahl: number) {
  return anfrage<ProduktTyp>('/produkttypen', {
    method: 'POST',
    body: JSON.stringify({ name, anzahl }),
  })
}

export function anzahlAendern(id: number, delta: number) {
  return anfrage<ProduktTyp>(`/produkttypen/${id}/aendern`, {
    method: 'POST',
    body: JSON.stringify({ delta }),
  })
}

export function produkttypEntfernen(id: number) {
  return anfrage<ProduktTyp>(`/produkttypen/${id}/entfernen`, { method: 'POST' })
}

export type BarcodeErgebnis = {
  barcode: string
  /** Schon zugeordnet: dieser Produkttyp wird direkt vorgeschlagen */
  produkttyp: ProduktTyp | null
  /** Sonst: Angaben aus Open Food Facts, falls das Produkt dort bekannt ist */
  off_name: string | null
  off_marke: string | null
  /** true, wenn Open Food Facts nicht erreichbar war */
  off_fehler: boolean
}

/** Erst die eigene Zuordnung, sonst Open Food Facts. */
export function barcodeNachschlagen(barcode: string) {
  return anfrage<BarcodeErgebnis>(`/barcode/${barcode}`)
}

/** Erkennt einen Barcode in einem hochgeladenen Foto und fragt ihn nach. */
export function barcodeAusBildLesen(bild: File) {
  return bildAnfrage<BarcodeErgebnis>('/barcode/bild', bild)
}

/** Bucht den bestätigten Produkttyp ein und speichert die Zuordnung zum Barcode. */
export function barcodeEinbuchen(barcode: string, name: string, anzahl: number) {
  return anfrage<ProduktTyp>(`/barcode/${barcode}`, {
    method: 'POST',
    body: JSON.stringify({ name, anzahl }),
  })
}
