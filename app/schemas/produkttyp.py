from pydantic import field_validator
from sqlmodel import Field, SQLModel

MAX_ANZAHL = 9999


class ProduktTypRead(SQLModel):
    id: int
    name: str
    anzahl: int


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
