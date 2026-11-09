from pydantic import BaseModel
from typing import Optional, Any, Dict

class StudentRegister(BaseModel):
    fullName: Optional[str] = None
    fullname: Optional[str] = None
    email: str
    mobile: str
    dob: Optional[str] = None
    department: str
    course: str
    currentYear: Optional[int] = None
    year: Optional[int] = None
    cgpa: float
    password: str
    confirmPassword: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str
    confirmPassword: Optional[str] = None
    rememberMe: Optional[bool] = False

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    newPassword: str
    confirmPassword: Optional[str] = None

class JobCreate(BaseModel):
    companyName: Optional[str] = None
    company: Optional[str] = None
    jobRoleOverview: Optional[str] = None
    title: Optional[str] = None
    jobRequirements: Optional[str] = None
    requirements: Optional[str] = None
    location: Optional[str] = "Remote"
    degree: Optional[str] = "B.Tech"
    branch: Optional[str] = "Computer Science"
    minCgpa: Optional[Any] = 0.0
    cgpa: Optional[Any] = 0.0
    passingYear: Optional[str] = "2026"
    year: Optional[str] = "2026"
    experience: Optional[str] = "Fresher"
    deadline: Optional[str] = "2026-07-20"

class ApplicantCreate(BaseModel):
    name: str
    company: str
    degree: Optional[str] = "B.Tech"
    branch: Optional[str] = "Computer Science"
    cgpa: Optional[float] = 8.0
    year: Optional[str] = "2026 Passout"
    match: Optional[int] = 85
    date: Optional[str] = None

class NotificationCreate(BaseModel):
    text: str
    date: Optional[str] = "Today"

class AdminProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = "System Administrator"

class AdminChangePassword(BaseModel):
    email: str
    currentPassword: str
    newPassword: str
    confirmPassword: Optional[str] = None

class QueryReply(BaseModel):
    reply: str

class QueryCreate(BaseModel):
    name: str
    course: Optional[str] = "B.Sc Computer Science"
    avatar: Optional[str] = "ST"
    colorClass: Optional[str] = "blue"
    title: str
    message: str
    date: Optional[str] = None
    status: Optional[str] = "pending"
    reply: Optional[str] = None

class DriveCreate(BaseModel):
    company: str
    role: str
    location: Optional[str] = "Campus"
    date: Optional[str] = "2026-07-20"
    time: Optional[str] = "10:00 AM"
    venue: Optional[str] = "Seminar Hall A"
    status: Optional[str] = "open"
    about: Optional[str] = None
    targetStudent: Optional[str] = "All"
    logo: Optional[str] = None

class DriveUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    location: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    venue: Optional[str] = None
    status: Optional[str] = None
    about: Optional[str] = None
    targetStudent: Optional[str] = None
    logo: Optional[str] = None

class StoryCreate(BaseModel):
    name: str
    company: str
    role: str
    packageAmt: str
    storyText: str
    avatar: Optional[str] = None
    date: Optional[str] = "Today"

class TopStudentCreate(BaseModel):
    name: str
    branch: str
    passingYear: str
    cgpa: Any
    lpa: Any
    company: str
    skill: Optional[str] = "Software Eng"
    initials: Optional[str] = None
    skillColor: Optional[str] = None
    skillTextColor: Optional[str] = None
    companyColor: Optional[str] = None
    rank: Optional[int] = None

class StudentProfileUpdate(BaseModel):
    fullName: Optional[str] = None
    email: str
    phone: Optional[str] = None
    branch: Optional[str] = None
    passingYear: Optional[str] = None
    cgpa: Optional[Any] = None
    skills: Optional[str] = None
    linkedinUrl: Optional[str] = None
    githubUrl: Optional[str] = None

class StudentChangePassword(BaseModel):
    email: str
    currentPassword: str
    newPassword: str
    confirmPassword: Optional[str] = None

class StudentApplicationCreate(BaseModel):
    jobId: int
    company: str
    role: str
    studentEmail: str
    studentName: str
    resumeFileName: Optional[str] = "resume.pdf"
    status: Optional[str] = "Pending"
    date: Optional[str] = None

class StudentHubQueryCreate(BaseModel):
    subject: str
    message: str
    studentName: Optional[str] = "Student"
    studentEmail: Optional[str] = None
    course: Optional[str] = "B.Tech CSE"


