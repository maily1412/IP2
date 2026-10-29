// Grenzen wie im Backend (models.py, main.py)
export const MAX_NAME = 100
export const MAX_ANZAHL = 9999

/** EAN-8, UPC-A (12), EAN-13 und GTIN-14 */
export function barcodeGueltig(barcode: string) {
  return /^\d{8}$|^\d{12,14}$/.test(barcode)
}

/** Gemeinsamer Stil der Eingabefelder aus dem Design-Entwurf */
export const FELD_KLASSE =
  'w-full rounded-lg bg-surface-container-low px-4 py-3.5 text-base text-on-surface transition-colors placeholder:text-outline focus:bg-surface-variant focus:outline-none disabled:opacity-60'

export const LABEL_KLASSE = 'text-xs font-semibold tracking-wider text-on-surface-variant uppercase'
