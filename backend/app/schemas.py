from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    email: str
    phone: str
    password: str

class User(UserBase):
    id: int # Backend uses int, frontend handles string formatting or we adapt
    
    class Config:
        from_attributes = True

class UserLoginRequest(BaseModel):
    email: str
    password: str

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
    type: str
    message: str
    is_voice: bool = False
    authority: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class IncidentCreate(IncidentBase):
    user_id: int

class Incident(IncidentBase):
    id: int
    user_id: int
    timestamp: datetime
    status: str
    user_name: Optional[str] = None
    user_phone: Optional[str] = None
    final_severity: Optional[str] = None
    officer_message: Optional[str] = None
    reasoning: Optional[str] = None

    class Config:
        from_attributes = True


class IncidentPriorityUpdate(BaseModel):
    final_severity: str


# Translation
class TranslateRequest(BaseModel):
    text: str
    source_lang: Optional[str] = "auto"


class TranslateResponse(BaseModel):
    translated_text: str
    original_text: str


class SpeechToTextResponse(BaseModel):
    translated_text: str
    original_text: Optional[str] = None
