import pytest

from app import main


def anlegen(client, name, anzahl=1):
    response = client.post("/api/produkttypen", json={"name": name, "anzahl": anzahl})
    assert response.status_code == 200
    return response.json()


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_anlegen_und_liste(client):
    anlegen(client, "Karotten", 3)
    anlegen(client, "Äpfel")

    liste = client.get("/api/produkttypen").json()
    assert {(p["name"], p["anzahl"]) for p in liste} == {("Karotten", 3), ("Äpfel", 1)}


def test_bekannter_name_wird_hochgezaehlt(client):
    erster = anlegen(client, "Äpfel", 2)
    zweiter = anlegen(client, "  äPFEL ", 3)

    assert zweiter["id"] == erster["id"]
    assert zweiter["name"] == "Äpfel"
    assert zweiter["anzahl"] == 5
    assert len(client.get("/api/produkttypen").json()) == 1


def test_name_wird_bereinigt(client):
    assert anlegen(client, "  Bio   Karotten ")["name"] == "Bio Karotten"


@pytest.mark.parametrize("daten", [{"name": "   "}, {"name": "Milch", "anzahl": 0}])
def test_ungueltige_eingabe(client, daten):
    assert client.post("/api/produkttypen", json=daten).status_code == 422


def test_plus_minus(client):
    p = anlegen(client, "Milch", 2)
    url = f"/api/produkttypen/{p['id']}/aendern"

    assert client.post(url, json={"delta": 1}).json()["anzahl"] == 3
    assert client.post(url, json={"delta": -1}).json()["anzahl"] == 2


def test_anzahl_faellt_nicht_unter_null(client):
    p = anlegen(client, "Milch", 1)
    url = f"/api/produkttypen/{p['id']}/aendern"

    assert client.post(url, json={"delta": -1}).json()["anzahl"] == 0
    assert client.post(url, json={"delta": -5}).json()["anzahl"] == 0


def test_entfernen_behaelt_eintrag(client):
    p = anlegen(client, "Joghurt", 4)

    response = client.post(f"/api/produkttypen/{p['id']}/entfernen")
    assert response.json()["anzahl"] == 0

    # Bleibt für die Autovervollständigung in der Liste
    liste = client.get("/api/produkttypen").json()
    assert liste == [{"id": p["id"], "name": "Joghurt", "anzahl": 0}]

    # Erneutes Hinzufügen nutzt denselben Eintrag
    assert anlegen(client, "joghurt")["id"] == p["id"]


def test_unbekannte_id(client):
    assert client.post("/api/produkttypen/999/aendern", json={"delta": 1}).status_code == 404
    assert client.post("/api/produkttypen/999/entfernen").status_code == 404


@pytest.mark.parametrize(
    "daten",
    [{"name": "x" * 101}, {"name": "Milch", "anzahl": 10_000}],
)
def test_obergrenzen_beim_anlegen(client, daten):
    assert client.post("/api/produkttypen", json=daten).status_code == 422


def test_obergrenze_delta(client):
    p = anlegen(client, "Milch")
    url = f"/api/produkttypen/{p['id']}/aendern"
    assert client.post(url, json={"delta": 10_000}).status_code == 422


def test_gleichzeitig_angelegter_name_wird_hochgezaehlt(client, monkeypatch):
    p = anlegen(client, "Brot", 2)

    # Simuliert ein zweites Gerät: die Suche sieht den Eintrag noch nicht, der Insert scheitert
    original = main.nach_name_suchen
    aufrufe = []

    def erst_nicht_gefunden(session, name):
        aufrufe.append(name)
        return None if len(aufrufe) == 1 else original(session, name)

    monkeypatch.setattr(main, "nach_name_suchen", erst_nicht_gefunden)

    response = client.post("/api/produkttypen", json={"name": "Brot", "anzahl": 3})
    assert response.status_code == 200
    assert response.json() == {"id": p["id"], "name": "Brot", "anzahl": 5}
