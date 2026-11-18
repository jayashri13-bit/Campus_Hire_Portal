import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getStudentQueries, submitStudentQuery, resolveStudentQuery, getStudentPlacementStories, getStudentPlacementDrives } from '../../auth/authService';
import {
    Award,
    MessageSquare,
    Plus,
    Calendar,
    Clock,
    MapPin,
    Building,
    Briefcase,
    CheckCircle2,
    XCircle,
    User
} from "lucide-react";
import "./StudHub.css";

// Default fallback mock data
const initialDrives = [];
const initialStories = [];
const initialStudentQueries = [];


// HELPER FUNCTIONS

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





const parseAndFormatDate = (dateData) => {
    try {
        const gbOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
        if (!dateData) {
            return new Date().toLocaleString('en-GB', gbOptions).replace(',', '');
        }
        if (Array.isArray(dateData)) {
            if (dateData.length >= 5) {
                const year = String(dateData[0]);
                const month = String(dateData[1]).padStart(2, '0');
                const day = String(dateData[2]).padStart(2, '0');
                const hour = String(dateData[3]).padStart(2, '0');
                const minute = String(dateData[4]).padStart(2, '0');
                return `${day}/${month}/${year} ${hour}:${minute}`;
            }
            if (dateData.length >= 3) {
                const day = String(dateData[2]).padStart(2, '0');
                const month = String(dateData[1]).padStart(2, '0');
                const year = String(dateData[0]);
                return `${day}/${month}/${year}`;
            }
        }
        const dateStr = dateData;
        const ddMmYyyyMatch = typeof dateStr === 'string' && /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/.exec(dateStr);
        if (ddMmYyyyMatch) {
            return dateStr;
        }

        if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateStr)) {
            if (dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr)) {
                const parsed = new Date(dateStr);
                if (!Number.isNaN(parsed.getTime())) {
                    return parsed.toLocaleString('en-GB', gbOptions).replace(',', '');
                }
            } else {
                const [datePart, timePart] = dateStr.split('T');
                const [y, m, d] = datePart.split('-');
                const [hh, mm] = timePart.split(':');
                return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y} ${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
            }
        }

        const parsed = new Date(dateStr);
        if (Number.isNaN(parsed.getTime())) return typeof dateStr === 'string' ? dateStr.split('T')[0] : "Recently";
        return parsed.toLocaleString('en-GB', gbOptions).replace(',', '');
    } catch {
        return "Recently";
    }
};

const filterDrivesForStudent = (drives, studentEmail, studentName) => {
    return drives.filter(drive => {
        let targets = drive.targetStudent || [];
        if (typeof targets === 'string') {
            targets = targets.split(',').map(t => t.trim());
        }

        const lowerTargets = targets.map(t => typeof t === 'string' ? t.toLowerCase().trim() : '');

        if (lowerTargets.length === 0 || lowerTargets.includes("") || lowerTargets.includes("all")) {
            return true;
        }

        const matchEmail = studentEmail !== "" && lowerTargets.some(t => studentEmail.includes(t));
        const matchName = studentName !== "" && lowerTargets.some(t => studentName.includes(t));

        return matchEmail || matchName;
    });
};

const mapDriveData = (d) => {
    let targets = [];
    if (Array.isArray(d.targetStudent)) {
        targets = [...d.targetStudent];
    } else if (typeof d.targetStudent === 'string') {
        targets = d.targetStudent.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (d.specificStudentName && d.specificStudentName.trim() !== '') {
        targets.push(d.specificStudentName.trim());
    }

    return {
        id: d.id,
        company: d.companyName,
        role: d.jobRole,
        location: d.location,
        date: d.driveDate,
        time: d.driveTime || 'TBA',
        venue: d.venue || 'TBA',
        eligibility: d.eligibilityCriteria || 'Not Specified',
        status: (d.status || 'Upcoming').toLowerCase(),
        logoLetter: d.companyName ? d.companyName.charAt(0).toUpperCase() : 'C',
        logoColor: '#2563eb',
        targetStudent: targets.length > 0 ? targets : 'all'
    };
};

const mapStoryData = (story) => {
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(story.studentName)}&background=2563eb&color=fff`;
    return {
        id: story.id,
        name: story.studentName,
        avatar: story.photoPath || avatarUrl,
        company: story.companyName,
        companyColor: '#eff6ff',
        companyTextColor: '#2563eb',
        role: story.jobRole,
        packageAmt: story.packageLpa ? `${story.packageLpa} LPA` : 'Not Disclosed',
        storyText: story.successStory,
        date: parseAndFormatDate(story.createdAt)
    };
};

const mapQueryData = (q) => ({
    id: q.id,
    title: q.subject,
    message: q.description,
    status: q.status ? q.status.toLowerCase() : 'pending',
    reply: q.adminReply || '',
    date: parseAndFormatDate(q.createdAt)
});


// SUB-COMPONENTS


const PlacementStoriesPanel = ({ stories, paginatedStories, storiesPage, setStoriesPage, totalStoriesPages }) => (
    <div className="sh-panel">
        <div className="sh-panel-header">
            <div className="sh-panel-title-group">
                <Award size={18} className="sh-panel-icon" />
                <h3 className="sh-panel-title">Placement Success Stories</h3>
            </div>
            <span className="sh-count-badge">{stories.length} Stories</span>
        </div>

        {stories.length === 0 ? (
            <div className="sh-empty-state">
                <Award size={36} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                <p>No placement stories published yet.</p>
                <span>Check back soon!</span>
            </div>
        ) : (
            <>
                <div className="sh-stories-list">
                    {paginatedStories.map((story, index) => (
                        <motion.div key={story.id} className="sh-story-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.4 }} whileHover={{ y: -5 }}>
                            <div className="sh-story-top">
                                <img
                                    src={story.avatar}
                                    alt={story.name}
                                    className="sh-story-avatar"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(story.name)}&background=2563eb&color=fff`;
                                    }}
                                />
                                <div className="sh-story-info">
                                    <h4 className="sh-story-name">{story.name}</h4>
                                    <span
                                        className="sh-company-badge"
                                        style={{ backgroundColor: story.companyColor || '#eff6ff', color: story.companyTextColor || '#2563eb' }}
                                    >
                                        {story.company}
                                    </span>
                                </div>
                            </div>
                            <div className="sh-story-body">
                                <p className="sh-role-line" style={{ color: story.companyTextColor || '#2563eb' }}>
                                    {story.role}
                                </p>
                                <p className="sh-story-quote">
                                    &ldquo;{story.storyText || `Secured a ${story.role} role at ${story.company}.`}&rdquo;
                                </p>
                                <div className="sh-story-footer">
                                    <span className="sh-package-tag">💰 {story.packageAmt || 'Not Disclosed'}</span>
                                    <span className="sh-date-tag">📅 {story.date}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {totalStoriesPages > 1 && (
                    <div className="sh-pagination-wrapper">
                        <button
                            type="button"
                            className="stories-nav-btn"
                            onClick={() => setStoriesPage(prev => Math.max(prev - 1, 1))}
                            disabled={storiesPage === 1}
                        >
                            &larr; Prev
                        </button>
                        <span className="stories-page-info">
                            Page {storiesPage} of {totalStoriesPages}
                        </span>
                        <button
                            type="button"
                            className="stories-nav-btn"
                            onClick={() => setStoriesPage(prev => Math.min(prev + 1, totalStoriesPages))}
                            disabled={storiesPage === totalStoriesPages}
                        >
                            Next &rarr;
                        </button>
                    </div>
                )}
            </>
        )}
    </div>
);

const RaiseQueryForm = ({ querySubject, setQuerySubject, queryMessage, setQueryMessage, handleRaiseQuery }) => (
    <motion.div className="sh-panel sh-query-panel" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
        <div className="sh-panel-header">
            <div className="sh-panel-title-group">
                <MessageSquare size={18} className="sh-panel-icon" />
                <h3 className="sh-panel-title">Raise a Query</h3>
            </div>
        </div>
        <p className="sh-panel-subtitle">Have a question? Submit it below and our admin team will respond shortly.</p>

        <form onSubmit={handleRaiseQuery} className="sh-query-form">
            <div className="sh-form-group">
                <label htmlFor="query-subject" className="sh-form-label">Query Subject <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                    id="query-subject"
                    type="text"
                    className="sh-form-input"
                    placeholder="e.g. TCS Drive Eligibility, Resume Upload Issue"
                    value={querySubject}
                    onChange={(e) => setQuerySubject(e.target.value)}
                    required
                />
            </div>
            <div className="sh-form-group">
                <label htmlFor="query-description" className="sh-form-label">Description <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea
                    id="query-description"
                    className="sh-form-textarea"
                    placeholder="Describe your query in detail..."
                    rows={4}
                    value={queryMessage}
                    onChange={(e) => setQueryMessage(e.target.value)}
                    required
                />
            </div>
            <button type="submit" className="sh-submit-btn">
                <Plus size={16} />
                Submit Query
            </button>
        </form>
    </motion.div>
);

const CampusDrivesPanel = ({ totalDrivePages, currentDrive, showDriveDetails, setShowDriveDetails, drivesPage, setDrivesPage, formattedTime, formattedTarget }) => (
    <div className="sh-panel campus-event-panel">
        <div className="campus-drives-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="event-panel-title">Campus Placement Drives</h3>
            <span className="sh-count-badge" style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '700' }}>
                {totalDrivePages} {totalDrivePages === 1 ? 'Drive' : 'Drives'}
            </span>
        </div>

        {currentDrive ? (
            <motion.div className="next-event-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                <div className="event-card-header-row">
                    <div className="event-icon-box">
                        {currentDrive?.logo ? (
                            <img
                                src={currentDrive.logo}
                                alt={currentDrive.company}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    objectFit: 'contain',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    background: '#ffffff',
                                    padding: '3px'
                                }}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                }}
                            />
                        ) : null}
                        <Calendar className="event-purple-icon" size={20} style={{ display: currentDrive?.logo ? 'none' : 'block' }} />
                    </div>
                    <h2 className="event-company-title">{currentDrive.company} Drive</h2>
                </div>

                <div className="event-details-card-box">

                    <div className="event-detail-row">
                        <div className="event-detail-icon-wrapper">
                            <Calendar size={16} />
                        </div>
                        <div className="detail-item-content">
                            <span className="detail-field-label">DATE</span>
                            <div className="detail-badge-box">
                                {currentDrive.date || 'TBA'}
                            </div>
                        </div>
                    </div>

                    <div className="event-detail-row">
                        <div className="event-detail-icon-wrapper">
                            <Clock size={16} />
                        </div>
                        <div className="detail-item-content">
                            <span className="detail-field-label">TIME</span>
                            <div className="detail-badge-box">
                                {formattedTime}
                            </div>
                        </div>
                    </div>

                    <div className="event-detail-row">
                        <div className="event-detail-icon-wrapper">
                            <MapPin size={16} />
                        </div>
                        <div className="detail-item-content">
                            <span className="detail-field-label">LOCATION</span>
                            <div className="detail-badge-box">
                                {currentDrive.location || 'TBA'}
                            </div>
                        </div>
                    </div>

                    {showDriveDetails && (
                        <>
                            <div className="event-detail-row">
                                <div className="event-detail-icon-wrapper">
                                    <Building size={16} />
                                </div>
                                <div className="detail-item-content">
                                    <span className="detail-field-label">VENUE</span>
                                    <div className="detail-badge-box">
                                        {currentDrive.venue || "TBA"}
                                    </div>
                                </div>
                            </div>

                            <div className="event-detail-row">
                                <div className="event-detail-icon-wrapper">
                                    <Briefcase size={16} />
                                </div>
                                <div className="detail-item-content">
                                    <span className="detail-field-label">JOB ROLE</span>
                                    <div className="detail-badge-box">
                                        {currentDrive.role || "TBA"}
                                    </div>
                                </div>
                            </div>

                            <div className="event-detail-row">
                                <div className="event-detail-icon-wrapper">
                                    <CheckCircle2 size={16} />
                                </div>
                                <div className="detail-item-content">
                                    <span className="detail-field-label">DRIVE STATUS</span>
                                    <div>
                                        <span className={`drive-status-pill badge-${(currentDrive.status || 'open').toLowerCase()}`}>
                                            {(currentDrive.status || 'OPEN').toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="event-detail-row">
                                <div className="event-detail-icon-wrapper">
                                    <User size={16} />
                                </div>
                                <div className="detail-item-content">
                                    <span className="detail-field-label">TARGET AUDIENCE</span>
                                    <div className="detail-badge-box">
                                        {formattedTarget}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    className="btn-toggle-drive-details"
                    onClick={() => setShowDriveDetails(!showDriveDetails)}
                >
                    {showDriveDetails ? "Hide Details" : "View Details"}
                </button>

                {totalDrivePages > 1 && (
                    <div className="sh-pagination-wrapper" style={{ marginTop: '16px' }}>
                        <button
                            type="button"
                            className="stories-nav-btn"
                            onClick={() => setDrivesPage(prev => Math.max(prev - 1, 1))}
                            disabled={drivesPage === 1}
                        >
                            &larr; Prev Drive
                        </button>
                        <span className="stories-page-info">
                            Drive {drivesPage} of {totalDrivePages}
                        </span>
                        <button
                            type="button"
                            className="stories-nav-btn"
                            onClick={() => setDrivesPage(prev => Math.min(prev + 1, totalDrivePages))}
                            disabled={drivesPage === totalDrivePages}
                        >
                            Next Drive &rarr;
                        </button>
                    </div>
                )}
            </motion.div>
        ) : (
            <div className="no-events-placeholder" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                No upcoming campus placement drives.
            </div>
        )}
    </div>
);

const QueryResponsesPanel = ({
    queryResponseTab, setQueryResponseTab, allQueriesList, resolvedQueriesList,
    paginatedQueryResponses, handleResolveQuery, currentPageNum, totalQueryPages, handlePageChange
}) => (
    <div className="sh-panel query-responses-panel">
        <div className="sh-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div className="sh-panel-title-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} style={{ color: '#2563eb' }} />
                <h3 className="sh-panel-title" style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Query Responses</h3>
            </div>
            <span className="sh-count-badge" style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '700' }}>
                {allQueriesList.length} Queries
            </span>
        </div>

        <div className="query-filter-segment">
            <div className="query-segment-container">
                <button
                    type="button"
                    className={`query-segment-btn ${queryResponseTab === 'all' ? 'active' : ''}`}
                    onClick={() => setQueryResponseTab('all')}
                >
                    All Queries ({allQueriesList.length})
                </button>
                <button
                    type="button"
                    className={`query-segment-btn ${queryResponseTab === 'resolved' ? 'active' : ''}`}
                    onClick={() => setQueryResponseTab('resolved')}
                >
                    Resolved ({resolvedQueriesList.length})
                </button>
            </div>
        </div>

        <div className="query-responses-list">
            {paginatedQueryResponses.length > 0 ? (
                paginatedQueryResponses.map((query) => {
                    const rawReply = (query.reply || query.adminReply || '').trim();
                    const hasAdminReply = rawReply !== '' && rawReply !== 'Your query has been submitted. Admin team will respond shortly.';
                    const isResolved = query.status === 'resolved';

                    return (
                        <div key={query.id} className="query-response-card">
                            <div className="query-card-header-line">
                                <div>
                                    <h4 className="query-card-title" style={{ margin: 0 }}>{query.title || query.subject || 'Student Query'}</h4>
                                    {query.date && (
                                        <div className="query-date-text" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={12} /> {query.date}
                                        </div>
                                    )}
                                </div>
                                <div className="query-status-action-wrapper">
                                    {!isResolved && hasAdminReply && (
                                        <div className="query-click-popup">
                                            Click to mark resolved &rarr;
                                        </div>
                                    )}
                                    {isResolved ? (
                                        <button
                                            type="button"
                                            className="query-status-pill-btn resolved"
                                            disabled
                                            title="Resolved"
                                        >
                                            <CheckCircle2 size={13} />
                                            Resolved
                                        </button>
                                    ) : hasAdminReply ? (
                                        <button
                                            type="button"
                                            className="query-status-pill-btn pending"
                                            onClick={() => handleResolveQuery(query.id)}
                                            title="Click to mark query as resolved"
                                        >
                                            <CheckCircle2 size={13} />
                                            Mark Resolved
                                        </button>
                                    ) : (
                                        <span
                                            className="query-status-pill-btn awaiting"
                                            title="Awaiting official admin reply"
                                        >
                                            <Clock size={13} />
                                            Awaiting Admin Reply
                                        </span>
                                    )}
                                </div>
                            </div>

                            {hasAdminReply && (
                                <div className="admin-reply-box">
                                    <span className="reply-header-label">ADMIN REPLY:</span>
                                    <p className="reply-text-content">
                                        {rawReply}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <div className="sh-empty-state">
                    <p>No {queryResponseTab === 'resolved' ? 'resolved' : ''} queries found.</p>
                </div>
            )}
        </div>

        <div className="stories-pagination-footer" style={{ paddingBottom: '20px' }}>
            <button
                type="button"
                className="stories-nav-btn"
                onClick={() => handlePageChange(Math.max(currentPageNum - 1, 1))}
                disabled={currentPageNum === 1}
            >
                &larr; Prev
            </button>
            <span className="stories-page-info">
                Page {currentPageNum} of {totalQueryPages}
            </span>
            <button
                type="button"
                className="stories-nav-btn"
                onClick={() => handlePageChange(Math.min(currentPageNum + 1, totalQueryPages))}
                disabled={currentPageNum === totalQueryPages}
            >
                Next &rarr;
            </button>
        </div>
    </div>
);



// FORMATTING HELPERS
const getDriveTime = (time) => {
    if (!time) return 'TBA';
    if (time.includes("Onwards")) return time;
    return `${time} Onwards`;
};

const getDriveTarget = (target) => {
    if (!target) return 'All Students';

    if (Array.isArray(target)) {
        const specificTargets = target.filter(t => typeof t === 'string' && t.trim() !== '' && t.toLowerCase() !== 'all');
        if (specificTargets.length > 0) {
            return specificTargets.join(', ');
        }
        return 'All Students';
    }

    if (typeof target === 'string') {
        if (target.toLowerCase() === 'all') return 'All Students';
        return target;
    }

    return 'All Students';
};

const formatDriveDetails = (currentDrive) => {
    if (!currentDrive) return { formattedTime: 'TBA', formattedTarget: 'All Students' };

    return {
        formattedTime: getDriveTime(currentDrive.time),
        formattedTarget: getDriveTarget(currentDrive.targetStudent)
    };
};

// CUSTOM HOOK FOR API LOGIC
function useStudHubData() {
    const [drives, setDrives] = useState(initialDrives);
    const [stories, setStories] = useState(initialStories);
    const [queries, setQueries] = useState(() => {
        const stored = localStorage.getItem("student_queries");
        return stored && JSON.parse(stored).length > 0 ? JSON.parse(stored) : initialStudentQueries;
    });

    const fetchQueries = async () => {
        try {
            const response = await getStudentQueries();
            if (response.data && Array.isArray(response.data)) {
                const mappedQueries = response.data.map(mapQueryData);
                mappedQueries.sort((a, b) => b.id - a.id);
                setQueries(mappedQueries);
            }
        } catch (error) {
            console.error("Failed to fetch student queries:", error);
        }
    };

    const fetchStories = async () => {
        try {
            const response = await getStudentPlacementStories();
            if (response.data && Array.isArray(response.data)) {
                const mappedStories = response.data.map(mapStoryData);
                mappedStories.sort((a, b) => b.id - a.id);
                setStories(mappedStories);
            }
        } catch (error) {
            console.error("Failed to fetch placement stories:", error);
        }
    };

    const fetchDrives = async () => {
        try {
            const response = await getStudentPlacementDrives();
            if (response.data && Array.isArray(response.data)) {
                const mappedDrives = response.data.map(mapDriveData);
                mappedDrives.sort((a, b) => b.id - a.id);
                setDrives(mappedDrives);
            }
        } catch (error) {
            console.error("Failed to fetch placement drives:", error);
        }
    };

    useEffect(() => {
        fetchQueries();

        let pollInterval;
        if (import.meta.env.MODE !== 'test') {
            pollInterval = setInterval(() => {
                if (document.hidden) return;
                fetchQueries();
            }, 5000);
        }

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchQueries();
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

    useEffect(() => {
        fetchStories();
        fetchDrives();

        let pollInterval;
        if (import.meta.env.MODE !== 'test') {
            pollInterval = setInterval(() => {
                if (document.hidden) return;
                fetchStories();
                fetchDrives();
            }, 5000);
        }

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchStories();
                fetchDrives();
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

    useEffect(() => {
        if (!Array.isArray(queries)) return;
        const sanitizedQueries = queries.map(q => ({
            id: typeof q.id === 'number' ? q.id : Number(q.id) || 0,
            studentName: sanitizeStorageString(q.studentName),
            subject: sanitizeStorageString(q.subject),
            message: sanitizeStorageString(q.message),
            date: sanitizeStorageString(q.date),
            status: sanitizeStorageString(q.status),
            reply: sanitizeStorageString(q.reply)
        }));
        localStorage.setItem("student_queries", JSON.stringify(sanitizedQueries));
    }, [queries]);

    return { drives, setDrives, stories, setStories, queries, setQueries };
}

function useQueriesPanel(queries, setQueries) {
    const [querySubject, setQuerySubject] = useState("");
    const [queryMessage, setQueryMessage] = useState("");
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success");
    const [showToast, setShowToast] = useState(false);

    const triggerToast = (msg, type = "success") => {
        setToastMessage(msg);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleRaiseQuery = async (e) => {
        e.preventDefault();
        if (!querySubject.trim() || !queryMessage.trim()) return;

        try {
            const payload = { subject: querySubject, description: queryMessage };
            const response = await submitStudentQuery(payload);
            const createdQuery = response.data || { ...payload, id: Date.now(), createdAt: new Date() };

            const newQuery = {
                id: createdQuery.id,
                title: createdQuery.subject,
                message: createdQuery.description,
                status: 'pending',
                reply: '',
                date: new Date(createdQuery.createdAt || new Date()).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
            };

            setQueries(prev => [newQuery, ...prev]);
            setQuerySubject("");
            setQueryMessage("");
            triggerToast("Query submitted successfully! Admin will respond shortly.", "success");
            try { await fetchQueries(); } catch (err) { console.error(err); }
        } catch (error) {
            console.error("Failed to submit query:", error);
            triggerToast("Failed to submit query. Please try again.", "error");
        }
    };

    const handleResolveQuery = async (queryId) => {
        try {
            await resolveStudentQuery(queryId);
            setQueries(prev => prev.map(q => q.id === queryId ? { ...q, status: 'resolved' } : q));
            triggerToast("Query marked as resolved!", "success");
            try { await fetchQueries(); } catch (err) { console.error(err); }
        } catch (error) {
            console.error("Failed to resolve query:", error);
            triggerToast("Failed to resolve query.", "error");
        }
    };

    const [queryResponseTab, setQueryResponseTab] = useState('all');
    const [allQueriesPage, setAllQueriesPage] = useState(1);
    const [resolvedQueriesPage, setResolvedQueriesPage] = useState(1);
    const QUERIES_PER_PAGE = 2;

    const allQueriesList = queries.length > 0 ? queries : initialStudentQueries;
    const resolvedQueriesList = allQueriesList.filter(q => q.status === 'resolved');
    const currentQueriesList = queryResponseTab === 'all' ? allQueriesList : resolvedQueriesList;
    const currentPageNum = queryResponseTab === 'all' ? allQueriesPage : resolvedQueriesPage;
    const totalQueryPages = Math.ceil(currentQueriesList.length / QUERIES_PER_PAGE) || 1;
    const paginatedQueryResponses = currentQueriesList.slice(
        (currentPageNum - 1) * QUERIES_PER_PAGE,
        currentPageNum * QUERIES_PER_PAGE
    );

    const handlePageChange = (newPage) => {
        if (queryResponseTab === 'all') {
            setAllQueriesPage(newPage);
        } else {
            setResolvedQueriesPage(newPage);
        }
    };

    return {
        querySubject, setQuerySubject,
        queryMessage, setQueryMessage,
        toastMessage, toastType, showToast,
        handleRaiseQuery, handleResolveQuery,
        queryResponseTab, setQueryResponseTab,
        allQueriesList, resolvedQueriesList,
        paginatedQueryResponses, currentPageNum,
        totalQueryPages, handlePageChange
    };
}

function useDrivesPagination(drives, studentEmail, studentName) {
    const studentFilteredDrives = filterDrivesForStudent(drives, studentEmail, studentName);
    const activeDrives = studentFilteredDrives.filter(d => d.status === 'open' || d.status === 'upcoming');
    let drivesList = initialDrives;
    if (activeDrives.length > 0) {
        drivesList = activeDrives;
    } else if (studentFilteredDrives.length > 0) {
        drivesList = studentFilteredDrives;
    }
    const [drivesPage, setDrivesPage] = useState(1);
    const totalDrivePages = drivesList.length;
    const currentDrive = drivesList.length > 0 ? drivesList[Math.min(drivesPage - 1, drivesList.length - 1)] : null;

    return { drivesPage, setDrivesPage, totalDrivePages, currentDrive };
}

function useStoriesPagination(stories) {
    const [storiesPage, setStoriesPage] = useState(1);
    const STORIES_PER_PAGE = 2;
    const totalStoriesPages = Math.ceil(stories.length / STORIES_PER_PAGE) || 1;
    const paginatedStories = stories.slice((storiesPage - 1) * STORIES_PER_PAGE, storiesPage * STORIES_PER_PAGE);

    return { storiesPage, setStoriesPage, totalStoriesPages, paginatedStories };
}

// MAIN COMPONENT

export default function StudHub() {
    const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
    const [showDriveDetails, setShowDriveDetails] = useState(false);

    const { drives, stories, queries, setQueries } = useStudHubData();

    const studentEmail = decodeStorageString(loggedInUser.email || "").toLowerCase().trim();
    const studentName = decodeStorageString(loggedInUser.fullName || loggedInUser.name || "").toLowerCase().trim();

    const { storiesPage, setStoriesPage, totalStoriesPages, paginatedStories } = useStoriesPagination(stories);
    const { drivesPage, setDrivesPage, totalDrivePages, currentDrive } = useDrivesPagination(drives, studentEmail, studentName);

    const {
        querySubject, setQuerySubject, queryMessage, setQueryMessage,
        toastMessage, toastType, showToast, handleRaiseQuery, handleResolveQuery,
        queryResponseTab, setQueryResponseTab, allQueriesList, resolvedQueriesList,
        paginatedQueryResponses, currentPageNum, totalQueryPages, handlePageChange
    } = useQueriesPanel(queries, setQueries);

    const { formattedTime, formattedTarget } = formatDriveDetails(currentDrive);

    return (
        <motion.div className="studhub-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="studhub-banner">
                <div className="studhub-banner-text">
                    <h2>Student Hub <span>🚀</span></h2>
                    <p>Stay updated with placement stories, upcoming campus drives, and raise your queries — all in one place.</p>
                </div>
                <div className="welcome-date-badge">
                    <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
            </div>

            <div className="studhub-grid">
                <div className="studhub-left">
                    <PlacementStoriesPanel
                        stories={stories}
                        paginatedStories={paginatedStories}
                        storiesPage={storiesPage}
                        setStoriesPage={setStoriesPage}
                        totalStoriesPages={totalStoriesPages}
                    />

                    <RaiseQueryForm
                        querySubject={querySubject}
                        setQuerySubject={setQuerySubject}
                        queryMessage={queryMessage}
                        setQueryMessage={setQueryMessage}
                        handleRaiseQuery={handleRaiseQuery}
                    />
                </div>

                <div className="studhub-right">
                    <CampusDrivesPanel
                        totalDrivePages={totalDrivePages}
                        currentDrive={currentDrive}
                        showDriveDetails={showDriveDetails}
                        setShowDriveDetails={setShowDriveDetails}
                        drivesPage={drivesPage}
                        setDrivesPage={setDrivesPage}
                        formattedTime={formattedTime}
                        formattedTarget={formattedTarget}
                    />

                    <QueryResponsesPanel
                        queryResponseTab={queryResponseTab}
                        setQueryResponseTab={setQueryResponseTab}
                        allQueriesList={allQueriesList}
                        resolvedQueriesList={resolvedQueriesList}
                        paginatedQueryResponses={paginatedQueryResponses}
                        handleResolveQuery={handleResolveQuery}
                        currentPageNum={currentPageNum}
                        totalQueryPages={totalQueryPages}
                        handlePageChange={handlePageChange}
                    />
                </div>
            </div>

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
        </motion.div>
    );
}
