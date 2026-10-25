import { useState, type FormEvent } from 'react'
import { AnzahlFeld } from '@/components/AnzahlFeld'
import { ProduktNameFeld } from '@/components/ProduktNameFeld'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { anzahlAusEingabe } from '@/lib/eingabe'
import { useHinzufuegen } from '@/lib/queries'

export function ManuelleEingabe() {
  const hinzufuegen = useHinzufuegen()
  const [name, setName] = useState('')
  const [anzahl, setAnzahl] = useState('1')

  const anzahlZahl = anzahlAusEingabe(anzahl)
  const gueltig = name.trim() !== '' && anzahlZahl !== null

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!gueltig || anzahlZahl === null) return
    hinzufuegen.mutate(
      { name: name.trim(), anzahl: anzahlZahl },
      {
        onSuccess: () => {
          setName('')
          setAnzahl('1')
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manuell hinzufügen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-wrap gap-2">
          <ProduktNameFeld value={name} onChange={setName} />
          <AnzahlFeld value={anzahl} onChange={setAnzahl} />
          <Button type="submit" disabled={!gueltig || hinzufuegen.isPending}>
            Hinzufügen
          </Button>
        </form>
        {hinzufuegen.isError && (
          <p className="mt-2 text-sm text-destructive">Speichern fehlgeschlagen.</p>
        )}
      </CardContent>
    </Card>
  )
}
