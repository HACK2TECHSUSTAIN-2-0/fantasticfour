from sqlalchemy.orm import Session
from . import models, schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(name=user.name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user

def get_authority_member_by_email(db: Session, email: str):
    return db.query(models.AuthorityMember).filter(models.AuthorityMember.email == email).first()

def get_authority_members(db: Session):
    return db.query(models.AuthorityMember).all()

def create_authority_member(db: Session, member: schemas.AuthorityMemberCreate):
    hashed_password = get_password_hash(member.password)
    db_member = models.AuthorityMember(
        email=member.email, 
        hashed_password=hashed_password,
        name=member.name,
        role=member.role
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

def create_incident(db: Session, incident: schemas.IncidentCreate):
    db_incident = models.Incident(
        user_id=incident.user_id,
        type=incident.type,
        message=incident.message,
        is_voice=incident.is_voice,
        authority=incident.authority
    )
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    return db_incident

def update_incident_enrichment(db: Session, incident_id: int, final_severity: str, officer_message: str, reasoning: str):
    db_incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if db_incident:
        db_incident.final_severity = final_severity
        db_incident.officer_message = officer_message
        db_incident.reasoning = reasoning
        db.commit()
        db.refresh(db_incident)
    return db_incident

def get_incidents(db: Session):
    return db.query(models.Incident).all()
