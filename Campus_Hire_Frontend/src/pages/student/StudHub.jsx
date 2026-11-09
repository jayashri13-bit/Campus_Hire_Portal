import React, { useState, useEffect } from 'react';
import {
    Award,
    MessageSquare,
    Plus,
    Briefcase,
    Calendar,
    Clock,
    MapPin,
    Building,
    CheckCircle2,
    FileText,
    User
} from 'lucide-react';
import './StudHub.css';
import { getStudentHubQueries, raiseStudentHubQuery, resolveStudentHubQuery } from '../../api/studentApi';

const StudHub = ({
    studentName = "Rahul Patil",
    profile = {},
    nextEvent = null,
    stories = [],
    setToastMessage,
    setToastType,
    setShowToast
}) => {
    // Queries state initialized from localStorage
    const [queries, setQueries] = useState(() => {
        const stored = localStorage.getItem("student_queries");
        return stored ? JSON.parse(stored) : [
            {
                id: 1,
                name: 'Rahul Patil',
                course: 'B.Sc Computer Science',
                avatar: 'RP',
                colorClass: 'blue',
                title: 'Resume not uploading',
                message: 'I am unable to upload my resume. It shows error please help me resolve this issue.',
                date: '2 May 2025',
                status: 'resolved',
                reply: 'Please clear your browser cache and upload a PDF under 5MB. Contact support if it persists.'
            },
            {
                id: 2,
                name: 'Sneha Jadhav',
                course: 'BCA',
                avatar: 'SJ',
                colorClass: 'purple',
                title: 'Profile strength calculation',
                message: 'How is profile strength calculated? I want to improve my score.',
                date: '1 May 2025',
                status: 'resolved',
                reply: 'Profile strength score increases as you fill in your academic details, skills, and upload a verified resume.'
            },
            {
                id: 3,
                name: 'Aditya More',
                course: 'B.Sc IT',
                avatar: 'AM',
                colorClass: 'green',
                title: 'TCS Drive Eligibility',
                message: 'Am I eligible for the TCS drive? Please confirm my eligibility.',
                date: '30 Apr 2025',
                status: 'resolved',
                reply: 'Yes, all B.Sc IT students with aggregate CGPA above 6.0 are eligible for the TCS drive.'
            }
        ];
    });

    // Write back student queries when updated
    useEffect(() => {
        localStorage.setItem("student_queries", JSON.stringify(queries));
    }, [queries]);

    // Load live queries from Python FastAPI backend
    useEffect(() => {
        let isMounted = true;
        const loadLiveQueries = async () => {
            try {
                const liveQueries = await getStudentHubQueries();
                if (isMounted && Array.isArray(liveQueries) && liveQueries.length > 0) {
                    setQueries(liveQueries);
                }
            } catch (err) {
                console.log("[StudHub] Using cached queries:", err);
            }
        };
        loadLiveQueries();
        return () => { isMounted = false; };
    }, []);

    // Student Query Form states
    const [querySubject, setQuerySubject] = useState("");
    const [queryMessage, setQueryMessage] = useState("");

    // Student Query Tabs and Pagination states (independent per tab)
    const [studentQueryFilter, setStudentQueryFilter] = useState('all'); // 'all' or 'resolved'
    const [allQueriesPage, setAllQueriesPage] = useState(1);
    const [resolvedQueriesPage, setResolvedQueriesPage] = useState(1);
    const STUDENT_QUERIES_PER_PAGE = 2;

    // View Details toggle for Next Campus Event
    const [showAllEventDetails, setShowAllEventDetails] = useState(false);

    // Helpers
    const getInitials = (nameStr) => {
        if (!nameStr) return 'ST';
        const parts = nameStr.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return nameStr.substring(0, 2).toUpperCase();
    };

    const isEventTomorrow = (dateStr) => {
        if (!dateStr) return false;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowFormatted = tomorrow.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        return dateStr === tomorrowFormatted || dateStr.includes("Tomorrow");
    };

    // Handles raising a student query
    const handleRaiseQuery = async (e) => {
        e.preventDefault();
        if (!querySubject.trim() || !queryMessage.trim()) {
            if (setToastMessage) {
                setToastMessage("Please fill in both subject and description.");
                setToastType('error');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            }
            return;
        }

        const branchText = profile.branch || "B.Tech CSE";
        let newQuery = {
            id: Date.now(),
            name: studentName,
            course: branchText,
            avatar: getInitials(studentName),
            colorClass: ['blue', 'purple', 'green', 'orange'][Math.floor(Math.random() * 4)],
            title: querySubject.trim(),
            message: queryMessage.trim(),
            date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            status: 'pending'
        };

        try {
            const apiRes = await raiseStudentHubQuery({
                subject: querySubject.trim(),
                message: queryMessage.trim(),
                studentName: studentName,
                course: branchText
            });
            if (apiRes) newQuery = apiRes;
        } catch (err) {
            console.log("Local query raise:", err);
        }

        const updatedQueries = [newQuery, ...queries];
        setQueries(updatedQueries);

        setQuerySubject("");
        setQueryMessage("");

        if (setToastMessage) {
            setToastMessage("Query raised successfully! Admin will respond soon.");
            setToastType('success');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    // Handles marking a query as resolved by student
    const handleMarkQueryResolved = async (queryId) => {
        try {
            await resolveStudentHubQuery(queryId);
        } catch (err) {
            console.log("Local query resolve:", err);
        }

        const updatedQueries = queries.map(q => {
            if (q.id === queryId) {
                return {
                    ...q,
                    status: 'resolved',
                    studentConfirmed: true
                };
            }
            return q;
        });
        setQueries(updatedQueries);

        if (setToastMessage) {
            setToastMessage("Query marked as resolved! Admin has been notified.");
            setToastType('success');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    return (
        <div className="studhub-container">

            {/* Stud Hub Welcome Banner */}
            <div className="studhub-banner">
                <div className="studhub-banner-text">
                    <h2>Stud Hub <span>🚀</span></h2>
                    <p>Stay updated with placement stories, upcoming campus drives, and raise your queries — all in one place.</p>
                </div>
                <div className="welcome-date-badge">
                    <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="studhub-grid">

                {/* Left column */}
                <div className="studhub-left">

                    {/* 1. Placement Success Stories */}
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
                            <div className="sh-stories-list">
                                {stories.map((story) => (
                                    <div key={story.id} className="sh-story-card">
                                        <div className="sh-story-top">
                                            <img
                                                src={story.avatar}
                                                alt={story.name}
                                                className="sh-story-avatar"
                                                onError={(e) => { e.target.style.display = 'none'; }}
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
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. Raise a Query */}
                    <div className="sh-panel sh-query-panel">
                        <div className="sh-panel-header">
                            <div className="sh-panel-title-group">
                                <MessageSquare size={18} className="sh-panel-icon" />
                                <h3 className="sh-panel-title">Raise a Query</h3>
                            </div>
                        </div>
                        <p className="sh-panel-subtitle">Have a question? Submit it below and our admin team will respond shortly.</p>

                        <form onSubmit={handleRaiseQuery} className="sh-query-form">
                            <div className="sh-form-group">
                                <label className="sh-form-label">Query Subject <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    type="text"
                                    className="sh-form-input"
                                    placeholder="e.g. TCS Drive Eligibility, Resume Upload Issue"
                                    value={querySubject}
                                    onChange={(e) => setQuerySubject(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="sh-form-group">
                                <label className="sh-form-label">Description <span style={{ color: '#ef4444' }}>*</span></label>
                                <textarea
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
                    </div>

                </div>

                {/* Right column */}
                <div className="studhub-right">

                    {/* 3. Campus Placement Events (Next Campus Event) */}
                    <div className="sh-panel campus-event-panel">
                        <h3 className="event-panel-title">Campus Placement Drives</h3>

                        {!nextEvent ? (
                            <div className="sh-empty-state">
                                <Briefcase size={36} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                                <p>No upcoming campus events scheduled for you.</p>
                                <span>Check back soon!</span>
                            </div>
                        ) : (
                            <div className="next-event-card">
                                <div className="event-card-header-row">
                                    <div className="event-icon-box">
                                        <Calendar className="event-purple-icon" size={20} />
                                    </div>
                                    <h2 className="event-company-title">{nextEvent.company} Drive</h2>
                                </div>

                                <div className="event-details-list">
                                    {/* 1. Date */}
                                    <div className="event-detail-item">
                                        <div className="event-detail-icon-wrapper">
                                            <Calendar size={15} />
                                        </div>
                                        <div className="detail-item-text">
                                            <span className="detail-label">Date</span>
                                            <span className="detail-value">
                                                {nextEvent.date} {isEventTomorrow(nextEvent.date) ? "(Tomorrow)" : ""}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 2. Time */}
                                    <div className="event-detail-item">
                                        <div className="event-detail-icon-wrapper">
                                            <Clock size={15} />
                                        </div>
                                        <div className="detail-item-text">
                                            <span className="detail-label">Time</span>
                                            <span className="detail-value">{nextEvent.time || "10:00 AM"} Onwards</span>
                                        </div>
                                    </div>

                                    {/* 3. Location */}
                                    <div className="event-detail-item">
                                        <div className="event-detail-icon-wrapper">
                                            <MapPin size={15} />
                                        </div>
                                        <div className="detail-item-text">
                                            <span className="detail-label">Location</span>
                                            <span className="detail-value">{nextEvent.location || "Main Campus"}</span>
                                        </div>
                                    </div>

                                    {/* Remaining Details shown after clicking View Details */}
                                    {showAllEventDetails && (
                                        <>
                                            {/* 4. Venue */}
                                            <div className="event-detail-item">
                                                <div className="event-detail-icon-wrapper">
                                                    <Building size={15} />
                                                </div>
                                                <div className="detail-item-text">
                                                    <span className="detail-label">Venue</span>
                                                    <span className="detail-value">{nextEvent.venue || "Seminar Hall A"}</span>
                                                </div>
                                            </div>

                                            {/* 5. Job Role */}
                                            {nextEvent.role && (
                                                <div className="event-detail-item">
                                                    <div className="event-detail-icon-wrapper">
                                                        <Briefcase size={15} />
                                                    </div>
                                                    <div className="detail-item-text">
                                                        <span className="detail-label">Job Role</span>
                                                        <span className="detail-value">{nextEvent.role}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 6. Drive Status */}
                                            <div className="event-detail-item">
                                                <div className="event-detail-icon-wrapper">
                                                    <CheckCircle2 size={15} />
                                                </div>
                                                <div className="detail-item-text">
                                                    <span className="detail-label">Drive Status</span>
                                                    <span className="detail-value">
                                                        <span className={`event-status-pill status-${(nextEvent.status || 'upcoming').toLowerCase()}`}>
                                                            {(nextEvent.status || 'upcoming').toUpperCase()}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* 7. Target Audience */}
                                            {nextEvent.targetStudent && (
                                                <div className="event-detail-item">
                                                    <div className="event-detail-icon-wrapper">
                                                        <User size={15} />
                                                    </div>
                                                    <div className="detail-item-text">
                                                        <span className="detail-label">Target Audience</span>
                                                        <span className="detail-value">
                                                            {nextEvent.targetStudent === 'All' ? 'All Students' : nextEvent.targetStudent}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 8. About Drive / Overview */}
                                            {(nextEvent.about || nextEvent.description) && (
                                                <div className="event-detail-item">
                                                    <div className="event-detail-icon-wrapper">
                                                        <FileText size={15} />
                                                    </div>
                                                    <div className="detail-item-text">
                                                        <span className="detail-label">About Drive</span>
                                                        <span className="detail-value">{nextEvent.about || nextEvent.description}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <button
                                    className="btn-view-event-details"
                                    onClick={() => setShowAllEventDetails(!showAllEventDetails)}
                                >
                                    {showAllEventDetails ? "Hide Details" : "View Details"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 4. Query Responses */}
                    {(() => {
                        const isResolvedTab = studentQueryFilter === 'resolved';
                        const filteredStudentQueries = queries.filter(q => {
                            if (isResolvedTab) {
                                return q.status === 'resolved' || q.studentConfirmed === true;
                            }
                            return true;
                        });

                        const currentPage = isResolvedTab ? resolvedQueriesPage : allQueriesPage;
                        const setCurrentPage = isResolvedTab ? setResolvedQueriesPage : setAllQueriesPage;

                        const totalStudentQueryPages = Math.ceil(filteredStudentQueries.length / STUDENT_QUERIES_PER_PAGE) || 1;
                        const paginatedStudentQueries = filteredStudentQueries.slice(
                            (currentPage - 1) * STUDENT_QUERIES_PER_PAGE,
                            currentPage * STUDENT_QUERIES_PER_PAGE
                        );

                        const resolvedCount = queries.filter(q => q.status === 'resolved' || q.studentConfirmed).length;

                        return (
                            <div className="sh-panel sh-responses-panel">
                                <div className="sh-panel-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                                    <div className="sh-panel-header-top" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                        <div className="sh-panel-title-group">
                                            <MessageSquare size={18} className="sh-panel-icon" />
                                            <h3 className="sh-panel-title">Query Responses</h3>
                                        </div>
                                        <span className="sh-count-badge">{filteredStudentQueries.length} Queries</span>
                                    </div>

                                    {/* 2 Tabs for All Queries and Resolved Queries */}
                                    <div className="sh-query-tabs">
                                        <button
                                            type="button"
                                            className={`sh-query-tab ${studentQueryFilter === 'all' ? 'active' : ''}`}
                                            onClick={() => setStudentQueryFilter('all')}
                                        >
                                            All Queries ({queries.length})
                                        </button>
                                        <button
                                            type="button"
                                            className={`sh-query-tab ${studentQueryFilter === 'resolved' ? 'active' : ''}`}
                                            onClick={() => setStudentQueryFilter('resolved')}
                                        >
                                            Resolved ({resolvedCount})
                                        </button>
                                    </div>
                                </div>

                                {filteredStudentQueries.length === 0 ? (
                                    <div className="sh-empty-state">
                                        <MessageSquare size={32} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                                        <p>{isResolvedTab ? 'No resolved queries yet.' : 'No queries submitted yet.'}</p>
                                        <span>{isResolvedTab ? 'Mark a query as resolved when completed.' : 'Submit a query on the left to get admin assistance.'}</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="sh-query-responses-list">
                                            {paginatedStudentQueries.map((q) => (
                                                <div key={q.id} className="sh-simple-query-card">
                                                    {/* Header: Title & Action Button */}
                                                    <div className="sh-simple-card-header">
                                                        <h4 className="sh-simple-query-title">{q.title}</h4>
                                                        {q.status === 'resolved' || q.studentConfirmed ? (
                                                            <span className="sh-simple-resolved-tag">
                                                                <CheckCircle2 size={13} /> Resolved
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="btn-simple-mark-resolved"
                                                                onClick={() => handleMarkQueryResolved(q.id)}
                                                            >
                                                                <CheckCircle2 size={13} /> Query Resolved
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Admin Reply */}
                                                    <div className="sh-simple-admin-reply">
                                                        <span className="sh-simple-reply-label">Admin Reply:</span>
                                                        <p className="sh-simple-reply-text">
                                                            {q.reply || "Admin team has received your query and verified your request. Please check placement guidelines."}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Pagination Controls */}
                                        {totalStudentQueryPages > 1 && (
                                            <div className="sd-pagination" style={{ marginTop: '16px' }}>
                                                <button
                                                    className="sd-page-btn"
                                                    disabled={currentPage === 1}
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                >
                                                    ← Prev
                                                </button>
                                                <span className="sd-page-info">
                                                    Page {currentPage} of {totalStudentQueryPages}
                                                </span>
                                                <button
                                                    className="sd-page-btn"
                                                    disabled={currentPage >= totalStudentQueryPages}
                                                    onClick={() => setCurrentPage(p => Math.min(totalStudentQueryPages, p + 1))}
                                                >
                                                    Next →
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })()}

                </div>
            </div>
        </div>
    );
};

export default StudHub;
