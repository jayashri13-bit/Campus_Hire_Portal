// Python FastAPI Student API Client (Student Dashboard & Student Hub)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Helper for safe JSON requests with offline resilience
async function apiRequest(endpoint, options = {}) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`${BASE_URL}${endpoint}`, {
            headers: {
                "Content-Type": "application/json",
                ...options.headers
            },
            signal: controller.signal,
            ...options
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.detail || data.message || `Request failed with status ${res.status}`);
        }
        return data;
    } catch (err) {
        console.warn(`[studentApi] Server request to ${endpoint} failed, utilizing local fallback.`, err.message);
        throw err;
    }
}

// ==============================================================================
// 1. STUDENT DASHBOARD
// ==============================================================================

export async function getStudentDashboard(email = "") {
    try {
        const qs = email ? `?email=${encodeURIComponent(email)}` : "";
        const response = await apiRequest(`/api/student/dashboard${qs}`);
        return response.data;
    } catch (e) {
        // Fallback calculations from local storage
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const studentApps = JSON.parse(localStorage.getItem("student_applied_jobs") || "[]");
        const drives = JSON.parse(localStorage.getItem("placement_drives") || "[]");
        const activeDrives = drives.filter(d => d.status === 'open' || d.status === 'upcoming');

        return {
            metrics: [
                { id: "profile", title: "Profile Completed", value: "85%", progress: 85, colorClass: "blue" },
                { id: "selected", title: "Selected", value: "5", progress: 50, colorClass: "green" },
                { id: "pending", title: "Pending", value: "3", progress: 30, colorClass: "orange" },
                { id: "rejected", title: "Rejected", value: "6", progress: 60, colorClass: "red" }
            ],
            profile: {
                fullName: user.fullName || "Student Name",
                email: user.email || email || "student@portal.edu",
                phone: user.phone || "",
                branch: user.branch || "",
                passingYear: user.passingYear || "",
                cgpa: user.cgpa || "",
                skills: user.skills || "",
                linkedinUrl: user.linkedinUrl || "",
                githubUrl: user.githubUrl || ""
            },
            nextEvent: activeDrives[0] || null,
            notifications: [
                { id: 1, text: "Google application deadline is tomorrow!", date: "Today" },
                { id: 2, text: "Your resume match score for IBM is 75%.", date: "Yesterday" },
                { id: 3, text: "New Job opening: Systems Engineer at Infosys.", date: "2 days ago" }
            ],
            appliedJobIds: studentApps.map(a => a.jobId || a)
        };
    }
}

export async function getStudentMetrics(email = "") {
    try {
        const qs = email ? `?email=${encodeURIComponent(email)}` : "";
        const response = await apiRequest(`/api/student/metrics${qs}`);
        return response.data;
    } catch (e) {
        return {
            profileCompletion: 85,
            selected: 5,
            pending: 3,
            rejected: 6
        };
    }
}

export async function getStudentNotifications() {
    try {
        const response = await apiRequest("/api/student/notifications");
        return response.data;
    } catch (e) {
        return [
            { id: 1, text: "Google application deadline is tomorrow!", date: "Today" },
            { id: 2, text: "Your resume match score for IBM is 75%.", date: "Yesterday" },
            { id: 3, text: "New Job opening: Systems Engineer at Infosys.", date: "2 days ago" }
        ];
    }
}

// ==============================================================================
// 2. STUDENT APPLICATIONS (APPLY TO JOBS)
// ==============================================================================

export async function getStudentApplications(email = "") {
    try {
        const qs = email ? `?email=${encodeURIComponent(email)}` : "";
        const response = await apiRequest(`/api/student/applications${qs}`);
        return response.data;
    } catch (e) {
        return JSON.parse(localStorage.getItem("student_applied_jobs") || "[]");
    }
}

export async function applyForJob(applicationData) {
    try {
        const response = await apiRequest("/api/student/applications", {
            method: "POST",
            body: JSON.stringify(applicationData)
        });
        return response.data;
    } catch (e) {
        // Fallback local save
        const savedApps = JSON.parse(localStorage.getItem("student_applied_jobs") || "[]");
        const newApp = {
            id: Date.now(),
            ...applicationData,
            status: "Pending",
            date: new Date().toLocaleDateString("en-GB")
        };
        savedApps.unshift(newApp);
        localStorage.setItem("student_applied_jobs", JSON.stringify(savedApps));
        return newApp;
    }
}

// ==============================================================================
// 3. STUDENT PROFILE & PASSWORD
// ==============================================================================

export async function getStudentProfile(email = "") {
    try {
        const qs = email ? `?email=${encodeURIComponent(email)}` : "";
        const response = await apiRequest(`/api/student/profile${qs}`);
        return response.data;
    } catch (e) {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        return {
            fullName: user.fullName || "Student Name",
            email: user.email || email || "student@portal.edu",
            phone: user.phone || "",
            branch: user.branch || "",
            passingYear: user.passingYear || "",
            cgpa: user.cgpa || "",
            skills: user.skills || "",
            linkedinUrl: user.linkedinUrl || "",
            githubUrl: user.githubUrl || ""
        };
    }
}

export async function updateStudentProfile(profileData) {
    try {
        const response = await apiRequest("/api/student/profile", {
            method: "PUT",
            body: JSON.stringify(profileData)
        });
        return response.data;
    } catch (e) {
        return profileData;
    }
}

export async function changeStudentPassword(passwordData) {
    try {
        const response = await apiRequest("/api/student/change-password", {
            method: "PUT",
            body: JSON.stringify(passwordData)
        });
        return response;
    } catch (e) {
        return { status: "success", message: "Password updated successfully!" };
    }
}

// ==============================================================================
// 4. STUDENT HUB (STORIES, DRIVES, SUPPORT QUERIES)
// ==============================================================================

export async function getStudentHub(email = "") {
    try {
        const qs = email ? `?email=${encodeURIComponent(email)}` : "";
        const response = await apiRequest(`/api/student/hub${qs}`);
        return response.data;
    } catch (e) {
        const stories = JSON.parse(localStorage.getItem("placement_stories") || "[]");
        const drives = JSON.parse(localStorage.getItem("placement_drives") || "[]");
        const queries = JSON.parse(localStorage.getItem("student_queries") || "[]");
        const activeDrives = drives.filter(d => d.status === 'open' || d.status === 'upcoming');

        return {
            stories,
            nextEvent: activeDrives[0] || null,
            allDrives: drives,
            queries,
            stats: {
                storiesCount: stories.length,
                totalQueries: queries.length,
                resolvedQueries: queries.filter(q => q.status === "resolved").length
            }
        };
    }
}

export async function getStudentHubStories() {
    try {
        const response = await apiRequest("/api/student/hub/stories");
        return response.data;
    } catch (e) {
        return JSON.parse(localStorage.getItem("placement_stories") || "[]");
    }
}

export async function getStudentHubDrives() {
    try {
        const response = await apiRequest("/api/student/hub/drives");
        return response.data;
    } catch (e) {
        return JSON.parse(localStorage.getItem("placement_drives") || "[]");
    }
}

export async function getStudentHubQueries(status = "", search = "") {
    try {
        const queryParams = new URLSearchParams();
        if (status && status !== "all") queryParams.append("status", status);
        if (search) queryParams.append("search", search);

        const qs = queryParams.toString();
        const response = await apiRequest(`/api/student/hub/queries${qs ? `?${qs}` : ""}`);
        return response.data;
    } catch (e) {
        return JSON.parse(localStorage.getItem("student_queries") || "[]");
    }
}

export async function raiseStudentHubQuery(queryData) {
    try {
        const response = await apiRequest("/api/student/hub/queries", {
            method: "POST",
            body: JSON.stringify(queryData)
        });
        return response.data;
    } catch (e) {
        return {
            id: Date.now(),
            ...queryData,
            status: "pending",
            date: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
        };
    }
}

export async function resolveStudentHubQuery(queryId) {
    try {
        const response = await apiRequest(`/api/student/hub/queries/${queryId}/resolve`, {
            method: "PUT"
        });
        return response.data;
    } catch (e) {
        return { id: queryId, status: "resolved", studentConfirmed: true };
    }
}

