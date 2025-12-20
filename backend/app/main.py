from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from . import crud, models, schemas
from .database import SessionLocal, engine, get_db
from .llm.enrichment import enrich_alert
from .services.translation import translate_to_english
from .services.speech import transcribe_to_english
from .ai.triage import run_ai_triage
import uuid

models.Base.metadata.create_all(bind=engine)


class IncidentStatusRequest(BaseModel):
    status: str


def ensure_incident_columns():
    """Add enrichment columns if the DB was created before they existed."""
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS final_severity VARCHAR"))
        conn.execute(text("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS officer_message VARCHAR"))
        conn.execute(text("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS reasoning VARCHAR"))
        conn.execute(text("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION"))
        conn.execute(text("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION"))


def ensure_user_columns():
    """Ensure user table has email, phone, and hashed_password."""
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR"))
        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users(email)"))


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # wide open for local dev
    allow_origin_regex=".*",
    allow_credentials=False,  # must be False when using "*"
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_db_client():
    ensure_incident_columns()
    ensure_user_columns()
    # Create default admin if not exists
    db = SessionLocal()
    try:
        admin_email = "shivaranjaneravishankar@gmail.com"
        existing_admin = crud.get_authority_member_by_email(db, email=admin_email)
        if not existing_admin:
            print("Creating default admin account...")
            default_admin = schemas.AuthorityMemberCreate(
                email=admin_email,
                name="Shivaranjan",
                role="admin",
                password="123"
            )
            crud.create_authority_member(db, default_admin)
            print("Default admin created.")
    finally:
        db.close()


@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_email(db, user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/users/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_email(db, user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)


@app.get("/users/", response_model=list[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = crud.get_users(db, skip=skip, limit=limit)
    return users


@app.post("/users/login")
def user_login(login_req: schemas.UserLoginRequest, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, login_req.email)
    if not db_user or not crud.verify_password(login_req.password, db_user.hashed_password or ""):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    return {"id": db_user.id, "name": db_user.name, "email": db_user.email, "phone": db_user.phone}


@app.delete("/users/{user_id}", response_model=schemas.User)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.delete_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@app.post("/auth/login")
def login(login_req: schemas.LoginRequest, db: Session = Depends(get_db)):
    member = crud.get_authority_member_by_email(db, email=login_req.email)
    if not member or not crud.verify_password(login_req.password, member.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    return {
        "id": member.id,
        "name": member.name,
        "email": member.email,
        "role": member.role,
        "message": "Login successful"
    }


@app.post("/authority/members/", response_model=schemas.AuthorityMember)
def create_authority_member(member: schemas.AuthorityMemberCreate, db: Session = Depends(get_db)):
    db_member = crud.get_authority_member_by_email(db, email=member.email)
    if db_member:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_authority_member(db=db, member=member)


@app.get("/authority/members/", response_model=list[schemas.AuthorityMember])
def read_authority_members(db: Session = Depends(get_db)):
    return crud.get_authority_members(db)


@app.post("/incidents/", response_model=schemas.Incident)
def create_incident(incident: schemas.IncidentCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Layer 1: edge/keyword/semantic triage
    triage = run_ai_triage(incident.message or incident.type, silent=True)

    # Layer 2: Gemini LLM enrichment
    payload = {
        "event_id": f"evt_{uuid.uuid4().hex[:12]}",
        "triage": triage,
    }
    enrichment = enrich_alert(payload) or {}
    llm = enrichment.get("llm_enrichment", {}) if isinstance(enrichment, dict) else {}
    final_severity = llm.get("final_severity") or triage.get("severity")
    officer_message = llm.get("officer_message")
    reasoning = llm.get("reasoning")

    db_incident = crud.create_incident(
        db=db,
        incident=incident,
        final_severity=final_severity,
        officer_message=officer_message,
        reasoning=reasoning,
        latitude=incident.latitude,
        longitude=incident.longitude,
    )
    return db_incident


@app.get("/incidents/", response_model=list[schemas.Incident])
def read_incidents(db: Session = Depends(get_db)):
    incidents = (
        db.query(models.Incident, models.User)
        .outerjoin(models.User, models.Incident.user_id == models.User.id)
        .all()
    )
    enriched = []
    for inc, user in incidents:
        inc_data = {
            "id": inc.id,
            "user_id": inc.user_id,
            "type": inc.type,
            "message": inc.message,
            "is_voice": inc.is_voice,
            "authority": inc.authority,
            "timestamp": inc.timestamp,
            "status": inc.status,
            "user_name": getattr(user, "name", None),
            "user_phone": getattr(user, "phone", None),
            "latitude": getattr(inc, "latitude", None),
            "longitude": getattr(inc, "longitude", None),
            "officer_message": getattr(inc, "officer_message", None),
            "final_severity": getattr(inc, "final_severity", None),
            "reasoning": getattr(inc, "reasoning", None),
        }
        enriched.append(inc_data)
    return enriched


@app.put("/incidents/{incident_id}/status")
def update_incident_status(incident_id: int, req: IncidentStatusRequest, db: Session = Depends(get_db)):
    db_incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    db_incident.status = req.status
    db.commit()
    return {"message": "Status updated"}


@app.put("/incidents/{incident_id}/priority")
def update_incident_priority(incident_id: int, req: schemas.IncidentPriorityUpdate, db: Session = Depends(get_db)):
    db_incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    sev = (req.final_severity or "").upper()
    if sev not in {"LOW", "MEDIUM", "HIGH"}:
        raise HTTPException(status_code=400, detail="Invalid severity")
    db_incident.final_severity = sev
    db.commit()
    db.refresh(db_incident)
    return {"message": "Priority updated", "final_severity": db_incident.final_severity}


@app.post("/translate/", response_model=schemas.TranslateResponse)
def translate_text(req: schemas.TranslateRequest):
    if not req.text:
        raise HTTPException(status_code=400, detail="Text is required")
    translated = translate_to_english(req.text, req.source_lang)
    return schemas.TranslateResponse(translated_text=translated, original_text=req.text)


@app.post("/speech-to-english/", response_model=schemas.SpeechToTextResponse)
async def speech_to_english(file: UploadFile = File(...), source_lang: str = "auto"):
    contents = await file.read()
    text, err = transcribe_to_english(contents, file.filename, file.content_type, source_lang)
    if not text:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {err}")
    return schemas.SpeechToTextResponse(translated_text=text, original_text=None)
