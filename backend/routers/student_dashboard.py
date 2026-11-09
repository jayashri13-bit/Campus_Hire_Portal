from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime
import time

from database import (
    users_db,
    credentials_db,
    placement_drives_db,
    applicants_db,
    notifications_db,
    student_applications_db,
    student_notifications_db,
    SessionLocal
)
from models import StudentApplicationModel, ApplicantModel, NotificationModel
from schemas import (
    StudentProfileUpdate,
    StudentChangePassword,
    StudentApplicationCreate
)

router = APIRouter(prefix="/api/student", tags=["Feature: Student Dashboard"])

# ==============================================================================
# 1. STUDENT DASHBOARD OVERVIEW & METRICS
# ==============================================================================

@router.get("/dashboard")
def get_student_dashboard(email: Optional[str] = None):
    """
    Returns the complete overview for the Student Dashboard:
    - 4 Key Metrics (Profile Completion %, Selected, Pending, Rejected)
    - Student Profile Details
    - Next Upcoming Placement Drive
    - Active Notifications
    - Applied Job IDs
    """
    email_key = (email or "student@college.edu").strip().lower()
    user = users_db.get(email_key, {})

    # Calculate profile completion percentage
    profile_fields = [
        user.get("fullName") or user.get("name"),
        user.get("email", email_key),
        user.get("phone") or user.get("mobile"),
        user.get("branch") or user.get("department"),
        user.get("passingYear") or user.get("year"),
        user.get("cgpa"),
        user.get("skills"),
        user.get("linkedinUrl"),
        user.get("githubUrl")
    ]
    filled_count = sum(1 for f in profile_fields if f and str(f).strip() != "")
    profile_completion = round((filled_count / len(profile_fields)) * 100) if profile_fields else 85
    profile_completion = max(profile_completion, 60)

    # Calculate student application stats
    student_apps = [a for a in student_applications_db if a.get("studentEmail", "").lower() == email_key]
    selected_count = len([a for a in student_apps if a.get("status", "").lower() == "selected"])
    pending_count = len([a for a in student_apps if a.get("status", "").lower() == "pending"])
    rejected_count = len([a for a in student_apps if a.get("status", "").lower() == "rejected"])

    # Fallback default counters
    if not student_apps:
        selected_count = 5
        pending_count = 3
        rejected_count = 6

    # Next upcoming campus placement drive
    active_drives = [d for d in placement_drives_db if d.get("status") in ("open", "upcoming")]
    next_event = active_drives[0] if active_drives else None

    # Applied job IDs
    applied_job_ids = [a.get("jobId") for a in student_apps if a.get("jobId")]

    return {
        "status": "success",
        "data": {
            "metrics": [
                {
                    "id": "profile",
                    "title": "Profile Completed",
                    "value": f"{profile_completion}%",
                    "progress": profile_completion,
                    "colorClass": "blue"
                },
                {
                    "id": "selected",
                    "title": "Selected",
                    "value": str(selected_count),
                    "progress": 50,
                    "colorClass": "green"
                },
                {
                    "id": "pending",
                    "title": "Pending",
                    "value": str(pending_count),
                    "progress": 30,
                    "colorClass": "orange"
                },
                {
                    "id": "rejected",
                    "title": "Rejected",
                    "value": str(rejected_count),
                    "progress": 60,
                    "colorClass": "red"
                }
            ],
            "profile": {
                "fullName": user.get("fullName") or user.get("fullname") or "Rahul Patil",
                "email": user.get("email") or email_key,
                "phone": user.get("phone") or user.get("mobile") or "+91 9876543210",
                "branch": user.get("branch") or user.get("department") or "B.Tech Computer Science",
                "passingYear": user.get("passingYear") or user.get("year") or "2026",
                "cgpa": user.get("cgpa") or 8.5,
                "skills": user.get("skills") or "React, Node.js, Python, SQL",
                "linkedinUrl": user.get("linkedinUrl") or "https://linkedin.com/in/student",
                "githubUrl": user.get("githubUrl") or "https://github.com/student"
            },
            "nextEvent": next_event,
            "notifications": student_notifications_db,
            "appliedJobIds": applied_job_ids
        }
    }


@router.get("/metrics")
def get_student_metrics(email: Optional[str] = None):
    """Returns only the 4 status metrics for the student dashboard."""
    email_key = (email or "student@college.edu").strip().lower()
    student_apps = [a for a in student_applications_db if a.get("studentEmail", "").lower() == email_key]

    selected_count = len([a for a in student_apps if a.get("status", "").lower() == "selected"]) or 5
    pending_count = len([a for a in student_apps if a.get("status", "").lower() == "pending"]) or 3
    rejected_count = len([a for a in student_apps if a.get("status", "").lower() == "rejected"]) or 6

    return {
        "status": "success",
        "data": {
            "profileCompletion": 85,
            "selected": selected_count,
            "pending": pending_count,
            "rejected": rejected_count
        }
    }


@router.get("/notifications")
def get_student_notifications():
    """Returns active student placement notifications."""
    return {
        "status": "success",
        "count": len(student_notifications_db),
        "data": student_notifications_db
    }


# ==============================================================================
# 2. STUDENT APPLICATIONS (APPLY TO JOBS)
# ==============================================================================

@router.get("/applications")
def get_student_applications(email: Optional[str] = None):
    """
    Fetch all job applications submitted by students.
    """
    results = list(student_applications_db)
    if email:
        email_clean = email.strip().lower()
        results = [a for a in results if a.get("studentEmail", "").lower() == email_clean]

    return {
        "status": "success",
        "count": len(results),
        "data": results
    }


@router.post("/applications")
def apply_for_job(application: StudentApplicationCreate):
    """
    Submit a student application with resume PDF for an open job posting.
    Automatically updates the admin applicants pool so administrators can review it.
    """
    app_id = int(time.time() * 1000)
    now_date = datetime.now().strftime("%Y-%m-%d")

    new_application = {
        "id": app_id,
        "jobId": application.jobId,
        "company": application.company.strip(),
        "role": application.role.strip(),
        "studentEmail": application.studentEmail.strip().lower(),
        "studentName": application.studentName.strip(),
        "resumeFileName": application.resumeFileName or "resume.pdf",
        "status": application.status or "Pending",
        "date": application.date or now_date
    }

    student_applications_db.insert(0, new_application)

    # Sync to admin applicants list for visibility
    user_info = users_db.get(application.studentEmail.strip().lower(), {})
    admin_applicant = {
        "id": app_id,
        "name": application.studentName.strip(),
        "company": application.company.strip(),
        "degree": user_info.get("course", "B.Tech"),
        "branch": user_info.get("department", "Computer Science"),
        "cgpa": user_info.get("cgpa", 8.0),
        "year": f"{user_info.get('currentYear', 2026)} Passout",
        "match": 85,
        "date": now_date
    }
    applicants_db.insert(0, admin_applicant)

    # Save to PostgreSQL
    db = SessionLocal()
    try:
        db_app = StudentApplicationModel(
            job_id=application.jobId,
            company=application.company.strip(),
            role=application.role.strip(),
            student_email=application.studentEmail.strip().lower(),
            student_name=application.studentName.strip(),
            resume_file_name=application.resumeFileName or "resume.pdf",
            status=application.status or "Pending",
            date=application.date or now_date
        )
        db.add(db_app)

        db_applicant = ApplicantModel(
            name=application.studentName.strip(),
            company=application.company.strip(),
            degree=user_info.get("course", "B.Tech"),
            branch=user_info.get("department", "Computer Science"),
            cgpa=float(user_info.get("cgpa", 8.0)),
            year=f"{user_info.get('currentYear', 2026)} Passout",
            match=85,
            date=now_date
        )
        db.add(db_applicant)

        db_notif = NotificationModel(
            text=f"{application.studentName} applied for {application.company} ({application.role})!",
            date="Today",
            target_role="admin"
        )
        db.add(db_notif)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[!] Warning DB application insert: {e}")
    finally:
        db.close()

    # Real-time alert to admin
    notifications_db.insert(0, {
        "id": int(time.time() * 1000),
        "text": f"{application.studentName} applied for {application.company} ({application.role})!",
        "date": "Today"
    })

    return {
        "status": "success",
        "message": f"Successfully applied for {application.role} at {application.company}!",
        "data": new_application
    }


# ==============================================================================
# 3. STUDENT PROFILE & CHANGE PASSWORD
# ==============================================================================

@router.get("/profile")
def get_student_profile(email: Optional[str] = "student@college.edu"):
    """Fetch profile information for a student."""
    email_key = (email or "student@college.edu").strip().lower()
    user = users_db.get(email_key)

    if not user:
        user = {
            "fullName": "Rahul Patil",
            "email": email_key,
            "phone": "+91 9876543210",
            "branch": "B.Tech Computer Science",
            "passingYear": "2026",
            "cgpa": 8.5,
            "skills": "React, Node.js, Python, SQL",
            "linkedinUrl": "https://linkedin.com/in/student",
            "githubUrl": "https://github.com/student"
        }
        users_db[email_key] = user

    return {
        "status": "success",
        "data": {
            "fullName": user.get("fullName") or user.get("fullname") or "Rahul Patil",
            "email": user.get("email") or email_key,
            "phone": user.get("phone") or user.get("mobile") or "+91 9876543210",
            "branch": user.get("branch") or user.get("department") or "B.Tech Computer Science",
            "passingYear": user.get("passingYear") or user.get("year") or "2026",
            "cgpa": user.get("cgpa") or 8.5,
            "skills": user.get("skills") or "React, Node.js, Python, SQL",
            "linkedinUrl": user.get("linkedinUrl") or "https://linkedin.com/in/student",
            "githubUrl": user.get("githubUrl") or "https://github.com/student"
        }
    }


@router.put("/profile")
def update_student_profile(data: StudentProfileUpdate):
    """Update profile information for a student."""
    email_key = data.email.strip().lower()
    existing = users_db.get(email_key, {})

    if data.fullName:
        existing["fullName"] = data.fullName.strip()
    if data.phone:
        existing["phone"] = data.phone.strip()
        existing["mobile"] = data.phone.strip()
    if data.branch:
        existing["branch"] = data.branch.strip()
        existing["department"] = data.branch.strip()
    if data.passingYear:
        existing["passingYear"] = data.passingYear.strip()
        existing["currentYear"] = data.passingYear.strip()
    if data.cgpa is not None:
        existing["cgpa"] = data.cgpa
    if data.skills:
        existing["skills"] = data.skills.strip()
    if data.linkedinUrl:
        existing["linkedinUrl"] = data.linkedinUrl.strip()
    if data.githubUrl:
        existing["githubUrl"] = data.githubUrl.strip()

    users_db[email_key] = existing

    return {
        "status": "success",
        "message": "Student profile updated successfully!",
        "data": existing
    }


@router.put("/change-password")
def change_student_password(data: StudentChangePassword):
    """Change a student's login password."""
    email_key = data.email.strip().lower()

    if data.confirmPassword and data.newPassword != data.confirmPassword:
        raise HTTPException(status_code=400, detail="New passwords do not match!")

    stored = credentials_db.get(email_key)
    if stored and data.currentPassword != stored:
        raise HTTPException(status_code=400, detail="Current password is incorrect!")

    credentials_db[email_key] = data.newPassword

    return {
        "status": "success",
        "message": "Password updated successfully!"
    }

