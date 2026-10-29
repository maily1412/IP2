import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  anzahlAendern,
  barcodeEinbuchen,
  barcodeNachschlagen,
  produkttypEntfernen,
  produkttypenLaden,
  produkttypHinzufuegen,
  type ProduktTyp,
} from '@/lib/api'

const PRODUKTTYPEN = ['produkttypen']

export function useProdukttypen() {
  return useQuery({ queryKey: PRODUKTTYPEN, queryFn: produkttypenLaden })
}

/** Übernimmt den geänderten Eintrag sofort in den Cache und lädt danach die Liste neu. */
function useProdukttypMutation<V>(mutationFn: (variablen: V) => Promise<ProduktTyp>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (geaendert) => {
      queryClient.setQueryData<ProduktTyp[]>(PRODUKTTYPEN, (alt = []) =>
        alt.some((p) => p.id === geaendert.id)
          ? alt.map((p) => (p.id === geaendert.id ? geaendert : p))
          : [...alt, geaendert],
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: PRODUKTTYPEN }),
  })
}

export function useHinzufuegen() {
  return useProdukttypMutation(({ name, anzahl }: { name: string; anzahl: number }) =>
    produkttypHinzufuegen(name, anzahl),
  )
}

export function useAnzahlAendern() {
  return useProdukttypMutation(({ id, delta }: { id: number; delta: number }) =>
    anzahlAendern(id, delta),
  )
}

export function useEntfernen() {
  return useProdukttypMutation((id: number) => produkttypEntfernen(id))
}

export function useBarcodeNachschlagen() {
  return useMutation({ mutationFn: barcodeNachschlagen })
}

export function useBarcodeEinbuchen() {
  return useProdukttypMutation(
    ({ barcode, name, anzahl }: { barcode: string; name: string; anzahl: number }) =>
      barcodeEinbuchen(barcode, name, anzahl),
  )
}
