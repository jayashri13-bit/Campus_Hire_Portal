from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    mobile = Column(String(30), nullable=True)
    dob = Column(String(30), nullable=True)
    department = Column(String(100), nullable=True)
    course = Column(String(100), nullable=True)
    current_year = Column(Integer, default=2026)
    cgpa = Column(Float, default=0.0)
    role = Column(String(30), default="student", nullable=False) # "student", "admin"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class JobModel(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    company = Column(String(150), nullable=False)
    status = Column(String(50), default="Active")
    date = Column(String(50), nullable=True)
    deadline = Column(String(50), nullable=True)
    logo_url = Column(String(500), nullable=True)
    location = Column(String(150), nullable=True)
    requirements = Column(Text, nullable=True)
    degree = Column(String(100), nullable=True)
    branch = Column(String(100), nullable=True)
    cgpa = Column(Float, default=6.0)
    year = Column(String(50), default="2026")
    experience = Column(String(50), default="Fresher")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PlacementDriveModel(Base):
    __tablename__ = "placement_drives"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company = Column(String(150), nullable=False)
    logo = Column(String(500), nullable=True)
    role = Column(String(200), nullable=False)
    location = Column(String(150), nullable=True)
    date = Column(String(50), nullable=True)
    time = Column(String(50), default="10:00 AM")
    status = Column(String(50), default="open")
    venue = Column(String(200), default="Placement Cell")
    about = Column(Text, nullable=True)
    target_student = Column(String(100), default="All")

class DraftJobModel(Base):
    __tablename__ = "draft_jobs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    company = Column(String(150), nullable=False)
    location = Column(String(150), nullable=True)
    requirements = Column(Text, nullable=True)
    degree = Column(String(100), nullable=True)
    branch = Column(String(100), nullable=True)
    cgpa = Column(Float, default=6.0)
    year = Column(String(50), default="2026")
    experience = Column(String(50), default="Fresher")
    deadline = Column(String(50), nullable=True)
    last_saved = Column(String(50), default="Just now")

class ApplicantModel(Base):
    __tablename__ = "applicants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    company = Column(String(150), nullable=False)
    degree = Column(String(100), default="B.Tech")
    branch = Column(String(100), default="Computer Science")
    cgpa = Column(Float, default=7.5)
    year = Column(String(50), default="2026 Passout")
    match = Column(Integer, default=80)
    date = Column(String(50), nullable=True)

class StudentApplicationModel(Base):
    __tablename__ = "student_applications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    job_id = Column(Integer, nullable=True)
    company = Column(String(150), nullable=False)
    role = Column(String(200), nullable=False)
    student_email = Column(String(150), nullable=False, index=True)
    student_name = Column(String(150), nullable=False)
    resume_file_name = Column(String(255), nullable=True)
    status = Column(String(50), default="Pending") # "Pending", "Selected", "Rejected"
    date = Column(String(50), nullable=True)

class NotificationModel(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    text = Column(Text, nullable=False)
    date = Column(String(50), default="Today")
    target_role = Column(String(30), default="admin") # "admin", "student", "all"

class StudentQueryModel(Base):
    __tablename__ = "student_queries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    course = Column(String(100), default="B.Sc Computer Science")
    avatar = Column(String(20), default="SP")
    color_class = Column(String(30), default="blue")
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    date = Column(String(50), default="Today")
    status = Column(String(30), default="resolved") # "pending", "resolved"
    reply = Column(Text, nullable=True)

class SuccessStoryModel(Base):
    __tablename__ = "success_stories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    avatar = Column(String(500), nullable=True)
    company = Column(String(150), nullable=False)
    company_color = Column(String(50), default="#f3e8ff")
    company_text_color = Column(String(50), default="#8b5cf6")
    role = Column(String(150), nullable=False)
    package_amt = Column(String(50), default="8.5 LPA")
    story_text = Column(Text, nullable=False)
    date = Column(String(50), default="Today")

class DepartmentStatModel(Base):
    __tablename__ = "analytics_departments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    label = Column(String(100), nullable=False)
    count = Column(Integer, default=0)
    percentage = Column(Integer, default=0)
    color = Column(String(30), default="#1e3a6e")

class CgpaStatModel(Base):
    __tablename__ = "analytics_cgpa"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    range_label = Column(String(50), nullable=False)
    students = Column(Integer, default=0)

class SkillStatModel(Base):
    __tablename__ = "analytics_skills"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    skill = Column(String(100), nullable=False)
    percentage = Column(Integer, default=0)
    color = Column(String(30), default="#1e3a6e")

class TopStudentModel(Base):
    __tablename__ = "analytics_top_students"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    rank = Column(Integer, nullable=False)
    name = Column(String(150), nullable=False)
    initials = Column(String(10), default="ST")
    branch = Column(String(50), default="CS")
    passing_year = Column(String(20), default="2026")
    cgpa = Column(String(20), default="9.0")
    lpa = Column(String(20), default="15")
    skill = Column(String(100), default="Full Stack")
    skill_color = Column(String(30), default="#f3e8ff")
    skill_text_color = Column(String(30), default="#a855f7")
    company = Column(String(100), default="Amazon")
    company_color = Column(String(30), default="#c2410c")

