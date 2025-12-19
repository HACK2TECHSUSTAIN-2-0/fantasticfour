from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import crud, models, schemas
from .database import SessionLocal, engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:5173", # Vite default
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
    
    # Simple response for now, JWT can be added if needed
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
def create_incident(incident: schemas.IncidentCreate, db: Session = Depends(get_db)):
    return crud.create_incident(db=db, incident=incident)

@app.get("/incidents/", response_model=list[schemas.Incident])
def read_incidents(db: Session = Depends(get_db)):
    return crud.get_incidents(db)
