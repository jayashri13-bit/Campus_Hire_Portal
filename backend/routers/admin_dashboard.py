from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any
from datetime import datetime
import time

from database import (
    users_db,
    credentials_db,
    jobs_db,
    placement_drives_db,
    drafts_db,
    applicants_db,
    notifications_db,
    admin_profiles_db,
    SessionLocal
)
from models import JobModel, PlacementDriveModel, NotificationModel, DraftJobModel, ApplicantModel
from schemas import (
    JobCreate,
    ApplicantCreate,
    NotificationCreate,
    AdminProfileUpdate,
    AdminChangePassword
)

router = APIRouter(prefix="/api/admin", tags=["Feature: Admin Dashboard (Page 1)"])

# --------------------------------------------------------------------------
# 1. ADMIN METRICS
# --------------------------------------------------------------------------
@router.get("/metrics")
def get_admin_metrics():
    active_jobs_count = len([j for j in jobs_db if j.get("status") == "Active"])
    total_students_count = max(500, len(users_db) + 500)
    resumes_count = 120 + len(applicants_db)
    drafts_count = len(drafts_db)

    return {
        "status": "success",
        "data": {
            "activeJobs": active_jobs_count,
            "totalStudents": total_students_count,
            "resumesReceived": resumes_count,
            "totalDrafts": drafts_count,
            "trends": {
                "activeJobsTrend": "↑ 12% from last month",
                "studentsTrend": "↑ 8% from last month",
                "resumesTrend": "↑ 15% from last month"
            }
        }
    }

# --------------------------------------------------------------------------
# 2. JOB POSTINGS
# --------------------------------------------------------------------------
@router.get("/jobs")
def get_admin_jobs(
    search: Optional[str] = None,
    filter_by: Optional[str] = None,
    filter_value: Optional[str] = None
):
    results = list(jobs_db)

    if search and isinstance(search, str):
        s = search.lower().strip()
        results = [j for j in results if s in j.get("title", "").lower() or s in j.get("company", "").lower()]

    if filter_by == "By Company Name" and filter_value and isinstance(filter_value, str):
        fv = filter_value.lower().strip()
        results = [j for j in results if fv in j.get("company", "").lower()]
        results.sort(key=lambda x: x.get("company", "").lower())
    elif filter_by == "By Date" and filter_value and isinstance(filter_value, str):
        results = [j for j in results if j.get("deadline") == filter_value or j.get("date") == filter_value]

    return {
        "status": "success",
        "count": len(results),
        "data": results
    }

@router.post("/jobs")
def create_admin_job(job: JobCreate):
    company_name = job.company or job.companyName
    job_title = job.title or job.jobRoleOverview
    job_req = job.requirements or job.jobRequirements

    if not company_name or not job_title:
        raise HTTPException(status_code=400, detail="Company Name and Job Title / Overview are required")

    job_id = int(time.time() * 1000)
    now_date = datetime.now().strftime("%d %b %Y")
    deadline_val = job.deadline or "2026-07-20"
    cgpa_val = job.cgpa if job.cgpa not in (None, 0.0) else (job.minCgpa or 0.0)
    year_val = job.year or job.passingYear or "2026"

    new_job = {
        "id": job_id,
        "title": job_title,
        "company": company_name,
        "status": "Active",
        "date": now_date,
        "deadline": deadline_val,
        "logoUrl": f"https://logo.clearbit.com/{company_name.lower().replace(' ', '')}.com",
        "location": job.location or "Remote",
        "requirements": job_req or "Standard placement criteria",
        "degree": job.degree or "B.Tech",
        "branch": job.branch or "Computer Science",
        "cgpa": cgpa_val,
        "year": year_val,
        "experience": job.experience or "Fresher"
    }

    jobs_db.insert(0, new_job)

    db = SessionLocal()
    try:
        db_job = JobModel(
            title=job_title,
            company=company_name,
            status="Active",
            date=now_date,
            deadline=deadline_val,
            logo_url=new_job["logoUrl"],
            location=new_job["location"],
            requirements=job_req or "Standard placement criteria",
            degree=job.degree or "B.Tech",
            branch=job.branch or "Computer Science",
            cgpa=float(cgpa_val),
            year=str(year_val),
            experience=job.experience or "Fresher"
        )
        db.add(db_job)

        db_drive = PlacementDriveModel(
            company=company_name,
            logo=new_job["logoUrl"],
            role=job_title,
            location=new_job["location"],
            date=deadline_val,
            time="10:00 AM",
            status="open",
            venue="Placement Cell",
            about=f"{company_name} is hiring for {job_title}. Requirements: {job_req}",
            target_student="All"
        )
        db.add(db_drive)

        db_notif = NotificationModel(
            text=f"New placement drive posted for {company_name} ({job_title})!",
            date="Today",
            target_role="student"
        )
        db.add(db_notif)
        db.commit()
        db.refresh(db_job)
        new_job["id"] = db_job.id
    except Exception as e:
        db.rollback()
        print(f"[!] Warning DB admin job insert: {e}")
    finally:
        db.close()

    placement_drive = {
        "id": job_id,
        "company": company_name,
        "logo": new_job["logoUrl"],
        "role": job_title,
        "location": new_job["location"],
        "date": deadline_val,
        "time": "10:00 AM",
        "status": "open",
        "venue": "Placement Cell",
        "about": f"{company_name} is hiring for {job_title}. Requirements: {new_job['requirements']}",
        "targetStudent": "All"
    }
    placement_drives_db.insert(0, placement_drive)

    notifications_db.insert(0, {
        "id": int(time.time() * 1000),
        "text": f"New placement drive posted for {company_name} ({job_title})!",
        "date": "Today"
    })

    return {
        "status": "success",
        "message": f"Job posted successfully for {company_name}!",
        "data": new_job
    }

@router.get("/jobs/{job_id}")
def get_admin_job_by_id(job_id: int):
    job = next((j for j in jobs_db if j["id"] == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"status": "success", "data": job}

@router.delete("/jobs/{job_id}")
def delete_admin_job(job_id: int):
    global jobs_db, placement_drives_db
    jobs_db[:] = [j for j in jobs_db if j["id"] != job_id]
    placement_drives_db[:] = [d for d in placement_drives_db if d["id"] != job_id]
    return {
        "status": "success",
        "message": "Job posting deleted successfully!"
    }

# --------------------------------------------------------------------------
# 3. DRAFTS
# --------------------------------------------------------------------------
@router.get("/drafts")
def get_all_drafts():
    return {
        "status": "success",
        "count": len(drafts_db),
        "data": drafts_db
    }

@router.post("/drafts")
def save_draft(job: JobCreate):
    company_name = job.company or job.companyName
    job_title = job.title or job.jobRoleOverview
    job_req = job.requirements or job.jobRequirements

    if not company_name or not job_title:
        raise HTTPException(status_code=400, detail="Company Name and Job Role Overview are required to save draft")

    draft_id = int(time.time() * 1000)
    cgpa_val = job.cgpa if job.cgpa not in (None, 0.0) else (job.minCgpa or 0.0)
    year_val = job.year or job.passingYear or "2026"

    new_draft = {
        "id": draft_id,
        "title": job_title,
        "company": company_name,
        "location": job.location or "Remote",
        "requirements": job_req or "None",
        "degree": job.degree or "B.Tech",
        "branch": job.branch or "Computer Science",
        "cgpa": cgpa_val,
        "year": year_val,
        "experience": job.experience or "Fresher",
        "deadline": job.deadline or "",
        "lastSaved": "Just now"
    }

    drafts_db.insert(0, new_draft)
    return {
        "status": "success",
        "message": f"Draft saved for {company_name}!",
        "data": new_draft
    }

@router.get("/drafts/{draft_id}")
def get_draft_by_id(draft_id: int):
    draft = next((d for d in drafts_db if d["id"] == draft_id), None)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return {"status": "success", "data": draft}

@router.put("/drafts/{draft_id}/publish")
@router.post("/drafts/{draft_id}/publish")
def publish_draft(draft_id: int):
    draft = next((d for d in drafts_db if d["id"] == draft_id), None)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    drafts_db[:] = [d for d in drafts_db if d["id"] != draft_id]

    now_date = datetime.now().strftime("%d %b %Y")
    published_job = {
        **draft,
        "status": "Active",
        "date": now_date,
        "deadline": draft.get("deadline") or "2026-07-20",
        "logoUrl": f"https://logo.clearbit.com/{draft['company'].lower().replace(' ', '')}.com"
    }
    jobs_db.insert(0, published_job)

    placement_drive = {
        "id": published_job["id"],
        "company": published_job["company"],
        "logo": published_job["logoUrl"],
        "role": published_job["title"],
        "location": published_job.get("location", "Remote"),
        "date": published_job["deadline"],
        "time": "10:00 AM",
        "status": "open",
        "venue": "Placement Cell",
        "about": f"{published_job['company']} is hiring for {published_job['title']}.",
        "targetStudent": "All"
    }
    placement_drives_db.insert(0, placement_drive)

    return {
        "status": "success",
        "message": f"Published draft: {published_job['title']} at {published_job['company']}!",
        "data": published_job
    }

@router.delete("/drafts/{draft_id}")
def delete_draft(draft_id: int):
    drafts_db[:] = [d for d in drafts_db if d["id"] != draft_id]
    return {
        "status": "success",
        "message": "Draft removed successfully!"
    }

# --------------------------------------------------------------------------
# 4. APPLICANTS
# --------------------------------------------------------------------------
@router.get("/applicants")
def get_applicants(
    search: Optional[str] = None,
    filter_by: Optional[str] = None,
    filter_value: Optional[str] = None
):
    results = list(applicants_db)

    if search and isinstance(search, str):
        s = search.lower().strip()
        results = [a for a in results if s in a.get("name", "").lower() or s in a.get("company", "").lower()]

    if filter_by == "By Company Name":
        if filter_value and isinstance(filter_value, str):
            fv = filter_value.lower().strip()
            results = [a for a in results if fv in a.get("company", "").lower()]
        results.sort(key=lambda x: x.get("company", "").lower())
    elif filter_by == "By Date":
        if filter_value and isinstance(filter_value, str):
            results = [a for a in results if a.get("date") == filter_value]
        results.sort(key=lambda x: x.get("date", ""), reverse=True)
    else:
        results.sort(key=lambda x: x.get("match", 0), reverse=True)

    return {
        "status": "success",
        "count": len(results),
        "data": results
    }

@router.post("/applicants")
def add_applicant(applicant: ApplicantCreate):
    new_applicant = {
        "id": int(time.time() * 1000),
        "name": applicant.name,
        "company": applicant.company,
        "degree": applicant.degree or "B.Tech",
        "branch": applicant.branch or "Computer Science",
        "cgpa": applicant.cgpa or 8.0,
        "year": applicant.year or "2026 Passout",
        "match": applicant.match or 85,
        "date": applicant.date or datetime.now().strftime("%Y-%m-%d")
    }
    applicants_db.insert(0, new_applicant)
    return {
        "status": "success",
        "message": "Applicant added successfully!",
        "data": new_applicant
    }

# --------------------------------------------------------------------------
# 5. NOTIFICATIONS
# --------------------------------------------------------------------------
@router.get("/notifications")
def get_notifications():
    return {
        "status": "success",
        "data": notifications_db
    }

@router.post("/notifications")
def add_notification(item: NotificationCreate):
    new_notif = {
        "id": int(time.time() * 1000),
        "text": item.text,
        "date": item.date or "Today"
    }
    notifications_db.insert(0, new_notif)
    return {"status": "success", "data": new_notif}

@router.delete("/notifications/{notification_id}")
def delete_notification(notification_id: int):
    notifications_db[:] = [n for n in notifications_db if n["id"] != notification_id]
    return {"status": "success", "message": "Notification dismissed"}

# --------------------------------------------------------------------------
# 6. ADMIN PROFILE & CHANGE PASSWORD
# --------------------------------------------------------------------------
@router.get("/profile")
def get_admin_profile(email: Optional[str] = "saurabh@gmail.com"):
    email_key = (email or "saurabh@gmail.com").strip().lower()
    profile = admin_profiles_db.get(email_key)
    if not profile:
        profile = {
            "name": "Saurabh (Admin)",
            "email": email_key,
            "phone": "+91 9876543210",
            "role": "System Administrator"
        }
        admin_profiles_db[email_key] = profile

    return {
        "status": "success",
        "data": profile
    }

@router.put("/profile")
def update_admin_profile(data: AdminProfileUpdate):
    email_key = (data.email or "saurabh@gmail.com").strip().lower()
    existing = admin_profiles_db.get(email_key, {
        "name": "Saurabh (Admin)",
        "email": email_key,
        "phone": "+91 9876543210",
        "role": "System Administrator"
    })

    if data.name:
        existing["name"] = data.name.strip()
    if data.phone:
        existing["phone"] = data.phone.strip()
    if data.role:
        existing["role"] = data.role.strip()

    admin_profiles_db[email_key] = existing

    if email_key in users_db:
        users_db[email_key]["fullName"] = existing["name"]
        users_db[email_key]["mobile"] = existing["phone"]

    return {
        "status": "success",
        "message": "Admin profile updated successfully!",
        "data": existing
    }

@router.put("/change-password")
def change_admin_password(data: AdminChangePassword):
    email_key = data.email.strip().lower()

    if data.confirmPassword and data.newPassword != data.confirmPassword:
        raise HTTPException(status_code=400, detail="New passwords do not match!")

    stored_password = credentials_db.get(email_key)
    if email_key == "saurabh@gmail.com":
        stored_password = stored_password or "Saurabh@123"

    if not stored_password or data.currentPassword != stored_password:
        raise HTTPException(status_code=400, detail="Current password is incorrect!")

    credentials_db[email_key] = data.newPassword
    return {
        "status": "success",
        "message": "Admin password changed successfully!"
    }

