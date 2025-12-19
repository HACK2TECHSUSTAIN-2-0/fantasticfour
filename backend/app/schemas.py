from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    name: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int # Backend uses int, frontend handles string formatting or we adapt
    
    class Config:
        from_attributes = True

# Authority Member Schemas 
class AuthorityMemberBase(BaseModel):
    email: str
    name: str
    role: str

class AuthorityMemberCreate(AuthorityMemberBase):
    password: str

class AuthorityMember(AuthorityMemberBase):
    id: int
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

# Incident Schemas
class IncidentBase(BaseModel):
    type: str # This is basically the initial category
    message: str
    is_voice: bool = False
    authority: str

class IncidentCreate(IncidentBase):
    user_id: int

class Incident(IncidentBase):
    id: int
    user_id: int
    timestamp: datetime
    status: str
    
    # LLM Enrichment Fields
    final_severity: Optional[str] = None
    officer_message: Optional[str] = None
    reasoning: Optional[str] = None

    class Config:
        from_attributes = True
