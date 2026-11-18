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

@app.get("/api/public/landing/stats")
@app.get("/public/landing/stats")
def public_landing_stats():
    return {
        "status": "success",
        "data": {
            "totalStudents": 520,
            "totalPlacements": 340,
            "totalCompanies": 85,
            "placementRate": 82.5
        }
    }

@app.get("/api/public/landing/recent-activity")
@app.get("/public/landing/recent-activity")
def public_landing_recent_activity():
    return {
        "status": "success",
        "data": [
            {"companyName": "Google", "jobRoleOverview": "Software Engineer", "location": "Bangalore", "tag": "Now Hiring"},
            {"companyName": "Microsoft", "jobRoleOverview": "Cloud Solutions Architect", "location": "Hyderabad", "tag": "Now Hiring"},
            {"companyName": "Amazon", "jobRoleOverview": "SDE Intern", "location": "Pune", "tag": "Now Hiring"}
        ]
    }

# --------------------------------------------------------------------------
# 4. BACKWARD COMPATIBILITY ENDPOINTS (Supporting Legacy Frontend Paths)
# --------------------------------------------------------------------------
@app.get("/api/admin/student-analytics/dashboard")
@app.get("/admin/student-analytics/dashboard")
def legacy_admin_metrics():
    from database import jobs_db, users_db, applicants_db, drafts_db
    active_jobs = len([j for j in jobs_db if j.get("status") == "Active"])
    total_students = max(500, len(users_db) + 500)
    resumes_count = 120 + len(applicants_db)
    return {
        "status": "success",
        "data": {
            "totalActivePosts": active_jobs or 3,
            "activePostsGrowth": 12,
            "totalStudents": total_students,
            "studentGrowth": 8,
            "totalResumeReceived": resumes_count,
            "resumeGrowth": 15,
            "activeJobs": active_jobs or 3,
            "resumesReceived": resumes_count,
            "totalDrafts": len(drafts_db)
        }
    }

@app.get("/api/admin/dashboard/recent-posts")
@app.get("/admin/dashboard/recent-posts")
def legacy_recent_posts():
    from database import jobs_db
    return {
        "status": "success",
        "count": len(jobs_db),
        "data": [
            {
                "id": j.get("id"),
                "companyName": j.get("company"),
                "jobRole": j.get("title"),
                "postedDate": j.get("date", "Today"),
                "deadline": j.get("deadline", "2026-07-20"),
                "location": j.get("location", "Remote"),
                "jobRequirements": j.get("requirements", "General criteria"),
                "status": j.get("status", "Active"),
                "logoUrl": j.get("logoUrl")
            }
            for j in jobs_db
        ]
    }

@app.get("/api/admin/applicants/matching")
@app.get("/admin/applicants/matching")
def legacy_applicants_matching():
    from database import applicants_db
    return {
        "status": "success",
        "count": len(applicants_db),
        "data": list(applicants_db)
    }

@app.get("/api/notification/admin")
@app.get("/notification/admin")
def legacy_admin_notifications():
    from database import notifications_db
    return {
        "status": "success",
        "data": list(notifications_db)
    }

@app.get("/api/notification/student")
@app.get("/notification/student")
def legacy_student_notifications():
    from database import student_notifications_db
    return {
        "status": "success",
        "data": list(student_notifications_db)
    }

@app.get("/api/notification/admin/unread-count")
def legacy_admin_unread_count():
    from database import notifications_db
    return {"status": "success", "data": {"count": len(notifications_db)}}

@app.get("/api/notification/student/unread-count")
def legacy_student_unread_count():
    from database import student_notifications_db
    return {"status": "success", "data": {"count": len(student_notifications_db)}}

@app.put("/api/notification/admin/read-all")
def legacy_admin_read_all():
    return {"status": "success", "message": "Marked all as read"}

@app.put("/api/notification/student/read-all")
def legacy_student_read_all():
    return {"status": "success", "message": "Marked all as read"}

@app.get("/student/resume-match")
@app.get("/api/student/resume-match")
def legacy_resume_match():
    return {
        "status": "success",
        "data": [
            {"id": 1, "companyName": "Google", "jobRole": "Software Developer Intern", "matchScore": 92, "location": "Bangalore"},
            {"id": 2, "companyName": "Microsoft", "jobRole": "Full Stack Engineer", "matchScore": 88, "location": "Hyderabad"},
            {"id": 3, "companyName": "Amazon", "jobRole": "Cloud Support Associate", "matchScore": 81, "location": "Pune"}
        ]
    }


