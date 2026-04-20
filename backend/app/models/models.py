import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_code: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(50), nullable=True)
    university: Mapped[str | None] = mapped_column(String(255), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    current_phase: Mapped[int] = mapped_column(Integer, default=0)
    current_stage: Mapped[int] = mapped_column(Integer, default=0)
    consented: Mapped[bool] = mapped_column(Boolean, default=False)
    consented_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    warmup_w1: Mapped[str | None] = mapped_column(Text, nullable=True)
    warmup_w2: Mapped[str | None] = mapped_column(Text, nullable=True)
    warmup_w3: Mapped[str | None] = mapped_column(Text, nullable=True)
    warmup_w4: Mapped[str | None] = mapped_column(Text, nullable=True)
    debrief_d1: Mapped[str | None] = mapped_column(Text, nullable=True)
    debrief_d2: Mapped[str | None] = mapped_column(Text, nullable=True)
    debrief_d3: Mapped[str | None] = mapped_column(Text, nullable=True)
    debrief_d4: Mapped[str | None] = mapped_column(Text, nullable=True)
    debrief_d5: Mapped[str | None] = mapped_column(Text, nullable=True)
    debrief_d6: Mapped[str | None] = mapped_column(Text, nullable=True)
    scenario_order: Mapped[str | None] = mapped_column(String(16), nullable=True)

    responses: Mapped[list["Response"]] = relationship(back_populates="participant", cascade="all, delete-orphan")


class Response(Base):
    __tablename__ = "responses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    participant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("participants.id"))
    phase: Mapped[int] = mapped_column(Integer)
    stage: Mapped[int] = mapped_column(Integer, default=0)
    card_number: Mapped[int] = mapped_column(Integer)
    swiped_right: Mapped[bool] = mapped_column(Boolean)
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    variant_code: Mapped[str | None] = mapped_column(String(16), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    participant: Mapped["Participant"] = relationship(back_populates="responses")
