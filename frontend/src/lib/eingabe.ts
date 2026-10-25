// Grenzen wie im Backend (models.py, main.py)
export const MAX_NAME = 100
export const MAX_ANZAHL = 9999

/** Die eingegebene Stückzahl als Zahl, oder null, wenn sie ungültig ist. */
export function anzahlAusEingabe(eingabe: string): number | null {
  const zahl = Number(eingabe)
  return Number.isInteger(zahl) && zahl >= 1 && zahl <= MAX_ANZAHL ? zahl : null
}

/** EAN-8, UPC-A (12), EAN-13 und GTIN-14 */
export function barcodeGueltig(barcode: string) {
  return /^\d{8}$|^\d{12,14}$/.test(barcode)
}
