# Lebensmittel-Inventar-App (MVP)

Bestandsübersicht mit +/− und Entfernen sowie manuelle Eingabe mit Autovervollständigung.
Plan und Specs liegen in [specs/](specs/).

## Voraussetzungen

- [uv](https://docs.astral.sh/uv/) (installiert Python bei Bedarf selbst)
- [Node.js](https://nodejs.org/) LTS

## Starten

Zwei Terminals:

```sh
# Terminal 1: Backend auf http://localhost:8000
cd backend
uv run uvicorn app.main:app --reload
```

```sh
# Terminal 2: Frontend auf http://localhost:5173
cd frontend
npm install   # nur beim ersten Mal
npm run dev
```

Dann <http://localhost:5173> öffnen. Vite leitet `/api` an das Backend weiter.
Die API-Doku gibt es unter <http://localhost:8000/docs>.

Die Datenbank `backend/inventar.db` (SQLite) entsteht beim ersten Start. Zum Zurücksetzen einfach löschen.
Eine andere Datenbank lässt sich über die Umgebungsvariable `DATABASE_URL` setzen.

## Prüfen

```sh
cd backend
uv run pytest
uv run ruff check .
uv run ruff format .
```

```sh
cd frontend
npm run build   # Typprüfung und Build
npm run lint
```
