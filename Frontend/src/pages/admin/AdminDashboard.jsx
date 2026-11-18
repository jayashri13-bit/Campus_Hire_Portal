import { motion, AnimatePresence } from 'framer-motion';

import { useState, useEffect, useRef } from 'react';
import './AdminDashboard.css';
import StudentAnalytics from './StudentAnalytics';
import QueriesStories from './QueriesStories';
import { createJobPosting, getDrafts, getDraftById, updateDraft, publishDraft, getAdminProfile, updateAdminProfile, uploadAdminProfilePhoto, deleteAdminProfilePhoto, getAdminRecentPosts, changePassword, getAdminApplicantsMatching, getAdminNotifications, markAllAdminNotificationsAsRead, getAdminUnreadCount, getAdminStudentAnalyticsDashboard } from '../../auth/authService';
import { playNotificationAlert } from '../../utils/notificationSound';
import {
    GraduationCap,
    Bell,
    Briefcase,
    Users,
    FileText,
    Plus,
    Search,
    ChevronDown,
    X,
    User,
    Lock,
    LogOut,
    Calendar,
    Eye,
    EyeOff,
    Edit3,
    Camera,
    Trash2,
    CheckCircle2,
    Info,
    AlertCircle,
    Menu,
    LayoutDashboard,
    BarChart3,
    MessageSquareQuote
} from 'lucide-react';



/** Parses a DD/MM/YYYY or YYYY-MM-DD date string + 12-hour/24-hour time string into a timestamp for sorting. */
function parseDateStr(dateStr, timeStr) {
    if (!dateStr) return 0;

    let numDay, numMonth, numYear;
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            numDay = Number.parseInt(parts[0], 10);
            numMonth = Number.parseInt(parts[1], 10);
            numYear = Number.parseInt(parts[2], 10);
        }
    } else if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                numYear = Number.parseInt(parts[0], 10);
                numMonth = Number.parseInt(parts[1], 10);
                numDay = Number.parseInt(parts[2], 10);
            } else {
                numDay = Number.parseInt(parts[0], 10);
                numMonth = Number.parseInt(parts[1], 10);
                numYear = Number.parseInt(parts[2], 10);
            }
        }
    }

    if (!numDay || !numMonth || !numYear) {
        return new Date(dateStr).getTime() || 0;
    }

    let numHours = 0;
    let numMinutes = 0;

    if (timeStr) {
        const match = /^(\d{1,2}):(\d{1,2})(?::\d{1,2})?\s*([AP]M)?$/i.exec(timeStr);
        if (match) {
            const [, rawH, rawM, ampm] = match;
            let h = Number.parseInt(rawH, 10);
            const m = Number.parseInt(rawM, 10);
            if (ampm) {
                const upperAmPm = ampm.toUpperCase();
                if (upperAmPm === 'PM' && h < 12) h += 12;
                if (upperAmPm === 'AM' && h === 12) h = 0;
            }
            numHours = h;
            numMinutes = m;
        }
    }
    const localDate = new Date(numYear, numMonth - 1, numDay, numHours, numMinutes);
    return localDate.getTime();
}

function getInitials(name, fallback = 'AD') {
    if (!name) return fallback;
    const parts = String(name).trim().split(" ");
    return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2) || fallback;
}

/* Converts a backend notification's raw date/time fields into localized display strings without shifting timezones. */
function localizeNotification(notif) {
    if (!notif) return notif;

    if (notif.createdAt) {
        const d = new Date(notif.createdAt);
        if (!isNaN(d.getTime())) {
            notif.displayDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
            notif.displayTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            return notif;
        }
    }

    if (notif.createdDate) {
        let displayDate = notif.createdDate;
        if (/^\d{4}-\d{2}-\d{2}$/.test(displayDate)) {
            const [y, m, d] = displayDate.split('-');
            displayDate = `${d}/${m}/${y}`;
        }
        notif.displayDate = displayDate;

        if (notif.createdTime) {
            const match = /^(\d{1,2}):(\d{1,2})(?::\d{1,2})?\s*([AP]M)?$/i.exec(notif.createdTime);
            if (match) {
                const [, rawH, rawM, ampm] = match;
                let h = Number.parseInt(rawH, 10);
                const m = Number.parseInt(rawM, 10);
                if (ampm) {
                    const padH = String(h).padStart(2, '0');
                    const padM = String(m).padStart(2, '0');
                    notif.displayTime = `${padH}:${padM} ${ampm.toUpperCase()}`;
                } else {
                    const period = h >= 12 ? 'PM' : 'AM';
                    let h12 = h % 12;
                    if (h12 === 0) h12 = 12;
                    const padH = String(h12).padStart(2, '0');
                    const padM = String(m).padStart(2, '0');
                    notif.displayTime = `${padH}:${padM} ${period}`;
                }
            } else {
                notif.displayTime = notif.createdTime;
            }
        }
    }

    return notif;
}

/*Formats date strings into DD-MM-YYYY format for the backend API. */
function formatApiDeadline(deadline) {
    if (!deadline) return '24-08-2026';
    if (/^\d{2}-\d{2}-\d{4}$/.test(deadline)) {
        return deadline;
    }
    const parts = deadline.split('-');
    if (parts.length === 3) {
        const [first, month, last] = parts;
        if (first.length === 4 && last.length === 2) {
            return `${last.padStart(2, '0')}-${month.padStart(2, '0')}-${first}`;
        }
    }
    const parsedDate = new Date(deadline);
    if (!isNaN(parsedDate.getTime())) {
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        return `${day}-${month}-${year}`;
    }
    return deadline;
}

/** Formats a YYYY-MM-DD or ISO deadline string into a human-readable DD Mmm YYYY format. */
function formatDeadline(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

/** Sanitizes string input for DOM storage compliance (S8475). */
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
    const cleanStr = str.replace(/<[^>]*>?/g, '').replace(/[<>'"]/g, '').trim();
    return cleanStr;
}

/** Compress high-res uploaded photos into lightweight ~20KB Base64 JPEG thumbnails so localStorage quota is never exceeded. */
function compressImageToBase64(file, maxWidth = 300, maxHeight = 300, quality = 0.8) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            img.onerror = () => resolve(e.target.result || '');
            img.src = e.target.result;
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
    });
}

/** Formats raw server photo paths (e.g. /opt/backend_app/.../uploads/profile/xxx.png) into valid HTTP web URLs. */
function resolvePhotoUrl(serverPath, fallbackUrl = '') {
    if (fallbackUrl && typeof fallbackUrl === 'string' && fallbackUrl.startsWith("data:")) {
        return fallbackUrl;
    }
    if (!serverPath || typeof serverPath !== 'string') return fallbackUrl;
    if (serverPath.startsWith("http") || serverPath.startsWith("data:")) return serverPath;
    
    const cleanPath = serverPath.replace(/\\/g, '/');
    const uploadsIdx = cleanPath.indexOf("/uploads/");
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, '');

    if (uploadsIdx !== -1) {
        const relPath = cleanPath.substring(uploadsIdx);
        return `${baseUrl}${relPath}`;
    }
    if (cleanPath.startsWith('/')) {
        return `${baseUrl}${cleanPath}`;
    }
    if (cleanPath.length > 0 && !cleanPath.includes(':')) {
        return `${baseUrl}/${cleanPath}`;
    }
    return fallbackUrl;
}



/** Updates the admin_profiles list in localStorage so that the password autofill stays in sync. */
function updateAdminPasswordInStorage(adminEmail, newPassword) {
    const rawData = localStorage.getItem('admin_profiles');
    let adminProfiles = [];
    if (rawData) {
        try {
            const parsed = JSON.parse(rawData);
            if (Array.isArray(parsed)) adminProfiles = parsed;
        } catch {
            adminProfiles = [];
        }
    }
    const cleanEmail = sanitizeStorageString(adminEmail).toLowerCase();
    const cleanPass = sanitizeStorageString(newPassword);
    let adminFound = false;
    const updatedAdmins = adminProfiles.map(p => {
        const pEmail = sanitizeStorageString(p.email).toLowerCase();
        const pPass = sanitizeStorageString(p.password);
        if (pEmail && pEmail === cleanEmail) {
            adminFound = true;
            return { email: cleanEmail, password: cleanPass };
        }
        return { email: pEmail, password: pPass };
    });
    if (!adminFound && cleanEmail) {
        updatedAdmins.push({ email: cleanEmail, password: cleanPass });
    }
    localStorage.setItem('admin_profiles', JSON.stringify(updatedAdmins));
}

/** Returns a favicon-based company logo element with a fallback initial letter. */
function getCompanyLogo(company) {
    const domainMap = {
        'google': 'google.com', 'microsoft': 'microsoft.com', 'amazon': 'amazon.com',
        'infosys': 'infosys.com', 'tcs': 'tcs.com', 'wipro': 'wipro.com',
        'cognizant': 'cognizant.com', 'ibm': 'ibm.com', 'accenture': 'accenture.com',
        'capgemini': 'capgemini.com', 'deloitte': 'deloitte.com', 'oracle': 'oracle.com',
        'sap': 'sap.com', 'meta': 'meta.com', 'apple': 'apple.com', 'uber': 'uber.com',
        'flipkart': 'flipkart.com', 'zoho': 'zoho.com', 'freshworks': 'freshworks.com',
    };
    const lower = company.toLowerCase().trim();
    const domain = domainMap[lower] || `${lower.replace(/\s+/g, '')}.com`;
    const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    return (
        <div style={{ position: 'relative', width: '28px', height: '28px', flexShrink: 0 }}>
            <img
                src={logoUrl}
                alt={company}
                style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', padding: '2px', display: 'block' }}
                onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                }}
            />
            <div className="company-logo default-logo" style={{ display: 'none', position: 'absolute', top: 0, left: 0, width: '28px', height: '28px' }}>
                {company.charAt(0).toUpperCase()}
            </div>
        </div>
    );
}

/** Pure helper: filters and sorts the applicants list based on current search/filter state. */
function filterAndSortApplicants(applicants, searchTerm, filterBy, filterDate, filterCompany) {
    let result = [...applicants];

    if (searchTerm.trim() !== '') {
        const lower = searchTerm.toLowerCase();
        result = result.filter(app =>
            app.name.toLowerCase().includes(lower) ||
            app.company.toLowerCase().includes(lower)
        );
    }

    const filterByLower = filterBy.toLowerCase();
    if (filterByLower === 'by company name') {
        if (filterCompany.trim() !== '') {
            result = result.filter(app =>
                app.company.toLowerCase().includes(filterCompany.toLowerCase())
            );
        }
        result.sort((a, b) => a.company.localeCompare(b.company));
    } else if (filterByLower === 'by date') {
        if (filterDate) {
            result = result.filter(app => app.date === filterDate);
        }
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else {
        result.sort((a, b) => b.match - a.match);
    }

    return result;
}


function AvatarPhotoMenu({ avatarUrl, onUpload, onRemove, children, inputId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                    setShowTooltip(false);
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                style={{ cursor: 'pointer', position: 'relative' }}
            >
                {children}
                <span style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    background: '#2563eb',
                    color: '#ffffff',
                    borderRadius: '50%',
                    padding: '3px',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    <Camera size={11} />
                </span>
            </div>

            {!isOpen && showTooltip && (
                <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#eff6ff',
                    color: '#1e40af',
                    border: '1px solid #bfdbfe',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78125rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.12)',
                    pointerEvents: 'none',
                    zIndex: 100000
                }}>
                    {avatarUrl ? 'Click photo to change or remove photo' : 'Click photo to upload profile photo'}
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderTop: '5px solid #1e40af'
                    }} />
                </div>
            )}

            {isOpen && (
                <div className="avatar-photo-popover" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '8px',
                    background: '#ffffff',
                    borderRadius: '10px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0',
                    padding: '6px',
                    zIndex: 99999,
                    minWidth: '150px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                }}>
                    <label
                        htmlFor={inputId}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            fontSize: '0.8125rem',
                            fontWeight: '600',
                            color: '#1e293b',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            margin: 0
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <Camera size={15} style={{ color: '#2563eb' }} />
                        <span>{avatarUrl ? 'Edit Photo' : 'Upload Photo'}</span>
                    </label>
                    <input
                        id={inputId}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                            const selectedFile = e.target.files?.[0];
                            const target = e.target;
                            setIsOpen(false);
                            if (onUpload) onUpload(e, selectedFile);
                            if (target) target.value = '';
                        }}
                        style={{ display: 'none' }}
                    />

                    {avatarUrl ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                if (onRemove) onRemove();
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                fontSize: '0.8125rem',
                                fontWeight: '600',
                                color: '#ef4444',
                                background: 'none',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <Trash2 size={15} style={{ color: '#ef4444' }} />
                            <span>Remove Photo</span>
                        </button>
                    ) : null}
                </div>
            )}
        </div>
    );
}

function AdminHeader({
    activeTab,
    setActiveTab,
    unreadCount,
    isProfileOpen,
    setIsProfileOpen,
    adminProfile,
    setIsNotificationSidebarOpen,
    setProfileTab,
    setIsEditingProfile,
    setValidationError,
    setIsProfileModalOpen,
    onNavigate,
    handlePhotoUpload,
    handleRemovePhoto,
    isMobileMenuOpen,
    setIsMobileMenuOpen
}) {
    return (
        <header className='admin-header'>
            <div className={`header-container ${activeTab === 'analytics' || activeTab === 'queries' ? 'wide-layout' : ''}`}>
                <div className='header-left-group'>
                    <button
                        type="button"
                        className="header-mobile-toggle"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle navigation menu"
                    >
                        <Menu className="mobile-menu-icon" size={22} />
                    </button>

                    <div className='logo-section' style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <GraduationCap className='logo-icon' size={28} style={{ color: '#2563eb' }} />
                        <span className='college-name' style={{ fontWeight: '800', color: '#2563eb' }}>Campus_Hire</span>
                    </div>
                </div>

                <nav className='navbar-menu-list admin-nav-desktop'>
                    {[
                        { id: 'dashboard', label: 'Dashboard' },
                        { id: 'analytics', label: 'Student Analytics' },
                        { id: 'queries', label: 'Queries & Stories' }
                    ].map(item => (
                        <button
                            type="button"
                            key={item.id}
                            className={`navbar-menu-btn ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: activeTab === item.id ? '#2563eb' : '#64748b',
                                fontWeight: activeTab === item.id ? '600' : '500',
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                padding: '8px 0',
                                position: 'relative',
                                transition: 'color 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <span>{item.label}</span>
                            {activeTab === item.id && (
                                <span style={{
                                    position: 'absolute',
                                    bottom: '-6px',
                                    left: 0,
                                    right: 0,
                                    height: '2px',
                                    backgroundColor: '#2563eb',
                                    borderRadius: '2px'
                                }} />
                            )}
                        </button>
                    ))}
                </nav>

                <div className='header-right'>
                    <span className='role-badge'>Admin</span>

                    <button
                        type="button"
                        className='notification-wrapper'
                        aria-label="Notifications"
                        onClick={() => {
                            setIsNotificationSidebarOpen(true);
                            setIsProfileOpen(false);
                        }}
                        style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                    >
                        <motion.div style={{ display: 'flex' }} whileHover={{ rotate: [0, -15, 15, -15, 15, 0] }} transition={{ duration: 0.5 }}>
                            <Bell className='bell-icon' size={22} />
                        </motion.div>
                        {unreadCount > 0 && (
                            <span className='notification-badge'>{unreadCount}</span>
                        )}
                    </button>

                    <div className='user-profile-container'>
                        <button
                            type="button"
                            className={`user-avatar ${isProfileOpen ? 'active' : ''}`}
                            aria-label="User profile menu"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            style={{ border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                            {adminProfile?.avatarUrl ? (
                                <img src={adminProfile.avatarUrl} alt={adminProfile?.name || 'Admin'} className="avatar-img" />
                            ) : (
                                getInitials(adminProfile?.name, 'AD')
                            )}
                        </button>

                        {isProfileOpen && (
                            <>
                                <button type="button" className='profile-dropdown-backdrop' aria-label="Close profile menu" onClick={() => setIsProfileOpen(false)} style={{ border: 'none', padding: 0 }} />
                                <div className='profile-dropdown-menu'>
                                    <div className='profile-header'>
                                        <AvatarPhotoMenu
                                            avatarUrl={adminProfile?.avatarUrl}
                                            onUpload={(e, file) => {
                                                setIsProfileOpen(false);
                                                handlePhotoUpload(e, file);
                                            }}
                                            onRemove={() => {
                                                setIsProfileOpen(false);
                                                handleRemovePhoto();
                                            }}
                                            inputId="admin-header-photo-input"
                                        >
                                            <span className='profile-avatar-large'>
                                                {adminProfile?.avatarUrl ? (
                                                    <img src={adminProfile.avatarUrl} alt={adminProfile?.name || 'Admin'} className="avatar-img" />
                                                ) : (
                                                    getInitials(adminProfile?.name, 'AD')
                                                )}
                                            </span>
                                        </AvatarPhotoMenu>

                                        <div className='profile-meta-info'>
                                            <span className='profile-name'>{adminProfile.name}</span>
                                            <span className='profile-email'>{adminProfile.email}</span>
                                        </div>
                                    </div>

                                    <div className='profile-divider' />

                                    <div className='profile-options-list'>
                                        <button type="button" className='profile-option-btn' onClick={() => { setIsProfileOpen(false); setProfileTab('edit'); setIsEditingProfile(false); setValidationError(false); setIsProfileModalOpen(true); }}>
                                            <User size={16} />
                                            <span>View Profile</span>
                                        </button>

                                        <button type="button" className='profile-option-btn' onClick={() => { setIsProfileOpen(false); setProfileTab('password'); setValidationError(false); setIsProfileModalOpen(true); }}>
                                            <Lock size={16} />
                                            <span>Change Password</span>
                                        </button>

                                        <div className='profile-divider' />

                                        <button type="button" className='profile-option-btn logout-btn' onClick={() => {
                                            setIsProfileOpen(false);
                                            localStorage.removeItem("token");
                                            localStorage.removeItem("user");
                                            localStorage.removeItem("role");
                                            onNavigate('login');
                                        }}>
                                            <LogOut size={16} />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            className="admin-mobile-drawer-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <motion.aside
                            className="admin-mobile-drawer"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        >
                            <div className="drawer-header">
                                <div className="drawer-logo">
                                    <GraduationCap className="drawer-logo-icon" size={26} />
                                    <span>Campus_Hire</span>
                                </div>
                                <button
                                    type="button"
                                    className="drawer-close-btn"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    aria-label="Close menu"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="drawer-nav">
                                <button
                                    type="button"
                                    className={`drawer-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab('dashboard');
                                        setIsMobileMenuOpen(false);
                                    }}
                                >
                                    <LayoutDashboard className="drawer-item-icon" size={18} />
                                    <span>Dashboard</span>
                                </button>

                                <button
                                    type="button"
                                    className={`drawer-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab('analytics');
                                        setIsMobileMenuOpen(false);
                                    }}
                                >
                                    <BarChart3 className="drawer-item-icon" size={18} />
                                    <span>Student Analytics</span>
                                </button>

                                <button
                                    type="button"
                                    className={`drawer-nav-item ${activeTab === 'queries' ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab('queries');
                                        setIsMobileMenuOpen(false);
                                    }}
                                >
                                    <MessageSquareQuote className="drawer-item-icon" size={18} />
                                    <span>Queries & Stories</span>
                                </button>
                            </div>

                            <hr className="drawer-divider" />

                            <div className="drawer-profile-section">
                                <div className="drawer-user-info">
                                    <div className="drawer-avatar">
                                        {adminProfile?.avatarUrl ? (
                                            <img src={adminProfile.avatarUrl} alt={adminProfile?.name || 'Admin'} className="avatar-img" />
                                        ) : (
                                            getInitials(adminProfile?.name, 'AD')
                                        )}
                                    </div>
                                    <div className="drawer-user-details">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span className="drawer-user-name">{adminProfile?.name || 'Admin'}</span>
                                            <span className="role-badge drawer-role-badge">Admin</span>
                                        </div>
                                        <span className="drawer-user-email">{adminProfile?.email || ''}</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="drawer-nav-item"
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        setProfileTab('edit');
                                        setIsEditingProfile(false);
                                        setValidationError(false);
                                        setIsProfileModalOpen(true);
                                    }}
                                >
                                    <User className="drawer-item-icon" size={18} />
                                    <span>My Profile</span>
                                </button>

                                <button
                                    type="button"
                                    className="drawer-nav-item"
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        setProfileTab('password');
                                        setValidationError(false);
                                        setIsProfileModalOpen(true);
                                    }}
                                >
                                    <Lock className="drawer-item-icon" size={18} />
                                    <span>Change Password</span>
                                </button>

                                <button
                                    type="button"
                                    className="drawer-nav-item drawer-logout-btn"
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        if (onNavigate) onNavigate("landing");
                                    }}
                                >
                                    <LogOut className="drawer-item-icon" size={18} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}

function formatGrowthText(stats, fieldName) {
    if (!stats) return 'Loading...';
    const val = stats[fieldName];
    if (val === undefined || val === null) return 'Loading...';
    const prefix = val >= 0 ? '+' : '';
    return `${prefix}${val}% from last month`;
}

function AdminStatsGrid({ dashboardStats }) {
    return (
        <section className='stats-grid'>
            <motion.div className='stat-card'
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.3 }}>
                <div className='stat-icon-wrapper blue-icon'>
                    <FileText size={20} />
                </div>
                <div className='stat-details'>
                    <span className='stat-label'>Active Posting</span>
                    <h3 className='stat-value'>{dashboardStats ? dashboardStats.totalActivePosts : '-'}</h3>
                    <span className='stat-trend'>
                        <span className='trend-subtext'>
                            {formatGrowthText(dashboardStats, 'activePostsGrowth')}
                        </span>
                    </span>
                </div>
            </motion.div>

            <motion.div className='stat-card'
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.3 }}>
                <div className='stat-icon-wrapper green-icon'>
                    <Users size={20} />
                </div>
                <div className='stat-details'>
                    <span className='stat-label'>Total Students</span>
                    <h3 className='stat-value'>{dashboardStats ? dashboardStats.totalStudents : '-'}</h3>
                    <span className='stat-trend'>
                        <span className='trend-subtext'>
                            {formatGrowthText(dashboardStats, 'studentGrowth')}
                        </span>
                    </span>
                </div>
            </motion.div>

            <motion.div className='stat-card'
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.3 }}>
                <div className='stat-icon-wrapper purple-icon'>
                    <Briefcase size={20} />
                </div>
                <div className='stat-details'>
                    <span className='stat-label'>Resume Received</span>
                    <h3 className='stat-value'>{dashboardStats ? dashboardStats.totalResumeReceived : '-'}</h3>
                    <span className='stat-trend'>
                        <span className='trend-subtext'>
                            {formatGrowthText(dashboardStats, 'resumeGrowth')}
                        </span>
                    </span>
                </div>
            </motion.div>
        </section>
    );
}

function RecentPostingsCard({
    drafts,
    paginatedDrafts,
    draftsCurrentPage,
    totalDraftsPages,
    setDraftsCurrentPage,
    handleEditDraft,
    handlePublishDraft,
    paginatedRecentPosts,
    jobsCurrentPage,
    totalJobsPages,
    setJobsCurrentPage,
    setValidationError,
    setIsSidebarOpen
}) {
    return (
        <div className='lower-left-column'>
            <motion.div className='card-box posting-management-card'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}>
                <div className='card-box-header'>
                    <h4>Placement Posting Management</h4>
                    <button type="button" className='btn-primary' onClick={() => { setValidationError(false); setIsSidebarOpen(true); }}>
                        <Plus size={16} />
                        Create New Job Posting
                    </button>
                </div>

                <div className='drafts-list'>
                    <div className='drafts-section-header'>
                        <h5>Saved Drafts ({drafts.length})</h5>
                    </div>

                    {paginatedDrafts && paginatedDrafts.length > 0 ? (
                        paginatedDrafts.map(draft => (
                            <div key={draft.id} className='draft-item'>
                                <div className='draft-info'>
                                    <span className='badge-draft'>Draft</span>
                                    <div>
                                        <h6>{draft.title}</h6>
                                        <p className='draft-company'>{draft.company} • Saved {draft.lastSaved}</p>
                                    </div>
                                </div>

                                <div className='draft-actions'>
                                    <button
                                        type="button"
                                        className='btn-resume-draft'
                                        onClick={() => handleEditDraft(draft.id)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        className='btn-publish-draft'
                                        onClick={() => handlePublishDraft(draft.id)}
                                    >
                                        Publish
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '12px 0' }}>No drafts saved.</p>
                    )}

                    {totalDraftsPages > 1 && (
                        <div className='pagination-controls' style={{ marginTop: '12px', gap: '6px', justifyContent: 'center' }}>
                            <button
                                type="button"
                                className='btn-pagination'
                                disabled={draftsCurrentPage === 1}
                                onClick={() => setDraftsCurrentPage(prev => Math.max(prev - 1, 1))}
                                title="Previous Page"
                            >
                                &larr;
                            </button>

                            {Array.from({ length: totalDraftsPages }, (_, i) => i + 1).map(pageNum => (
                                <button
                                    key={pageNum}
                                    type="button"
                                    className={`btn-page-number ${draftsCurrentPage === pageNum ? 'active' : ''}`}
                                    onClick={() => setDraftsCurrentPage(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            ))}

                            <button
                                type="button"
                                className='btn-pagination'
                                disabled={draftsCurrentPage === totalDraftsPages || totalDraftsPages === 0}
                                onClick={() => setDraftsCurrentPage(prev => Math.min(prev + 1, totalDraftsPages))}
                                title="Next Page"
                            >
                                &rarr;
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>

            <motion.div className='card-box recent-postings-card'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}>
                <div className='card-box-header'>
                    <h4>Recent Postings</h4>
                </div>

                <div className='postings-list'>
                    {paginatedRecentPosts && paginatedRecentPosts.length > 0 ? (
                        paginatedRecentPosts.map((post, index) => (
                            <motion.div key={post.id || `${post.companyName || 'post'}-${post.jobRole || index}`} className='posting-card-item'
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.08, type: "spring", stiffness: 300, damping: 24 }}>

                                <div className='posting-card-logo-wrap'>
                                    {post.companyName ? (
                                        <img
                                            src={post.logoUrl || `https://www.google.com/s2/favicons?domain=${post.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com&sz=128`}
                                            alt={post.companyName}
                                            style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className='posting-logo-fallback'>
                                            <Briefcase size={18} />
                                        </div>
                                    )}
                                </div>

                                <div className='posting-card-body'>
                                    <h5 className='posting-card-title'>{post.companyName}</h5>
                                    <div className='posting-info-rows'>
                                        {post.location && (
                                            <div className='posting-info-row'>
                                                <span className='posting-info-icon'>📍</span>
                                                <span className='posting-info-label'>Location</span>
                                                <span className='posting-info-sep'>:</span>
                                                <span className='posting-info-value'>{post.location}</span>
                                            </div>
                                        )}
                                        <div className='posting-info-row'>
                                            <span className='posting-info-icon'>👤</span>
                                            <span className='posting-info-label'>Job Role</span>
                                            <span className='posting-info-sep'>:</span>
                                            <span className='posting-info-value'>{post.jobRole}</span>
                                        </div>
                                        {post.deadline && (
                                            <div className='posting-info-row'>
                                                <span className='posting-info-icon'>📅</span>
                                                <span className='posting-info-label'>Deadline</span>
                                                <span className='posting-info-sep'>:</span>
                                                <span className='posting-info-value posting-info-deadline'>{formatDeadline(post.deadline)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className='posting-card-status'>
                                    {post.status?.toLowerCase() === 'expired' ? (
                                        <span className='badge-expired'>Expired</span>
                                    ) : (
                                        <span className='badge-active'>{post.status || 'Active'}</span>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className='no-postings'>No recent postings found.</div>
                    )}
                </div>

                <div className='pagination-controls'>
                    <button
                        type="button"
                        className='btn-pagination'
                        disabled={jobsCurrentPage === 1}
                        onClick={() => setJobsCurrentPage(prev => prev - 1)}
                    >
                        Previous
                    </button>
                    <span className='pagination-info'>
                        Page {jobsCurrentPage} of {totalJobsPages || 1}
                    </span>
                    <button
                        type="button"
                        className='btn-pagination'
                        disabled={jobsCurrentPage === totalJobsPages || totalJobsPages === 0}
                        onClick={() => setJobsCurrentPage(prev => prev + 1)}
                    >
                        Next
                    </button>
                </div>

            </motion.div>
        </div>
    );
}

function ApplicantsMatchingCard({
    searchTerm,
    setSearchTerm,
    filterBy,
    isFilterDropdownOpen,
    setIsFilterDropdownOpen,
    handleFilterByChange,
    filterDate,
    setFilterDate,
    isDatePickerOpen,
    setIsDatePickerOpen,
    datePickerRef,
    calDate,
    handlePrevMonth,
    handleNextMonth,
    firstDayIndex,
    totalDays,
    filterCompany,
    setFilterCompany,
    paginatedApplicants,
    applicantsCurrentPage,
    totalApplicantsPages,
    setApplicantsCurrentPage
}) {
    return (
        <div className='lower-right-column'>
            <motion.div className='card-box applicants-card'
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}>
                <div className='card-box-header search-filter-header'>
                    <h4>Applicants Matching Your Requirements</h4>
                    <div className="search-filter-row">
                        <div className="search-box-wrapper">
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button type="button" className="search-btn">
                                <Search size={16} />
                            </button>
                        </div>

                        <div className="custom-dropdown-container">
                            <span className="filter-label">Filter by</span>
                            <button
                                type="button"
                                className="dropdown-btn"
                                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                            >
                                {filterBy} <ChevronDown size={14} />
                            </button>
                            {isFilterDropdownOpen && (
                                <div className="dropdown-menu">
                                    <button
                                        type="button"
                                        className="dropdown-item"
                                        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                                        onClick={() => handleFilterByChange('By Date')}
                                    >
                                        By Date
                                    </button>
                                    <button
                                        type="button"
                                        className="dropdown-item"
                                        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                                        onClick={() => handleFilterByChange('By Company Name')}
                                    >
                                        By Company Name
                                    </button>
                                </div>
                            )}
                        </div>

                        {filterBy === 'By Date' && (
                            <div className="custom-date-picker-container" ref={datePickerRef}>
                                <button
                                    type="button"
                                    className="date-picker-trigger"
                                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                >
                                    {filterDate ? formatDeadline(filterDate) : 'Select Date...'}
                                    <Calendar size={14} style={{ marginLeft: '8px' }} />
                                </button>

                                {isDatePickerOpen && (
                                    <div className="custom-calendar-popup">
                                        <div className="calendar-header">
                                            <button type="button" onClick={handlePrevMonth}>&lt;</button>
                                            <span>{calDate.toLocaleString('default', { month: 'long' })} {calDate.getFullYear()}</span>
                                            <button type="button" onClick={handleNextMonth}>&gt;</button>
                                        </div>
                                        <div className="calendar-weekdays">
                                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                                <span key={d}>{d}</span>
                                            ))}
                                        </div>
                                        <div className="calendar-days">
                                            {new Array(firstDayIndex).fill(0).map((_, i) => (
                                                <span key={`blank-slot-${calDate.getFullYear()}-${calDate.getMonth()}-${i}`} className="empty-day"></span>
                                            ))}

                                            {new Array(totalDays).fill(0).map((_, i) => {
                                                const day = i + 1;
                                                const dateStr = `${calDate.getFullYear()}-${String(calDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                const isSelected = filterDate === dateStr;
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                const thisDate = new Date(calDate.getFullYear(), calDate.getMonth(), day);
                                                const isPast = thisDate < today;

                                                return (
                                                    <button
                                                        key={dateStr}
                                                        type="button"
                                                        disabled={isPast}
                                                        className={`calendar-day-btn ${isSelected ? 'selected' : ''} ${isPast ? 'disabled-past-day' : ''}`}
                                                        onClick={() => {
                                                            if (isPast) return;
                                                            setFilterDate(dateStr);
                                                            setIsDatePickerOpen(false);
                                                        }}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="calendar-footer">
                                            <button type="button" className="calendar-clear-btn" onClick={() => { setFilterDate(''); setIsDatePickerOpen(false); }}>Clear</button>
                                            <button type="button" className="calendar-today-btn" onClick={() => {
                                                const today = new Date();
                                                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                                setFilterDate(todayStr);
                                                setIsDatePickerOpen(false);
                                            }}>Today</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {filterBy === 'By Company Name' && (
                            <input
                                type="text"
                                className="filter-company-input"
                                placeholder="Enter company name..."
                                value={filterCompany}
                                onChange={(e) => setFilterCompany(e.target.value)}
                            />
                        )}
                    </div>
                </div>

                <div className='applicants-list'>
                    {paginatedApplicants.map((app, index) => (
                        <motion.div key={app.id || `${app.name || 'applicant'}-${index}`} className='applicant-item'
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08, type: "spring", stiffness: 300, damping: 24 }}>

                            <div className='applicant-top'>
                                {getCompanyLogo(app.company)}

                                <div className='applicant-details'>
                                    <h5>{app.company}</h5>

                                    <span className='applicant-name'>👤{app.name}</span>
                                    <span className='applicant-education'>{app.degree} - {app.branch}</span>
                                    <div className='applicant-tags'>
                                        <span className='tag-cgpa'>{app.cgpa}CGPA</span>
                                        <span className='tag-passout'>{app.year}</span>
                                        <span className='tag-date'>📅 {app.date ? formatDeadline(app.date) : ''}</span>
                                    </div>
                                </div>

                                <div className='match-status'>
                                    <span className='match-percent'>
                                        {app.match}% Match
                                    </span>

                                    <div className='progress-bar-bg'>
                                        <div className='progress-bar-fill'
                                            style={{ width: `${app.match}%` }}>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className='pagination-controls'>
                    <button
                        type="button"
                        className='btn-pagination'
                        disabled={applicantsCurrentPage === 1}
                        onClick={() => setApplicantsCurrentPage(prev => prev - 1)}
                    >
                        Previous
                    </button>
                    <span className='pagination-info'>
                        Page {applicantsCurrentPage} of {totalApplicantsPages || 1}
                    </span>
                    <button
                        type="button"
                        className='btn-pagination'
                        disabled={applicantsCurrentPage === totalApplicantsPages || totalApplicantsPages === 0}
                        onClick={() => setApplicantsCurrentPage(prev => prev + 1)}
                    >
                        Next
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function AddJobModal({
    setIsSidebarOpen,
    handlePostJob,
    newJob,
    setNewJob,
    handleInputChange,
    validationError,
    handleSaveDraft,
    modalDatePickerRef,
    isModalDatePickerOpen,
    setIsModalDatePickerOpen,
    modalCalDate,
    handleModalPrevMonth,
    handleModalNextMonth,
    modalFirstDayIndex,
    modalTotalDays
}) {
    return (
        <div
            className='modal-overlay'
            aria-label="Close job modal backdrop"
            onClick={(e) => { if (e.target === e.currentTarget) setIsSidebarOpen(false); }}
        >
            <div className='add-job-modal'>
                <div className='modal-header'>
                    <h4>Add Job Posting</h4>
                    <button type="button" className='close-btn' onClick={() => setIsSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <form className='modal-form' onSubmit={handlePostJob}>
                    <div className='form-group'>
                        <label htmlFor="job-company-name">Company Name <span className="required-star" style={{ color: '#ef4444', marginLeft: '3px' }}>*</span></label>
                        <input type="text"
                            id="job-company-name"
                            name='companyName'
                            placeholder='Enter Company Name'
                            value={newJob.companyName}
                            onChange={handleInputChange}
                            className={validationError && !newJob.companyName?.trim() ? 'error-input' : ''}
                            required />
                    </div>

                    <div className='form-group'>
                        <label htmlFor="job-location">Location <span className="required-star" style={{ color: '#ef4444', marginLeft: '3px' }}>*</span></label>
                        <input type="text"
                            id="job-location"
                            name='location'
                            placeholder='e.g. Bangalore, India (or Remote)'
                            value={newJob.location}
                            onChange={handleInputChange}
                            className={validationError && !newJob.location?.trim() ? 'error-input' : ''}
                            required
                        />
                    </div>

                    <div className='form-group'>
                        <label htmlFor="job-requirements">Job Requirements <span className="required-star" style={{ color: '#ef4444', marginLeft: '3px' }}>*</span></label>
                        <textarea
                            id="job-requirements"
                            name='jobRequirements'
                            placeholder='Enter job requirements'
                            value={newJob.jobRequirements}
                            onChange={handleInputChange}
                            rows={3}
                            className={validationError && !newJob.jobRequirements?.trim() ? 'error-input' : ''}
                            required>
                        </textarea>
                    </div>

                    <div className='form-group'>
                        <label htmlFor="job-role-overview">Job Role Overview <span className="required-star" style={{ color: '#ef4444', marginLeft: '3px' }}>*</span></label>
                        <textarea
                            id="job-role-overview"
                            name="jobRoleOverview"
                            placeholder='Enter job role overview'
                            value={newJob.jobRoleOverview}
                            onChange={handleInputChange}
                            rows={3}
                            className={validationError && !newJob.jobRoleOverview?.trim() ? 'error-input' : ''}
                            required>
                        </textarea>
                    </div>

                    <div className='form-section-title'>Eligibility Criteria</div>

                    <div className='form-row'>
                        <div className='form-group half-width'>
                            <label htmlFor="job-degree">Degree <span className="required-star" style={{ color: '#ef4444', marginLeft: '3px' }}>*</span></label>
                            <select id="job-degree" name="degree" value={newJob.degree} onChange={handleInputChange} className={validationError && !newJob.degree?.trim() ? 'error-input' : ''} required>
                                <option value="">Select degree</option>
                                <option value="BCA">BCA</option>
                                <option value="MCA">MCA</option>
                                <option value="BSC Cs">BSc CS</option>
                                <option value="IT">IT</option>
                                <option value="MSc">MSc</option>
                            </select>
                        </div>

                        <div className='form-group half-width'>
                            <label htmlFor="job-branch">Branch <span className="required-star" style={{ color: '#ef4444', marginLeft: '3px' }}>*</span></label>
                            <select id="job-branch" name="branch" value={newJob.branch} onChange={handleInputChange} className={validationError && !newJob.branch?.trim() ? 'error-input' : ''} required>
                                <option value="">Select branch</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Computer Applications">Computer Applications</option>
                            </select>
                        </div>
                    </div>

                    <div className='form-row'>
                        <div className='form-group half-width'>
                            <label htmlFor="job-min-cgpa">Min CGPA <span className="required-star" style={{ color: '#ef4444', marginLeft: '3px' }}>*</span></label>
                            <input
                                type="text"
                                id="job-min-cgpa"
                                name="minCgpa"
                                placeholder="Enter minimum CGPA"
                                value={newJob.minCgpa}
                                onChange={handleInputChange}
                                autoComplete="off"
                                className={validationError && !newJob.minCgpa?.toString().trim() ? 'error-input' : ''}
                                required
                            />
                        </div>

                        <div className='form-group half-width'>
                            <label htmlFor="job-passing-year">Passing Year <span className="required-star" style={{ color: '#ef4444', marginLeft: '3px' }}>*</span></label>
                            <select id="job-passing-year" name="passingYear" value={newJob.passingYear} onChange={handleInputChange} className={validationError && !newJob.passingYear?.toString().trim() ? 'error-input' : ''} required>
                                <option value="">Select Passing Year</option>
                                <option value="2024">2024</option>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                            </select>
                        </div>
                    </div>

                    <div className='form-row'>
                        <div className='form-group half-width'>
                            <label htmlFor="job-experience">Experience <span className="required-star" style={{ color: '#ef4444', marginLeft: '3px' }}>*</span></label>
                            <select id="job-experience" name="experience" value={newJob.experience} onChange={handleInputChange} className={validationError && !newJob.experience?.trim() ? 'error-input' : ''} required>
                                <option value="">Select experience</option>
                                <option value="Fresher">Fresher</option>
                                <option value="1 Year">1 Year</option>
                                <option value="2 Year+">2 Year+</option>
                            </select>
                        </div>

                        <div className='form-group half-width'>
                            <label htmlFor="job-deadline-btn">Deadline <span className="required-star" style={{ color: '#ef4444', marginLeft: '3px' }}>*</span></label>
                            <div className="custom-date-picker-container" ref={modalDatePickerRef} style={{ width: '100%', position: 'relative' }}>
                                <button
                                    type="button"
                                    id="job-deadline-btn"
                                    className={`date-picker-trigger ${validationError && !newJob.deadline?.trim() ? 'error-input' : ''}`}
                                    onClick={() => setIsModalDatePickerOpen(!isModalDatePickerOpen)}
                                    style={{ width: '100%', justifyContent: 'space-between' }}
                                >
                                    {newJob.deadline ? formatDeadline(newJob.deadline) : 'Select Deadline...'}
                                    <Calendar size={14} />
                                </button>

                                {isModalDatePickerOpen && (
                                    <div className="custom-calendar-popup">
                                        <div className="calendar-header">
                                            <button type="button" onClick={handleModalPrevMonth}>&lt;</button>
                                            <span>{modalCalDate.toLocaleString('default', { month: 'long' })} {modalCalDate.getFullYear()}</span>
                                            <button type="button" onClick={handleModalNextMonth}>&gt;</button>
                                        </div>
                                        <div className="calendar-weekdays">
                                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                                <span key={d}>{d}</span>
                                            ))}
                                        </div>
                                        <div className="calendar-days">
                                            {new Array(modalFirstDayIndex).fill(0).map((_, i) => (
                                                <span key={`modal-blank-slot-${modalCalDate.getFullYear()}-${modalCalDate.getMonth()}-${i}`} className="empty-day"></span>
                                            ))}

                                            {new Array(modalTotalDays).fill(0).map((_, i) => {
                                                const day = i + 1;
                                                const dateStr = `${modalCalDate.getFullYear()}-${String(modalCalDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                const isSelected = newJob.deadline === dateStr;
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                const thisDate = new Date(modalCalDate.getFullYear(), modalCalDate.getMonth(), day);
                                                const isPast = thisDate < today;

                                                return (
                                                    <button
                                                        type="button"
                                                        key={dateStr}
                                                        disabled={isPast}
                                                        className={`calendar-day-btn ${isSelected ? 'selected' : ''} ${isPast ? 'disabled-past-day' : ''}`}
                                                        onClick={() => {
                                                            if (isPast) return;
                                                            setNewJob(prev => ({ ...prev, deadline: dateStr }));
                                                            setIsModalDatePickerOpen(false);
                                                        }}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="calendar-footer">
                                            <button type="button" className="calendar-clear-btn" onClick={() => { setNewJob(prev => ({ ...prev, deadline: '' })); setIsModalDatePickerOpen(false); }}>Clear</button>
                                            <button type="button" className="calendar-today-btn" onClick={() => {
                                                const today = new Date();
                                                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                                setNewJob(prev => ({ ...prev, deadline: todayStr }));
                                                setIsModalDatePickerOpen(false);
                                            }}>Today</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className='form-actions'>
                        <button type='button' className='btn-cancel' onClick={() => setIsSidebarOpen(false)}>
                            Cancel
                        </button>

                        <button type='button' className='btn-save-draft-form' onClick={handleSaveDraft}>
                            Save Draft
                        </button>

                        <button type='submit' className='btn-post'>
                            Post Job
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ProfileEditForm({ adminProfile, handleProfileChange, handleUpdateProfile, setIsEditingProfile, handlePhotoUpload, handleRemovePhoto }) {
    return (
        <form className='modal-form' onSubmit={handleUpdateProfile}>
            <div className="photo-upload-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '20px' }}>
                <AvatarPhotoMenu
                    avatarUrl={adminProfile.avatarUrl}
                    onUpload={handlePhotoUpload}
                    onRemove={handleRemovePhoto}
                    inputId="admin-edit-form-photo-input"
                >
                    <div className="photo-preview-circle" style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#2563eb', color: '#ffffff', fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {adminProfile?.avatarUrl ? (
                            <img src={adminProfile.avatarUrl} alt={adminProfile?.name || 'Admin'} className="avatar-img" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            getInitials(adminProfile?.name, 'AD')
                        )}
                    </div>
                </AvatarPhotoMenu>
                <div>
                    <span style={{ display: 'block', fontSize: '0.9375rem', fontWeight: '700', color: '#0f172a' }}>{adminProfile?.name}</span>
                    <span style={{ display: 'block', fontSize: '0.8125rem', color: '#64748b' }}>
                        {adminProfile?.avatarUrl ? 'Click profile photo to change or remove photo' : 'Click profile photo to upload photo'}
                    </span>
                </div>
            </div>

            <div className='form-group'>
                <label htmlFor="admin-profile-name">Full Name</label>
                <input
                    id="admin-profile-name"
                    type="text"
                    name="name"
                    value={adminProfile?.name || ''}
                    onChange={handleProfileChange}
                    required
                />
            </div>
            <div className='form-group'>
                <label htmlFor="admin-profile-email">Email Address</label>
                <input
                    id="admin-profile-email"
                    type="email"
                    name="email"
                    value={adminProfile?.email || ''}
                    onChange={handleProfileChange}
                    required
                />
            </div>
            <div className='form-group'>
                <label htmlFor="admin-profile-phone">Phone Number</label>
                <input
                    id="admin-profile-phone"
                    type="text"
                    name="phone"
                    value={adminProfile?.phone || ''}
                    onChange={handleProfileChange}
                />
            </div>
            <div className='form-group'>
                <label htmlFor="admin-profile-role">Role</label>
                <input
                    id="admin-profile-role"
                    type="text"
                    value={adminProfile?.role || 'System Administrator'}
                    disabled
                    className="disabled-input"
                />
            </div>

            <div className='form-actions'>
                <button type='button' className='btn-cancel' onClick={() => setIsEditingProfile(false)}>
                    Cancel
                </button>
                <button type='submit' className='btn-confirm-apply' style={{ borderRadius: '9999px' }}>
                    Save Changes
                </button>
            </div>
        </form>
    );
}

function ProfileDetailsView({ adminProfile, handleCloseProfileModal, handlePhotoUpload, handleRemovePhoto }) {
    return (
        <div className='modal-form'>
            <div className="photo-upload-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '20px' }}>
                <AvatarPhotoMenu
                    avatarUrl={adminProfile?.avatarUrl}
                    onUpload={handlePhotoUpload}
                    onRemove={handleRemovePhoto}
                    inputId="admin-details-photo-input"
                >
                    <div className="photo-preview-circle" style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#2563eb', color: '#ffffff', fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {adminProfile?.avatarUrl ? (
                            <img src={adminProfile.avatarUrl} alt={adminProfile?.name || 'Admin'} className="avatar-img" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            getInitials(adminProfile?.name, 'AD')
                        )}
                    </div>
                </AvatarPhotoMenu>
                <div>
                    <span style={{ display: 'block', fontSize: '0.9375rem', fontWeight: '700', color: '#0f172a' }}>{adminProfile?.name}</span>
                    <span style={{ display: 'block', fontSize: '0.8125rem', color: '#64748b' }}>{adminProfile?.role}</span>
                </div>
            </div>

            <div className='form-group'>
                <span style={{ display: 'block', marginBottom: '6px', fontSize: '0.8125rem', fontWeight: '600', color: '#64748b' }}>Full Name</span>
                <div className="profile-detail-value" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', color: '#0f172a', border: '1px solid #e2e8f0' }}>{adminProfile.name}</div>
            </div>
            <div className='form-group'>
                <span style={{ display: 'block', marginBottom: '6px', fontSize: '0.8125rem', fontWeight: '600', color: '#64748b' }}>Email Address</span>
                <div className="profile-detail-value" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', color: '#0f172a', border: '1px solid #e2e8f0' }}>{adminProfile.email}</div>
            </div>
            <div className='form-group'>
                <span style={{ display: 'block', marginBottom: '6px', fontSize: '0.8125rem', fontWeight: '600', color: '#64748b' }}>Phone Number</span>
                <div className="profile-detail-value" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', color: '#0f172a', border: '1px solid #e2e8f0' }}>{adminProfile.phone}</div>
            </div>
            <div className='form-group'>
                <span style={{ display: 'block', marginBottom: '6px', fontSize: '0.8125rem', fontWeight: '600', color: '#64748b' }}>Role</span>
                <div className="profile-detail-value" style={{ padding: '12px 16px', background: '#f1f5f9', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', color: '#64748b', border: '1px solid #e2e8f0' }}>{adminProfile.role}</div>
            </div>

            <div className='form-actions'>
                <button type='button' className='btn-cancel' onClick={handleCloseProfileModal} style={{ width: '100%', textAlign: 'center' }}>
                    Close
                </button>
            </div>
        </div>
    );
}

function ProfileChangePasswordForm({
    passwordData,
    handlePasswordChange,
    showAdminCurrentPassword,
    setShowAdminCurrentPassword,
    showAdminNewPassword,
    setShowAdminNewPassword,
    showAdminConfirmPassword,
    setShowAdminConfirmPassword,
    validationError,
    handleUpdatePassword,
    handleCloseProfileModal
}) {
    return (
        <form className='modal-form' onSubmit={handleUpdatePassword}>
            <div className='form-group'>
                <label htmlFor="admin-current-password">Current Password</label>
                <div className="password-input-wrapper">
                    <input
                        id="admin-current-password"
                        type={showAdminCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        placeholder="Enter current password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                    />
                    <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowAdminCurrentPassword(!showAdminCurrentPassword)}
                    >
                        {showAdminCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>
            <div className='form-group'>
                <label htmlFor="admin-new-password">New Password</label>
                <div className="password-input-wrapper">
                    <input
                        id="admin-new-password"
                        type={showAdminNewPassword ? "text" : "password"}
                        name="newPassword"
                        placeholder="Enter new password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={validationError && passwordData.newPassword !== passwordData.confirmPassword ? 'error-input' : ''}
                        required
                    />
                    <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowAdminNewPassword(!showAdminNewPassword)}
                    >
                        {showAdminNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>
            <div className='form-group'>
                <label htmlFor="admin-confirm-password">Confirm New Password</label>
                <div className="password-input-wrapper">
                    <input
                        id="admin-confirm-password"
                        type={showAdminConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm new password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={validationError && passwordData.newPassword !== passwordData.confirmPassword ? 'error-input' : ''}
                        required
                    />
                    <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowAdminConfirmPassword(!showAdminConfirmPassword)}
                    >
                        {showAdminConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>

            <div className='form-actions'>
                <button type='button' className='btn-cancel' onClick={handleCloseProfileModal}>
                    Cancel
                </button>
                <button type='submit' className='btn-post'>
                    Update Password
                </button>
            </div>
        </form>
    );
}

function renderProfileModalBody(props) {
    const {
        profileTab,
        isEditingProfile,
        adminProfile,
        handleProfileChange,
        handleUpdateProfile,
        setIsEditingProfile,
        handleCloseProfileModal,
        passwordData,
        handlePasswordChange,
        showAdminCurrentPassword,
        setShowAdminCurrentPassword,
        showAdminNewPassword,
        setShowAdminNewPassword,
        showAdminConfirmPassword,
        setShowAdminConfirmPassword,
        validationError,
        handleUpdatePassword,
        handlePhotoUpload,
        handleRemovePhoto
    } = props;

    if (profileTab !== 'edit') {
        return (
            <ProfileChangePasswordForm
                passwordData={passwordData}
                handlePasswordChange={handlePasswordChange}
                showAdminCurrentPassword={showAdminCurrentPassword}
                setShowAdminCurrentPassword={setShowAdminCurrentPassword}
                showAdminNewPassword={showAdminNewPassword}
                setShowAdminNewPassword={setShowAdminNewPassword}
                showAdminConfirmPassword={showAdminConfirmPassword}
                setShowAdminConfirmPassword={setShowAdminConfirmPassword}
                validationError={validationError}
                handleUpdatePassword={handleUpdatePassword}
                handleCloseProfileModal={handleCloseProfileModal}
            />
        );
    }

    if (isEditingProfile) {
        return (
            <ProfileEditForm
                adminProfile={adminProfile}
                handleProfileChange={handleProfileChange}
                handleUpdateProfile={handleUpdateProfile}
                setIsEditingProfile={setIsEditingProfile}
                handlePhotoUpload={handlePhotoUpload}
                handleRemovePhoto={handleRemovePhoto}
            />
        );
    }

    return (
        <ProfileDetailsView
            adminProfile={adminProfile}
            handleCloseProfileModal={handleCloseProfileModal}
            handlePhotoUpload={handlePhotoUpload}
            handleRemovePhoto={handleRemovePhoto}
        />
    );
}

function ProfileSettingsModal({
    isProfileModalOpen,
    handleCloseProfileModal,
    profileTab,
    isEditingProfile,
    setIsEditingProfile,
    adminProfile,
    handleProfileChange,
    handleUpdateProfile,
    passwordData,
    handlePasswordChange,
    showAdminCurrentPassword,
    setShowAdminCurrentPassword,
    showAdminNewPassword,
    setShowAdminNewPassword,
    showAdminConfirmPassword,
    setShowAdminConfirmPassword,
    validationError,
    handleUpdatePassword,
    handlePhotoUpload,
    handleRemovePhoto
}) {
    if (!isProfileModalOpen) return null;

    let modalTitle = 'Admin Profile Details';
    if (profileTab === 'edit' && isEditingProfile) {
        modalTitle = 'Edit Admin Profile';
    } else if (profileTab !== 'edit') {
        modalTitle = 'Change Password';
    }

    return (
        <div
            className='modal-overlay'
            aria-label="Close profile settings backdrop"
            onClick={(e) => { if (e.target === e.currentTarget) handleCloseProfileModal(); }}
        >
            <div className='add-job-modal profile-settings-modal'>
                <div className='modal-header' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>{modalTitle}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {profileTab === 'edit' && !isEditingProfile && (
                            <button
                                type="button"
                                className="btn-confirm-apply"
                                style={{
                                    padding: '6px 14px',
                                    fontSize: '0.8125rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    borderRadius: '9999px',
                                    margin: 0,
                                    cursor: 'pointer'
                                }}
                                onClick={() => setIsEditingProfile(true)}
                            >
                                <Edit3 size={14} />
                                <span>Edit Profile</span>
                            </button>
                        )}
                        <button type="button" className='close-btn' onClick={handleCloseProfileModal}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {renderProfileModalBody({
                    profileTab,
                    isEditingProfile,
                    adminProfile,
                    handleProfileChange,
                    handleUpdateProfile,
                    setIsEditingProfile,
                    handleCloseProfileModal,
                    passwordData,
                    handlePasswordChange,
                    showAdminCurrentPassword,
                    setShowAdminCurrentPassword,
                    showAdminNewPassword,
                    setShowAdminNewPassword,
                    showAdminConfirmPassword,
                    setShowAdminConfirmPassword,
                    validationError,
                    handleUpdatePassword,
                    handlePhotoUpload,
                    handleRemovePhoto
                })}
            </div>
        </div>
    );
}

function formatNotificationTimestamp(notif) {
    if (!notif) return '';
    if (notif.displayDate) {
        return `${notif.displayDate}${notif.displayTime ? ' at ' + notif.displayTime : ''}`;
    }
    if (notif.createdDate) {
        const timePart = notif.createdTime ? ` at ${notif.createdTime}` : '';
        return `${notif.createdDate}${timePart}`;
    }
    if (notif.createdAt) {
        const d = new Date(notif.createdAt);
        if (!isNaN(d.getTime())) {
            const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            return `${dateStr} at ${timeStr}`;
        }
        return new Date(notif.createdAt).toLocaleString();
    }
    return notif.date || '';
}

function NotificationSidebar({
    isNotificationSidebarOpen,
    setIsNotificationSidebarOpen,
    unreadCount,
    handleMarkAllRead,
    notifications
}) {
    if (!isNotificationSidebarOpen) return null;

    return (
        <div className="sd-notification-sidebar-overlay" aria-label="Close notifications" onClick={(e) => { if (e.target === e.currentTarget) setIsNotificationSidebarOpen(false); }}>
            <div className="sd-notification-sidebar">
                <div className="sidebar-header">
                    <div className="header-title-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Bell size={20} className="sidebar-bell-icon" style={{ color: '#2563eb' }} />
                        <h4 style={{ margin: 0 }}>Notifications</h4>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllRead}
                                style={{ fontSize: '0.8rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Mark all as read
                            </button>
                        )}
                        <button type="button" className="btn-close-sidebar" onClick={() => setIsNotificationSidebarOpen(false)}>
                            <X size={18} />
                        </button>
                    </div>
                </div>
                <div className="sidebar-body">
                    {notifications.length === 0 ? (
                        <p className="no-notifications">No new notifications</p>
                    ) : (
                        notifications.map((notif, index) => {
                            const isRead = notif.read || notif.status === 'read';
                            return (
                                <motion.div
                                    key={notif.id}
                                    className="notification-item"
                                    initial={{ opacity: 0, y: -30 }}
                                    animate={{ opacity: isRead ? 0.6 : 1, y: 0 }}
                                    transition={{ delay: index * 0.08, type: "spring", stiffness: 300, damping: 24 }}
                                    style={{ borderLeft: isRead ? '4px solid transparent' : '4px solid #2563eb' }}
                                >
                                    <p style={{ fontWeight: isRead ? 'normal' : '600' }}>{notif.message || notif.text}</p>
                                    <span className="notif-date">{formatNotificationTimestamp(notif)}</span>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

function AdminDashboard({ onNavigate }) {
    //1. Sidebar form visibility
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Active menu tab state
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    //2. Search and filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBy, setFilterBy] = useState('By Date');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

    //3. Mock job postings list
    const [jobs, setJobs] = useState([
        {
            id: 1, title: 'Software Developer Intern',
            company: 'Google', status: 'Active',
            date: '05 July 2026',
            deadline: '2026-07-20',
            logoUrl: 'https://www.google.com/s2/favicons?domain=google.com&sz=128',
            location: 'Bangalore, India'
        },
        {
            id: 2, title: 'Data Analyst',
            company: 'Microsoft', status: 'Active',
            date: '04 July 2026',
            deadline: '2026-07-18',
            logoUrl: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=128',
            location: 'Hyderabad, India'
        },
        {
            id: 3, title: 'SDE Intern',
            company: 'Infosys', status: 'Active',
            date: '03 July 2026',
            deadline: '2026-07-15',
            logoUrl: 'https://www.google.com/s2/favicons?domain=infosys.com&sz=128',
            location: 'Pune, India'
        }
    ]);

    const [drafts, setDrafts] = useState([]);
    const [draftsCurrentPage, setDraftsCurrentPage] = useState(1);
    const DRAFTS_PER_PAGE = 3;
    const [dashboardStats, setDashboardStats] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [filteredApplicants, setFilteredApplicants] = useState([]);

    const [newJob, setNewJob] = useState({
        companyName: '', location: '', jobRequirements: '', jobRoleOverview: '',
        degree: '', branch: '', minCgpa: '', passingYear: '', experience: '', deadline: ''
    });

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [validationError, setValidationError] = useState(false);

    const triggerToast = (msg, type = 'success') => {
        setToastMessage(msg);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationSidebarOpen, setIsNotificationSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const prevUnreadCountRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const response = await getAdminNotifications();
            if (response.data) {
                const fallback = response.data.content ? response.data.content : [];
                const data = Array.isArray(response.data) ? response.data : fallback;
                const sorted = data.sort((a, b) => parseDateStr(b.createdDate, b.createdTime) - parseDateStr(a.createdDate, a.createdTime));

                const uniqueMap = new Map();
                sorted.forEach(notif => {
                    const msgKey = `${(notif.message || notif.text || '').trim()}-${notif.createdDate || notif.createdAt || ''}-${notif.createdTime || ''}`;
                    const idKey = notif.id ? `id-${notif.id}` : null;
                    if (idKey && uniqueMap.has(idKey)) return;
                    if (uniqueMap.has(msgKey)) return;

                    if (idKey) uniqueMap.set(idKey, notif);
                    uniqueMap.set(msgKey, notif);
                });
                const deduplicated = Array.from(new Set(uniqueMap.values()));

                const localizedData = deduplicated.map(notif => localizeNotification(notif));
                setNotifications(localizedData);
            }

            const countResponse = await getAdminUnreadCount();
            if (countResponse.data !== undefined) {
                const count = typeof countResponse.data === 'object' ? (countResponse.data.count || countResponse.data.unreadCount || 0) : countResponse.data;
                if (prevUnreadCountRef.current !== null && count > prevUnreadCountRef.current) {
                    playNotificationAlert();
                }
                prevUnreadCountRef.current = count;
                setUnreadCount(count);
            }
        } catch (error) {
            console.error("Error fetching admin notifications or unread count:", error);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchNotifications();
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await markAllAdminNotificationsAsRead();
            await fetchNotifications();
            setToastMessage("All admin notifications marked as read");
            setToastType("success");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (error) {
            console.error("Error marking all admin read:", error);
        }
    };

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileTab, setProfileTab] = useState('edit');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const loggedInAdmin = JSON.parse(localStorage.getItem("admin_user") || "{}");

    const [adminProfile, setAdminProfile] = useState({
        name: loggedInAdmin.fullName || 'Admin',
        email: loggedInAdmin.email || '',
        phone: loggedInAdmin.phone || '',
        role: 'System Administrator',
        avatarUrl: loggedInAdmin.avatarUrl || localStorage.getItem("admin_avatar") || ''
    });

    const handleAdminPhotoUpload = async (e, explicitFile) => {
        const file = explicitFile || e?.target?.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            triggerToast("Image size must be less than 5MB", "error");
            return;
        }
        const storedAdmin = JSON.parse(localStorage.getItem("admin_user") || "{}");
        const hasExistingPhoto = Boolean(
            adminProfile?.avatarUrl || 
            localStorage.getItem("admin_avatar") || 
            storedAdmin.avatarUrl
        );
        try {
            const compressedBase64 = await compressImageToBase64(file);
            const base64 = compressedBase64 || '';
            if (base64) {
                setAdminProfile(prev => ({ ...prev, avatarUrl: base64 }));
                try { localStorage.setItem("admin_avatar", base64); } catch {}

                const rawUser = localStorage.getItem("admin_user");
                let userObj = {};
                if (rawUser) {
                    try { userObj = JSON.parse(rawUser) || {}; } catch {}
                }
                userObj.avatarUrl = base64;
                try { localStorage.setItem("admin_user", JSON.stringify(userObj)); } catch {}
            }

            // Call backend API (POST /admin/profile/photo)
            try {
                const res = await uploadAdminProfilePhoto(file);
                const serverPhotoPath = res?.data?.photoUrl || res?.data?.avatarUrl || res?.data?.photoPath || res?.data?.url || (typeof res?.data === 'string' ? res.data : null);
                const finalPhotoUrl = resolvePhotoUrl(serverPhotoPath, base64);
                if (finalPhotoUrl) {
                    setAdminProfile(prev => ({ ...prev, avatarUrl: finalPhotoUrl }));
                    try { localStorage.setItem("admin_avatar", finalPhotoUrl); } catch {}
                }
            } catch (apiErr) {
                console.warn("Backend admin photo upload warning:", apiErr);
            }

            triggerToast(hasExistingPhoto ? "Profile photo edited successfully!" : "Profile photo uploaded successfully!", 'success');
        } catch (uploadErr) {
            console.error("Admin photo upload error:", uploadErr);
        }
    };

    const handleAdminRemovePhoto = async () => {
        setAdminProfile(prev => ({ ...prev, avatarUrl: '' }));
        localStorage.removeItem("admin_avatar");
        const rawUser = localStorage.getItem("admin_user");
        let userObj = {};
        if (rawUser) {
            try { userObj = JSON.parse(rawUser) || {}; } catch {}
        }
        delete userObj.avatarUrl;
        localStorage.setItem("admin_user", JSON.stringify(userObj));

        // Call backend API (DELETE /admin/profile/photo)
        try {
            await deleteAdminProfilePhoto();
        } catch (apiErr) {
            console.warn("Backend admin photo delete warning:", apiErr);
        }

        triggerToast("Profile photo removed successfully!", "success");
    };

    const [passwordData, setPasswordData] = useState({
        currentPassword: '', newPassword: '', confirmPassword: ''
    });

    const [recentPosts, setRecentPosts] = useState([]);

    const fetchRecentPosts = async () => {
        try {
            const response = await getAdminRecentPosts();
            if (response && response.data) {
                setRecentPosts(response.data);
            }
        } catch (error) {
            console.error("Error fetching recent posts:", error);
        }
    };

    const fetchDraftsData = async () => {
        try {
            const response = await getDrafts();
            let draftsData = [];
            const rawData = response.data;
            if (Array.isArray(rawData)) {
                draftsData = rawData;
            } else if (rawData && Array.isArray(rawData.drafts)) {
                draftsData = rawData.drafts;
            } else if (rawData && Array.isArray(rawData.content)) {
                draftsData = rawData.content;
            }

            const mappedDrafts = draftsData.map(d => ({
                id: d.id,
                title: d.jobRoleOverview || d.title || d.jobRole || 'Untitled Draft',
                company: d.companyName || d.company || 'Unknown Company',
                location: d.location || "Remote",
                requirements: d.jobRequirements || "",
                degree: d.degree || "",
                branch: d.branch || "",
                cgpa: d.minCgpa || "",
                year: d.passingYear || "",
                experience: d.experience || "",
                deadline: d.deadline || "",
                lastSaved: d.savedTime || (d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Saved')
            }));
            setDrafts(mappedDrafts);
        } catch (error) {
            console.error("Failed to fetch drafts", error);
        }
    };

    const fetchApplicantsMatching = async () => {
        try {
            const response = await getAdminApplicantsMatching();
            if (response.data && Array.isArray(response.data)) {
                const mapped = response.data.map(app => ({
                    id: app.id || crypto.randomUUID(),
                    name: app.studentName || '',
                    company: app.companyName || app.jobRole || '',
                    degree: app.course || app.degree || '',
                    branch: app.department || app.branch || '',
                    cgpa: app.cgpa ?? '',
                    year: app.passingYear || '',
                    match: app.matchPercentage ?? app.matchScore ?? '',
                    date: app.appliedAt || app.appliedDate || ''
                }));
                setApplicants(mapped);
                setFilteredApplicants(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch matching applicants", error);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const response = await getAdminStudentAnalyticsDashboard();
            if (response && response.data) {
                setDashboardStats(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch admin dashboard stats:", error);
        }
    };

    useEffect(() => {
        const fetchAdminProfile = async () => {
            try {
                const response = await getAdminProfile();
                if (response.data) {
                    const storedAdmin = JSON.parse(localStorage.getItem("admin_user") || "{}");
                    const savedAvatar = localStorage.getItem("admin_avatar") || storedAdmin.avatarUrl || "";
                    const rawPhoto = response.data.photoPath || response.data.profilePhoto || response.data.photo || response.data.avatarUrl || "";
                    const resolvedPhoto = resolvePhotoUrl(rawPhoto, savedAvatar);
                    const finalAvatar = resolvedPhoto || savedAvatar || storedAdmin.avatarUrl || "";
                    setAdminProfile(prev => ({
                        ...prev,
                        name: response.data.fullName || response.data.name || prev.name,
                        email: response.data.email || prev.email,
                        phone: response.data.mobile || response.data.phone || prev.phone,
                        role: response.data.role || prev.role,
                        avatarUrl: finalAvatar || prev.avatarUrl || ""
                    }));

                    if (finalAvatar) {
                        try {
                            localStorage.setItem("admin_avatar", finalAvatar);
                            storedAdmin.avatarUrl = finalAvatar;
                            localStorage.setItem("admin_user", JSON.stringify(storedAdmin));
                        } catch {}
                    }
                }
            } catch (error) {
                console.error("Error fetching admin profile:", error);
            }
        };

        fetchAdminProfile();
        fetchRecentPosts();
        fetchApplicantsMatching();
        fetchDraftsData();
        fetchDashboardStats();

        let pollInterval;
        if (import.meta.env.MODE !== 'test') {
            pollInterval = setInterval(() => {
                if (document.hidden) return;
                fetchRecentPosts();
                fetchApplicantsMatching();
                fetchDraftsData();
                fetchDashboardStats();
                fetchNotifications();
            }, 5000);
        }

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchRecentPosts();
                fetchApplicantsMatching();
                fetchDraftsData();
                fetchDashboardStats();
                fetchNotifications();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('focus', handleVisibility);

        return () => {
            if (pollInterval) clearInterval(pollInterval);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('focus', handleVisibility);
        };
    }, []);

    const [showAdminCurrentPassword, setShowAdminCurrentPassword] = useState(false);
    const [showAdminNewPassword, setShowAdminNewPassword] = useState(false);
    const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false);

    const [jobsCurrentPage, setJobsCurrentPage] = useState(1);
    const JOBS_PER_PAGE = 3;

    const [applicantsCurrentPage, setApplicantsCurrentPage] = useState(1);
    const APPLICANTS_PER_PAGE = 4;

    const [filterDate, setFilterDate] = useState('');
    const [filterCompany, setFilterCompany] = useState('');

    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [calDate, setCalDate] = useState(new Date());
    const datePickerRef = useRef(null);

    const handlePrevMonth = () => {
        setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1));
    };

    const totalDays = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setIsDatePickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const [isModalDatePickerOpen, setIsModalDatePickerOpen] = useState(false);
    const [modalCalDate, setModalCalDate] = useState(new Date());
    const [editingDraftId, setEditingDraftId] = useState(null);
    const modalDatePickerRef = useRef(null);

    const handleModalPrevMonth = () => {
        setCalDate(new Date(modalCalDate.getFullYear(), modalCalDate.getMonth() - 1, 1));
        setModalCalDate(new Date(modalCalDate.getFullYear(), modalCalDate.getMonth() - 1, 1));
    };

    const handleModalNextMonth = () => {
        setCalDate(new Date(modalCalDate.getFullYear(), modalCalDate.getMonth() + 1, 1));
        setModalCalDate(new Date(modalCalDate.getFullYear(), modalCalDate.getMonth() + 1, 1));
    };

    const modalTotalDays = new Date(modalCalDate.getFullYear(), modalCalDate.getMonth() + 1, 0).getDate();
    const modalFirstDayIndex = new Date(modalCalDate.getFullYear(), modalCalDate.getMonth(), 1).getDay();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalDatePickerRef.current && !modalDatePickerRef.current.contains(event.target)) {
                setIsModalDatePickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleFilterByChange = (value) => {
        setFilterBy(value);
        setFilterDate('');
        setFilterCompany('');
        setIsFilterDropdownOpen(false);
    };

    useEffect(() => {
        const result = filterAndSortApplicants(applicants, searchTerm, filterBy, filterDate, filterCompany);
        const timer = setTimeout(() => {
            setApplicantsCurrentPage(1);
            setFilteredApplicants(result);
        }, 0);
        return () => clearTimeout(timer);
    }, [searchTerm, filterBy, filterDate, filterCompany, applicants]);



    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewJob(prev => ({ ...prev, [name]: value }));
    };

    const handlePostJob = async (e) => {
        e.preventDefault();

        if (
            !newJob.companyName?.trim() ||
            !newJob.location?.trim() ||
            !newJob.jobRequirements?.trim() ||
            !newJob.jobRoleOverview?.trim() ||
            !newJob.degree?.trim() ||
            !newJob.branch?.trim() ||
            !newJob.minCgpa?.toString().trim() ||
            !newJob.passingYear?.toString().trim() ||
            !newJob.experience?.trim() ||
            !newJob.deadline?.trim()
        ) {
            setValidationError(true);
            triggerToast("Please fill out all required fields marked with * before posting!", 'error');
            return;
        }

        try {
            setValidationError(false);
            const apiDeadline = formatApiDeadline(newJob.deadline);

            const payload = {
                companyName: newJob.companyName || "Company",
                location: newJob.location || "Remote",
                jobRequirements: newJob.jobRequirements || "Requirements details",
                jobRoleOverview: newJob.jobRoleOverview || "Role Overview",
                degree: newJob.degree === "BSC Cs" ? "BSc CS" : (newJob.degree || "B.Tech"),
                branch: newJob.branch || "Computer Science",
                minCgpa: parseFloat(newJob.minCgpa) || 0.0,
                passingYear: newJob.passingYear || "2026",
                experience: newJob.experience || "Fresher",
                deadline: apiDeadline,
                action: "POST"
            };

            let response;
            if (editingDraftId) {
                try {
                    response = await publishDraft(editingDraftId);
                } catch {
                    response = await createJobPosting(payload);
                }
            } else {
                response = await createJobPosting(payload);
            }

            const createdJob = {
                id: (response && response.data && response.data.id) || (jobs.length + 1),
                title: newJob.jobRoleOverview,
                company: newJob.companyName || "Company",
                location: newJob.location || "Remote",
                requirements: newJob.jobRequirements,
                degree: newJob.degree,
                branch: newJob.branch,
                cgpa: newJob.minCgpa,
                year: newJob.passingYear,
                experience: newJob.experience,
                deadline: newJob.deadline,
                status: 'Active',
                date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            };

            setJobs([createdJob, ...jobs]);
            setDrafts(drafts.filter(d => d.id !== editingDraftId));
            setEditingDraftId(null);
            setNewJob({
                companyName: '', location: '', jobRequirements: '', jobRoleOverview: '',
                degree: '', branch: '', minCgpa: '', passingYear: '', experience: '', deadline: ''
            });

            triggerToast(`Job posted successfully for ${createdJob.company}!`, 'success');
            setIsSidebarOpen(false);
            try {
                await Promise.allSettled([
                    fetchRecentPosts(),
                    fetchDraftsData(),
                    fetchApplicantsMatching(),
                    fetchDashboardStats(),
                    fetchNotifications()
                ]);
            } catch (err) { console.error("Error refreshing data:", err); }
        } catch (error) {
            console.error("Failed to post job:", error);
            const serverMsg = error.response?.data?.message;
            const errorMsg = (serverMsg && serverMsg !== 'Bad Request') ? serverMsg : "Failed to post job. Please try again.";
            triggerToast(errorMsg, 'error');
        }
    };

    const handleSaveDraft = async () => {
        if (!newJob.companyName || !newJob.jobRoleOverview) {
            setValidationError(true);
            triggerToast("Please fill in Company Name and Job Role Overview to save as a draft!", 'error');
            return;
        }

        try {
            setValidationError(false);
            const apiDeadline = formatApiDeadline(newJob.deadline);

            const payload = {
                companyName: newJob.companyName || "Company",
                location: newJob.location || "Remote",
                jobRequirements: newJob.jobRequirements || "None",
                jobRoleOverview: newJob.jobRoleOverview,
                degree: newJob.degree === "BSC Cs" ? "BSc CS" : (newJob.degree || "B.Tech"),
                branch: newJob.branch || "Computer Science",
                minCgpa: parseFloat(newJob.minCgpa) || 0.0,
                passingYear: newJob.passingYear || "2026",
                experience: newJob.experience || "Fresher",
                deadline: apiDeadline,
                action: "DRAFT"
            };

            let response;
            if (editingDraftId) {
                try {
                    response = await updateDraft(editingDraftId, payload);
                } catch {
                    response = await createJobPosting(payload);
                }
            } else {
                response = await createJobPosting(payload);
            }

            const newDraft = {
                id: (response && response.data && response.data.id) || editingDraftId || (drafts.length + 1),
                title: newJob.jobRoleOverview,
                company: newJob.companyName || "Company",
                location: newJob.location || "Remote",
                requirements: newJob.jobRequirements,
                degree: newJob.degree,
                branch: newJob.branch,
                cgpa: newJob.minCgpa,
                year: newJob.passingYear,
                experience: newJob.experience,
                deadline: newJob.deadline,
                lastSaved: 'Just now'
            };

            setDrafts([newDraft, ...drafts.filter(d => d.id !== editingDraftId)]);
            setEditingDraftId(null);
            setNewJob({
                companyName: '', location: '', jobRequirements: '', jobRoleOverview: '',
                degree: '', branch: '', minCgpa: '', passingYear: '', experience: '', deadline: ''
            });

            triggerToast(`Draft saved for ${newDraft.company}!`, 'success');
            setIsSidebarOpen(false);
            try {
                await Promise.allSettled([
                    fetchDraftsData(),
                    fetchRecentPosts(),
                    fetchDashboardStats()
                ]);
            } catch (err) { console.error("Error refreshing drafts:", err); }
        } catch (error) {
            console.error("Failed to save draft:", error);
            const serverMsg = error.response?.data?.message;
            const errorMsg = (serverMsg && serverMsg !== 'Bad Request') ? serverMsg : "Failed to save draft. Please try again.";
            triggerToast(errorMsg, 'error');
        }
    };

    const handlePublishDraft = async (draftId) => {
        const draftToPublish = drafts.find(d => d.id === draftId);
        if (!draftToPublish) return;

        try {
            const response = await publishDraft(draftId);
            const apiJob = response.data;

            const newPublishedJob = {
                id: apiJob.id || (jobs.length + 1),
                title: apiJob.jobRoleOverview || draftToPublish.title,
                company: apiJob.companyName || draftToPublish.company,
                location: apiJob.location || draftToPublish.location || "Remote",
                requirements: apiJob.jobRequirements || draftToPublish.requirements,
                degree: apiJob.degree || draftToPublish.degree,
                branch: apiJob.branch || draftToPublish.branch,
                cgpa: apiJob.minCgpa || draftToPublish.cgpa,
                year: apiJob.passingYear || draftToPublish.year,
                experience: apiJob.experience || draftToPublish.experience,
                deadline: apiJob.deadline || draftToPublish.deadline,
                status: 'Active',
                date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            };

            setJobs([newPublishedJob, ...jobs]);
            setDrafts(drafts.filter(d => d.id !== draftId));
            triggerToast(`Published draft: ${newPublishedJob.title} at ${newPublishedJob.company}!`, 'success');
            try {
                await Promise.allSettled([
                    fetchRecentPosts(),
                    fetchDraftsData(),
                    fetchApplicantsMatching(),
                    fetchDashboardStats()
                ]);
            } catch (err) { console.error("Error refreshing data after publish:", err); }
        } catch (error) {
            console.error("Failed to publish draft:", error);
            triggerToast("Failed to publish draft. Please try again.", 'error');
        }
    };

    const handleEditDraft = async (draftId) => {
        try {
            const response = await getDraftById(draftId);
            const draftToEdit = response.data;

            setEditingDraftId(draftId);

            setNewJob({
                companyName: draftToEdit.companyName,
                location: draftToEdit.location || '',
                jobRequirements: draftToEdit.jobRequirements || '',
                jobRoleOverview: draftToEdit.jobRoleOverview,
                degree: draftToEdit.degree || '',
                branch: draftToEdit.branch || '',
                minCgpa: draftToEdit.minCgpa || '',
                passingYear: draftToEdit.passingYear || '',
                experience: draftToEdit.experience || '',
                deadline: draftToEdit.deadline || ''
            });

            setValidationError(false);
            setDrafts(drafts.filter(d => d.id !== draftId));
            setIsSidebarOpen(true);
        } catch (error) {
            console.error("Failed to load draft details:", error);
            triggerToast("Failed to fetch draft details from the server.", 'error');
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setAdminProfile(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                fullName: adminProfile.name,
                email: adminProfile.email,
                mobile: adminProfile.phone,
                role: adminProfile.role || "System Administrator"
            };

            try {
                await updateAdminProfile(payload);
            } catch (apiErr) {
                console.warn("Backend API updateAdminProfile warning (updating locally):", apiErr);
            }

            const rawUser = localStorage.getItem("admin_user");
            let userInStorage = {};
            if (rawUser) {
                try {
                    const parsed = JSON.parse(rawUser);
                    if (parsed && typeof parsed === 'object') userInStorage = parsed;
                } catch {
                    userInStorage = {};
                }
            }

            const updatedUser = {
                fullName: sanitizeStorageString(adminProfile.name),
                email: sanitizeStorageString(adminProfile.email).toLowerCase(),
                phone: sanitizeStorageString(adminProfile.phone),
                role: sanitizeStorageString(adminProfile.role || userInStorage.role || 'System Administrator'),
                avatarUrl: adminProfile.avatarUrl || userInStorage.avatarUrl || localStorage.getItem('admin_avatar') || ""
            };
            localStorage.setItem("admin_user", JSON.stringify(updatedUser));

            setIsEditingProfile(false);
            setIsProfileModalOpen(false);
            triggerToast("Profile edited successfully!", 'success');
        } catch (error) {
            console.error("Failed to update profile:", error);
            triggerToast("Failed to update profile.", 'error');
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setValidationError(true);
            triggerToast("New passwords do not match!", 'error');
            return;
        }

        try {
            await changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
                confirmPassword: passwordData.confirmPassword
            });

            const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
            const adminEmail = adminUser.email || 'saurabh@gmail.com';

            if (adminEmail) {
                updateAdminPasswordInStorage(adminEmail, passwordData.newPassword);
            }

            setValidationError(false);
            triggerToast("Admin password changed successfully!", 'success');

            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowAdminCurrentPassword(false);
            setShowAdminNewPassword(false);
            setShowAdminConfirmPassword(false);
            setIsProfileModalOpen(false);
        } catch (error) {
            console.error("Error changing password:", error);
            setValidationError(true);
            triggerToast(error.response?.data?.message || "Failed to change password. Please check your current password.", 'error');
        }
    };

    const handleCloseProfileModal = () => {
        setIsProfileModalOpen(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowAdminCurrentPassword(false);
        setShowAdminNewPassword(false);
        setShowAdminConfirmPassword(false);
        setValidationError(false);
    };

    const totalDraftsPages = Math.ceil(drafts.length / DRAFTS_PER_PAGE);
    const paginatedDrafts = drafts.slice(
        (draftsCurrentPage - 1) * DRAFTS_PER_PAGE,
        draftsCurrentPage * DRAFTS_PER_PAGE
    );

    const totalJobsPages = Math.ceil(recentPosts.length / JOBS_PER_PAGE);
    const paginatedRecentPosts = recentPosts.slice(
        (jobsCurrentPage - 1) * JOBS_PER_PAGE,
        jobsCurrentPage * JOBS_PER_PAGE
    );

    const totalApplicantsPages = Math.ceil(filteredApplicants.length / APPLICANTS_PER_PAGE);
    const paginatedApplicants = filteredApplicants.slice(
        (applicantsCurrentPage - 1) * APPLICANTS_PER_PAGE,
        applicantsCurrentPage * APPLICANTS_PER_PAGE
    );

    return (
        <div className='admin-dashboard-container'>
            <AdminHeader
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                unreadCount={unreadCount}
                isProfileOpen={isProfileOpen}
                setIsProfileOpen={setIsProfileOpen}
                adminProfile={adminProfile}
                setIsNotificationSidebarOpen={setIsNotificationSidebarOpen}
                setProfileTab={setProfileTab}
                setIsEditingProfile={setIsEditingProfile}
                setValidationError={setValidationError}
                setIsProfileModalOpen={setIsProfileModalOpen}
                onNavigate={onNavigate}
                handlePhotoUpload={handleAdminPhotoUpload}
                handleRemovePhoto={handleAdminRemovePhoto}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
            />

            <div className={`dashboard-content-layout ${activeTab === 'analytics' || activeTab === 'queries' ? 'wide-layout' : ''}`}>
                <main className='dashboard-main'>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}
                        >
                            {activeTab === 'dashboard' && (
                                <>
                                    <section className='greeting-section'>
                                        <div className='greeting-content'>
                                            <h2>Welcome, {adminProfile.name} <span className='waving-hand'>👋</span></h2>
                                            <p>Here's what's happening with your placement portal today.</p>
                                        </div>
                                        <div className='greeting-date-badge'>
                                            <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </section>

                                    <AdminStatsGrid dashboardStats={dashboardStats} />

                                    <div className='dashboard-grid-lower'>
                                        <RecentPostingsCard
                                            drafts={drafts}
                                            paginatedDrafts={paginatedDrafts}
                                            draftsCurrentPage={draftsCurrentPage}
                                            totalDraftsPages={totalDraftsPages}
                                            setDraftsCurrentPage={setDraftsCurrentPage}
                                            handleEditDraft={handleEditDraft}
                                            handlePublishDraft={handlePublishDraft}
                                            paginatedRecentPosts={paginatedRecentPosts}
                                            jobsCurrentPage={jobsCurrentPage}
                                            totalJobsPages={totalJobsPages}
                                            setJobsCurrentPage={setJobsCurrentPage}
                                            setValidationError={setValidationError}
                                            setIsSidebarOpen={setIsSidebarOpen}
                                        />

                                        <ApplicantsMatchingCard
                                            searchTerm={searchTerm}
                                            setSearchTerm={setSearchTerm}
                                            filterBy={filterBy}
                                            isFilterDropdownOpen={isFilterDropdownOpen}
                                            setIsFilterDropdownOpen={setIsFilterDropdownOpen}
                                            handleFilterByChange={handleFilterByChange}
                                            filterDate={filterDate}
                                            setFilterDate={setFilterDate}
                                            isDatePickerOpen={isDatePickerOpen}
                                            setIsDatePickerOpen={setIsDatePickerOpen}
                                            datePickerRef={datePickerRef}
                                            calDate={calDate}
                                            handlePrevMonth={handlePrevMonth}
                                            handleNextMonth={handleNextMonth}
                                            firstDayIndex={firstDayIndex}
                                            totalDays={totalDays}
                                            filterCompany={filterCompany}
                                            setFilterCompany={setFilterCompany}
                                            paginatedApplicants={paginatedApplicants}
                                            applicantsCurrentPage={applicantsCurrentPage}
                                            totalApplicantsPages={totalApplicantsPages}
                                            setApplicantsCurrentPage={setApplicantsCurrentPage}
                                        />
                                    </div>
                                </>
                            )}

                            {activeTab === 'analytics' && <StudentAnalytics />}
                            {activeTab === 'queries' && <QueriesStories />}
                        </motion.div>
                    </AnimatePresence>
                </main>

                {isSidebarOpen && (
                    <AddJobModal
                        setIsSidebarOpen={setIsSidebarOpen}
                        handlePostJob={handlePostJob}
                        newJob={newJob}
                        setNewJob={setNewJob}
                        handleInputChange={handleInputChange}
                        validationError={validationError}
                        handleSaveDraft={handleSaveDraft}
                        modalDatePickerRef={modalDatePickerRef}
                        isModalDatePickerOpen={isModalDatePickerOpen}
                        setIsModalDatePickerOpen={setIsModalDatePickerOpen}
                        modalCalDate={modalCalDate}
                        handleModalPrevMonth={handleModalPrevMonth}
                        handleModalNextMonth={handleModalNextMonth}
                        modalFirstDayIndex={modalFirstDayIndex}
                        modalTotalDays={modalTotalDays}
                    />
                )}

                <AnimatePresence>
                    {showToast && (
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className={`portal-toast-notification portal-toast-${toastType}`}
                        >
                            <div className="portal-toast-icon">
                                {toastType === 'success' && <CheckCircle2 size={20} />}
                                {toastType === 'info' && <Info size={20} />}
                                {toastType === 'error' && <AlertCircle size={20} />}
                            </div>
                            <span className="portal-toast-text">{toastMessage}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <ProfileSettingsModal
                    isProfileModalOpen={isProfileModalOpen}
                    handleCloseProfileModal={handleCloseProfileModal}
                    profileTab={profileTab}
                    isEditingProfile={isEditingProfile}
                    setIsEditingProfile={setIsEditingProfile}
                    adminProfile={adminProfile}
                    handleProfileChange={handleProfileChange}
                    handleUpdateProfile={handleUpdateProfile}
                    passwordData={passwordData}
                    handlePasswordChange={handlePasswordChange}
                    showAdminCurrentPassword={showAdminCurrentPassword}
                    setShowAdminCurrentPassword={setShowAdminCurrentPassword}
                    showAdminNewPassword={showAdminNewPassword}
                    setShowAdminNewPassword={setShowAdminNewPassword}
                    showAdminConfirmPassword={showAdminConfirmPassword}
                    setShowAdminConfirmPassword={setShowAdminConfirmPassword}
                    validationError={validationError}
                    handleUpdatePassword={handleUpdatePassword}
                    handlePhotoUpload={handleAdminPhotoUpload}
                    handleRemovePhoto={handleAdminRemovePhoto}
                />

                <NotificationSidebar
                    isNotificationSidebarOpen={isNotificationSidebarOpen}
                    setIsNotificationSidebarOpen={setIsNotificationSidebarOpen}
                    unreadCount={unreadCount}
                    handleMarkAllRead={handleMarkAllRead}
                    notifications={notifications}
                />
            </div>
        </div>
    );
}
export default AdminDashboard;

