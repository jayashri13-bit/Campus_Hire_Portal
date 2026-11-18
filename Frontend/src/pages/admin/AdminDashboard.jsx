import React, { useState, useEffect, useRef } from 'react';
import './AdminDashboard.css';
import StudentAnalytics from './StudentAnalytics';
import QueriesStories from './QueriesStories';
import {
    getAdminMetrics,
    getJobs,
    createJob,
    deleteJob,
    getDrafts,
    saveDraft,
    publishDraft,
    deleteDraft,
    getApplicants,
    getNotifications,
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword
} from '../../api/adminApi';
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
    Factory,
    User,
    Lock,
    LogOut,
    Calendar,
    Eye,
    EyeOff,
    Edit3,
    BarChart
} from 'lucide-react';

function AdminDashboard({ onNavigate }) {
    //1. Sidebar form visibility
    const [isSidebarOpen, setIsSidebarOpen] =
        useState(false);

    // Active menu tab state
    const [activeTab, setActiveTab] = useState('dashboard');


    //2. Search and filter state
    const [searchTerm, setSearchTerm] =
        useState('');
    const [filterBy, setFilterBy] =
        useState('By Date');  // By date or by company name
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

    const initialJobs = [
        {
            id: 1, title: 'Software Developer Intern',
            company: 'Google', status: 'Active',
            date: '05 July 2026',
            deadline: '2026-07-20',
            logoUrl: 'https://logo.clearbit.com/google.com',
            location: 'Bangalore, India',
            requirements: 'Strong problem solving skills, DSA, React, Node.js',
            degree: 'B.Tech', branch: 'Computer Science',
            cgpa: 7.5, year: '2026', experience: 'Fresher'
        },
        {
            id: 2, title: 'Data Analyst',
            company: 'Microsoft', status: 'Active',
            date: '04 July 2026',
            deadline: '2026-07-18',
            logoUrl: 'https://logo.clearbit.com/microsoft.com',
            location: 'Hyderabad, India',
            requirements: 'Python, SQL, Data Visualization, Excel',
            degree: 'B.Tech', branch: 'Information Technology',
            cgpa: 7.0, year: '2026', experience: 'Fresher'
        },
        {
            id: 3, title: 'SDE Intern',
            company: 'Infosys', status: 'Active',
            date: '03 July 2026',
            deadline: '2026-07-15',
            logoUrl: 'https://logo.clearbit.com/infosys.com',
            location: 'Pune, India',
            requirements: 'Java, C++, Object Oriented Programming, DBMS',
            degree: 'B.Tech', branch: 'Computer Science',
            cgpa: 6.5, year: '2026', experience: 'Fresher'
        }
    ];

    const initialDrafts = [
        {
            id: 1, title: 'UX Designer Intern', company: 'Amazon',
            location: 'Bangalore', requirements: 'Figma, UI Prototyping, User Research',
            degree: 'B.Tech / Any', branch: 'Any', cgpa: 6.0,
            year: '2026', experience: 'Fresher', deadline: '2026-08-01',
            lastSaved: '2 hours ago'
        },
        {
            id: 2, title: 'Graduate Engineer', company: 'TCS',
            location: 'Mumbai', requirements: 'C++, Java, Basic Networking',
            degree: 'B.Tech', branch: 'Circuit Branches', cgpa: 6.5,
            year: '2026', experience: 'Fresher', deadline: '2026-08-10',
            lastSaved: '1 day ago'
        }
    ];

    // Job postings list (synced with localStorage)
    const [jobs, setJobs] = useState(() => {
        const stored = localStorage.getItem("admin_jobs");
        return stored ? JSON.parse(stored) : initialJobs;
    });

    // Draft lists (synced with localStorage)
    const [drafts, setDrafts] = useState(() => {
        const stored = localStorage.getItem("admin_drafts");
        return stored ? JSON.parse(stored) : initialDrafts;
    });

    useEffect(() => {
        localStorage.setItem("admin_jobs", JSON.stringify(jobs));
    }, [jobs]);

    useEffect(() => {
        localStorage.setItem("admin_drafts", JSON.stringify(drafts));
    }, [drafts]);

    //Applicants mock data
    const initialApplicants = [
        {
            id: 1, name: 'Priya Sharma', company: 'Google',
            degree: 'B.Tech', branch: 'Computer Science',
            cgpa: 8.23, year: '2026 Passout', match: 90,
            date: '2026-07-05'
        },

        {
            id: 2, name: 'John Doe', company: 'Microsoft',
            degree: 'B.Tech', branch: 'Information Technology',
            cgpa: 7.5, year: '2026 Passput', match: 80,
            date: '2026-07-02'
        },

        {
            id: 3, name: 'Amit Kumar', company: 'Infosys',
            degree: 'B.Tech', branch: 'Computer Science',
            cgpa: 7.8, year: '2026 Passout', match: 75,
            date: '2026-07-06'
        }
    ];

    const [applicants, setApplicants] =
        useState(initialApplicants);
    const [filteredApplicants, setFilteredApplicants] =
        useState(initialApplicants);

    // 5.Form state for adding a new job
    const [newJob, setNewJob] = useState({
        companyName: '',
        location: '',
        jobRequirements: '',
        jobRoleOverview: '',
        degree: '',
        branch: '',
        minCgpa: '',
        passingYear: '',
        experience: '',
        deadline: ''
    });

    // Success Toast States
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [validationError, setValidationError] = useState(false);

    // Profile Dropdown State
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Notifications Sidebar State
    const [isNotificationSidebarOpen, setIsNotificationSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, text: "Amit Kumar applied for Google!", date: "Today" },
        { id: 2, text: "New student registration: John Doe", date: "Yesterday" },
        { id: 3, text: "Placement posting 'UX Designer Intern' saved as draft.", date: "2 days ago" }
    ]);

    // Profile Settings Modal States
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileTab, setProfileTab] = useState('edit'); // 'edit' or 'password'
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    // Load active admin details from localStorage (set on login from backend)
    const loggedInAdmin = JSON.parse(localStorage.getItem("user") || "{}");

    const [adminProfile, setAdminProfile] = useState({
        name: loggedInAdmin.fullName || '',
        email: loggedInAdmin.email || '',
        phone: loggedInAdmin.phone || '',
        role: 'System Administrator'
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Dashboard KPI Metrics State
    const [metrics, setMetrics] = useState({
        activeJobs: initialJobs.length,
        totalStudents: 500,
        resumesReceived: 120,
        totalDrafts: initialDrafts.length
    });

    // Load initial live data from Python FastAPI backend
    useEffect(() => {
        let isMounted = true;
        const loadDashboardData = async () => {
            try {
                // 1. Fetch live metrics
                const metricsData = await getAdminMetrics();
                if (isMounted && metricsData) {
                    setMetrics(metricsData);
                }

                // 2. Fetch active jobs
                const jobsData = await getJobs();
                if (isMounted && Array.isArray(jobsData) && jobsData.length > 0) {
                    setJobs(jobsData);
                }

                // 3. Fetch saved drafts
                const draftsData = await getDrafts();
                if (isMounted && Array.isArray(draftsData)) {
                    setDrafts(draftsData);
                }

                // 4. Fetch applicants
                const applicantsData = await getApplicants();
                if (isMounted && Array.isArray(applicantsData) && applicantsData.length > 0) {
                    setApplicants(applicantsData);
                }

                // 5. Fetch notifications
                const notifData = await getNotifications();
                if (isMounted && Array.isArray(notifData)) {
                    setNotifications(notifData);
                }

                // 6. Fetch admin profile details
                const profileData = await getAdminProfile(loggedInAdmin.email || 'saurabh@gmail.com');
                if (isMounted && profileData) {
                    setAdminProfile(prev => ({
                        ...prev,
                        name: profileData.name || prev.name,
                        email: profileData.email || prev.email,
                        phone: profileData.phone || prev.phone,
                        role: profileData.role || prev.role
                    }));
                }
            } catch (err) {
                console.log("[AdminDashboard] Running with offline data resilience:", err);
            }
        };

        loadDashboardData();
        return () => { isMounted = false; };
    }, []);

    // Admin password visibility states
    const [showAdminCurrentPassword, setShowAdminCurrentPassword] = useState(false);
    const [showAdminNewPassword, setShowAdminNewPassword] = useState(false);
    const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false);

    // Pagination States
    const [jobsCurrentPage, setJobsCurrentPage] = useState(1);
    const JOBS_PER_PAGE = 3;

    const [applicantsCurrentPage, setApplicantsCurrentPage] = useState(1);
    const APPLICANTS_PER_PAGE = 3;

    // Secondary filter inputs states
    const [filterDate, setFilterDate] = useState('');
    const [filterCompany, setFilterCompany] = useState('');

    // Custom calendar popup states
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

    // Click away to close date picker
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

    // Modal Job Deadline calendar states
    const [isModalDatePickerOpen, setIsModalDatePickerOpen] = useState(false);
    const [modalCalDate, setModalCalDate] = useState(new Date());
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

    // Click away to close modal date picker
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

    // 6. Side Effect: Recalcuuate applicant matches whenever Search or Filter changes
    useEffect(() => {
        let result = [...applicants];

        // Search term (by name or company)
        if (searchTerm.trim() !== '') {
            result = result.filter(app =>
                app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.company.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Dropdown specific filters
        if (filterBy.toLowerCase() === 'by company name') {
            if (filterCompany.trim() !== '') {
                result = result.filter(app =>
                    app.company.toLowerCase().includes(filterCompany.toLowerCase())
                );
            }
            result.sort((a, b) => a.company.localeCompare(b.company));
        } else if (filterBy.toLowerCase() === 'by date') {
            if (filterDate) {
                result = result.filter(app => app.date === filterDate);
            }
            result.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else {
            // Default: Sort by Match percentage
            result.sort((a, b) => b.match - a.match);
        }

        setApplicantsCurrentPage(1); // Reset page to 1 when search or filter changes
        setFilteredApplicants(result);
    }, [searchTerm, filterBy, filterDate, filterCompany, applicants]);

    // 7. Handler: Updates the new job form state whenever a user types or selects an option 
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewJob(prev => ({
            ...prev,
            [name]: value //Dynamically updates the specific key (like companyName, degree, etc)
        }));
    };

    // 8. Handler: Creates a new job posting and adds it to the list 
    const handlePostJob = async (e) => {
        e.preventDefault(); // Prevents the browser from reloading the page

        //Quick validation
        if (!newJob.companyName || !newJob.jobRoleOverview || !newJob.jobRequirements) {
            setValidationError(true);
            setToastMessage("Please fill in Company Name, Job Role Overview, and Job Requirements!");
            setToastType('error');
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
            }, 3000);
            return;
        }

        setValidationError(false);

        try {
            // Call Python FastAPI backend
            const createdJob = await createJob(newJob);

            // Update state: prepend new job
            setJobs(prevJobs => [createdJob, ...prevJobs.filter(j => j.id !== createdJob.id)]);

            // Sync to placement_drives so student dashboard can see it
            try {
                const storedDrives = JSON.parse(localStorage.getItem("placement_drives") || "[]");
                const newDrive = {
                    id: createdJob.id,
                    company: createdJob.company,
                    logo: `https://logo.clearbit.com/${createdJob.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
                    role: createdJob.title,
                    location: createdJob.location,
                    date: createdJob.deadline,
                    time: '10:00 AM',
                    status: 'open',
                    venue: 'Placement Cell',
                    about: `${createdJob.company} is hiring for ${createdJob.title}. Requirements: ${createdJob.requirements}`,
                    targetStudent: 'All'
                };
                localStorage.setItem("placement_drives", JSON.stringify([newDrive, ...storedDrives.filter(d => d.id !== newDrive.id)]));
            } catch (e) {
                console.error("Could not sync placement drives:", e);
            }

            // Reset the form fields back to empty
            setNewJob({
                companyName: '',
                location: '',
                jobRequirements: '',
                jobRoleOverview: '',
                degree: '',
                branch: '',
                minCgpa: '',
                passingYear: '',
                experience: '',
                deadline: ''
            });

            // Trigger Success Toast Notification
            setToastType('success');
            setToastMessage(`Job posted successfully for ${createdJob.company}!`);
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
            }, 3000);

            // Close the sidebar panel
            setIsSidebarOpen(false);
        } catch (err) {
            setToastType('error');
            setToastMessage(err.message || "Failed to post job");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    // Save as draft handler
    const handleSaveDraft = async () => {
        if (!newJob.companyName || !newJob.jobRoleOverview) {
            setValidationError(true);
            setToastMessage("Please fill in Company Name and Job Role Overview to save as a draft!");
            setToastType('error');
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
            }, 3000);
            return;
        }

        setValidationError(false);

        try {
            // Call Python FastAPI backend
            const savedDraft = await saveDraft(newJob);

            setDrafts(prevDrafts => [savedDraft, ...prevDrafts.filter(d => d.id !== savedDraft.id)]);
            setNewJob({
                companyName: '',
                location: '',
                jobRequirements: '',
                jobRoleOverview: '',
                degree: '',
                branch: '',
                minCgpa: '',
                passingYear: '',
                experience: '',
                deadline: ''
            });

            // Trigger Toast Notification
            setToastType('success');
            setToastMessage(`Draft saved for ${savedDraft.company}!`);
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
            }, 3000);

            setIsSidebarOpen(false);
        } catch (err) {
            setToastType('error');
            setToastMessage(err.message || "Failed to save draft");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };


    // Publish draft handler (moves draft to active jobs list)
    const handlePublishDraft = async (draftId) => {
        const draftToPublish = drafts.find(d => d.id === draftId);
        if (!draftToPublish) return;

        try {
            let published = await publishDraft(draftId);
            if (!published) {
                published = {
                    id: draftToPublish.id,
                    title: draftToPublish.title,
                    company: draftToPublish.company,
                    location: draftToPublish.location || "Remote",
                    requirements: draftToPublish.requirements || "",
                    degree: draftToPublish.degree || "B.Tech",
                    branch: draftToPublish.branch || "Computer Science",
                    cgpa: draftToPublish.cgpa || "0",
                    year: draftToPublish.year || "2026",
                    experience: draftToPublish.experience || "Fresher",
                    deadline: draftToPublish.deadline || "2026-07-20",
                    status: 'Active',
                    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                };
            }

            setJobs(prevJobs => [published, ...prevJobs.filter(j => j.id !== published.id)]);
            setDrafts(prevDrafts => prevDrafts.filter(d => d.id !== draftId));

            // Sync to placement_drives
            try {
                const storedDrives = JSON.parse(localStorage.getItem("placement_drives") || "[]");
                const newDrive = {
                    id: published.id,
                    company: published.company,
                    logo: `https://logo.clearbit.com/${published.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
                    role: published.title,
                    location: published.location,
                    date: published.deadline,
                    time: '10:00 AM',
                    status: 'open',
                    venue: 'Placement Cell',
                    about: `${published.company} is hiring for ${published.title}.`,
                    targetStudent: 'All'
                };
                localStorage.setItem("placement_drives", JSON.stringify([newDrive, ...storedDrives.filter(d => d.id !== newDrive.id)]));
            } catch (e) {
                console.error("Could not sync placement drives:", e);
            }

            setToastType('success');
            setToastMessage(`Published draft: ${published.title} at ${published.company}!`);
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
            }, 3000);
        } catch (err) {
            setToastType('error');
            setToastMessage(err.message || "Failed to publish draft");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    // Edit draft handler (populates form inputs and removes from drafts feed)
    const handleEditDraft = (draftId) => {
        const draftToEdit = drafts.find(d => d.id === draftId);
        if (!draftToEdit) return;

        setNewJob({
            companyName: draftToEdit.company || '',
            location: draftToEdit.location || '',
            jobRequirements: draftToEdit.requirements || '',
            jobRoleOverview: draftToEdit.title || '',
            degree: draftToEdit.degree || '',
            branch: draftToEdit.branch || '',
            minCgpa: draftToEdit.cgpa || '',
            passingYear: draftToEdit.year || '',
            experience: draftToEdit.experience || '',
            deadline: draftToEdit.deadline || ''
        });

        setValidationError(false);
        setDrafts(prevDrafts => prevDrafts.filter(d => d.id !== draftId));
        setIsSidebarOpen(true);
    };

    // Profile and Password input handlers
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setAdminProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Update profile submit handler
    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        try {
            await updateAdminProfile(adminProfile);

            // Persist to localStorage
            const loggedInAdmin = JSON.parse(localStorage.getItem("user") || "{}");
            const updatedUser = {
                ...loggedInAdmin,
                fullName: adminProfile.name,
                email: adminProfile.email,
                phone: adminProfile.phone,
                role: 'admin'
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));

            setToastType('success');
            setToastMessage("Admin profile updated successfully!");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            setIsProfileModalOpen(false);
        } catch (err) {
            setToastType('error');
            setToastMessage(err.message || "Failed to update profile");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    // Change password submit handler
    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setValidationError(true);
            setToastType('error');
            setToastMessage("New passwords do not match!");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return;
        }

        try {
            await changeAdminPassword({
                email: adminProfile.email || 'saurabh@gmail.com',
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
                confirmPassword: passwordData.confirmPassword
            });

            setValidationError(false);
            setToastType('success');
            setToastMessage("Admin password changed successfully!");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);

            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setShowAdminCurrentPassword(false);
            setShowAdminNewPassword(false);
            setShowAdminConfirmPassword(false);
            setIsProfileModalOpen(false);
        } catch (err) {
            setValidationError(true);
            setToastType('error');
            setToastMessage(err.message || "Failed to change password");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    const handleCloseProfileModal = () => {
        setIsProfileModalOpen(false);
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setShowAdminCurrentPassword(false);
        setShowAdminNewPassword(false);
        setShowAdminConfirmPassword(false);
        setValidationError(false);
    };

    // Helper to format date strings to readable DD Mmm YYYY
    const formatDeadline = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    };

    // 9. Helper : Returns a dynamic inline company logo SVG or falls back to initials
    const getCompanyLogo = (company) => {
        const lower = (company || '').toLowerCase().trim();

        if (lower === 'google') {
            return (
                <div className="company-logo-svg google-svg">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                </div>
            );
        }

        if (lower === 'microsoft') {
            return (
                <div className="company-logo-svg microsoft-svg">
                    <svg viewBox="0 0 23 23" width="22" height="22">
                        <rect x="0" y="0" width="10.5" height="10.5" fill="#F25022" />
                        <rect x="11.5" y="0" width="10.5" height="10.5" fill="#7FBA00" />
                        <rect x="0" y="11.5" width="10.5" height="10.5" fill="#00A1F1" />
                        <rect x="11.5" y="11.5" width="10.5" height="10.5" fill="#FFB900" />
                    </svg>
                </div>
            );
        }

        if (lower === 'infosys') {
            return (
                <div className="company-logo-svg infosys-svg" style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', padding: '4px', overflow: 'hidden' }}>
                    <svg viewBox="0 0 95 32" width="94%" height="94%">
                        <text x="50%" y="70%" textAnchor="middle" fill="#007cc3" fontWeight="900" fontSize="22" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letterSpacing="-0.5px">Infosys</text>
                    </svg>
                </div>
            );
        }

        if (lower === 'amazon') {
            return (
                <div className="company-logo-svg amazon-svg">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                </div>
            );
        }

        if (lower === 'tcs') {
            return (
                <div className="company-logo-svg tcs-svg" style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#002664', border: '1px solid #002664', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', overflow: 'hidden' }}>
                    <svg viewBox="0 0 60 30" width="85%" height="85%">
                        <text x="50%" y="70%" textAnchor="middle" fill="#ffffff" fontWeight="900" fontSize="24" fontFamily="Arial, Helvetica, sans-serif">TCS</text>
                    </svg>
                </div>
            );
        }

        if (lower === 'ibm') {
            return (
                <div className="company-logo-svg ibm-svg" style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#0f62fe', border: '1px solid #0f62fe', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', overflow: 'hidden' }}>
                    <svg viewBox="0 0 60 30" width="85%" height="85%">
                        <text x="50%" y="70%" textAnchor="middle" fill="#ffffff" fontWeight="900" fontSize="24" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="-1px">IBM</text>
                    </svg>
                </div>
            );
        }

        if (lower === 'wipro') {
            return (
                <div className="company-logo-svg wipro-svg" style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', overflow: 'hidden' }}>
                    <svg viewBox="0 0 85 30" width="90%" height="90%">
                        <text x="50%" y="70%" textAnchor="middle" fill="#0f172a" fontWeight="900" fontSize="20" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="0.5px">WIPRO</text>
                    </svg>
                </div>
            );
        }

        return <div className='company-logo default-logo'>
            {company.charAt(0).toUpperCase()}
        </div>;
    };

    // Jobs Pagination Calculations
    const totalJobsPages = Math.ceil(jobs.length / JOBS_PER_PAGE);
    const paginatedJobs = jobs.slice(
        (jobsCurrentPage - 1) * JOBS_PER_PAGE,
        jobsCurrentPage * JOBS_PER_PAGE
    );

    // Applicants Pagination Calculations
    const totalApplicantsPages = Math.ceil(filteredApplicants.length / APPLICANTS_PER_PAGE);
    const paginatedApplicants = filteredApplicants.slice(
        (applicantsCurrentPage - 1) * APPLICANTS_PER_PAGE,
        applicantsCurrentPage * APPLICANTS_PER_PAGE
    );

    return (
        <div className='admin-dashboard-container'>

            {/*HEADER /NAVBAR*/}
            <header className='admin-header'>
                    <div className={activeTab === 'analytics' || activeTab === 'queries' ? 'analytics-header-container' : 'header-container'}>
                        <div className='logo-section' style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <GraduationCap className='logo-icon' size={28} style={{ color: '#2563eb' }} />
                            <span className='college-name' style={{ fontSize: '1.25rem', fontWeight: '800', color: '#2563eb' }}>Campus_Hire</span>
                        </div>

                        <nav className="admin-nav-tabs" style={{ margin: '0 auto' }}>
                            {[
                                { id: 'dashboard', label: 'Dashboard' },
                                { id: 'analytics', label: 'Student Analytics' },
                                { id: 'queries', label: 'Queries & Stories' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    className={`admin-nav-tab ${activeTab === item.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(item.id)}
                                >
                                    <span>{item.label}</span>
                                    {activeTab === item.id && <span className="admin-active-line" />}
                                </button>
                            ))}
                        </nav>

                        <div className='header-right'>
                        <span className='role-badge'>Admin</span>

                        <div className='notification-wrapper' onClick={() => {
                            setIsNotificationSidebarOpen(true);
                            setIsProfileOpen(false);
                        }} style={{ cursor: 'pointer' }}>
                            <Bell className='bell-icon' size={22} />
                            {notifications.length > 0 && (
                                <span className='notification-badge'>{notifications.length}</span>
                            )}
                        </div>

                        <div className='user-profile-container'>
                            <div
                                className={`user-avatar ${isProfileOpen ? 'active' : ''}`}
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                            >
                                {adminProfile.name ? adminProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AD'}
                            </div>

                            {isProfileOpen && (
                                <>
                                    <div className='profile-dropdown-backdrop' onClick={() => setIsProfileOpen(false)} />
                                    <div className='profile-dropdown-menu'>
                                        <div className='profile-header'>
                                            <span className='profile-avatar-large'>
                                                {adminProfile.name ? adminProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AD'}
                                            </span>
                                            <div className='profile-meta-info'>
                                                <span className='profile-name'>{adminProfile.name}</span>
                                                <span className='profile-email'>{adminProfile.email}</span>
                                            </div>
                                        </div>

                                        <div className='profile-divider' />

                                        <div className='profile-options-list'>
                                            <button className='profile-option-btn' onClick={() => { setIsProfileOpen(false); setProfileTab('edit'); setIsEditingProfile(false); setValidationError(false); setIsProfileModalOpen(true); }}>
                                                <User size={16} />
                                                <span>View Profile</span>
                                            </button>

                                            <button className='profile-option-btn' onClick={() => { setIsProfileOpen(false); setProfileTab('password'); setValidationError(false); setIsProfileModalOpen(true); }}>
                                                <Lock size={16} />
                                                <span>Change Password</span>
                                            </button>

                                            <div className='profile-divider' />

                                            <button className='profile-option-btn logout-btn' onClick={() => {
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
            </header>

            <div className={activeTab === 'analytics' || activeTab === 'queries' ? 'analytics-content-layout' : 'dashboard-content-layout'}>

                {/*MAIN DASHBOARD PANEL*/}
                <main className='dashboard-main'>
                    {activeTab === 'dashboard' && (
                        <>

                    {/*GREETING SECTION*/}
                    <section className='greeting-section'>
                        <div className='greeting-content'>
                            <h2>Welcome, {adminProfile.name} <span className='waving-hand'>👋</span></h2>
                            <p>Here's what's happening with Campus_Hire today.</p>
                        </div>
                        <div className='greeting-date-badge'>
                            <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                    </section>

                    {/*STATS SECTION*/}
                    <section className='admin-stats-grid'>
                        <div className='stat-card blue-card'>
                            <div className='stat-icon-wrapper blue-icon'>
                                <FileText size={22} />
                            </div>

                            <div className='stat-details'>
                                <span className='stat-label'>Active Posting</span>

                                <h3 className='stat-value'>{metrics.activeJobs || jobs.length}</h3>
                                <span className='stat-trend green-trend'>↑ 12% 
                                    <span className='trend-subtext'>from last month</span>
                                </span>

                            </div>
                        </div>

                        <div className='stat-card green-card'>
                            <div className='stat-icon-wrapper green-icon'>
                                <Users size={22} />
                            </div>

                            <div className='stat-details'>
                                <span className='stat-label'>Total Students</span>
                                <h3 className='stat-value'>{metrics.totalStudents || 500}</h3>
                                <span className='stat-trend green-trend'>↑ 8% 
                                    <span className='trend-subtext'>from last month</span></span>

                            </div>
                        </div>

                        <div className='stat-card purple-card'>
                            <div className='stat-icon-wrapper purple-icon'>
                                < Briefcase size={22} />
                            </div>

                            <div className='stat-details'>
                                <span className='stat-label'>Resume Received </span>
                                <h3 className='stat-value'>{metrics.resumesReceived || 120}</h3>

                                <span className='stat-trend green-trend'>↑ 15% 
                                    <span className='trend-subtext'>from last month</span></span>

                            </div>
                        </div>
                    </section>

                    {/*LOWER GRID LAYOUT */}
                    <div className='dashboard-grid-lower'>

                        {/*LEFT COLUMN: PLACEMENT MANAGEMENT AND RECENT POSTINGS */}
                        <div className='lower-left-column'>
                            <div className='card-box posting-management-card'>
                                <div className='card-box-header'>
                                    <h4>Placement Posting Management</h4>
                                    <button className='btn-primary' onClick={() => { setValidationError(false); setIsSidebarOpen(true); }}>
                                        < Plus size={16} />
                                        Create New Job Posting
                                    </button>
                                </div>

                                <div className='drafts-list'>
                                    <div className='drafts-section-header'>
                                        <h5>Saved Drafts ({drafts.length})</h5>
                                    </div>

                                    {drafts.map(draft => (
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
                                                    className='btn-resume-draft'
                                                    onClick={() => handleEditDraft(draft.id)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className='btn-publish-draft'
                                                    onClick={() => handlePublishDraft(draft.id)}
                                                >
                                                    Publish
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className='card-box recent-postings-card'>
                                <div className='card-box-header'>
                                    <h4>Recent Postings</h4>
                                </div>

                                <div className='postings-list'>
                                    {paginatedJobs.map((job) => (
                                        <div key={job.id} className='posting-card-item'>
                                            {/* Company Logo */}
                                            <div className='posting-card-logo-wrap'>
                                                {getCompanyLogo(job.company)}
                                            </div>

                                            {/* Job Info */}
                                            <div className='posting-card-body'>
                                                {/* Company Name as Title */}
                                                <h5 className='posting-card-title'>{job.company}</h5>

                                                {/* Stacked info rows */}
                                                <div className='posting-info-rows'>
                                                    {job.location && (
                                                        <div className='posting-info-row'>
                                                            <span className='posting-info-icon'>📍</span>
                                                            <span className='posting-info-label'>Location</span>
                                                            <span className='posting-info-sep'>:</span>
                                                            <span className='posting-info-value'>{job.location}</span>
                                                        </div>
                                                    )}
                                                    <div className='posting-info-row'>
                                                        <span className='posting-info-icon'>👤</span>
                                                        <span className='posting-info-label'>Job Role</span>
                                                        <span className='posting-info-sep'>:</span>
                                                        <span className='posting-info-value'>{job.title}</span>
                                                    </div>
                                                    {job.deadline && (
                                                        <div className='posting-info-row'>
                                                            <span className='posting-info-icon'>📅</span>
                                                            <span className='posting-info-label'>Deadline</span>
                                                            <span className='posting-info-sep'>:</span>
                                                            <span className='posting-info-value posting-info-deadline'>{formatDeadline(job.deadline)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status badge on right */}
                                            <div className='posting-card-status'>
                                                {job.deadline && new Date(job.deadline) < new Date() ? (
                                                    <span className='badge-expired'>Expired</span>
                                                ) : (
                                                    <span className='badge-active'>Active</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className='pagination-controls'>
                                    <button
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
                                        className='btn-pagination'
                                        disabled={jobsCurrentPage === totalJobsPages || totalJobsPages === 0}
                                        onClick={() => setJobsCurrentPage(prev => prev + 1)}
                                    >
                                        Next
                                    </button>
                                </div>

                            </div>

                        </div>

                        {/*Right Column Applicants*/}
                        <div className='lower-right-column'>
                            <div className='card-box applicants-card'>
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
                                            <button className="search-btn">
                                                <Search size={16} />
                                            </button>
                                        </div>

                                        <div className="custom-dropdown-container">
                                            <span className="filter-label">Filter by</span>
                                            <button
                                                className="dropdown-btn"
                                                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                                            >
                                                {filterBy} <ChevronDown size={14} />
                                            </button>
                                            {isFilterDropdownOpen && (
                                                <div className="dropdown-menu">
                                                    <div className="dropdown-item" onClick={() => handleFilterByChange('By Date')}>By Date</div>
                                                    <div className="dropdown-item" onClick={() => handleFilterByChange('By Company Name')}>By Company Name</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Dynamic filtering inputs */}
                                        {filterBy === 'By Date' && (
                                            <div className="custom-date-picker-container" ref={datePickerRef}>
                                                <button
                                                    className="date-picker-trigger"
                                                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                                >
                                                    {filterDate ? formatDeadline(filterDate) : 'Select Date...'}
                                                    <Calendar size={14} style={{ marginLeft: '8px' }} />
                                                </button>

                                                {isDatePickerOpen && (
                                                    <div className="custom-calendar-popup">
                                                        <div className="calendar-header">
                                                            <button onClick={handlePrevMonth}>&lt;</button>
                                                            <span>{calDate.toLocaleString('default', { month: 'long' })} {calDate.getFullYear()}</span>
                                                            <button onClick={handleNextMonth}>&gt;</button>
                                                        </div>
                                                        <div className="calendar-weekdays">
                                                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                                                <span key={d}>{d}</span>
                                                            ))}
                                                        </div>
                                                        <div className="calendar-days">
                                                            {/* Render empty cells for padding */}
                                                            {Array.from({ length: firstDayIndex }).map((_, i) => (
                                                                <span key={`empty-${i}`} className="empty-day"></span>
                                                            ))}
                                                            {/* Render month days */}
                                                            {Array.from({ length: totalDays }).map((_, i) => {
                                                                const day = i + 1;
                                                                const dateStr = `${calDate.getFullYear()}-${String(calDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                                const isSelected = filterDate === dateStr;
                                                                return (
                                                                    <button
                                                                        key={day}
                                                                        className={`calendar-day-btn ${isSelected ? 'selected' : ''}`}
                                                                        onClick={() => {
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
                                                            <button className="calendar-clear-btn" onClick={() => { setFilterDate(''); setIsDatePickerOpen(false); }}>Clear</button>
                                                            <button className="calendar-today-btn" onClick={() => {
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
                                    {paginatedApplicants.map((app) => (
                                        <div key={app.id} className='applicant-item'>

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
                                        </div>
                                    ))}
                                </div>

                                <div className='pagination-controls'>
                                    <button
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
                                        className='btn-pagination'
                                        disabled={applicantsCurrentPage === totalApplicantsPages || totalApplicantsPages === 0}
                                        onClick={() => setApplicantsCurrentPage(prev => prev + 1)}
                                    >
                                        Next
                                    </button>
                                </div>


                            </div>
                        </div>
                    </div>
                    </>
                    )}

                    {activeTab === 'analytics' && (
                        <StudentAnalytics />
                    )}

                    {activeTab === 'queries' && (
                        <QueriesStories />
                    )}
                </main>

                {isSidebarOpen && (
                    <div className='modal-overlay' onClick={() =>
                        setIsSidebarOpen(false)
                    }>

                        <div className='add-job-modal' onClick={(e) =>
                            e.stopPropagation()
                        }>

                            {/*Modal Header*/}
                            <div className='modal-header'>
                                <h4>Add Job Posting</h4>
                                <button className='close-btn' onClick={() =>
                                    setIsSidebarOpen(false)
                                }>
                                    <X size={20} />
                                </button>
                            </div>

                            {/*Modal Form*/}
                            <form className='modal-form' onSubmit={handlePostJob}>
                                <div className='form-group'>
                                    <label>Company Name</label>

                                    <input type="text"
                                        name='companyName'
                                        placeholder='Enter Company Name'
                                        value={newJob.companyName}
                                        onChange={handleInputChange}
                                        className={validationError && !newJob.companyName ? 'error-input' : ''}
                                        required />

                                </div>

                                <div className='form-group'>
                                    <label>Location</label>

                                    <input type="text"
                                        name='location'
                                        placeholder='e.g. Bangalore, India (or Remote)'
                                        value={newJob.location}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className='form-group'>
                                    <label>Job Requirements</label>

                                    <textarea name='jobRequirements'
                                        placeholder='Enter job requirements'
                                        value={newJob.jobRequirements}
                                        onChange={handleInputChange}
                                        rows={3}>
                                    </textarea>
                                </div>

                                <div className='form-group'>
                                    <label>Job Role Overview</label>

                                    <textarea name="jobRoleOverview"
                                        placeholder='Enter job role overview'
                                        value={newJob.jobRoleOverview}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className={validationError && !newJob.jobRoleOverview ? 'error-input' : ''}
                                        required>
                                    </textarea>
                                </div>

                                <div className='form-section-title'>Eligibility Criteria</div>

                                <div className='form-row'>
                                    <div className='form-group half-width'>

                                        <label>Degree</label>

                                        <select name="degree" value={newJob.degree}
                                            onChange={handleInputChange}>

                                            <option value="">Select degree</option>
                                            <option value="BCA">BCA</option>
                                            <option value="MCA">MCA</option>
                                            <option value="BSC Cs">BSC Cs</option>
                                            <option value="IT">IT</option>
                                        </select>
                                    </div>

                                    <div className='form-group half-width'>
                                        <label htmlFor="">Branch</label>

                                        <select name="branch" value={newJob.branch}
                                            onChange={handleInputChange}>

                                            <option value="">Select branch</option>
                                            <option value="Computer Science">Computer Science</option>
                                            <option value="Computer Applications">Computer Applications</option>
                                        </select>
                                    </div>
                                </div>

                                <div className='form-row'>
                                    <div className='form-group half-width'>
                                        <label htmlFor="">Min CGPA</label>

                                        <input
                                            type="text"
                                            name="minCgpa"
                                            placeholder="Enter minimum CGPA"
                                            value={newJob.minCgpa}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className='form-group half-width'>
                                        <label htmlFor="">Passing Year</label>

                                        <select name="passingYear" value={newJob.passingYear}
                                            onChange={handleInputChange}>

                                            <option value="">Select Passing Year</option>
                                            <option value="2024">2024</option>
                                            <option value="2025">2025</option>
                                            <option value="2026">2026</option>
                                        </select>
                                    </div>
                                </div>

                                <div className='form-row'>
                                    <div className='form-group half-width'>
                                        <label htmlFor="">Experience</label>

                                        <select name="experience" value={newJob.experience}
                                            onChange={handleInputChange}>

                                            <option value="">Select experience</option>
                                            <option value="Fresher">Fresher</option>
                                            <option value="1 Year">1 Year</option>
                                            <option value="2 Year+">2 Year+</option>
                                        </select>
                                    </div>

                                    <div className='form-group half-width'>
                                        <label htmlFor="">Deadline</label>
                                        <div className="custom-date-picker-container" ref={modalDatePickerRef} style={{ width: '100%' }}>
                                            <button
                                                type="button"
                                                className="date-picker-trigger"
                                                onClick={() => setIsModalDatePickerOpen(!isModalDatePickerOpen)}
                                                style={{ width: '100%', justifyContent: 'space-between' }}
                                            >
                                                {newJob.deadline ? formatDeadline(newJob.deadline) : 'Select Deadline...'}
                                                <Calendar size={14} />
                                            </button>

                                            {isModalDatePickerOpen && (
                                                <div className="custom-calendar-popup" style={{ left: 0, right: 'auto', width: '100%', minWidth: '250px' }}>
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
                                                        {/* Render empty cells for padding */}
                                                        {Array.from({ length: modalFirstDayIndex }).map((_, i) => (
                                                            <span key={`empty-${i}`} className="empty-day"></span>
                                                        ))}
                                                        {/* Render month days */}
                                                        {Array.from({ length: modalTotalDays }).map((_, i) => {
                                                            const day = i + 1;
                                                            const dateStr = `${modalCalDate.getFullYear()}-${String(modalCalDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                            const isSelected = newJob.deadline === dateStr;
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    key={day}
                                                                    className={`calendar-day-btn ${isSelected ? 'selected' : ''}`}
                                                                    onClick={() => {
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
                                    <button type='button'
                                        className='btn-cancel'
                                        onClick={() => setIsSidebarOpen(false)}>
                                        Cancel
                                    </button>

                                    <button type='button'
                                        className='btn-save-draft-form'
                                        onClick={handleSaveDraft}>
                                        Save Draft
                                    </button>

                                    <button type='submit' className='btn-post'>
                                        Post Job
                                    </button>

                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* 3. TOAST NOTIFICATION */}
                {showToast && (
                    <div className={`admin-toast-notification ${toastType}`}>
                        <span className="admin-toast-icon">
                            {toastType === 'success' ? '✓' : '⚠'}
                        </span>
                        <span className="admin-toast-text">{toastMessage}</span>
                    </div>
                )}

                {/* 4. PROFILE SETTINGS MODAL */}
                {isProfileModalOpen && (
                    <div className='modal-overlay' onClick={handleCloseProfileModal}>
                        <div className='add-job-modal profile-settings-modal' onClick={(e) => e.stopPropagation()}>                            {/* Modal Header */}
                            <div className='modal-header' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4>
                                    {profileTab === 'edit'
                                        ? isEditingProfile
                                            ? 'Edit Admin Profile'
                                            : 'Admin Profile Details'
                                        : 'Change Password'}
                                </h4>
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
                                    <button className='close-btn' onClick={handleCloseProfileModal}>
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Tab Contents */}
                            {profileTab === 'edit' ? (
                                isEditingProfile ? (
                                    <form className='modal-form' onSubmit={handleUpdateProfile}>
                                        <div className='form-group'>
                                            <label>Full Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={adminProfile.name}
                                                onChange={handleProfileChange}
                                                required
                                            />
                                        </div>
                                        <div className='form-group'>
                                            <label>Email Address</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={adminProfile.email}
                                                onChange={handleProfileChange}
                                                required
                                            />
                                        </div>
                                        <div className='form-group'>
                                            <label>Phone Number</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                value={adminProfile.phone}
                                                onChange={handleProfileChange}
                                            />
                                        </div>
                                        <div className='form-group'>
                                            <label>Role</label>
                                            <input
                                                type="text"
                                                value={adminProfile.role}
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
                                ) : (
                                    <div className='modal-form'>
                                        <div className='form-group'>
                                            <label>Full Name</label>
                                            <div className="profile-detail-value" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', color: '#0f172a', border: '1px solid #e2e8f0' }}>{adminProfile.name}</div>
                                        </div>
                                        <div className='form-group'>
                                            <label>Email Address</label>
                                            <div className="profile-detail-value" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', color: '#0f172a', border: '1px solid #e2e8f0' }}>{adminProfile.email}</div>
                                        </div>
                                        <div className='form-group'>
                                            <label>Phone Number</label>
                                            <div className="profile-detail-value" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', color: '#0f172a', border: '1px solid #e2e8f0' }}>{adminProfile.phone}</div>
                                        </div>
                                        <div className='form-group'>
                                            <label>Role</label>
                                            <div className="profile-detail-value" style={{ padding: '12px 16px', background: '#f1f5f9', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', color: '#64748b', border: '1px solid #e2e8f0' }}>{adminProfile.role}</div>
                                        </div>

                                        <div className='form-actions'>
                                            <button type='button' className='btn-cancel' onClick={handleCloseProfileModal} style={{ width: '100%', textAlign: 'center' }}>
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <form className='modal-form' onSubmit={handleUpdatePassword}>
                                    <div className='form-group'>
                                        <label>Current Password</label>
                                        <div className="password-input-wrapper">
                                            <input
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
                                        <label>New Password</label>
                                        <div className="password-input-wrapper">
                                            <input
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
                                        <label>Confirm New Password</label>
                                        <div className="password-input-wrapper">
                                            <input
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
                            )}
                        </div>
                    </div>
                )}

                {/* Notifications Sidebar Panel */}
                {isNotificationSidebarOpen && (
                    <div className="sd-notification-sidebar-overlay" onClick={() => setIsNotificationSidebarOpen(false)}>
                        <div className="sd-notification-sidebar" onClick={(e) => e.stopPropagation()}>
                            <div className="sidebar-header">
                                <div className="header-title-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Bell size={20} className="sidebar-bell-icon" style={{ color: '#2563eb' }} />
                                    <h4 style={{ margin: 0 }}>Notifications</h4>
                                </div>
                                <button className="btn-close-sidebar" onClick={() => setIsNotificationSidebarOpen(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="sidebar-body">
                                {notifications.length === 0 ? (
                                    <p className="no-notifications">No new notifications</p>
                                ) : (
                                    notifications.map((notif) => (
                                        <div key={notif.id} className="notification-item">
                                            <p>{notif.text}</p>
                                            <span className="notif-date">{notif.date}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div >
        </div >
    );
}


export default AdminDashboard;