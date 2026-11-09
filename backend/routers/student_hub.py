from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime
import time

from database import (
    queries_db,
    stories_db,
    placement_drives_db,
    SessionLocal
)
from models import StudentQueryModel
from schemas import StudentHubQueryCreate

router = APIRouter(prefix="/api/student/hub", tags=["Feature: Student Hub"])

# ==============================================================================
# STUDENT HUB ENDPOINTS (Stories, Drives, Support Queries)
# ==============================================================================

@router.get("")
@router.get("/")
def get_student_hub_overview(email: Optional[str] = None):
    """
    Complete dataset for the Student Hub page:
    - Success Stories
    - Next Campus Event / Drives
    - Student's Queries (All & Resolved)
    - Hub Statistics
    """
    active_drives = [d for d in placement_drives_db if d.get("status") in ("open", "upcoming")]
    next_event = active_drives[0] if active_drives else None

    results_queries = list(queries_db)
    if email:
        email_clean = email.strip().lower()
        results_queries = [
            q for q in results_queries
            if q.get("email", "").lower() == email_clean or email_clean in q.get("name", "").lower()
        ]

    resolved_count = len([q for q in results_queries if q.get("status") == "resolved" or q.get("studentConfirmed")])

    return {
        "status": "success",
        "data": {
            "stories": stories_db,
            "nextEvent": next_event,
            "allDrives": placement_drives_db,
            "queries": results_queries,
            "stats": {
                "storiesCount": len(stories_db),
                "totalQueries": len(results_queries),
                "resolvedQueries": resolved_count
            }
        }
    }


@router.get("/stories")
def get_student_hub_stories():
    """Fetch published placement success stories for students."""
    return {
        "status": "success",
        "count": len(stories_db),
        "data": stories_db
    }


@router.get("/drives")
def get_student_hub_drives():
    """Fetch active campus placement drives."""
    return {
        "status": "success",
        "count": len(placement_drives_db),
        "data": placement_drives_db
    }


@router.get("/queries")
def get_student_hub_queries(
    status: Optional[str] = None,
    search: Optional[str] = None
):
    """
    Fetch student queries with optional status filter ('all', 'resolved') and search query.
    """
    results = list(queries_db)

    if status == "resolved":
        results = [q for q in results if q.get("status") == "resolved" or q.get("studentConfirmed")]

    if search and isinstance(search, str):
        s = search.lower().strip()
        results = [
            q for q in results
            if s in q.get("title", "").lower()
            or s in q.get("message", "").lower()
            or s in q.get("name", "").lower()
        ]

    return {
        "status": "success",
        "count": len(results),
        "data": results
    }


@router.post("/queries")
def raise_student_hub_query(data: StudentHubQueryCreate):
    """
    Student submits a support query.
    Instantly synced into queries_db so it is visible to administrators on Page 3.
    """
    query_id = int(time.time() * 1000)
    now_date = datetime.now().strftime("%d %b %Y")
    student_name = data.studentName or "Student"

    initials = "".join([p[0] for p in student_name.strip().split()[:2]]).upper() or "ST"
    color_classes = ["blue", "purple", "green", "orange"]
    chosen_color = color_classes[len(queries_db) % len(color_classes)]

    new_query = {
        "id": query_id,
        "name": student_name,
        "course": data.course or "B.Tech CSE",
        "avatar": initials,
        "colorClass": chosen_color,
        "title": data.subject.strip(),
        "message": data.message.strip(),
        "date": now_date,
        "status": "pending",
        "reply": "",
        "studentConfirmed": False
    }

    queries_db.insert(0, new_query)

    # Save to PostgreSQL
    db = SessionLocal()
    try:
        db_q = StudentQueryModel(
            name=student_name,
            course=data.course or "B.Tech CSE",
            avatar=initials,
            color_class=chosen_color,
            title=data.subject.strip(),
            message=data.message.strip(),
            date=now_date,
            status="pending",
            reply=None
        )
        db.add(db_q)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[!] Warning DB query insert: {e}")
    finally:
        db.close()

    return {
        "status": "success",
        "message": "Query raised successfully! Admin will respond soon.",
        "data": new_query
    }


@router.put("/queries/{query_id}/resolve")
def resolve_student_hub_query(query_id: int):
    """
    Student confirms and marks a query as resolved.
    """
    query = next((q for q in queries_db if q.get("id") == query_id), None)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")

    query["status"] = "resolved"
    query["studentConfirmed"] = True

    return {
        "status": "success",
        "message": "Query marked as resolved! Admin has been notified.",
        "data": query
    }

