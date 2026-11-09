from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime
import time
from database import jobs_db, placement_drives_db, notifications_db, SessionLocal
from models import JobModel, PlacementDriveModel, NotificationModel
from schemas import JobCreate

router = APIRouter(prefix="/api/jobs", tags=["Feature: Job Postings & Opportunities"])

@router.get("")
@router.get("/")
def get_all_jobs(
    search: Optional[str] = None,
    filter_by: Optional[str] = None,
    filter_value: Optional[str] = None
):
    db = SessionLocal()
    try:
        query = db.query(JobModel)
        if search and isinstance(search, str):
            s = f"%{search.lower().strip()}%"
            query = query.filter(JobModel.title.ilike(s) | JobModel.company.ilike(s))
        if filter_by == "By Company Name" and filter_value and isinstance(filter_value, str):
            fv = f"%{filter_value.lower().strip()}%"
            query = query.filter(JobModel.company.ilike(fv)).order_by(JobModel.company.asc())
        elif filter_by == "By Date" and filter_value and isinstance(filter_value, str):
            query = query.filter((JobModel.deadline == filter_value) | (JobModel.date == filter_value))
        else:
            query = query.order_by(JobModel.id.desc())
        
        db_jobs = query.all()
        results = [
            {
                "id": j.id,
                "title": j.title,
                "company": j.company,
                "status": j.status,
                "date": j.date,
                "deadline": j.deadline,
                "logoUrl": j.logo_url,
                "location": j.location,
                "requirements": j.requirements,
                "degree": j.degree,
                "branch": j.branch,
                "cgpa": j.cgpa,
                "year": j.year,
                "experience": j.experience
            }
            for j in db_jobs
        ]
        return {
            "status": "success",
            "count": len(results),
            "data": results
        }
    except Exception as e:
        # Fallback to in-memory list if DB query fails
        results = list(jobs_db)
        return {"status": "success", "count": len(results), "data": results}
    finally:
        db.close()

@router.post("")
@router.post("/")
def create_job(job: JobCreate):
    company_name = job.company or job.companyName
    job_title = job.title or job.jobRoleOverview
    job_req = job.requirements or job.jobRequirements

    if not company_name or not job_title:
        raise HTTPException(status_code=400, detail="Company Name and Job Title / Overview are required")

    now_date = datetime.now().strftime("%d %b %Y")
    deadline_val = job.deadline or "2026-07-20"
    cgpa_val = float(job.cgpa if job.cgpa not in (None, 0.0) else (job.minCgpa or 0.0))
    year_val = str(job.year or job.passingYear or "2026")
    location_val = job.location or "Remote"
    logo_val = f"https://logo.clearbit.com/{company_name.lower().replace(' ', '')}.com"

    db = SessionLocal()
    new_job_id = None
    try:
        db_job = JobModel(
            title=job_title,
            company=company_name,
            status="Active",
            date=now_date,
            deadline=deadline_val,
            logo_url=logo_val,
            location=location_val,
            requirements=job_req or "Standard placement criteria",
            degree=job.degree or "B.Tech",
            branch=job.branch or "Computer Science",
            cgpa=cgpa_val,
            year=year_val,
            experience=job.experience or "Fresher"
        )
        db.add(db_job)

        db_drive = PlacementDriveModel(
            company=company_name,
            logo=logo_val,
            role=job_title,
            location=location_val,
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
        new_job_id = db_job.id
    except Exception as e:
        db.rollback()
        print(f"[!] DB insert failed for job: {e}")
        new_job_id = int(time.time() * 1000)
    finally:
        db.close()

    new_job = {
        "id": new_job_id,
        "title": job_title,
        "company": company_name,
        "status": "Active",
        "date": now_date,
        "deadline": deadline_val,
        "logoUrl": logo_val,
        "location": location_val,
        "requirements": job_req or "Standard placement criteria",
        "degree": job.degree or "B.Tech",
        "branch": job.branch or "Computer Science",
        "cgpa": cgpa_val,
        "year": year_val,
        "experience": job.experience or "Fresher"
    }
    jobs_db.insert(0, new_job)

    return {
        "status": "success",
        "message": f"Job posted successfully for {company_name}!",
        "data": new_job
    }

@router.get("/{job_id}")
def get_job_by_id(job_id: int):
    db = SessionLocal()
    try:
        j = db.query(JobModel).filter(JobModel.id == job_id).first()
        if j:
            return {
                "status": "success",
                "data": {
                    "id": j.id,
                    "title": j.title,
                    "company": j.company,
                    "status": j.status,
                    "date": j.date,
                    "deadline": j.deadline,
                    "logoUrl": j.logo_url,
                    "location": j.location,
                    "requirements": j.requirements,
                    "degree": j.degree,
                    "branch": j.branch,
                    "cgpa": j.cgpa,
                    "year": j.year,
                    "experience": j.experience
                }
            }
    finally:
        db.close()

    job = next((j for j in jobs_db if j["id"] == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"status": "success", "data": job}

@router.delete("/{job_id}")
def delete_job(job_id: int):
    db = SessionLocal()
    try:
        j = db.query(JobModel).filter(JobModel.id == job_id).first()
        if j:
            db.delete(j)
            db.commit()
    except Exception as e:
        db.rollback()
    finally:
        db.close()

    global jobs_db, placement_drives_db
    jobs_db[:] = [j for j in jobs_db if j["id"] != job_id]
    placement_drives_db[:] = [d for d in placement_drives_db if d["id"] != job_id]
    return {
        "status": "success",
        "message": "Job posting deleted successfully!"
    }

