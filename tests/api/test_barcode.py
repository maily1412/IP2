import httpx
import pytest

from app.integrations import openfoodfacts
from app.integrations.openfoodfacts import OffNichtErreichbar, OffProdukt

EAN = "4000417025005"


@pytest.fixture
def off(monkeypatch):
    """Ersetzt Open Food Facts durch ein Dict: Barcode → Produkt."""
    produkte: dict[str, OffProdukt] = {}
    aufrufe: list[str] = []

    def nachschlagen(barcode):
        aufrufe.append(barcode)
        return produkte.get(barcode)

    monkeypatch.setattr(openfoodfacts, "produkt_nachschlagen", nachschlagen)
    return produkte, aufrufe


def test_unbekannt_bei_open_food_facts(client, off):
    assert client.get(f"/api/barcode/{EAN}").json() == {
        "barcode": EAN,
        "produkttyp": None,
        "off_name": None,
        "off_marke": None,
        "off_fehler": False,
    }


def test_name_aus_open_food_facts(client, off):
    produkte, _ = off
    produkte[EAN] = OffProdukt(name="Marzipan", marke="Ritter Sport")

    ergebnis = client.get(f"/api/barcode/{EAN}").json()
    assert ergebnis["off_name"] == "Marzipan"
    assert ergebnis["off_marke"] == "Ritter Sport"
    assert ergebnis["produkttyp"] is None


def test_open_food_facts_nicht_erreichbar(client, monkeypatch):
    def fehler(barcode):
        raise OffNichtErreichbar

    monkeypatch.setattr(openfoodfacts, "produkt_nachschlagen", fehler)
    assert client.get(f"/api/barcode/{EAN}").json()["off_fehler"] is True


def test_zuordnung_wird_gespeichert_und_genutzt(client, off):
    produkte, aufrufe = off
    produkte[EAN] = OffProdukt(name="Marzipan", marke=None)

    # Nutzer korrigiert den Vorschlag auf einen eigenen Produkttyp
    response = client.post(f"/api/barcode/{EAN}", json={"name": "Schokolade", "anzahl": 2})
    assert response.status_code == 200
    schokolade = response.json()
    assert schokolade["anzahl"] == 2

    # Beim nächsten Nachschlagen kommt die Zuordnung, ohne Open Food Facts zu fragen
    aufrufe.clear()
    ergebnis = client.get(f"/api/barcode/{EAN}").json()
    assert ergebnis["produkttyp"] == schokolade
    assert aufrufe == []

    # Erneut einbuchen zählt denselben Produkttyp hoch
    assert client.post(f"/api/barcode/{EAN}", json={"name": "schokolade"}).json()["anzahl"] == 3


def test_zuordnung_kann_korrigiert_werden(client, off):
    client.post(f"/api/barcode/{EAN}", json={"name": "Schokolade"})
    marzipan = client.post(f"/api/barcode/{EAN}", json={"name": "Marzipan"}).json()

    assert client.get(f"/api/barcode/{EAN}").json()["produkttyp"] == marzipan


@pytest.mark.parametrize("barcode", ["123", "1234567890", "40004170250a5", "123456789012345"])
def test_ungueltiger_barcode(client, off, barcode):
    assert client.get(f"/api/barcode/{barcode}").status_code == 422
    assert client.post(f"/api/barcode/{barcode}", json={"name": "X"}).status_code == 422


def antwort(status, json):
    return lambda *args, **kwargs: httpx.Response(status, json=json)


@pytest.fixture
def leerer_cache(monkeypatch):
    monkeypatch.setattr(openfoodfacts, "_cache", {})


def test_off_client_bevorzugt_deutschen_namen(monkeypatch, leerer_cache):
    daten = {
        "product": {
            "product_name": "Marzipane",
            "product_name_de": "Marzipan",
            "brands": "Ritter Sport, Alfred Ritter",
        }
    }
    monkeypatch.setattr(httpx, "get", antwort(200, daten))

    assert openfoodfacts.produkt_nachschlagen(EAN) == OffProdukt("Marzipan", "Ritter Sport")


@pytest.mark.parametrize(
    ("status", "daten"),
    [(404, {"status": 0}), (200, {"status": 1, "product": {}})],
)
def test_off_client_unbekannt(monkeypatch, leerer_cache, status, daten):
    monkeypatch.setattr(httpx, "get", antwort(status, daten))
    assert openfoodfacts.produkt_nachschlagen(EAN) is None


def test_off_client_fehler(monkeypatch, leerer_cache):
    monkeypatch.setattr(httpx, "get", antwort(503, {}))
    with pytest.raises(OffNichtErreichbar):
        openfoodfacts.produkt_nachschlagen(EAN)

    def timeout(*args, **kwargs):
        raise httpx.ConnectTimeout("zu langsam")

    monkeypatch.setattr(httpx, "get", timeout)
    with pytest.raises(OffNichtErreichbar):
        openfoodfacts.produkt_nachschlagen(EAN)
