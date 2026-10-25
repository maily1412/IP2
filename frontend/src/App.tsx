import { BarcodeEingabe } from '@/components/BarcodeEingabe'
import { Bestandsuebersicht } from '@/components/Bestandsuebersicht'
import { ManuelleEingabe } from '@/components/ManuelleEingabe'

export default function App() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col gap-6 px-4 py-6">
      <h1 className="text-2xl font-semibold">Vorrat</h1>
      <BarcodeEingabe />
      <ManuelleEingabe />
      <Bestandsuebersicht />
    </main>
  )
}
