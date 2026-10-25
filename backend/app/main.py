from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Path
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, case, select, update

from app import openfoodfacts
from app.db import get_session, init_db
from app.models import (
    AnzahlAenderung,
    BarcodeErgebnis,
    BarcodeZuordnung,
    ProduktTyp,
    ProduktTypCreate,
    ProduktTypRead,
)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    init_db()
    yield


app = FastAPI(title="Lebensmittel-Inventar", lifespan=lifespan)

SessionDep = Annotated[Session, Depends(get_session)]


def anzahl_aendern(session: Session, produkttyp_id: int, delta: int) -> ProduktTyp:
    """Ändert die Anzahl atomar in SQL, damit parallele Geräte keine Änderungen verlieren."""
    neu = ProduktTyp.anzahl + delta
    result = session.exec(
        update(ProduktTyp)
        .where(ProduktTyp.id == produkttyp_id)
        .values(anzahl=case((neu < 0, 0), else_=neu))
    )
    session.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Produkttyp nicht gefunden")
    produkttyp = session.get(ProduktTyp, produkttyp_id)
    session.refresh(produkttyp)
    return produkttyp


def nach_name_suchen(session: Session, name: str) -> ProduktTyp | None:
    # Vergleich in Python, weil SQLites lower() keine Umlaute kennt
    schluessel = name.casefold()
    return next(
        (p for p in session.exec(select(ProduktTyp)) if p.name.casefold() == schluessel),
        None,
    )


def hinzufuegen(session: Session, name: str, anzahl: int) -> ProduktTyp:
    """Erhöht einen bekannten Produkttyp oder legt ihn neu an."""
    vorhanden = nach_name_suchen(session, name)
    if vorhanden:
        return anzahl_aendern(session, vorhanden.id, anzahl)

    produkttyp = ProduktTyp(name=name, anzahl=anzahl)
    session.add(produkttyp)
    try:
        session.commit()
    except IntegrityError:
        # Ein anderes Gerät hat denselben Namen gerade angelegt: dann dort hochzählen
        session.rollback()
        return anzahl_aendern(session, nach_name_suchen(session, name).id, anzahl)
    session.refresh(produkttyp)
    return produkttyp


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/produkttypen", response_model=list[ProduktTypRead])
def produkttypen_liste(session: SessionDep):
    """Alle Produkttypen, auch mit Anzahl 0 (für die Autovervollständigung)."""
    return session.exec(select(ProduktTyp).order_by(ProduktTyp.name)).all()


@app.post("/api/produkttypen", response_model=ProduktTypRead)
def produkttyp_hinzufuegen(daten: ProduktTypCreate, session: SessionDep):
    return hinzufuegen(session, daten.name, daten.anzahl)


@app.post("/api/produkttypen/{produkttyp_id}/aendern", response_model=ProduktTypRead)
def produkttyp_aendern(produkttyp_id: int, aenderung: AnzahlAenderung, session: SessionDep):
    return anzahl_aendern(session, produkttyp_id, aenderung.delta)


@app.post("/api/produkttypen/{produkttyp_id}/entfernen", response_model=ProduktTypRead)
def produkttyp_entfernen(produkttyp_id: int, session: SessionDep):
    """Setzt die Anzahl auf 0. Der Eintrag bleibt für die Autovervollständigung erhalten."""
    produkttyp = session.get(ProduktTyp, produkttyp_id)
    if not produkttyp:
        raise HTTPException(status_code=404, detail="Produkttyp nicht gefunden")
    produkttyp.anzahl = 0
    session.add(produkttyp)
    session.commit()
    session.refresh(produkttyp)
    return produkttyp


# EAN-8, UPC-A (12), EAN-13 und GTIN-14
Barcode = Annotated[str, Path(pattern=r"^\d{8}$|^\d{12,14}$")]


@app.get("/api/barcode/{barcode}", response_model=BarcodeErgebnis)
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


@app.post("/api/barcode/{barcode}", response_model=ProduktTypRead)
def barcode_hinzufuegen(barcode: Barcode, daten: ProduktTypCreate, session: SessionDep):
    """Bucht den bestätigten Produkttyp ein und merkt sich die Zuordnung für den nächsten Scan."""
    produkttyp = hinzufuegen(session, daten.name, daten.anzahl)
    session.merge(BarcodeZuordnung(barcode=barcode, produkttyp_id=produkttyp.id))
    session.commit()
    session.refresh(produkttyp)
    return produkttyp
