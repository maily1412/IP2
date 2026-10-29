from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.api.dependencies import SessionDep
from app.models.product import ProduktTyp
from app.schemas.produkttyp import AnzahlAenderung, ProduktTypCreate, ProduktTypRead
from app.services import inventory

router = APIRouter()


@router.get("/produkttypen", response_model=list[ProduktTypRead])
def produkttypen_liste(session: SessionDep):
    """Alle Produkttypen, auch mit Anzahl 0 (für die Autovervollständigung)."""
    return session.exec(select(ProduktTyp).order_by(ProduktTyp.name)).all()


@router.post("/produkttypen", response_model=ProduktTypRead)
def produkttyp_hinzufuegen(daten: ProduktTypCreate, session: SessionDep):
    return inventory.hinzufuegen(session, daten.name, daten.anzahl)


@router.post("/produkttypen/{produkttyp_id}/aendern", response_model=ProduktTypRead)
def produkttyp_aendern(produkttyp_id: int, aenderung: AnzahlAenderung, session: SessionDep):
    try:
        return inventory.anzahl_aendern(session, produkttyp_id, aenderung.delta)
    except inventory.ProdukttypNichtGefunden as e:
        raise HTTPException(status_code=404, detail="Produkttyp nicht gefunden") from e


@router.post("/produkttypen/{produkttyp_id}/entfernen", response_model=ProduktTypRead)
def produkttyp_entfernen(produkttyp_id: int, session: SessionDep):
    """Setzt die Anzahl auf 0. Der Eintrag bleibt für die Autovervollständigung erhalten."""
    try:
        return inventory.entfernen(session, produkttyp_id)
    except inventory.ProdukttypNichtGefunden as e:
        raise HTTPException(status_code=404, detail="Produkttyp nicht gefunden") from e
