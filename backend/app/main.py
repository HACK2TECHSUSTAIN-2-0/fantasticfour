from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from . import crud, models, schemas
from .database import SessionLocal, engine, get_db
# Import enrichment logic
from .llm.enrichment import enrich_alert

models.Base.metadata.create_all(bind=engine)


def ensure_incident_columns():
  """Add enrichment columns if the DB was created before they existed."""
  with engine.begin() as conn:
      conn.execute(text("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS final_severity VARCHAR"))
      conn.execute(text("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS officer_message VARCHAR"))
      conn.execute(text("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS reasoning VARCHAR"))

app = FastAPI()

class IncidentStatusRequest(BaseModel):
    status: str

origins = [
    "http://localhost:5173",
    "http://localhost:5174", 
    "http://localhost:5175",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
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
    # Ensure newer columns exist (for older databases without migrations)
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

# Import full pipeline components
from .ai.triage import run_ai_triage
from .network.sender import handle_alert


def run_incident_pipeline(incident_id: int, message: str):
    """
    Background task to run the full AI pipeline:
    1. Local Triage (Category, Severity)
    2. Network Transmission (Simulated)
    3. LLM Enrichment (Officer Guidance)
    """
    db = SessionLocal()
    try:
        # Fetch current state to check for manual classification overrides
        db_incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
        current_type = db_incident.type if db_incident else "general"

        print(f"[{incident_id}] Starting AI Pipeline for: {message}")
        
        # 1. Run Local Triage
        triage_result = run_ai_triage(message, silent=False)
        print(f"[{incident_id}] Triage Result: {triage_result}")
        
        # Decision Logic: Trust specific user input over weak AI "general" fallback
        new_category = triage_result["category"]
        
        if new_category == "general" and current_type not in ["general", "unknown"]:
             print(f"[{incident_id}] Maintaining user classification '{current_type}' over AI 'general'")
             new_category = current_type

        # Map triage category to authority
        mapped_authority = "security"
        if new_category in ["medical", "accident"]:
            mapped_authority = "health"
            
        # Update DB with Triage results immediately
        crud.update_incident_enrichment(
            db,
            incident_id=incident_id,
            final_severity=triage_result["severity"], # Initial estimate
            officer_message="Analyzing incident...",
            reasoning=f"Initial Classification: {new_category} ({triage_result['confidence']:.2f})"
        )
        
        # Update basic fields
        if db_incident:
            db_incident.type = new_category
            db_incident.authority = mapped_authority
            db.commit()

        # 2. Network Transmission
        # This simulates sending to a central command or checking internet
        delivery = handle_alert(triage_result)
        print(f"[{incident_id}] Delivery Status: {delivery['mode']}")
        
        # 3. LLM Enrichment (only if delivery logic allows, or we force it for demo)
        # In test1.py: if delivery["delivered"]: enrich...
        # We'll try to enrich regardless for the demo, or follow the rule. 
        # The user said "when the llm responds update the alert".
        
        if delivery["delivered"] or delivery["mode"] == "offline_fallback":
             # Note: offline_fallback in sender.py returns delivered=False usually, 
             # but we might want to run LLM if we have local connectivity to it.
             # The user's sender.py logic: if sent: delivered=True. Else fallback.
             # We will attempt enrichment if we can reach the LLM. 
             
             # Payload for enrichment matches what building in sender.py does, 
             # but we can reuse the delivery payload if available, or reconstruct.
             payload_to_enrich = delivery["payload"]
             
             # Inject the DB ID so we can track it if needed, though enrich_alert doesn't strictly need it
             payload_to_enrich["event_id"] = str(incident_id) 

             try:
                 print(f"[{incident_id}] Requesting LLM Enrichment...")
                 enrichment_result = enrich_alert(payload_to_enrich)
                 
                 if enrichment_result and "llm_enrichment" in enrichment_result:
                    data = enrichment_result["llm_enrichment"]
                    crud.update_incident_enrichment(
                        db, 
                        incident_id=incident_id,
                        final_severity=data.get("final_severity"),
                        officer_message=data.get("officer_message"),
                        reasoning=data.get("reasoning")
                    )
                    print(f"[{incident_id}] Enrichment Complete.")
             except Exception as e:
                 print(f"[{incident_id}] LLM Enrichment Failed: {e}")
                 # Fallback message
                 crud.update_incident_enrichment(
                    db,
                    incident_id=incident_id,
                    final_severity=triage_result["severity"],
                    officer_message="Consult standard protocols.",
                    reasoning="LLM unavailable."
                 )

    except Exception as e:
        print(f"Pipeline failed for incident {incident_id}: {e}")
    finally:
        db.close()

@app.post("/incidents/", response_model=schemas.Incident)
def create_incident(
    incident: schemas.IncidentCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # 1. Create basic incident
    # We allow the frontend to pass type/authority, but our pipeline might override them based on content
    db_incident = crud.create_incident(db=db, incident=incident)
    
    # 2. Trigger background full pipeline
    background_tasks.add_task(
        run_incident_pipeline, 
        incident_id=db_incident.id, 
        message=incident.message
    )
    
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
