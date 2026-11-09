import os
import sys
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

# PostgreSQL / Database connection configuration
# If DATABASE_URL is set in environment or default PostgreSQL is running, use it.
# Otherwise, fall back cleanly to SQLite so the application works out-of-the-box.
PG_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/campushire_db")
SQLITE_URL = "sqlite:///./campushire.db"

active_db_type = "postgresql"

try:
    # Attempt to test connection to PostgreSQL
    test_engine = create_engine(PG_URL, connect_args={"connect_timeout": 3})
    with test_engine.connect() as conn:
        pass
    engine = test_engine
    print(f"[*] Successfully connected to PostgreSQL: {PG_URL}")
except Exception as e:
    # Fallback to local SQLite file database
    active_db_type = "sqlite"
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
    print(f"[*] PostgreSQL not currently running ({e}). Falling back smoothly to SQLite: {SQLITE_URL}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initial Mock & Demo Data (used for initial database seeding and in-memory fallback)
users_db = {}
credentials_db = {
    "saurabh@gmail.com": "Saurabh@123",
    "admin@college.edu": "Saurabh@123",
    "student@college.edu": "Student@123"
}

jobs_db = [
    {
        "id": 1,
        "title": "Software Developer Intern",
        "company": "Google",
        "status": "Active",
        "date": "05 July 2026",
        "deadline": "2026-07-20",
        "logoUrl": "https://logo.clearbit.com/google.com",
        "location": "Bangalore, India",
        "requirements": "Strong problem solving skills, DSA, React, Node.js",
        "degree": "B.Tech",
        "branch": "Computer Science",
        "cgpa": 7.5,
        "year": "2026",
        "experience": "Fresher"
    },
    {
        "id": 2,
        "title": "Data Analyst",
        "company": "Microsoft",
        "status": "Active",
        "date": "04 July 2026",
        "deadline": "2026-07-18",
        "logoUrl": "https://logo.clearbit.com/microsoft.com",
        "location": "Hyderabad, India",
        "requirements": "Python, SQL, Data Visualization, Excel",
        "degree": "B.Tech",
        "branch": "Information Technology",
        "cgpa": 7.0,
        "year": "2026",
        "experience": "Fresher"
    },
    {
        "id": 3,
        "title": "SDE Intern",
        "company": "Infosys",
        "status": "Active",
        "date": "03 July 2026",
        "deadline": "2026-07-15",
        "logoUrl": "https://logo.clearbit.com/infosys.com",
        "location": "Pune, India",
        "requirements": "Java, C++, Object Oriented Programming, DBMS",
        "degree": "B.Tech",
        "branch": "Computer Science",
        "cgpa": 6.5,
        "year": "2026",
        "experience": "Fresher"
    }
]

placement_drives_db = [
    {
        "id": 1,
        "company": "Google",
        "logo": "https://logo.clearbit.com/google.com",
        "role": "Software Developer Intern",
        "location": "Bangalore, India",
        "date": "2026-07-20",
        "time": "10:00 AM",
        "status": "open",
        "venue": "Placement Cell",
        "about": "Google is hiring for Software Developer Intern.",
        "targetStudent": "All"
    },
    {
        "id": 2,
        "company": "Microsoft",
        "logo": "https://logo.clearbit.com/microsoft.com",
        "role": "Data Analyst",
        "location": "Hyderabad, India",
        "date": "2026-07-18",
        "time": "10:00 AM",
        "status": "open",
        "venue": "Placement Cell",
        "about": "Microsoft is hiring for Data Analyst.",
        "targetStudent": "All"
    },
    {
        "id": 3,
        "company": "Infosys",
        "logo": "https://logo.clearbit.com/infosys.com",
        "role": "SDE Intern",
        "location": "Pune, India",
        "date": "2026-07-15",
        "time": "10:00 AM",
        "status": "open",
        "venue": "Placement Cell",
        "about": "Infosys is hiring for SDE Intern.",
        "targetStudent": "All"
    }
]

drafts_db = [
    {
        "id": 1,
        "title": "UX Designer Intern",
        "company": "Amazon",
        "location": "Bangalore",
        "requirements": "Figma, UI Prototyping, User Research",
        "degree": "B.Tech / Any",
        "branch": "Any",
        "cgpa": 6.0,
        "year": "2026",
        "experience": "Fresher",
        "deadline": "2026-08-01",
        "lastSaved": "2 hours ago"
    },
    {
        "id": 2,
        "title": "Graduate Engineer",
        "company": "TCS",
        "location": "Mumbai",
        "requirements": "C++, Java, Basic Networking",
        "degree": "B.Tech",
        "branch": "Circuit Branches",
        "cgpa": 6.5,
        "year": "2026",
        "experience": "Fresher",
        "deadline": "2026-08-10",
        "lastSaved": "1 day ago"
    }
]

applicants_db = [
    {
        "id": 1,
        "name": "Priya Sharma",
        "company": "Google",
        "degree": "B.Tech",
        "branch": "Computer Science",
        "cgpa": 8.23,
        "year": "2026 Passout",
        "match": 90,
        "date": "2026-07-05"
    },
    {
        "id": 2,
        "name": "John Doe",
        "company": "Microsoft",
        "degree": "B.Tech",
        "branch": "Information Technology",
        "cgpa": 7.5,
        "year": "2026 Passout",
        "match": 80,
        "date": "2026-07-02"
    },
    {
        "id": 3,
        "name": "Amit Kumar",
        "company": "Infosys",
        "degree": "B.Tech",
        "branch": "Computer Science",
        "cgpa": 7.8,
        "year": "2026 Passout",
        "match": 75,
        "date": "2026-07-06"
    }
]

notifications_db = [
    {"id": 1, "text": "Amit Kumar applied for Google!", "date": "Today"},
    {"id": 2, "text": "New student registration: John Doe", "date": "Yesterday"},
    {"id": 3, "text": "Placement posting 'UX Designer Intern' saved as draft.", "date": "2 days ago"}
]

student_applications_db = [
    {
        "id": 1,
        "jobId": 1,
        "company": "Google",
        "role": "Software Developer Intern",
        "studentEmail": "student@college.edu",
        "studentName": "Rahul Patil",
        "resumeFileName": "Rahul_Patil_Resume.pdf",
        "status": "Selected",
        "date": "2026-07-01"
    },
    {
        "id": 2,
        "jobId": 2,
        "company": "Microsoft",
        "role": "Data Analyst",
        "studentEmail": "student@college.edu",
        "studentName": "Rahul Patil",
        "resumeFileName": "Rahul_Patil_Resume.pdf",
        "status": "Pending",
        "date": "2026-07-03"
    },
    {
        "id": 3,
        "jobId": 3,
        "company": "Infosys",
        "role": "SDE Intern",
        "studentEmail": "student@college.edu",
        "studentName": "Rahul Patil",
        "resumeFileName": "Rahul_Patil_Resume.pdf",
        "status": "Rejected",
        "date": "2026-06-25"
    }
]

student_notifications_db = [
    {"id": 1, "text": "Google application deadline is tomorrow!", "date": "Today"},
    {"id": 2, "text": "Your resume match score for IBM is 75%.", "date": "Yesterday"},
    {"id": 3, "text": "New Job opening: Systems Engineer at Infosys.", "date": "2 days ago"}
]

admin_profiles_db = {
    "saurabh@gmail.com": {
        "name": "Saurabh (Admin)",
        "email": "saurabh@gmail.com",
        "phone": "+91 9876543210",
        "role": "System Administrator"
    },
    "admin@college.edu": {
        "name": "Administrator",
        "email": "admin@college.edu",
        "phone": "+91 9876543211",
        "role": "System Administrator"
    }
}

analytics_department_data = [
    {"label": "Computer Science", "count": 180, "percentage": 36, "color": "#1e3a6e"},
    {"label": "Information Technology", "count": 110, "percentage": 22, "color": "#6c8dd6"},
    {"label": "BCA", "count": 60, "percentage": 12, "color": "#06b6d4"},
    {"label": "MCA", "count": 40, "percentage": 8, "color": "#a5b4fc"},
    {"label": "Others", "count": 110, "percentage": 22, "color": "#e2e8f0"}
]

analytics_cgpa_data = [
    {"range": "<6", "students": 7},
    {"range": "6 - 7", "students": 15},
    {"range": "7 - 8", "students": 23},
    {"range": "8 - 9", "students": 28},
    {"range": "9 - 10", "students": 32}
]

analytics_skills_data = [
    {"skill": "Java", "percentage": 62, "color": "#1e3a6e"},
    {"skill": "Python", "percentage": 58, "color": "#3b82f6"},
    {"skill": "SQL", "percentage": 40, "color": "#8b5cf6"},
    {"skill": "PHP", "percentage": 32, "color": "#06b6d4"},
    {"skill": "React", "percentage": 16, "color": "#f59e0b"},
    {"skill": "C++", "percentage": 13, "color": "#10b981"},
    {"skill": "C", "percentage": 8, "color": "#f43f5e"}
]

analytics_top_students = [
    {
        "rank": 1, "name": "Priya Sharma", "initials": "PS", "branch": "CS", "passingYear": "2026", "cgpa": "9.4",
        "lpa": "28", "skill": "Full Stack", "skillColor": "#f3e8ff",
        "skillTextColor": "#a855f7", "company": "Amazon", "companyColor": "#c2410c"
    },
    {
        "rank": 2, "name": "Rahul Desai", "initials": "RD", "branch": "IT", "passingYear": "2025",
        "cgpa": "9.1", "lpa": "22", "skill": "Data Science",
        "skillColor": "#dbeafe", "skillTextColor": "#2563eb",
        "company": "Microsoft", "companyColor": "#4f5e7b"
    },
    {
        "rank": 3, "name": "Sneha Kulkarni", "initials": "SK", "branch": "BCA", "passingYear": "2026",
        "cgpa": "8.8", "lpa": "18", "skill": "Backend",
        "skillColor": "#dcfce7", "skillTextColor": "#16a34a",
        "company": "Apple", "companyColor": "#1e293b"
    },
    {
        "rank": 4, "name": "Aarav Mehta", "initials": "AM", "branch": "CS", "passingYear": "2025",
        "cgpa": "8.5", "lpa": "14", "skill": "Cooking",
        "skillColor": "#ecfeff", "skillTextColor": "#0891b2",
        "company": "Suresh Tea House", "companyColor": "#475569"
    },
    {
        "rank": 5, "name": "Diya Jadav", "initials": "DJ", "branch": "IT", "passingYear": "2026",
        "cgpa": "8.4", "lpa": "12", "skill": "React Native",
        "skillColor": "#f3e8ff", "skillTextColor": "#a855f7",
        "company": "Microsoft", "companyColor": "#4f5e7b"
    },
    {
        "rank": 6, "name": "Harsh Patil", "initials": "HP", "branch": "BCA", "passingYear": "2025",
        "cgpa": "8.2", "lpa": "10", "skill": "Backend",
        "skillColor": "#dcfce7", "skillTextColor": "#16a34a",
        "company": "Amazon", "companyColor": "#c2410c"
    },
    {
        "rank": 7, "name": "Neha Shah", "initials": "NS", "branch": "CS", "passingYear": "2026",
        "cgpa": "8.0", "lpa": "8", "skill": "Data Science",
        "skillColor": "#dbeafe", "skillTextColor": "#2563eb",
        "company": "Apple", "companyColor": "#1e293b"
    },
    {
        "rank": 8, "name": "Karan Malhotra", "initials": "KM", "branch": "IT", "passingYear": "2025",
        "cgpa": "7.8", "lpa": "7", "skill": "Cloud",
        "skillColor": "#ecfeff", "skillTextColor": "#0891b2",
        "company": "Suresh Tea House", "companyColor": "#475569"
    }
]

queries_db = [
    {
        "id": 1,
        "name": "Rahul Patil",
        "course": "B.Sc Computer Science",
        "avatar": "RP",
        "colorClass": "blue",
        "title": "Resume not uploading",
        "message": "I am unable to upload my resume. It shows error please help me resolve this issue.",
        "date": "2 May 2026",
        "status": "resolved",
        "reply": "Please clear your browser cache and upload a PDF under 5MB. Contact support if it persists."
    },
    {
        "id": 2,
        "name": "Sneha Jadhav",
        "course": "BCA",
        "avatar": "SJ",
        "colorClass": "purple",
        "title": "Profile strength calculation",
        "message": "How is profile strength calculated? I want to improve my score.",
        "date": "1 May 2026",
        "status": "resolved",
        "reply": "Profile strength score increases as you fill in your academic details, skills, and upload a verified resume."
    },
    {
        "id": 3,
        "name": "Aditya More",
        "course": "B.Sc IT",
        "avatar": "AM",
        "colorClass": "green",
        "title": "TCS Drive Eligibility",
        "message": "Am I eligible for the TCS drive? Please confirm my eligibility.",
        "date": "30 Apr 2026",
        "status": "resolved",
        "reply": "Yes, all B.Sc IT students with aggregate CGPA above 6.0 are eligible for the TCS drive."
    }
]

stories_db = [
    {
        "id": 1,
        "name": "Nithisha Yadav",
        "avatar": "https://randomuser.me/api/portraits/women/68.jpg",
        "company": "Thoughtworks",
        "companyColor": "#f3e8ff",
        "companyTextColor": "#8b5cf6",
        "role": "Software Engineer",
        "packageAmt": "8.5 LPA",
        "storyText": "Secured a Software Engineer role at Thoughtworks. The preparation drives helped me refine my technical skills.",
        "date": "10 Apr 2026"
    }
]

def init_db():
    """Initializes tables in the connected database (PostgreSQL or SQLite) and seeds data if empty."""
    import models
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Seed Users
        if db.query(models.UserModel).count() == 0:
            for email, pwd in credentials_db.items():
                is_admin = "admin" in email or "saurabh" in email
                role = "admin" if is_admin else "student"
                name = admin_profiles_db.get(email, {}).get("name", "Student User")
                phone = admin_profiles_db.get(email, {}).get("phone", "+91 9876543210")
                user = models.UserModel(
                    full_name=name,
                    email=email,
                    password=pwd,
                    mobile=phone,
                    role=role,
                    current_year=2026,
                    cgpa=8.5 if role == "student" else 0.0
                )
                db.add(user)

        # 2. Seed Jobs
        if db.query(models.JobModel).count() == 0:
            for j in jobs_db:
                db.add(models.JobModel(
                    id=j["id"],
                    title=j["title"],
                    company=j["company"],
                    status=j.get("status", "Active"),
                    date=j.get("date"),
                    deadline=j.get("deadline"),
                    logo_url=j.get("logoUrl"),
                    location=j.get("location"),
                    requirements=j.get("requirements"),
                    degree=j.get("degree"),
                    branch=j.get("branch"),
                    cgpa=float(j.get("cgpa", 6.0)),
                    year=str(j.get("year", "2026")),
                    experience=j.get("experience", "Fresher")
                ))

        # 3. Seed Placement Drives
        if db.query(models.PlacementDriveModel).count() == 0:
            for d in placement_drives_db:
                db.add(models.PlacementDriveModel(
                    id=d["id"],
                    company=d["company"],
                    logo=d.get("logo"),
                    role=d["role"],
                    location=d.get("location"),
                    date=d.get("date"),
                    time=d.get("time", "10:00 AM"),
                    status=d.get("status", "open"),
                    venue=d.get("venue", "Placement Cell"),
                    about=d.get("about"),
                    target_student=d.get("targetStudent", "All")
                ))

        # 4. Seed Draft Jobs
        if db.query(models.DraftJobModel).count() == 0:
            for df in drafts_db:
                db.add(models.DraftJobModel(
                    id=df["id"],
                    title=df["title"],
                    company=df["company"],
                    location=df.get("location"),
                    requirements=df.get("requirements"),
                    degree=df.get("degree"),
                    branch=df.get("branch"),
                    cgpa=float(df.get("cgpa", 6.0)),
                    year=str(df.get("year", "2026")),
                    experience=df.get("experience", "Fresher"),
                    deadline=df.get("deadline"),
                    last_saved=df.get("lastSaved", "Just now")
                ))

        # 5. Seed Applicants
        if db.query(models.ApplicantModel).count() == 0:
            for a in applicants_db:
                db.add(models.ApplicantModel(
                    id=a["id"],
                    name=a["name"],
                    company=a["company"],
                    degree=a.get("degree", "B.Tech"),
                    branch=a.get("branch", "Computer Science"),
                    cgpa=float(a.get("cgpa", 7.5)),
                    year=a.get("year", "2026 Passout"),
                    match=int(a.get("match", 80)),
                    date=a.get("date")
                ))

        # 6. Seed Student Applications
        if db.query(models.StudentApplicationModel).count() == 0:
            for sa in student_applications_db:
                db.add(models.StudentApplicationModel(
                    id=sa["id"],
                    job_id=sa.get("jobId"),
                    company=sa["company"],
                    role=sa["role"],
                    student_email=sa.get("studentEmail", "student@college.edu"),
                    student_name=sa.get("studentName", "Rahul Patil"),
                    resume_file_name=sa.get("resumeFileName", "Rahul_Resume.pdf"),
                    status=sa.get("status", "Pending"),
                    date=sa.get("date")
                ))

        # 7. Seed Notifications
        if db.query(models.NotificationModel).count() == 0:
            for n in notifications_db:
                db.add(models.NotificationModel(text=n["text"], date=n.get("date", "Today"), target_role="admin"))
            for sn in student_notifications_db:
                db.add(models.NotificationModel(text=sn["text"], date=sn.get("date", "Today"), target_role="student"))

        # 8. Seed Queries
        if db.query(models.StudentQueryModel).count() == 0:
            for q in queries_db:
                db.add(models.StudentQueryModel(
                    id=q["id"],
                    name=q["name"],
                    course=q.get("course"),
                    avatar=q.get("avatar", "RP"),
                    color_class=q.get("colorClass", "blue"),
                    title=q["title"],
                    message=q["message"],
                    date=q.get("date"),
                    status=q.get("status", "resolved"),
                    reply=q.get("reply")
                ))

        # 9. Seed Stories
        if db.query(models.SuccessStoryModel).count() == 0:
            for s in stories_db:
                db.add(models.SuccessStoryModel(
                    id=s["id"],
                    name=s["name"],
                    avatar=s.get("avatar"),
                    company=s["company"],
                    company_color=s.get("companyColor"),
                    company_text_color=s.get("companyTextColor"),
                    role=s["role"],
                    package_amt=s.get("packageAmt"),
                    story_text=s["storyText"],
                    date=s.get("date")
                ))

        # 10. Seed Analytics Data
        if db.query(models.DepartmentStatModel).count() == 0:
            for dep in analytics_department_data:
                db.add(models.DepartmentStatModel(label=dep["label"], count=dep["count"], percentage=dep["percentage"], color=dep["color"]))
            for cg in analytics_cgpa_data:
                db.add(models.CgpaStatModel(range_label=cg["range"], students=cg["students"]))
            for sk in analytics_skills_data:
                db.add(models.SkillStatModel(skill=sk["skill"], percentage=sk["percentage"], color=sk["color"]))
            for ts in analytics_top_students:
                db.add(models.TopStudentModel(
                    rank=ts["rank"],
                    name=ts["name"],
                    initials=ts["initials"],
                    branch=ts["branch"],
                    passing_year=ts["passingYear"],
                    cgpa=ts["cgpa"],
                    lpa=ts["lpa"],
                    skill=ts["skill"],
                    skill_color=ts["skillColor"],
                    skill_text_color=ts["skillTextColor"],
                    company=ts["company"],
                    company_color=ts["companyColor"]
                ))

        if active_db_type == "postgresql":
            from sqlalchemy import text
            tables = ['jobs', 'placement_drives', 'draft_jobs', 'applicants', 'student_applications', 'notifications', 'student_queries', 'success_stories', 'users']
            for t in tables:
                try:
                    db.execute(text(f"SELECT setval(pg_get_serial_sequence('{t}', 'id'), COALESCE((SELECT MAX(id) FROM {t}), 0) + 1, false);"))
                except Exception as seq_err:
                    print(f"Sequence sync note for {t}: {seq_err}")

        db.commit()
    except Exception as err:
        db.rollback()
        print(f"[!] Warning during DB seed: {err}")
    finally:
        db.close()
