# Technische Umsetzung: Lebensmittel-Inventar-App (Prototyp)

Ergänzt [Spezifikation_Prototyp.md](Spezifikation_Prototyp.md).

## 1. Überblick

| Bereich | Entscheidung |
|---|---|
| Architektur | FastAPI-Backend + separates Frontend |
| Repo | Monorepo mit `backend/` und `frontend/` |
| Frontend | React + Vite + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Daten im Frontend | TanStack Query + generierter API-Client |
| PWA | `vite-plugin-pwa`: installierbar, App-Shell gecacht |
| Datenbank | SQLite über SQLModel + Alembic, später Postgres |
| Login | Ein gemeinsamer Account, Passwort-Hash + Session-Cookie |
| Barcode | `barcode-detector` (Polyfill) |
| Produktdatenbank | Open Food Facts + eigene Zuordnungen |
| LLM | Lokal über Ollama, Qwen-VL (~7B), OpenAI-kompatibler Client |
| Autovervollständigung | Fuse.js im Client |
| Tooling (Python) | uv + Ruff + pytest |
| Hosting | Vorerst nur lokale Entwicklung |

```
Handy (PWA, React)
   │  Kamera, Barcode-Scan, Fuse.js
   ▼  HTTPS/JSON + Session-Cookie
FastAPI (Python)
   ├─ SQLite (SQLModel/Alembic)
   ├─ Open Food Facts (Barcode → Name)
   └─ Ollama, Qwen-VL (Kassenzettel, Produkttyp-Vorschlag)
```

## 2. Frontend

- **React + Vite + TypeScript.**
- **Tailwind CSS + shadcn/ui** für die Komponenten. Der Komponenten-Code liegt im Projekt.
- **TanStack Query** übernimmt Laden, Caching und Ladezustände. Den API-Client generiert ihr aus FastAPIs OpenAPI-Schema (z. B. mit `openapi-typescript`).
- **Synchronisation:** Kein Live-Push. TanStack Query lädt neu, sobald man in die App zurückwechselt, und zusätzlich in einem Intervall.
- **PWA** über `vite-plugin-pwa`: installierbar mit Homescreen-Icon, die App-Shell wird gecacht. Daten ändern geht nur mit Verbindung.

## 3. Backend

- **FastAPI**, Abhängigkeiten mit **uv**, Lint und Format mit **Ruff**, Tests mit **pytest**.
- **SQLModel** dient zugleich als Tabellen- und API-Schema, **Alembic** übernimmt die Migrationen.
- **SQLite** für den Prototyp. Der Wechsel zu Postgres ändert nur die Verbindungs-URL.

### 3.1 Login
- Ein einziger Account in der DB, das Passwort gehasht mit argon2 oder bcrypt.
- Der Login setzt ein **HttpOnly-Session-Cookie**.
- Frontend und Backend laufen unter demselben Origin. Lokal leitet der Vite-Dev-Server `/api` per Proxy an FastAPI weiter.
- Später kann daraus ein Modell mit Haushalten und eigenen Nutzerkonten werden.

## 4. Datenmodell

```
produkttyp
  id       INTEGER PK
  name     TEXT UNIQUE
  anzahl   INTEGER  (>= 0)

barcode_zuordnung
  barcode        TEXT PK
  produkttyp_id  INTEGER FK → produkttyp.id
```

- **Bei Stückzahl 0** bleibt die Zeile erhalten. Die Übersicht zeigt nur `anzahl > 0`. Dadurch bleiben die Barcode-Zuordnung und die Einträge für die Autovervollständigung erhalten.
- **Mengenänderungen laufen atomar in SQL**, z. B. `UPDATE produkttyp SET anzahl = anzahl + 1 WHERE id = ?`. So gibt es keine verlorenen Änderungen, wenn mehrere Geräte mit dem gemeinsamen Login gleichzeitig arbeiten.

## 5. Barcode-Scan

- **Bibliothek:** npm-Paket `barcode-detector`, ein Polyfill der BarcodeDetector-API auf Basis von zxing-wasm. Wo der Browser die API nativ hat (Chrome/Android), wird sie genutzt. Das Paket funktioniert auch auf iOS und in Firefox.
- **Mehrfach-Scan:** Die Kamera scannt durchgehend. Jeder erkannte Barcode zählt +1. Wird derselbe Barcode innerhalb von etwa 1,5 s erneut erkannt, ignoriert die App ihn (Entprellen). Ein Zähler (+/−) erlaubt Korrekturen.
- **Feedback:** visuell, also kurzes Aufblinken und eine Anzeige wie „Joghurt × 3“.

### 5.1 Ablauf beim Scan
1. In `barcode_zuordnung` nachsehen. Ist der Barcode bekannt, wird der Produkttyp direkt übernommen.
2. Sonst bei **Open Food Facts** den Produktnamen holen. Dabei einen eigenen User-Agent setzen und die Rate-Limits beachten.
3. Das **LLM** bekommt den Produktnamen und die Liste der vorhandenen Produkttypen und schlägt einen Produkttyp vor.
4. Der Nutzer bestätigt oder korrigiert den Vorschlag, mit Autovervollständigung.
5. Die Zuordnung wird in `barcode_zuordnung` gespeichert.

Kennt Open Food Facts den Barcode nicht, gibt der Nutzer den Produkttyp manuell ein (Schritt 4).

## 6. LLM (Kassenzettel und Produkttyp-Vorschlag)

- **Lokal über Ollama** auf einem Rechner mit NVIDIA-GPU (mindestens 8 GB VRAM).
- **Startmodell:** Qwen-VL in der 7B-Klasse, z. B. `qwen2.5vl:7b` oder ein Nachfolger. Den genauen Namen in der aktuellen Ollama-Library prüfen.
- Beide Aufgaben nutzen dasselbe Modell.
- **Client:** der `openai`-Python-Client mit `base_url=http://localhost:11434/v1`, also die OpenAI-kompatible API von Ollama.
- **Konfiguration per `.env`**, z. B. `LLM_BASE_URL`, `LLM_MODEL`. So lassen sich Modelle an echten Kassenzetteln vergleichen und später andere Anbieter anbinden, ohne den Code zu ändern.
- **Ausgabe:** JSON nach einem festen Schema, im Backend mit **Pydantic validiert**. Ist die Antwort ungültig, fragt das Backend einmal neu an.

### 6.1 Kassenzettel
1. Das Frontend lädt das Foto hoch, das Backend schickt es an das Modell.
2. Im Prompt steht die Liste der vorhandenen Produkttypen, damit das Modell die Artikel diesen zuordnet.
3. Die Antwort ist eine Liste wie `[{name, anzahl, produkttyp_vorschlag}]`.
4. Im Frontend erscheint eine **Bestätigungsliste**: Artikel abwählen (z. B. Pfand), korrigieren, Anzahl anpassen, übernehmen.
5. Die Erkennung dauert lokal einige Sekunden. Das Frontend zeigt deshalb einen Ladezustand.

## 7. Manuelle Eingabe

- **Fuse.js im Client:** Alle Produkttypen werden geladen und unscharf gefiltert. Das toleriert Tippfehler, z. B. „Karoten“ → „Karotten“, und vermeidet Dubletten.

## 8. Entwicklung

- Vorerst wird nur lokal entwickelt.
- **Kamera auf dem Handy testen:** Der Browser erlaubt die Kamera nur über HTTPS bzw. `localhost`. Deshalb einen Tunnel nutzen (`cloudflared` oder `ngrok`).

## 9. Offene Punkte

- **Hosting:** Das LLM läuft lokal auf einer GPU. Für ein späteres Deployment braucht der Server Zugriff darauf, z. B. den GPU-Rechner per Tunnel oder einen GPU-Server. Ein einfacher VPS reicht nicht.
- **Konkretes Qwen-Modell:** an echten Kassenzetteln testen und auswählen.
- **Später:** der Umstieg von SQLite auf Postgres und ein Ensemble aus mehreren Modellen für den Kassenzettel (siehe Spezifikation, Abschnitt 5).
