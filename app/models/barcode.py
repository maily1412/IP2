from sqlmodel import Field, SQLModel


class BarcodeZuordnung(SQLModel, table=True):
    __tablename__ = "barcode_zuordnung"

    barcode: str = Field(primary_key=True)
    produkttyp_id: int = Field(foreign_key="produkttyp.id")
