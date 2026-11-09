from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, active_db_type, PG_URL, SQLITE_URL

# Import feature-named modular routers
from routers import (
    auth_authentication,
    jobs_postings,
    admin_dashboard,
    admin_analytics,
    admin_queries_stories,
    student_dashboard,
    student_hub
)

app = FastAPI(
    title="Campus Hire Python API",
    description="FastAPI Feature-Modular Backend for Campus Hire Recruitment Portal",
    version="1.0.0"
)

# --------------------------------------------------------------------------
# 1. CORS CONFIGURATION
# --------------------------------------------------------------------------
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------
# 2. MOUNT FEATURE-NAMED ROUTERS
# --------------------------------------------------------------------------
# Feature: Authentication & Security (Login, Registration, Password Recovery)
app.include_router(auth_authentication.router)

# Feature: Job Opportunities & Postings
app.include_router(jobs_postings.router)

# Feature: Admin Dashboard (Page 1 - Metrics, Jobs, Drafts, Applicants, Profile)
app.include_router(admin_dashboard.router)

# Feature: Admin Student Analytics (Page 2 - Donut, CGPA Bar, Skills, Leaderboard)
app.include_router(admin_analytics.router)

# Feature: Admin Queries & Placement Stories (Page 3 - Queries, Drives, Stories)
app.include_router(admin_queries_stories.router)

# Feature: Student Dashboard (Metrics, Profile, Applications, Notifications)
app.include_router(student_dashboard.router)

# Feature: Student Hub (Stories, Next Campus Drive, Support Queries)
app.include_router(student_hub.router)

# --------------------------------------------------------------------------
# 3. ROOT HEALTH CHECK & FEATURE DIRECTORY
# --------------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    print(f"[*] Initializing Campus Hire Database (mode: {active_db_type})...")
    init_db()
    print("[*] Database tables and initial seed data initialized successfully.")

@app.get("/")
def health_check():
    db_provider = "Neon Cloud" if "neon.tech" in PG_URL else ("Local PostgreSQL" if active_db_type == "postgresql" else "SQLite")
    return {
        "status": "online",
        "service": "Campus Hire Python API",
        "database": {
            "mode": active_db_type,
            "provider": db_provider
        },
        "docs_url": "http://127.0.0.1:8000/docs",
        "features": {
            "auth": {
                "file": "backend/routers/auth_authentication.py",
                "endpoints": "/api/auth/*"
            },
            "jobs": {
                "file": "backend/routers/jobs_postings.py",
                "endpoints": "/api/jobs/*"
            },
            "admin_dashboard_page1": {
                "file": "backend/routers/admin_dashboard.py",
                "endpoints": "/api/admin/metrics, /api/admin/jobs, /api/admin/drafts, /api/admin/applicants, /api/admin/profile"
            },
            "admin_analytics_page2": {
                "file": "backend/routers/admin_analytics.py",
                "endpoints": "/api/admin/analytics/*"
            },
            "admin_queries_stories_page3": {
                "file": "backend/routers/admin_queries_stories.py",
                "endpoints": "/api/admin/queries/*, /api/admin/drives/*, /api/admin/stories/*"
            },
            "student_dashboard": {
                "file": "backend/routers/student_dashboard.py",
                "endpoints": "/api/student/dashboard, /api/student/metrics, /api/student/applications, /api/student/profile"
            },
            "student_hub": {
                "file": "backend/routers/student_hub.py",
                "endpoints": "/api/student/hub/*"
            }
        }
    }
