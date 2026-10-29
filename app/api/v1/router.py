from fastapi import APIRouter

from app.api.v1.endpoints import barcode, produkttypen

router = APIRouter(prefix="/api")
router.include_router(produkttypen.router)
router.include_router(barcode.router)


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
