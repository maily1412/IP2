import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAnzahlAendern, useEntfernen, useProdukttypen } from '@/lib/queries'

export function Bestandsuebersicht() {
  const { data, isPending, isError } = useProdukttypen()
  const aendern = useAnzahlAendern()
  const entfernen = useEntfernen()

  // Anzahl 0 ist ausgeblendet, bleibt aber für die Autovervollständigung in der DB
  const vorhanden = (data ?? [])
    .filter((p) => p.anzahl > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bestand</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <p className="text-muted-foreground">Lädt …</p>
        ) : isError ? (
          <p className="text-destructive">Backend nicht erreichbar.</p>
        ) : vorhanden.length === 0 ? (
          <p className="text-muted-foreground">Noch keine Produkte.</p>
        ) : (
          <ul className="divide-y">
            {vorhanden.map((p) => (
              <li key={p.id} className="flex items-center gap-2 py-2">
                <span className="flex-1 truncate">{p.name}</span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`${p.name} verringern`}
                  onClick={() => aendern.mutate({ id: p.id, delta: -1 })}
                >
                  <Minus />
                </Button>
                <span className="w-8 text-center tabular-nums">{p.anzahl}</span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`${p.name} erhöhen`}
                  onClick={() => aendern.mutate({ id: p.id, delta: 1 })}
                >
                  <Plus />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${p.name} entfernen`}
                  onClick={() => entfernen.mutate(p.id)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {(aendern.isError || entfernen.isError) && (
          <p className="mt-2 text-sm text-destructive">Änderung fehlgeschlagen.</p>
        )}
      </CardContent>
    </Card>
  )
}
