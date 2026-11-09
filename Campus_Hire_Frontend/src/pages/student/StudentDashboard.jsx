import React, { useState, useEffect } from "react";
import {
    GraduationCap,
    Bell,
    User,
    CheckCircle2,
    Clock,
    XCircle,
    MapPin,
    Building,
    Briefcase,
    Calendar,
    ChevronLeft,
    ChevronRight,
    X,
    Lock,
    LogOut,
    Mail,
    Phone,
    BookOpen,
    Award,
    Globe,
    GitBranch,
    Eye,
    EyeOff,
    ExternalLink,
    Code,
    Link,
    FileText,
    Search,
    Upload,
    MessageSquare,
    Plus
} from "lucide-react";
import "./StudentDashboard.css";
import StudHub from "./StudHub";
import { getJobs, getStories } from "../../api/adminApi";
import {
    getStudentDashboard,
    applyForJob,
    updateStudentProfile,
    changeStudentPassword
} from "../../api/studentApi";

// Default fallback mock data for Placement Drives
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

// Default fallback mock data for Placement Stories
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

// Default fallback mock data for Student Dashboard Jobs
const defaultJobs = [
    {
        id: "google-backend",
        company: "Google",
        logo: "https://logo.clearbit.com/google.com",
        location: "Mumbai",
        role: "Backend Developer",
        deadline: "30-June-2026",
        logoLetter: "G",
        logoColor: "#ea4335",
        requirements: [
            "BE/B.Tech in Computer Science or related field",
            "Strong knowledge of Java, Spring Boot, REST APIs",
            "Experience with databases (MySQL/PostgreSQL)",
            "Good problem-solving skills",
            "CGPA: 7.0 and above"
        ],
        additionalInfo: "This is a full-time role based in Mumbai."
    },
    {
        id: "ibm-frontend",
        company: "IBM",
        logo: "https://logo.clearbit.com/ibm.com",
        location: "Pune",
        role: "Frontend Developer",
        deadline: "25-June-2026",
        logoLetter: "IBM",
        logoColor: "#0f62fe",
        requirements: [
            "BE/B.Tech/MCA in Computer Science or IT",
            "Proficiency in React, HTML, CSS, JavaScript",
            "Experience with responsive designs and modern CSS systems",
            "Familiarity with Git and version control frameworks",
            "CGPA: 6.5 and above"
        ],
        additionalInfo: "This is a full-time role based in Pune."
    },
    {
        id: "infosys-systems",
        company: "Infosys",
        logo: "https://logo.clearbit.com/infosys.com",
        location: "Bangalore",
        role: "Systems Engineer",
        deadline: "28-June-2026",
        logoLetter: "In",
        logoColor: "#007cc3",
        requirements: [
            "BE/B.Tech/M.Tech/MCA/M.Sc in CS or related fields",
            "Strong analytical and logical reasoning skills",
            "Basic understanding of programming concepts (Java, Python, or C++)",
            "Good communication skills",
            "No active backlogs"
        ],
        additionalInfo: "This is a full-time role based in Bangalore."
    },
    {
        id: "microsoft-cloud",
        company: "Microsoft",
        logo: "https://logo.clearbit.com/microsoft.com",
        location: "Hyderabad",
        role: "Cloud Solution Architect",
        deadline: "10-July-2026",
        logoLetter: "MS",
        logoColor: "#f25022",
        requirements: [
            "BE/B.Tech/MCA/M.Tech in CS/IT",
            "Deep understanding of Cloud Computing concepts (Azure/AWS)",
            "Hands-on coding experience in Python, C# or Go",
            "Excellent systems design principles"
        ],
        additionalInfo: "This is a full-time remote/hybrid role based in Hyderabad."
    },
    {
        id: "amazon-sde",
        company: "Amazon",
        logo: "https://logo.clearbit.com/amazon.com",
        location: "Chennai",
        role: "Software Dev Engineer (SDE I)",
        deadline: "15-July-2026",
        logoLetter: "A",
        logoColor: "#ff9900",
        requirements: [
            "Strong foundation in DS & Algo",
            "Proficiency in Java, C++ or Python",
            "Familiarity with distributed computing and databases"
        ],
        additionalInfo: "This is a full-time role based in Chennai."
    }
];

export default function
    StudentDashboard({ onNavigate }) {
    // Retrieve the logged-in student's details from localStorage
    const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
    const storedRole = localStorage.getItem("role");
    const isStudentUser = (loggedInUser.role === 'student' || storedRole === 'student') && loggedInUser.role !== 'admin';
    const studentName = isStudentUser && loggedInUser.fullName ? loggedInUser.fullName : "Student";

    const getInitials = (name) => {
        if (!name || name === "Student") return "ST";
        const parts = name.trim().split(" ");
        return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
    };

    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'studhub'

    // Sync states from localStorage (with mock fallbacks)
    const [drives, setDrives] = useState(() => {
        const stored = localStorage.getItem("placement_drives");
        return stored ? JSON.parse(stored) : initialDrives;
    });

    // Load live placement drives & stories posted by Admin from backend
    useEffect(() => {
        let isMounted = true;
        const loadStudentData = async () => {
            try {
                const liveJobs = await getJobs();
                if (isMounted && Array.isArray(liveJobs) && liveJobs.length > 0) {
                    const formattedJobs = liveJobs.map(job => ({
                        id: job.id,
                        company: job.company,
                        logo: job.logoUrl || `https://logo.clearbit.com/${(job.company || '').toLowerCase().replace(/\s+/g, '')}.com`,
                        location: job.location || "Remote",
                        role: job.title || "Software Engineer",
                        deadline: job.deadline || job.date || "30-June-2026",
                        logoLetter: (job.company || 'C').charAt(0).toUpperCase(),
                        logoColor: "#2563eb",
                        requirements: Array.isArray(job.requirements)
                            ? job.requirements
                            : (typeof job.requirements === 'string'
                                ? job.requirements.split(',').map(r => r.trim())
                                : [
                                    job.degree ? `${job.degree} in ${job.branch || 'CS/IT'}` : "BE/B.Tech in CS/IT",
                                    `CGPA: ${job.cgpa || '6.5'} and above`,
                                    "Good problem-solving skills"
                                ]),
                        additionalInfo: `Full-time placement opportunity at ${job.company}.`
                    }));

                    const liveIds = new Set(formattedJobs.map(j => String(j.id)));
                    setJobs([...formattedJobs, ...defaultJobs.filter(j => !liveIds.has(String(j.id)))]);

                    const formattedDrives = liveJobs.map(job => ({
                        id: job.id,
                        company: job.company,
                        logo: job.logoUrl || `https://logo.clearbit.com/${(job.company || '').toLowerCase().replace(/\s+/g, '')}.com`,
                        role: job.title,
                        location: job.location || 'Remote',
                        date: job.deadline || '2026-07-20',
                        time: '10:00 AM',
                        status: 'open',
                        venue: 'Placement Cell',
                        about: `${job.company} is hiring for ${job.title}. Requirements: ${job.requirements || 'Standard'}`,
                        targetStudent: 'All'
                    }));
                    setDrives(prev => {
                        const liveDriveIds = new Set(formattedDrives.map(d => d.id));
                        return [...formattedDrives, ...prev.filter(d => !liveDriveIds.has(d.id))];
                    });
                }

                const liveStories = await getStories();
                if (isMounted && Array.isArray(liveStories) && liveStories.length > 0) {
                    setStories(liveStories);
                }

                // Load live student overview (applied jobs, metrics, profile)
                const studentOverview = await getStudentDashboard(studentEmail);
                if (isMounted && studentOverview) {
                    if (studentOverview.profile && studentOverview.profile.fullName) {
                        setProfile(prev => ({ ...prev, ...studentOverview.profile }));
                    }
                    if (Array.isArray(studentOverview.appliedJobIds) && studentOverview.appliedJobIds.length > 0) {
                        setAppliedJobs(prev => [...new Set([...prev, ...studentOverview.appliedJobIds])]);
                    }
                    if (Array.isArray(studentOverview.notifications) && studentOverview.notifications.length > 0) {
                        setNotifications(studentOverview.notifications);
                    }
                    if (Array.isArray(studentOverview.metrics)) {
                        const sel = studentOverview.metrics.find(m => m.id === 'selected')?.value;
                        const pen = studentOverview.metrics.find(m => m.id === 'pending')?.value;
                        const rej = studentOverview.metrics.find(m => m.id === 'rejected')?.value;
                        setMetricCounts({
                            selected: sel ? parseInt(sel, 10) : 5,
                            pending: pen ? parseInt(pen, 10) : 3,
                            rejected: rej ? parseInt(rej, 10) : 6
                        });
                    }
                }
            } catch (err) {
                console.log("[StudentDashboard] Using cached drives:", err);
            }
        };

        loadStudentData();
        return () => { isMounted = false; };
    }, []);

    const isEventTomorrow = (dateStr) => {
        if (!dateStr) return false;
        try {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            
            const eventDate = new Date(dateStr);
            if (isNaN(eventDate.getTime())) return false;
            
            return eventDate.getDate() === tomorrow.getDate() &&
                   eventDate.getMonth() === tomorrow.getMonth() &&
                   eventDate.getFullYear() === tomorrow.getFullYear();
        } catch (e) {
            return false;
        }
    };

    // Filter drives targeted to this student
    const studentEmail = (loggedInUser.email || "").toLowerCase().trim();
    const studentFilteredDrives = drives.filter(drive => {
        const target = (drive.targetStudent || "").toLowerCase().trim();
        if (target === "" || target === "all") {
            return true;
        }
        return target === studentEmail;
    });

    // Find the next upcoming/open event sorted by date
    const activeDrives = studentFilteredDrives.filter(d => d.status === 'open' || d.status === 'upcoming');
    const getParsedDate = (dateStr) => {
        try {
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? new Date("9999-12-31") : d;
        } catch (e) {
            return new Date("9999-12-31");
        }
    };
    activeDrives.sort((a, b) => getParsedDate(a.date) - getParsedDate(b.date));
    const nextEvent = activeDrives[0];

    const [stories, setStories] = useState(() => {
        const stored = localStorage.getItem("placement_stories");
        return stored ? JSON.parse(stored) : initialStories;
    });

    // Event details toggle state
    const [showAllEventDetails, setShowAllEventDetails] = useState(false);

    const [queries, setQueries] = useState(() => {
        const stored = localStorage.getItem("student_queries");
        return stored ? JSON.parse(stored) : [];
    });

    // Write back student queries when updated locally
    useEffect(() => {
        localStorage.setItem("student_queries", JSON.stringify(queries));
    }, [queries]);

    // Student Query Form states
    const [querySubject, setQuerySubject] = useState("");
    const [queryMessage, setQueryMessage] = useState("");

    //Component state
    const [selectedJob, setSelectedJob] =
        useState(null);

    const [appliedJobs, setAppliedJobs] =
        useState([]);

    const [matchSearchQuery, setMatchSearchQuery] =
        useState("");

    // Student Query Tabs and Pagination states (independent pagination per tab)
    const [studentQueryFilter, setStudentQueryFilter] = useState('all'); // 'all' or 'resolved'
    const [allQueriesPage, setAllQueriesPage] = useState(1);
    const [resolvedQueriesPage, setResolvedQueriesPage] = useState(1);
    const STUDENT_QUERIES_PER_PAGE = 2;

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

    // Notification Mock Data
    const [notifications, setNotifications] = useState([
        { id: 1, text: "Google application deadline is tomorrow!", date: "Today" },
        { id: 2, text: "Your resume match score for IBM is 75%.", date: "Yesterday" },
        { id: 3, text: "New Job opening: Systems Engineer at Infosys.", date: "2 days ago" }
    ]);

    // Live Jobs and Metrics state
    const [jobs, setJobs] = useState(defaultJobs);
    const [metricCounts, setMetricCounts] = useState({ selected: 5, pending: 3, rejected: 6 });

    const getSkillColorClass = (skill) => {
        const s = skill.toLowerCase().trim();
        if (s.includes("react")) return "pill-react";
        if (s.includes("javascript") || s.includes("js")) return "pill-js";
        if (s.includes("node")) return "pill-node";
        if (s.includes("python")) return "pill-python";
        if (s.includes("css")) return "pill-css";
        return "pill-default";
    };

    // Gather profile information from localStorage, with clean default fallbacks
    const getInitialProfile = () => {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const storedRole = localStorage.getItem("role");
        const isStudent = (storedUser.role === 'student' || storedRole === 'student') && storedUser.role !== 'admin';
        return {
            fullName: isStudent ? (storedUser.fullName || "Student Name") : "Student Name",
            email: isStudent ? (storedUser.email || "student@portal.edu") : "student@portal.edu",
            phone: isStudent ? (storedUser.phone || "") : "",
            branch: isStudent ? (storedUser.branch || "") : "",
            passingYear: isStudent ? (storedUser.passingYear || "") : "",
            cgpa: isStudent ? (storedUser.cgpa || "") : "",
            skills: isStudent ? (storedUser.skills || "") : "",
            linkedinUrl: isStudent ? (storedUser.linkedinUrl || "") : "",
            githubUrl: isStudent ? (storedUser.githubUrl || "") : ""
        };
    };

    const [profile, setProfile] = useState(getInitialProfile());

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
    const handleEditProfileClick = () => {
        setTempProfile({ ...profile });
        setIsEditingProfile(true);
    };

    const handleSaveProfile = async () => {
        setProfile({ ...tempProfile });
        const updatedUser = {
            ...JSON.parse(localStorage.getItem("user") || "{}"),
            fullName: tempProfile.fullName,
            email: tempProfile.email,
            phone: tempProfile.phone,
            branch: tempProfile.branch,
            passingYear: tempProfile.passingYear,
            cgpa: tempProfile.cgpa,
            skills: tempProfile.skills,
            linkedinUrl: tempProfile.linkedinUrl,
            githubUrl: tempProfile.githubUrl
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        try {
            await updateStudentProfile(tempProfile);
        } catch (err) {
            console.log("Local student profile update:", err);
        }

        setIsEditingProfile(false);

        // Show Toast Notification
        setToastMessage("Profile updated successfully!");
        setToastType("success");
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
        }, 3000);
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
            await changeStudentPassword({
                email: loggedInUser.email || profile.email || 'student@college.edu',
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
                confirmPassword: passwordForm.confirmPassword
            });
        } catch (err) {
            console.log("Local password update:", err);
        }

        setToastMessage("Password updated successfully!");
        setToastType("success");
        setShowToast(true);
        setIsChangePasswordOpen(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setTimeout(() => setShowToast(false), 3000);
    };

    // Handles raising a student query
    const handleRaiseQuery = (e) => {
        e.preventDefault();
        if (!querySubject.trim() || !queryMessage.trim()) {
            setToastMessage("Please fill in both subject and description.");
            setToastType('error');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return;
        }

        const branchText = profile.branch || loggedInUser.branch || "B.Tech CSE";
        const newQuery = {
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

        const updatedQueries = [newQuery, ...queries];
        setQueries(updatedQueries);
        localStorage.setItem("student_queries", JSON.stringify(updatedQueries));

        // Reset form inputs
        setQuerySubject("");
        setQueryMessage("");

        // Trigger success notification
        setToastMessage("Query raised successfully! Admin will respond soon.");
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // Handles marking a query as resolved by student
    const handleMarkQueryResolved = (queryId) => {
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
        localStorage.setItem("student_queries", JSON.stringify(updatedQueries));

        setToastMessage("Query marked as resolved! Admin has been notified.");
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // Handles applying to a campus drive event
    const handleApplyDrive = (drive) => {
        setToastMessage(`Successfully applied for ${drive.role} at ${drive.company}!`);
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleViewEventDetails = (drive) => {
        setToastMessage(`Successfully registered for the ${drive.company} drive at ${drive.venue || 'Seminar Hall A'}.`);
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // Handles logout flow
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        onNavigate("login"); // Navigate back to public login view
    };


    // 1. Triggered when the user clicks the "Apply" button on any job card
    const handleApplyClick = (job) => {
        setSelectedJob(job);
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
        if (!resumeFileName) {
            setToastMessage("Please upload your resume PDF first!");
            setToastType('error');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return;
        }

        if (selectedJob) {
            try {
                await applyForJob({
                    jobId: selectedJob.id,
                    company: selectedJob.company,
                    role: selectedJob.role || selectedJob.title || "Applicant",
                    studentEmail: loggedInUser.email || profile.email || "student@college.edu",
                    studentName: studentName,
                    resumeFileName: resumeFileName
                });
            } catch (err) {
                console.log("Local job application sync:", err);
            }

            setAppliedJobs(prev => [...prev, selectedJob.id]);
            setMetricCounts(prev => ({ ...prev, pending: prev.pending + 1 }));
            setToastMessage(`Successfully applied for the ${selectedJob.role} role at ${selectedJob.company}!`);
            setToastType('success');
            setShowToast(true);
            setSelectedJob(null);
            setResumeFile(null);
            setResumeFileName("");
            setTimeout(() => {
                setShowToast(false);
            }, 3000);
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
            value: `${profileCompletion}%`,
            icon: <User className="metric-icon-blue" />,
            colorClass: "blue",
            progress: profileCompletion,
            progess: profileCompletion
        },
        {
            id: "selected",
            title: "Selected",
            value: String(metricCounts.selected),
            icon: <CheckCircle2 className="metric-icon-green" />,
            colorClass: "green",
            progress: Math.min(100, metricCounts.selected * 10),
            progess: Math.min(100, metricCounts.selected * 10)
        },
        {
            id: "pending",
            title: "Pending",
            value: String(metricCounts.pending),
            icon: <Clock className="metric-icon-orange" />,
            colorClass: "orange",
            progress: Math.min(100, metricCounts.pending * 10),
            progess: Math.min(100, metricCounts.pending * 10)
        },
        {
            id: "rejected",
            title: "Rejected",
            value: String(metricCounts.rejected),
            icon: <XCircle className="metric-icon-red" />,
            colorClass: "red",
            progress: Math.min(100, metricCounts.rejected * 10),
            progess: Math.min(100, metricCounts.rejected * 10)
        }
    ];


    // Helper function to render authentic corporate company logo SVGs and badges
    const getCompanyLogo = (companyName, size = 36) => {
        const lower = (companyName || '').toLowerCase().trim();

        if (lower.includes('google')) {
            return (
                <div className="company-logo-svg google-svg" style={{ width: size, height: size, minWidth: size, minHeight: size, borderRadius: '10px', background: '#ffffff', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', padding: '5px', flexShrink: 0, overflow: 'hidden' }}>
                    <svg viewBox="0 0 24 24" width="100%" height="100%">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                </div>
            );
        }

        if (lower.includes('ibm')) {
            return (
                <div className="company-logo-svg ibm-svg" style={{ width: size, height: size, minWidth: size, minHeight: size, borderRadius: '10px', background: '#0f62fe', border: '1.5px solid #0f62fe', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', padding: '3px', flexShrink: 0, overflow: 'hidden' }}>
                    <svg viewBox="0 0 60 30" width="90%" height="90%">
                        <text x="50%" y="70%" textAnchor="middle" fill="#ffffff" fontWeight="900" fontSize="24" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="-1px">IBM</text>
                    </svg>
                </div>
            );
        }

        if (lower.includes('microsoft')) {
            return (
                <div className="company-logo-svg microsoft-svg" style={{ width: size, height: size, minWidth: size, minHeight: size, borderRadius: '10px', background: '#ffffff', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', padding: '6px', flexShrink: 0, overflow: 'hidden' }}>
                    <svg viewBox="0 0 23 23" width="100%" height="100%">
                        <rect x="0" y="0" width="10.5" height="10.5" fill="#F25022" />
                        <rect x="11.5" y="0" width="10.5" height="10.5" fill="#7FBA00" />
                        <rect x="0" y="11.5" width="10.5" height="10.5" fill="#00A1F1" />
                        <rect x="11.5" y="11.5" width="10.5" height="10.5" fill="#FFB900" />
                    </svg>
                </div>
            );
        }

        if (lower.includes('infosys')) {
            return (
                <div className="company-logo-svg infosys-svg" style={{ width: size, height: size, minWidth: size, minHeight: size, borderRadius: '10px', background: '#ffffff', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', padding: '3px', flexShrink: 0, overflow: 'hidden' }}>
                    <svg viewBox="0 0 95 32" width="94%" height="94%">
                        <text x="50%" y="70%" textAnchor="middle" fill="#007cc3" fontWeight="900" fontSize="22" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letterSpacing="-0.5px">Infosys</text>
                    </svg>
                </div>
            );
        }

        if (lower.includes('amazon')) {
            return (
                <div className="company-logo-svg amazon-svg" style={{ width: size, height: size, minWidth: size, minHeight: size, borderRadius: '10px', background: '#232f3e', border: '1.5px solid #232f3e', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', padding: '5px', flexShrink: 0, overflow: 'hidden' }}>
                    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                </div>
            );
        }

        if (lower.includes('tcs')) {
            return (
                <div className="company-logo-svg tcs-svg" style={{ width: size, height: size, minWidth: size, minHeight: size, borderRadius: '10px', background: '#002664', border: '1.5px solid #002664', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', padding: '3px', flexShrink: 0, overflow: 'hidden' }}>
                    <svg viewBox="0 0 60 30" width="90%" height="90%">
                        <text x="50%" y="70%" textAnchor="middle" fill="#ffffff" fontWeight="900" fontSize="24" fontFamily="Arial, Helvetica, sans-serif">TCS</text>
                    </svg>
                </div>
            );
        }

        if (lower.includes('wipro')) {
            return (
                <div className="company-logo-svg wipro-svg" style={{ width: size, height: size, minWidth: size, minHeight: size, borderRadius: '10px', background: '#ffffff', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', padding: '3px', flexShrink: 0, overflow: 'hidden' }}>
                    <svg viewBox="0 0 85 30" width="92%" height="92%">
                        <text x="50%" y="70%" textAnchor="middle" fill="#0f172a" fontWeight="900" fontSize="20" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="0.5px">WIPRO</text>
                    </svg>
                </div>
            );
        }

        if (lower.includes('cognizant')) {
            return (
                <div className="company-logo-svg cognizant-svg" style={{ width: size, height: size, minWidth: size, minHeight: size, borderRadius: '10px', background: '#0033a0', border: '1.5px solid #0033a0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', padding: '3px', flexShrink: 0, overflow: 'hidden' }}>
                    <svg viewBox="0 0 40 40" width="85%" height="85%">
                        <text x="50%" y="72%" textAnchor="middle" fill="#ffffff" fontWeight="900" fontSize="28" fontFamily="Arial, Helvetica, sans-serif">C</text>
                    </svg>
                </div>
            );
        }

        return (
            <div className="company-logo-svg default-svg" style={{ width: size, height: size, minWidth: size, minHeight: size, borderRadius: '10px', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: size * 0.45, flexShrink: 0, overflow: 'hidden' }}>
                {companyName.charAt(0).toUpperCase()}
            </div>
        );
    };

    const resumeMatches = [
        {
            company: "Google",
            logo: "https://logo.clearbit.com/google.com",
            role: "Data Scientist",
            location: "Mumbai",
            deadline: "30-June-2026",
            score: 90,
            logoLetter: "G",
            logoColor: "#ea4335"
        },
        {
            company: "IBM",
            logo: "https://logo.clearbit.com/ibm.com",
            role: "Frontend Developer",
            location: "Pune",
            deadline: "25-June-2026",
            score: 75,
            logoLetter: "IBM",
            logoColor: "#0f62fe"
        },
        {
            company: "Infosys",
            logo: "https://logo.clearbit.com/infosys.com",
            role: "Systems Engineer",
            location: "Bangalore",
            deadline: "28-June-2026",
            score: 70,
            logoLetter: "I",
            logoColor: "#007cc3"
        },
        {
            company: "Microsoft",
            logo: "https://logo.clearbit.com/microsoft.com",
            role: "Cloud Solution Architect",
            location: "Hyderabad",
            deadline: "10-July-2026",
            score: 85,
            logoLetter: "MS",
            logoColor: "#f25022"
        },
        {
            company: "Amazon",
            logo: "https://logo.clearbit.com/amazon.com",
            role: "Software Dev Engineer",
            location: "Chennai",
            deadline: "15-July-2026",
            score: 82,
            logoLetter: "A",
            logoColor: "#ff9900"
        },
        {
            company: "TCS",
            logo: "https://logo.clearbit.com/tcs.com",
            role: "Assistant Engineer",
            location: "Mumbai",
            deadline: "05-July-2026",
            score: 65,
            logoLetter: "T",
            logoColor: "#1f4a9c"
        },
        {
            company: "Wipro",
            logo: "https://logo.clearbit.com/wipro.com",
            role: "Project Engineer",
            location: "Pune",
            deadline: "02-July-2026",
            score: 60,
            logoLetter: "W",
            logoColor: "#000000"
        }
    ];


    const getJobEligibility = (job) => {
        if (!job) return {};
        let degree = job.degree || "BE/B.Tech";
        let branch = job.branch || "Computer Science / IT";
        let minCgpa = String(job.cgpa || job.minCgpa || "6.5");
        let passingYear = String(job.year || job.passingYear || "2026");
        let experience = job.experience || "Fresher";
        let roleOverview = job.additionalInfo || job.additionalinfo || (typeof job.requirements === 'string' ? job.requirements : "This is a full-time role.");

        const comp = (job.company || "").toLowerCase();
        const jId = String(job.id || "").toLowerCase();

        if (comp.includes("google") || jId.includes("google")) {
            degree = job.degree || "BE/B.Tech";
            branch = job.branch || "Computer Science or related";
            minCgpa = String(job.cgpa || "7.0");
            passingYear = String(job.year || "2026");
            experience = job.experience || "Fresher";
        } else if (comp.includes("ibm") || jId.includes("ibm")) {
            degree = job.degree || "BE/B.Tech/MCA";
            branch = job.branch || "Computer Science or IT";
            minCgpa = String(job.cgpa || "6.5");
            passingYear = String(job.year || "2026");
            experience = job.experience || "Fresher";
        } else if (comp.includes("infosys") || jId.includes("infosys")) {
            degree = job.degree || "BE/B.Tech/M.Tech/MCA/M.Sc";
            branch = job.branch || "CS or related fields";
            minCgpa = String(job.cgpa || "6.0");
            passingYear = String(job.year || "2026");
            experience = job.experience || "Fresher";
        } else if (comp.includes("microsoft") || jId.includes("microsoft")) {
            degree = job.degree || "BE/B.Tech/MCA/M.Tech";
            branch = job.branch || "CS/IT";
            minCgpa = String(job.cgpa || "7.0");
            passingYear = String(job.year || "2026");
            experience = job.experience || "Fresher";
        } else if (comp.includes("amazon") || jId.includes("amazon")) {
            degree = job.degree || "BE/B.Tech";
            branch = job.branch || "CS/IT";
            minCgpa = String(job.cgpa || "7.5");
            passingYear = String(job.year || "2026");
            experience = job.experience || "Fresher";
        }

        return { degree, branch, minCgpa, passingYear, experience, roleOverview };
    };




    return (
        <div className="dashboard-container">

            {/*Header Section*/}
            <header className="dashboard-header">

                <div className="header-logo">
                    <GraduationCap className="logo-icon" />
                    <h1>Campus_Hire</h1>
                </div>

                <nav className="student-nav-tabs" style={{ margin: '0 auto' }}>
                    {[
                        { id: 'dashboard', label: 'Dashboard' },
                        { id: 'studhub', label: 'Stud Hub' }
                    ].map(item => (
                        <button
                            key={item.id}
                            className={`student-nav-tab ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <span>{item.label}</span>
                            {activeTab === item.id && <span className="student-active-line" />}
                        </button>
                    ))}
                </nav>

                <div className="header-actions">
                    <span className="role-badge">Student</span>

                    {/* Notification Dropdown */}
                    <div className="notification-bell-container">
                        <div className="notification-bell" onClick={() => {
                            setIsNotificationSidebarOpen(true);
                            setIsProfileDropdownOpen(false);
                        }}>
                            <Bell className="bell-icon" />
                            {notifications.length > 0 && (
                                <span className="bell-badge">{notifications.length}</span>
                            )}
                        </div>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="profile-container">
                        <div className="profile-avatar" onClick={() => {
                            setIsProfileDropdownOpen(!isProfileDropdownOpen);
                            setIsNotificationSidebarOpen(false);
                        }}>
                            <span className="avatar-placeholder">{getInitials(studentName)}</span>
                        </div>

                        {isProfileDropdownOpen && (
                            <div className="profile-dropdown">
                                <div className="dropdown-user-info">
                                    <h4>{studentName}</h4>
                                    <p>{profile.email}</p>
                                </div>
                                <hr className="dropdown-divider" />
                                <button className="dropdown-item" onClick={() => {
                                    setIsProfileModalOpen(true);
                                    setIsProfileDropdownOpen(false);
                                }}>
                                    <User size={16} />
                                    <span>View Profile</span>
                                </button>
                                <button className="dropdown-item" onClick={() => {
                                    setIsChangePasswordOpen(true);
                                    setIsProfileDropdownOpen(false);
                                }}>
                                    <Lock size={16} />
                                    <span>Change Password</span>
                                </button>
                                <hr className="dropdown-divider" />
                                <button className="dropdown-item logout-btn" onClick={handleLogout}>
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/*Welcome Banner*/}
            {activeTab === 'dashboard' && (
            <section className="welcome-section">
                <div className="welcome-content">
                    <h2>Welcome, {studentName} <span className="waving-hand">👋</span></h2>
                    <p>Here's what's happening with Campus_Hire today.</p>
                </div>
                <div className="welcome-date-badge">
                    <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
            </section>
            )}

            {/*Metric Boxes*/}
            {activeTab === 'dashboard' && (
            <section className="metrics-grid">
                {metrics.map((metric) => (
                    <div className="metric-card" key={metric.id}>
                        <div className="metric-header">
                            <div className={`metric-icon-wrapper ${metric.colorClass}`}>
                                {metric.icon}
                            </div>

                            <div className="metric-info">
                                <span className="metric-title"> {metric.title}</span>
                                <span className="metric-value">{metric.value}</span>
                            </div>
                        </div>

                        {/*Progress Bar Line Wrapper*/}
                        <div className="metric-progress-container">
                            <div className={`metric-progress-bar ${metric.colorClass}`}

                                style={{ width: `${metric.progess || metric.progress}%` }}>
                            </div>

                        </div>

                    </div>
                ))}

            </section>
            )}



            {/*MAin two column content*/}
            {activeTab === 'dashboard' && (
            <main className="dashboard-main-content">

                {/*LEft column : latest job opportunities */}
                <section className="dashboard-column jobs-column">
                    <div className="column-card-header">
                        <h3>Latest Job Opportunities</h3>
                    </div>

                    <div className="job-list">
                        {jobs
                            .slice((jobsPage - 1) * JOBS_PER_PAGE, jobsPage * JOBS_PER_PAGE)
                            .map((job) => {
                                const isApplied = appliedJobs.includes(job.id);
                                return (
                                    <div className="job-card" key={job.id}>
                                        <div className="job-card-header">
                                            {getCompanyLogo(job.company, 40)}
                                            <h4 className="company-name">{job.company}</h4>
                                            <button
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
                                    </div>
                                );
                            })}
                    </div>

                    {/* Jobs Pagination */}
                    <div className="sd-pagination">
                        <button
                            className="sd-page-btn"
                            disabled={jobsPage === 1}
                            onClick={() => setJobsPage(p => p - 1)}
                        >
                            ← Prev
                        </button>
                        <span className="sd-page-info">
                            {jobsPage} / {Math.ceil(jobs.length / JOBS_PER_PAGE)}
                        </span>
                        <button
                            className="sd-page-btn"
                            disabled={jobsPage >= Math.ceil(jobs.length / JOBS_PER_PAGE)}
                            onClick={() => setJobsPage(p => p + 1)}
                        >
                            Next →
                        </button>
                    </div>
                </section>

                {/*Right Column : Resume Match Status */}
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
                        {resumeMatches
                            .filter(item => item.company.toLowerCase().includes(matchSearchQuery.toLowerCase()))
                            .slice((matchPage - 1) * MATCHES_PER_PAGE, matchPage * MATCHES_PER_PAGE)
                            .map((item, index) => (
                                <div className="match-card" key={index}>
                                    {/* Top Row: Logo + Company Name on left, Score stack on right */}
                                    <div className="match-card-header">
                                        <div className="match-logo-details">
                                            {getCompanyLogo(item.company, 32)}
                                            <h4 className="match-company-name">{item.company}</h4>
                                        </div>

                                        <div className="match-score-container">
                                            <span className="match-score-text">{item.score}% Match</span>
                                            <div className="score-progress-track">
                                                <div className="score-progress-bar" style={{ width: `${item.score}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle Details Stacked below each other */}
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

                                </div>
                            ))}
                    </div>



                    {/* Match Pagination */}
                    {(() => {
                        const filtered = resumeMatches.filter(item => item.company.toLowerCase().includes(matchSearchQuery.toLowerCase()));
                        const totalPages = Math.ceil(filtered.length / MATCHES_PER_PAGE);

                        return totalPages > 1 ? (
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
                        ) : null;
                    })()}
                </section>

            </main>
            )}

            {/* Stud Hub page component */}
            {activeTab === 'studhub' && (
                <StudHub
                    studentName={studentName}
                    profile={profile}
                    nextEvent={nextEvent}
                    stories={stories}
                    setToastMessage={setToastMessage}
                    setToastType={setToastType}
                    setShowToast={setShowToast}
                />
            )}

            {/* Job Requirements Modal Popup Overlay */}
            {selectedJob && (() => {
                const eligibility = getJobEligibility(selectedJob);
                return (
                    <div className="modal-overlay" onClick={handleCancleApply}>
                        <div className="student-apply-modal" onClick={(e) => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="modal-header">
                                <h4>Job Details & Eligibility</h4>
                                <button className="close-btn" onClick={handleCancleApply}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Form Content */}
                            <div className="modal-form">
                                <div className="form-group">
                                    <label>Company Name</label>
                                    <input
                                        type="text"
                                        value={selectedJob.company}
                                        disabled
                                        className="read-only-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Location</label>
                                    <input
                                        type="text"
                                        value={selectedJob.location || "Remote"}
                                        disabled
                                        className="read-only-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Job Requirements</label>
                                    <div className="read-only-requirements-list">
                                        {selectedJob.requirements.map((req, idx) => (
                                            <div className="requirement-bullet-item" key={idx}>
                                                <span className="requirement-bullet-dot"></span>
                                                <span className="requirement-text">{req}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Job Role Overview</label>
                                    <textarea
                                        value={`${selectedJob.role}. ${eligibility.roleOverview}`}
                                        disabled
                                        rows={3}
                                        className="read-only-textarea"
                                    />
                                </div>

                                <div className="form-section-title">Eligibility Criteria</div>

                                <div className="form-row">
                                    <div className="form-group half-width">
                                        <label>Degree</label>
                                        <input
                                            type="text"
                                            value={eligibility.degree}
                                            disabled
                                            className="read-only-input"
                                        />
                                    </div>

                                    <div className="form-group half-width">
                                        <label>Branch</label>
                                        <input
                                            type="text"
                                            value={eligibility.branch}
                                            disabled
                                            className="read-only-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group half-width">
                                        <label>Min CGPA</label>
                                        <input
                                            type="text"
                                            value={eligibility.minCgpa}
                                            disabled
                                            className="read-only-input"
                                        />
                                    </div>

                                    <div className="form-group half-width">
                                        <label>Passing Year</label>
                                        <input
                                            type="text"
                                            value={eligibility.passingYear}
                                            disabled
                                            className="read-only-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group half-width">
                                        <label>Experience</label>
                                        <input
                                            type="text"
                                            value={eligibility.experience}
                                            disabled
                                            className="read-only-input"
                                        />
                                    </div>

                                    <div className="form-group half-width">
                                        <label>Deadline</label>
                                        <input
                                            type="text"
                                            value={selectedJob.deadline}
                                            disabled
                                            className="read-only-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-section-title">Upload Documents</div>

                                <div className="form-group full-width-resume">
                                    <label>Upload Resume (PDF only) <span className="required-star">*</span></label>
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
                                                    <button className="file-remove-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setResumeFileName(""); setResumeFile(null); }}>Remove</button>
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


            {/* View/Edit Profile Modal */}
            {isProfileModalOpen && (
                <div className="modal-overlay" onClick={() => {
                    setIsProfileModalOpen(false);
                    setIsEditingProfile(false);
                }}>
                    <div className="student-apply-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="modal-header">
                            <h4>{isEditingProfile ? "Edit Profile" : "Student Profile"}</h4>
                            <button className="close-btn" onClick={() => {
                                setIsProfileModalOpen(false);
                                setIsEditingProfile(false);
                            }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Form Content */}
                        <div className="modal-form" style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
                            <div className="form-row">
                                <div className="form-group half-width">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        value={isEditingProfile ? tempProfile.fullName : profile.fullName}
                                        disabled={!isEditingProfile}
                                        onChange={(e) => setTempProfile({ ...tempProfile, fullName: e.target.value })}
                                        className={isEditingProfile ? "editable-input" : "read-only-input"}
                                    />
                                </div>

                                <div className="form-group half-width">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        value={isEditingProfile ? tempProfile.email : profile.email}
                                        disabled={!isEditingProfile}
                                        onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                                        className={isEditingProfile ? "editable-input" : "read-only-input"}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group half-width">
                                    <label>Phone Number</label>
                                    <input
                                        type="text"
                                        value={isEditingProfile ? tempProfile.phone : profile.phone}
                                        disabled={!isEditingProfile}
                                        onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })}
                                        className={isEditingProfile ? "editable-input" : "read-only-input"}
                                        placeholder="Not Provided"
                                    />
                                </div>

                                <div className="form-group half-width">
                                    <label>Branch</label>
                                    <input
                                        type="text"
                                        value={isEditingProfile ? tempProfile.branch : profile.branch}
                                        disabled={!isEditingProfile}
                                        onChange={(e) => setTempProfile({ ...tempProfile, branch: e.target.value })}
                                        className={isEditingProfile ? "editable-input" : "read-only-input"}
                                        placeholder="Not Provided"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group half-width">
                                    <label>Passing Year</label>
                                    <input
                                        type="text"
                                        value={isEditingProfile ? tempProfile.passingYear : profile.passingYear}
                                        disabled={!isEditingProfile}
                                        onChange={(e) => setTempProfile({ ...tempProfile, passingYear: e.target.value })}
                                        className={isEditingProfile ? "editable-input" : "read-only-input"}
                                        placeholder="Not Provided"
                                    />
                                </div>

                                <div className="form-group half-width">
                                    <label>CGPA</label>
                                    <input
                                        type="text"
                                        value={isEditingProfile ? tempProfile.cgpa : profile.cgpa}
                                        disabled={!isEditingProfile}
                                        onChange={(e) => setTempProfile({ ...tempProfile, cgpa: e.target.value })}
                                        className={isEditingProfile ? "editable-input" : "read-only-input"}
                                        placeholder="Not Provided"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Skills</label>
                                <input
                                    type="text"
                                    value={isEditingProfile ? tempProfile.skills : profile.skills}
                                    disabled={!isEditingProfile}
                                    onChange={(e) => setTempProfile({ ...tempProfile, skills: e.target.value })}
                                    className={isEditingProfile ? "editable-input" : "read-only-input"}
                                    placeholder="Enter comma separated skills (e.g. React, CSS)"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group half-width">
                                    <label>LinkedIn URL</label>
                                    {isEditingProfile ? (
                                        <input
                                            type="text"
                                            value={tempProfile.linkedinUrl}
                                            onChange={(e) => setTempProfile({ ...tempProfile, linkedinUrl: e.target.value })}
                                            className="editable-input"
                                            placeholder="https://linkedin.com/in/username"
                                        />
                                    ) : (
                                        <div className="link-display-wrapper">
                                            <input
                                                type="text"
                                                value={profile.linkedinUrl || "Not Provided"}
                                                disabled
                                                className="read-only-input"
                                            />
                                            {profile.linkedinUrl && (
                                                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="link-visit-btn">
                                                    <ExternalLink size={14} /> Visit
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="form-group half-width">
                                    <label>GitHub URL</label>
                                    {isEditingProfile ? (
                                        <input
                                            type="text"
                                            value={tempProfile.githubUrl}
                                            onChange={(e) => setTempProfile({ ...tempProfile, githubUrl: e.target.value })}
                                            className="editable-input"
                                            placeholder="https://github.com/username"
                                        />
                                    ) : (
                                        <div className="link-display-wrapper">
                                            <input
                                                type="text"
                                                value={profile.githubUrl || "Not Provided"}
                                                disabled
                                                className="read-only-input"
                                            />
                                            {profile.githubUrl && (
                                                <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="link-visit-btn">
                                                    <ExternalLink size={14} /> Visit
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-actions" style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
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
                                        <button type="button" className="btn-cancel" onClick={() => {
                                            setIsProfileModalOpen(false);
                                            setIsEditingProfile(false);
                                        }}>
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
            )}

            {/* Change Password Modal Overlay */}
            {isChangePasswordOpen && (
                <div className="modal-overlay" onClick={() => {
                    setIsChangePasswordOpen(false);
                    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    setShowCurrentPassword(false);
                    setShowNewPassword(false);
                    setShowConfirmPassword(false);
                }}>
                    <div className="change-password-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h4>Change Password</h4>
                            <button className="btn-close-modal" onClick={() => {
                                setIsChangePasswordOpen(false);
                                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                setShowCurrentPassword(false);
                                setShowNewPassword(false);
                                setShowConfirmPassword(false);
                            }}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handlePasswordSubmit}>
                            <div className="modal-body">
                                <div className="form-group-custom">
                                    <label>Current Password</label>
                                    <div className="password-input-wrapper">
                                        <input
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
                                    <label>New Password</label>
                                    <div className="password-input-wrapper">
                                        <input
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
                                    <label>Confirm New Password</label>
                                    <div className="password-input-wrapper">
                                        <input
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
                                    onClick={() => {
                                        setIsChangePasswordOpen(false);
                                        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                        setShowCurrentPassword(false);
                                        setShowNewPassword(false);
                                        setShowConfirmPassword(false);
                                    }}
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

            {/* TOAST NOTIFICATION COMPONENT */}

            {showToast && (
                <div className={`sd-toast-notification ${toastType}`}>
                    <div className="sd-toast-icon">
                        {toastType === 'success' ? (
                            <CheckCircle2 size={18} />
                        ) : (
                            <XCircle size={18} />
                        )}
                    </div>
                    <span className="sd-toast-text">{toastMessage}</span>
                </div>
            )}
        </div>
    )


}
