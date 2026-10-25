from pydantic import field_validator
from sqlmodel import CheckConstraint, Field, SQLModel


class ProduktTyp(SQLModel, table=True):
    __tablename__ = "produkttyp"
    __table_args__ = (CheckConstraint("anzahl >= 0", name="anzahl_nicht_negativ"),)

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    anzahl: int = Field(default=0)


class ProduktTypRead(SQLModel):
    id: int
    name: str
    anzahl: int


MAX_ANZAHL = 9999


class ProduktTypCreate(SQLModel):
    name: str = Field(max_length=100)
    anzahl: int = Field(default=1, ge=1, le=MAX_ANZAHL)

    @field_validator("name")
    @classmethod
    def name_trimmen(cls, v: str) -> str:
        v = " ".join(v.split())
        if not v:
            raise ValueError("Name darf nicht leer sein")
        return v


class AnzahlAenderung(SQLModel):
    delta: int = Field(ge=-MAX_ANZAHL, le=MAX_ANZAHL)


class BarcodeZuordnung(SQLModel, table=True):
    __tablename__ = "barcode_zuordnung"

    barcode: str = Field(primary_key=True)
    produkttyp_id: int = Field(foreign_key="produkttyp.id")


class BarcodeErgebnis(SQLModel):
    barcode: str
    # Schon zugeordnet: dieser Produkttyp wird direkt vorgeschlagen
    produkttyp: ProduktTypRead | None = None
    # Sonst: Angaben aus Open Food Facts, falls das Produkt dort bekannt ist
    off_name: str | None = None
    off_marke: str | None = None
    # True, wenn Open Food Facts nicht erreichbar war
    off_fehler: bool = False
