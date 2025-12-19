from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from .database import Base
import datetime
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
    # Frontend logic: user001. We can just store 1, 2, 3 and format it in schema if needed
    name = Column(String, index=True)

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
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="pending") 
    authority = Column(String)
