from fastapi import APIRouter, HTTPException
import time
from database import users_db, credentials_db, SessionLocal
from models import UserModel
from schemas import StudentRegister, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest

router = APIRouter(prefix="/api/auth", tags=["Feature: Authentication & Security"])

@router.post("/register")
def register_student(data: StudentRegister):
    email_key = data.email.strip().lower()
    
    db = SessionLocal()
    try:
        existing = db.query(UserModel).filter(UserModel.email == email_key).first()
        if existing or email_key in users_db:
            raise HTTPException(status_code=400, detail="User already registered with this email address")

        if data.confirmPassword and data.password != data.confirmPassword:
            raise HTTPException(status_code=400, detail="Password and Confirm Password do not match")

        student_name = data.fullName or data.fullname or "Student"
        year_val = data.currentYear or data.year or 2026

        new_user = UserModel(
            full_name=student_name,
            email=email_key,
            password=data.password,
            mobile=data.mobile,
            dob=data.dob,
            department=data.department,
            course=data.course,
            current_year=year_val,
            cgpa=float(data.cgpa or 0.0),
            role="student"
        )
        db.add(new_user)
        db.commit()
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[!] Warning user register: {e}")
    finally:
        db.close()

    user_data = data.model_dump() if hasattr(data, "model_dump") else data.dict()
    user_data["fullName"] = student_name
    users_db[email_key] = user_data
    credentials_db[email_key] = data.password

    token = f"jwt-student-{int(time.time())}"
    return {
        "status": "success",
        "message": "Registration completed successfully!",
        "token": token,
        "role": "student",
        "user": {
            "fullName": student_name,
            "email": data.email.strip(),
            "phone": data.mobile,
            "dob": data.dob,
            "branch": data.department,
            "course": data.course,
            "currentYear": year_val,
            "cgpa": data.cgpa,
            "role": "student"
        }
    }

@router.post("/login")
def login_user(data: LoginRequest):
    email_key = data.email.strip().lower()

    if data.confirmPassword and data.password != data.confirmPassword:
        raise HTTPException(status_code=400, detail="Password and Confirm Password do not match")

    is_admin = (
        email_key == "saurabh@gmail.com"
        or email_key.startswith("admin")
        or "@admin." in email_key
        or ".admin" in email_key
    )
    role = "admin" if is_admin else "student"

    # Master Admin Credentials Check for saurabh@gmail.com
    if email_key == "saurabh@gmail.com":
        accepted = {"Saurabh@123", "saurabh@123", credentials_db.get(email_key)}
        if data.password.strip() not in accepted and data.password not in accepted:
            raise HTTPException(status_code=401, detail="Invalid admin password. Default password is Saurabh@123")
    elif email_key in credentials_db and credentials_db[email_key] != data.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    session_prefix = "jwt-persistent" if data.rememberMe else "jwt-session"
    token = f"{session_prefix}-{int(time.time())}"

    matched_user = users_db.get(email_key)
    name_from_email = email_key.split("@")[0].capitalize()
    full_name = (
        "Saurabh (Admin)" if email_key == "saurabh@gmail.com"
        else ("Administrator" if is_admin else (matched_user.get("fullName") if matched_user else name_from_email))
    )

    return {
        "status": "success",
        "message": "Login successful!",
        "token": token,
        "role": role,
        "rememberMe": data.rememberMe,
        "user": {
            "fullName": full_name,
            "email": data.email.strip(),
            "role": role,
            "phone": matched_user.get("mobile", "+91 9876543210") if matched_user else "+91 9876543210",
            "branch": matched_user.get("department", "Computer Science") if matched_user else "Computer Science",
            "cgpa": matched_user.get("cgpa", 8.0) if matched_user else 8.0
        }
    }

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    email_key = data.email.strip().lower()
    if not email_key or "@" not in email_key:
        raise HTTPException(status_code=400, detail="Please provide a valid email address")

    return {
        "status": "success",
        "message": f"Reset link and instructions successfully dispatched to {data.email}!"
    }

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest):
    email_key = data.email.strip().lower()

    if data.confirmPassword and data.newPassword != data.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    credentials_db[email_key] = data.newPassword
    if email_key in users_db:
        users_db[email_key]["password"] = data.newPassword

    return {
        "status": "success",
        "message": "Password reset successfully!"
    }

