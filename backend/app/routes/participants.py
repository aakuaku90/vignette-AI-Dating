import random
import string
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..config import settings
from ..database import get_db
from ..models.models import Participant, Response
from ..schemas.schemas import (
    AdminStats,
    ContactUpdate,
    ParticipantCreate,
    ParticipantDetail,
    ParticipantOut,
    ProgressUpdate,
    SwipeRequest,
    SwipeResponse,
)

router = APIRouter(prefix="/api", tags=["participants"])


def _generate_session_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


@router.post("/participants", response_model=ParticipantOut)
async def create_participant(data: ParticipantCreate, db: AsyncSession = Depends(get_db)):
    participant = Participant(
        id=uuid.uuid4(),
        session_code=_generate_session_code(),
        age=data.age,
        gender=data.gender,
    )
    db.add(participant)
    await db.commit()
    await db.refresh(participant)
    return participant


@router.get("/participants/{session_code}", response_model=ParticipantOut)
async def get_participant(session_code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Participant).where(Participant.session_code == session_code))
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    return participant


@router.post("/participants/{session_code}/swipe", response_model=SwipeResponse)
async def record_swipe(session_code: str, data: SwipeRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Participant).where(Participant.session_code == session_code))
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    response = Response(
        id=uuid.uuid4(),
        participant_id=participant.id,
        phase=data.phase,
        stage=data.stage,
        card_number=data.card_number,
        swiped_right=data.swiped_right,
        response_time_ms=data.response_time_ms,
    )
    db.add(response)
    await db.commit()
    await db.refresh(response)
    return response


@router.patch("/participants/{session_code}/demographics", response_model=ParticipantOut)
async def update_demographics(session_code: str, data: ParticipantCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Participant).where(Participant.session_code == session_code))
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    if data.age is not None:
        participant.age = data.age
    if data.gender is not None:
        participant.gender = data.gender
    if data.university is not None:
        participant.university = data.university
    if data.state is not None:
        participant.state = data.state
    if data.consented:
        participant.consented = True
        participant.consented_at = sqlfunc.now()
    await db.commit()
    await db.refresh(participant)
    return participant


@router.patch("/participants/{session_code}/progress", response_model=ParticipantOut)
async def update_progress(session_code: str, data: ProgressUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Participant).where(Participant.session_code == session_code))
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    participant.current_phase = data.current_phase
    participant.current_stage = data.current_stage
    if data.current_phase > 3:
        participant.completed_at = sqlfunc.now()
    await db.commit()
    await db.refresh(participant)
    return participant


@router.patch("/participants/{session_code}/contact", response_model=ParticipantOut)
async def update_contact(session_code: str, data: ContactUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Participant).where(Participant.session_code == session_code))
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    if data.email is not None:
        participant.email = data.email
    if data.phone is not None:
        participant.phone = data.phone
    await db.commit()
    await db.refresh(participant)
    return participant


@router.get("/participants/{session_code}/responses", response_model=list[SwipeResponse])
async def get_responses(session_code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Participant).where(Participant.session_code == session_code))
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    responses = await db.execute(
        select(Response).where(Response.participant_id == participant.id).order_by(Response.created_at)
    )
    return responses.scalars().all()


# --- Admin endpoints ---


async def require_admin(x_admin_key: str = Header(None)):
    if not x_admin_key or x_admin_key != settings.admin_secret:
        raise HTTPException(status_code=401, detail="Invalid admin key")


@router.post("/admin/verify")
async def verify_admin_key(_: None = Depends(require_admin)):
    return {"status": "ok"}


@router.get("/admin/participants", response_model=list[ParticipantOut])
async def list_participants(_: None = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Participant).order_by(Participant.started_at.desc()))
    return result.scalars().all()


@router.get("/admin/participants/{session_code}", response_model=ParticipantDetail)
async def get_participant_detail(session_code: str, _: None = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Participant)
        .where(Participant.session_code == session_code)
        .options(selectinload(Participant.responses))
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    return participant


@router.get("/admin/stats", response_model=AdminStats)
async def get_stats(_: None = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    total = await db.execute(select(sqlfunc.count(Participant.id)))
    completed = await db.execute(
        select(sqlfunc.count(Participant.id)).where(Participant.completed_at.isnot(None))
    )

    phase_result = await db.execute(
        select(Participant.current_phase, sqlfunc.count(Participant.id)).group_by(Participant.current_phase)
    )
    phase_distribution = {row[0]: row[1] for row in phase_result.all()}

    stage_result = await db.execute(
        select(Response.stage, sqlfunc.count(sqlfunc.distinct(Response.participant_id)))
        .where(Response.phase == 3)
        .group_by(Response.stage)
    )
    stage_completion = {row[0]: row[1] for row in stage_result.all()}

    return AdminStats(
        total_participants=total.scalar() or 0,
        completed_participants=completed.scalar() or 0,
        phase_distribution=phase_distribution,
        stage_completion=stage_completion,
    )


@router.get("/admin/export")
async def export_data(_: None = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Export all responses as a flat list for analysis."""
    result = await db.execute(
        select(
            Participant.session_code,
            Participant.age,
            Participant.gender,
            Participant.university,
            Participant.state,
            Participant.email,
            Participant.phone,
            Response.phase,
            Response.stage,
            Response.card_number,
            Response.swiped_right,
            Response.response_time_ms,
            Response.created_at,
        )
        .join(Response, Response.participant_id == Participant.id)
        .order_by(Participant.session_code, Response.phase, Response.stage, Response.card_number)
    )
    rows = result.all()
    return [
        {
            "session_code": r[0],
            "age": r[1],
            "gender": r[2],
            "university": r[3],
            "state": r[4],
            "email": r[5],
            "phone": r[6],
            "phase": r[7],
            "stage": r[8],
            "card_number": r[9],
            "swiped_right": r[10],
            "response_time_ms": r[11],
            "created_at": r[12].isoformat() if r[12] else None,
        }
        for r in rows
    ]
