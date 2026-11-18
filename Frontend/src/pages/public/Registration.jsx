import React, { useState, useEffect, useRef } from "react";
import './Registration.css';
import { apiRegister } from '../../api/authApi';
import {
    GraduationCap,
    ArrowLeft,
    User,
    Mail,
    Phone,
    Calendar,
    BookOpen,
    GraduationCap as CourseIcon,
    Award,
    Lock,
    ArrowRight,
    Building2,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Briefcase,
    FileText
} from "lucide-react";


function Registration({ onNavigate }) {
    // Component state to track all form field values
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        mobile: '',
        dob: '',
        department: '',
        course: '',
        year: '',
        cgpa: '',
        password: '',
        confirmPassword: ''
    });

    // Validation errors state tracking
    const [errors, setErrors] = useState({});

    // Toast notification states
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    // DOB Custom Calendar states
    const [isDobPickerOpen, setIsDobPickerOpen] = useState(false);
    const [dobCalDate, setDobCalDate] = useState(new Date(2004, 0, 1)); // Default view around standard student age (2004)
    const dobDatePickerRef = useRef(null);

    const handleDobPrevMonth = () => {
        setDobCalDate(new Date(dobCalDate.getFullYear(), dobCalDate.getMonth() - 1, 1));
    };

    const handleDobNextMonth = () => {
        setDobCalDate(new Date(dobCalDate.getFullYear(), dobCalDate.getMonth() + 1, 1));
    };

    const dobTotalDays = new Date(dobCalDate.getFullYear(), dobCalDate.getMonth() + 1, 0).getDate();
    const dobFirstDayIndex = new Date(dobCalDate.getFullYear(), dobCalDate.getMonth(), 1).getDay();

    // Click away to close calendar picker
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dobDatePickerRef.current && !dobDatePickerRef.current.contains(event.target)) {
                setIsDobPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const formatDOBDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    };

    // Validate a single field and return its error message
    const validateField = (name, value) => {
        let errorMsg = '';
        switch (name) {
            case 'fullname':
                if (!value.trim()) {
                    errorMsg = 'Full name is required';
                } else if (value.trim().length < 3) {
                    errorMsg = 'Name must be at least 3 characters';
                } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                    errorMsg = 'Name can only contain letters and spaces';
                }
                break;
            case 'email':
                if (!value) {
                    errorMsg = 'Email address is required';
                } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
                    errorMsg = 'Please enter a valid email address';
                }
                break;
            case 'mobile':
                if (!value) {
                    errorMsg = 'Mobile number is required';
                } else if (!/^[0-9]{10}$/.test(value)) {
                    errorMsg = 'Mobile number must be exactly 10 digits';
                }
                break;
            case 'dob':
                if (!value) {
                    errorMsg = 'Date of Birth is required';
                } else {
                    const dobDate = new Date(value);
                    const today = new Date();
                    let age = today.getFullYear() - dobDate.getFullYear();
                    const m = today.getMonth() - dobDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
                        age--;
                    }
                    if (dobDate > today) {
                        errorMsg = 'Date of Birth cannot be in the future';
                    } else if (age < 15) {
                        errorMsg = 'You must be at least 15 years old to register';
                    }
                }
                break;
            case 'department':
                if (!value) {
                    errorMsg = 'Please select your department';
                }
                break;
            case 'course':
                if (!value) {
                    errorMsg = 'Please select your course';
                }
                break;
            case 'year':
                if (!value) {
                    errorMsg = 'Please select your current year';
                }
                break;
            case 'cgpa':
                if (!value) {
                    errorMsg = 'CGPA is required';
                } else {
                    const num = parseFloat(value);
                    if (isNaN(num) || num < 0 || num > 10) {
                        errorMsg = 'CGPA must be a number between 0.00 and 10.00';
                    }
                }
                break;
            case 'password':
                if (!value) {
                    errorMsg = 'Password is required';
                } else if (value.length < 8) {
                    errorMsg = 'Password must be at least 8 characters long';
                } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(value)) {
                    errorMsg = 'Must include uppercase, lowercase, number, and special character';
                }
                break;
            case 'confirmPassword':
                if (!value) {
                    errorMsg = 'Please confirm your password';
                } else if (value !== formData.password) {
                    errorMsg = 'Passwords do not match';
                }
                break;
            default:
                break;
        }
        return errorMsg;
    };

    // Event handler for form input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => ({
            ...prev,
            [name]: val
        }));

        // Validate on-the-fly and update error state
        const errorMsg = validateField(name, val);
        setErrors(prev => ({
            ...prev,
            [name]: errorMsg
        }));
    };

    // Event handler for form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Run validation across all fields
        const tempErrors = {};
        Object.keys(formData).forEach(key => {
            const errorMsg = validateField(key, formData[key]);
            if (errorMsg) {
                tempErrors[key] = errorMsg;
            }
        });

        setErrors(tempErrors);

        // Halt form submission if errors exist
        if (Object.keys(tempErrors).length > 0) {
            // Trigger toast if password and confirm password fields are not identical
            if (formData.password !== formData.confirmPassword) {
                setToastMessage("Passwords do not match");
                setToastType('error');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            }
            const firstErrorField = Object.keys(tempErrors)[0];
            const inputElement = document.getElementsByName(firstErrorField)[0];
            if (inputElement) {
                inputElement.focus();
            }
            return;
        }


        // Payload formatted for Python FastAPI backend
        const registrationPayload = {
            fullName: formData.fullname,
            email: formData.email.trim(),
            mobile: formData.mobile,
            dob: formData.dob || null,
            department: formData.department,
            course: formData.course,
            currentYear: Number(formData.year) || 2026,
            cgpa: Number(formData.cgpa) || 0.0,
            password: formData.password,
            confirmPassword: formData.confirmPassword
        };

        try {
            // Call Python FastAPI register endpoint
            const res = await apiRegister(registrationPayload);
            const token = res.token || `jwt-token-${Date.now()}`;
            localStorage.setItem("token", token);
            localStorage.setItem("role", "student");

            const studentProfile = {
                fullName: formData.fullname,
                email: formData.email.trim(),
                phone: formData.mobile,
                branch: formData.department,
                course: formData.course,
                passingYear: formData.year,
                cgpa: formData.cgpa,
                role: "student",
                skills: "React, JavaScript, CSS, Node.js, Python",
                linkedinUrl: `https://linkedin.com/in/${formData.fullname.toLowerCase().replace(/\s+/g, '-')}`,
                githubUrl: `https://github.com/${formData.fullname.toLowerCase().replace(/\s+/g, '')}`
            };
            localStorage.setItem("user", JSON.stringify(studentProfile));

            const registeredProfiles = JSON.parse(localStorage.getItem("registered_profiles") || "[]");
            const updatedProfiles = registeredProfiles.filter(p => p.email.toLowerCase() !== formData.email.toLowerCase());
            updatedProfiles.push(studentProfile);
            localStorage.setItem("registered_profiles", JSON.stringify(updatedProfiles));

            const savedCreds = JSON.parse(localStorage.getItem("saved_credentials") || "{}");
            savedCreds[formData.email.trim().toLowerCase()] = formData.password;
            localStorage.setItem("saved_credentials", JSON.stringify(savedCreds));

            setToastMessage(res.message || "Registration completed successfully!");
            setToastType("success");
            setShowToast(true);

            setTimeout(() => {
                setShowToast(false);
                onNavigate("student");
            }, 1500);

        } catch (err) {
            console.warn("API Registration error, evaluating fallback:", err);

            // If backend is offline ("Failed to fetch"), proceed with local registration fallback
            if (err.message && err.message.includes("fetch")) {
                const token = `jwt-offline-${Date.now()}`;
                localStorage.setItem("token", token);
                localStorage.setItem("role", "student");

                const studentProfile = {
                    fullName: formData.fullname,
                    email: formData.email.trim(),
                    phone: formData.mobile,
                    branch: formData.department,
                    course: formData.course,
                    passingYear: formData.year,
                    cgpa: formData.cgpa,
                    role: "student",
                    skills: "React, JavaScript, CSS, Node.js, Python",
                    linkedinUrl: `https://linkedin.com/in/${formData.fullname.toLowerCase().replace(/\s+/g, '-')}`,
                    githubUrl: `https://github.com/${formData.fullname.toLowerCase().replace(/\s+/g, '')}`
                };
                localStorage.setItem("user", JSON.stringify(studentProfile));

                const registeredProfiles = JSON.parse(localStorage.getItem("registered_profiles") || "[]");
                const updatedProfiles = registeredProfiles.filter(p => p.email.toLowerCase() !== formData.email.toLowerCase());
                updatedProfiles.push(studentProfile);
                localStorage.setItem("registered_profiles", JSON.stringify(updatedProfiles));

                const savedCreds = JSON.parse(localStorage.getItem("saved_credentials") || "{}");
                savedCreds[formData.email.trim().toLowerCase()] = formData.password;
                localStorage.setItem("saved_credentials", JSON.stringify(savedCreds));

                setToastMessage("Registration completed successfully!");
                setToastType("success");
                setShowToast(true);

                setTimeout(() => {
                    setShowToast(false);
                    onNavigate("student");
                }, 1500);
                return;
            }

            setToastMessage(err.message || "Registration failed. Please try again.");
            setToastType("error");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    return (
        <div className="register-page">
            {/* BACKGROUND DECORATIVE FLOATING SHAPES */}
            <div className="bg-decorations">
                {/* Top Left Grid & Ring */}
                <div className="bg-shape shape-top-left">
                    <div className="bg-dot-grid"></div>
                    <div className="bg-ring large"></div>
                </div>

                {/* Mid Left Building Icon */}
                <div className="bg-shape shape-mid-left">
                    <Building2 className="bg-icon" size={48} />
                    <div className="bg-ring medium"></div>
                </div>

                {/* Bottom Left Document Icon */}
                <div className="bg-shape shape-bottom-left">
                    <FileText className="bg-icon" size={48} />
                    <div className="bg-ring large"></div>
                </div>

                {/* Top Right Graduation Cap Icon */}
                <div className="bg-shape shape-top-right">
                    <GraduationCap className="bg-icon" size={54} />
                    <div className="bg-ring medium"></div>
                </div>

                {/* Mid Right Briefcase Icon */}
                <div className="bg-shape shape-mid-right">
                    <Briefcase className="bg-icon" size={44} />
                    <div className="bg-ring small"></div>
                </div>

                {/* Bottom Right Grid & Ring */}
                <div className="bg-shape shape-bottom-right">
                    <div className="bg-dot-grid blue-theme"></div>
                    <div className="bg-ring large"></div>
                </div>
            </div>

            <div className="register-container">
                {/* LEFT SIDE PANEL: Branding, Mockup, Stats, Testimonial */}
                <div className="register-left">
                    {/* Application Header Logo */}
                    <div className="register-logo-section">
                        <GraduationCap className="logo-icon" size={28} />
                        <span className="college-name">College Placement Portal</span>
                    </div>

                    {/* Dashboard Glassmorphic Illustration */}
                    < div className="visual-mockup-wrapper">
                        <div className="browser-mockup">
                            {/* Browser window top header */}
                            <div className="browser-header">
                                <div className="window-controls">
                                    <span className="dot red"></span>
                                    <span className="dot yellow"></span>
                                    <span className="dot green"></span>
                                </div>
                                <div className="browser-address-bar">
                                </div>
                            </div>

                            {/*Browser Window body contents*/}
                            <div className="mockup-body">

                                {/*Top row: Profile Avatar + Main Card*/}
                                <div className="mockup-main-row">
                                    <div className="mockup-avatar-circle">
                                        <div className="avatar-head"></div>
                                        <div className="avatar-shoulders">
                                        </div>
                                    </div>
                                    <div className="mockup-main-card">
                                        <div className="card-line-blue">
                                        </div>
                                        <div className="card-line-grey">
                                        </div>
                                        <div className="card-button-blue">
                                            <div className="inner-button-line">
                                            </div>
                                        </div>

                                        <div className="floating-check-badge">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/*Bottom row: Two mini progress cards*/}
                                <div className="mockup-bottom-row">
                                    <div className="mockup-mini-card">
                                        <span className="mini-dot green-dot"></span>
                                        <div className="mini-lines">
                                            <div className="mini-line-long">
                                            </div>
                                            <div className="mini-line-short">
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mockup-mini-card">
                                        <span className="mini-dot yellow-dot"></span>
                                        <div className="mini-lines">
                                            <div className="mini-line long">
                                            </div>
                                            <div className="mini-line short">
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Branding Text */}
                    <div className="brand-text-section">
                        <h2>Launch Your Career from Campus</h2>
                        <p>Join thousands of students who landed their dream jobs through College Placement Portal</p>
                    </div>

                    {/* Stats list */}
                    <div className="brand-stats-list">
                        <div className="stat-bullet">
                            <Award size={18} />
                            <span>500+ Campus Drives Every Year</span>
                        </div>
                        <div className="stat-bullet">
                            <Building2 size={18} />
                            <span>30+ Top Recruiting Companies</span>
                        </div>
                        <div className="stat-bullet">
                            <TrendingUp size={18} />
                            <span>95% Placement Success Rate</span>
                        </div>
                        <div className="stat-bullet">
                            <CheckCircle2 size={18} />
                            <span>Real-Time Application Tracking</span>
                        </div>
                    </div>

                    {/* Left Side testimonial quote */}
                    <div className="brand-testimonial">
                        <p>"College Placement Portal helped me land my offer at Infosys within 2 weeks of registering."</p>
                        <span className="author">- John Doe, BCA Final Year, Batch 2026</span>
                    </div>
                </div>

                {/* RIGHT SIDE PANEL: Sign Up Form Area */}
                <div className="register-right">
                    {/* Back to Home Button */}
                    <button className="btn-back-home" onClick={() => onNavigate('landing')}>
                        <ArrowLeft size={16} />
                        Back to Home
                    </button>

                    <div className="form-card">
                        <div className="form-header">
                            <h2>Create Student Account</h2>
                            <p>Join the Placement Portal and start your placement journey</p>
                        </div>

                        <form onSubmit={handleSubmit} className="form-grid">
                            {/* Full Name */}
                            <div className="input-group">
                                <label>Full Name</label>
                                <div className={`input-wrapper ${errors.fullname ? 'has-error' : ''}`}>
                                    <User size={16} />
                                    <input
                                        type="text"
                                        name="fullname"
                                        placeholder="Priya Sharma"
                                        value={formData.fullname}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                {errors.fullname && <span className="error-message">{errors.fullname}</span>}
                            </div>

                            {/* Email Address */}
                            <div className="input-group">
                                <label>Email Address</label>
                                <div className={`input-wrapper ${errors.email ? 'has-error' : ''}`}>
                                    <Mail size={16} />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="priya@college.edu.in"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                {errors.email && <span className="error-message">{errors.email}</span>}
                            </div>

                            {/* Mobile Number */}
                            <div className="input-group">
                                <label>Mobile Number</label>
                                <div className={`input-wrapper ${errors.mobile ? 'has-error' : ''}`}>
                                    <Phone size={16} />
                                    <input
                                        type="tel"
                                        name="mobile"
                                        placeholder="8765443789"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                {errors.mobile && <span className="error-message">{errors.mobile}</span>}
                            </div>

                            {/* Date of Birth */}
                            <div className="input-group">
                                <label>Date of Birth (DOB)</label>
                                <div className={`input-wrapper ${errors.dob ? 'has-error' : ''}`} ref={dobDatePickerRef} style={{ position: 'relative', overflow: 'visible', border: 'none', padding: 0 }}>
                                    <div className="custom-date-picker-container" style={{ width: '100%' }}>
                                        <button
                                            type="button"
                                            className="date-picker-trigger"
                                            onClick={() => setIsDobPickerOpen(!isDobPickerOpen)}
                                            style={{ width: '100%', justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}
                                        >
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Calendar size={16} />
                                                {formData.dob ? formatDOBDate(formData.dob) : 'Select Date of Birth...'}
                                            </span>
                                        </button>

                                        {isDobPickerOpen && (
                                            <div className="custom-calendar-popup" style={{ left: 0, right: 'auto', width: '100%', minWidth: '260px' }}>
                                                <div className="calendar-header">
                                                    <button type="button" onClick={handleDobPrevMonth}>&lt;</button>
                                                    <span>
                                                        <select
                                                            value={dobCalDate.getMonth()}
                                                            onChange={(e) => setDobCalDate(new Date(dobCalDate.getFullYear(), parseInt(e.target.value), 1))}
                                                            className="calendar-select"
                                                            style={{ border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '0.8125rem', outline: 'none', cursor: 'pointer' }}
                                                        >
                                                            {[
                                                                "January", "February", "March", "April", "May", "June",
                                                                "July", "August", "September", "October", "November", "December"
                                                            ].map((m, idx) => (
                                                                <option key={m} value={idx}>{m}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            value={dobCalDate.getFullYear()}
                                                            onChange={(e) => setDobCalDate(new Date(parseInt(e.target.value), dobCalDate.getMonth(), 1))}
                                                            className="calendar-select"
                                                            style={{ border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '0.8125rem', outline: 'none', cursor: 'pointer', marginLeft: '4px' }}
                                                        >
                                                            {Array.from({ length: new Date().getFullYear() - 1980 + 1 }, (_, i) => 1980 + i).reverse().map(y => (
                                                                <option key={y} value={y}>{y}</option>
                                                            ))}
                                                        </select>
                                                    </span>
                                                    <button type="button" onClick={handleDobNextMonth}>&gt;</button>
                                                </div>
                                                <div className="calendar-weekdays">
                                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                                        <span key={d}>{d}</span>
                                                    ))}
                                                </div>
                                                <div className="calendar-days">
                                                    {/* Render empty cells for padding */}
                                                    {Array.from({ length: dobFirstDayIndex }).map((_, i) => (
                                                        <span key={`empty-${i}`} className="empty-day"></span>
                                                    ))}
                                                    {/* Render month days */}
                                                    {Array.from({ length: dobTotalDays }).map((_, i) => {
                                                        const day = i + 1;
                                                        const dateStr = `${dobCalDate.getFullYear()}-${String(dobCalDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                        const isSelected = formData.dob === dateStr;
                                                        return (
                                                            <button
                                                                type="button"
                                                                key={day}
                                                                className={`calendar-day-btn ${isSelected ? 'selected' : ''}`}
                                                                onClick={() => {
                                                                    setFormData(prev => ({ ...prev, dob: dateStr }));
                                                                    const fieldError = validateField('dob', dateStr);
                                                                    setErrors(prev => ({ ...prev, dob: fieldError }));
                                                                    setIsDobPickerOpen(false);
                                                                }}
                                                            >
                                                                {day}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <div className="calendar-footer">
                                                    <button type="button" className="calendar-clear-btn" onClick={() => { setFormData(prev => ({ ...prev, dob: '' })); const fieldError = validateField('dob', ''); setErrors(prev => ({ ...prev, dob: fieldError })); setIsDobPickerOpen(false); }}>Clear</button>
                                                    <button type="button" className="calendar-today-btn" onClick={() => {
                                                        const today = new Date();
                                                        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                                        setFormData(prev => ({ ...prev, dob: todayStr }));
                                                        const fieldError = validateField('dob', todayStr);
                                                        setErrors(prev => ({ ...prev, dob: fieldError }));
                                                        setIsDobPickerOpen(false);
                                                    }}>Today</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {errors.dob && <span className="error-message">{errors.dob}</span>}
                            </div>

                            {/* Department Selector */}
                            <div className="input-group full-width">
                                <label>Department</label>
                                <div className={`input-wrapper ${errors.department ? 'has-error' : ''}`}>
                                    <BookOpen size={16} />
                                    <select
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="" disabled hidden>Select Department</option>
                                        <option value="Computer Science and Applications">Computer Science and Applications</option>
                                    </select>
                                </div>
                                {errors.department && <span className="error-message">{errors.department}</span>}
                            </div>

                            {/* Course Selector */}
                            <div className="input-group">
                                <label>Course</label>
                                <div className={`input-wrapper ${errors.course ? 'has-error' : ''}`}>
                                    <CourseIcon size={16} />
                                    <select
                                        name="course"
                                        value={formData.course}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="" disabled hidden>Select Course</option>
                                        <option value="BCA">BCA</option>
                                        <option value="MCA">MCA</option>
                                        <option value="Bsc Cs">Bsc Cs</option>
                                        <option value="Bsc IT">Bsc IT</option>
                                    </select>
                                </div>
                                {errors.course && <span className="error-message">{errors.course}</span>}
                            </div>

                            {/* Year Selector */}
                            <div className="input-group">
                                <label>Current Year</label>
                                <div className={`input-wrapper ${errors.year ? 'has-error' : ''}`}>
                                    <Calendar size={16} />
                                    <select
                                        name="year"
                                        value={formData.year}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="" disabled hidden>Select Year</option>
                                        <option value="1">1st Year</option>
                                        <option value="2">2nd Year</option>
                                        <option value="3">3rd Year</option>
                                        <option value="4">4th Year</option>
                                    </select>
                                </div>
                                {errors.year && <span className="error-message">{errors.year}</span>}
                            </div>

                            {/* CGPA */}
                            <div className="input-group full-width">
                                <label>CGPA</label>
                                <div className={`input-wrapper ${errors.cgpa ? 'has-error' : ''}`}>
                                    <Award size={16} />
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="10"
                                        name="cgpa"
                                        placeholder="e.g. 8.75"
                                        value={formData.cgpa}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                {errors.cgpa && <span className="error-message">{errors.cgpa}</span>}
                            </div>

                            {/* Password */}
                            <div className="input-group">
                                <label>Password</label>
                                <div className={`input-wrapper ${errors.password ? 'has-error' : ''}`}>
                                    <Lock size={16} />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Min. 8 characters"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                {errors.password && <span className="error-message">{errors.password}</span>}
                            </div>

                            {/* Confirm Password */}
                            <div className="input-group">
                                <label>Confirm Password</label>
                                <div className={`input-wrapper ${errors.confirmPassword ? 'has-error' : ''}`}>
                                    <Lock size={16} />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="Re-enter password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                            </div>

                            {/* Submit Button */}
                            <button type="submit" className="btn-submit-register full-width">
                                Create Account
                                <ArrowRight size={16} />
                            </button>
                        </form>

                        <div className="form-bottom-link">
                            Already have an account?{''}
                            <span className="link-span" onClick={() => onNavigate('login')}> Sign In</span>
                        </div>
                    </div>

                    <div className="form-footer-copyright">
                        © 2026 College Placement Portal
                    </div>
                </div>
            </div>
            {/* TOAST NOTIFICATION COMPONENT */}
            {showToast && (
                <div className={`toast-notification ${toastType}`}>
                    <div className="toast-content">
                        {toastType === 'success' ? (
                            <CheckCircle2 className="toast-icon" size={18} />
                        ) : (
                            <XCircle className="toast-icon" size={18} />
                        )}
                        <span>{toastMessage}</span>
                    </div>
                    <div className="toast-progress-bar"></div>
                </div>
            )}
        </div>
    );
}

export default Registration;


