# Arbeitsplan: MVP Lebensmittel-Inventar-App

Grundlage: [Anforderungen.md](Anforderungen.md) (4.1, 4.4, 4.5) und [Technik.md](Technik.md).

## 1. Umfang

**Im MVP:**
- Bestandsübersicht mit +/− und Entfernen
- Manuelle Eingabe mit Autovervollständigung

**Nachträglich dazugekommen:** Barcode per Hand eintippen und über Open Food Facts nachschlagen (Schritt 5).

**Noch nicht im MVP:** Login, Barcode-Scan mit der Kamera, Kassenzettel, LLM, PWA, Handy-Test, Hosting.

Bewusste Vereinfachungen gegenüber Technik.md, damit es schnell geht:
- Kein Login. Die App läuft nur lokal.
- Keine Alembic-Migrationen. Die Tabelle wird beim Start mit `SQLModel.metadata.create_all()` angelegt.
- Kein generierter API-Client. Ein paar `fetch`-Funktionen reichen.

Der Stack bleibt derselbe (FastAPI, SQLite/SQLModel, React + Vite + TypeScript, Tailwind + shadcn/ui, TanStack Query, Fuse.js). So kann man später ohne Umbau weiterbauen.

## 2. Schritte

### Schritt 1: Setup

- [x] `backend/` mit uv: FastAPI, SQLModel, Ruff, pytest
- [x] `frontend/` mit Vite + React + TypeScript, Tailwind, shadcn/ui, TanStack Query, Fuse.js
- [x] Vite-Proxy `/api` → FastAPI
- [x] README mit den Startbefehlen

**Fertig, wenn** beide Teile mit je einem Befehl starten und `GET /api/health` antwortet.

### Schritt 2: Backend

- [x] Tabelle `produkttyp`: `id`, `name` (eindeutig), `anzahl` (≥ 0)
- [x] Endpunkte (siehe Abschnitt 3)
- [x] Mengenänderungen atomar per `UPDATE produkttyp SET anzahl = MAX(0, anzahl + ?) WHERE id = ?`
- [x] Namen beim Anlegen trimmen und ohne Groß-/Kleinschreibung vergleichen, damit „karotten“ und „Karotten“ kein doppelter Eintrag werden
- [x] pytest: anlegen, bestehenden Namen hochzählen, +/−, Untergrenze 0, Entfernen

**Fertig, wenn** alle Endpunkte in der FastAPI-Doku (`/docs`) funktionieren und die Tests grün sind.

### Schritt 3: Bestandsübersicht

- [x] TanStack Query: Liste laden, nach jeder Änderung neu laden
- [x] Liste aller Produkttypen mit `anzahl > 0`, alphabetisch sortiert
- [x] Pro Zeile: Name, Anzahl, Buttons **+**, **−** und **Entfernen**
- [x] Bei **−** auf 1 oder bei **Entfernen** verschwindet die Zeile. Der Eintrag bleibt in der DB.
- [x] Leerer Zustand: „Noch keine Produkte“

**Fertig, wenn** man Produkte hoch- und runterzählen kann und sie bei 0 verschwinden.

### Schritt 4: Manuelle Eingabe mit Autovervollständigung

- [x] Formular mit Name und Stückzahl (Standard 1)
- [x] Fuse.js durchsucht **alle** Produkttypen, auch die mit Anzahl 0, und toleriert Tippfehler („Karoten“ → „Karotten“)
- [x] Vorschläge unter dem Eingabefeld, auswählbar mit Klick oder Pfeiltasten + Enter
- [x] Speichern: Ein bekannter Typ wird um die Stückzahl erhöht, sonst neu angelegt
- [x] Danach Formular leeren, Übersicht aktualisieren

**Fertig, wenn** „Karoten“ den Vorschlag „Karotten“ bringt und ein Produkt mit Anzahl 0 über die Eingabe wieder in der Übersicht erscheint.

### Schritt 5: Barcode eintippen

- [x] Tabelle `barcode_zuordnung`: `barcode` → `produkttyp_id`
- [x] Open-Food-Facts-Client mit eigenem User-Agent, Timeout und Cache im Speicher
- [x] Nachschlagen: erst die eigene Zuordnung, sonst Open Food Facts (deutscher Name bevorzugt)
- [x] Einbuchen: Produkttyp hochzählen oder anlegen und die Zuordnung speichern oder korrigieren
- [x] Frontend: Barcode eintippen, Vorschlag mit Autovervollständigung bestätigen oder korrigieren
- [x] Ist Open Food Facts nicht erreichbar oder kennt den Barcode nicht, gibt man den Produkttyp selbst ein

Statt des LLM-Vorschlags aus Technik.md wird vorerst der Name aus Open Food Facts direkt vorgeschlagen.

**Fertig, wenn** ein Barcode nach einmaliger Bestätigung beim nächsten Mal direkt den richtigen Produkttyp vorschlägt.

## 3. API

| Methode | Pfad | Zweck |
|---|---|---|
| GET | `/api/produkttypen` | Alle Typen, auch mit Anzahl 0. Die Übersicht filtert im Client auf `anzahl > 0` |
| POST | `/api/produkttypen` | `{name, anzahl}`: bekannten Typ erhöhen oder neu anlegen |
| POST | `/api/produkttypen/{id}/aendern` | `{delta}`, z. B. +1 oder −1, nicht unter 0 |
| POST | `/api/produkttypen/{id}/entfernen` | Anzahl auf 0 setzen |
| GET | `/api/barcode/{code}` | Bekannter Produkttyp oder Name und Marke aus Open Food Facts |
| POST | `/api/barcode/{code}` | `{name, anzahl}`: einbuchen und Zuordnung speichern |

Ein `GET`-Endpunkt reicht für die Übersicht und die Autovervollständigung.

## 4. Aufteilung

- **Backend:** Schritt 2
- **Frontend:** Schritte 3 und 4

Beide Teile können parallel starten, sobald die API aus Abschnitt 3 feststeht. Das Frontend kann bis dahin mit Testdaten arbeiten.
