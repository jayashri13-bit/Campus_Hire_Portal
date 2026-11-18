import api from "../api/axios";

export const registerStudent = (studentData) => {
    return api.post("/auth/register/student", studentData);
};

export const loginStudent = (loginData) => {
    return api.post("/auth/login", loginData);
};

export const loginAdmin = (adminData) => {
    return api.post("/auth/admin/login", adminData);
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

export const createJobPosting = (jobData) => {
    const token = localStorage.getItem("token");
    return api.post("/admin/job/add", jobData, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};


export const getDrafts = () => {
    const token =
        localStorage.getItem("token");
    return api.get("/admin/drafts", {
        headers: {
            Authorization: `Bearer ${token}`
        }
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

export const getDraftById = (id) => {
    const token = localStorage.getItem("token");
    return api.get(sanitizePath('/admin/draft/', id), {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};


export const updateDraft = (id, draftData) => {
    const token = localStorage.getItem("token");
    return api.put(sanitizePath('/admin/draft/', id), draftData, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const publishDraft = (id) => {
    const token = localStorage.getItem("token");
    return api.put(sanitizePath('/admin/draft/publish/', id), {}, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};



export const getAdminProfile = () => {
    const token = localStorage.getItem("token");
    return api.get("/admin/profile", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getStudentProfile = () => {
    const token = localStorage.getItem("token");
    return api.get("/student/profile", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const updateAdminProfile = (profileData) => {
    const token = localStorage.getItem("token");
    return api.put("/admin/profile", profileData, {
        headers: {
            Authorization: `Bearer ${token}`
        }
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
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const updateStudentProfile = (profileData) => {
    const token = localStorage.getItem("token");
    return api.put("/student/profile", profileData, {
        headers: {
            Authorization: `Bearer ${token}`
        }
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
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getStudentDashboardStats = () => {
    const token = localStorage.getItem("token");
    return api.get("/student/dashboard/stats", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getAdminStudentAnalyticsDashboard = () => {
    const token = localStorage.getItem("token");
    return api.get("/admin/student-analytics/dashboard", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getAdminRecentPosts = () => {
    const token = localStorage.getItem("token");
    return api.get("/admin/dashboard/recent-posts", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getAllPlacementDrives = () => {
    const token = localStorage.getItem("token");
    return api.get("/admin/placement-drive/all", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const addPlacementDrive = (driveData) => {
    const token = localStorage.getItem("token");
    return api.post("/admin/placement-drive/add", driveData, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getAllStudentsForDrive = () => {
    const token = localStorage.getItem("token");
    return api.get("/admin/placement-drive/specific-students", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const updatePlacementDrive = (id, driveData) => {
    const token = localStorage.getItem("token");
    return api.put(sanitizePath('/admin/placement-drive/update/', id), driveData, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const deletePlacementDrive = (id) => {
    const token = localStorage.getItem("token");
    return api.delete(sanitizePath('/admin/placement-drive/delete/', id), {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getAllTopPlacedStudents = async () => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const userStr = localStorage.getItem("user");
    let isAdmin = true;
    if (userStr) {
        try {
            const u = JSON.parse(userStr);
            const roleStr = String(u.role || u.userRole || u.roleName || u.type || '').toUpperCase();
            if (roleStr.includes('STUDENT') && !roleStr.includes('ADMIN') && !u.isAdmin && !(u.email && String(u.email).toLowerCase().includes('admin'))) {
                isAdmin = false;
            }
        } catch { }
    }

    if (isAdmin) {
        try {
            return await api.get("/admin/top-placed-student/all", { headers });
        } catch {
            return { data: [] };
        }
    }

    return Promise.resolve({ data: [] });
};

export const addTopPlacedStudent = (studentData) => {
    const token = localStorage.getItem("token");
    return api.post("/admin/top-placed-student/add", studentData, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const deleteTopPlacedStudent = (id) => {
    if (id === null || id === undefined || id === '') {
        return Promise.reject(new Error("Student ID is required for deletion."));
    }
    const token = localStorage.getItem("token");
    return api.delete(sanitizePath('/admin/top-placed-student/delete/', id), {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getAllQueries = () => {
    const token = localStorage.getItem("token");
    return api.get("/admin/query/all", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const replyToQuery = (id, replyText) => {
    const token = localStorage.getItem("token");
    return api.put(sanitizePath('/admin/query/', id, '/reply'), {
        reply: replyText,
        adminReply: replyText,
        response: replyText
    }, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const discardQuery = (id, discardReason) => {
    const token = localStorage.getItem("token");
    return api.put(sanitizePath('/admin/query/', id, '/discard'), {
        discardReason: discardReason || "Query discarded by Admin",
        status: "DISCARDED"
    }, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const publishPlacementStory = (storyData, photoFile) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    if (photoFile) {
        formData.append("photo", photoFile);
    }

    // Add query parameters for the story data
    const params = new URLSearchParams({
        studentName: String(storyData.studentName || ''),
        companyName: String(storyData.companyName || ''),
        jobRole: String(storyData.jobRole || ''),
        packageLpa: String(storyData.package || ''),
        successStory: String(storyData.storyText || '')
    });

    return api.post(`/admin/story/create?${params.toString()}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getAllPlacementStories = () => {
    const token = localStorage.getItem("token");
    return api.get("/admin/story/all", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const updatePlacementStory = (id, storyData, photoFile) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    if (photoFile) {
        formData.append("photo", photoFile);
    }

    const params = new URLSearchParams({
        studentName: String(storyData.studentName || ''),
        companyName: String(storyData.companyName || ''),
        jobRole: String(storyData.jobRole || ''),
        packageLpa: String(storyData.package || ''),
        successStory: String(storyData.storyText || '')
    });

    return api.put(sanitizePath('/admin/story/update/', id, '?' + params.toString()), formData, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const deletePlacementStory = (id) => {
    const token = localStorage.getItem("token");
    return api.delete(sanitizePath('/admin/story/delete/', id), {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const changePassword = (passwordData) => {
    const token = localStorage.getItem("token");
    return api.put("/auth/change-password", passwordData, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getLatestJobs = () => {
    const token = localStorage.getItem("token");
    return api.get("/student/jobs/latest", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getJobDetails = (id) => {
    const token = localStorage.getItem("token");
    return api.get(sanitizePath('/student/jobs/', id), {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const applyForJob = (jobId, formData) => {
    const token = localStorage.getItem("token");
    return api.post(sanitizePath('/student/jobs/', jobId, '/apply'), formData, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getStudentQueries = () => {
    const token = localStorage.getItem("token");
    return api.get("/student/query", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const submitStudentQuery = (queryData) => {
    const token = localStorage.getItem("token");
    return api.post("/student/query", queryData, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const resolveStudentQuery = (id) => {
    const token = localStorage.getItem("token");
    return api.put(sanitizePath('/student/query/resolve/', id), {}, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getTopSkillsAnalytics = () => {
    const token = localStorage.getItem("token");
    return api.get("/admin/student-analytics/top-skills", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getPlacementCgpaAnalytics = () => {
    const token = localStorage.getItem("token");
    return api.get("/admin/student-analytics/placement-cgpa", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getDepartmentAnalytics = () => {
    const token = localStorage.getItem("token");
    return api.get("/admin/student-analytics/department", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getStudentResumeMatch = () => {
    const token = localStorage.getItem("token");
    return api.get("/student/resume-match", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getAdminApplicantsMatching = () => {
    const token = localStorage.getItem("token");
    return api.get("/admin/applicants/matching", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getStudentPlacementStories = () => {
    const token = localStorage.getItem("token");
    return api.get("/student/story/all", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getStudentPlacementDrives = () => {
    const token = localStorage.getItem("token");
    return api.get("/student/placement-drive/all", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getStudentNotifications = () => {
    const token = localStorage.getItem("token");
    return api.get("/api/notification/student", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};



export const markAllStudentNotificationsAsRead = () => {
    const token = localStorage.getItem("token");
    return api.put("/api/notification/student/read-all", {}, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getStudentUnreadCount = () => {
    const token = localStorage.getItem("token");
    return api.get("/api/notification/student/unread-count", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getAdminNotifications = () => {
    const token = localStorage.getItem("token");
    return api.get("/api/notification/admin", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};



export const markAllAdminNotificationsAsRead = () => {
    const token = localStorage.getItem("token");
    return api.put("/api/notification/admin/read-all", {}, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getAdminUnreadCount = () => {
    const token = localStorage.getItem("token");
    return api.get("/api/notification/admin/unread-count", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getAdminDashboardStats = () => {
    const token = localStorage.getItem("token");
    return api.get("/api/admin/student-analytics/dashboard", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

// Official Student Placeview Controller APIs (GET /api/student/placeview/...)
export const getStudentPlaceviewDashboard = () => {
    const token = localStorage.getItem("token");
    return api.get("/student/placeview/dashboard", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const getStudentPlaceviewTopSkills = () => {
    const token = localStorage.getItem("token");
    return api.get("/student/placeview/top-skills", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const getStudentPlaceviewPlacementCgpa = () => {
    const token = localStorage.getItem("token");
    return api.get("/student/placeview/placement-cgpa", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const getStudentPlaceviewDepartment = () => {
    const token = localStorage.getItem("token");
    return api.get("/student/placeview/department", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

export const getStudentPlaceviewTopPlaced = () => {
    const token = localStorage.getItem("token");
    return api.get("/student/placeview/top-placed", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
};

// Public Landing Page Controller APIs
export const getLandingPublicStats = () => {
    return api.get("/public/landing/stats");
};

export const getLandingRecentActivity = () => {
    return api.get("/public/landing/recent-activity");
};


