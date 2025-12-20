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

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(name=user.name, email=user.email, phone=user.phone, hashed_password=hashed_password)
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

def create_incident(
    db: Session,
    incident: schemas.IncidentCreate,
    final_severity: str | None = None,
    officer_message: str | None = None,
    reasoning: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    authority_override: str | None = None,
):
    db_incident = models.Incident(
        user_id=incident.user_id,
        type=incident.type,
        message=incident.message,
        is_voice=incident.is_voice,
        authority=authority_override or incident.authority,
        latitude=incident.latitude if incident.latitude is not None else latitude,
        longitude=incident.longitude if incident.longitude is not None else longitude,
        final_severity=final_severity,
        officer_message=officer_message,
        reasoning=reasoning,
    )
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    return db_incident

def get_incidents(db: Session):
    return db.query(models.Incident).all()

def get_incident(db: Session, incident_id: int):
    return db.query(models.Incident).filter(models.Incident.id == incident_id).first()

def increment_false_count(db: Session, user_id: int):
    user = get_user(db, user_id)
    if not user:
        return None
    user.false_count = (user.false_count or 0) + 1
    db.commit()
    db.refresh(user)
    return user
