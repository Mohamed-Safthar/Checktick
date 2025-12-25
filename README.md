# CheckTick

CheckTick is a productivity application featuring a FastAPI backend and a React 19 frontend.

## Prerequisites

- **Python 3.8+**
- **Node.js 16+** & **npm**
- **MySQL** (Ensure you have a database server running)

## Setup & Running

### 1. Database Setup
Create a MySQL database named `checktick_db`.
Update `backend/.env` (or create it) with your database connection string:
```env
DATABASE_URL="mysql+asyncmy://user:password@localhost:3306/checktick_db"
```
*(Note: If you are using the provided default configuration, ensure your local MySQL matches the credentials in `backend/database.py`)*

### 2. Backend (FastAPI)

Navigate to the backend directory:
```bash
cd backend
```

Create a virtual environment (optional but recommended):
```bash
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Run the server:
```bash
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.

### 3. Frontend (React)

Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm start
```
The application will open at `http://localhost:3000`.

## Features

- **Authentication**: Sign up and Login (Email/Password).
- **Task Management**: Create, Read, Update, Delete tasks. Reorder via Drag-and-Drop.
- **Pomodoro Timer**: Track focus sessions.
- **Statistics**: Visualize your productivity.
