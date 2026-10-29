from typing import Annotated

from fastapi import APIRouter, Path

from app.api.dependencies import SessionDep
from app.integrations import openfoodfacts
from app.models.barcode import BarcodeZuordnung
from app.models.product import ProduktTyp
from app.schemas.barcode import BarcodeErgebnis
from app.schemas.produkttyp import ProduktTypCreate, ProduktTypRead
from app.services import inventory

router = APIRouter()

# EAN-8, UPC-A (12), EAN-13 und GTIN-14
Barcode = Annotated[str, Path(pattern=r"^\d{8}$|^\d{12,14}$")]


@router.get("/barcode/{barcode}", response_model=BarcodeErgebnis)
def barcode_nachschlagen(barcode: Barcode, session: SessionDep):
    """Erst die eigene Zuordnung, sonst Open Food Facts."""
    zuordnung = session.get(BarcodeZuordnung, barcode)
    if zuordnung:
        produkttyp = session.get(ProduktTyp, zuordnung.produkttyp_id)
        return BarcodeErgebnis(barcode=barcode, produkttyp=produkttyp)

    try:
        produkt = openfoodfacts.produkt_nachschlagen(barcode)
    except openfoodfacts.OffNichtErreichbar:
        return BarcodeErgebnis(barcode=barcode, off_fehler=True)
    if not produkt:
        return BarcodeErgebnis(barcode=barcode)
    return BarcodeErgebnis(barcode=barcode, off_name=produkt.name, off_marke=produkt.marke)


@router.post("/barcode/{barcode}", response_model=ProduktTypRead)
def barcode_hinzufuegen(barcode: Barcode, daten: ProduktTypCreate, session: SessionDep):
    """Bucht den bestätigten Produkttyp ein und merkt sich die Zuordnung für den nächsten Scan."""
    produkttyp = inventory.hinzufuegen(session, daten.name, daten.anzahl)
    session.merge(BarcodeZuordnung(barcode=barcode, produkttyp_id=produkttyp.id))
    session.commit()
    session.refresh(produkttyp)
    return produkttyp
