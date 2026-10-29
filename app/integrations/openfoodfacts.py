import os
from dataclasses import dataclass

import httpx

OFF_URL = "https://world.openfoodfacts.org/api/v2/product/{barcode}.json"
# Open Food Facts verlangt einen eigenen User-Agent
USER_AGENT = os.getenv("OFF_USER_AGENT", "IP2-Lebensmittel-Inventar/0.1")


class OffNichtErreichbar(Exception):
    pass


@dataclass(frozen=True)
class OffProdukt:
    name: str
    marke: str | None


# Gefundene Produkte merken, um die Rate-Limits zu schonen
_cache: dict[str, OffProdukt | None] = {}


def produkt_nachschlagen(barcode: str) -> OffProdukt | None:
    """Holt Name und Marke zu einem Barcode. None, wenn Open Food Facts ihn nicht kennt."""
    if barcode in _cache:
        return _cache[barcode]

    try:
        response = httpx.get(
            OFF_URL.format(barcode=barcode),
            params={"fields": "product_name,product_name_de,brands"},
            headers={"User-Agent": USER_AGENT},
            timeout=5,
        )
    except httpx.HTTPError as e:
        raise OffNichtErreichbar from e

    if response.status_code == 404:
        produkt = None
    elif response.is_success:
        daten = response.json().get("product") or {}
        name = (daten.get("product_name_de") or daten.get("product_name") or "").strip()
        marke = (daten.get("brands") or "").split(",")[0].strip() or None
        produkt = OffProdukt(name=name, marke=marke) if name else None
    else:
        raise OffNichtErreichbar(f"HTTP {response.status_code}")

    _cache[barcode] = produkt
    return produkt
