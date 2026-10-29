from sqlmodel import SQLModel

from app.schemas.produkttyp import ProduktTypRead


class BarcodeErgebnis(SQLModel):
    barcode: str
    produkttyp: ProduktTypRead | None = None
    off_name: str | None = None
    off_marke: str | None = None
    off_fehler: bool = False
