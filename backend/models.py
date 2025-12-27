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

class StickyNote(SQLModel, table=True):
    note_id: str = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.user_id")
    content: str = Field(default="")
    color: str = Field(default="yellow")
    x_position: int = Field(default=0)
    y_position: int = Field(default=0)
    z_index: int = Field(default=1)
    is_expanded: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class NoteEdge(SQLModel, table=True):
    edge_id: str = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.user_id")
    source: str = Field(foreign_key="stickynote.note_id")
    target: str = Field(foreign_key="stickynote.note_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)