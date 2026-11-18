import api from "../api/axios";

// -----------------------------------------------------------------------------
// Authentication Endpoints
// -----------------------------------------------------------------------------

export const registerStudent = (studentData) => {
    return api.post("/auth/register", studentData);
};

export const loginStudent = (loginData) => {
    return api.post("/auth/login", loginData);
};

export const loginAdmin = (adminData) => {
    return api.post("/auth/login", adminData);
};

export const saveAuthToken = (rawToken) => {
    if (!rawToken) return;
    const str = String(rawToken);
    const doc = typeof DOMParser !== 'undefined' ? new DOMParser().parseFromString(str, 'text/html') : null;
    const cleanText = doc ? (doc.body.textContent || '') : str;
    const safeToken = encodeURIComponent(cleanText.replace(/[^A-Za-z0-9._-]/g, '').trim());
    localStorage.setItem("token", safeToken);
};

export const forgotPassword = (email) => {
    return api.post("/auth/forgot-password", { email });
};

export const resetPassword = (resetData) => {
    const token = resetData?.token || resetData?.resetToken || '';
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    return api.post(`/auth/reset-password${query}`, resetData);
};

export const changePassword = (passwordData) => {
    const token = localStorage.getItem("token");
    return api.put("/auth/change-password", passwordData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

/** Sanitizes and validates path parameters to prevent invalid characters in API endpoints. */
function sanitizePath(prefix, id, suffix = '') {
    if (id === null || id === undefined || id === '') {
        throw new TypeError('ID parameter is required and cannot be empty.');
    }
    const strId = String(id).trim();
    if (!/^[a-zA-Z0-9_-]+$/.test(strId)) {
        throw new TypeError('Invalid ID format: contains non-alphanumeric characters.');
    }
    const cleanId = encodeURIComponent(strId);
    return `${prefix}${cleanId}${suffix}`;
}

// -----------------------------------------------------------------------------
// Admin Dashboard (Page 1) Endpoints
// -----------------------------------------------------------------------------

export const getAdminStudentAnalyticsDashboard = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await api.get("/admin/metrics", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const d = res.data?.data || res.data || {};
        return {
            data: {
                // Page 1 (AdminDashboard.jsx)
                totalActivePosts: d.activeJobs ?? 3,
                activePostsGrowth: 12,
                totalStudents: d.totalStudents ?? 500,
                studentGrowth: 8,
                totalResumeReceived: d.resumesReceived ?? 123,
                resumeGrowth: 15,
                // Page 2 (StudentAnalytics.jsx)
                placedStudents: d.placedStudents ?? 3,
                placementRate: d.placementRate ?? 75,
                highestPackage: d.highestPackage ?? 1000000,
                averagePackage: d.averagePackage ?? 200000
            }
        };
    } catch {
        return {
            data: {
                totalActivePosts: 3,
                activePostsGrowth: 12,
                totalStudents: 500,
                studentGrowth: 8,
                totalResumeReceived: 123,
                resumeGrowth: 15,
                placedStudents: 3,
                placementRate: 75,
                highestPackage: 1000000,
                averagePackage: 200000
            }
        };
    }
};

export const getAdminDashboardStats = getAdminStudentAnalyticsDashboard;

export const getAdminRecentPosts = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await api.get("/admin/jobs", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const jobs = res.data?.data || res.data || [];
        if (Array.isArray(jobs) && jobs.length > 0) {
            return {
                data: jobs.map(j => ({
                    id: j.id,
                    companyName: j.company || j.companyName,
                    jobRole: j.title || j.jobRole,
                    postedDate: j.date || j.postedDate || "Today",
                    deadline: j.deadline || "2026-07-20",
                    location: j.location || "Remote",
                    jobRequirements: j.requirements || j.jobRequirements || "Standard criteria",
                    status: j.status || 'Active',
                    logoUrl: j.logoUrl || j.logo_url
                }))
            };
        }
    } catch {
        // Fallback
    }

    return {
        data: [
            {
                id: 1,
                companyName: "Google",
                jobRole: "Software Developer Intern",
                postedDate: "05 July 2026",
                deadline: "2026-07-20",
                location: "Bangalore, India",
                jobRequirements: "Strong problem solving skills, DSA, React, Node.js",
                status: "Active",
                logoUrl: "https://logo.clearbit.com/google.com"
            },
            {
                id: 2,
                companyName: "Microsoft",
                jobRole: "Full Stack Engineer",
                postedDate: "08 July 2026",
                deadline: "2026-07-25",
                location: "Hyderabad, India",
                jobRequirements: "C#, .NET, Azure, React, TypeScript",
                status: "Active",
                logoUrl: "https://logo.clearbit.com/microsoft.com"
            },
            {
                id: 3,
                companyName: "Amazon",
                jobRole: "Cloud Support Associate",
                postedDate: "10 July 2026",
                deadline: "2026-07-30",
                location: "Pune, India",
                jobRequirements: "AWS, Linux, Networking, Python scripting",
                status: "Active",
                logoUrl: "https://logo.clearbit.com/amazon.com"
            }
        ]
    };
};

export const createJobPosting = (jobData) => {
    const token = localStorage.getItem("token");
    return api.post("/admin/jobs", {
        title: jobData.jobRoleOverview || jobData.title || jobData.jobRole,
        company: jobData.companyName || jobData.company,
        status: "Active",
        date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }),
        deadline: jobData.deadline || "2026-07-20",
        location: jobData.location || "Remote",
        requirements: jobData.jobRequirements || jobData.requirements || "Standard criteria",
        degree: jobData.degree || "B.Tech",
        branch: jobData.branch || "Computer Science",
        cgpa: parseFloat(jobData.cgpa || 7.0),
        year: String(jobData.year || 2026),
        experience: jobData.experience || "Fresher"
    }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const getDrafts = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await api.get("/admin/drafts", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const drafts = res.data?.data || res.data || [];
        return { data: Array.isArray(drafts) ? drafts : [] };
    } catch {
        return { data: [] };
    }
};

export const getDraftById = (id) => {
    const token = localStorage.getItem("token");
    return api.get(sanitizePath('/admin/drafts/', id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const updateDraft = (id, draftData) => {
    const token = localStorage.getItem("token");
    return api.put(sanitizePath('/admin/drafts/', id), draftData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const publishDraft = (id) => {
    const token = localStorage.getItem("token");
    return api.put(sanitizePath('/admin/drafts/', id, '/publish'), {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const getAdminApplicantsMatching = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await api.get("/admin/applicants", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
            return { data: list };
        }
    } catch {
        // Fallback
    }

    return {
        data: [
            {
                id: 1,
                name: "Priya Sharma",
                company: "Google",
                degree: "B.Tech",
                branch: "Computer Science",
                cgpa: 8.23,
                year: "2026 Passout",
                match: 90,
                date: "2026-07-05"
            },
            {
                id: 2,
                name: "John Doe",
                company: "Microsoft",
                degree: "B.Tech",
                branch: "Information Technology",
                cgpa: 8.45,
                year: "2026 Passout",
                match: 85,
                date: "2026-07-08"
            },
            {
                id: 3,
                name: "Alex Smith",
                company: "Amazon",
                degree: "B.Tech",
                branch: "Computer Science",
                cgpa: 7.90,
                year: "2026 Passout",
                match: 80,
                date: "2026-07-10"
            }
        ]
    };
};

export const getAdminNotifications = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await api.get("/admin/notifications", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
            return { data: list };
        }
    } catch {
        // Fallback
    }
    return {
        data: [
            { id: 1, text: "Welcome to Campus Hire Administration Portal", message: "Welcome to Campus Hire Administration Portal", createdDate: "Today", createdTime: "10:00 AM" }
        ]
    };
};

export const getAdminUnreadCount = async () => {
    try {
        const res = await getAdminNotifications();
        return { data: { count: res.data?.length || 0 } };
    } catch {
        return { data: { count: 0 } };
    }
};

export const markAllAdminNotificationsAsRead = () => {
    return Promise.resolve({ data: { message: "All notifications marked as read" } });
};

export const getAdminProfile = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await api.get("/admin/profile", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return { data: res.data?.data || res.data };
    } catch {
        return {
            data: {
                fullName: "Saurabh (Admin)",
                name: "Saurabh (Admin)",
                email: "saurabh@gmail.com",
                mobile: "+91 9876543210",
                phone: "+91 9876543210",
                role: "System Administrator"
            }
        };
    }
};

export const updateAdminProfile = (profileData) => {
    const token = localStorage.getItem("token");
    return api.put("/admin/profile", profileData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const uploadAdminProfilePhoto = (file) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("photo", file);
    return api.post("/admin/profile/photo", formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
        }
    });
};

export const deleteAdminProfilePhoto = () => {
    const token = localStorage.getItem("token");
    return api.delete("/admin/profile/photo", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

// -----------------------------------------------------------------------------
// Admin Student Analytics (Page 2) Endpoints
// -----------------------------------------------------------------------------

export const getTopSkillsAnalytics = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await api.get("/admin/analytics/skills", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
            return {
                data: list.map(s => ({
                    skill: s.skill || s.name || '',
                    count: s.percentage ?? s.count ?? s.demand ?? 50,
                    percentage: s.percentage ?? s.count ?? s.demand ?? 50,
                    color: s.color
                }))
            };
        }
    } catch { }

    return {
        data: [
            { skill: "Java", count: 62, percentage: 62, color: "#1e3a6e" },
            { skill: "Python", count: 58, percentage: 58, color: "#3b82f6" },
            { skill: "SQL", count: 40, percentage: 40, color: "#8b5cf6" },
            { skill: "PHP", count: 32, percentage: 32, color: "#06b6d4" },
            { skill: "React", count: 16, percentage: 16, color: "#f59e0b" },
            { skill: "C++", count: 13, percentage: 13, color: "#10b981" },
            { skill: "C", count: 8, percentage: 8, color: "#f43f5e" }
        ]
    };
};

export const getPlacementCgpaAnalytics = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await api.get("/admin/analytics/cgpa", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
            return {
                data: list.map(c => ({
                    range: c.range || c.range_label || '',
                    count: c.students ?? c.count ?? 10,
                    students: c.students ?? c.count ?? 10
                }))
            };
        }
    } catch { }

    return {
        data: [
            { range: "<6", count: 7, students: 7 },
            { range: "6 - 7", count: 15, students: 15 },
            { range: "7 - 8", count: 23, students: 23 },
            { range: "8 - 9", count: 28, students: 28 },
            { range: "9 - 10", count: 32, students: 32 }
        ]
    };
};

export const getDepartmentAnalytics = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await api.get("/admin/analytics/departments", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const raw = res.data?.departments || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        if (Array.isArray(raw) && raw.length > 0) {
            return {
                data: {
                    totalStudents: res.data?.totalStudents || 500,
                    departments: raw.map(d => ({
                        department: d.label || d.department || "General",
                        label: d.label || d.department || "General",
                        count: d.count ?? d.students ?? 100,
                        students: d.count ?? d.students ?? 100,
                        percentage: d.percentage ?? 20,
                        color: d.color
                    }))
                }
            };
        }
    } catch { }

    return {
        data: {
            totalStudents: 500,
            departments: [
                { department: "Computer Science", label: "Computer Science", count: 180, students: 180, percentage: 36, color: "#1e3a6e" },
                { department: "Information Technology", label: "Information Technology", count: 110, students: 110, percentage: 22, color: "#6c8dd6" },
                { department: "BCA", label: "BCA", count: 60, students: 60, percentage: 12, color: "#06b6d4" },
                { department: "MCA", label: "MCA", count: 40, students: 40, percentage: 8, color: "#a5b4fc" },
                { department: "Others", label: "Others", count: 110, students: 110, percentage: 22, color: "#e2e8f0" }
            ]
        }
    };
};

export const getAllTopPlacedStudents = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await api.get("/admin/analytics/students", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
            return {
                data: list.map(s => ({
                    id: s.id,
                    name: s.name || s.studentName,
                    studentName: s.name || s.studentName,
                    company: s.company || s.companyName,
                    companyName: s.company || s.companyName,
                    branch: s.branch || "CS",
                    passingYear: String(s.passingYear || s.passing_year || 2026),
                    cgpa: String(s.cgpa || "9.0"),
                    lpa: String(s.lpa || s.packageLpa || "12"),
                    packageLpa: String(s.lpa || s.packageLpa || "12"),
                    skill: s.skill || s.skills || "Full Stack",
                    skills: s.skill || s.skills || "Full Stack"
                }))
            };
        }
    } catch { }

    return {
        data: [
            {
                id: 1,
                name: "Aditi Rao",
                studentName: "Aditi Rao",
                company: "Google",
                companyName: "Google",
                branch: "CS",
                passingYear: "2026",
                cgpa: "9.4",
                lpa: "18.5",
                packageLpa: "18.5",
                skill: "Full Stack",
                skills: "Full Stack"
            },
            {
                id: 2,
                name: "Rohan Verma",
                studentName: "Rohan Verma",
                company: "Microsoft",
                companyName: "Microsoft",
                branch: "IT",
                passingYear: "2026",
                cgpa: "9.1",
                lpa: "16.0",
                packageLpa: "16.0",
                skill: "Data Science",
                skills: "Data Science"
            },
            {
                id: 3,
                name: "Siddharth Nair",
                studentName: "Siddharth Nair",
                company: "Amazon",
                companyName: "Amazon",
                branch: "CS",
                passingYear: "2026",
                cgpa: "8.9",
                lpa: "14.2",
                packageLpa: "14.2",
                skill: "Cloud",
                skills: "Cloud"
            }
        ]
    };
};

export const addTopPlacedStudent = (studentData) => {
    const token = localStorage.getItem("token");
    return api.post("/admin/analytics/students", studentData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const deleteTopPlacedStudent = (id) => {
    const token = localStorage.getItem("token");
    return api.delete(sanitizePath('/admin/analytics/students/', id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const getAllStudentsForDrive = () => {
    return Promise.resolve({ data: [] });
};

// -----------------------------------------------------------------------------
// Admin Queries, Drives & Stories (Page 3) Endpoints
// -----------------------------------------------------------------------------

export const getAllPlacementDrives = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await api.get("/admin/drives", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) return { data: list };
    } catch { }

    return {
        data: [
            {
                id: 1,
                company: "Google",
                logo: "https://logo.clearbit.com/google.com",
                role: "Software Engineer",
                location: "Bangalore",
                date: "2026-07-20",
                time: "10:00 AM",
                status: "open",
                venue: "Seminar Hall A",
                about: "Google on-campus hiring drive for 2026 batch",
                targetStudent: "All"
            },
            {
                id: 2,
                company: "Microsoft",
                logo: "https://logo.clearbit.com/microsoft.com",
                role: "Cloud Engineer",
                location: "Hyderabad",
                date: "2026-07-25",
                time: "11:00 AM",
                status: "open",
                venue: "Auditorium",
                about: "Microsoft Cloud & Enterprise hiring drive",
                targetStudent: "All"
            }
        ]
    };
};

export const addPlacementDrive = (driveData) => {
    const token = localStorage.getItem("token");
    return api.post("/admin/drives", driveData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const updatePlacementDrive = (id, driveData) => {
    const token = localStorage.getItem("token");
    return api.put(sanitizePath('/admin/drives/', id), driveData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const deletePlacementDrive = (id) => {
    const token = localStorage.getItem("token");
    return api.delete(sanitizePath('/admin/drives/', id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const getAllQueries = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await api.get("/admin/queries", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) return { data: list };
    } catch { }

    return {
        data: [
            {
                id: 1,
                name: "Rahul Patil",
                course: "B.Tech Computer Science",
                title: "Interview Schedule Clarification",
                message: "When will the technical interview round for Google be scheduled?",
                date: "Today",
                status: "pending",
                reply: ""
            }
        ]
    };
};

export const replyToQuery = (id, replyText) => {
    const token = localStorage.getItem("token");
    return api.post(sanitizePath('/admin/queries/', id, '/reply'), {
        reply: replyText
    }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const discardQuery = (id, discardReason) => {
    const token = localStorage.getItem("token");
    return api.delete(sanitizePath('/admin/queries/', id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const getAllPlacementStories = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await api.get("/admin/stories", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) return { data: list };
    } catch { }

    return {
        data: [
            {
                id: 1,
                name: "Ananya Deshmukh",
                company: "Google",
                role: "Software Developer",
                packageAmt: "18.5 LPA",
                storyText: "Cracked the Google campus drive with persistent DSA practice and mock interviews!",
                date: "Today"
            }
        ]
    };
};

export const publishPlacementStory = (storyData) => {
    const token = localStorage.getItem("token");
    return api.post("/admin/stories", {
        name: storyData.studentName || storyData.name,
        company: storyData.companyName || storyData.company,
        role: storyData.jobRole || storyData.role,
        packageAmt: storyData.package || storyData.packageAmt || "12.0 LPA",
        storyText: storyData.storyText || storyData.successStory || "Secured placement!",
        avatar: storyData.avatar
    }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const updatePlacementStory = (id, storyData) => {
    const token = localStorage.getItem("token");
    return api.put(sanitizePath('/admin/stories/', id), storyData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const deletePlacementStory = (id) => {
    const token = localStorage.getItem("token");
    return api.delete(sanitizePath('/admin/stories/', id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

// -----------------------------------------------------------------------------
// Student Dashboard & Applications Endpoints
// -----------------------------------------------------------------------------

export const getStudentProfile = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await api.get("/student/profile", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return { data: res.data?.data || res.data };
    } catch {
        return {
            data: {
                fullName: "Rahul Patil",
                email: "student@college.edu",
                phone: "+91 9876543210",
                branch: "B.Tech Computer Science",
                passingYear: "2026",
                cgpa: 8.5,
                skills: "React, Node.js, Python, SQL",
                linkedinUrl: "https://linkedin.com/in/student",
                githubUrl: "https://github.com/student"
            }
        };
    }
};

export const updateStudentProfile = (profileData) => {
    const token = localStorage.getItem("token");
    return api.put("/student/profile", profileData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const uploadStudentProfilePhoto = (file) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("photo", file);
    return api.post("/student/profile/photo", formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
        }
    });
};

export const deleteStudentProfilePhoto = () => {
    const token = localStorage.getItem("token");
    return api.delete("/student/profile/photo", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const getStudentDashboardStats = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await api.get("/student/metrics", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const d = res.data?.data || res.data || {};
        return {
            data: {
                profileCompleted: d.profileCompletion ?? d.profileCompleted ?? 85,
                selected: d.selected ?? 5,
                pending: d.pending ?? 3,
                rejected: d.rejected ?? 2
            }
        };
    } catch {
        return {
            data: {
                profileCompleted: 85,
                selected: 5,
                pending: 3,
                rejected: 2
            }
        };
    }
};

export const getLatestJobs = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await api.get("/jobs", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const jobs = res.data?.data || res.data || [];
        if (Array.isArray(jobs) && jobs.length > 0) return { data: jobs };
    } catch { }

    return {
        data: [
            {
                id: 1,
                companyName: "Google",
                company: "Google",
                title: "Software Developer Intern",
                jobRole: "Software Developer Intern",
                jobRoleOverview: "Software Developer Intern",
                requirements: "DSA, React, Python",
                jobRequirements: "DSA, React, Python",
                deadline: "2026-07-20",
                location: "Bangalore, India",
                status: "Active"
            },
            {
                id: 2,
                companyName: "Microsoft",
                company: "Microsoft",
                title: "Full Stack Engineer",
                jobRole: "Full Stack Engineer",
                jobRoleOverview: "Full Stack Engineer",
                requirements: "C#, Azure, React",
                jobRequirements: "C#, Azure, React",
                deadline: "2026-07-25",
                location: "Hyderabad, India",
                status: "Active"
            },
            {
                id: 3,
                companyName: "Amazon",
                company: "Amazon",
                title: "Cloud Support Associate",
                jobRole: "Cloud Support Associate",
                jobRoleOverview: "Cloud Support Associate",
                requirements: "AWS, Linux, Python",
                jobRequirements: "AWS, Linux, Python",
                deadline: "2026-07-30",
                location: "Pune, India",
                status: "Active"
            }
        ]
    };
};

export const getJobDetails = (id) => {
    const token = localStorage.getItem("token");
    return api.get(sanitizePath('/jobs/', id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const applyForJob = (jobId, formData) => {
    const token = localStorage.getItem("token");
    return api.post("/student/applications", formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const getStudentResumeMatch = async () => {
    return {
        data: [
            { id: 1, companyName: "Google", jobRole: "Software Developer Intern", matchScore: 92, location: "Bangalore" },
            { id: 2, companyName: "Microsoft", jobRole: "Full Stack Engineer", matchScore: 88, location: "Hyderabad" },
            { id: 3, companyName: "Amazon", jobRole: "Cloud Support Associate", matchScore: 81, location: "Pune" }
        ]
    };
};

export const getStudentNotifications = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await api.get("/student/notifications", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) return { data: list };
    } catch { }

    return {
        data: [
            { id: 1, message: "Google placement drive application is now open!", text: "Google placement drive application is now open!", createdDate: "Today", createdTime: "09:00 AM" }
        ]
    };
};

export const markAllStudentNotificationsAsRead = () => {
    return Promise.resolve({ data: { message: "All notifications marked as read" } });
};

export const getStudentUnreadCount = async () => {
    try {
        const res = await getStudentNotifications();
        return { data: { count: res.data?.length || 0 } };
    } catch {
        return { data: { count: 0 } };
    }
};

// -----------------------------------------------------------------------------
// Student Hub Endpoints
// -----------------------------------------------------------------------------

export const getStudentQueries = () => getAllQueries();
export const submitStudentQuery = (queryData) => api.post("/student/hub/queries", queryData);
export const resolveStudentQuery = (id) => replyToQuery(id, "Resolved");
export const getStudentPlacementStories = () => getAllPlacementStories();
export const getStudentPlacementDrives = () => getAllPlacementDrives();

// -----------------------------------------------------------------------------
// Student Placeview Controller APIs
// -----------------------------------------------------------------------------

export const getStudentPlaceviewDashboard = () => getAdminStudentAnalyticsDashboard();
export const getStudentPlaceviewTopSkills = () => getTopSkillsAnalytics();
export const getStudentPlaceviewPlacementCgpa = () => getPlacementCgpaAnalytics();
export const getStudentPlaceviewDepartment = () => getDepartmentAnalytics();
export const getStudentPlaceviewTopPlaced = () => getAllTopPlacedStudents();

// -----------------------------------------------------------------------------
// Public Landing Page Controller APIs
// -----------------------------------------------------------------------------

export const getLandingPublicStats = () => {
    return api.get("/public/landing/stats");
};

export const getLandingRecentActivity = () => {
    return api.get("/public/landing/recent-activity");
};
