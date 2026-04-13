from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://chase:chase_dev_password@localhost:5432/chase"
    cors_origins: list[str] = ["http://localhost:3000"]
    admin_secret: str = "chase-research-2026"

    model_config = {"env_file": ".env"}


settings = Settings()
