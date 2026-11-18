import React, { useState, useEffect } from "react";
import {
    Search,
    MoreVertical,
    Calendar,
    Upload,
    Plus,
    Edit2,
    Trash2,
    Clock,
    ChevronLeft,
    ChevronRight,
    X,
    CheckCircle
} from 'lucide-react';
import './QueriesStories.css';
import {
    getQueries,
    replyQuery,
    getDrives,
    createDrive,
    updateDrive,
    deleteDrive,
    getStories,
    createStory,
    deleteStory
} from '../../api/adminApi';

export default function QueriesStories() {
    // 1. Initial Mock data for Student Queries
    const initialQueries = [
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
        },
        {
            id: 4,
            name: 'Priya Deshmukh',
            course: 'B.Com',
            avatar: 'PD',
            colorClass: 'orange',
            title: 'Documents required',
            message: 'Please provide the list of documents required for placement registration.',
            date: '29 Apr 2025',
            status: 'resolved',
            reply: 'You need 10th & 12th marksheets, semester grade sheets, government photo ID, and an updated resume.'
        }
    ];

    // React States for student queries and pagination
    const [queries, setQueries] = useState(() => {
        const stored = localStorage.getItem("student_queries");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return parsed.map(q => q.status === 'in-progress' ? { ...q, status: 'pending' } : q);
            } catch (e) {
                return initialQueries;
            }
        }
        return initialQueries;
    });

    useEffect(() => {
        localStorage.setItem("student_queries", JSON.stringify(queries));
    }, [queries]);

    // Load live queries, drives & stories from Python FastAPI backend
    useEffect(() => {
        let isMounted = true;
        const loadLiveQueriesStories = async () => {
            try {
                const liveQueries = await getQueries();
                if (isMounted && Array.isArray(liveQueries) && liveQueries.length > 0) {
                    setQueries(liveQueries);
                }

                const liveDrives = await getDrives();
                if (isMounted && Array.isArray(liveDrives) && liveDrives.length > 0) {
                    setDrives(liveDrives);
                }

                const liveStories = await getStories();
                if (isMounted && Array.isArray(liveStories) && liveStories.length > 0) {
                    setStories(liveStories);
                }
            } catch (err) {
                console.log("[QueriesStories] Using offline fallback:", err);
            }
        };
        loadLiveQueriesStories();
        return () => { isMounted = false; };
    }, []);

    const [querySearch, setQuerySearch] = useState('');
    const [queryFilter, setQueryFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 2; // Show 2 queries per page

    // Modal states for View & Reply student queries
    const [selectedViewQuery, setSelectedViewQuery] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedReplyQuery, setSelectedReplyQuery] = useState(null);
    const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const handleSendReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedReplyQuery) return;

        const studentName = selectedReplyQuery.name;

        try {
            await replyQuery(selectedReplyQuery.id, replyText.trim());
        } catch (err) {
            console.log("Local query reply:", err);
        }

        setQueries(prevQueries =>
            prevQueries.map(q =>
                q.id === selectedReplyQuery.id
                    ? { ...q, reply: replyText.trim(), status: 'resolved' }
                    : q
            )
        );

        setIsReplyModalOpen(false);
        setSelectedReplyQuery(null);
        setReplyText('');

        // Trigger Success Toast
        setToastMessage(`Reply sent to ${studentName} successfully!`);
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
        }, 3500);
    };

    // Helper calculations for status counts
    const totalQueriesCount = queries.length;
    const pendingCount = queries.filter(q => q.status === 'pending').length;
    const resolvedCount = queries.filter(q => q.status === 'resolved').length;

    // Reset pagination to page 1 on search or filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [querySearch, queryFilter]);

    // Filter student queries based on search keyword and selected status pill
    const filteredQueries = queries.filter(q => {
        const matchesSearch = q.name.toLowerCase().includes(querySearch.toLowerCase()) ||
            q.title.toLowerCase().includes(querySearch.toLowerCase()) ||
            q.message.toLowerCase().includes(querySearch.toLowerCase());
        const matchesStatus = queryFilter === 'all' || q.status === queryFilter;
        return matchesSearch && matchesStatus;
    });

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedQueries = filteredQueries.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredQueries.length / itemsPerPage);

    // Mock Data for Placement Drives
    const initialDrives = [
        {
            id: 1,
            company: 'Google',
            logo: 'https://logo.clearbit.com/google.com',
            role: 'SDE Intern',
            location: 'Bangalore',
            date: '20 Jul 2026',
            time: '10:00 AM',
            status: 'open',
            venue: 'Seminar Hall A',
            about: 'Google is conducting an on-campus recruitment drive for the SDE Intern role.',
            targetStudent: 'All'
        },
        {
            id: 2,
            company: 'Amazon',
            logo: 'https://logo.clearbit.com/amazon.com',
            role: 'Backend Developer',
            location: 'Hyderabad',
            date: '25 Jul 2026',
            time: '11:30 AM',
            status: 'upcoming',
            venue: 'Seminar Hall A',
            about: 'Amazon is conducting an on-campus recruitment drive for the Backend Developer role.',
            targetStudent: 'All'
        },
        {
            id: 3,
            company: 'TCS',
            logo: 'https://logo.clearbit.com/tcs.com',
            role: 'System Engineer',
            location: 'Pune',
            date: '30 Jul 2026',
            time: '09:00 AM',
            status: 'closed',
            venue: 'Seminar Hall B',
            about: 'TCS is conducting a mass campus recruitment drive for System Engineers.',
            targetStudent: 'All'
        },
        {
            id: 4,
            company: 'Infosys',
            logo: 'https://logo.clearbit.com/infosys.com',
            role: 'Full Stack Developer',
            location: 'Mysore',
            date: '05 Aug 2026',
            time: '02:00 PM',
            status: 'upcoming',
            venue: 'Seminar Hall A',
            about: 'Infosys is conducting an on-campus drive for the Full Stack Developer role.',
            targetStudent: 'All'
        },
        {
            id: 5,
            company: 'Cognizant',
            logo: 'https://logo.clearbit.com/cognizant.com',
            role: 'QA Engineer',
            location: 'Chennai',
            date: '12 Aug 2026',
            time: '10:00 AM',
            status: 'upcoming',
            venue: 'Online / MS Teams',
            about: 'Cognizant is conducting a virtual campus drive for the QA Engineer role.',
            targetStudent: 'All'
        },
        {
            id: 6,
            company: 'Wipro',
            logo: 'https://logo.clearbit.com/wipro.com',
            role: 'System Associate',
            location: 'Kochi',
            date: '18 Aug 2026',
            time: '11:00 AM',
            status: 'upcoming',
            venue: 'Placement Cell Lab 2',
            about: 'Wipro is conducting an on-campus drive for System Associates.',
            targetStudent: 'All'
        }
    ];

    // Mock Data for Published Placement Stories
    const initialStories = [
        {
            id: 1,
            name: 'Nithisha Yadav',
            avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
            company: 'Thoughtworks',
            companyColor: '#f3e8ff',
            companyTextColor: '#8b5cf6',
            role: 'Software Engineer',
            packageAmt: '8.5 LPA',
            storyText: 'Secured a Software Engineer role at Thoughtworks. The preparation drives helped me refine my technical skills.',
            date: '10 Apr 2025'
        },
        {
            id: 2,
            name: 'Prabhat Pundeer',
            avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
            company: 'Snabbits',
            companyColor: '#fffbeb',
            companyTextColor: '#d97706',
            role: 'SDE Intern',
            packageAmt: '6.0 LPA',
            storyText: 'Delighted to join Snabbits as an SDE Intern. Grateful to the control center mentors for guidance.',
            date: '8 Apr 2025'
        },
        {
            id: 3,
            name: 'Deepak Kumar',
            avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
            company: 'Mindstix',
            companyColor: '#eff6ff',
            companyTextColor: '#2563eb',
            role: 'Full Stack Developer',
            packageAmt: '12.0 LPA',
            storyText: 'Landed a Full Stack Developer role at Mindstix. Consistent project building was key to cracking the interviews.',
            date: '5 Apr 2025'
        }
    ];

    // State for placement drives and pagination
    const [drives, setDrives] = useState(() => {
        const stored = localStorage.getItem("placement_drives");
        return stored ? JSON.parse(stored) : initialDrives;
    });

    useEffect(() => {
        localStorage.setItem("placement_drives", JSON.stringify(drives));
    }, [drives]);

    // Modal states for adding/editing placement drives
    const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
    const [editingDrive, setEditingDrive] = useState(null);
    const [studentPickerSearch, setStudentPickerSearch] = useState('');

    // Custom confirm dialog state (replaces browser window.confirm)
    const [confirmDialog, setConfirmDialog] = useState({ open: false, driveId: null, company: '' });

    const showDriveToast = (msg) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3500);
    };

    const [driveForm, setDriveForm] = useState({
        company: '',
        role: '',
        location: '',
        date: '',
        time: '',
        venue: '',
        status: 'open',
        targetStudent: 'All'
    });

    const handleOpenAddDrive = () => {
        setEditingDrive(null);
        setDriveForm({
            company: '',
            role: '',
            location: '',
            date: '',
            time: '',
            venue: 'Seminar Hall A',
            status: 'open',
            targetStudent: 'All'
        });
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
            status: drive.status || 'open',
            targetStudent: drive.targetStudent || 'All'
        });
        setIsDriveModalOpen(true);
    };

    const handleDeleteDrive = (driveId) => {
        const driveToDelete = drives.find(d => d.id === driveId);
        setConfirmDialog({ open: true, driveId, company: driveToDelete?.company || 'this drive' });
    };

    const handleConfirmDelete = async () => {
        const driveToDelete = drives.find(d => d.id === confirmDialog.driveId);
        try {
            if (confirmDialog.driveId) {
                await deleteDrive(confirmDialog.driveId);
            }
        } catch (err) {
            console.log("Local drive delete:", err);
        }
        const updatedDrives = drives.filter(d => d.id !== confirmDialog.driveId);
        setDrives(updatedDrives);
        setConfirmDialog({ open: false, driveId: null, company: '' });
        showDriveToast(`Placement drive for ${driveToDelete?.company || 'Company'} deleted.`);
    };

    const handleSaveDrive = async (e) => {
        e.preventDefault();
        if (!driveForm.company || !driveForm.role) {
            return;
        }

        const logoUrl = `https://logo.clearbit.com/${driveForm.company.toLowerCase().replace(/\s+/g, '')}.com`;

        if (editingDrive) {
            // Update existing
            const driveUpdatePayload = {
                company: driveForm.company,
                logo: logoUrl,
                role: driveForm.role,
                location: driveForm.location,
                date: driveForm.date,
                time: driveForm.time,
                venue: driveForm.venue,
                status: driveForm.status,
                targetStudent: driveForm.targetStudent
            };

            try {
                await updateDrive(editingDrive.id, driveUpdatePayload);
            } catch (err) {
                console.log("Local drive update:", err);
            }

            const updatedDrives = drives.map(d => {
                if (d.id === editingDrive.id) {
                    return {
                        ...d,
                        ...driveUpdatePayload
                    };
                }
                return d;
            });
            setDrives(updatedDrives);
            setToastMessage(`Placement drive for ${driveForm.company} updated successfully!`);
        } else {
            // Add new
            const newDrive = {
                id: Date.now(),
                company: driveForm.company,
                logo: logoUrl,
                role: driveForm.role,
                location: driveForm.location,
                date: driveForm.date,
                time: driveForm.time,
                venue: driveForm.venue,
                status: driveForm.status,
                targetStudent: driveForm.targetStudent
            };

            try {
                await createDrive(newDrive);
            } catch (err) {
                console.log("Local drive create:", err);
            }

            setDrives([newDrive, ...drives]);
            setToastMessage(`New placement drive for ${driveForm.company} added successfully!`);
        }

        setIsDriveModalOpen(false);
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
        }, 3500);
    };

    const [driveSearch, setDriveSearch] = useState('');
    const [drivePage, setDrivePage] = useState(1);
    const drivesPerPage = 5; // Show 5 drives per table page

    // State for published placement stories and pagination
    const [stories, setStories] = useState(() => {
        const stored = localStorage.getItem("placement_stories");
        return stored ? JSON.parse(stored) : initialStories;
    });

    useEffect(() => {
        localStorage.setItem("placement_stories", JSON.stringify(stories));
    }, [stories]);

    const [storyPage, setStoryPage] = useState(1);
    const storiesPerPage = 2; // Show 2 stories per carousel slide page

    // Reset drives page to 1 when search query changes
    useEffect(() => {
        setDrivePage(1);
    }, [driveSearch]);

    // Filter drives list based on company name or role search
    const filteredDrives = drives.filter(d =>
        d.company.toLowerCase().includes(driveSearch.toLowerCase()) ||
        d.role.toLowerCase().includes(driveSearch.toLowerCase())
    );

    // Drives pagination calculations
    const indexOfLastDrive = drivePage * drivesPerPage;
    const indexOfFirstDrive = indexOfLastDrive - drivesPerPage;
    const paginatedDrives = filteredDrives.slice(indexOfFirstDrive, indexOfLastDrive);
    const totalDrivePages = Math.ceil(filteredDrives.length / drivesPerPage);

    // Stories pagination calculations
    const indexOfLastStory = storyPage * storiesPerPage;
    const indexOfFirstStory = indexOfLastStory - storiesPerPage;
    const paginatedStories = stories.slice(indexOfFirstStory, indexOfLastStory);
    const totalStoryPages = Math.ceil(stories.length / storiesPerPage);

    // Form state for publishing student success stories
    const [storyForm, setStoryForm] = useState({
        studentName: '',
        companyName: '',
        jobRole: '',
        package: '',
        storyText: ''
    });

    // Handle form submission to publish stories
    const handlePublishStory = async (e) => {
        e.preventDefault();
        if (!storyForm.studentName || !storyForm.companyName || !storyForm.jobRole) {
            return;
        }

        const randomId = Math.floor(Math.random() * 50) + 1;
        const isBoy = Math.random() > 0.5;
        const avatarUrl = `https://randomuser.me/api/portraits/${isBoy ? 'men' : 'women'}/${randomId}.jpg`;

        const newStory = {
            id: Date.now(),
            name: storyForm.studentName,
            avatar: avatarUrl,
            company: storyForm.companyName,
            companyColor: '#eff6ff',
            companyTextColor: '#2563eb',
            role: storyForm.jobRole,
            packageAmt: storyForm.package || 'Not Disclosed',
            storyText: storyForm.storyText || `Secured a ${storyForm.jobRole} role at ${storyForm.companyName}.`,
            date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        };

        try {
            await createStory(newStory);
        } catch (err) {
            console.log("Local story save:", err);
        }

        setStories([newStory, ...stories]);

        // Reset form inputs after publishing
        setStoryForm({
            studentName: '',
            companyName: '',
            jobRole: '',
            package: '',
            storyText: ''
        });

        setToastMessage(`Success story for ${newStory.name} published!`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3500);
    };

    const handleDeleteStory = async (storyId) => {
        try {
            await deleteStory(storyId);
        } catch (err) {
            console.log("Local story delete:", err);
        }
        setStories(prev => prev.filter(s => s.id !== storyId));
        setToastMessage("Placement story removed.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    return (
        <div className="queries-stories-container">
            {/* Grid wrapper to place cards side by side */}
            <div className="qs-row">

                {/* 1. Student Queries Card */}
                <div className="qs-panel queries-card">
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

                    {/* Filter Pills */}
                    <div className="pills-wrapper">
                        <button className={`pill-btn all-pill ${queryFilter === 'all' ? 'active' : ''}`} onClick={() => setQueryFilter('all')}>
                            All ({totalQueriesCount})
                        </button>
                        <button className={`pill-btn pending-pill ${queryFilter === 'pending' ? 'active' : ''}`} onClick={() => setQueryFilter('pending')}>
                            Pending ({pendingCount})
                        </button>
                        <button className={`pill-btn resolved-pill ${queryFilter === 'resolved' ? 'active' : ''}`} onClick={() => setQueryFilter('resolved')}>
                            Resolved ({resolvedCount})
                        </button>
                    </div>

                    {/* Queries List */}
                    <div className="queries-list-scroll">
                        {paginatedQueries.length > 0 ? (
                            paginatedQueries.map((query) => (
                                <div key={query.id} className="query-item-card">
                                    <div className="query-user-profile">
                                        <div
                                            className="query-avatar-circle"
                                            style={{
                                                backgroundColor:
                                                    query.colorClass === 'blue' ? '#dbeafe' :
                                                        query.colorClass === 'purple' ? '#e9d5ff' :
                                                            query.colorClass === 'green' ? '#a7f3d0' :
                                                                query.colorClass === 'orange' ? '#fed7aa' : '#e0e7ff',
                                                color:
                                                    query.colorClass === 'blue' ? '#1e40af' :
                                                        query.colorClass === 'purple' ? '#581c87' :
                                                            query.colorClass === 'green' ? '#047857' :
                                                                query.colorClass === 'orange' ? '#c2410c' : '#4f46e5'
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
                                            {query.status === 'resolved' && query.studentConfirmed ? 'resolved (student confirmed)' : query.status}
                                        </span>
                                        <div className="action-links-group">
                                            <button
                                                className="text-action-btn"
                                                onClick={() => {
                                                    setSelectedViewQuery(query);
                                                    setIsViewModalOpen(true);
                                                }}
                                            >
                                                View
                                            </button>
                                            <button
                                                className="text-action-btn primary-action"
                                                onClick={() => {
                                                    setSelectedReplyQuery(query);
                                                    setReplyText(query.reply || '');
                                                    setIsReplyModalOpen(true);
                                                }}
                                            >
                                                Reply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="empty-state-text">No matching student queries found.</p>
                        )}
                    </div>

                    {/* Centered Pagination controls block */}
                    <div className="table-card-footer">
                        <div className="pagination-wrapper">
                            <button
                                className="pagination-btn"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                &larr;
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                                <button
                                    key={pageNum}
                                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            ))}

                            <button
                                className="pagination-btn"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                &rarr;
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Publish Story Form Panel */}
                <div className="qs-panel publish-story-card">
                    <div className="qs-panel-header">
                        <div>
                            <h3 className="panel-title">Create Placement Story</h3>
                            <p className="panel-subtitle">Add and publish success stories of placed students.</p>
                        </div>
                    </div>

                    <form onSubmit={handlePublishStory} className="publish-form-body">
                        {/* Upper Row containing upload photo dashed card and name/company inputs */}
                        <div className="form-upper-row">
                            <div className="upload-photo-zone">
                                <Upload size={24} className="upload-cloud-icon" />
                                <span className="upload-label">Upload Photo</span>
                                <span className="upload-subtext">PNG, JPG (Max 5MB)</span>
                            </div>
                            <div className="inputs-block">
                                <div className="form-group-field">
                                    <label className="field-label">Student Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter student name"
                                        className="form-input-control"
                                        value={storyForm.studentName}
                                        onChange={(e) => setStoryForm({ ...storyForm, studentName: e.target.value })}
                                    />
                                </div>
                                <div className="form-group-field">
                                    <label className="field-label">Company Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter company name"
                                        className="form-input-control"
                                        value={storyForm.companyName}
                                        onChange={(e) => setStoryForm({ ...storyForm, companyName: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Split inputs for Role and Package */}
                        <div className="form-grid-row">
                            <div className="form-group-field">
                                <label className="field-label">Job Role</label>
                                <input
                                    type="text"
                                    placeholder="Enter job role"
                                    className="form-input-control"
                                    value={storyForm.jobRole}
                                    onChange={(e) => setStoryForm({ ...storyForm, jobRole: e.target.value })}
                                />
                            </div>
                            <div className="form-group-field">
                                <label className="field-label">Package</label>
                                <input
                                    type="text"
                                    placeholder="Enter package (e.g. 6 LPA)"
                                    className="form-input-control"
                                    value={storyForm.package}
                                    onChange={(e) => setStoryForm({ ...storyForm, package: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Full width Success Story textarea field */}
                        <div className="form-group-field full-width">
                            <label className="field-label">Success Story</label>
                            <textarea
                                placeholder="Write the student's success story..."
                                className="form-textarea-control"
                                rows={4}
                                value={storyForm.storyText}
                                onChange={(e) => setStoryForm({ ...storyForm, storyText: e.target.value })}
                            ></textarea>
                        </div>

                        {/* Submit button aligned to right */}
                        <div className="form-submit-row">
                            <button type="submit" className="btn-primary-purple">Publish Story</button>
                        </div>
                    </form>
                </div>

            </div> {/* End of top qs-row */}

            {/* Second row layout containing Manage Placement Drives and Published Placement Stories side by side */}
            <div className="qs-row" style={{ marginTop: '32px' }}>

                {/* 3. Manage Placement Drives Panel */}
                <div className="qs-panel placement-drives-card">
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
                            <button className="btn-add-drive" onClick={handleOpenAddDrive}>
                                <Plus size={15} style={{ marginRight: '6px' }} />
                                Add New Drive
                            </button>
                        </div>
                    </div>

                    {/* Placement Drives List Table */}
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
                                                        src={drive.logo}
                                                        alt={drive.company}
                                                        className="logo-initial"
                                                        style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                                                    />
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
                                                    <button className="action-icon-btn edit" onClick={() => handleOpenEditDrive(drive)}>
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button className="action-icon-btn delete" onClick={() => handleDeleteDrive(drive.id)}>
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

                    <div className="table-card-footer" style={{ paddingTop: '12px' }}>
                        <div className="pagination-wrapper">
                            <button
                                className="pagination-btn"
                                onClick={() => setDrivePage(prev => Math.max(prev - 1, 1))}
                                disabled={drivePage === 1}
                            >
                                &larr;
                            </button>

                            {Array.from({ length: totalDrivePages }, (_, i) => i + 1).map(pageNum => (
                                <button
                                    key={pageNum}
                                    className={`pagination-btn ${drivePage === pageNum ? 'active' : ''}`}
                                    onClick={() => setDrivePage(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            ))}

                            <button
                                className="pagination-btn"
                                onClick={() => setDrivePage(prev => Math.min(prev + 1, totalDrivePages))}
                                disabled={drivePage === totalDrivePages || totalDrivePages === 0}
                            >
                                &rarr;
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. Published Placement Stories Panel */}
                <div className="qs-panel placement-stories-card" style={{ position: 'relative' }}>
                    <div className="qs-panel-header">
                        <div>
                            <h3 className="panel-title">Published Placement Stories</h3>
                            <p className="panel-subtitle">Manage and edit published placement stories.</p>
                        </div>
                    </div>

                    {/* Stories Wide Box List Layout */}
                    <div className="stories-list-container">
                        {paginatedStories.map((story) => (
                            <div key={story.id} className="story-wide-box">
                                <div className="story-box-header">
                                    <div className="story-box-user-info">
                                        <img
                                            src={story.avatar}
                                            alt={story.name}
                                            className="story-box-avatar"
                                        />
                                        <div className="story-box-user-details">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <h4 className="story-box-name">{story.name}</h4>
                                                <span
                                                    className="story-company-tag"
                                                    style={{
                                                        backgroundColor: story.companyColor,
                                                        color: story.companyTextColor
                                                    }}
                                                >
                                                    {story.company}
                                                </span>
                                            </div>
                                            <span className="story-box-role" style={{ color: story.companyTextColor }}>
                                                {story.role}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="story-box-actions-pkg" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="story-package-tag">{story.packageAmt}</span>
                                        <button
                                            type="button"
                                            className="action-icon-btn delete"
                                            title="Delete Story"
                                            onClick={() => handleDeleteStory(story.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                <p className="story-box-quote">
                                    "{story.storyText || `Secured a ${story.role} role at ${story.company}.`}"
                                </p>

                                <div className="story-box-footer">
                                    <span className="story-publish-date-inline">
                                        <Calendar size={13} style={{ marginRight: '4px' }} />
                                        Published on {story.date}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* Stories Pagination Controls */}
                        {totalStoryPages > 1 && (
                            <div className="sd-pagination" style={{ marginTop: 'auto', paddingTop: '10px' }}>
                                <button
                                    className="sd-page-btn"
                                    disabled={storyPage === 1}
                                    onClick={() => setStoryPage(p => Math.max(1, p - 1))}
                                >
                                    ← Prev
                                </button>
                                <span className="sd-page-info">
                                    Page {storyPage} of {totalStoryPages}
                                </span>
                                <button
                                    className="sd-page-btn"
                                    disabled={storyPage >= totalStoryPages}
                                    onClick={() => setStoryPage(p => Math.min(totalStoryPages, p + 1))}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Modal rendering */}
            {isDriveModalOpen && (
                <div className="analytics-modal-overlay" onClick={() => setIsDriveModalOpen(false)}>
                    <div className="analytics-modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="analytics-modal-header">
                            <div>
                                <h3 className="analytics-modal-title">
                                    {editingDrive ? "Edit Placement Drive" : "Add New Placement Drive"}
                                </h3>
                                <p className="analytics-modal-subtitle">
                                    Configure schedule, venue, and target students for this placement drive.
                                </p>
                            </div>
                            <button className="analytics-modal-close" onClick={() => setIsDriveModalOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveDrive} className="analytics-modal-form">
                            <div className="analytics-modal-grid">
                                <div className="modal-group">
                                    <label>Company Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={driveForm.company}
                                        onChange={(e) => setDriveForm({ ...driveForm, company: e.target.value })}
                                        placeholder="e.g. TCS"
                                    />
                                </div>
                                <div className="modal-group">
                                    <label>Job Role *</label>
                                    <input
                                        type="text"
                                        required
                                        value={driveForm.role}
                                        onChange={(e) => setDriveForm({ ...driveForm, role: e.target.value })}
                                        placeholder="e.g. System Engineer"
                                    />
                                </div>
                                <div className="modal-group">
                                    <label>Location *</label>
                                    <input
                                        type="text"
                                        required
                                        value={driveForm.location}
                                        onChange={(e) => setDriveForm({ ...driveForm, location: e.target.value })}
                                        placeholder="e.g. Pune"
                                    />
                                </div>
                                <div className="modal-group">
                                    <label>Date *</label>
                                    <input
                                        type="text"
                                        required
                                        value={driveForm.date}
                                        onChange={(e) => setDriveForm({ ...driveForm, date: e.target.value })}
                                        placeholder="e.g. 30 Jul 2026"
                                    />
                                </div>
                                <div className="modal-group">
                                    <label>Time *</label>
                                    <input
                                        type="text"
                                        required
                                        value={driveForm.time}
                                        onChange={(e) => setDriveForm({ ...driveForm, time: e.target.value })}
                                        placeholder="e.g. 09:00 AM"
                                    />
                                </div>
                                <div className="modal-group">
                                    <label>Venue *</label>
                                    <input
                                        type="text"
                                        required
                                        value={driveForm.venue}
                                        onChange={(e) => setDriveForm({ ...driveForm, venue: e.target.value })}
                                        placeholder="e.g. Seminar Hall A"
                                    />
                                </div>
                                <div className="modal-group">
                                    <label>Status *</label>
                                    <select
                                        value={driveForm.status}
                                        onChange={(e) => setDriveForm({ ...driveForm, status: e.target.value })}
                                    >
                                        <option value="open">Open</option>
                                        <option value="upcoming">Upcoming</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                                <div className="modal-group">
                                    <label>Target Student *</label>
                                    <select
                                        value={driveForm.targetStudent}
                                        onChange={(e) => setDriveForm({ ...driveForm, targetStudent: e.target.value })}
                                    >
                                        <option value="All">All Students (Selected for Everyone)</option>
                                        <option value="Sneha Jadhav (BCA - 2025)">Sneha Jadhav — BCA (2025)</option>
                                        <option value="Priya Sharma (BCA - 2026)">Priya Sharma — BCA (2026)</option>
                                        <option value="Rahul Patil (B.Sc CS - 2026)">Rahul Patil — B.Sc Computer Science (2026)</option>
                                        <option value="Aditya More (B.Sc IT - 2026)">Aditya More — B.Sc IT (2026)</option>
                                        {/* Dynamic student profiles */}
                                        {(() => {
                                            try {
                                                const profiles = JSON.parse(localStorage.getItem("registered_profiles") || "[]");
                                                return profiles.map(p => (
                                                    <option key={p.email || p.fullName} value={`${p.fullName} (${p.course || p.department || 'BCA'})`}>
                                                        {p.fullName} — {p.course || p.department || 'BCA'} ({p.currentYear ? p.currentYear + ' Year' : '2026'})
                                                    </option>
                                                ));
                                            } catch (err) {
                                                return null;
                                            }
                                        })()}
                                    </select>
                                </div>
                                <div className="modal-group full-span">
                                    <label>Or Type Specific Student Name / Interview Target Manually</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Sneha Jadhav (BCA)"
                                        value={driveForm.targetStudent === 'All' ? '' : driveForm.targetStudent}
                                        onChange={(e) => setDriveForm({ ...driveForm, targetStudent: e.target.value || 'All' })}
                                    />
                                </div>
                            </div>
                            <div className="analytics-modal-footer">
                                <button type="button" className="btn-modal-cancel" onClick={() => setIsDriveModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-modal-submit">
                                    <Plus size={16} /> {editingDrive ? "Update Drive" : "Add Drive"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Student Query Modal */}
            {isViewModalOpen && selectedViewQuery && (
                <div className="analytics-modal-overlay" onClick={() => setIsViewModalOpen(false)}>
                    <div className="analytics-modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="analytics-modal-header">
                            <div>
                                <h3 className="analytics-modal-title">Student Query Details</h3>
                                <p className="analytics-modal-subtitle">Submitted by {selectedViewQuery.name}</p>
                            </div>
                            <button className="analytics-modal-close" onClick={() => setIsViewModalOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="analytics-modal-form">
                            <div className="query-view-details">
                                <div className="query-view-header-row">
                                    <div className="query-avatar-circle" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                                        {selectedViewQuery.avatar}
                                    </div>
                                    <div>
                                        <h4 className="query-view-name">{selectedViewQuery.name}</h4>
                                        <span className="query-view-course">{selectedViewQuery.course}</span>
                                    </div>
                                    <span className={`query-status-tag status-${selectedViewQuery.status}`} style={{ marginLeft: 'auto' }}>
                                        {selectedViewQuery.status}
                                    </span>
                                </div>

                                <div className="query-view-section">
                                    <label className="query-view-label">Subject</label>
                                    <p className="query-view-subject">{selectedViewQuery.title}</p>
                                </div>

                                <div className="query-view-section">
                                    <label className="query-view-label">Query Description</label>
                                    <div className="query-view-message-box">
                                        {selectedViewQuery.message}
                                    </div>
                                </div>

                                <div className="query-view-section">
                                    <span className="query-view-date">
                                        <Calendar size={13} style={{ marginRight: '4px' }} /> Submitted on {selectedViewQuery.date}
                                    </span>
                                </div>
                            </div>

                            <div className="analytics-modal-footer">
                                <button type="button" className="btn-modal-cancel" onClick={() => setIsViewModalOpen(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reply Student Query Modal */}
            {isReplyModalOpen && selectedReplyQuery && (
                <div className="analytics-modal-overlay" onClick={() => setIsReplyModalOpen(false)}>
                    <div className="analytics-modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="analytics-modal-header">
                            <div>
                                <h3 className="analytics-modal-title">Reply to Query</h3>
                                <p className="analytics-modal-subtitle">Replying to {selectedReplyQuery.name}</p>
                            </div>
                            <button className="analytics-modal-close" onClick={() => setIsReplyModalOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSendReplySubmit} className="analytics-modal-form">
                            <div className="query-view-section" style={{ marginBottom: '16px' }}>
                                <label className="query-view-label">Student's Query</label>
                                <div className="query-view-message-box" style={{ background: '#f8fafc', fontSize: '0.84rem' }}>
                                    <strong>{selectedReplyQuery.title}</strong>
                                    <p style={{ margin: '4px 0 0 0', color: '#475569' }}>{selectedReplyQuery.message}</p>
                                </div>
                            </div>

                            <div className="modal-group">
                                <label>Admin Response Message *</label>
                                <textarea
                                    rows={4}
                                    placeholder="Type your official response to the student here..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    required
                                    style={{
                                        padding: '10px 14px',
                                        border: '1.5px solid #e2e8f0',
                                        borderRadius: '10px',
                                        fontSize: '0.875rem',
                                        fontFamily: 'inherit',
                                        outline: 'none',
                                        backgroundColor: '#ffffff'
                                    }}
                                />
                            </div>

                            <div className="analytics-modal-footer" style={{ marginTop: '20px' }}>
                                <button type="button" className="btn-modal-cancel" onClick={() => setIsReplyModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-modal-submit">
                                    Send Reply
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {showToast && (
                <div className="qs-toast-notification success">
                    <div className="qs-toast-content">
                        <CheckCircle className="qs-toast-icon" size={18} />
                        <span>{toastMessage}</span>
                    </div>
                    <div className="qs-toast-progress-bar"></div>
                </div>
            )}

            {/* Custom Confirm Delete Dialog */}
            {confirmDialog.open && (
                <div className="qs-confirm-overlay">
                    <div className="qs-confirm-box">
                        <div className="qs-confirm-icon">
                            <Trash2 size={26} color="#ef4444" />
                        </div>
                        <h4 className="qs-confirm-title">Delete Placement Drive</h4>
                        <p className="qs-confirm-message">
                            Are you sure you want to delete the drive for <strong>{confirmDialog.company}</strong>? This action cannot be undone.
                        </p>
                        <div className="qs-confirm-actions">
                            <button
                                className="qs-confirm-btn cancel"
                                onClick={() => setConfirmDialog({ open: false, driveId: null, company: '' })}
                            >
                                Cancel
                            </button>
                            <button
                                className="qs-confirm-btn delete"
                                onClick={handleConfirmDelete}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}