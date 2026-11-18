import { easeOut, motion } from 'framer-motion';

import { registerStudent, saveAuthToken } from "../../auth/authService";

import { useState, useEffect, useRef } from "react";
import './Registration.css';
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
    Eye,
    EyeOff,
    ArrowRight,
    Building2,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Briefcase,
    FileText,
    Circle
} from "lucide-react";


/** Cleans and sanitizes user input strings before storing or displaying. */
function sanitizeStorageString(val) {
    if (val === null || val === undefined) return '';
    let str = String(val);
    try {
        if (str.includes('%')) {
            str = decodeURIComponent(str);
        }
    } catch {
        // Fallback
    }
    const doc = typeof DOMParser !== 'undefined' ? new DOMParser().parseFromString(str, 'text/html') : null;
    const cleanText = doc ? (doc.body.textContent || '') : str;
    const cleanStr = cleanText.replace(/[<>'"]/g, '').trim();
    return cleanStr;
}

function getStorageString(val) {
    if (val === null || val === undefined) return '';
    try {
        return decodeURIComponent(String(val));
    } catch {
        return String(val);
    }
}

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

    // Password visibility toggle states
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Toast notification states
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const toastTimeoutRef = useRef(null);

    const triggerToast = (message, type = 'error', duration = 4000) => {
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        toastTimeoutRef.current = setTimeout(() => {
            setShowToast(false);
        }, duration);
    };

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

    // Password strength card popover state & ref
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const passwordWrapperRef = useRef(null);

    // Password validation rules & real-time strength scoring
    const currentPassword = formData.password || "";
    const pwdRules = {
        length: currentPassword.length >= 8,
        hasUpperLower: /[a-z]/.test(currentPassword) && /[A-Z]/.test(currentPassword),
        hasNumber: /\d/.test(currentPassword),
        hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(currentPassword)
    };
    const pwdScore = Object.values(pwdRules).filter(Boolean).length;

    let strengthLabel = "Weak password";
    let strengthTheme = "weak";
    if (pwdScore >= 4) {
        strengthLabel = "Strong password";
        strengthTheme = "strong";
    } else if (pwdScore >= 2) {
        strengthLabel = "Medium password";
        strengthTheme = "medium";
    }

    // Click away to close calendar picker and password strength card
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dobDatePickerRef.current && !dobDatePickerRef.current.contains(event.target)) {
                setIsDobPickerOpen(false);
            }
            if (passwordWrapperRef.current && !passwordWrapperRef.current.contains(event.target)) {
                setIsPasswordFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
            }
        };
    }, []);

    const formatDOBDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        if (Number.isNaN(d.getTime())) return dateString;
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', '-');
    };

    // Strategy map for field validation to reduce cognitive complexity
    const validationRules = {
        fullname: (value) => {
            if (!value.trim()) return 'Full name is required';
            if (value.trim().length < 3) return 'Name must be at least 3 characters';
            if (!/^[a-zA-Z\s]+$/.test(value)) return 'Name can only contain letters and spaces';
            return '';
        },
        email: (value) => {
            if (!value) return 'Email address is required';
            if (!/^[a-zA-Z\d._%+-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(value)) return 'Please enter a valid email address';
            return '';
        },
        mobile: (value) => {
            if (!value) return 'Mobile number is required';
            if (/\D/.test(value)) return 'Only numbers are allowed in mobile number';
            if (value.length !== 10) return 'Mobile number must be exactly 10 digits';
            return '';
        },
        dob: (value) => {
            if (!value) return 'Date of Birth is required';
            const dobDate = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - dobDate.getFullYear();
            const m = today.getMonth() - dobDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) age--;
            if (dobDate > today) return 'Date of Birth cannot be in the future';
            if (age < 18) return 'You must be at least 18 years old to register';
            return '';
        },
        department: (value) => !value ? 'Please select your department' : '',
        course: (value) => !value ? 'Please select your course' : '',
        year: (value) => !value ? 'Please select your current year' : '',
        cgpa: (value) => {
            if (!value) return 'CGPA is required';
            const num = Number.parseFloat(value);
            if (Number.isNaN(num) || num < 0 || num > 10) return 'CGPA must be a number between 0.00 and 10.00';
            return '';
        },
        password: (value) => {
            if (!value) return 'Password is required';
            if (value.length < 8) return 'Password must be at least 8 characters long';
            if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value) || !/[!@#$%^&*]/.test(value)) return 'Must include uppercase, lowercase, number, and special character';
            return '';
        },
        confirmPassword: (value) => {
            if (!value) return 'Please confirm your password';
            if (value !== formData.password) return 'Passwords do not match';
            return '';
        }
    };

    // Validate a single field and return its error message
    const validateField = (name, value) => {
        const validator = validationRules[name];
        return validator ? validator(value) : '';
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
                triggerToast("Passwords do not match", 'error', 3000);
            }
            const firstErrorField = Object.keys(tempErrors)[0];
            const inputElement = document.getElementsByName(firstErrorField)[0];
            if (inputElement) {
                inputElement.focus();
            }
            return;
        }

        // Check for existing/already registered email and mobile number in local registry
        const rawProfiles = localStorage.getItem("registered_profiles");
        let existingProfiles = [];
        if (rawProfiles) {
            try {
                const parsed = JSON.parse(rawProfiles);
                if (Array.isArray(parsed)) existingProfiles = parsed;
            } catch {
                existingProfiles = [];
            }
        }
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
            try {
                const parsedUser = JSON.parse(rawUser);
                if (parsedUser && parsedUser.email) {
                    const alreadyInList = existingProfiles.some(
                        p => getStorageString(p.email).toLowerCase() === getStorageString(parsedUser.email).toLowerCase()
                    );
                    if (!alreadyInList) existingProfiles.push(parsedUser);
                }
            } catch { }
        }

        const inputEmail = sanitizeStorageString(formData.email).toLowerCase().trim();
        const inputMobile = sanitizeStorageString(formData.mobile).trim();

        const isEmailUsed = inputEmail && existingProfiles.some(p => {
            const e = getStorageString(p.email || p.userEmail).toLowerCase().trim();
            return e === inputEmail;
        });

        const isPhoneUsed = inputMobile && existingProfiles.some(p => {
            const ph = getStorageString(p.phone || p.mobile || p.userMobile).trim();
            return ph === inputMobile;
        });

        if (isEmailUsed && isPhoneUsed) {
            setErrors(prev => ({
                ...prev,
                email: "Email address is already registered",
                mobile: "Mobile number is already registered"
            }));
            return;
        } else if (isEmailUsed) {
            setErrors(prev => ({
                ...prev,
                email: "Email address is already registered"
            }));
            return;
        } else if (isPhoneUsed) {
            setErrors(prev => ({
                ...prev,
                mobile: "Phone number is already registered"
            }));
            return;
        }

        // Reformat stored yyyy-mm-dd date into dd-mm-yyyy for the backend API
        let apiFormattedDob = "";
        if (formData.dob) {
            const [year, month, day] = formData.dob.split("-");
            apiFormattedDob = `${day}-${month}-${year}`;
        }

        const requestBody = {
            fullName: formData.fullname,
            email: formData.email,
            mobile: formData.mobile,
            dob: apiFormattedDob,
            department: formData.department,
            course: formData.course,
            currentYear: Number(formData.year),
            cgpa: Number(formData.cgpa),
            password: formData.password,
            confirmPassword: formData.confirmPassword
        };

        try {
            const response = await registerStudent(requestBody);

            // 1. Save the backend token and student details to localStorage
            if (response.data?.token) {
                saveAuthToken(response.data.token);
            }

            // Save student details to local registry
            const cleanFullName = sanitizeStorageString(formData.fullname);
            const cleanEmail = sanitizeStorageString(formData.email).toLowerCase();
            const cleanPassword = sanitizeStorageString(formData.password);
            const cleanPhone = sanitizeStorageString(formData.mobile);
            const cleanBranch = sanitizeStorageString(formData.department);
            const cleanYear = sanitizeStorageString(formData.year);
            const cleanCgpa = sanitizeStorageString(formData.cgpa);

            const newProfile = {
                fullName: cleanFullName,
                email: cleanEmail,
                password: cleanPassword,
                phone: cleanPhone,
                branch: cleanBranch,
                passingYear: cleanYear,
                cgpa: cleanCgpa,
                skills: sanitizeStorageString("React, JavaScript, CSS, Node.js, Python"),
                linkedinUrl: sanitizeStorageString(`https://linkedin.com/in/${encodeURIComponent(formData.fullname.toLowerCase().replace(/\s+/g, '-'))}`),
                githubUrl: sanitizeStorageString(`https://github.com/${encodeURIComponent(formData.fullname.toLowerCase().replace(/\s+/g, ''))}`),
                portfolioUrl: "",
                resumeUrl: ""
            };
            localStorage.setItem("user", JSON.stringify(newProfile));

            const updatedProfiles = existingProfiles
                .filter(p => getStorageString(p.email).toLowerCase() !== getStorageString(cleanEmail).toLowerCase())
                .map(p => ({
                    fullName: sanitizeStorageString(p.fullName),
                    email: sanitizeStorageString(p.email).toLowerCase(),
                    password: sanitizeStorageString(p.password),
                    phone: sanitizeStorageString(p.phone),
                    branch: sanitizeStorageString(p.branch),
                    passingYear: sanitizeStorageString(p.passingYear),
                    cgpa: sanitizeStorageString(p.cgpa),
                    skills: sanitizeStorageString(p.skills),
                    linkedinUrl: sanitizeStorageString(p.linkedinUrl),
                    githubUrl: sanitizeStorageString(p.githubUrl),
                    portfolioUrl: sanitizeStorageString(p.portfolioUrl),
                    resumeUrl: sanitizeStorageString(p.resumeUrl)
                }));
            updatedProfiles.push(newProfile);
            localStorage.setItem("registered_profiles", JSON.stringify(updatedProfiles));

            triggerToast("Registration completed successfully!", "success", 2000);

            // 2. Redirect directly to the Student Dashboard after 2 seconds
            setTimeout(() => {
                onNavigate("student");
            }, 2000);

        } catch (err) {
            const errData = err?.response?.data;
            let serverMsg = "";

            if (typeof errData === "string") {
                serverMsg = errData;
            } else if (errData && typeof errData === "object") {
                serverMsg = errData.message || errData.error || errData.details || "";
                if (!serverMsg && errData.errors) {
                    if (typeof errData.errors === "string") {
                        serverMsg = errData.errors;
                    } else if (typeof errData.errors === "object") {
                        serverMsg = Object.values(errData.errors).flat().join(", ");
                    }
                }
            }

            const lowerMsg = serverMsg.toLowerCase();
            const isEmailError = lowerMsg.includes("email");
            const isPhoneError = lowerMsg.includes("phone") || lowerMsg.includes("mobile");

            if (isEmailError && isPhoneError) {
                setErrors(prev => ({
                    ...prev,
                    email: "Email address is already registered",
                    mobile: "Mobile number is already registered"
                }));
            } else if (isEmailError) {
                setErrors(prev => ({
                    ...prev,
                    email: "Email address is already registered"
                }));
            } else if (isPhoneError) {
                setErrors(prev => ({
                    ...prev,
                    mobile: "Phone number is already registered"
                }));
            } else if (serverMsg) {
                triggerToast(serverMsg, "error");
            } else {
                triggerToast("Registration failed. Please try again.", "error");
            }
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
                <motion.div className="register-left"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: easeOut }}>
                    {/* Application Header Logo */}
                    <div className="register-logo-section">
                        <GraduationCap className="logo-icon" size={28} style={{ color: '#2563eb' }} />
                        <span className="college-name" style={{ fontSize: '1.25rem', fontWeight: '800', color: '#2563eb' }}>Campus_Hire</span>
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
                </motion.div>

                {/* RIGHT SIDE PANEL: Sign Up Form Area */}
                <motion.div className="register-right"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}>
                    {/* Back to Home Button */}
                    <button type="button" className="btn-back-home" onClick={() => onNavigate('landing')}>
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
                                <label htmlFor="fullnameInput">Full Name</label>
                                <div className={`input-wrapper ${errors.fullname ? 'has-error' : ''}`}>
                                    <User size={16} />
                                    <input
                                        id="fullnameInput"
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
                                <label htmlFor="emailInput">Email Address</label>
                                <div className={`input-wrapper ${errors.email ? 'has-error' : ''}`}>
                                    <Mail size={16} />
                                    <input
                                        id="emailInput"
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
                                <label htmlFor="mobileInput">Mobile Number</label>
                                <div className={`input-wrapper ${errors.mobile ? 'has-error' : ''}`}>
                                    <Phone size={16} />
                                    <input
                                        id="mobileInput"
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
                                <label htmlFor="dobPickerBtn">Date of Birth (DOB)</label>
                                <div className={`input-wrapper ${errors.dob ? 'has-error' : ''}`} ref={dobDatePickerRef} style={{ position: 'relative', overflow: 'visible', border: 'none', padding: 0 }}>
                                    <input id="dobInput" type="text" name="dob" value={formData.dob} onChange={handleChange} style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }} tabIndex={-1} />
                                    <div className="custom-date-picker-container" style={{ width: '100%' }}>
                                        <button
                                            id="dobPickerBtn"
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
                                                            onChange={(e) => setDobCalDate(new Date(dobCalDate.getFullYear(), Number.parseInt(e.target.value), 1))}
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
                                                            onChange={(e) => setDobCalDate(new Date(Number.parseInt(e.target.value), dobCalDate.getMonth(), 1))}
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
                                                    {Array.from({ length: dobFirstDayIndex }, (_, i) => `empty-${dobCalDate.getFullYear()}-${dobCalDate.getMonth()}-${i}`).map((slotKey) => (
                                                        <span key={slotKey} className="empty-day"></span>
                                                    ))}
                                                    {/* Render month days */}
                                                    {Array.from({ length: dobTotalDays }).map((_, i) => {
                                                        const day = i + 1;
                                                        const dateStr = `${dobCalDate.getFullYear()}-${String(dobCalDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                        const isSelected = formData.dob === dateStr;
                                                        const today = new Date();
                                                        today.setHours(0, 0, 0, 0);
                                                        const thisDate = new Date(dobCalDate.getFullYear(), dobCalDate.getMonth(), day);
                                                        const isFuture = thisDate > today;

                                                        return (
                                                            <button
                                                                type="button"
                                                                key={day}
                                                                disabled={isFuture}
                                                                className={`calendar-day-btn ${isSelected ? 'selected' : ''} ${isFuture ? 'disabled-past-day' : ''}`}
                                                                onClick={() => {
                                                                    if (isFuture) return;
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
                                                <div className="calendar-footer" style={{ justifyContent: 'flex-end' }}>
                                                    <button type="button" className="calendar-clear-btn" onClick={() => { setFormData(prev => ({ ...prev, dob: '' })); const fieldError = validateField('dob', ''); setErrors(prev => ({ ...prev, dob: fieldError })); setIsDobPickerOpen(false); }}>Clear</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {errors.dob && <span className="error-message">{errors.dob}</span>}
                            </div>

                            {/* Department Selector */}
                            <div className="input-group full-width">
                                <label htmlFor="departmentSelect">Department</label>
                                <div className={`input-wrapper ${errors.department ? 'has-error' : ''}`}>
                                    <BookOpen size={16} />
                                    <select
                                        id="departmentSelect"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="" disabled hidden>Select Department</option>
                                        <option value="Computer Science">Computer Science</option>
                                        <option value="Computer Applications">Computer Applications</option>
                                    </select>
                                </div>
                                {errors.department && <span className="error-message">{errors.department}</span>}
                            </div>

                            {/* Course Selector */}
                            <div className="input-group">
                                <label htmlFor="courseSelect">Course</label>
                                <div className={`input-wrapper ${errors.course ? 'has-error' : ''}`}>
                                    <CourseIcon size={16} />
                                    <select
                                        id="courseSelect"
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
                                        <option value="MSc">MSc</option>
                                    </select>
                                </div>
                                {errors.course && <span className="error-message">{errors.course}</span>}
                            </div>

                            {/* Year Selector */}
                            <div className="input-group">
                                <label htmlFor="yearSelect">Current Year</label>
                                <div className={`input-wrapper ${errors.year ? 'has-error' : ''}`}>
                                    <Calendar size={16} />
                                    <select
                                        id="yearSelect"
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
                                <label htmlFor="cgpaInput">CGPA</label>
                                <div className={`input-wrapper ${errors.cgpa ? 'has-error' : ''}`}>
                                    <Award size={16} />
                                    <input
                                        id="cgpaInput"
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
                            <div className="input-group password-input-group" ref={passwordWrapperRef}>
                                <label htmlFor="passwordInput">Password</label>
                                <div className={`input-wrapper ${errors.password && !isPasswordFocused ? 'has-error' : ''}`}>
                                    <Lock size={16} />
                                    <input
                                        id="passwordInput"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="Min. 8 characters"
                                        value={formData.password}
                                        onChange={handleChange}
                                        onFocus={() => setIsPasswordFocused(true)}
                                        style={{ paddingRight: '38px' }}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="btn-toggle-eye"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && !isPasswordFocused && <span className="error-message">{errors.password}</span>}

                                {/* Password Strength Popover Checklist */}
                                {isPasswordFocused && (
                                    <div className="password-strength-popover">
                                        <div className="strength-header">
                                            <span className={`strength-title ${strengthTheme}`}>{strengthLabel}</span>
                                            <div className="strength-meter-bars">
                                                <div className={`meter-segment ${pwdScore >= 1 ? strengthTheme : ''}`}></div>
                                                <div className={`meter-segment ${pwdScore >= 2 ? strengthTheme : ''}`}></div>
                                                <div className={`meter-segment ${pwdScore >= 4 ? strengthTheme : ''}`}></div>
                                            </div>
                                        </div>
                                        <p className="strength-subtitle">It's better to have:</p>
                                        <ul className="strength-checklist">
                                            <li className={pwdRules.length ? 'rule-satisfied' : ''}>
                                                {pwdRules.length ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                                                <span>At least 8 characters</span>
                                            </li>
                                            <li className={pwdRules.hasUpperLower ? 'rule-satisfied' : ''}>
                                                {pwdRules.hasUpperLower ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                                                <span>Uppercase and lowercase letters</span>
                                            </li>
                                            <li className={pwdRules.hasNumber ? 'rule-satisfied' : ''}>
                                                {pwdRules.hasNumber ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                                                <span>Numbers</span>
                                            </li>
                                            <li className={pwdRules.hasSymbol ? 'rule-satisfied' : ''}>
                                                {pwdRules.hasSymbol ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                                                <span>Symbols (#$&)</span>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="input-group">
                                <label htmlFor="confirmPasswordInput">Confirm Password</label>
                                <div className={`input-wrapper ${errors.confirmPassword ? 'has-error' : ''}`}>
                                    <Lock size={16} />
                                    <input
                                        id="confirmPasswordInput"
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        placeholder="Re-enter password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        style={{ paddingRight: '38px' }}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="btn-toggle-eye"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex={-1}
                                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
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
                            <button type="button" className="link-span" onClick={() => onNavigate('login')}> Sign In</button>
                        </div>
                    </div>

                    <div className="form-footer-copyright">
                        © 2026 Campus_Hire
                    </div>
                </motion.div>
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


