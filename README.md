# Lebensmittel-Inventar-App (MVP)

Bestandsübersicht mit +/− und Entfernen sowie manueller Eingabe mit Autovervollständigung.
Plan und Specs liegen in [specs/](specs/).

## Projektstruktur

```text
app/
  api/                  HTTP-Routen, Abhängigkeiten und API-Versionen
  core/                 Datenbankverbindung und zentrale Infrastruktur
  integrations/         Externe Dienste
  models/               Datenbankmodelle
  schemas/              Transferobjekte und Eingabevalidierung
  services/             Fachlogik
  main.py               FastAPI-Einstiegspunkt
bin/                    Startskripte
database/               SQLite-Datenbankdatei
specs/                  Anforderungen und technische Dokumentation
src/web/                React-Oberfläche
tests/
  api/                  API- und Integrationstests
pyproject.toml          Python-Abhängigkeiten und Werkzeugkonfiguration
uv.lock                 Gesperrte Python-Abhängigkeiten
```

## Voraussetzungen

- [uv](https://docs.astral.sh/uv/) (installiert Python bei Bedarf selbst)
- [Node.js](https://nodejs.org/) LTS

## Starten

In zwei Terminals:

```powershell
.\bin\start-server.ps1
```

```powershell
.\bin\start-web.ps1
```

Dann <http://localhost:5173> öffnen. Vite leitet `/api` an das Serverprogramm auf Port 8000 weiter.
Läuft das Serverprogramm woanders, setzt man vor dem Start der Weboberfläche `API_PROXY`, z. B.
`$env:API_PROXY = "http://localhost:8765"`.
Die API-Doku gibt es unter <http://localhost:8000/docs>.

Die Datenbank `database/inventar.db` (SQLite) entsteht beim ersten Start. Zum Zurücksetzen kann
diese Datei gelöscht werden. Eine andere Datenbank lässt sich über `DATABASE_URL` setzen.

## Prüfen

```powershell
uv run pytest
uv run ruff check .
uv run ruff format --check .
```

```powershell
Set-Location src/web
npm install   # nur beim ersten Mal
npm run build # Typprüfung und Build
npm run lint
```
