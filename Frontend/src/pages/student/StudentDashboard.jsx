import { motion, AnimatePresence } from 'framer-motion';

import { useState, useEffect, useRef } from "react";
import { getStudentProfile, updateStudentProfile, uploadStudentProfilePhoto, deleteStudentProfilePhoto, changePassword, getStudentDashboardStats, getLatestJobs, getJobDetails, applyForJob, getStudentResumeMatch, getStudentNotifications, markAllStudentNotificationsAsRead, getStudentUnreadCount } from '../../auth/authService';
import { playNotificationAlert } from '../../utils/notificationSound';
import {
    GraduationCap,
    Bell,
    User,
    CheckCircle2,
    Clock,
    XCircle,
    Info,
    AlertCircle,
    MapPin,
    Briefcase,
    Calendar,
    X,
    Lock,
    LogOut,
    Eye,
    EyeOff,
    ExternalLink,
    FileText,
    Search,
    Upload,
    Camera,
    Trash2,
    Menu,
    LayoutDashboard,
    Sparkles,
    TrendingUp
} from "lucide-react";
import "./StudentDashboard.css";
import StudHub from "./StudHub";
import Placeview from "./Placeview";

// Default fallback mock data for Placement Drives
const initialDrives = [];

/** Cleans and sanitizes user input strings before storing or displaying. */
function sanitizeStorageString(val) {
    if (val === null || val === undefined) return '';
    let str = String(val);
    try {
        if (str.includes('%')) {
            str = decodeURIComponent(str);
        }
    } catch {
        // Fallback if str is not a valid encoded URI component
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

/** Safely decodes URL-encoded strings from storage. */
function decodeStorageString(val) {
    if (val === null || val === undefined) return '';
    let str = String(val);
    try {
        if (str.includes('%')) {
            return decodeURIComponent(str);
        }
    } catch {
        // Fallback
    }
    return str;
}

/** Generates initial letters from user full name. */
function getInitials(name) {
    if (!name || name === "Student") return "ST";
    const parts = String(name).trim().split(" ");
    return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
}




const handleImageError = (e) => {
    e.target.style.display = 'none';
    if (e.target.nextSibling) {
        e.target.nextSibling.style.display = 'inline';
    }
};

function CompanyLogoBadge({ company, logoUrl, logoColor, logoLetter, className = "company-logo-badge" }) {
    const color = logoColor || '#e2e8f0';
    const domain = typeof company === 'string' ? company.toLowerCase().replace(/\s+/g, '') : 'company';
    const src = logoUrl || `https://www.google.com/s2/favicons?domain=${domain}.com&sz=128`;
    const letter = logoLetter || (typeof company === 'string' ? company.charAt(0) : 'C');

    return (
        <div className={className} style={{ borderColor: color }}>
            <img
                src={src}
                alt={company || 'Company'}
                className="company-logo-img"
                onError={handleImageError}
            />
            <span style={{ color, display: 'none' }}>
                {letter}
            </span>
        </div>
    );
}


const mapJobData = (job) => {
    const firstLetter = job.companyName ? job.companyName.charAt(0).toUpperCase() : 'C';

    const reqString = job.jobRequirements || job.requirements || job.skillsRequired || "";
    const requirementsArray = reqString
        ? reqString.split(/,/).map(req => req.trim()).filter(Boolean)
        : ["No specific requirements listed"];

    return {
        id: job.id,
        company: job.companyName || job.company,
        logoLetter: firstLetter,
        logoColor: '#2563eb',
        location: job.location || "Remote",
        role: job.jobRoleOverview || job.jobRole || job.title,
        deadline: job.deadline,
        requirements: requirementsArray.length > 0 ? requirementsArray : ["No specific requirements listed"],
        additionalinfo: job.jobRoleOverview || job.jobRole || job.title,
        degree: job.degree || job.Degree || job.degreeRequired,
        branch: job.branch || job.Branch || job.branchRequired,
        minCgpa: job.minCgpa ?? job.MinCgpa ?? job.cgpa,
        passingYear: job.passingYear || job.PassingYear || job.year,
        experience: job.experience || job.Experience || job.experienceRequired,
        isApplied: job.applied || job.isApplied || job.hasApplied || false
    };
};

function ProfileInputField({ label, type = "text", isEditing, profileValue, tempValue, onChange, placeholder = "", isFullWidth = false }) {
    return (
        <div className={`form-group ${isFullWidth ? '' : 'half-width'}`}>
            <label>{label}</label>
            <input
                type={type}
                value={isEditing ? tempValue : profileValue}
                disabled={!isEditing}
                onChange={onChange}
                className={isEditing ? "editable-input" : "read-only-input"}
                placeholder={placeholder}
            />
        </div>
    );
}

function ProfileLinkField({ label, isEditing, profileValue, tempValue, onChange, linkText }) {
    return (
        <div className="form-group half-width">
            <label>{label}</label>
            {isEditing ? (
                <input
                    type="text"
                    value={tempValue}
                    onChange={onChange}
                    className="editable-input"
                    placeholder={`https://${linkText.toLowerCase()}.com/username`}
                />
            ) : (
                <div className="link-display-wrapper">
                    <input
                        type="text"
                        value={profileValue || "Not Provided"}
                        disabled
                        className="read-only-input"
                    />
                    {profileValue && (
                        <a href={profileValue} target="_blank" rel="noreferrer" className="link-visit-btn">
                            <ExternalLink size={14} /> Visit {linkText}
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}

function ModalBackdrop({ onClose }) {
    return (
        <div
            aria-label="Close modal backdrop"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "transparent", border: "none", cursor: "default" }}
            onClick={onClose}
        />
    );
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
                                onRemove();
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

function StudentProfileModal({ isProfileModalOpen, setIsProfileModalOpen, profile, isEditingProfile, setIsEditingProfile, handleEditProfileClick, handleCancelEdit, handleSaveProfile, tempProfile, setTempProfile, handlePhotoUpload, handleRemovePhoto }) {
    if (!isProfileModalOpen) return null;
    const closeProfileModal = () => {
        setIsProfileModalOpen(false);
        setIsEditingProfile(false);
    };
    const activePhoto = isEditingProfile ? tempProfile.avatarUrl : profile.avatarUrl;
    const activeName = isEditingProfile ? tempProfile.fullName : profile.fullName;

    return (
        <div className="modal-overlay">
            <ModalBackdrop onClose={closeProfileModal} />
            <div className="student-apply-modal" style={{ position: "relative", zIndex: 1 }}>

                <div className="modal-header">
                    <h4>{isEditingProfile ? "Edit Profile" : "Student Profile"}</h4>
                    <button type="button" className="close-btn" onClick={closeProfileModal}>
                        <X size={20} />
                    </button>
                </div>


                <div className="modal-form">
                    <div className="photo-upload-wrapper">
                        <AvatarPhotoMenu
                            avatarUrl={activePhoto}
                            onUpload={handlePhotoUpload}
                            onRemove={handleRemovePhoto}
                            inputId="student-modal-photo-input"
                        >
                            <div className="photo-preview-circle" style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#2563eb', color: '#ffffff', fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                {activePhoto ? (
                                    <img src={activePhoto} alt={activeName} className="avatar-img" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    getInitials(activeName || 'Student')
                                )}
                            </div>
                        </AvatarPhotoMenu>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.9375rem', fontWeight: '700', color: '#0f172a' }}>{activeName}</span>
                            <span style={{ display: 'block', fontSize: '0.8125rem', color: '#64748b' }}>
                                {activePhoto ? 'Click profile photo to change or remove photo' : 'Click profile photo to upload photo'}
                            </span>
                        </div>
                    </div>

                    <div className="form-row">
                        <ProfileInputField label="Full Name" isEditing={isEditingProfile} profileValue={profile.fullName} tempValue={tempProfile.fullName} onChange={(e) => setTempProfile({ ...tempProfile, fullName: e.target.value })} />
                        <ProfileInputField label="Email Address" type="email" isEditing={isEditingProfile} profileValue={profile.email} tempValue={tempProfile.email} onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })} />
                    </div>

                    <div className="form-row">
                        <ProfileInputField label="Phone Number" isEditing={isEditingProfile} profileValue={profile.phone} tempValue={tempProfile.phone} placeholder="Not Provided" onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })} />
                        <ProfileInputField label="Branch" isEditing={isEditingProfile} profileValue={profile.branch} tempValue={tempProfile.branch} placeholder="Not Provided" onChange={(e) => setTempProfile({ ...tempProfile, branch: e.target.value })} />
                    </div>

                    <div className="form-row">
                        <ProfileInputField label="Passing Year" isEditing={isEditingProfile} profileValue={profile.passingYear} tempValue={tempProfile.passingYear} placeholder="Not Provided" onChange={(e) => setTempProfile({ ...tempProfile, passingYear: e.target.value })} />
                        <ProfileInputField label="CGPA" isEditing={isEditingProfile} profileValue={profile.cgpa} tempValue={tempProfile.cgpa} placeholder="Not Provided" onChange={(e) => setTempProfile({ ...tempProfile, cgpa: e.target.value })} />
                    </div>

                    <ProfileInputField label="Skills" isEditing={isEditingProfile} profileValue={profile.skills} tempValue={tempProfile.skills} placeholder="Enter comma separated skills (e.g. React, CSS)" onChange={(e) => setTempProfile({ ...tempProfile, skills: e.target.value })} isFullWidth={true} />

                    <div className="form-row">
                        <ProfileLinkField label="LinkedIn URL" isEditing={isEditingProfile} profileValue={profile.linkedinUrl} tempValue={tempProfile.linkedinUrl} onChange={(e) => setTempProfile({ ...tempProfile, linkedinUrl: e.target.value })} linkText="LinkedIn" />
                        <ProfileLinkField label="GitHub URL" isEditing={isEditingProfile} profileValue={profile.githubUrl} tempValue={tempProfile.githubUrl} onChange={(e) => setTempProfile({ ...tempProfile, githubUrl: e.target.value })} linkText="GitHub" />
                    </div>

                    <div className="form-actions">
                        {isEditingProfile ? (
                            <>
                                <button type="button" className="btn-cancel" onClick={handleCancelEdit}>
                                    Cancel
                                </button>
                                <button type="button" className="btn-post" onClick={handleSaveProfile}>
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <>
                                <button type="button" className="btn-cancel" onClick={closeProfileModal}>
                                    Close
                                </button>
                                <button type="button" className="btn-post" onClick={handleEditProfileClick}>
                                    Edit Profile
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StudentChangePasswordModal({ isChangePasswordOpen, setIsChangePasswordOpen, passwordForm, setPasswordForm, showCurrentPassword, setShowCurrentPassword, showNewPassword, setShowNewPassword, showConfirmPassword, setShowConfirmPassword, handlePasswordSubmit }) {
    if (!isChangePasswordOpen) return null;
    const closePasswordModal = () => {
        setIsChangePasswordOpen(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };
    return (
        <div className="modal-overlay">
            <ModalBackdrop onClose={closePasswordModal} />
            <div className="change-password-modal" style={{ position: "relative", zIndex: 1 }}>
                <div className="modal-header">
                    <h4>Change Password</h4>
                    <button type="button" className="btn-close-modal" onClick={closePasswordModal}>
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handlePasswordSubmit}>
                    <div className="modal-body">
                        <div className="form-group-custom">
                            <label htmlFor="currentPassword">Current Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    id="currentPassword"
                                    type={showCurrentPassword ? "text" : "password"}
                                    required
                                    placeholder="Enter current password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="form-group-custom">
                            <label htmlFor="newPassword">New Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    id="newPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    required
                                    placeholder="Enter new password (min. 8 characters)"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="form-group-custom">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    placeholder="Confirm your new password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn-cancel-modal"
                            onClick={closePasswordModal}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn-confirm-apply">
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function StudentNotificationSidebar({ isNotificationSidebarOpen, setIsNotificationSidebarOpen, unreadCount, handleMarkAllRead, notifications }) {
    if (!isNotificationSidebarOpen) return null;

    const formatNotificationDate = (notif) => {
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
    };

    return (
        <div className="sd-notification-sidebar-overlay">
            <ModalBackdrop onClose={() => setIsNotificationSidebarOpen(false)} />
            <div className="sd-notification-sidebar" style={{ zIndex: 1 }}>
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
                                    style={{ boxShadow: isRead ? 'none' : 'inset 4px 0 0 0 #3b82f6' }}
                                >
                                    <p style={{ fontWeight: isRead ? 'normal' : '600' }}>{notif.message || notif.text}</p>
                                    <span className="notif-date">{formatNotificationDate(notif)}</span>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

function StudentMetricsGrid({ metrics }) {
    return (
        <section className="metrics-grid">
            {metrics.map((metric, index) => (
                <motion.div className="metric-card" key={metric.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    transition={{ duration: 0.4, delay: index * 0.15 }}>
                    <div className="metric-header">
                        <div className={`metric-icon-wrapper ${metric.colorClass}`}>
                            {metric.icon}
                        </div>

                        <div className="metric-info">
                            <span className="metric-title"> {metric.title}</span>
                            <span className="metric-value">{metric.value}</span>
                        </div>
                    </div>


                    <div className="metric-progress-container">
                        <div className={`metric-progress-bar ${metric.colorClass}`}

                            style={{ width: `${metric.progess || metric.progress}%` }}>
                        </div>

                    </div>

                </motion.div>
            ))}
        </section>
    );
}

function SimplePagination({ currentPage, totalPages, onPageChange }) {
    if (!totalPages || totalPages <= 1) return null;
    return (
        <div className="sd-pagination">
            <button
                type="button"
                className="sd-page-btn"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                ← Prev
            </button>
            <span className="sd-page-info">
                {currentPage} / {totalPages}
            </span>
            <button
                type="button"
                className="sd-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                Next →
            </button>
        </div>
    );
}

function StudentLatestJobs({ jobs, jobsPage, setJobsPage, appliedJobs, handleApplyClick, JOBS_PER_PAGE }) {
    return (
        <section className="dashboard-column jobs-column">
            <div className="column-card-header">
                <h3>Latest Job Opportunities</h3>
            </div>

            <div className="job-list">
                {jobs && jobs.length > 0 ? (
                    jobs
                        .slice((jobsPage - 1) * JOBS_PER_PAGE, jobsPage * JOBS_PER_PAGE)
                        .map((job) => {
                            const jobId = job.id || job._id;
                            const isApplied = Boolean(job.isApplied) || (Array.isArray(appliedJobs)
                                ? appliedJobs.some(id => String(id) === String(jobId))
                                : Boolean(appliedJobs[jobId]));
                            return (
                                <motion.div className="job-card" key={job.id || job._id || job.title}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}>

                                    <div className="job-card-header">
                                        <CompanyLogoBadge
                                            company={job.company}
                                            logoUrl={job.logoUrl || job.logo}
                                            logoColor={job.logoColor || job.logoClor}
                                            logoLetter={job.logoLetter}
                                        />
                                        <h4 className="company-name">{job.company}</h4>
                                        <button
                                            type="button"
                                            className={`btn-apply ${isApplied ? 'applied' : ''}`}
                                            disabled={isApplied}
                                            onClick={() => handleApplyClick(job)}
                                        >
                                            {isApplied ? "Applied" : "Apply"}
                                        </button>
                                    </div>
                                    <div className="job-details-meta">
                                        <div className="meta-item">
                                            <MapPin size={14} className="meta-icon" />
                                            <span className="meta-label">Location</span>
                                            <span className="meta-sep">:</span>
                                            <strong>{job.location}</strong>
                                        </div>
                                        <div className="meta-item">
                                            <Briefcase size={14} className="meta-icon" />
                                            <span className="meta-label">Job Role</span>
                                            <span className="meta-sep">:</span>
                                            <strong>{job.role}</strong>
                                        </div>
                                        <div className="meta-item">
                                            <Calendar size={14} className="meta-icon" />
                                            <span className="meta-label">Deadline</span>
                                            <span className="meta-sep">:</span>
                                            <strong className="meta-deadline">{job.deadline}</strong>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                        <p>No new job opportunities are currently available for your profile.</p>
                    </div>
                )}
            </div>

            <SimplePagination
                currentPage={jobsPage}
                totalPages={jobs ? Math.ceil(jobs.length / JOBS_PER_PAGE) : 0}
                onPageChange={setJobsPage}
            />
        </section>
    );
}

function StudentResumeMatches({ resumeMatches, matchSearchQuery, setMatchSearchQuery, matchPage, setMatchPage, MATCHES_PER_PAGE }) {
    return (
        <section className="dashboard-column match-column">
            <div className="column-card-header">
                <h3>Resume Match Status</h3>
                <div className="search-bar-wrapper">
                    <Search className="search-icon" size={16} />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search company..."
                        value={matchSearchQuery}
                        onChange={(e) => { setMatchSearchQuery(e.target.value); setMatchPage(1); }}
                    />
                </div>
            </div>


            <div className="match-list">
                {(() => {
                    const filtered = resumeMatches.filter(item => item.company.toLowerCase().includes(matchSearchQuery.toLowerCase()));
                    if (filtered.length === 0) {
                        return (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                                <p>No resume matches found.</p>
                            </div>
                        );
                    }
                    return filtered
                        .slice((matchPage - 1) * MATCHES_PER_PAGE, matchPage * MATCHES_PER_PAGE)
                        .map((item, index) => (
                            <motion.div className="match-card" key={item.id || item.company}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}>

                                <div className="match-card-header">
                                    <div className="match-logo-details">
                                        <CompanyLogoBadge
                                            company={item.company}
                                            logoUrl={item.logoUrl || item.logo}
                                            logoColor={item.logoColor}
                                            logoLetter={item.logoLetter}
                                            className="logo-mini-badge"
                                        />
                                        <h4 className="match-company-name">{item.company}</h4>
                                    </div>

                                    <div className="match-score-container">
                                        <span className="match-score-text">{item.score}% Match</span>
                                        <div className="score-progress-track">
                                            <div className="score-progress-bar" style={{ width: `${item.score}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="match-card-details">
                                    <div className="match-detail-item">
                                        <span className="match-detail-label">Location :</span>
                                        <strong>{item.location}</strong>
                                    </div>
                                    <div className="match-detail-item">
                                        <span className="match-detail-label">Job Role :</span>
                                        <strong>{item.role}</strong>
                                    </div>
                                    <div className="match-detail-item">
                                        <span className="match-detail-label">Deadline :</span>
                                        <strong>{item.deadline}</strong>
                                    </div>
                                </div>

                            </motion.div>
                        ));
                })()}
            </div>




            {(() => {
                const filtered = resumeMatches.filter(item => item.company.toLowerCase().includes(matchSearchQuery.toLowerCase()));
                const totalPages = Math.max(1, Math.ceil(filtered.length / MATCHES_PER_PAGE));

                return (
                    <div className="sd-pagination">
                        <button
                            className="sd-page-btn"
                            disabled={matchPage === 1}
                            onClick={() => setMatchPage(p => p - 1)}
                        >
                            ← Prev
                        </button>
                        <span className="sd-page-info">
                            {matchPage} / {totalPages}
                        </span>
                        <button
                            className="sd-page-btn"
                            disabled={matchPage >= totalPages}
                            onClick={() => setMatchPage(p => p + 1)}
                        >
                            Next →
                        </button>
                    </div>
                );
            })()}
        </section>
    );
}
export default function
    StudentDashboard({ onNavigate }) {
    // Retrieve the logged-in student's details from localStorage
    const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
    const studentName = decodeStorageString(loggedInUser.fullName || loggedInUser.name) || "Student";

    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'studhub', or 'placeview'
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


    // Sync states from localStorage (with mock fallbacks)
    const [drives] = useState(() => {
        const stored = localStorage.getItem("placement_drives");
        return stored ? JSON.parse(stored) : initialDrives;
    });



    // Filter drives targeted to this student
    const studentEmail = (loggedInUser.email || "").toLowerCase().trim();
    const studentNameFilter = (loggedInUser.fullName || loggedInUser.name || "").toLowerCase().trim();
    const studentFilteredDrives = drives.filter(drive => {
        let targets = drive.targetStudent || [];
        if (typeof targets === 'string') {
            targets = targets.split(',').map(t => t.trim());
        }

        const lowerTargets = targets.map(t => typeof t === 'string' ? t.toLowerCase().trim() : '');

        if (lowerTargets.length === 0 || lowerTargets.includes("") || lowerTargets.includes("all")) {
            return true;
        }

        const matchEmail = studentEmail !== "" && lowerTargets.some(t => t.includes(studentEmail));
        const matchName = studentNameFilter !== "" && lowerTargets.some(t => t.includes(studentNameFilter));

        return matchEmail || matchName;
    });

    // Find the next upcoming/open event sorted by date
    const activeDrives = studentFilteredDrives.filter(d => d.status === 'open' || d.status === 'upcoming');
    const getParsedDate = (dateStr) => {
        try {
            const d = new Date(dateStr);
            return Number.isNaN(d.getTime()) ? new Date("9999-12-31") : d;
        } catch {
            return new Date("9999-12-31");
        }
    };
    activeDrives.sort((a, b) => getParsedDate(a.date) - getParsedDate(b.date));






    //Component state
    const [selectedJob, setSelectedJob] =
        useState(null);

    const userEmailKey = (loggedInUser.email || "").toLowerCase().trim();

    const [appliedJobs, setAppliedJobs] = useState(() => {
        try {
            const stored = localStorage.getItem(`applied_jobs_${userEmailKey}`);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const [matchSearchQuery, setMatchSearchQuery] =
        useState("");

    // Pagination state
    const JOBS_PER_PAGE = 3;
    const MATCHES_PER_PAGE = 3;
    const [jobsPage, setJobsPage] = useState(1);
    const [matchPage, setMatchPage] = useState(1);


    // Toast notification states
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    // Resume upload states
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeFileName, setResumeFileName] = useState("");






    // Sidebar visibility states
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isNotificationSidebarOpen, setIsNotificationSidebarOpen] = useState(false);

    // Modal overlay visibility states
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    // Notification Data
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const prevUnreadCountRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const response = await getStudentNotifications();
            if (response.data) {
                const data = Array.isArray(response.data) ? response.data :
                    (response.data.content || []);
                // Sort by date descending (assuming it's not already sorted, optional but good UX)
                const parseDateStr = (dateStr, timeStr) => {
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
                            const [, rawH, rawM, , ampm] = match;
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
                };

                const localizeStudentNotif = (notif) => {
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
                };

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

                const localizedData = deduplicated.map(notif => localizeStudentNotif(notif));
                setNotifications(localizedData);
            }

            const countResponse = await getStudentUnreadCount();
            if (countResponse.data !== undefined) {
                // If it returns an object like { count: 5 } or just a number
                const count = typeof countResponse.data === 'object' ? (countResponse.data.count || countResponse.data.unreadCount || 0) : countResponse.data;
                if (prevUnreadCountRef.current !== null && count > prevUnreadCountRef.current) {
                    playNotificationAlert();
                }
                prevUnreadCountRef.current = count;
                setUnreadCount(count);
            }
        } catch (error) {
            console.error("Error fetching notifications or unread count:", error);
        }
    };

    useEffect(() => {
        const load = async () => {
            await fetchNotifications();
        };
        load();
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await markAllStudentNotificationsAsRead();
            await fetchNotifications();
            setToastMessage("All notifications marked as read");
            setToastType("success");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (error) {
            console.error("Error marking all read:", error);
        }
    };





    // Gather profile information from localStorage, with clean default fallbacks
    const getInitialProfile = () => {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const userEmailKey = (storedUser.email || "").toLowerCase();
        const avatarKey = userEmailKey ? `student_avatar_${userEmailKey}` : 'student_avatar';
        const savedAvatar = storedUser.avatarUrl || localStorage.getItem(avatarKey) || localStorage.getItem("student_avatar") || "";
        return {
            fullName: decodeStorageString(storedUser.fullName) || "Student Name",
            email: decodeStorageString(storedUser.email) || "student@portal.edu",
            phone: decodeStorageString(storedUser.phone) || "",
            branch: decodeStorageString(storedUser.branch) || "",
            passingYear: decodeStorageString(storedUser.passingYear) || "",
            cgpa: decodeStorageString(storedUser.cgpa) || "",
            skills: decodeStorageString(storedUser.skills) || "",
            linkedinUrl: decodeStorageString(storedUser.linkedinUrl) || "",
            githubUrl: decodeStorageString(storedUser.githubUrl) || "",
            avatarUrl: savedAvatar
        };
    };

    const [profile, setProfile] = useState(getInitialProfile());

    const [dashboardStats, setDashboardStats] = useState(null);

    const fetchDashboardStats = async () => {
        try {
            const response = await getStudentDashboardStats();
            if (response && response.data) {
                setDashboardStats(response.data);
            }
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        }
    };

    useEffect(() => {
        const fetchStudentProfile = async () => {
            try {
                const response = await getStudentProfile();
                if (response.data) {
                    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
                    const userEmailKey = (response.data.email || storedUser.email || "").toLowerCase();
                    const avatarKey = userEmailKey ? `student_avatar_${userEmailKey}` : 'student_avatar';
                    const savedAvatar = localStorage.getItem(avatarKey) || storedUser.avatarUrl || localStorage.getItem("student_avatar") || "";

                    const rawPhoto = response.data.photoPath || response.data.profilePhoto || response.data.photo || response.data.avatarUrl || "";
                    const resolvedPhoto = resolvePhotoUrl(rawPhoto, savedAvatar);
                    const finalAvatar = resolvedPhoto || savedAvatar || storedUser.avatarUrl || "";

                    const freshData = {
                        fullName: response.data.fullName || response.data.name || "",
                        email: response.data.email || "",
                        phone: response.data.mobile || response.data.phone || "",
                        branch: response.data.department || response.data.branch || "",
                        passingYear: response.data.currentYear || response.data.passingYear || "",
                        cgpa: response.data.cgpa || "0.0",
                        skills: response.data.skills || "",
                        linkedinUrl: response.data.linkedinUrl || "",
                        githubUrl: response.data.githubUrl || "",
                        avatarUrl: finalAvatar
                    };

                    setProfile(prev => ({
                        ...prev,
                        ...freshData,
                        avatarUrl: finalAvatar || prev.avatarUrl || ""
                    }));

                    if (finalAvatar) {
                        try {
                            localStorage.setItem(avatarKey, finalAvatar);
                            localStorage.setItem("student_avatar", finalAvatar);
                        } catch { }
                    }

                    // Update localStorage so next time we refresh or login, it has the fresh data!
                    const rawExisting = localStorage.getItem("user");
                    let existingUser = {};
                    if (rawExisting) {
                        try {
                            const parsed = JSON.parse(rawExisting);
                            if (parsed && typeof parsed === 'object') existingUser = parsed;
                        } catch {
                            existingUser = {};
                        }
                    }

                    try {
                        localStorage.setItem("user", JSON.stringify({
                            fullName: sanitizeStorageString(freshData.fullName || existingUser.fullName),
                            email: sanitizeStorageString(freshData.email || existingUser.email).toLowerCase(),
                            phone: sanitizeStorageString(freshData.phone || existingUser.phone),
                            branch: sanitizeStorageString(freshData.branch || existingUser.branch),
                            passingYear: sanitizeStorageString(freshData.passingYear || existingUser.passingYear),
                            cgpa: sanitizeStorageString(freshData.cgpa || existingUser.cgpa),
                            skills: sanitizeStorageString(freshData.skills || existingUser.skills),
                            linkedinUrl: sanitizeStorageString(freshData.linkedinUrl || existingUser.linkedinUrl),
                            githubUrl: sanitizeStorageString(freshData.githubUrl || existingUser.githubUrl),
                            avatarUrl: finalAvatar || existingUser.avatarUrl || ""
                        }));
                    } catch (storageErr) {
                        // ignore quota exceeded if avatar URL string is large
                    }

                }
            } catch (error) {
                console.error("Error fetching student profile:", error);
            }
        };

        fetchStudentProfile();
        fetchDashboardStats();

        let pollInterval;
        if (import.meta.env.MODE !== 'test') {
            pollInterval = setInterval(() => {
                if (document.hidden) return;
                fetchDashboardStats();
                fetchNotifications();
            }, 5000);
        }

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
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

    // Password change form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    // Profile Edit Mode state
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [tempProfile, setTempProfile] = useState({});

    // Password fields visibility states
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Handlers for profile editing
    const handleStudentPhotoUpload = async (e, explicitFile) => {
        const file = explicitFile || e?.target?.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setToastMessage("Image size must be less than 5MB");
            setToastType('error');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return;
        }
        const userEmailKey = (profile.email || "").toLowerCase();
        const avatarKey = userEmailKey ? `student_avatar_${userEmailKey}` : 'student_avatar';
        const hasExistingPhoto = Boolean(profile.avatarUrl || localStorage.getItem(avatarKey) || localStorage.getItem("student_avatar"));

        try {
            const compressedBase64 = await compressImageToBase64(file);
            const base64 = compressedBase64 || '';
            if (base64) {
                setTempProfile(prev => ({ ...prev, avatarUrl: base64 }));
                setProfile(prev => ({ ...prev, avatarUrl: base64 }));
                try { localStorage.setItem(avatarKey, base64); } catch { }

                const rawUser = localStorage.getItem("user");
                let userObj = {};
                if (rawUser) {
                    try { userObj = JSON.parse(rawUser) || {}; } catch { }
                }
                userObj.avatarUrl = base64;
                try { localStorage.setItem("user", JSON.stringify(userObj)); } catch { }
            }

            // Call backend API (POST /student/profile/photo)
            try {
                const res = await uploadStudentProfilePhoto(file);
                const serverPhotoPath = res?.data?.photoUrl || res?.data?.avatarUrl || res?.data?.photoPath || res?.data?.url || (typeof res?.data === 'string' ? res.data : null);
                const finalPhotoUrl = resolvePhotoUrl(serverPhotoPath, base64);
                if (finalPhotoUrl) {
                    setTempProfile(prev => ({ ...prev, avatarUrl: finalPhotoUrl }));
                    setProfile(prev => ({ ...prev, avatarUrl: finalPhotoUrl }));
                    try { localStorage.setItem(avatarKey, finalPhotoUrl); } catch { }
                }
            } catch (apiErr) {
                console.warn("Backend photo upload warning:", apiErr);
            }

            setToastMessage(hasExistingPhoto ? "Profile photo edited successfully!" : "Profile photo uploaded successfully!");
            setToastType('success');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (uploadErr) {
            console.error("Photo upload error:", uploadErr);
        }
    };

    const handleStudentRemovePhoto = async () => {
        setTempProfile(prev => ({ ...prev, avatarUrl: '' }));
        setProfile(prev => ({ ...prev, avatarUrl: '' }));
        const userEmailKey = (profile.email || "").toLowerCase();
        const avatarKey = userEmailKey ? `student_avatar_${userEmailKey}` : 'student_avatar';
        localStorage.removeItem(avatarKey);

        const rawUser = localStorage.getItem("user");
        let userObj = {};
        if (rawUser) {
            try { userObj = JSON.parse(rawUser) || {}; } catch { }
        }
        delete userObj.avatarUrl;
        localStorage.setItem("user", JSON.stringify(userObj));

        // Call backend API (DELETE /student/profile/photo)
        try {
            await deleteStudentProfilePhoto();
        } catch (apiErr) {
            console.warn("Backend photo delete warning:", apiErr);
        }

        setToastMessage("Profile photo removed successfully!");
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleEditProfileClick = () => {
        setTempProfile({ ...profile });
        setIsEditingProfile(true);
    };

    const handleSaveProfile = async () => {
        try {
            // Map state to API payload based on Swagger specs
            const payload = {
                fullName: tempProfile.fullName || "",
                email: tempProfile.email || "",
                mobile: tempProfile.phone || "",
                course: "", // Frontend doesn't currently collect this
                department: tempProfile.branch || "",
                currentYear: tempProfile.passingYear || "",
                cgpa: Number.parseFloat(tempProfile.cgpa) || 0.0,
                skills: tempProfile.skills || "",
                linkedinUrl: tempProfile.linkedinUrl || "",
                githubUrl: tempProfile.githubUrl || "",
                role: "Student" // Optional default
            };

            try {
                await updateStudentProfile(payload);
            } catch (apiErr) {
                console.warn("Backend API updateStudentProfile warning (updating locally):", apiErr);
            }

            setProfile({ ...tempProfile });
            const rawUserObj = localStorage.getItem("user");
            let userObj = {};
            if (rawUserObj) {
                try {
                    const parsed = JSON.parse(rawUserObj);
                    if (parsed && typeof parsed === 'object') userObj = parsed;
                } catch {
                    userObj = {};
                }
            }

            localStorage.setItem("user", JSON.stringify({
                fullName: sanitizeStorageString(tempProfile.fullName || userObj.fullName),
                email: sanitizeStorageString(tempProfile.email || userObj.email).toLowerCase(),
                phone: sanitizeStorageString(tempProfile.phone || userObj.phone),
                branch: sanitizeStorageString(tempProfile.branch || userObj.branch),
                passingYear: sanitizeStorageString(tempProfile.passingYear || userObj.passingYear),
                cgpa: sanitizeStorageString(tempProfile.cgpa || userObj.cgpa),
                skills: sanitizeStorageString(tempProfile.skills || userObj.skills),
                linkedinUrl: sanitizeStorageString(tempProfile.linkedinUrl || userObj.linkedinUrl),
                githubUrl: sanitizeStorageString(tempProfile.githubUrl || userObj.githubUrl),
                avatarUrl: tempProfile.avatarUrl || profile.avatarUrl || userObj.avatarUrl || ""
            }));
            setIsEditingProfile(false);

            // Show Toast Notification
            setToastMessage("Profile edited successfully!");
            setToastType("success");
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
            }, 3000);
        } catch (error) {
            console.error("Failed to update profile:", error);
            setToastMessage("Failed to update profile.");
            setToastType("error");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    const handleCancelEdit = () => {
        setIsEditingProfile(false);
    };

    // Handles password change submission
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setToastMessage("New passwords do not match!");
            setToastType("error");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return;
        }

        try {
            await changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
                confirmPassword: passwordForm.confirmPassword
            });

            // UPDATE LOCAL STORAGE PASSWORD FOR AUTOFILL
            const userEmail = sanitizeStorageString(loggedInUser.email).toLowerCase();
            if (userEmail) {
                const rawData = localStorage.getItem('registered_profiles');
                let profiles = [];
                if (rawData) {
                    try {
                        const parsed = JSON.parse(rawData);
                        if (Array.isArray(parsed)) profiles = parsed;
                    } catch {
                        profiles = [];
                    }
                }
                const updatedProfiles = profiles.map(p => {
                    const pEmail = sanitizeStorageString(p.email).toLowerCase();
                    const pPass = sanitizeStorageString(p.password);
                    if (pEmail === userEmail) {
                        return { email: pEmail, password: sanitizeStorageString(passwordForm.newPassword) };
                    }
                    return { email: pEmail, password: pPass };
                });
                localStorage.setItem('registered_profiles', JSON.stringify(updatedProfiles));
            }

            setToastMessage("Password updated successfully!");
            setToastType("success");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            setIsChangePasswordOpen(false);
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (error) {
            console.error("Error changing password:", error);
            setToastMessage(error.response?.data?.message || "Failed to change password. Please check your current password.");
            setToastType("error");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };




    // Handles logout flow
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        onNavigate("login"); // Navigate back to public login view
    };


    // 1. Triggered when the user clicks the "Apply" button on any job card
    const handleApplyClick = async (job) => {
        try {
            const response = await getJobDetails(job.id);
            if (response.data) {
                let requirementsArray = response.data.jobRequirements || response.data.requirements || [];
                if (typeof requirementsArray === 'string') {
                    requirementsArray = requirementsArray.split(',').map(s => s.trim()).filter(Boolean);
                }
                setSelectedJob({ ...job, ...response.data, requirements: requirementsArray });
            } else {
                setSelectedJob(job);
            }
        } catch (error) {
            console.error("Failed to fetch full job details", error);
            setSelectedJob(job);
        }
    };

    const handleResumeFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== "application/pdf") {
                setToastMessage("Only PDF files are allowed!");
                setToastType('error');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setToastMessage("File size must be under 5MB!");
                setToastType('error');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
                return;
            }
            setResumeFile(file);
            setResumeFileName(file.name);
        }
    };

    // 2. Triggered when the user clicks "Confirm and Apply" inside the requirements modal
    const handleConfirmApply = async () => {
        if (!resumeFileName || !resumeFile) {
            setToastMessage("Please upload your resume PDF first!");
            setToastType('error');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return;
        }

        if (selectedJob) {
            try {
                const formData = new FormData();
                formData.append('resume', resumeFile);

                const targetJobId = selectedJob.id || selectedJob._id;
                await applyForJob(targetJobId, formData);

                setAppliedJobs(prev => {
                    const prevArr = Array.isArray(prev) ? prev : [];
                    if (!prevArr.some(id => String(id) === String(targetJobId))) {
                        const updated = [...prevArr, targetJobId];
                        try {
                            localStorage.setItem(`applied_jobs_${userEmailKey}`, JSON.stringify(updated));
                        } catch (e) {
                            console.error("Failed to save applied jobs:", e);
                        }
                        return updated;
                    }
                    return prevArr;
                });
                const roleTitle = selectedJob.role || selectedJob.jobRole || selectedJob.title || 'selected';
                const compName = selectedJob.company || selectedJob.companyName || 'the company';
                setToastMessage(`Successfully applied for the ${roleTitle} role at ${compName}!`);
                setToastType('success');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);

                setSelectedJob(null);
                setResumeFile(null);
                setResumeFileName("");

                try {
                    await Promise.allSettled([
                        fetchDashboardStats(),
                        fetchJobs(),
                        fetchMatches(),
                        fetchNotifications()
                    ]);
                } catch (statsErr) {
                    console.error("Error updating stats after application:", statsErr);
                }

            } catch (error) {
                console.error("Failed to apply for job:", error);
                const targetJobId = selectedJob?.id || selectedJob?._id;
                if (error.response?.status === 409) {
                    setToastMessage(error.response.data?.message || "You have already applied for this job.");
                    setToastType('info');
                    if (targetJobId) {
                        setAppliedJobs(prev => {
                            const prevArr = Array.isArray(prev) ? prev : [];
                            if (!prevArr.some(id => String(id) === String(targetJobId))) {
                                const updated = [...prevArr, targetJobId];
                                try {
                                    localStorage.setItem(`applied_jobs_${userEmailKey}`, JSON.stringify(updated));
                                } catch (e) {
                                    console.error("Failed to save applied jobs:", e);
                                }
                                return updated;
                            }
                            return prevArr;
                        });
                    }
                    setSelectedJob(null);
                    setResumeFile(null);
                    setResumeFileName("");
                } else {
                    setToastMessage(error.response?.data?.message || "Failed to apply for the job. Please try again.");
                    setToastType('error');
                }
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            }
        }
    };

    // 3. Triggered when the user clicks "cancel" to  close the modal
    const handleCancleApply = () => {
        setSelectedJob(null);
        setResumeFile(null);
        setResumeFileName("");
    };


    const getProfileCompletion = (p) => {
        const fields = ['fullName', 'email', 'phone', 'branch', 'passingYear', 'cgpa', 'skills', 'linkedinUrl', 'githubUrl'];
        let filledCount = 0;
        fields.forEach(f => {
            if (p[f] && String(p[f]).trim() !== '') {
                filledCount++;
            }
        });
        return Math.round((filledCount / fields.length) * 100);
    };

    const profileCompletion = getProfileCompletion(profile);

    const metrics = [
        {
            id: "profile",
            title: "Profile Completed",
            value: dashboardStats ? `${dashboardStats.profileCompleted || 0}%` : `${profileCompletion}%`,
            icon: <User className="metric-icon-blue" />,
            colorClass: "blue",
            progress: dashboardStats ? (dashboardStats.profileCompleted || 0) : profileCompletion
        },
        {
            id: "selected",
            title: "Selected",
            value: dashboardStats ? String(dashboardStats.selected || 0) : "0",
            icon: <CheckCircle2 className="metric-icon-green" />,
            colorClass: "green",
            progress: dashboardStats?.selected ? 100 : 0
        },
        {
            id: "pending",
            title: "Pending",
            value: dashboardStats ? String(dashboardStats.pending || 0) : "0",
            icon: <Clock className="metric-icon-orange" />,
            colorClass: "orange",
            progress: dashboardStats?.pending ? 100 : 0
        },
        {
            id: "rejected",
            title: "Rejected",
            value: dashboardStats ? String(dashboardStats.rejected || 0) : "0",
            icon: <XCircle className="metric-icon-red" />,
            colorClass: "red",
            progress: dashboardStats?.rejected ? 100 : 0
        }
    ];

    const [jobs, setJobs] = useState([]);

    const fetchJobs = async () => {
        try {
            const response = await getLatestJobs();
            let jobList = [];
            if (response.data) {
                if (Array.isArray(response.data)) {
                    jobList = response.data;
                } else if (response.data.content && Array.isArray(response.data.content)) {
                    jobList = response.data.content;
                } else if (response.data.jobs && Array.isArray(response.data.jobs)) {
                    jobList = response.data.jobs;
                }
            }

            if (jobList.length > 0) {
                const mappedJobs = jobList.map(mapJobData);
                setJobs(mappedJobs);
            }
        } catch (error) {
            console.error("Error fetching latest jobs:", error);
        }
    };

    useEffect(() => {
        fetchJobs();

        let pollInterval;
        if (import.meta.env.MODE !== 'test') {
            pollInterval = setInterval(() => {
                if (document.hidden) return;
                fetchJobs();
            }, 5000);
        }

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchJobs();
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

    const [resumeMatches, setResumeMatches] = useState([]);

    const fetchMatches = async () => {
        try {
            const response = await getStudentResumeMatch();
            if (response.data && Array.isArray(response.data)) {
                const mapped = response.data.map(m => {
                    const firstLetter = m.companyName ? m.companyName.charAt(0).toUpperCase() : 'C';
                    return {
                        company: m.companyName || 'Company',
                        role: m.jobRole || m.role || 'Job Role',
                        location: m.location || 'Location',
                        deadline: m.deadline || 'Upcoming',
                        score: m.matchPercentage ?? m.matchScore ?? 0,
                        logoLetter: firstLetter,
                        logoColor: '#ea4335' // Default
                    };
                });
                setResumeMatches(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch resume matches:", error);
        }
    };

    useEffect(() => {
        fetchMatches();

        let pollInterval;
        if (import.meta.env.MODE !== 'test') {
            pollInterval = setInterval(() => {
                if (document.hidden) return;
                fetchMatches();
            }, 5000);
        }

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchMatches();
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

    const getJobEligibility = (job) => {
        if (!job) return {};

        let degree = job.degree || job.Degree || job.degreeRequired || "Not specified";
        let branch = job.branch || job.Branch || job.branchRequired || "Not specified";
        let minCgpa = String(job.minCgpa ?? job.MinCgpa ?? job.cgpa ?? "Not specified");
        let passingYear = job.passingYear || job.PassingYear || job.year || "Not specified";
        let experience = job.experience || job.Experience || job.experienceRequired || "Not specified";
        let roleOverview = job.additionalInfo || job.additionalinfo || job.jobRoleOverview || "This is a full-time role.";

        return { degree, branch, minCgpa, passingYear, experience, roleOverview };
    };




    return (
        <div className="dashboard-container">


            <header className="dashboard-header">

                <div className="header-left-group">
                    <button
                        type="button"
                        className="header-mobile-toggle"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle navigation menu"
                    >
                        <Menu className="mobile-menu-icon" size={22} />
                    </button>

                    <div className="header-logo">
                        <GraduationCap className="logo-icon" />
                        <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#2563eb' }}>Campus_Hire</h1>
                    </div>
                </div>

                <div className="student-nav-tabs">
                    <button type="button"
                        className={`student-nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <span>Dashboard</span>
                        {activeTab === 'dashboard' && <span className="tab-underline" />}
                    </button>
                    <button type="button"
                        className={`student-nav-tab ${activeTab === 'studhub' ? 'active' : ''}`}
                        onClick={() => setActiveTab('studhub')}
                    >
                        <span>Student Hub</span>
                        {activeTab === 'studhub' && <span className="tab-underline" />}
                    </button>
                    <button type="button"
                        className={`student-nav-tab ${activeTab === 'placeview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('placeview')}
                    >
                        <span>Placeview</span>
                        {activeTab === 'placeview' && <span className="tab-underline" />}
                    </button>
                </div>

                <div className="header-actions">
                    <span className="role-badge">Student</span>


                    <div className="notification-bell-container">
                        <button type="button" className="notification-bell" aria-label="Notifications" style={{ border: 'none', outline: 'none' }} onClick={() => {
                            setIsNotificationSidebarOpen(true);
                            setIsProfileDropdownOpen(false);
                        }}>
                            <motion.div style={{ display: 'flex' }} whileHover={{ rotate: [0, -15, 15, -15, 15, 0] }} transition={{ duration: 0.5 }}>
                                <Bell className="bell-icon" />
                            </motion.div>
                            {unreadCount > 0 && (
                                <motion.span
                                    className="bell-badge"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                    style={{ width: '16px', height: '16px', borderRadius: '50%', right: '-2px', top: '-2px', fontSize: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    {unreadCount}
                                </motion.span>
                            )}
                        </button>
                    </div>


                    <div className="profile-container">
                        <button type="button" className="profile-avatar" style={{ border: 'none', outline: 'none' }} onClick={() => {
                            setIsProfileDropdownOpen(!isProfileDropdownOpen);
                            setIsNotificationSidebarOpen(false);
                        }}>
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={studentName} className="avatar-img" />
                            ) : (
                                <span className="avatar-placeholder">{getInitials(studentName)}</span>
                            )}
                        </button>

                        {isProfileDropdownOpen && (
                            <div className="profile-dropdown">
                                <div className="dropdown-user-info" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px' }}>
                                    <AvatarPhotoMenu
                                        avatarUrl={profile.avatarUrl}
                                        onUpload={(e) => {
                                            setIsProfileDropdownOpen(false);
                                            handleStudentPhotoUpload(e);
                                        }}
                                        onRemove={() => {
                                            setIsProfileDropdownOpen(false);
                                            handleStudentRemovePhoto();
                                        }}
                                        inputId="student-header-photo-input"
                                    >
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#2563eb', color: '#ffffff', fontSize: '0.875rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                            {profile.avatarUrl ? (
                                                <img src={profile.avatarUrl} alt={studentName} className="avatar-img" />
                                            ) : (
                                                getInitials(studentName)
                                            )}
                                        </div>
                                    </AvatarPhotoMenu>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '700' }}>{studentName}</h4>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{profile.email}</p>
                                    </div>
                                </div>
                                <hr className="dropdown-divider" />

                                <button type="button" className="dropdown-item" onClick={() => {
                                    setIsProfileModalOpen(true);
                                    setIsProfileDropdownOpen(false);
                                }}>
                                    <User size={16} />
                                    <span>View Profile</span>
                                </button>
                                <button type="button" className="dropdown-item" onClick={() => {
                                    setIsChangePasswordOpen(true);
                                    setIsProfileDropdownOpen(false);
                                }}>
                                    <Lock size={16} />
                                    <span>Change Password</span>
                                </button>
                                <hr className="dropdown-divider" />
                                <button type="button" className="dropdown-item logout-btn" onClick={handleLogout}>
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>


            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
                >
                    {activeTab === 'dashboard' && (
                        <>
                            <section className="welcome-section">
                                <div className="welcome-content">
                                    <h2>Welcome, {studentName} <span className="waving-hand">👋</span></h2>
                                    <p>Here's whats's happening with your placement portal today.</p>
                                </div>
                                <div className="welcome-date-badge">
                                    <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                            </section>


                            <StudentMetricsGrid metrics={metrics} />




                            <main className="dashboard-main-content">


                                <StudentLatestJobs jobs={jobs} jobsPage={jobsPage} setJobsPage={setJobsPage} appliedJobs={appliedJobs} handleApplyClick={handleApplyClick} JOBS_PER_PAGE={JOBS_PER_PAGE} />


                                <StudentResumeMatches resumeMatches={resumeMatches} matchSearchQuery={matchSearchQuery} setMatchSearchQuery={setMatchSearchQuery} matchPage={matchPage} setMatchPage={setMatchPage} MATCHES_PER_PAGE={MATCHES_PER_PAGE} />

                            </main>
                        </>
                    )}


                    {activeTab === 'studhub' && <StudHub />}

                    {activeTab === 'placeview' && <Placeview />}
                </motion.div>
            </AnimatePresence>


            {selectedJob && (() => {
                const eligibility = getJobEligibility(selectedJob);
                return (
                    <div className="modal-overlay">
                        <div aria-label="Close modal backdrop" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "transparent", border: "none", cursor: "default" }} onClick={handleCancleApply} />
                        <div className="student-apply-modal" style={{ position: "relative", zIndex: 1 }}>

                            <div className="modal-header">
                                <h4>Job Details & Eligibility</h4>
                                <button className="close-btn" onClick={handleCancleApply}>
                                    <X size={20} />
                                </button>
                            </div>


                            <div className="modal-form">
                                <div className="form-group">
                                    <label htmlFor="modal-company">Company Name</label>
                                    <input
                                        id="modal-company"
                                        type="text"
                                        value={selectedJob.company}
                                        disabled
                                        className="read-only-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="modal-location">Location</label>
                                    <input
                                        id="modal-location"
                                        type="text"
                                        value={selectedJob.location || "Remote"}
                                        disabled
                                        className="read-only-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <div className="fake-label" style={{ display: 'block', marginBottom: '8px' }}>Job Requirements</div>
                                    <div className="read-only-requirements-list">
                                        {(selectedJob.requirements || []).map((req, idx) => (
                                            <div className="requirement-bullet-item" key={req + '-' + idx}>
                                                <span className="requirement-bullet-dot"></span>
                                                <span className="requirement-text">{req}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="modal-role">Job Role Overview</label>
                                    <textarea
                                        id="modal-role"
                                        value={selectedJob.role || "Not specified"}
                                        disabled
                                        rows={3}
                                        className="read-only-textarea"
                                    />
                                </div>

                                <div className="form-section-title">Eligibility Criteria</div>

                                <div className="form-row">
                                    <div className="form-group half-width">
                                        <label htmlFor="modal-degree">Degree</label>
                                        <input
                                            id="modal-degree"
                                            type="text"
                                            value={eligibility.degree}
                                            disabled
                                            className="read-only-input"
                                        />
                                    </div>

                                    <div className="form-group half-width">
                                        <label htmlFor="modal-branch">Branch</label>
                                        <input
                                            id="modal-branch"
                                            type="text"
                                            value={eligibility.branch}
                                            disabled
                                            className="read-only-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group half-width">
                                        <label htmlFor="modal-minCgpa">Min CGPA</label>
                                        <input
                                            id="modal-minCgpa"
                                            type="text"
                                            value={eligibility.minCgpa}
                                            disabled
                                            className="read-only-input"
                                        />
                                    </div>

                                    <div className="form-group half-width">
                                        <label htmlFor="modal-passingYear">Passing Year</label>
                                        <input
                                            id="modal-passingYear"
                                            type="text"
                                            value={eligibility.passingYear}
                                            disabled
                                            className="read-only-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group half-width">
                                        <label htmlFor="modal-experience">Experience</label>
                                        <input
                                            id="modal-experience"
                                            type="text"
                                            value={eligibility.experience}
                                            disabled
                                            className="read-only-input"
                                        />
                                    </div>

                                    <div className="form-group half-width">
                                        <label htmlFor="modal-deadline">Deadline</label>
                                        <input
                                            id="modal-deadline"
                                            type="text"
                                            value={selectedJob.deadline}
                                            disabled
                                            className="read-only-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-section-title">Upload Documents</div>

                                <div className="form-group full-width-resume">
                                    <label htmlFor="modal-resume-file">Upload Resume (PDF only) <span className="required-star">*</span></label>
                                    <div className="resume-upload-zone">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleResumeFileChange}
                                            id="modal-resume-file"
                                            className="file-input-hidden"
                                        />
                                        <label htmlFor="modal-resume-file" className="file-upload-label">
                                            {resumeFileName ? (
                                                <div className="file-uploaded-info">
                                                    <FileText className="file-icon-pdf" size={24} />
                                                    <div className="file-meta">
                                                        <span className="file-name-text">{resumeFileName}</span>
                                                        <span className="file-size-text">{(resumeFile?.size / 1024).toFixed(1)} KB</span>
                                                    </div>
                                                    <button type="button" className="file-remove-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setResumeFileName(""); setResumeFile(null); }}>Remove</button>
                                                </div>
                                            ) : (
                                                <div className="file-upload-placeholder">
                                                    <Upload size={24} className="upload-icon" />
                                                    <span>Click to upload or drag & drop resume PDF</span>
                                                    <span className="file-type-hint">PDF file up to 5MB</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn-cancel" onClick={handleCancleApply}>
                                        Cancel
                                    </button>
                                    <button type="button" className="btn-post" onClick={handleConfirmApply}>
                                        Confirm & Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}



            <StudentProfileModal isProfileModalOpen={isProfileModalOpen} setIsProfileModalOpen={setIsProfileModalOpen} profile={profile} isEditingProfile={isEditingProfile} setIsEditingProfile={setIsEditingProfile} handleEditProfileClick={handleEditProfileClick} handleCancelEdit={handleCancelEdit} handleSaveProfile={handleSaveProfile} tempProfile={tempProfile} setTempProfile={setTempProfile} handlePhotoUpload={handleStudentPhotoUpload} handleRemovePhoto={handleStudentRemovePhoto} />


            <StudentChangePasswordModal isChangePasswordOpen={isChangePasswordOpen} setIsChangePasswordOpen={setIsChangePasswordOpen} passwordForm={passwordForm} setPasswordForm={setPasswordForm} showCurrentPassword={showCurrentPassword} setShowCurrentPassword={setShowCurrentPassword} showNewPassword={showNewPassword} setShowNewPassword={setShowNewPassword} showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword} handlePasswordSubmit={handlePasswordSubmit} />


            <StudentNotificationSidebar isNotificationSidebarOpen={isNotificationSidebarOpen} setIsNotificationSidebarOpen={setIsNotificationSidebarOpen} unreadCount={unreadCount} handleMarkAllRead={handleMarkAllRead} notifications={notifications} />



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
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            className="student-mobile-drawer-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <motion.aside
                            className="student-mobile-drawer"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        >
                            <div className="drawer-header">
                                <div className="drawer-logo">
                                    <GraduationCap className="drawer-logo-icon" />
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
                                    className={`drawer-nav-item ${activeTab === 'studhub' ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab('studhub');
                                        setIsMobileMenuOpen(false);
                                    }}
                                >
                                    <Sparkles className="drawer-item-icon" size={18} />
                                    <span>Stud Hub</span>
                                </button>

                                <button
                                    type="button"
                                    className={`drawer-nav-item ${activeTab === 'placeview' ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab('placeview');
                                        setIsMobileMenuOpen(false);
                                    }}
                                >
                                    <TrendingUp className="drawer-item-icon" size={18} />
                                    <span>Placeview</span>
                                </button>
                            </div>

                            <hr className="drawer-divider" />

                            <div className="drawer-profile-section">
                                <div className="drawer-user-info">
                                    <div className="drawer-avatar">
                                        {profile.avatarUrl ? (
                                            <img src={profile.avatarUrl} alt={studentName} className="avatar-img" />
                                        ) : (
                                            getInitials(studentName)
                                        )}
                                    </div>
                                    <div className="drawer-user-details">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span className="drawer-user-name">{studentName}</span>
                                            <span className="role-badge drawer-role-badge">Student</span>
                                        </div>
                                        <span className="drawer-user-email">{profile.email}</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="drawer-nav-item"
                                    onClick={() => {
                                        setIsProfileModalOpen(true);
                                        setIsMobileMenuOpen(false);
                                    }}
                                >
                                    <User className="drawer-item-icon" size={18} />
                                    <span>My Profile</span>
                                </button>

                                <button
                                    type="button"
                                    className="drawer-nav-item"
                                    onClick={() => {
                                        setIsChangePasswordOpen(true);
                                        setIsMobileMenuOpen(false);
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
                                        handleLogout();
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
        </div>
    )


}


