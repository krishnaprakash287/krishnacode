# NEXGEN CODE — Online Programming Practice & Examination Platform

NEXGEN CODE is a complete, modern, responsive full-stack online programming practice and coding examination platform built for students and educational administrators.

---

## Technical Stack & Architecture

### Frontend
- **Framework**: Next.js 14 (App Router) & React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Code Editor**: `@monaco-editor/react` (Multi-language VS Code editor experience)
- **Analytics & Visualizations**: Recharts (Pie charts, Bar charts, Area charts)
- **Theme**: Dark and Light Mode toggle

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM & Database**: SQLAlchemy 2.0 with PostgreSQL / SQLite support
- **Authentication**: JWT Access & Refresh Tokens, Direct bcrypt password hashing
- **Data Validation**: Pydantic v2
- **Cache & Queue**: Redis
- **Testing**: Pytest & FastAPI TestClient

### Code Execution Engine
- **Supported Languages**: Python 3, C (GCC), C++ (G++), Java 17, JavaScript (Node.js)
- **Execution Modes**:
  - `LOCAL`: Isolated subprocess runner with process timeout, memory limits, and STDIN/STDOUT piping.
  - `PISTON`: Integration with open-source Piston container execution API.
  - `JUDGE0`: Integration with Judge0 API.

### Email Notification System
- Extensible email service abstraction with support for:
  - `SMTP`: Standard SMTP providers
  - `POSTAL`: Self-hosted Postal API
  - `CONSOLE`: Local testing logger (storing full audit in `email_logs` table)

---

## Key Platform Features

### 1. Authentication & Security
- Secure Admin and Student login portals with Role-Based Access Control (RBAC).
- Students cannot access Admin endpoints (`/api/v1/analytics`, `/api/v1/students`, etc.).
- Force Password Change requirement on first login with temporary password.
- Password reset flow with email token dispatch.

### 2. Admin Student Management
- Create student accounts with automated temporary password generation, password hashing, and welcome credential email dispatches.
- Search and filter students by Registration Number, Batch, Section, and Department.
- Toggle active/disabled statuses, reset passwords, and resend login credentials.
- Export student rosters to CSV.

### 3. Problem & Test Case Management
- Full problem authoring: Title, Slug, Description, Difficulty (Easy, Medium, Hard), Topic, Tags, Input/Output Formats, Constraints, Examples, Time Limit (sec), Memory Limit (MB), Points, and Status.
- Public example test cases vs **Server-Isolated Hidden Test Cases**.
- Hidden test cases are strictly filtered out from non-admin API responses.

### 4. Sandboxed Code Execution & Grading
- **Run Code**: Executes code against public test cases only. Returns compilation/runtime output, execution time, and memory without modifying student scores or streak.
- **Submit Code**: Evaluates code against hidden test cases, updates student solved count, problem accuracy %, test-case accuracy %, score, and streak.
- Statuses: `Accepted`, `Wrong Answer`, `Compilation Error`, `Runtime Error`, `Time Limit Exceeded`, `Memory Limit Exceeded`.

### 5. Timed Coding Examinations
- Admin exam scheduling with start/end time windows, duration limits, passing marks, batch/section target assignment, and problem weight allocation.
- Dedicated Student Exam Interface with server-side countdown timer validation and automatic submission upon expiration.

### 6. Analytics & Global Leaderboard
- Real-time Leaderboard with rank calculation, score ordering, problem solved metrics, and batch/section filtering.
- Admin Dashboard metrics, top attempted problem charts, batch performance graphs, and CSV data exports.

---

## Getting Started & Local Development

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Running Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m pytest -v          # Run backend unit test suite
python app/services/seed.py  # Seed initial admin, students, & problems
uvicorn app.main:app --reload --port 8000
```

Backend Swagger API documentation will be accessible at `http://localhost:8000/api/v1/docs`.

### 3. Running Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Seed Access Credentials

| Role | Email | Default Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@nexgencode.com` | `Admin@123456` |
| **Student** | `rahul@example.com` | `Student@123456` |
| **Student** | `priya@example.com` | `Student@123456` |

---

## Docker Setup

Spin up the full multi-container stack (PostgreSQL, Redis, Piston, Backend, Frontend) with a single command:
```bash
docker-compose up --build
```
