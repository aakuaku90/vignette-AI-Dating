from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import settings

_is_remote = "localhost" not in settings.database_url and "127.0.0.1" not in settings.database_url
engine = create_async_engine(
    settings.database_url,
    echo=False,
    connect_args={"ssl": True} if _is_remote else {},
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        yield session
