import os

from pydantic_settings import BaseSettings


def _normalized_database_url() -> str:
    url = os.environ.get(
        "DATABASE_URL",
        "postgresql+asyncpg://chase:chase_dev_password@localhost:5432/chase",
    )
    # Heroku provides `postgres://…`; SQLAlchemy + asyncpg want `postgresql+asyncpg://…`.
    if url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]
    return url


def _parse_cors_origins() -> list[str]:
    raw = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
    return [o.strip() for o in raw.split(",") if o.strip()]


class Settings(BaseSettings):
    database_url: str = _normalized_database_url()
    cors_origins: list[str] = _parse_cors_origins()
    admin_secret: str = "Vignette-AI-2026!lnd7C3ft5ly2dPdvBZAjg27FX1oGLukAUwU8hJNI5ig="

    model_config = {"env_file": ".env"}


settings = Settings()
