from fastapi import APIRouter


router = APIRouter(tags=["system"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "superstaff-api", "version": "0.4.0"}
