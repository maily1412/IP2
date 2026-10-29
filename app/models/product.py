from sqlmodel import CheckConstraint, Field, SQLModel


class ProduktTyp(SQLModel, table=True):
    __tablename__ = "produkttyp"
    __table_args__ = (CheckConstraint("anzahl >= 0", name="anzahl_nicht_negativ"),)

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    anzahl: int = Field(default=0)
