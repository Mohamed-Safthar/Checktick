from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import json

class User(SQLModel, table=True):
    user_id: str = Field(primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    password_hash: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Task(SQLModel, table=True):
    task_id: str = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.user_id")
    title: str
    description: Optional[str] = None
    priority: str = Field(default="medium")  # low, medium, high
    category: str = Field(default="personal")
    due_date: Optional[str] = None  # YYYY-MM-DD string
    completed: bool = Field(default=False)
    order: int = Field(default=0)
    recurring: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    subtasks: str = Field(default="[]")  # JSON string

class ActivityLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str
    action: str
    task_id: str
    task_title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PomodoroSession(SQLModel, table=True):
    session_id: str = Field(primary_key=True)
    user_id: str
    task_id: Optional[str] = None
    duration: int = Field(default=25)
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserSession(SQLModel, table=True):
    session_token: str = Field(primary_key=True)
    user_id: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)