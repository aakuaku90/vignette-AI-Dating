from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routes.participants import router as participants_router


app = FastAPI(title="Swipe to Decide API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(participants_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
