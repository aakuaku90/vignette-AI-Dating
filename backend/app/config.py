from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://chase:chase_dev_password@localhost:5432/chase"
    cors_origins: list[str] = ["http://localhost:3000"]
    admin_secret: str = "Vignette-AI-2026!lnd7C3ft5ly2dPdvBZAjg27FX1oGLukAUwU8hJNI5ig="

    model_config = {"env_file": ".env"}

    @field_validator("database_url", mode="before")
    @classmethod
    def _normalize_database_url(cls, v: str) -> str:
        # Heroku hands out `postgres://…`; SQLAlchemy + asyncpg want `postgresql+asyncpg://…`.
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return "postgresql+asyncpg://" + v[len("postgres://"):]
            if v.startswith("postgresql://") and "+asyncpg" not in v:
                return "postgresql+asyncpg://" + v[len("postgresql://"):]
        return v

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors_origins(cls, v):
        # Accept either a JSON array or a comma-separated string from the env.
        if isinstance(v, str):
            stripped = v.strip()
            if stripped.startswith("["):
                return v  # let pydantic parse JSON
            return [o.strip() for o in stripped.split(",") if o.strip()]
        return v


settings = Settings()
