from fastapi import FastAPI, Depends, HTTPException, Request, Response
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import SQLModel, select, func, and_, delete
from datetime import datetime, timedelta, timezone
from database import init_db, get_session
from models import User, Task, ActivityLog, PomodoroSession, UserSession, StickyNote
from auth_utils import get_password_hash, verify_password
from pydantic import BaseModel
import uuid
import json
import os

# Schemas
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

def task_to_dict(task: Task):
    d = task.dict()
    if d.get("subtasks"):
        try:
            d["subtasks"] = json.loads(d["subtasks"])
        except:
            d["subtasks"] = []
    else:
        d["subtasks"] = []
    return d

app = FastAPI(title="Checktick API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await init_db()

# Helper: Get current user from session token
async def get_current_user(request: Request, db=Depends(get_session)):
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]

    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    stmt = select(UserSession).where(UserSession.session_token == session_token)
    result = await db.exec(stmt)
    session = result.first()
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    # Handle naive datetime from DB (asyncmy returns naive)
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    user_stmt = select(User).where(User.user_id == session.user_id)
    user_result = await db.exec(user_stmt)
    user = user_result.first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Auth Routes
# Auth Routes
@app.post("/api/auth/register")
async def register(data: RegisterRequest, db=Depends(get_session)):
    # Check if user exists
    stmt = select(User).where(User.email == data.email)
    result = await db.exec(stmt)
    if result.first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_password = get_password_hash(data.password)
    
    new_user = User(
        user_id=user_id,
        email=data.email,
        name=data.name,
        password_hash=hashed_password
    )
    db.add(new_user)
    await db.commit()
    
    return {"message": "User created successfully"}

@app.post("/api/auth/login")
async def login(data: LoginRequest, response: Response, db=Depends(get_session)):
    stmt = select(User).where(User.email == data.email)
    result = await db.exec(stmt)
    user = result.first()
    
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create Session
    session_token = f"st_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    # Delete old sessions
    stmt = delete(UserSession).where(UserSession.user_id == user.user_id)
    await db.exec(stmt)

    new_session = UserSession(
        session_token=session_token,
        user_id=user.user_id,
        expires_at=expires_at,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_session)
    await db.commit()

    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=False,  # Set True in production
        samesite="lax",
        max_age=7*24*60*60
    )

    return {"user": {"user_id": user.user_id, "email": user.email, "name": user.name}}

@app.get("/api/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return user.dict()

@app.post("/api/auth/logout")
async def logout(request: Request, response: Response, db=Depends(get_session)):
    session_token = request.cookies.get("session_token")
    if session_token:
        stmt = delete(UserSession).where(UserSession.session_token == session_token)
        await db.exec(stmt)
        await db.commit()
    response.delete_cookie("session_token")
    return {"message": "Logged out"}

@app.post("/api/auth/change-password")
async def change_password(data: ChangePasswordRequest, user: User = Depends(get_current_user), db=Depends(get_session)):
    # Verify current password
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    # Update to new password
    hashed_password = get_password_hash(data.new_password)
    user.password_hash = hashed_password
    db.add(user)
    await db.commit()
    
    return {"message": "Password updated successfully"}

# Task Routes
@app.get("/api/tasks")
async def get_tasks(user: User = Depends(get_current_user), db=Depends(get_session)):
    stmt = select(Task).where(Task.user_id == user.user_id).order_by(Task.order)
    result = await db.exec(stmt)
    tasks = result.all()
    return [task_to_dict(t) for t in tasks]

@app.post("/api/tasks")
async def create_task(task_data: dict, user: User = Depends(get_current_user), db=Depends(get_session)):
    max_stmt = select(func.max(Task.order)).where(Task.user_id == user.user_id)
    max_result = await db.exec(max_stmt)
    max_order = max_result.one() or -1

    new_task = Task(
        task_id=f"task_{uuid.uuid4().hex[:12]}",
        user_id=user.user_id,
        order=max_order + 1,
        subtasks=json.dumps(task_data.get("subtasks", [])),
        **{k: v for k, v in task_data.items() if k != "subtasks"}
    )
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)

    # Log activity
    log = ActivityLog(user_id=user.user_id, action="created", task_id=new_task.task_id, task_title=new_task.title)
    db.add(log)
    await db.commit()

    return task_to_dict(new_task)

@app.put("/api/tasks/{task_id}")
async def update_task(task_id: str, task_data: dict, user: User = Depends(get_current_user), db=Depends(get_session)):
    stmt = select(Task).where(Task.task_id == task_id, Task.user_id == user.user_id)
    result = await db.exec(stmt)
    task = result.first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Capture previous state
    was_not_completed = not task.completed
    
    for key, value in task_data.items():
        if key == "subtasks":
            setattr(task, key, json.dumps(value))
        else:
            setattr(task, key, value)

    # Check if newly completed
    if task_data.get("completed") and was_not_completed:
        task.completed_at = datetime.utcnow()
        log = ActivityLog(user_id=user.user_id, action="completed", task_id=task_id, task_title=task.title)
        db.add(log)

    await db.commit()
    await db.refresh(task)
    return task_to_dict(task)

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str, user: User = Depends(get_current_user), db=Depends(get_session)):
    stmt = select(Task).where(Task.task_id == task_id, Task.user_id == user.user_id)
    result = await db.exec(stmt)
    task = result.first()
    if not task:
        raise HTTPException(status_code=404)

    await db.delete(task)
    await db.commit()
    return {"message": "Task deleted"}

@app.put("/api/tasks/reorder")
async def reorder_tasks(orders: list[dict], user: User = Depends(get_current_user), db=Depends(get_session)):
    for item in orders:
        stmt = select(Task).where(Task.task_id == item["task_id"], Task.user_id == user.user_id)
        result = await db.exec(stmt)
        task = result.first()
        if task:
            task.order = item["order"]
            db.add(task)
    await db.commit()
    return {"message": "Reordered"}

# Stats
@app.get("/api/stats")
async def get_stats(user: User = Depends(get_current_user), db=Depends(get_session)):
    today = datetime.utcnow().date().isoformat()

    # Result Unpacking Helper for func.count (asyncmy returns tuple/row)
    async def get_count(stmt):
        result = await db.exec(stmt)
        row = result.first()
        if row:
            # SQLModel/SQLAlchemy returns value directly or tuple depending on version/driver
            # For robustness, handle both
            return row if isinstance(row, int) else row[0]
        return 0

    total = await get_count(select(func.count(Task.task_id)).where(Task.user_id == user.user_id))
    completed = await get_count(select(func.count(Task.task_id)).where(and_(Task.user_id == user.user_id, Task.completed)))
    today_tasks = await get_count(select(func.count(Task.task_id)).where(and_(Task.user_id == user.user_id, Task.due_date == today)))
    today_completed = await get_count(select(func.count(Task.task_id)).where(and_(Task.user_id == user.user_id, Task.due_date == today, Task.completed)))

    # Simple streak (days with at least one completion)
    logs = await db.exec(select(ActivityLog.created_at).where(and_(ActivityLog.user_id == user.user_id, ActivityLog.action == "completed")).order_by(ActivityLog.created_at.desc()))
    dates = [log.date() for log in logs] # log is already datetime from ActivityLog model
    streak = 0
    check_date = datetime.utcnow().date()
    # Unique dates set for faster lookup and correctness (multiple logs same day)
    unique_dates = set(dates)
    
    # Check streak starting from today or yesterday
    if check_date in unique_dates:
        streak += 1
        check_date -= timedelta(days=1)
    
    # Simple loop to count consecutive days
    for i in range(365):
        if check_date in unique_dates:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            if streak > 0: # If we already started counting and hit a miss, stop
                break
            # If we haven't started (today wasn't done), check if yesterday was done to start streak?
            # Simplified: just count backwards from today
            pass

    # Weekly Data Helper
    async def get_week_data(start_date):
        data = []
        for i in range(7):
            target_date = start_date + timedelta(days=i)
            day_label = target_date.strftime("%a")
            
            start_dt = datetime.combine(target_date, datetime.min.time())
            end_dt = datetime.combine(target_date, datetime.max.time())
            
            count = await get_count(
                select(func.count(Task.task_id)).where(
                    and_(
                        Task.user_id == user.user_id,
                        Task.completed == True,
                        Task.completed_at >= start_dt,
                        Task.completed_at <= end_dt
                    )
                )
            )
            data.append({"day": day_label, "completed": count})
        return data

    current_date = datetime.utcnow().date()
    # Find start of this week (Monday)
    this_week_start = current_date - timedelta(days=current_date.weekday())
    last_week_start = this_week_start - timedelta(days=7)

    this_week_data = await get_week_data(this_week_start)
    last_week_data = await get_week_data(last_week_start)

    pomodoro_count = await get_count(select(func.count(PomodoroSession.session_id)).where(and_(PomodoroSession.user_id == user.user_id, PomodoroSession.completed)))

    return {
        "total": total,
        "completed": completed,
        "pending": total - completed,
        "today_tasks": today_tasks,
        "today_completed": today_completed,
        "streak": streak,
        "completion_rate": round((completed / total * 100) if total else 0, 1),
        "pomodoro_sessions": pomodoro_count,
        "this_week_data": this_week_data,
        "last_week_data": last_week_data
    }

# Pomodoro
@app.post("/api/pomodoro/start")
async def start_pomodoro(data: dict, user: User = Depends(get_current_user), db=Depends(get_session)):
    session = PomodoroSession(
        session_id=f"pomo_{uuid.uuid4().hex[:12]}",
        user_id=user.user_id,
        task_id=data.get("task_id"),
        duration=data.get("duration", 25)
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session.dict()

@app.post("/api/pomodoro/{session_id}/complete")
async def complete_pomodoro(session_id: str, user: User = Depends(get_current_user), db=Depends(get_session)):
    stmt = select(PomodoroSession).where(PomodoroSession.session_id == session_id, PomodoroSession.user_id == user.user_id)
    result = await db.exec(stmt)
    session = result.first()
    if not session:
        raise HTTPException(status_code=404)
    session.completed = True
    await db.commit()
    return {"message": "Completed"}

@app.get("/api/health")
async def health():
    return {"status": "healthy"}

# Sticky Notes
class StickyNoteCreate(SQLModel):
    content: str = ""
    color: str = "yellow"
    x_position: int = 0
    y_position: int = 0
    z_index: int = 1
    is_expanded: bool = True

class StickyNoteUpdate(SQLModel):
    content: Optional[str] = None
    color: Optional[str] = None
    x_position: Optional[int] = None
    y_position: Optional[int] = None
    z_index: Optional[int] = None
    is_expanded: Optional[bool] = None

@app.get("/api/notes")
async def get_notes(user: User = Depends(get_current_user), db=Depends(get_session)):
    result = await db.exec(select(StickyNote).where(StickyNote.user_id == user.user_id))
    return result.all()

@app.post("/api/notes")
async def create_note(note_data: StickyNoteCreate, user: User = Depends(get_current_user), db=Depends(get_session)):
    new_note = StickyNote(
        note_id=str(uuid.uuid4()),
        user_id=user.user_id,
        **note_data.dict()
    )
    db.add(new_note)
    await db.commit()
    await db.refresh(new_note)
    return new_note

@app.put("/api/notes/{note_id}")
async def update_note(note_id: str, note_update: StickyNoteUpdate, user: User = Depends(get_current_user), db=Depends(get_session)):
    result = await db.exec(select(StickyNote).where(and_(StickyNote.note_id == note_id, StickyNote.user_id == user.user_id)))
    note = result.first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    update_data = note_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(note, key, value)
        
    note.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(note)
    return note

@app.delete("/api/notes/{note_id}")
async def delete_note(note_id: str, user: User = Depends(get_current_user), db=Depends(get_session)):
    result = await db.exec(select(StickyNote).where(and_(StickyNote.note_id == note_id, StickyNote.user_id == user.user_id)))
    note = result.first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    await db.delete(note)
    await db.commit()
    return {"message": "Note deleted"}