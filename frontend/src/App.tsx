import { CirclePlus, Package, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Bestand } from '@/components/Bestand'
import { Hinzufuegen } from '@/components/Hinzufuegen'
import { cn } from '@/lib/utils'

type Tab = 'bestand' | 'hinzufuegen'

const TABS: { id: Tab; titel: string; icon: LucideIcon }[] = [
  { id: 'bestand', titel: 'Bestand', icon: Package },
  { id: 'hinzufuegen', titel: 'Hinzufügen', icon: CirclePlus },
]

// Der Tab steht im URL-Hash, damit Zurück-Taste und Neuladen funktionieren
function tabAusHash(): Tab {
  return window.location.hash === '#hinzufuegen' ? 'hinzufuegen' : 'bestand'
}

export default function App() {
  const [tab, setTab] = useState<Tab>(tabAusHash)

  useEffect(() => {
    const onHashChange = () => setTab(tabAusHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function wechseln(ziel: Tab) {
    window.location.hash = ziel
  }

  const titel = TABS.find((t) => t.id === tab)!.titel

  return (
    <div className="flex min-h-svh flex-col">
      <header className="fixed inset-x-0 top-0 z-50 bg-surface/85 pt-[env(safe-area-inset-top)] shadow-[0_1px_8px_rgba(58,48,42,0.03)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-md items-center px-6">
          <span className="font-headline text-2xl font-medium">{titel}</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-6 pt-[calc(4rem+env(safe-area-inset-top))] pb-[calc(7rem+env(safe-area-inset-bottom))]">
        {tab === 'bestand' ? <Bestand zuHinzufuegen={() => wechseln('hinzufuegen')} /> : <Hinzufuegen />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 bg-surface/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_16px_rgba(58,48,42,0.04)] backdrop-blur-xl">
        <div className="mx-auto grid h-20 max-w-sm grid-cols-2 items-center px-4">
          {TABS.map(({ id, titel, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? 'page' : undefined}
              onClick={() => wechseln(id)}
              className={cn(
                'flex h-14 flex-col items-center justify-center gap-1.5 rounded-xl transition-colors',
                tab === id ? 'font-semibold text-primary' : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              <Icon className="size-6" />
              <span className="text-[11px] tracking-wide uppercase">{titel}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
