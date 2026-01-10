from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Float
from sqlalchemy.orm import relationship
from .database import Base
import datetime
from zoneinfo import ZoneInfo
import enum

class Role(str, enum.Enum):
    admin = "admin"
    health = "health"
    security = "security"

class IncidentStatus(str, enum.Enum):
    pending = "pending"
    responding = "responding"
    resolved = "resolved"

class IncidentAuthority(str, enum.Enum):
    health = "health"
    security = "security"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)
    false_count = Column(Integer, default=0)
    hotwords = Column(String, default="{}") # JSON string mapping hotword -> authority

class AuthorityMember(Base):
    __tablename__ = "authority_members"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    role = Column(String) # or Enum(Role)

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer) # ForeignKey("users.id") can be added strictly, but loose coupling is okay for now
    type = Column(String)
    message = Column(String)
    is_voice = Column(Boolean, default=False)
    # Store timestamps in Asia/Kolkata (IST)
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(ZoneInfo("Asia/Kolkata")))
    status = Column(String, default="pending") 
    authority = Column(String)
    final_severity = Column(String, nullable=True)
    officer_message = Column(String, nullable=True)
    reasoning = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    audio_evidence = Column(String, nullable=True)
    report_count = Column(Integer, default=1)

class Feedback(BaseModel):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer)
    original_severity = Column(String)
    corrected_severity = Column(String)
    incident_message = Column(String)
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(ZoneInfo("Asia/Kolkata")))

