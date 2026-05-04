import csv
import io
import random
import string
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..config import settings
from ..database import get_db
from ..instrument import (
    DEBRIEF_QUESTIONS,
    SCENARIOS,
    WARMUP_QUESTIONS,
    lookup_variant,
)
from ..models.models import Participant, Response
from ..schemas.schemas import (
    AdminStats,
    ContactUpdate,
    DeleteParticipants,
    DeleteParticipantsResult,
    ParticipantCreate,
    ParticipantDetail,
    ParticipantOut,
    ProgressUpdate,
    ScenarioOrderUpdate,
    SwipeRequest,
    SwipeResponse,
    WarmupUpdate,
    DebriefUpdate,
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
        variant_code=data.variant_code,
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
    if data.current_phase >= 5:
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


@router.patch("/participants/{session_code}/warmup", response_model=ParticipantOut)
async def update_warmup(session_code: str, data: WarmupUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Participant).where(Participant.session_code == session_code))
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    if data.warmup_w1 is not None:
        participant.warmup_w1 = data.warmup_w1
    if data.warmup_w2 is not None:
        participant.warmup_w2 = data.warmup_w2
    if data.warmup_w3 is not None:
        participant.warmup_w3 = data.warmup_w3
    if data.warmup_w4 is not None:
        participant.warmup_w4 = data.warmup_w4
    await db.commit()
    await db.refresh(participant)
    return participant


@router.patch("/participants/{session_code}/debrief", response_model=ParticipantOut)
async def update_debrief(session_code: str, data: DebriefUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Participant).where(Participant.session_code == session_code))
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    if data.debrief_d1 is not None:
        participant.debrief_d1 = data.debrief_d1
    if data.debrief_d2 is not None:
        participant.debrief_d2 = data.debrief_d2
    if data.debrief_d3 is not None:
        participant.debrief_d3 = data.debrief_d3
    if data.debrief_d4 is not None:
        participant.debrief_d4 = data.debrief_d4
    if data.debrief_d5 is not None:
        participant.debrief_d5 = data.debrief_d5
    if data.debrief_d6 is not None:
        participant.debrief_d6 = data.debrief_d6
    await db.commit()
    await db.refresh(participant)
    return participant


@router.patch("/participants/{session_code}/scenario-order", response_model=ParticipantOut)
async def update_scenario_order(session_code: str, data: ScenarioOrderUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Participant).where(Participant.session_code == session_code))
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    participant.scenario_order = data.scenario_order
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


@router.post("/admin/participants/delete", response_model=DeleteParticipantsResult)
async def delete_participants(
    data: DeleteParticipants,
    _: None = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if not data.session_codes:
        return DeleteParticipantsResult(deleted=0)
    result = await db.execute(
        select(Participant)
        .where(Participant.session_code.in_(data.session_codes))
        .options(selectinload(Participant.responses))
    )
    participants = result.scalars().all()
    for p in participants:
        await db.delete(p)
    await db.commit()
    return DeleteParticipantsResult(deleted=len(participants))


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
        .where(Response.phase == 3, Response.stage <= 2, Response.variant_code.is_not(None))
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
            Participant.warmup_w1,
            Participant.warmup_w2,
            Participant.warmup_w3,
            Participant.warmup_w4,
            Participant.debrief_d1,
            Participant.debrief_d2,
            Participant.debrief_d3,
            Participant.debrief_d4,
            Participant.debrief_d5,
            Participant.debrief_d6,
            Participant.scenario_order,
            Response.phase,
            Response.stage,
            Response.card_number,
            Response.swiped_right,
            Response.response_time_ms,
            Response.variant_code,
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
            "warmup_w1": r[7],
            "warmup_w2": r[8],
            "warmup_w3": r[9],
            "warmup_w4": r[10],
            "debrief_d1": r[11],
            "debrief_d2": r[12],
            "debrief_d3": r[13],
            "debrief_d4": r[14],
            "debrief_d5": r[15],
            "debrief_d6": r[16],
            "scenario_order": r[17],
            "phase": r[18],
            "stage": r[19],
            "card_number": r[20],
            "swiped_right": r[21],
            "response_time_ms": r[22],
            "variant_code": r[23],
            "created_at": r[24].isoformat() if r[24] else None,
        }
        for r in rows
    ]


@router.get("/admin/export.csv")
async def export_data_csv(_: None = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Export all responses as RFC 4180 CSV (proper quote/comma escaping).

    Columns are ordered to match the participant timeline:
    demographics (phase 0) → warmup (phase 2) → swipe (phase 3) → debrief + contact (phase 4).
    """
    result = await db.execute(
        select(
            Participant.session_code,
            Participant.age,
            Participant.gender,
            Participant.university,
            Participant.state,
            Participant.warmup_w1,
            Participant.warmup_w2,
            Participant.warmup_w3,
            Participant.warmup_w4,
            Participant.scenario_order,
            Response.phase,
            Response.stage,
            Response.card_number,
            Response.variant_code,
            Response.swiped_right,
            Response.response_time_ms,
            Response.created_at,
            Participant.debrief_d1,
            Participant.debrief_d2,
            Participant.debrief_d3,
            Participant.debrief_d4,
            Participant.debrief_d5,
            Participant.debrief_d6,
            Participant.email,
            Participant.phone,
        )
        .join(Response, Response.participant_id == Participant.id)
        .order_by(Participant.session_code, Response.phase, Response.stage, Response.card_number)
    )
    rows = result.all()

    headers = [
        "session_code",
        "age", "gender", "university", "state",
        "warmup_w1", "warmup_w2", "warmup_w3", "warmup_w4",
        "scenario_order",
        "phase", "stage", "card_number",
        "variant_code", "scenario_title", "exit_factor", "direction", "pressure_level", "prompt_text",
        "swiped_right", "response_time_ms", "created_at",
        "debrief_d1", "debrief_d2", "debrief_d3", "debrief_d4", "debrief_d5", "debrief_d6",
        "email", "phone",
    ]

    buf = io.StringIO()
    writer = csv.writer(buf, quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
    writer.writerow(headers)
    for r in rows:
        meta = lookup_variant(r[13])
        created = r[16].isoformat() if r[16] else ""
        out = [
            r[0],
            r[1], r[2], r[3], r[4],
            r[5], r[6], r[7], r[8],
            r[9],
            r[10], r[11], r[12],
            r[13],
            meta["scenario_title"], meta["exit_factor"], meta["direction"],
            meta["pressure_level"], meta["prompt_text"],
            r[14], r[15], created,
            r[17], r[18], r[19], r[20], r[21], r[22],
            r[23], r[24],
        ]
        writer.writerow(["" if v is None else v for v in out])

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="swipe-to-decide-export.csv"'},
    )


@router.get("/admin/codebook.csv")
async def export_codebook(_: None = Depends(require_admin)):
    """Standalone codebook documenting variant codes, warmup, and debrief questions."""
    buf = io.StringIO()
    writer = csv.writer(buf, quoting=csv.QUOTE_MINIMAL, lineterminator="\n")

    writer.writerow(["section", "code", "field", "value"])

    for sc, scenario in SCENARIOS.items():
        for field in ("title", "subtitle", "exit_factor", "base"):
            writer.writerow(["scenario", sc, field, scenario[field]])

    for sc, scenario in SCENARIOS.items():
        for direction_key, direction_label in (("left", "left"), ("right", "right")):
            for code, text in scenario[direction_key]:
                pressure = code.split("-")[1][1]
                writer.writerow(["variant", code, "scenario", sc])
                writer.writerow(["variant", code, "direction", direction_label])
                writer.writerow(["variant", code, "pressure_level", pressure])
                writer.writerow(["variant", code, "prompt_text", text])

    for q in WARMUP_QUESTIONS:
        writer.writerow(["warmup", q["key"], "label", q["label"]])
        writer.writerow(["warmup", q["key"], "prompt", q["prompt"]])

    for q in DEBRIEF_QUESTIONS:
        writer.writerow(["debrief", q["key"], "prompt", q["prompt"]])

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="swipe-to-decide-codebook.csv"'},
    )
