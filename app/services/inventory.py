from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, case, select, update

from app.models.product import ProduktTyp


class ProdukttypNichtGefunden(Exception):
    pass


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
        raise ProdukttypNichtGefunden
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
        session.rollback()
        vorhanden = nach_name_suchen(session, name)
        if vorhanden is None:
            raise
        return anzahl_aendern(session, vorhanden.id, anzahl)
    session.refresh(produkttyp)
    return produkttyp


def entfernen(session: Session, produkttyp_id: int) -> ProduktTyp:
    produkttyp = session.get(ProduktTyp, produkttyp_id)
    if produkttyp is None:
        raise ProdukttypNichtGefunden
    produkttyp.anzahl = 0
    session.add(produkttyp)
    session.commit()
    session.refresh(produkttyp)
    return produkttyp
