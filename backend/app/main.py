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

models.Base.metadata.create_all(bind=engine)


class IncidentStatusRequest(BaseModel):
    status: str


def ensure_incident_columns():
    """Add enrichment columns if the DB was created before they existed."""
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS final_severity VARCHAR"))
        conn.execute(text("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS officer_message VARCHAR"))
        conn.execute(text("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS reasoning VARCHAR"))


app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_db_client():
    ensure_incident_columns()
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
    return crud.create_user(db=db, user=user)


@app.get("/users/", response_model=list[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = crud.get_users(db, skip=skip, limit=limit)
    return users


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
    db_incident = crud.create_incident(db=db, incident=incident)
    # Future: trigger pipeline/background if needed
    return db_incident


@app.get("/incidents/", response_model=list[schemas.Incident])
def read_incidents(db: Session = Depends(get_db)):
    return crud.get_incidents(db)


@app.put("/incidents/{incident_id}/status")
def update_incident_status(incident_id: int, req: IncidentStatusRequest, db: Session = Depends(get_db)):
    db_incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    db_incident.status = req.status
    db.commit()
    return {"message": "Status updated"}


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
