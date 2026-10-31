import re
from typing import Annotated
from pathlib import Path as FilePath
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, Path as ApiPath, UploadFile

from app.api.dependencies import SessionDep
from app.integrations import openfoodfacts
from app.models.barcode import BarcodeZuordnung
from app.models.product import ProduktTyp
from app.schemas.barcode import BarcodeErgebnis
from app.schemas.produkttyp import ProduktTypCreate, ProduktTypRead
from app.services import inventory
from app.services.barcode_img import readout_barcode

router = APIRouter()
UPLOAD_TEMP_DIR = FilePath(__file__).resolve().parents[4] / ".tmp_uploads"

# EAN-8, UPC-A (12), EAN-13 und GTIN-14
Barcode = Annotated[str, ApiPath(pattern=r"^\d{8}$|^\d{12,14}$")]


@router.post("/barcode/bild", response_model=BarcodeErgebnis)
def barcode_aus_bild_lesen(session: SessionDep, bild: UploadFile = File(...)):
    """Liest einen Barcode aus einem hochgeladenen Bild und schlägt ihn nach."""
    if not bild.content_type or not bild.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Bitte eine Bilddatei hochladen.")

    UPLOAD_TEMP_DIR.mkdir(parents=True, exist_ok=True)
    temporaer_pfad = UPLOAD_TEMP_DIR / f"{uuid4().hex}{FilePath(bild.filename or 'bild.jpg').suffix}"
    try:
        with temporaer_pfad.open("wb") as temporaer:
            temporaer.write(bild.file.read())
        try:
            erkannt = readout_barcode(temporaer_pfad)
        except (ValueError, IndexError) as e:
            raise HTTPException(status_code=422, detail=str(e)) from e
    finally:
        bild.file.close()
        temporaer_pfad.unlink(missing_ok=True)

    if erkannt is None:
        raise HTTPException(status_code=422, detail="Kein Barcode im Bild gefunden.")
    barcode = erkannt.text
    if not re.fullmatch(r"(?:\d{8}|\d{12,14})", barcode):
        raise HTTPException(status_code=422, detail="Der erkannte Barcode hat ein ungültiges Format.")
    return barcode_nachschlagen(barcode, session)


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
