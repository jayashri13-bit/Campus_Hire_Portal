from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from database import (
    analytics_department_data,
    analytics_cgpa_data,
    analytics_skills_data,
    analytics_top_students,
    users_db
)
from schemas import TopStudentCreate

router = APIRouter(prefix="/api/admin/analytics", tags=["Feature: Admin Student Analytics (Page 2)"])

# --------------------------------------------------------------------------
# 1. FULL ANALYTICS DATASET
# --------------------------------------------------------------------------
@router.get("")
@router.get("/")
def get_full_analytics():
    """Returns the complete analytics dataset for the Admin 2nd page (Student Analytics)."""
    return {
        "status": "success",
        "data": {
            "summary": {
                "placedStudents": 3,
                "placementRate": "75%",
                "highestPackage": "10,00,000",
                "averagePackage": "2,00,000",
                "totalEligible": 500
            },
            "departmentData": analytics_department_data,
            "totalStudents": 500,
            "cgpaData": analytics_cgpa_data,
            "skillsData": analytics_skills_data,
            "topStudents": analytics_top_students
        }
    }

# --------------------------------------------------------------------------
# 2. STAT CARDS SUMMARY
# --------------------------------------------------------------------------
@router.get("/summary")
def get_analytics_summary():
    """Returns the 4 summary statistics cards shown at the top of the analytics page."""
    return {
        "status": "success",
        "data": {
            "placedStudents": {
                "value": "3",
                "label": "Placed Students",
                "subtext": "Total placed this year"
            },
            "placementRate": {
                "value": "75%",
                "label": "Placement Rate",
                "subtext": "% of eligible students placed"
            },
            "highestPackage": {
                "value": "10,00,000",
                "label": "Highest Package",
                "subtext": "Top package offered"
            },
            "averagePackage": {
                "value": "2,00,000",
                "label": "Average Package",
                "subtext": "Average package offered"
            }
        }
    }

# --------------------------------------------------------------------------
# 3. DEPARTMENT BREAKDOWN
# --------------------------------------------------------------------------
@router.get("/departments")
def get_department_distribution():
    """Returns department-wise student distribution for the donut chart."""
    return {
        "status": "success",
        "totalStudents": 500,
        "data": analytics_department_data
    }

# --------------------------------------------------------------------------
# 4. PLACEMENT BY CGPA
# --------------------------------------------------------------------------
@router.get("/cgpa")
def get_cgpa_distribution():
    """Returns placement numbers grouped by CGPA range for the bar chart."""
    return {
        "status": "success",
        "maxStudents": 40,
        "data": analytics_cgpa_data
    }

# --------------------------------------------------------------------------
# 5. TOP SKILLS IN DEMAND
# --------------------------------------------------------------------------
@router.get("/skills")
def get_skills_demand():
    """Returns top in-demand programming skills and demand percentages."""
    return {
        "status": "success",
        "data": analytics_skills_data
    }

# --------------------------------------------------------------------------
# 6. TOP PLACED STUDENTS LEADERBOARD
# --------------------------------------------------------------------------
@router.get("/students")
def get_top_placed_students(
    search: Optional[str] = Query(None, description="Search by name, company, skill, branch, or passing year"),
    branch: Optional[str] = Query(None, description="Filter by branch (CS, IT, BCA)"),
    passingYear: Optional[str] = Query(None, description="Filter by passing year (2024, 2025, 2026)")
):
    """Returns the leaderboard of top placed students with search and filtering."""
    results = list(analytics_top_students)

    if search:
        s = search.lower().strip()
        results = [
            st for st in results
            if s in st.get("name", "").lower()
            or s in st.get("company", "").lower()
            or s in st.get("skill", "").lower()
            or s in st.get("branch", "").lower()
            or s in str(st.get("passingYear", ""))
        ]

    if branch:
        results = [st for st in results if st.get("branch", "").upper() == branch.upper().strip()]

    if passingYear:
        results = [st for st in results if str(st.get("passingYear", "")) == str(passingYear).strip()]

    return {
        "status": "success",
        "count": len(results),
        "data": results
    }

@router.post("/students")
def add_top_placed_student(student: TopStudentCreate):
    """Adds a new student to the Top Placed Students Leaderboard."""
    name_clean = student.name.strip()
    if not name_clean:
        raise HTTPException(status_code=400, detail="Student name is required")

    # Generate initials if not provided
    name_parts = name_clean.split(" ")
    initials_val = student.initials or (
        (name_parts[0][0] + name_parts[-1][0]).upper()
        if len(name_parts) > 1
        else name_clean[:2].upper()
    )

    skill_color_map = {
        "Full Stack": {"bg": "#f3e8ff", "text": "#a855f7"},
        "Data Science": {"bg": "#dbeafe", "text": "#2563eb"},
        "Backend": {"bg": "#dcfce7", "text": "#16a34a"},
        "React Native": {"bg": "#f3e8ff", "text": "#a855f7"},
        "Cloud": {"bg": "#ecfeff", "text": "#0891b2"},
        "Java": {"bg": "#e0e7ff", "text": "#4338ca"},
        "Python": {"bg": "#fef3c7", "text": "#d97706"}
    }
    skill_theme = skill_color_map.get(student.skill or "Full Stack", {"bg": "#f1f5f9", "text": "#475569"})

    new_record = {
        "rank": 1,
        "name": name_clean,
        "initials": initials_val,
        "branch": student.branch,
        "passingYear": str(student.passingYear),
        "cgpa": str(student.cgpa),
        "lpa": str(student.lpa),
        "skill": student.skill or "Software Eng",
        "skillColor": student.skillColor or skill_theme["bg"],
        "skillTextColor": student.skillTextColor or skill_theme["text"],
        "company": student.company.strip(),
        "companyColor": student.companyColor or "#1e293b"
    }

    # Prepend new record and re-rank all students
    analytics_top_students.insert(0, new_record)
    for idx, item in enumerate(analytics_top_students):
        item["rank"] = idx + 1

    return {
        "status": "success",
        "message": f"Student '{name_clean}' added to Leaderboard successfully!",
        "data": new_record
    }

@router.delete("/students/{rank}")
def remove_top_placed_student(rank: int):
    """Removes a student from the leaderboard by rank and re-calculates rankings."""
    global analytics_top_students
    orig_len = len(analytics_top_students)
    analytics_top_students[:] = [st for st in analytics_top_students if st.get("rank") != rank]

    if len(analytics_top_students) == orig_len:
        raise HTTPException(status_code=404, detail=f"No student found with rank {rank}")

    # Re-rank
    for idx, item in enumerate(analytics_top_students):
        item["rank"] = idx + 1

    return {
        "status": "success",
        "message": f"Student at rank {rank} removed from Leaderboard",
        "count": len(analytics_top_students)
    }

