from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime
import time

from database import queries_db, stories_db, placement_drives_db
from schemas import (
    QueryReply,
    QueryCreate,
    StoryCreate,
    DriveCreate,
    DriveUpdate
)

router = APIRouter(prefix="/api/admin", tags=["Feature: Admin Queries, Drives & Stories (Page 3)"])

# ==============================================================================
# 1. STUDENT QUERIES ENDPOINTS
# ==============================================================================

@router.get("/queries")
def get_student_queries(
    search: Optional[str] = None,
    status: Optional[str] = None
):
    """
    Fetch all student queries with optional search query and status filter ('all', 'pending', 'resolved').
    """
    results = list(queries_db)

    if status and isinstance(status, str) and status.lower() != "all":
        st = status.lower().strip()
        results = [q for q in results if q.get("status", "").lower() == st]

    if search and isinstance(search, str):
        s = search.lower().strip()
        results = [
            q for q in results
            if s in q.get("name", "").lower()
            or s in q.get("title", "").lower()
            or s in q.get("message", "").lower()
            or s in q.get("course", "").lower()
        ]

    return {
        "status": "success",
        "count": len(results),
        "data": results
    }


@router.get("/queries/stats")
def get_query_statistics():
    """
    Returns counts for total, pending, and resolved queries.
    """
    total = len(queries_db)
    pending = len([q for q in queries_db if q.get("status") == "pending"])
    resolved = len([q for q in queries_db if q.get("status") == "resolved"])

    return {
        "status": "success",
        "data": {
            "total": total,
            "pending": pending,
            "resolved": resolved
        }
    }


@router.post("/queries")
def create_student_query(data: QueryCreate):
    """
    Submit a new student support query.
    """
    query_id = int(time.time() * 1000)
    now_date = datetime.now().strftime("%d %b %Y")

    initials = "".join([part[0] for part in data.name.strip().split()[:2]]).upper() or "ST"

    new_query = {
        "id": query_id,
        "name": data.name.strip(),
        "course": data.course or "B.Sc Computer Science",
        "avatar": data.avatar or initials,
        "colorClass": data.colorClass or "blue",
        "title": data.title.strip(),
        "message": data.message.strip(),
        "date": data.date or now_date,
        "status": data.status or "pending",
        "reply": data.reply or ""
    }

    queries_db.insert(0, new_query)

    return {
        "status": "success",
        "message": "Query submitted successfully!",
        "data": new_query
    }


@router.post("/queries/{query_id}/reply")
def reply_student_query(query_id: int, payload: QueryReply):
    """
    Admin replies to student query, transitioning status to 'resolved'.
    """
    query = next((q for q in queries_db if q.get("id") == query_id), None)
    if not query:
        raise HTTPException(status_code=404, detail=f"Query with id {query_id} not found")

    query["reply"] = payload.reply.strip()
    query["status"] = "resolved"

    return {
        "status": "success",
        "message": f"Reply successfully dispatched to {query.get('name', 'student')}!",
        "data": query
    }


@router.delete("/queries/{query_id}")
def delete_student_query(query_id: int):
    """
    Dismiss or delete a student query.
    """
    global queries_db
    initial_len = len(queries_db)
    queries_db[:] = [q for q in queries_db if q.get("id") != query_id]

    if len(queries_db) == initial_len:
        raise HTTPException(status_code=404, detail="Query not found")

    return {
        "status": "success",
        "message": f"Query {query_id} deleted successfully."
    }


# ==============================================================================
# 2. PLACEMENT DRIVES ENDPOINTS (Admin Page 3 Drives Table)
# ==============================================================================

@router.get("/drives")
def get_placement_drives(
    search: Optional[str] = None,
    status: Optional[str] = None
):
    """
    Fetch placement drives for the drives management table.
    """
    results = list(placement_drives_db)

    if status and isinstance(status, str) and status.lower() != "all":
        st = status.lower().strip()
        results = [d for d in results if d.get("status", "").lower() == st]

    if search and isinstance(search, str):
        s = search.lower().strip()
        results = [
            d for d in results
            if s in d.get("company", "").lower()
            or s in d.get("role", "").lower()
            or s in d.get("location", "").lower()
            or s in d.get("venue", "").lower()
        ]

    return {
        "status": "success",
        "count": len(results),
        "data": results
    }


@router.post("/drives")
def create_placement_drive(data: DriveCreate):
    """
    Create a new placement drive.
    """
    drive_id = int(time.time() * 1000)
    company_clean = data.company.strip()
    logo_domain = company_clean.lower().replace(" ", "")

    new_drive = {
        "id": drive_id,
        "company": company_clean,
        "logo": data.logo or f"https://logo.clearbit.com/{logo_domain}.com",
        "role": data.role.strip(),
        "location": data.location or "Campus",
        "date": data.date or "2026-07-20",
        "time": data.time or "10:00 AM",
        "status": data.status or "open",
        "venue": data.venue or "Seminar Hall A",
        "about": data.about or f"{company_clean} is conducting an on-campus placement drive for {data.role}.",
        "targetStudent": data.targetStudent or "All"
    }

    placement_drives_db.insert(0, new_drive)

    return {
        "status": "success",
        "message": f"Placement drive for {company_clean} created successfully!",
        "data": new_drive
    }


@router.put("/drives/{drive_id}")
def update_placement_drive(drive_id: int, data: DriveUpdate):
    """
    Update an existing placement drive.
    """
    drive = next((d for d in placement_drives_db if d.get("id") == drive_id), None)
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    if data.company:
        drive["company"] = data.company.strip()
        drive["logo"] = f"https://logo.clearbit.com/{data.company.lower().replace(' ', '')}.com"
    if data.role:
        drive["role"] = data.role.strip()
    if data.location:
        drive["location"] = data.location.strip()
    if data.date:
        drive["date"] = data.date.strip()
    if data.time:
        drive["time"] = data.time.strip()
    if data.venue:
        drive["venue"] = data.venue.strip()
    if data.status:
        drive["status"] = data.status.strip()
    if data.about:
        drive["about"] = data.about.strip()
    if data.targetStudent:
        drive["targetStudent"] = data.targetStudent.strip()
    if data.logo:
        drive["logo"] = data.logo.strip()

    return {
        "status": "success",
        "message": f"Placement drive for {drive['company']} updated successfully!",
        "data": drive
    }


@router.delete("/drives/{drive_id}")
def delete_placement_drive(drive_id: int):
    """
    Delete a placement drive.
    """
    global placement_drives_db
    initial_len = len(placement_drives_db)
    placement_drives_db[:] = [d for d in placement_drives_db if d.get("id") != drive_id]

    if len(placement_drives_db) == initial_len:
        raise HTTPException(status_code=404, detail="Drive not found")

    return {
        "status": "success",
        "message": f"Placement drive {drive_id} deleted successfully."
    }


# ==============================================================================
# 3. PLACEMENT SUCCESS STORIES ENDPOINTS (Admin Page 3 Stories)
# ==============================================================================

@router.get("/stories")
def get_placement_stories():
    """
    Get all published placement success stories.
    """
    return {
        "status": "success",
        "count": len(stories_db),
        "data": stories_db
    }


@router.post("/stories")
def create_placement_story(story: StoryCreate):
    """
    Publish a new placement success story.
    """
    story_id = int(time.time() * 1000)
    now_date = datetime.now().strftime("%d %b %Y")

    new_story = {
        "id": story_id,
        "name": story.name.strip(),
        "avatar": story.avatar or "https://randomuser.me/api/portraits/women/68.jpg",
        "company": story.company.strip(),
        "companyColor": "#eff6ff",
        "companyTextColor": "#2563eb",
        "role": story.role.strip(),
        "packageAmt": story.packageAmt.strip() if story.packageAmt else "Not Disclosed",
        "storyText": story.storyText.strip() if story.storyText else f"Secured a {story.role} role at {story.company}.",
        "date": story.date or now_date
    }

    stories_db.insert(0, new_story)

    return {
        "status": "success",
        "message": f"Success story for {story.name} published successfully!",
        "data": new_story
    }


@router.delete("/stories/{story_id}")
def delete_placement_story(story_id: int):
    """
    Delete a placement success story.
    """
    global stories_db
    initial_len = len(stories_db)
    stories_db[:] = [s for s in stories_db if s.get("id") != story_id]

    if len(stories_db) == initial_len:
        raise HTTPException(status_code=404, detail="Story not found")

    return {
        "status": "success",
        "message": "Story deleted successfully!"
    }

