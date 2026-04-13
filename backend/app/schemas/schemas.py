import uuid
from datetime import datetime

from pydantic import BaseModel


class ParticipantCreate(BaseModel):
    age: int | None = None
    gender: str | None = None
    university: str | None = None
    state: str | None = None
    consented: bool = False


class ContactUpdate(BaseModel):
    email: str | None = None
    phone: str | None = None


class ParticipantOut(BaseModel):
    id: uuid.UUID
    session_code: str
    age: int | None
    gender: str | None
    university: str | None = None
    state: str | None = None
    consented: bool = False
    consented_at: datetime | None = None
    started_at: datetime
    completed_at: datetime | None
    current_phase: int
    current_stage: int
    email: str | None = None
    phone: str | None = None

    model_config = {"from_attributes": True}


class SwipeRequest(BaseModel):
    phase: int
    stage: int = 0
    card_number: int
    swiped_right: bool
    response_time_ms: int | None = None


class SwipeResponse(BaseModel):
    id: uuid.UUID
    phase: int
    stage: int
    card_number: int
    swiped_right: bool
    response_time_ms: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProgressUpdate(BaseModel):
    current_phase: int
    current_stage: int = 0


class StageResult(BaseModel):
    stage: int
    card_number: int
    swiped_right: bool
    response_time_ms: int | None


class ParticipantDetail(ParticipantOut):
    responses: list[SwipeResponse]


class AdminStats(BaseModel):
    total_participants: int
    completed_participants: int
    phase_distribution: dict[int, int]
    stage_completion: dict[int, int]
