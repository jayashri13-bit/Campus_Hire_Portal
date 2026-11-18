import { motion } from 'framer-motion';

import { useState, useEffect, useRef } from "react";
import { getAllPlacementDrives, addPlacementDrive, getAllQueries, replyToQuery, discardQuery, updatePlacementDrive, deletePlacementDrive, publishPlacementStory, getAllPlacementStories, updatePlacementStory, deletePlacementStory, getAllStudentsForDrive } from '../../auth/authService';
import {
    Search,
    Calendar,
    Upload,
    Plus,
    Edit2,
    Trash2,
    Clock,
    X,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import './QueriesStories.css';

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



/*
  Converts a backend `createdAt` field (which can be an ISO string, a DD/MM/YYYY HH:MM string,
  or a Java LocalDateTime array) into a human-readable en-GB date/time string.
 */
function parseCreatedAt(createdAt) {
    try {
        const gbOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
        if (!createdAt) {
            return new Date().toLocaleString('en-GB', gbOptions).replace(',', '');
        }
        if (Array.isArray(createdAt)) {
            if (createdAt.length >= 5) {
                const year = String(createdAt[0]);
                const month = String(createdAt[1]).padStart(2, '0');
                const day = String(createdAt[2]).padStart(2, '0');
                const hour = String(createdAt[3]).padStart(2, '0');
                const minute = String(createdAt[4]).padStart(2, '0');
                return `${day}/${month}/${year} ${hour}:${minute}`;
            }
            if (createdAt.length >= 3) {
                const day = String(createdAt[2]).padStart(2, '0');
                const month = String(createdAt[1]).padStart(2, '0');
                const year = String(createdAt[0]);
                return `${day}/${month}/${year}`;
            }
        }
        const dateStr = createdAt;
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
        if (Number.isNaN(parsed.getTime())) {
            return typeof dateStr === 'string' ? dateStr.split('T')[0] : 'Recently';
        }
        return parsed.toLocaleString('en-GB', gbOptions).replace(',', '');
    } catch {
        return 'Recently';
    }
}

const AVATAR_BG_MAP = {
    blue: '#dbeafe',
    purple: '#e9d5ff',
    green: '#a7f3d0',
    orange: '#fed7aa',
};

const AVATAR_TEXT_MAP = {
    blue: '#1e40af',
    purple: '#581c87',
    green: '#047857',
    orange: '#c2410c',
};

/** Returns background color for query avatar circle. */
function getAvatarBgColor(colorClass) {
    return AVATAR_BG_MAP[colorClass] || '#e0e7ff';
}

/** Returns text color for query avatar circle. */
function getAvatarTextColor(colorClass) {
    return AVATAR_TEXT_MAP[colorClass] || '#4f46e5';
}

// -----------------------------------------------------------------------------------------

/** Builds a 2-letter avatar string from a student's full name. */
function buildQueryAvatar(studentName) {
    const nameParts = (studentName || 'Student').trim().split(' ');
    const avatar = nameParts.length > 1 && nameParts[1]
        ? nameParts[0][0] + nameParts[1][0]
        : nameParts[0][0];
    return avatar.toUpperCase();
}

/** Returns up to maxVisible page numbers centered around current page. */
function getVisiblePageNumbers(current, total, maxVisible = 3) {
    if (total <= maxVisible) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    let start = Math.max(1, current - 1);
    let end = start + maxVisible - 1;
    if (end > total) {
        end = total;
        start = Math.max(1, end - maxVisible + 1);
    }
    const pages = [];
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }
    return pages;
}


/** Builds the API payload object for creating or updating a placement drive. */
function buildDrivePayload(driveForm) {
    const targetStudent = typeof driveForm.targetStudent === 'string'
        ? driveForm.targetStudent.split(',').map(t => t.trim()).filter(Boolean)
        : (driveForm.targetStudent || []);
    return {
        companyName: driveForm.company.trim(),
        jobRole: driveForm.role.trim(),
        location: driveForm.location.trim(),
        venue: driveForm.venue ? driveForm.venue.trim() : "",
        driveDate: driveForm.date ? driveForm.date.trim() : "2026-07-23",
        driveTime: driveForm.time ? driveForm.time.trim() : "",
        status: driveForm.status || "Open",
        targetStudent,
        specificStudentName: (driveForm.customTarget || "").trim()
    };
}

/** Loads initial student queries state from localStorage. */
function loadInitialStudentQueries() {
    const stored = localStorage.getItem("student_queries");
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return [];
        }
    }
    return [];
}

/** Maps backend drive object to UI drive object. */
function mapApiDriveToUi(d) {
    return {
        ...d,
        id: d.id,
        company: d.companyName || d.company || "Unknown Company",
        role: d.jobRole || d.role || "Unknown Role",
        location: d.location || "Unknown Location",
        date: d.driveDate || d.date || "TBD",
        time: d.driveTime || d.time || "TBD",
        status: d.status,
        venue: d.venue || "",
    };
}

/** Maps backend story object to UI story object. */
function mapApiStoryToUi(s) {
    const avatarUrl = s.photoPath || 'https://via.placeholder.com/150';
    return {
        id: s.id,
        name: s.studentName,
        avatar: avatarUrl,
        company: s.companyName,
        companyColor: '#eff6ff',
        companyTextColor: '#2563eb',
        role: s.jobRole || 'Placed Student',
        packageAmt: s.packageLpa ? `${s.packageLpa} LPA` : '6.0 LPA',
        storyText: s.successStory || `Secured placement at ${s.companyName}.`,
        date: parseCreatedAt(s.createdAt)
    };
}

/** Converts data URL photo string into a File object for API upload. */
async function preparePhotoFile(photoDataUrl) {
    if (!photoDataUrl?.startsWith('data:')) return null;
    try {
        const photoBlob = await (await fetch(photoDataUrl)).blob();
        return photoBlob ? new File([photoBlob], "photo.png", { type: photoBlob.type }) : null;
    } catch {
        return null;
    }
}

/** Extracts user-friendly error message from story API publish/update failures. */
function parseStoryError(error) {
    let errorMsg = "Failed to publish story.";
    if (error.response?.status === 413) {
        errorMsg = "Photo is large size";
    } else if (typeof error.response?.data === 'string' && error.response.data.includes('<html')) {
        errorMsg = `Server Error (${error.response?.status || 'Unknown'}). Please try again.`;
    } else {
        errorMsg = error.response?.data?.message || error.response?.data || error.message || errorMsg;
    }
    return typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
}

const INITIAL_STORY_FORM = {
    studentName: '',
    companyName: '',
    jobRole: '',
    package: '',
    storyText: '',
    photo: ''
};

const INITIAL_DRIVE_FORM = {
    company: '',
    role: '',
    location: '',
    date: '',
    time: '',
    venue: 'Seminar Hall A',
    status: 'OPEN',
    targetStudent: 'ALL',
    customTarget: ''
};

/** Pure helper: filters student queries based on search query and status filter. */
function filterStudentQueries(queries, querySearch, queryFilter) {
    const searchLower = (querySearch || "").toLowerCase();
    return queries.filter(q => {
        const matchesSearch = !searchLower ||
            (q.name || "").toLowerCase().includes(searchLower) ||
            (q.title || "").toLowerCase().includes(searchLower) ||
            (q.message || "").toLowerCase().includes(searchLower);
        const matchesStatus = queryFilter === 'all' || q.status === queryFilter;
        return matchesSearch && matchesStatus;
    });
}

/*Pure helper: filters placement drives by company or role keyword. */
function filterPlacementDrives(drives, driveSearch) {
    const searchLower = (driveSearch || "").toLowerCase();
    if (!searchLower) return drives;
    return drives.filter(d =>
        (d.company || "").toLowerCase().includes(searchLower) ||
        (d.role || "").toLowerCase().includes(searchLower)
    );
}

/* Pure helper: filters placement stories by year string. */
function filterPlacementStories(stories, storyYearFilter) {
    if (storyYearFilter === 'all') return stories;
    return stories.filter(s => s.date?.includes(storyYearFilter));
}



export default function QueriesStories() {
    // Toast notification state
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success");
    const [showToast, setShowToast] = useState(false);

    const triggerToast = (msg, type = "success") => {
        setToastMessage(msg);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };


    // React States for student queries and pagination
    const [queries, setQueries] = useState(loadInitialStudentQueries);

    const fetchQueries = async () => {
        try {
            const response = await getAllQueries();
            if (response.data && Array.isArray(response.data)) {
                const mappedQueries = response.data.map(q => {
                    return {
                        ...q,
                        id: q.id,
                        name: q.studentName,
                        course: q.department,
                        avatar: buildQueryAvatar(q.studentName || q.name),
                        colorClass: 'blue',
                        title: q.subject,
                        message: q.description,
                        status: (q.status || 'pending').toLowerCase(),
                        reply: q.adminReply,
                        date: parseCreatedAt(q.createdAt)
                    };
                });
                setQueries(mappedQueries.toSorted((a, b) => b.id - a.id));
            }
        } catch (error) {
            console.error("Failed to fetch queries:", error);
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
        if (!Array.isArray(queries)) return;
        const sanitizedQueries = queries.map(q => ({
            id: typeof q.id === 'number' ? q.id : Number(q.id) || 0,
            studentName: sanitizeStorageString(q.studentName),
            email: sanitizeStorageString(q.email),
            subject: sanitizeStorageString(q.subject),
            message: sanitizeStorageString(q.message),
            category: sanitizeStorageString(q.category),
            status: sanitizeStorageString(q.status),
            createdAt: sanitizeStorageString(q.createdAt),
            reply: sanitizeStorageString(q.reply),
            adminReply: sanitizeStorageString(q.adminReply)
        }));
        localStorage.setItem("student_queries", JSON.stringify(sanitizedQueries));
    }, [queries]);

    const [querySearch, setQuerySearch] = useState('');
    const [queryFilter, setQueryFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 2; // Show 2 queries per page

    // States for View, Reply, and Discard Modals
    const [viewingQuery, setViewingQuery] = useState(null);
    const [replyingQuery, setReplyingQuery] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [discardingQuery, setDiscardingQuery] = useState(null);
    const [discardReason, setDiscardReason] = useState('');

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyingQuery || !replyText.trim()) return;

        try {
            await replyToQuery(replyingQuery.id, replyText);

            setQueries(prevQueries => prevQueries.map(q => {
                if (q.id === replyingQuery.id) {
                    return {
                        ...q,
                        status: 'resolved',
                        reply: replyText,
                        adminReply: replyText
                    };
                }
                return q;
            }));

            triggerToast("Reply sent to student query successfully!", "success");
            setReplyingQuery(null);
            setReplyText('');
        } catch (error) {
            console.error("Failed to reply to query:", error);
            triggerToast("Failed to send reply.", "error");
        }
    };

    const handleDiscardQuery = async (queryToDiscard) => {
        if (!queryToDiscard) return;

        const subjectName = queryToDiscard.title || 'Placement Query';

        try {
            try {
                await discardQuery(queryToDiscard.id, "Query discarded by Admin");
            } catch (apiErr) {
                console.warn("Backend API call for discard query failed or not available yet, updating UI locally:", apiErr);
            }

            // Completely remove query from local state list
            setQueries(prevQueries => prevQueries.filter(q => q.id !== queryToDiscard.id));

            // Notify student via notifications in localStorage
            const notifObj = {
                id: Date.now(),
                title: "Query Discarded",
                message: `Your query with subject '${subjectName}' got discarded.`,
                type: "warning",
                studentEmail: queryToDiscard.email || "",
                studentName: queryToDiscard.name || queryToDiscard.studentName || "",
                createdAt: new Date().toISOString(),
                displayDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                displayTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                read: false
            };

            const existingNotifs = JSON.parse(localStorage.getItem("student_notifications") || "[]");
            localStorage.setItem("student_notifications", JSON.stringify([notifObj, ...existingNotifs]));

            triggerToast("Query discarded successfully", "success");
        } catch (error) {
            console.error("Failed to discard query:", error);
            triggerToast("Failed to discard query.", "error");
        }
    };

    // Helper calculations for status counts
    const totalQueriesCount = queries.length;
    const pendingCount = queries.filter(q => q.status === 'pending').length;
    const resolvedCount = queries.filter(q => q.status === 'resolved').length;

    useEffect(() => {
        const timer = setTimeout(() => setCurrentPage(1), 0);
        return () => clearTimeout(timer);
    }, [querySearch, queryFilter]);

    // Filter student queries based on search keyword and selected status pill
    const filteredQueries = filterStudentQueries(queries, querySearch, queryFilter);

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedQueries = filteredQueries.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredQueries.length / itemsPerPage);

    // Mock Data for Placement Drives
    const initialDrives = [];

    // Mock Data for Published Placement Stories
    const initialStories = [];

    // State for placement drives and pagination
    const [drives, setDrives] = useState(() => {
        const stored = localStorage.getItem("placement_drives");
        return stored ? JSON.parse(stored) : initialDrives;
    });

    const fetchDrives = async () => {
        try {
            const response = await getAllPlacementDrives();
            if (response.data && Array.isArray(response.data)) {
                const mappedDrives = response.data.map(mapApiDriveToUi);
                setDrives(mappedDrives.toSorted((a, b) => b.id - a.id));
            }
        } catch (error) {
            console.error("Failed to fetch placement drives:", error);
        }
    };

    useEffect(() => {
        fetchDrives();

        let pollInterval;
        if (import.meta.env.MODE !== 'test') {
            pollInterval = setInterval(() => {
                if (document.hidden) return;
                fetchDrives();
            }, 5000);
        }

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
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
        if (!Array.isArray(drives)) return;
        const sanitizedDrives = drives.map(drive => ({
            id: typeof drive.id === 'number' ? drive.id : Number(drive.id) || 0,
            company: sanitizeStorageString(drive.company),
            role: sanitizeStorageString(drive.role),
            date: sanitizeStorageString(drive.date),
            time: sanitizeStorageString(drive.time),
            venue: sanitizeStorageString(drive.venue),
            targetStudent: Array.isArray(drive.targetStudent)
                ? drive.targetStudent.map(t => sanitizeStorageString(t))
                : sanitizeStorageString(drive.targetStudent),
            customTarget: sanitizeStorageString(drive.customTarget),
            status: sanitizeStorageString(drive.status),
            createdAt: sanitizeStorageString(drive.createdAt)
        }));
        localStorage.setItem("placement_drives", JSON.stringify(sanitizedDrives));
    }, [drives]);

    // Modal states for adding/editing/deleting placement drives
    const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
    const [editingDrive, setEditingDrive] = useState(null);
    const [deletingDrive, setDeletingDrive] = useState(null);

    const [targetSearchTerm, setTargetSearchTerm] = useState('');
    const [showTargetDropdown, setShowTargetDropdown] = useState(false);

    const [availableStudents, setAvailableStudents] = useState([]);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await getAllStudentsForDrive();
                if (response.data && Array.isArray(response.data)) {
                    // response.data has format [{id: 2, fullName: "Divya Shelar"}, ...]
                    const formatted = response.data.map(s => ({
                        email: s.id.toString(), // or an actual email if backend returns it
                        name: s.fullName
                    }));
                    setAvailableStudents([{ email: "all", name: "ALL" }, ...formatted]);
                }
            } catch (error) {
                console.error("Failed to fetch specific students for drive:", error);
                setAvailableStudents([{ email: "all", name: "ALL" }]); // fallback
            }
        };
        fetchStudents();
    }, []);
    const [driveForm, setDriveForm] = useState(INITIAL_DRIVE_FORM);

    const handleOpenAddDrive = () => {
        setEditingDrive(null);
        setDriveForm(INITIAL_DRIVE_FORM);
        setIsDriveModalOpen(true);
    };

    const handleOpenEditDrive = (drive) => {
        setEditingDrive(drive);
        setDriveForm({
            company: drive.company || '',
            role: drive.role || '',
            location: drive.location || '',
            date: drive.date || '',
            time: drive.time || '',
            venue: drive.venue || 'Seminar Hall A',
            status: drive.status || 'OPEN',
            targetStudent: Array.isArray(drive.targetStudent) ? drive.targetStudent.join(', ') : (drive.targetStudent || 'ALL'),
            customTarget: drive.customTarget || ''
        });
        setIsDriveModalOpen(true);
    };

    const confirmDeleteDrive = async () => {
        if (!deletingDrive) return;
        try {
            await deletePlacementDrive(deletingDrive.id);
            const updatedDrives = drives.filter(d => d.id !== deletingDrive.id);
            setDrives(updatedDrives);
            setDeletingDrive(null);
            triggerToast("Placement drive deleted successfully!", "success");
        } catch (error) {
            console.error("Failed to delete placement drive:", error);
            triggerToast("Failed to delete placement drive.", "error");
        }
    };

    const handleSaveDrive = async (e) => {
        e.preventDefault();
        if (!driveForm.company || !driveForm.role) {
            return;
        }

        const logoUrl = `https://www.google.com/s2/favicons?domain=${driveForm.company.toLowerCase().replace(/\s+/g, '')}.com&sz=128`;

        if (editingDrive) {
            // Update existing via API
            try {
                const payload = buildDrivePayload(driveForm);

                await updatePlacementDrive(editingDrive.id, payload);

                const updatedDrives = drives.map(d => {
                    if (d.id === editingDrive.id) {
                        return {
                            ...d,
                            company: driveForm.company,
                            logo: logoUrl,
                            role: driveForm.role,
                            location: driveForm.location,
                            date: driveForm.date,
                            time: driveForm.time,
                            venue: driveForm.venue,
                            status: driveForm.status,
                            targetStudent: driveForm.targetStudent,
                            specificStudentName: "" // Assuming empty unless specified
                        };
                    }
                    return d;
                });
                setDrives(updatedDrives);
                triggerToast("Placement drive updated successfully!", "success");
                setIsDriveModalOpen(false);
            } catch (error) {
                console.error("Error updating placement drive:", error);
                triggerToast("Failed to update placement drive.", "error");
            }
        } else {
            // Add new via API
            try {
                const payload = buildDrivePayload(driveForm);

                const response = await addPlacementDrive(payload);

                // Map response back to frontend schema so UI renders correctly
                const createdDrive = response.data || { ...payload, id: Date.now() };
                const newDrive = {
                    ...createdDrive,
                    id: createdDrive.id,
                    company: createdDrive.companyName || driveForm.company,
                    logo: logoUrl,
                    role: createdDrive.jobRole || driveForm.role,
                    location: createdDrive.location || driveForm.location,
                    date: createdDrive.driveDate || driveForm.date,
                    time: createdDrive.driveTime || driveForm.time,
                    status: createdDrive.status || driveForm.status,
                    venue: createdDrive.venue || driveForm.venue,
                    targetStudent: createdDrive.targetStudent || driveForm.targetStudent
                };

                setDrives([newDrive, ...drives]);
                triggerToast("Placement drive created successfully!", "success");
                setIsDriveModalOpen(false);
            } catch (error) {
                console.error("Error creating placement drive:", error);
                triggerToast("Failed to create placement drive.", "error");
            }
        }
    };

    const [driveSearch, setDriveSearch] = useState('');
    const [drivePage, setDrivePage] = useState(1);
    const drivesPerPage = 5; // Show 5 drives per table page

    // State for published placement stories and pagination
    const [stories, setStories] = useState(() => {
        const stored = localStorage.getItem("placement_stories");
        return stored ? JSON.parse(stored) : initialStories;
    });

    const fetchStories = async () => {
        try {
            const response = await getAllPlacementStories();
            if (response.data && Array.isArray(response.data)) {
                const mappedStories = response.data.map(mapApiStoryToUi);
                setStories(mappedStories.toSorted((a, b) => b.id - a.id));
            }
        } catch (error) {
            console.error("Failed to fetch placement stories:", error);
        }
    };

    useEffect(() => {
        fetchStories();

        let pollInterval;
        if (import.meta.env.MODE !== 'test') {
            pollInterval = setInterval(() => {
                if (document.hidden) return;
                fetchStories();
            }, 5000);
        }

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchStories();
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
        if (!Array.isArray(stories)) return;
        const sanitizedStories = stories.map(story => ({
            id: typeof story.id === 'number' ? story.id : Number(story.id) || 0,
            name: sanitizeStorageString(story.name),
            branch: sanitizeStorageString(story.branch),
            year: sanitizeStorageString(story.year),
            company: sanitizeStorageString(story.company),
            package: sanitizeStorageString(story.package),
            quote: sanitizeStorageString(story.quote),
            role: sanitizeStorageString(story.role),
            tips: sanitizeStorageString(story.tips),
            avatar: sanitizeStorageString(story.avatar),
            logo: sanitizeStorageString(story.logo),
            logoColor: sanitizeStorageString(story.logoColor),
            createdAt: sanitizeStorageString(story.createdAt)
        }));
        localStorage.setItem("placement_stories", JSON.stringify(sanitizedStories));
    }, [stories]);

    const [storyPage, setStoryPage] = useState(1);
    const storiesPerPage = 2; // Show 2 stories per carousel slide page

    const [storyYearFilter, setStoryYearFilter] = useState('all');
    const [editingStory, setEditingStory] = useState(null);
    const [deletingStory, setDeletingStory] = useState(null);
    const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
    const [confirmingPublish, setConfirmingPublish] = useState(false);

    // Reset stories page to 1 when filter changes
    useEffect(() => {
        const timer = setTimeout(() => setStoryPage(1), 0);
        return () => clearTimeout(timer);
    }, [storyYearFilter]);

    // Reset drives page to 1 when search query changes
    useEffect(() => {
        const timer = setTimeout(() => setDrivePage(1), 0);
        return () => clearTimeout(timer);
    }, [driveSearch]);

    // Filter drives list based on company name or role search
    const filteredDrives = filterPlacementDrives(drives, driveSearch);

    const filteredStories = filterPlacementStories(stories, storyYearFilter);

    // Drives pagination calculations
    const indexOfLastDrive = drivePage * drivesPerPage;
    const indexOfFirstDrive = indexOfLastDrive - drivesPerPage;
    const paginatedDrives = filteredDrives.slice(indexOfFirstDrive, indexOfLastDrive);
    const totalDrivePages = Math.ceil(filteredDrives.length / drivesPerPage);

    // Stories pagination calculations
    const indexOfLastStory = storyPage * storiesPerPage;
    const indexOfFirstStory = indexOfLastStory - storiesPerPage;
    const paginatedStories = filteredStories.slice(indexOfFirstStory, indexOfLastStory);
    const totalStoryPages = Math.ceil(filteredStories.length / storiesPerPage);

    const fileInputRef = useRef(null);

    // Form state for publishing student success stories
    const [storyForm, setStoryForm] = useState({
        studentName: '',
        companyName: '',
        jobRole: '',
        package: '',
        storyText: '',
        photo: ''
    });

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                triggerToast("Photo size exceeds 5MB limit", "error");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setStoryForm(prev => ({ ...prev, photo: reader.result }));
                triggerToast("Photo attached successfully!", "success");
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle form submission to publish stories
    const handlePublishStory = async (e) => {
        e.preventDefault();
        if (!storyForm.studentName || !storyForm.companyName || !storyForm.jobRole) {
            return;
        }

        try {
            const packageValue = Number.parseFloat(storyForm.package) || 0;
            const payload = {
                studentName: storyForm.studentName,
                companyName: storyForm.companyName,
                package: packageValue,
                jobRole: storyForm.jobRole,
                storyText: storyForm.storyText || `Secured placement at ${storyForm.companyName}.`
            };

            // Note: In a real scenario, you'd pass the actual File object from the file input to publishPlacementStory.
            // Since the UI only stores a data URL in storyForm.photo right now, we can convert it to a Blob, or just pass null if not strictly enforced.
            // For simplicity, passing null as the file since the UI just has a preview string.
            const photoFile = await preparePhotoFile(storyForm.photo);
            await publishPlacementStory(payload, photoFile);

            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(storyForm.studentName)}&background=2563eb&color=fff`;

            const newStory = {
                id: Date.now(),
                name: storyForm.studentName,
                avatar: storyForm.photo || avatarUrl,
                company: storyForm.companyName,
                companyColor: '#eff6ff',
                companyTextColor: '#2563eb',
                role: storyForm.jobRole,
                packageAmt: payload.package ? `${payload.package} LPA` : 'Not Disclosed',
                storyText: payload.storyText,
                date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            };

            setStories([newStory, ...stories]);
            triggerToast("Placement story published successfully!", "success");
            setStoryForm(INITIAL_STORY_FORM);
        } catch (error) {
            console.error("Failed to publish placement story:", error);
            triggerToast(parseStoryError(error), "error");
        }
    };

    const handleOpenEditStory = (story) => {
        setEditingStory(story);
        setStoryForm({
            studentName: story.name || '',
            companyName: story.company || '',
            jobRole: story.role || '',
            package: story.packageAmt ? story.packageAmt.replace(' LPA', '') : '',
            storyText: story.storyText || '',
            photo: story.avatar || ''
        });
        setIsStoryModalOpen(true);
    };

    const handleUpdateStory = async (e) => {
        e.preventDefault();
        if (!editingStory) return;

        try {
            const packageValue = Number.parseFloat(storyForm.package) || 0;
            const payload = {
                studentName: storyForm.studentName,
                companyName: storyForm.companyName,
                package: packageValue,
                jobRole: storyForm.jobRole,
                storyText: storyForm.storyText
            };

            const photoFile = await preparePhotoFile(storyForm.photo);
            await updatePlacementStory(editingStory.id, payload, photoFile);

            const updatedStories = stories.map(s => {
                if (s.id === editingStory.id) {
                    return {
                        ...s,
                        name: storyForm.studentName,
                        company: storyForm.companyName,
                        role: storyForm.jobRole,
                        packageAmt: payload.package ? `${payload.package} LPA` : '6.0 LPA',
                        storyText: payload.storyText,
                        avatar: storyForm.photo || s.avatar
                    };
                }
                return s;
            });

            setStories(updatedStories);
            triggerToast("Placement story updated successfully!", "success");
            setIsStoryModalOpen(false);
            setEditingStory(null);
            setStoryForm({ studentName: '', companyName: '', jobRole: '', package: '', storyText: '', photo: '' });
        } catch (error) {
            console.error("Failed to update story:", error);
            triggerToast("Failed to update placement story.", "error");
        }
    };

    const confirmDeleteStory = async () => {
        if (!deletingStory) return;
        try {
            await deletePlacementStory(deletingStory.id);
            const updatedStories = stories.filter(s => s.id !== deletingStory.id);
            setStories(updatedStories);
            setDeletingStory(null);
            triggerToast("Placement story deleted successfully!", "success");
        } catch (error) {
            console.error("Failed to delete placement story:", error);
            triggerToast("Failed to delete placement story.", "error");
        }
    };

    return (
        <div className="queries-stories-container">

            <div className="qs-row">


                <motion.div className="qs-panel queries-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0 }}>
                    <div className="qs-panel-header">
                        <div>
                            <h3 className="panel-title">Student Queries</h3>
                            <p className="panel-subtitle">View and resolve queries submitted by students.</p>
                        </div>
                        <div className="header-controls">
                            <select
                                className="status-select-dropdown"
                                value={queryFilter}
                                onChange={(e) => setQueryFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="resolved">Resolved</option>
                            </select>
                            <div className="qs-search-bar-wrapper">
                                <Search size={16} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search queries..."
                                    className="search-input-box"
                                    value={querySearch}
                                    onChange={(e) => setQuerySearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>


                    <div className="pills-wrapper">
                        <button type="button" className={`pill-btn all-pill ${queryFilter === 'all' ? 'active' : ''}`} onClick={() => setQueryFilter('all')}>
                            All ({totalQueriesCount})
                        </button>
                        <button type="button" className={`pill-btn pending-pill ${queryFilter === 'pending' ? 'active' : ''}`} onClick={() => setQueryFilter('pending')}>
                            Pending ({pendingCount})
                        </button>
                        <button type="button" className={`pill-btn resolved-pill ${queryFilter === 'resolved' ? 'active' : ''}`} onClick={() => setQueryFilter('resolved')}>
                            Resolved ({resolvedCount})
                        </button>
                    </div>


                    <div className="queries-list-scroll">
                        {paginatedQueries.length > 0 ? (
                            paginatedQueries.map((query) => (
                                <div key={query.id} className="query-item-card">
                                    <div className="query-user-profile">
                                        <div
                                            className="query-avatar-circle"
                                            style={{
                                                backgroundColor: getAvatarBgColor(query.colorClass),
                                                color: getAvatarTextColor(query.colorClass)
                                            }}
                                        >
                                            {query.avatar}
                                        </div>
                                        <div className="query-user-info">
                                            <span className="query-username">{query.name}</span>
                                            <span className="query-userdept">{query.course}</span>
                                        </div>
                                    </div>
                                    <div className="query-message-body">
                                        <h5 className="query-subject">{query.title}</h5>
                                        <p className="query-text">{query.message}</p>
                                    </div>
                                    <div className="query-meta-actions">
                                        <span className="query-date-info">
                                            <Calendar size={13} style={{ marginRight: '4px' }} /> {query.date}
                                        </span>
                                        <span className={`query-status-tag status-${query.status}`}>
                                            {query.status}
                                        </span>
                                        <div className="action-links-group">
                                            <button type="button" className="text-action-btn" onClick={() => setViewingQuery(query)}>View</button>
                                            {(() => {
                                                const hasReply = Boolean((query.reply && String(query.reply).trim()) || (query.adminReply && String(query.adminReply).trim()));
                                                const isResolved = query.status === 'resolved';
                                                if (hasReply || isResolved) {
                                                    return (
                                                        <button
                                                            type="button"
                                                            className="text-action-btn primary-action disabled"
                                                            disabled
                                                            title="Reply has already been given to this query"
                                                        >
                                                            Reply
                                                        </button>
                                                    );
                                                }
                                                return (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="text-action-btn primary-action"
                                                            onClick={() => {
                                                                setReplyingQuery(query);
                                                                setReplyText(query.reply || '');
                                                            }}
                                                            title="Reply to query"
                                                        >
                                                            Reply
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="text-action-btn discard-action"
                                                            onClick={() => handleDiscardQuery(query)}
                                                            title="Discard query"
                                                        >
                                                            Discard
                                                        </button>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="empty-state-text">No matching student queries found.</p>
                        )}
                    </div>


                    <div className="table-card-footer">
                        <div className="pagination-wrapper">
                            <button
                                type="button"
                                className="pagination-btn"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                &larr;
                            </button>

                            {getVisiblePageNumbers(currentPage, totalPages, 3).map(pageNum => (
                                <button
                                    key={pageNum}
                                    type="button"
                                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            ))}

                            <button
                                type="button"
                                className="pagination-btn"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                &rarr;
                            </button>
                        </div>
                    </div>
                </motion.div>


                <motion.div className="qs-panel publish-story-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}>
                    <div className="qs-panel-header">
                        <div>
                            <h3 className="panel-title">Create Placement Story</h3>
                            <p className="panel-subtitle">Add and publish success stories of placed students.</p>
                        </div>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); setConfirmingPublish(true); }} className="publish-form-body">

                        <div className="form-upper-row">
                            <button
                                type="button"
                                aria-label="Upload photo"
                                className="upload-photo-zone"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handlePhotoChange}
                                />
                                {storyForm.photo ? (
                                    <div className="photo-preview-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                        <img
                                            src={storyForm.photo}
                                            alt="Preview"
                                            style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #6366f1' }}
                                        />
                                        <span className="upload-label" style={{ marginTop: '4px', color: '#10b981', fontSize: '0.7rem' }}>Photo Attached</span>
                                        <button
                                            type="button"
                                            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.65rem', cursor: 'pointer', marginTop: '2px', textDecoration: 'underline' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setStoryForm(prev => ({ ...prev, photo: '' }));
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={24} className="upload-cloud-icon" />
                                        <span className="upload-label">Upload Photo</span>
                                        <span className="upload-subtext">PNG, JPG (Max 5MB)</span>
                                    </>
                                )}
                            </button>
                            <div className="inputs-block">
                                <div className="form-group-field">
                                    <label htmlFor="story-student-name" className="field-label">Student Name</label>
                                    <input
                                        type="text"
                                        id="story-student-name"
                                        placeholder="Enter student name"
                                        className="form-input-control"
                                        value={storyForm.studentName}
                                        onChange={(e) => setStoryForm({ ...storyForm, studentName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group-field">
                                    <label htmlFor="story-company-name" className="field-label">Company Name</label>
                                    <input
                                        type="text"
                                        id="story-company-name"
                                        placeholder="Enter company name"
                                        className="form-input-control"
                                        value={storyForm.companyName}
                                        onChange={(e) => setStoryForm({ ...storyForm, companyName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>


                        <div className="form-grid-row">
                            <div className="form-group-field">
                                <label htmlFor="story-job-role" className="field-label">Job Role</label>
                                <input
                                    type="text"
                                    id="story-job-role"
                                    placeholder="Enter job role"
                                    className="form-input-control"
                                    value={storyForm.jobRole}
                                    onChange={(e) => setStoryForm({ ...storyForm, jobRole: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group-field">
                                <label htmlFor="story-package" className="field-label">Package</label>
                                <input
                                    type="text"
                                    id="story-package"
                                    placeholder="Enter package (e.g. 6 LPA)"
                                    className="form-input-control"
                                    value={storyForm.package}
                                    onChange={(e) => setStoryForm({ ...storyForm, package: e.target.value })}
                                />
                            </div>
                        </div>


                        <div className="form-group-field full-width">
                            <label htmlFor="story-text" className="field-label">Success Story</label>
                            <textarea
                                id="story-text"
                                placeholder="Write the student's success story..."
                                className="form-textarea-control"
                                rows={4}
                                value={storyForm.storyText}
                                onChange={(e) => setStoryForm({ ...storyForm, storyText: e.target.value })}
                                required
                            ></textarea>
                        </div>


                        <div className="form-submit-row">
                            <button type="submit" className="btn-primary-purple">Publish Story</button>
                        </div>
                    </form>
                </motion.div>

            </div>


            <div className="qs-row qs-row-bottom" style={{ marginTop: '24px' }}>


                <motion.div className="qs-panel placement-drives-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}>
                    <div className="qs-panel-header">
                        <div>
                            <h3 className="panel-title">Manage Placement Drives</h3>
                            <p className="panel-subtitle">Add, edit and manage all placement drives.</p>
                        </div>
                        <div className="header-actions-group">
                            <div className="qs-search-bar-wrapper">
                                <Search size={16} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search drives..."
                                    className="search-input-box"
                                    value={driveSearch}
                                    onChange={(e) => setDriveSearch(e.target.value)}
                                />
                            </div>
                            <button type="button" className="btn-add-drive" onClick={handleOpenAddDrive}>
                                <Plus size={15} style={{ marginRight: '6px' }} />
                                Add New Drive
                            </button>
                        </div>
                    </div>


                    <div className="qs-table-wrapper">
                        <table className="qs-drives-table">
                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>Job Role</th>
                                    <th>Location</th>
                                    <th>Venue</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedDrives.length > 0 ? (
                                    paginatedDrives.map((drive) => (
                                        <tr key={drive.id}>
                                            <td>
                                                <div className="company-logo-cell">
                                                    <img
                                                        src={`https://www.google.com/s2/favicons?domain=${drive.company.toLowerCase().replace(/\s+/g, '')}.com&sz=128`}
                                                        alt={drive.company}
                                                        style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            objectFit: 'contain',
                                                            borderRadius: '6px',
                                                            background: '#f8fafc',
                                                            border: '1px solid #e2e8f0',
                                                            padding: '2px',
                                                            flexShrink: 0
                                                        }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                    <span
                                                        className="logo-initial"
                                                        style={{ display: 'none' }}
                                                    >
                                                        {drive.company.charAt(0)}
                                                    </span>
                                                    <span className="table-bold-text">{drive.company}</span>
                                                </div>
                                            </td>
                                            <td>{drive.role}</td>
                                            <td>{drive.location}</td>
                                            <td>{drive.venue || 'Seminar Hall A'}</td>
                                            <td>
                                                <span className="icon-text-cell">
                                                    <Calendar size={13} />
                                                    {drive.date}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="icon-text-cell">
                                                    <Clock size={13} />
                                                    {drive.time}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`drive-status-badge badge-${drive.status}`}>
                                                    {drive.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="actions-button-row">
                                                    <button type="button" className="action-icon-btn edit" onClick={() => handleOpenEditDrive(drive)}>
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button type="button" className="action-icon-btn delete" onClick={() => setDeletingDrive(drive)}>
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="empty-state-text">No active placement drives found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="table-card-footer" style={{ paddingTop: '12px', marginBottom: 'auto' }}>
                        <div className="pagination-wrapper">
                            <button
                                type="button"
                                className="pagination-btn"
                                onClick={() => setDrivePage(prev => Math.max(prev - 1, 1))}
                                disabled={drivePage === 1}
                            >
                                &larr;
                            </button>

                            {getVisiblePageNumbers(drivePage, totalDrivePages, 3).map(pageNum => (
                                <button
                                    key={pageNum}
                                    type="button"
                                    className={`pagination-btn ${drivePage === pageNum ? 'active' : ''}`}
                                    onClick={() => setDrivePage(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            ))}

                            <button
                                type="button"
                                className="pagination-btn"
                                onClick={() => setDrivePage(prev => Math.min(prev + 1, totalDrivePages))}
                                disabled={drivePage === totalDrivePages || totalDrivePages === 0}
                            >
                                &rarr;
                            </button>
                        </div>
                    </div>
                </motion.div>


                <motion.div className="qs-panel placement-stories-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}>
                    <div className="qs-panel-header">
                        <div>
                            <h3 className="panel-title">Published Placement Stories</h3>
                            <p className="panel-subtitle">Manage and edit published placement stories.</p>
                        </div>
                        <div className="header-actions-group">
                            <select
                                className="status-select-dropdown"
                                value={storyYearFilter}
                                onChange={(e) => setStoryYearFilter(e.target.value)}
                            >
                                <option value="all">All Years</option>
                                <option value="2026">2026</option>
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                            </select>
                        </div>
                    </div>


                    <div className="stories-vertical-list">
                        {paginatedStories.map((story) => (
                            <div key={story.id} className="story-card-item">
                                <div className="story-card-header-row">
                                    <div className="story-student-profile">
                                        <img
                                            src={story.avatar}
                                            alt={story.name}
                                            className="story-avatar-img"
                                        />
                                        <div className="story-student-meta">
                                            <div className="name-company-row">
                                                <h4 className="story-student-fullname">{story.name}</h4>
                                                <span
                                                    className="story-company-pill"
                                                    style={{
                                                        backgroundColor: story.companyColor || '#f3e8ff',
                                                        color: story.companyTextColor || '#8b5cf6'
                                                    }}
                                                >
                                                    {story.company}
                                                </span>
                                            </div>
                                            <span
                                                className="story-role-title"
                                                style={{ color: story.companyTextColor || '#8b5cf6' }}
                                            >
                                                {story.role}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="story-top-actions-col">
                                        <span className="story-package-badge">{story.packageAmt}</span>
                                        <div className="actions-button-row" style={{ display: 'flex', gap: '6px' }}>
                                            <button type="button" className="action-icon-btn edit" onClick={() => handleOpenEditStory(story)}>
                                                <Edit2 size={14} />
                                            </button>
                                            <button type="button" className="action-icon-btn delete" onClick={() => setDeletingStory(story)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="story-quote-card">
                                    "{story.storyText || `Secured a ${story.role} role at ${story.company}.`}"
                                </div>

                                <div className="story-card-footer-row">
                                    <span className="story-publish-date">
                                        <Calendar size={13} /> Published on {story.date}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>


                    <div className="stories-pagination-footer">
                        <button
                            type="button"
                            className="stories-nav-btn"
                            onClick={() => setStoryPage(prev => Math.max(prev - 1, 1))}
                            disabled={storyPage === 1}
                        >
                            &larr; Prev
                        </button>

                        <span className="stories-page-info">
                            Page {storyPage} of {totalStoryPages || 1}
                        </span>

                        <button
                            type="button"
                            className="stories-nav-btn"
                            onClick={() => setStoryPage(prev => Math.min(prev + 1, totalStoryPages))}
                            disabled={storyPage === totalStoryPages || totalStoryPages === 0}
                        >
                            Next &rarr;
                        </button>
                    </div>
                </motion.div>

            </div>


            {
                isDriveModalOpen && (
                    <div className="qs-modal-overlay" aria-label="Close drive modal backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsDriveModalOpen(false); }}>
                        <div className="qs-modal-content drive-form-modal">
                            <div className="qs-modal-header">
                                <div>
                                    <h4 className="modal-title">{editingDrive ? "Edit Placement Drive" : "Add New Placement Drive"}</h4>
                                    <p className="modal-subtitle">Configure schedule, venue, and target students for this placement drive.</p>
                                </div>
                                <button type="button" className="qs-close-btn" onClick={() => setIsDriveModalOpen(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleSaveDrive} className="qs-modal-form">
                                <div className="qs-form-grid">
                                    <div className="qs-form-group">
                                        <label htmlFor="drive-company-name" className="form-label">Company Name *</label>
                                        <input
                                            type="text"
                                            id="drive-company-name"
                                            required
                                            className="form-input-control"
                                            value={driveForm.company}
                                            onChange={(e) => setDriveForm({ ...driveForm, company: e.target.value })}
                                            placeholder="e.g. TCS"
                                        />
                                    </div>
                                    <div className="qs-form-group">
                                        <label htmlFor="drive-job-role" className="form-label">Job Role *</label>
                                        <input
                                            type="text"
                                            id="drive-job-role"
                                            required
                                            className="form-input-control"
                                            value={driveForm.role}
                                            onChange={(e) => setDriveForm({ ...driveForm, role: e.target.value })}
                                            placeholder="e.g. System Engineer"
                                        />
                                    </div>
                                    <div className="qs-form-group">
                                        <label htmlFor="drive-location" className="form-label">Location *</label>
                                        <input
                                            type="text"
                                            id="drive-location"
                                            required
                                            className="form-input-control"
                                            value={driveForm.location}
                                            onChange={(e) => setDriveForm({ ...driveForm, location: e.target.value })}
                                            placeholder="e.g. Pune"
                                        />
                                    </div>
                                    <div className="qs-form-group">
                                        <label htmlFor="drive-date" className="form-label">Date *</label>
                                        <input
                                            type="text"
                                            id="drive-date"
                                            required
                                            className="form-input-control"
                                            value={driveForm.date}
                                            onChange={(e) => setDriveForm({ ...driveForm, date: e.target.value })}
                                            placeholder="e.g. 10 Dec 2026"
                                        />
                                    </div>
                                    <div className="qs-form-group">
                                        <label htmlFor="drive-time" className="form-label">Time *</label>
                                        <input
                                            type="text"
                                            id="drive-time"
                                            required
                                            className="form-input-control"
                                            value={driveForm.time}
                                            onChange={(e) => setDriveForm({ ...driveForm, time: e.target.value })}
                                            placeholder="e.g. 11:00 AM"
                                        />
                                    </div>
                                    <div className="qs-form-group">
                                        <label htmlFor="drive-venue" className="form-label">Venue *</label>
                                        <input
                                            type="text"
                                            id="drive-venue"
                                            required
                                            className="form-input-control"
                                            value={driveForm.venue}
                                            onChange={(e) => setDriveForm({ ...driveForm, venue: e.target.value })}
                                            placeholder="Seminar Hall A"
                                        />
                                    </div>
                                    <div className="qs-form-group">
                                        <label htmlFor="drive-status" className="form-label">Status *</label>
                                        <select
                                            id="drive-status"
                                            className="form-input-control"
                                            value={driveForm.status}
                                            onChange={(e) => setDriveForm({ ...driveForm, status: e.target.value })}
                                        >
                                            <option value="OPEN">Open</option>
                                            <option value="UPCOMING">Upcoming</option>
                                            <option value="CLOSED">Closed</option>
                                        </select>
                                    </div>
                                    <div className="qs-form-group">
                                        <label htmlFor="drive-target-student" className="form-label">Target Student *</label>
                                        <div className="multi-select-container" style={{ position: 'relative' }}>
                                            <div className="form-input-control multi-select-input-wrapper" style={{ minHeight: '38px', height: 'auto', padding: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px', cursor: 'text' }}>
                                                {driveForm.targetStudent.split(',').map(t => t.trim()).filter(Boolean).map((target, idx) => (
                                                    <span key={`${target}-${idx}`} className="multi-select-pill" style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {target}
                                                        <button
                                                            type="button"
                                                            aria-label={`Remove ${target}`}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', padding: '0 0 0 4px', color: 'inherit', fontSize: '14px', lineHeight: 1 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newTargets = driveForm.targetStudent.split(',').map(t => t.trim()).filter(t => t !== target);
                                                                setDriveForm({ ...driveForm, targetStudent: newTargets.join(', ') });
                                                            }}
                                                        >
                                                            &times;
                                                        </button>
                                                    </span>
                                                ))}
                                                <input
                                                    type="text"
                                                    id="drive-target-student"
                                                    value={targetSearchTerm}
                                                    onChange={(e) => { setTargetSearchTerm(e.target.value); setShowTargetDropdown(true); }}
                                                    onFocus={() => setShowTargetDropdown(true)}
                                                    onBlur={() => setTimeout(() => setShowTargetDropdown(false), 200)}
                                                    style={{ border: 'none', outline: 'none', flex: 1, minWidth: '100px', background: 'transparent' }}
                                                    placeholder={driveForm.targetStudent ? "" : "Search student..."}
                                                />
                                            </div>
                                            {showTargetDropdown && (
                                                <div className="multi-select-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', marginTop: '4px', zIndex: 10, maxHeight: '150px', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                                    {availableStudents
                                                        .filter(s => s.name.toLowerCase().includes(targetSearchTerm.toLowerCase()) || s.email.toLowerCase().includes(targetSearchTerm.toLowerCase()))
                                                        .map((student, idx) => (
                                                            <button
                                                                type="button"
                                                                key={student.id || student.name || idx}
                                                                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}
                                                                onMouseDown={(e) => e.preventDefault()}
                                                                onClick={() => {
                                                                    const currentTargets = driveForm.targetStudent.split(',').map(t => t.trim()).filter(Boolean);
                                                                    if (!currentTargets.includes(student.name)) {
                                                                        setDriveForm({ ...driveForm, targetStudent: [...currentTargets, student.name].join(', ') });
                                                                    }
                                                                    setTargetSearchTerm('');
                                                                    setShowTargetDropdown(false);
                                                                }}
                                                            >
                                                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{student.name}</div>
                                                            </button>
                                                        ))}
                                                    {availableStudents.filter(s => s.name.toLowerCase().includes(targetSearchTerm.toLowerCase()) || s.email.toLowerCase().includes(targetSearchTerm.toLowerCase())).length === 0 && (
                                                        <div style={{ padding: '8px 12px', fontSize: '13px', color: '#64748b' }}>No students found</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="qs-form-group full-width">
                                        <label htmlFor="drive-custom-target" className="form-label">Or Type Specific Student Name / Interview Target Manually</label>
                                        <input
                                            type="text"
                                            id="drive-custom-target"
                                            className="form-input-control"
                                            value={driveForm.customTarget || ''}
                                            onChange={(e) => setDriveForm({ ...driveForm, customTarget: e.target.value })}
                                            placeholder="e.g. Sneha Jadhav (BCA)"
                                        />
                                    </div>
                                </div>
                                <div className="qs-modal-actions">
                                    <button type="button" className="qs-cancel-btn" onClick={() => setIsDriveModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary-purple" style={{ backgroundColor: '#2563eb' }}>
                                        <Plus size={16} /> {editingDrive ? "Update Drive" : "Add Drive"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }


            {
                deletingDrive && (
                    <div className="qs-modal-overlay" aria-label="Close delete drive backdrop" onClick={(e) => { if (e.target === e.currentTarget) setDeletingDrive(null); }}>
                        <div className="qs-delete-modal-content">
                            <div className="delete-modal-icon-bg">
                                <Trash2 size={22} />
                            </div>
                            <h4 className="delete-modal-title">Delete Placement Drive</h4>
                            <p className="delete-modal-desc">
                                Are you sure you want to delete the drive for <strong>{deletingDrive.company}</strong>? This action cannot be undone.
                            </p>
                            <div className="delete-modal-actions">
                                <button type="button" className="btn-delete-cancel" onClick={() => setDeletingDrive(null)}>
                                    Cancel
                                </button>
                                <button type="button" className="btn-delete-confirm" onClick={confirmDeleteDrive}>
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }


            {
                viewingQuery && (
                    <div className="qs-modal-overlay" aria-label="Close query modal backdrop" onClick={(e) => { if (e.target === e.currentTarget) setViewingQuery(null); }}>
                        <div className="qs-modal-content view-query-modal">
                            <div className="qs-modal-header">
                                <div>
                                    <h4 className="modal-title">Student Query Details</h4>
                                    <p className="modal-subtitle">Submitted by {viewingQuery.name}</p>
                                </div>
                                <button type="button" className="qs-close-btn" onClick={() => setViewingQuery(null)}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="query-modal-body">
                                <div className="modal-user-profile-row">
                                    <div className="query-user-profile">
                                        <div
                                            className="query-avatar-circle"
                                            style={{
                                                backgroundColor: getAvatarBgColor(viewingQuery.colorClass),
                                                color: getAvatarTextColor(viewingQuery.colorClass)
                                            }}
                                        >
                                            {viewingQuery.avatar}
                                        </div>
                                        <div className="query-user-info">
                                            <span className="query-username">{viewingQuery.name}</span>
                                            <span className="query-userdept">{viewingQuery.course}</span>
                                        </div>
                                    </div>
                                    <span className={`query-status-tag status-${viewingQuery.status}`}>
                                        {viewingQuery.status}
                                    </span>
                                </div>

                                <div className="modal-field-section">
                                    <span className="modal-field-label">SUBJECT</span>
                                    <h4 className="modal-subject-title">{viewingQuery.title}</h4>
                                </div>

                                <div className="modal-field-section">
                                    <span className="modal-field-label">QUERY DESCRIPTION</span>
                                    <div className="modal-description-box">
                                        {viewingQuery.message}
                                    </div>
                                </div>

                                <div className="modal-date-row">
                                    <Calendar size={13} style={{ marginRight: '6px' }} />
                                    <span>Submitted on {viewingQuery.date}</span>
                                </div>

                                <div className="qs-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                                    <button type="button" className="qs-cancel-btn" onClick={() => setViewingQuery(null)}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }


            {
                replyingQuery && (
                    <div className="qs-modal-overlay" aria-label="Close reply modal backdrop" onClick={(e) => { if (e.target === e.currentTarget) setReplyingQuery(null); }}>
                        <div className="qs-modal-content reply-query-modal">
                            <div className="qs-modal-header">
                                <div>
                                    <h4 className="modal-title">Reply to Query</h4>
                                    <p className="modal-subtitle">Replying to {replyingQuery.name}</p>
                                </div>
                                <button type="button" className="qs-close-btn" onClick={() => setReplyingQuery(null)}>
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSendReply} className="query-modal-body">
                                <div className="modal-field-section">
                                    <span className="modal-field-label">STUDENT'S QUERY</span>
                                    <div className="modal-description-box">
                                        <h5 className="reply-preview-title">{replyingQuery.title}</h5>
                                        <p className="reply-preview-text">{replyingQuery.message}</p>
                                    </div>
                                </div>

                                <div className="modal-field-section">
                                    <label htmlFor="query-reply-text" className="form-label" style={{ fontWeight: '600', fontSize: '0.82rem', color: '#334155' }}>
                                        Admin Response Message *
                                    </label>
                                    <textarea
                                        id="query-reply-text"
                                        className="form-textarea-control"
                                        rows={4}
                                        placeholder="Type your official response to the student here..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        required
                                        style={{ marginTop: '6px', width: '100%', boxSizing: 'border-box' }}
                                    ></textarea>
                                </div>

                                <div className="qs-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                                    <button type="button" className="qs-cancel-btn" onClick={() => setReplyingQuery(null)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary-purple" style={{ backgroundColor: '#2563eb' }}>
                                        Send Reply
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {
                isStoryModalOpen && (
                    <div className="qs-modal-overlay" aria-label="Close edit story backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsStoryModalOpen(false); }}>
                        <div className="qs-modal-content drive-form-modal">
                            <div className="qs-modal-header">
                                <div>
                                    <h4 className="modal-title">Edit Placement Story</h4>
                                    <p className="modal-subtitle">Update details or fix typos in the published story.</p>
                                </div>
                                <button type="button" className="qs-close-btn" onClick={() => setIsStoryModalOpen(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateStory} className="qs-modal-form">
                                <div className="qs-form-grid">
                                    <div className="qs-form-group full-width">
                                        <button
                                            type="button"
                                            aria-label="Upload new photo"
                                            className="upload-photo-zone"
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{ minHeight: '100px', cursor: 'pointer', border: '1px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', background: 'transparent' }}
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={handlePhotoChange}
                                            />
                                            {storyForm.photo ? (
                                                <div className="photo-preview-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                                    <img
                                                        src={storyForm.photo}
                                                        alt="Preview"
                                                        style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #6366f1' }}
                                                    />
                                                    <span className="upload-label" style={{ marginTop: '4px', color: '#10b981', fontSize: '0.7rem' }}>Photo Attached</span>
                                                    <button
                                                        type="button"
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.65rem', cursor: 'pointer', marginTop: '2px', textDecoration: 'underline' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setStoryForm(prev => ({ ...prev, photo: '' }));
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <Upload size={20} className="upload-cloud-icon" />
                                                    <span className="upload-label">Upload New Photo</span>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                    <div className="qs-form-group">
                                        <label htmlFor="edit-story-student-name" className="form-label">Student Name *</label>
                                        <input
                                            type="text"
                                            id="edit-story-student-name"
                                            required
                                            className="form-input-control"
                                            value={storyForm.studentName}
                                            onChange={(e) => setStoryForm({ ...storyForm, studentName: e.target.value })}
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>
                                    <div className="qs-form-group">
                                        <label htmlFor="edit-story-company-name" className="form-label">Company Name *</label>
                                        <input
                                            type="text"
                                            id="edit-story-company-name"
                                            required
                                            className="form-input-control"
                                            value={storyForm.companyName}
                                            onChange={(e) => setStoryForm({ ...storyForm, companyName: e.target.value })}
                                            placeholder="e.g. Google"
                                        />
                                    </div>
                                    <div className="qs-form-group">
                                        <label htmlFor="edit-story-job-role" className="form-label">Job Role *</label>
                                        <input
                                            type="text"
                                            id="edit-story-job-role"
                                            required
                                            className="form-input-control"
                                            value={storyForm.jobRole}
                                            onChange={(e) => setStoryForm({ ...storyForm, jobRole: e.target.value })}
                                            placeholder="e.g. Software Engineer"
                                        />
                                    </div>
                                    <div className="qs-form-group">
                                        <label htmlFor="edit-story-package" className="form-label">Package (LPA) *</label>
                                        <input
                                            type="text"
                                            id="edit-story-package"
                                            required
                                            className="form-input-control"
                                            value={storyForm.package}
                                            onChange={(e) => setStoryForm({ ...storyForm, package: e.target.value })}
                                            placeholder="e.g. 12"
                                        />
                                    </div>
                                    <div className="qs-form-group full-width">
                                        <label htmlFor="edit-story-text" className="form-label">Success Story *</label>
                                        <textarea
                                            id="edit-story-text"
                                            required
                                            className="form-textarea-control"
                                            rows={4}
                                            value={storyForm.storyText}
                                            onChange={(e) => setStoryForm({ ...storyForm, storyText: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="qs-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                    <button type="button" className="qs-cancel-btn" onClick={() => setIsStoryModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary-purple" style={{ backgroundColor: '#2563eb' }}>
                                        <Edit2 size={16} style={{ marginRight: '6px' }} /> Update Story
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {
                deletingStory && (
                    <div className="qs-modal-overlay" aria-label="Close delete story backdrop" onClick={(e) => { if (e.target === e.currentTarget) setDeletingStory(null); }}>
                        <div className="qs-delete-modal-content">
                            <div className="delete-modal-icon-bg">
                                <Trash2 size={22} />
                            </div>
                            <h4 className="delete-modal-title">Delete Placement Story</h4>
                            <p className="delete-modal-desc">
                                Are you sure you want to delete the story for <strong>{deletingStory.name}</strong>? This action cannot be undone.
                            </p>
                            <div className="delete-modal-actions">
                                <button type="button" className="btn-delete-cancel" onClick={() => setDeletingStory(null)}>
                                    Cancel
                                </button>
                                <button type="button" className="btn-delete-confirm" onClick={confirmDeleteStory}>
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                confirmingPublish && (
                    <div className="qs-modal-overlay" aria-label="Close confirm publish backdrop" onClick={(e) => { if (e.target === e.currentTarget) setConfirmingPublish(false); }}>
                        <div className="qs-delete-modal-content">
                            <div className="delete-modal-icon-bg" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                                <CheckCircle2 size={22} />
                            </div>
                            <h4 className="delete-modal-title">Confirm Publish</h4>
                            <p className="delete-modal-desc">
                                Are you sure you want to publish the success story for <strong>{storyForm.studentName || "this student"}</strong>?
                            </p>
                            <div className="delete-modal-actions">
                                <button type="button" className="btn-delete-cancel" onClick={() => setConfirmingPublish(false)}>
                                    Cancel
                                </button>
                                <button type="button" className="btn-primary-purple" onClick={(e) => { setConfirmingPublish(false); handlePublishStory(e); }}>
                                    Yes, Publish
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }


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