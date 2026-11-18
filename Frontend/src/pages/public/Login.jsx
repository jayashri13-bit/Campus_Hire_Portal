import { motion, easeOut } from 'framer-motion';

import { useState, useEffect, useRef } from 'react';
import './Login.css';
import { loginAdmin, loginStudent, forgotPassword, resetPassword, saveAuthToken } from '../../auth/authService';
import {
    GraduationCap,
    ArrowLeft,
    Mail,
    Lock,
    Eye,
    EyeOff,
    LogIn,
    ArrowRight,
    Award,
    Building2,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Circle
} from 'lucide-react';

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

/** Parses and sanitizes claims from a JWT token payload. */
function parseTokenPayload(tokenStr) {
    if (!tokenStr) return {};
    try {
        const parts = String(tokenStr).split('.');
        if (parts.length < 2) return {};
        const rawPayload = JSON.parse(atob(parts[1]));
        if (rawPayload && typeof rawPayload === 'object') {
            return {
                fullName: sanitizeStorageString(rawPayload.fullName || rawPayload.name || rawPayload.studentName || rawPayload.adminName),
                email: sanitizeStorageString(rawPayload.email).toLowerCase(),
                role: sanitizeStorageString(rawPayload.role)
            };
        }
    } catch {
        return {};
    }
    return {};
}

/** Safely retrieves and decodes a string from storage. */
function getStorageString(val) {
    if (val === null || val === undefined) return '';
    let str = String(val);
    while (str.includes('%')) {
        try {
            const decoded = decodeURIComponent(str);
            if (decoded === str) break;
            str = decoded;
        } catch {
            break;
        }
    }
    return str;
}

function Login({ onNavigate, initialView }) {
    //View controller state: login | forgot | reset

    const [loginView, setLoginView] =
        useState(initialView || 'login');

    //Toggles to show/hide raw typed passwords
    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Toast notification states
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    //Form input state tracking
    const [formData, setFormData] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        const rawEmail = params.get('email') || '';
        let initialEmail = getStorageString(rawEmail).replace(/<[^>]*>?/g, '').replace(/[<>'"]/g, '').trim();

        if (!initialEmail) {
            const storedResetEmail = localStorage.getItem('allowed_reset_email');
            if (storedResetEmail) {
                initialEmail = getStorageString(storedResetEmail).trim();
            }
        }
        let initialPass = '';
        if (initialEmail && initialView !== 'reset') {
            const rawReg = localStorage.getItem('registered_profiles');
            if (rawReg) {
                try {
                    const parsed = JSON.parse(rawReg);
                    if (Array.isArray(parsed)) {
                        const found = parsed.find(p => getStorageString(p.email).toLowerCase() === initialEmail.toLowerCase());
                        if (found && found.password) {
                            initialPass = getStorageString(found.password);
                        }
                    }
                } catch {
                    initialPass = '';
                }
            }
        }

        return {
            email: initialEmail,
            password: initialPass,
            confirmPassword: '',
            rememberMe: false
        };
    });

    // Password strength card popover state & ref
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const passwordWrapperRef = useRef(null);

    // Password validation rules & real-time strength scoring
    const currentPassword = formData?.password || "";
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

    // Click away to close password strength popover
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (passwordWrapperRef.current && !passwordWrapperRef.current.contains(event.target)) {
                setIsPasswordFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Sync loginView with initialView prop or URL location
    useEffect(() => {
        if (initialView) {
            setLoginView(initialView);
        } else if (window.location.pathname.startsWith('/reset-password') || window.location.search.includes('token=')) {
            setLoginView('reset');
        }
    }, [initialView]);

    //Handles values change in inputs with dynamic stored password lookup
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'email') {
            const trimmed = getStorageString(value).trim().toLowerCase();
            let autoPass = '';
            if (trimmed !== '') {
                const registeredProfiles = JSON.parse(localStorage.getItem('registered_profiles') || '[]');
                const matchedProfile = registeredProfiles.find(p => getStorageString(p.email).toLowerCase() === trimmed);

                const adminProfiles = JSON.parse(localStorage.getItem('admin_profiles') || '[]');
                const matchedAdmin = adminProfiles.find(p => getStorageString(p.email).toLowerCase() === trimmed);

                if (matchedProfile?.password) {
                    autoPass = getStorageString(matchedProfile.password);
                } else if (matchedAdmin?.password) {
                    autoPass = getStorageString(matchedAdmin.password);
                }
            }
            setFormData(prev => ({
                ...prev,
                email: value,
                password: autoPass,
                confirmPassword: autoPass
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };



    const saveAdminProfile = (email, password, payload = {}) => {
        const sanitizedName = sanitizeStorageString(payload.fullName || payload.name || payload.adminName || "Admin");
        const sanitizedEmail = sanitizeStorageString(payload.email || email).toLowerCase();
        const rawPassword = getStorageString(password);
        localStorage.setItem("admin_user", JSON.stringify({
            fullName: sanitizedName,
            email: sanitizedEmail,
            role: 'System Administrator'
        }));
        const rawProfiles = localStorage.getItem('admin_profiles');
        let adminProfiles = [];
        if (rawProfiles) {
            try {
                const parsed = JSON.parse(rawProfiles);
                if (Array.isArray(parsed)) adminProfiles = parsed;
            } catch {
                adminProfiles = [];
            }
        }
        let found = false;
        const updated = adminProfiles.map(p => {
            const pEmail = getStorageString(p.email).toLowerCase();
            if (pEmail === getStorageString(sanitizedEmail).toLowerCase()) {
                found = true;
                return { ...p, email: sanitizedEmail, password: rawPassword };
            }
            return { ...p, email: getStorageString(pEmail), password: getStorageString(p.password) };
        });
        if (!found && sanitizedEmail) updated.push({ email: sanitizedEmail, password: rawPassword });
        localStorage.setItem('admin_profiles', JSON.stringify(updated));
    };

    const saveStudentProfile = (email, payload = {}) => {
        const cleanEmail = sanitizeStorageString(email).toLowerCase();
        const nameFromEmail = cleanEmail.split('@')[0] || 'student';
        const fallbackName = nameFromEmail.replace(/\d/g, '').charAt(0).toUpperCase() + nameFromEmail.replace(/\d/g, '').slice(1);

        const rawReg = localStorage.getItem("registered_profiles");
        let registeredProfiles = [];
        if (rawReg) {
            try {
                const parsed = JSON.parse(rawReg);
                if (Array.isArray(parsed)) registeredProfiles = parsed;
            } catch {
                registeredProfiles = [];
            }
        }
        const matchedProfile = registeredProfiles.find(p => getStorageString(p.email).toLowerCase() === cleanEmail);

        const avatarKey = cleanEmail ? `student_avatar_${cleanEmail}` : 'student_avatar';
        const savedAvatar = localStorage.getItem(avatarKey) || localStorage.getItem('student_avatar') || "";

        if (matchedProfile) {
            const sanitizedUser = {
                fullName: sanitizeStorageString(matchedProfile.fullName),
                email: sanitizeStorageString(matchedProfile.email).toLowerCase(),
                phone: sanitizeStorageString(matchedProfile.phone),
                branch: sanitizeStorageString(matchedProfile.branch),
                passingYear: sanitizeStorageString(matchedProfile.passingYear),
                cgpa: sanitizeStorageString(matchedProfile.cgpa),
                skills: sanitizeStorageString(matchedProfile.skills),
                linkedinUrl: sanitizeStorageString(matchedProfile.linkedinUrl),
                githubUrl: sanitizeStorageString(matchedProfile.githubUrl),
                avatarUrl: matchedProfile.avatarUrl || savedAvatar
            };
            localStorage.setItem("user", JSON.stringify(sanitizedUser));
        } else {
            localStorage.setItem("user", JSON.stringify({
                fullName: sanitizeStorageString(payload.fullName || payload.name || payload.studentName || fallbackName),
                email: cleanEmail,
                avatarUrl: savedAvatar
            }));
        }
    };

    const showToastMessage = (msg, type, timeout, callback) => {
        setToastMessage(msg);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
            if (callback) callback();
        }, timeout);
    };

    const handleLoginSubmit = async () => {
        try {
            const emailLower = formData.email.trim().toLowerCase();
            const isAdmin = emailLower === 'saurabh@gmail.com' || emailLower.startsWith('admin') || emailLower.includes('@admin.') || emailLower.includes('.admin');

            const apiCall = isAdmin ? loginAdmin : loginStudent;
            const response = await apiCall({
                email: formData.email.trim(),
                password: getStorageString(formData.password),
                ...(isAdmin && { rememberMe: formData.rememberMe })
            });


            if (response.data?.token) {
                saveAuthToken(response.data.token);
                localStorage.setItem("role", sanitizeStorageString(isAdmin ? "admin" : "student"));

                const payload = parseTokenPayload(response.data.token);

                if (isAdmin) saveAdminProfile(formData.email, formData.password, payload);
                else saveStudentProfile(formData.email, payload);

                showToastMessage("Login successful!", 'success', 1500, () => {
                    onNavigate(isAdmin ? 'admin' : 'student');
                });
            } else {
                throw new Error(response.data?.message || "Invalid credentials or unregistered user.");
            }
        } catch (error) {
            console.error("Login Error:", error);
            showToastMessage(error.response?.data?.message || "Invalid email or password", 'error', 3000);
        }
    };

    const handleForgotSubmit = async () => {
        const cleanEmail = getStorageString(formData.email).trim();
        if (!cleanEmail) {
            showToastMessage("Please enter your registered email address.", 'error', 3000);
            return;
        }

        try {
            await forgotPassword(cleanEmail);
            localStorage.setItem('allowed_reset_email', sanitizeStorageString(cleanEmail).toLowerCase());
        } catch (error) {
            console.error("Forgot Password Error:", error);
            localStorage.setItem('allowed_reset_email', sanitizeStorageString(cleanEmail).toLowerCase());
        } finally {
            showToastMessage("Password reset link sent to your email!", 'success', 3500, () => setLoginView('login'));
        }
    };

    const handleResetSubmit = async () => {
        if (formData.password !== formData.confirmPassword) {
            showToastMessage("Passwords do not match!", 'error', 3000);
            return;
        }

        const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=]).{8,}$/;
        if (!passwordPattern.test(formData.password)) {
            showToastMessage("Password must be at least 8 characters and contain letters, numbers, and special characters (@$!%*?&).", 'error', 4500);
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const tokenParam = params.get('token') || '';
        const urlEmail = params.get('email') || '';
        const allowedEmail = localStorage.getItem('allowed_reset_email') || '';
        let targetEmail = getStorageString(urlEmail || formData.email || allowedEmail).trim();

        if (!targetEmail) {
            const rawReg = localStorage.getItem('registered_profiles');
            if (rawReg) {
                try {
                    const parsed = JSON.parse(rawReg);
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].email) {
                        targetEmail = getStorageString(parsed[0].email).trim();
                    }
                } catch {
                    // Ignore
                }
            }
        }

        if (!targetEmail) {
            showToastMessage("Please enter your registered email address.", 'error', 3000);
            return;
        }

        try {
            const newPassword = getStorageString(formData.password);
            await resetPassword({
                email: targetEmail,
                token: tokenParam,
                resetToken: tokenParam,
                newPassword: newPassword,
                confirmPassword: newPassword
            });

            const resetEmail = targetEmail.toLowerCase();
            const rawProfiles = localStorage.getItem('registered_profiles');
            let profiles = [];
            if (rawProfiles) {
                try {
                    const parsed = JSON.parse(rawProfiles);
                    if (Array.isArray(parsed)) profiles = parsed;
                } catch {
                    profiles = [];
                }
            }
            let regFound = false;
            const updatedReg = profiles.map(p => {
                const pEmail = getStorageString(p.email).toLowerCase();
                if (pEmail === resetEmail) {
                    regFound = true;
                    return { ...p, email: sanitizeStorageString(pEmail), password: newPassword };
                }
                return { ...p, email: pEmail, password: getStorageString(p.password) };
            });
            if (!regFound) {
                updatedReg.push({
                    email: resetEmail,
                    password: newPassword
                });
            }
            localStorage.setItem('registered_profiles', JSON.stringify(updatedReg));

            const rawAdmins = localStorage.getItem('admin_profiles');
            let adminProfiles = [];
            if (rawAdmins) {
                try {
                    const parsed = JSON.parse(rawAdmins);
                    if (Array.isArray(parsed)) adminProfiles = parsed;
                } catch {
                    adminProfiles = [];
                }
            }
            let adminFound = false;
            const updatedAdmins = adminProfiles.map(p => {
                const pEmail = getStorageString(p.email).toLowerCase();
                if (pEmail === resetEmail) {
                    adminFound = true;
                    return { ...p, email: sanitizeStorageString(pEmail), password: newPassword };
                }
                return { ...p, email: pEmail, password: getStorageString(p.password) };
            });
            if (!adminFound && (resetEmail === 'saurabh@gmail.com' || resetEmail.startsWith('admin') || resetEmail.includes('@admin.') || resetEmail.includes('.admin'))) {
                updatedAdmins.push({ email: resetEmail, password: newPassword });
            }
            localStorage.setItem('admin_profiles', JSON.stringify(updatedAdmins));

            const rawUser = localStorage.getItem('user');
            if (rawUser) {
                try {
                    const userObj = JSON.parse(rawUser);
                    if (userObj && getStorageString(userObj.email).toLowerCase() === resetEmail) {
                        userObj.password = newPassword;
                        localStorage.setItem('user', JSON.stringify(userObj));
                    }
                } catch {
                    // Ignore
                }
            }

            showToastMessage('Password reset successfully!', 'success', 2000, () => {
                setLoginView('login');
                if (window.history && window.history.pushState) {
                    window.history.pushState(null, '', '/login');
                }
                setFormData(prev => ({
                    ...prev,
                    email: resetEmail,
                    password: newPassword,
                    confirmPassword: newPassword
                }));
                localStorage.removeItem('allowed_reset_email');
            });
        } catch (error) {
            console.error("Reset Password Error:", error);
            const errMsg = typeof error.response?.data === 'string'
                ? error.response.data
                : (error.response?.data?.message || "Failed to reset password. Please check your details and try again.");
            showToastMessage(errMsg, 'error', 4000);
        }
    };

    //Handles Form submissions
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loginView === 'login') return handleLoginSubmit();
        if (loginView === 'forgot') return handleForgotSubmit();
        if (loginView === 'reset') return handleResetSubmit();
    };

    return (
        <div className='login-page'>


            {/* MAIN PORTAL CONTAINER CARD */}
            <div className="login-container">
                {/* LEFT COLUMN: Branding & Recent Placements */}
                <motion.div className="login-left"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: easeOut }}>
                    <div className="login-logo-section">
                        <GraduationCap className="logo-icon" size={28} style={{ color: '#2563eb' }} />
                        <span className="college-name" style={{ fontSize: '1.25rem', fontWeight: '800', color: '#2563eb' }}>Campus_Hire</span>
                    </div>

                    <div className="brand-text-section">
                        <h2>Your Placement Journey Awaits</h2>
                        <p>Sign in to access your personalised dashboard — browse live drives, track applications, and manage your placement profile.</p>
                    </div>

                    {/* Stats List */}
                    <div className="brand-stats-list">
                        <div className="stat-bullet">
                            <Award size={18} />
                            <span>500+ Registered Students</span>
                        </div>
                        <div className="stat-bullet">
                            <Building2 size={18} />
                            <span>30+ Partner Companies</span>
                        </div>
                        <div className="stat-bullet">
                            <TrendingUp size={18} />
                            <span>120+ Placements This Year</span>
                        </div>
                        <div className="stat-bullet">
                            <CheckCircle2 size={18} />
                            <span>95% Success Rate</span>
                        </div>
                    </div>

                    {/* Figma Recent Placements List Ledger */}
                    <div className="recent-placements-ledger">
                        <h4>Recent Placements</h4>
                        <div className="ledger-list">
                            <div className="ledger-row">
                                <div className="avatar-letter p-theme">P</div>
                                <div className="placement-details">
                                    <span className="student-name">Priya Sharma</span>
                                    <span className="student-dept">CSE · Google</span>
                                </div>
                                <div className="salary-package text-green">28 LPA</div>
                            </div>
                            <div className="ledger-row">
                                <div className="avatar-letter r-theme">R</div>
                                <div className="placement-details">
                                    <span className="student-name">Rahul Desai</span>
                                    <span className="student-dept">IT · Microsoft</span>
                                </div>
                                <div className="salary-package text-green">22 LPA</div>
                            </div>
                            <div className="ledger-row">
                                <div className="avatar-letter s-theme">S</div>
                                <div className="placement-details">
                                    <span className="student-name">Sneha Kulkarni</span>
                                    <span className="student-dept">ENTC · Infosys</span>
                                </div>
                                <div className="salary-package text-green">9 LPA</div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Testimonial */}
                    <div className="brand-testimonial">
                        <p>"The portal made the entire placement process transparent and stress-free. I always knew exactly where I stood."</p>
                        <span className="author">— Sneha Kulkarni, ENTC - Placed at Infosys</span>
                    </div>
                </motion.div>

                {/* RIGHT COLUMN: Interactive Login/Forgot/Reset Forms */}
                <motion.div className="login-right"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}>
                    {/* Back to Home Action Button */}
                    <button type="button" className="btn-back-home" onClick={() => onNavigate('landing')}>
                        <ArrowLeft size={16} />
                        Back to Home
                    </button>

                    <div className="form-card">
                        {/* Header titles swap depending on view */}
                        {loginView === 'login' && (
                            <div className="form-header">
                                <h2>Welcome Back🚀</h2>
                                <p>Sign in to your Campus_Hire account</p>
                            </div>
                        )}
                        {loginView === 'forgot' && (
                            <div className="form-header">
                                <h2>Forgot Password</h2>
                                <p>Enter your email to request a reset link</p>
                            </div>
                        )}
                        {loginView === 'reset' && (
                            <div className="form-header">
                                <h2>Reset Password</h2>
                                <p>Enter a new password for your account</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="form-grid-login">
                            {/* EMAIL INPUT (Login & Forgot views) */}
                            {loginView !== 'reset' && (
                                <div className="input-group full-width">
                                    <label htmlFor="email">Email Address</label>
                                    <div className="input-wrapper">
                                        <Mail size={16} />
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            placeholder="priya@college.edu.in"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {/* PASSWORD INPUT (Login view) */}
                            {loginView === 'login' && (
                                <div className="input-group full-width password-input-group" ref={passwordWrapperRef}>
                                    <div className="label-row">
                                        <label htmlFor="password">Password</label>
                                        <button
                                            type="button"
                                            className="link-span-forgot"
                                            onClick={() => setLoginView('forgot')}
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                    <div className="input-wrapper">
                                        <Lock size={16} />
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            placeholder="Enter your password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            onFocus={() => setIsPasswordFocused(true)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="btn-toggle-eye"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>

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
                            )}


                            {/* RESET PASSWORD INPUTS (Reset view) */}
                            {loginView === 'reset' && (
                                <>

                                    <div className="input-group full-width password-input-group" ref={passwordWrapperRef}>
                                        <label htmlFor="resetPassword">New Password</label>
                                        <div className="input-wrapper">
                                            <Lock size={16} />
                                            <input
                                                id="resetPassword"
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                placeholder="Enter new password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                onFocus={() => setIsPasswordFocused(true)}
                                                autoComplete="off"
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="btn-toggle-eye"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>

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

                                    <div className="input-group full-width">
                                        <label htmlFor="resetConfirmPassword">Confirm Password</label>
                                        <div className="input-wrapper">
                                            <Lock size={16} />
                                            <input
                                                id="resetConfirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                name="confirmPassword"
                                                placeholder="Confirm your password"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                onFocus={() => setIsPasswordFocused(false)}
                                                autoComplete="off"
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="btn-toggle-eye"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {formData.confirmPassword.length > 0 && (
                                            <div style={{ marginTop: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                                                {formData.password === formData.confirmPassword ? (
                                                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <CheckCircle2 size={14} /> Passwords match
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <XCircle size={14} /> Passwords do not match
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                </>
                            )}

                            {/* REMEMBER ME CHECKBOX (Login view only) */}
                            {loginView === 'login' && (
                                <div className="form-checkbox-login full-width">
                                    <input
                                        type="checkbox"
                                        id="rememberMe"
                                        name="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="rememberMe">Remember me</label>
                                </div>
                            )}

                            {/* SUBMIT BUTTON ACTION TRIGGERS */}
                            {loginView === 'login' && (
                                <button type="submit" className="btn-submit-login full-width">
                                    <LogIn size={16} />
                                    Sign In
                                </button>
                            )}

                            {loginView === 'forgot' && (
                                <div className="forgot-action-buttons full-width">
                                    <button
                                        type="button"
                                        className="btn-cancel-forgot"
                                        onClick={() => setLoginView('login')}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-send-forgot">
                                        Send Link
                                    </button>
                                </div>
                            )}

                            {loginView === 'reset' && (
                                <button type="submit" className="btn-submit-login full-width">
                                    Reset Password
                                    <ArrowRight size={16} />
                                </button>
                            )}
                        </form>

                        {/* BOTTOM ACTION LINK (Login view only) */}
                        {loginView === 'login' && (
                            <div className="form-bottom-link-login">
                                New to Campus_Hire?{' '}
                                <button
                                    type="button"
                                    className="link-span-register"
                                    onClick={() => onNavigate('register')}
                                >
                                    Register Student Account
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="form-footer-copyright">
                        © 2026  · Campus_Hire
                    </div>
                </motion.div>
            </div>

            {/* TOAST NOTIFICATION COMPONENT */}
            {
                showToast && (
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
                )
            }
        </div >
    );
}

export default Login;