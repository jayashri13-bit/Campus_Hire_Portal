import { motion } from 'framer-motion';

import { useState, useEffect, useCallback } from 'react';

import { getAdminStudentAnalyticsDashboard, getTopSkillsAnalytics, getPlacementCgpaAnalytics, getDepartmentAnalytics, getAllTopPlacedStudents, addTopPlacedStudent, deleteTopPlacedStudent, getAllStudentsForDrive } from '../../auth/authService';
import {
    Users,
    TrendingUp,
    Trophy,
    Wallet,
    Coffee,
    Search,
    Plus,
    X,
    ChevronDown,
    Check,
    Building2,
    Trash2,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import './StudentAnalytics.css';
import bannerIcons from '../../assets/banner_icons.png';

// Inline SVGs for company logos
const COMPANY_LOGOS = {
    Amazon: (
        <svg viewBox="0 0 24 24" width="18" height="18" style={{ marginRight: '8px', overflow: 'visible', flexShrink: 0 }}>
            <path d="M13.2 13.1c0 1.2-.7 1.8-1.7 1.8-.7 0-1.2-.4-1.2-1.1 0-1.1.9-1.5 2.9-1.5v.8zm2.6 2.3c-.1-.6-.1-1.8-.1-2.5V9.7c0-1.8-1.1-2.7-3.1-2.7-1.7 0-3.1.9-3.4 2l1.1.4c.2-.7.9-1.2 1.9-1.2 1.1 0 1.5.5 1.5 1.4v.6c-2.4.1-4.2.7-4.2 2.7 0 1.3 8 2.2 2.1 2.2 1.2 0 2-.6 2.4-1.3h.1c.1.5.3.9.7 1.2l1-.6z" fill="#000000" />
            <path d="M5.3 19.3c3.4 2 8 2.5 12 1.6.8-.2 1.5-.5 2.2-1 .3-.2.3-.7-.1-.8-.7-.2-1.5-.1-2.2.1-3.2.7-6.9.4-10-1.2-.4-.2-.7 0-.7.3v1z" fill="#ff9900" />
        </svg>
    ),
    Microsoft: (
        <svg viewBox="0 0 23 23" width="16" height="16" style={{ marginRight: '8px', flexShrink: 0 }}>
            <rect x="0" y="0" width="10.5" height="10.5" fill="#f25022" />
            <rect x="11.5" y="0" width="10.5" height="10.5" fill="#7fba00" />
            <rect x="0" y="11.5" width="10.5" height="10.5" fill="#00a4ef" />
            <rect x="11.5" y="11.5" width="10.5" height="10.5" fill="#ffb900" />
        </svg>
    ),
    Apple: (
        <svg viewBox="0 0 170 170" width="16" height="16" fill="#000000" style={{ marginRight: '8px', flexShrink: 0 }}>
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.9-14.36-6.07-2.73-2.22-6.49-6.67-11.28-13.37-5.61-7.8-10.28-16.73-13.98-26.8-3.7-10.07-5.56-19.82-5.56-29.24 0-14.6 3.63-26.6 10.89-35.97 7.26-9.37 16.57-14.06 27.93-14.06 4.96 0 10.59 1.45 16.89 4.36 6.3 2.9 10.84 4.36 13.62 4.36 2.03 0 6.38-1.39 13.06-4.16 6.68-2.78 12.21-4.04 16.58-3.78 15.34.88 26.9 6.64 34.66 17.27-12.28 7.5-18.29 17.72-18.02 30.65.3 10.15 4.14 18.57 11.53 25.26 7.39 6.69 16.14 10.35 26.27 10.99-2.3 6.64-5.34 13.06-9.13 19.26zm-20.28-94.88c0-9.92 3.5-18.51 10.5-25.76 7-7.25 15.31-11.02 24.93-11.3 0.28 9.92-3.3 18.56-10.74 25.92-7.44 7.36-15.72 11.08-24.69 11.14z" />
        </svg>
    ),
    Zepto: (
        <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '8px', flexShrink: 0 }}>
            <rect width="24" height="24" rx="6" fill="#7e22ce" />
            <path d="M7 7h10l-6 10h6" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    ),
    Revdau: (
        <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '8px', flexShrink: 0 }}>
            <rect width="24" height="24" rx="6" fill="#059669" />
            <text x="12" y="16.5" fontSize="13" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">R</text>
        </svg>
    ),
    Meesho: (
        <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '8px', flexShrink: 0 }}>
            <rect width="24" height="24" rx="6" fill="#be185d" />
            <path d="M6 17V7l6 6 6-6v10" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    ),
    Infosys: (
        <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '8px', flexShrink: 0 }}>
            <rect width="24" height="24" rx="6" fill="#0284c7" />
            <text x="12" y="16" fontSize="12" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">i</text>
        </svg>
    ),
    Google: (
        <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '8px', flexShrink: 0 }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
        </svg>
    )
};

function getCompanyBadgeColor(name) {
    if (!name) return '#2563eb';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0284c7', '#be185d', '#4f46e5'];
    return colors[Math.abs(hash) % colors.length];
}

function CompanyLogo({ companyName }) {
    const [imgError, setImgError] = useState(false);

    if (!companyName) {
        return <Building2 size={16} color="#2563eb" style={{ marginRight: '8px', flexShrink: 0 }} />;
    }

    const trimmed = String(companyName).trim();
    const normalized = trimmed.toLowerCase();
    const svgKey = Object.keys(COMPANY_LOGOS).find(k => k.toLowerCase() === normalized);

    // 1. Predefined brand SVG logo
    if (svgKey && COMPANY_LOGOS[svgKey]) {
        return COMPANY_LOGOS[svgKey];
    }

    const initialLetter = trimmed.charAt(0).toUpperCase() || '?';
    const badgeColor = getCompanyBadgeColor(trimmed);

    // 2. Initial letter badge fallback if image fails to load
    if (imgError) {
        return (
            <div style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: badgeColor, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: '700', marginRight: 8, flexShrink: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {initialLetter}
            </div>
        );
    }

    const domainName = normalized.replace(/[^a-z0-9]/g, '');
    const logoUrl = `https://www.google.com/s2/favicons?domain=${domainName}.com&sz=64`;

    return (
        <img
            src={logoUrl}
            alt={trimmed}
            onError={() => setImgError(true)}
            style={{ width: 18, height: 18, marginRight: 8, borderRadius: 4, objectFit: 'contain', flexShrink: 0 }}
        />
    );
}

// calculates the SVG arc path for each segment of the donut chart
function getDonutSegments(data, cx = 50, cy = 50, r = 38, innerR = 24) {
    let cumulativePercent = 0;
    const gap = 1.5; // gap in degrees between segments

    return data.map((item) => {
        const startPercent = cumulativePercent;
        cumulativePercent += item.percentage;

        const startAngle = (startPercent / 100) * 360 - 90 + gap / 2;
        const endAngle = (cumulativePercent / 100) * 360 - 90 - gap / 2;

        const toRad = (deg) => (deg * Math.PI) / 180;

        const x1 = cx + r * Math.cos(toRad(startAngle));
        const y1 = cy + r * Math.sin(toRad(startAngle));
        const x2 = cx + r * Math.cos(toRad(endAngle));
        const y2 = cy + r * Math.sin(toRad(endAngle));
        const ix1 = cx + innerR * Math.cos(toRad(startAngle));
        const iy1 = cy + innerR * Math.sin(toRad(startAngle));
        const ix2 = cx + innerR * Math.cos(toRad(endAngle));
        const iy2 = cy + innerR * Math.sin(toRad(endAngle));

        const largeArc = item.percentage > 50 ? 1 : 0;

        const d = [
            `M ${x1} ${y1}`,
            `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
            `L ${ix2} ${iy2}`,
            `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1}`,
            'Z',
        ].join(' ');

        return { ...item, d };
    });
}

// main component
export default function StudentAnalytics() {
    const [analyticsStats, setAnalyticsStats] = useState({
        placedStudents: 0,
        placementRate: 0,
        highestPackage: 0,
        averagePackage: 0
    });

    const [departmentData, setDepartmentData] = useState([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [cgpaData, setCgpaData] = useState([]);
    const [maxStudents, setMaxStudents] = useState(40);
    const [skillsData, setSkillsData] = useState([]);
    const [studentsList, setStudentsList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        branch: 'CS',
        passingYear: '2026',
        cgpa: '',
        lpa: '',
        skill: '',
        company: ''
    });




    const fetchStats = async () => {
        try {
            const response = await getAdminStudentAnalyticsDashboard();
            if (response.data) {
                setAnalyticsStats(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch admin student analytics:", error);
        }
    };

    const fetchDepartmentData = async () => {
        try {
            const res = await getDepartmentAnalytics();
            if (res.data) {
                setTotalStudents(res.data.totalStudents || 0);
                const colors = ['#1e3a6e', '#6c8dd6', '#06b6d4', '#a5b4fc', '#e2e8f0', '#f59e0b', '#10b981'];
                if (res.data.departments && Array.isArray(res.data.departments)) {
                    const mapped = res.data.departments.map((d, index) => ({
                        label: d.department && d.department.trim() !== '' ? d.department : 'Unspecified',
                        count: d.count,
                        percentage: res.data.totalStudents ? (d.count / res.data.totalStudents) * 100 : 0,
                        color: colors[index % colors.length]
                    }));
                    setDepartmentData(mapped);
                }
            }
        } catch (e) {
            console.error("Failed to fetch department analytics", e);
        }
    };

    const fetchCgpaData = async () => {
        try {
            const res = await getPlacementCgpaAnalytics();
            if (res.data && Array.isArray(res.data)) {
                const mapped = res.data.map(c => ({
                    range: c.range,
                    students: c.count
                }));
                setCgpaData(mapped);
                const maxCount = Math.max(...mapped.map(d => d.students), 0);
                setMaxStudents(Math.ceil((maxCount + 10) / 10) * 10); // round up to nearest 10
            }
        } catch (e) {
            console.error("Failed to fetch CGPA analytics", e);
        }
    };

    const fetchSkillsData = async () => {
        try {
            const res = await getTopSkillsAnalytics();
            if (res.data && Array.isArray(res.data)) {
                const colors = ['#1e3a6e', '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e'];

                const mapped = res.data.map((s, index) => ({
                    skill: s.skill,
                    percentage: s.count,
                    color: colors[index % colors.length]
                }));
                setSkillsData(mapped);
            }
        } catch (e) {
            console.error("Failed to fetch skills analytics", e);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchDepartmentData();
        fetchCgpaData();
        fetchSkillsData();

        let pollInterval;
        if (import.meta.env.MODE !== 'test') {
            pollInterval = setInterval(() => {
                if (document.hidden) return;
                fetchStats();
                fetchDepartmentData();
                fetchCgpaData();
                fetchSkillsData();
            }, 5000);
        }

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchStats();
                fetchDepartmentData();
                fetchCgpaData();
                fetchSkillsData();
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

    const fetchTopStudents = useCallback(async (newStudentName = null) => {
        try {
            let apiData = [];
            try {
                const response = await getAllTopPlacedStudents();
                if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
                    apiData = response.data;
                    localStorage.setItem("top_placed_students_local", JSON.stringify(response.data));
                }
            } catch (apiErr) {
                console.warn("API fetch for top placed students failed, using local storage fallback", apiErr);
            }

            const localList = JSON.parse(localStorage.getItem("top_placed_students_local") || "[]");
            const storedExtras = JSON.parse(localStorage.getItem("top_placed_students_extra") || "{}");
            const registeredProfiles = JSON.parse(localStorage.getItem("registered_profiles") || "[]");

            const combined = [...apiData];
            for (const locItem of localList) {
                const locName = (locItem.studentName || locItem.name || '').trim().toLowerCase();
                const exists = combined.some(item => (item.studentName || item.name || '').trim().toLowerCase() === locName);
                if (!exists) {
                    combined.push(locItem);
                }
            }

            const sorted = combined.sort((a, b) => {
                const lpaA = Number.parseFloat(a.packageLpa || a.lpa) || 0;
                const lpaB = Number.parseFloat(b.packageLpa || b.lpa) || 0;
                if (lpaB !== lpaA) return lpaB - lpaA;
                const cgpaA = Number.parseFloat(a.cgpa) || 0;
                const cgpaB = Number.parseFloat(b.cgpa) || 0;
                return cgpaB - cgpaA;
            });

            const mapped = sorted.map((s, index) => {
                const sName = s.studentName || s.name || 'Student';
                const nameParts = sName.trim().split(' ');
                let initials = 'ST';
                if (nameParts.length >= 2 && nameParts[0][0] && nameParts[1][0]) {
                    initials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
                } else if (nameParts[0] && nameParts[0].length >= 2) {
                    initials = nameParts[0].substring(0, 2).toUpperCase();
                } else if (nameParts[0]) {
                    initials = nameParts[0].toUpperCase();
                }

                const studentNameKey = sName.trim().toLowerCase();
                const rawId = s.id ?? s.studentId ?? s.topStudentId ?? s.topPlacedStudentId ?? s._id ?? null;
                const studentId = rawId !== null ? rawId : `local-${index}-${studentNameKey.replace(/\s+/g, '-')}`;
                const storedExtra = storedExtras[studentNameKey] || storedExtras[studentId] || storedExtras[s.id] || {};
                const regProfile = registeredProfiles.find(p => (p.fullName || p.name || '').trim().toLowerCase() === studentNameKey) || {};

                const branch = s.branch || s.department || s.course || storedExtra.branch || regProfile.department || regProfile.branch || regProfile.course || 'CS';
                const passingYear = s.passingYear || s.year || storedExtra.passingYear || regProfile.currentYear || regProfile.passingYear || '2026';

                return {
                    id: studentId,
                    rank: index + 1,
                    name: sName,
                    initials: initials,
                    branch: branch,
                    passingYear: String(passingYear),
                    cgpa: s.cgpa || '9.0',
                    lpa: s.packageLpa || s.lpa || '12',
                    skill: s.skills || s.skill || 'Full Stack',
                    skillColor: '#f3e8ff',
                    skillTextColor: '#a855f7',
                    company: s.companyName || s.company,
                    companyColor: '#2563eb'
                };
            });
            setStudentsList(mapped);

            // If a new student was just added, calculate and set their correct target page
            if (newStudentName) {
                const newIndex = mapped.findIndex(s => s.name?.toLowerCase() === newStudentName.toLowerCase());
                if (newIndex !== -1) {
                    setCurrentPage(Math.floor(newIndex / 5) + 1);
                }
            }
        } catch (error) {
            console.error("Failed to fetch top placed students", error);
        }
    }, []);

    useEffect(() => {
        fetchTopStudents();

        let pollInterval;
        if (import.meta.env.MODE !== 'test') {
            pollInterval = setInterval(() => {
                if (document.hidden) return;
                fetchTopStudents();
            }, 15000);
        }

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchTopStudents();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            if (pollInterval) clearInterval(pollInterval);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [fetchTopStudents]);

    const segments = getDonutSegments(departmentData);


    const handleAddStudent = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.cgpa || !formData.lpa || !formData.company) return;

        const payload = {
            studentName: formData.name,
            companyName: formData.company,
            packageLpa: Number.parseFloat(formData.lpa) || 12,
            cgpa: Number.parseFloat(formData.cgpa) || 9.0,
            skills: formData.skill || 'Full Stack',
            branch: formData.branch || 'CS',
            department: formData.branch || 'CS',
            passingYear: formData.passingYear || '2026',
            year: formData.passingYear || '2026'
        };

        let errorMessage = "Failed to add student. Please enter a valid registered student name.";

        try {
            await addTopPlacedStudent(payload);
        } catch (apiErr) {
            console.error("API add top student failed:", apiErr);
            const serverMsg = apiErr.response?.data?.message || (typeof apiErr.response?.data === 'string' ? apiErr.response.data : null);
            if (serverMsg) {
                errorMessage = serverMsg;
            }

            // If server explicitly responded with an error (e.g. 400 Bad Request, 404 Not Found), stop and show red error toast!
            if (apiErr.response && (apiErr.response.status === 400 || apiErr.response.status === 404 || apiErr.response.status === 409)) {
                setToastMessage(errorMessage);
                setToastType('error');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 4000);
                return; // Stop execution! Do not save to local storage or close modal!
            }
        }

        // Save branch and passingYear in localStorage extras so it is retained if backend response drops it
        const storedExtras = JSON.parse(localStorage.getItem("top_placed_students_extra") || "{}");
        storedExtras[(formData.name || '').trim().toLowerCase()] = {
            branch: formData.branch || 'CS',
            passingYear: formData.passingYear || '2026',
            skill: formData.skill || 'Full Stack'
        };
        localStorage.setItem("top_placed_students_extra", JSON.stringify(storedExtras));

        // Also save to top_placed_students_local so student side and fallback store syncs seamlessly
        const localList = JSON.parse(localStorage.getItem("top_placed_students_local") || "[]");
        const newStudentObj = {
            id: `local-${Date.now()}`,
            studentName: formData.name,
            companyName: formData.company,
            packageLpa: Number.parseFloat(formData.lpa) || 12,
            cgpa: Number.parseFloat(formData.cgpa) || 9.0,
            skills: formData.skill || 'Full Stack',
            branch: formData.branch || 'CS',
            passingYear: formData.passingYear || '2026'
        };
        const filteredLocal = localList.filter(s => (s.studentName || s.name || '').trim().toLowerCase() !== (formData.name || '').trim().toLowerCase());
        filteredLocal.push(newStudentObj);
        localStorage.setItem("top_placed_students_local", JSON.stringify(filteredLocal));
        window.dispatchEvent(new Event('storage'));

        // Fetch fresh canonical list & jump to newly added student page
        await fetchTopStudents(formData.name);

        setIsModalOpen(false);
        setFormData({
            name: '',
            branch: '',
            passingYear: '',
            cgpa: '',
            lpa: '',
            skill: '',
            company: ''
        });
        setToastMessage('Student added successfully!');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
        }, 3000);
    };

    const [deleteModalState, setDeleteModalState] = useState({
        isOpen: false,
        studentId: null,
        studentName: ''
    });

    const handleOpenDeleteModal = (studentId, studentName) => {
        if (!studentId) return;
        setDeleteModalState({
            isOpen: true,
            studentId,
            studentName
        });
    };

    const handleConfirmDeleteStudent = async () => {
        if (!deleteModalState.studentId && !deleteModalState.studentName) return;
        const { studentId, studentName } = deleteModalState;
        setDeleteModalState({ isOpen: false, studentId: null, studentName: '' });

        const studentNameKey = (studentName || '').trim().toLowerCase();

        try {
            const isRealApiId = studentId && !String(studentId).startsWith('local-');
            if (isRealApiId) {
                try {
                    await deleteTopPlacedStudent(studentId);
                } catch (delErr) {
                    console.warn("API delete top student failed", delErr);
                }
            }

            // Remove from local storage extra overrides and local list
            const storedExtras = JSON.parse(localStorage.getItem("top_placed_students_extra") || "{}");
            if (storedExtras[studentNameKey]) delete storedExtras[studentNameKey];
            if (studentId && storedExtras[studentId]) delete storedExtras[studentId];
            localStorage.setItem("top_placed_students_extra", JSON.stringify(storedExtras));

            const localList = JSON.parse(localStorage.getItem("top_placed_students_local") || "[]");
            const updatedLocal = localList.filter(s => s.id !== studentId && (s.studentName || s.name || '').trim().toLowerCase() !== studentNameKey);
            localStorage.setItem("top_placed_students_local", JSON.stringify(updatedLocal));
            window.dispatchEvent(new Event('storage'));

            // Optimistically update list in state
            setStudentsList(prev => prev.filter(s => s.id !== studentId && (s.name || '').trim().toLowerCase() !== studentNameKey));

            // Sync fresh backend list
            try {
                await fetchTopStudents();
            } catch (refetchErr) {
                console.warn("Refetch warning:", refetchErr);
            }

            setToastMessage(`Deleted ${studentName || 'student'} successfully!`);
            setToastType('success');
        } catch (error) {
            console.error("Failed to delete top placed student via API, applying local cleanup fallback:", error);

            // Fallback: Remove from state & localStorage so UI stays responsive
            setStudentsList(prev => prev.filter(s => s.id !== studentId && (s.name || '').trim().toLowerCase() !== studentNameKey));

            const storedExtras = JSON.parse(localStorage.getItem("top_placed_students_extra") || "{}");
            if (storedExtras[studentNameKey]) delete storedExtras[studentNameKey];
            if (studentId && storedExtras[studentId]) delete storedExtras[studentId];
            localStorage.setItem("top_placed_students_extra", JSON.stringify(storedExtras));

            setToastMessage(`Deleted ${studentName || 'student'} successfully!`);
            setToastType('success');
        }
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
        }, 4000);
    };

    const [sortConfig, setSortConfig] = useState({ key: 'lpa', direction: 'desc' });

    const handleSort = (key) => {
        setSortConfig(prev => {
            if (prev.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: key === 'name' || key === 'branch' ? 'asc' : 'desc' };
        });
    };

    const filteredStudents = studentsList.filter(student => {
        if (!student) return false;
        const name = (student.name || '').toLowerCase();
        const company = (student.company || '').toLowerCase();
        const skill = (student.skill || '').toLowerCase();
        const branch = (student.branch || '').toLowerCase();
        const year = String(student.passingYear || '');
        const query = (searchQuery || '').toLowerCase();

        return (
            name.includes(query) ||
            company.includes(query) ||
            skill.includes(query) ||
            branch.includes(query) ||
            year.includes(query)
        );
    });

    const sortedStudents = [...filteredStudents].sort((a, b) => {
        const { key, direction } = sortConfig;
        let aVal = a[key];
        let bVal = b[key];

        if (key === 'lpa' || key === 'cgpa' || key === 'passingYear' || key === 'rank') {
            aVal = Number.parseFloat(aVal) || 0;
            bVal = Number.parseFloat(bVal) || 0;
        } else {
            aVal = String(aVal || '').toLowerCase();
            bVal = String(bVal || '').toLowerCase();
        }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Reset to page 1 whenever search query, itemsPerPage, or sort changes
    useEffect(() => {
        const timer = setTimeout(() => setCurrentPage(1), 0);
        return () => clearTimeout(timer);
    }, [searchQuery, sortConfig, itemsPerPage]);

    const numericItemsPerPage = itemsPerPage === 'all' ? Math.max(sortedStudents.length, 1) : Number(itemsPerPage);
    const totalPages = Math.ceil(sortedStudents.length / numericItemsPerPage) || 1;
    const startIndex = (currentPage - 1) * numericItemsPerPage;
    const paginatedStudents = sortedStudents.slice(startIndex, startIndex + numericItemsPerPage);

    return (
        <div className="analytics-page-wrapper">

            {/* analytics banner */}
            <div className="analytics-banner">
                <div className="analytics-banner-text">
                    <span className="banner-badge">System Insights</span>
                    <h1 className="analytics-page-title">Student Analytics</h1>
                    <p className="analytics-page-subtitle">Track placements, CGPA distribution and skill trends</p>
                </div>
                <div className="analytics-banner-icons">
                    <img
                        src={bannerIcons}
                        alt="briefcase magnifying glass document"
                        className="banner-illustration"
                    />
                </div>
            </div>

            {/* stat cards section */}
            <section className="stats-grid">
                <motion.div className="stat-card theme-blue"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0 }}>
                    <div className="stat-text-group">
                        <span className="stat-label">Placed Students</span>
                        <h3 className="stat-value">{analyticsStats.placedStudents}</h3>
                        <span className="stat-subtext">Total placed this year</span>
                    </div>
                    <div className="stat-icon-container bg-light-blue">
                        <Users size={22} />
                    </div>
                </motion.div>

                <motion.div className="stat-card theme-green"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}>
                    <div className="stat-text-group">
                        <span className="stat-label">Placement Rate</span>
                        <h3 className="stat-value">{analyticsStats.placementRate}%</h3>
                        <span className="stat-subtext">% of eligible students placed</span>
                    </div>
                    <div className="stat-icon-container bg-light-green">
                        <TrendingUp size={22} />
                    </div>
                </motion.div>

                <motion.div className="stat-card theme-orange"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}>
                    <div className="stat-text-group">
                        <span className="stat-label">Highest Package</span>
                        <h3 className="stat-value">{analyticsStats.highestPackage.toLocaleString()}</h3>
                        <span className="stat-subtext">Top package offered</span>
                    </div>
                    <div className="stat-icon-container bg-light-orange">
                        <Trophy size={22} />
                    </div>
                </motion.div>

                <motion.div className="stat-card theme-purple"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}>
                    <div className="stat-text-group">
                        <span className="stat-label">Average Package</span>
                        <h3 className="stat-value">{analyticsStats.averagePackage.toLocaleString()}</h3>
                        <span className="stat-subtext">Average package offered</span>
                    </div>
                    <div className="stat-icon-container bg-light-purple">
                        <Wallet size={22} />
                    </div>
                </motion.div>
            </section>

            {/* department wise distribution section */}
            <section className="charts-row">
                <motion.div className="chart-card"
                    initial={{ opacity: 0, }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}>
                    <div className="chart-card-header">
                        <h3 className="chart-title">Department Wise Distribution</h3>
                    </div>

                    <div className="dept-chart-body">

                        {/* SVG Donut Chart */}
                        <div className="donut-wrapper">
                            <svg viewBox="0 0 100 100" className="donut-svg">
                                {segments.map((seg, i) => (
                                    <path
                                        key={seg.label || seg.color || i}
                                        d={seg.d}
                                        fill={seg.color}
                                        className="donut-segment"
                                    />
                                ))}
                                {/* Center Label */}
                                <text x="50" y="46" textAnchor="middle" className="donut-center-number">
                                    {totalStudents}
                                </text>
                                <text x="50" y="55" textAnchor="middle" className="donut-center-label">
                                    Students
                                </text>
                            </svg>
                        </div>

                        {/* Legend */}
                        <div className="dept-legend">
                            {departmentData.map((dept, i) => (
                                <div key={dept.label || dept.color || i} className="legend-item">
                                    <span
                                        className="legend-dot"
                                        style={{ backgroundColor: dept.color }}
                                    ></span>
                                    <span className="legend-label">{dept.label}</span>
                                    <span className="legend-count">
                                        {dept.count}
                                    </span>
                                </div>
                            ))}
                        </div>

                    </div>
                </motion.div>

                {/*Placement by cgpa bar chart card*/}
                <motion.div className='chart-card'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }} >
                    <div className='chart-card-header'>
                        <h3 className='chart-title'>
                            Placement by CGPA
                        </h3>
                    </div>

                    <div className='bar-chart-wrapper'>
                        <svg viewBox="0 0 280 180" className="bar-chart-svg">

                            {/* y-axis labels */}
                            {Array.from({ length: Math.floor(maxStudents / 10) + 1 }, (_, i) => i * 10).map((val) => {
                                const y = 20 + ((maxStudents - val) / (maxStudents || 1)) * 120;
                                return (
                                    <g key={val}>
                                        <text x="30" y={y + 4} textAnchor="end" className="bar-axis-text">
                                            {val}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* bars with value labels and x-axis labels */}
                            {cgpaData.map((item, i) => {
                                const barWidth = 32;
                                const gap = 15;
                                const x = 44 + i * (barWidth + gap);
                                const barHeight = (item.students / maxStudents) * 120;
                                const y = 20 + (120 - barHeight);
                                return (
                                    <g key={item.range || i}>
                                        <rect
                                            x={x} y="20"
                                            width={barWidth} height="120"
                                            rx="4" ry="4"
                                            fill="#eff6ff"
                                        />
                                        <rect
                                            x={x} y={barHeight === 0 ? 138 : y}
                                            width={barWidth} height={barHeight === 0 ? 2 : barHeight}
                                            rx="4" ry="4"
                                            className="bar-rect"
                                        />
                                        <text
                                            x={x + barWidth / 2} y={barHeight === 0 ? 134 : y - 5}
                                            textAnchor="middle"
                                            className="bar-value-text"
                                        >
                                            {item.students}
                                        </text>
                                        <text
                                            x={x + barWidth / 2} y="158"
                                            textAnchor="middle"
                                            className="bar-axis-text"
                                        >
                                            {item.range}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* y-axis title */}
                            <text
                                x="-90" y="10"
                                transform="rotate(-90)"
                                textAnchor="middle"
                                className="bar-axis-title"
                            >
                                No. of Students
                            </text>

                            {/* x-axis title */}
                            <text x="153" y="175" textAnchor="middle" className="bar-axis-title">
                                CGPA Range
                            </text>

                        </svg>

                    </div>

                </motion.div>

                {/* top skills in demand card */}
                <motion.div className="chart-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}>
                    <div className="chart-card-header">
                        <h3 className="chart-title">Top Skills in Demand</h3>
                    </div>

                    <div className="skills-chart-body">

                        {/* skill rows */}
                        <div className="skills-rows">
                            {skillsData.slice(0, 10).map((item, i) => (
                                <div key={item.skill || i} className="skill-row">
                                    <span className="skill-name">{item.skill}</span>
                                    <div className="skill-bar-track">
                                        <div
                                            className="skill-bar-fill"
                                            style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                                        ></div>
                                    </div>
                                    <span className="skill-percentage" style={{ color: item.color }}>{item.percentage}%</span>
                                </div>
                            ))}
                        </div>

                        {/* x-axis percentage markers */}
                        <div className="skills-x-axis">
                            <span>0%</span>
                            <span>25%</span>
                            <span>50%</span>
                            <span>75%</span>
                            <span>100%</span>
                        </div>

                        {/* x-axis title */}
                        <p className="skills-x-title">Demand Percentage</p>

                    </div>
                </motion.div>
            </section>

            {/* Top Placed Students Section */}
            <div className="students-table-card">
                <div className="table-card-header">
                    <div className="table-title-group">
                        <h3 className="table-card-title">All Placed Students</h3>
                        <span className="table-title-badge">Leaderboard</span>
                    </div>
                    <div className="table-header-actions">
                        {!isSearchOpen ? (
                            <button
                                type="button"
                                className="table-search-toggle-btn"
                                onClick={() => setIsSearchOpen(true)}
                                title="Search"
                            >
                                <Search size={18} />
                            </button>
                        ) : (
                            <div className="table-search-expanded">
                                <Search size={16} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search student..."
                                    className="table-search-input-expanded"
                                    style={{
                                        border: 'none',
                                        outline: 'none',
                                        background: 'transparent',
                                        backgroundColor: 'transparent',
                                        boxShadow: 'none',
                                        borderRadius: '0px',
                                        padding: '0px',
                                        margin: '0px',
                                        WebkitAppearance: 'none',
                                        appearance: 'none'
                                    }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="search-clear-btn"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setIsSearchOpen(false);
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                        <button
                            type="button"
                            className="add-student-btn"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Plus size={16} /> Add Placed Student
                        </button>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="students-table">
                        <thead>
                            <tr>
                                <th>STUDENT NAME</th>
                                <th>BRANCH</th>
                                <th onClick={() => handleSort('passingYear')} className={`sortable-th${sortConfig.key === 'passingYear' ? ' th-sorted' : ''}`} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                    <div className="th-sort-wrapper">
                                        <span>PASSING YEAR</span>
                                        <span className={sortConfig.key === 'passingYear' ? 'sort-arrow-active' : 'sort-arrow-idle'}>
                                            {sortConfig.key === 'passingYear' ? (sortConfig.direction === 'asc' ? '↑ Old→New' : '↓ New→Old') : '↕'}
                                        </span>
                                    </div>
                                </th>
                                <th onClick={() => handleSort('cgpa')} className={`sortable-th${sortConfig.key === 'cgpa' ? ' th-sorted' : ''}`} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                    <div className="th-sort-wrapper">
                                        <span>CGPA</span>
                                        <span className={sortConfig.key === 'cgpa' ? 'sort-arrow-active' : 'sort-arrow-idle'}>
                                            {sortConfig.key === 'cgpa' ? (sortConfig.direction === 'asc' ? '↑ Low→High' : '↓ High→Low') : '↕'}
                                        </span>
                                    </div>
                                </th>
                                <th onClick={() => handleSort('lpa')} className={`sortable-th${sortConfig.key === 'lpa' ? ' th-sorted' : ''}`} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                    <div className="th-sort-wrapper">
                                        <span>LPA</span>
                                        <span className={sortConfig.key === 'lpa' ? 'sort-arrow-active' : 'sort-arrow-idle'}>
                                            {sortConfig.key === 'lpa' ? (sortConfig.direction === 'asc' ? '↑ Low→High' : '↓ High→Low') : '↕'}
                                        </span>
                                    </div>
                                </th>
                                <th>SKILLS</th>
                                <th>COMPANY</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedStudents.map((student) => (
                                <tr key={student.id || student.rank}>
                                    <td>
                                        <div className="student-profile-cell">
                                            <div className="student-avatar">{student.initials}</div>
                                            <span className="student-name">{student.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="branch-pill">{student.branch}</span>
                                    </td>
                                    <td>
                                        <span className="year-pill">{student.passingYear}</span>
                                    </td>
                                    <td>
                                        <span className="cgpa-text">
                                            {!Number.isNaN(Number(student.cgpa))
                                                ? parseFloat(student.cgpa).toFixed(2)
                                                : student.cgpa}
                                        </span>
                                        <span className="cgpa-max">/10</span>
                                    </td>
                                    <td className="lpa-text">
                                        {student.lpa} LPA
                                    </td>
                                    <td>
                                        <span
                                            className="skill-pill"
                                            style={{
                                                backgroundColor: student.skillColor,
                                                color: student.skillTextColor
                                            }}
                                        >
                                            {student.skill}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="company-logo-cell">
                                            <CompanyLogo companyName={student.company} />
                                            <span
                                                className="company-text"
                                                style={{ color: student.companyColor || '#1e293b' }}
                                            >
                                                {student.company}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="delete-student-btn"
                                            onClick={() => handleOpenDeleteModal(student.id, student.name)}
                                            title="Delete Top Placed Student"
                                            aria-label={`Delete ${student.name}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="table-card-footer">
                    {totalPages > 1 && (
                        <div className="table-pagination">
                            <button
                                type="button"
                                className="pagination-btn arrow-btn"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                &larr;
                            </button>
                            {new Array(totalPages).fill(0).map((_, i) => (
                                <button
                                    key={`page-${i + 1}`}
                                    type="button"
                                    className={`pagination-btn num-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                type="button"
                                className="pagination-btn arrow-btn"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                &rarr;
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Top Placed Student Modal */}
            {isModalOpen && (
                <div className="modal-overlay" aria-label="Close add student modal backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
                    <div className="modal-container">
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">Add Placed Student</h3>
                                <p className="modal-subtitle">Enter details to feature student on the Leaderboard</p>
                            </div>
                            <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddStudent} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="add-student-name" className="form-label">
                                    Student Full Name <span className="required-star">*</span>
                                </label>
                                <div className="name-input-wrapper">
                                    <input
                                        id="add-student-name"
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Priya Sharma"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="add-student-branch" className="form-label">
                                        Branch <span className="required-star">*</span>
                                    </label>
                                    <div className="select-wrapper">
                                        <select
                                            id="add-student-branch"
                                            className="form-select"
                                            value={formData.branch}
                                            onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                            required
                                        >
                                            <option value="CS">CS</option>
                                            <option value="IT">IT</option>
                                            <option value="BCA">BCA</option>
                                            <option value="MCA">MCA</option>
                                        </select>
                                        <ChevronDown size={16} className="select-chevron" />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="add-student-passing-year" className="form-label">
                                        Passing Year <span className="required-star">*</span>
                                    </label>
                                    <div className="select-wrapper">
                                        <select
                                            id="add-student-passing-year"
                                            className="form-select"
                                            value={formData.passingYear}
                                            onChange={(e) => setFormData({ ...formData, passingYear: e.target.value })}
                                            required
                                        >
                                            <option value="2024">2024</option>
                                            <option value="2025">2025</option>
                                            <option value="2026">2026</option>
                                        </select>
                                        <ChevronDown size={16} className="select-chevron" />
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="add-student-cgpa" className="form-label">
                                        CGPA (out of 10) <span className="required-star">*</span>
                                    </label>
                                    <input
                                        id="add-student-cgpa"
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. 9.4"
                                        value={formData.cgpa}
                                        onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="add-student-lpa" className="form-label">
                                        Package (LPA) <span className="required-star">*</span>
                                    </label>
                                    <input
                                        id="add-student-lpa"
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. 28"
                                        value={formData.lpa}
                                        onChange={(e) => setFormData({ ...formData, lpa: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="add-student-skill" className="form-label">Primary Skill</label>
                                    <input
                                        id="add-student-skill"
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Full Stack, Data Science, Back"
                                        value={formData.skill}
                                        onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="add-student-company" className="form-label">
                                        Company Name <span className="required-star">*</span>
                                    </label>
                                    <input
                                        id="add-student-company"
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Amazon, Microsoft, Apple"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-submit"
                                >
                                    <Plus size={16} /> Add to Leaderboard
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {deleteModalState.isOpen && (
                <div className="modal-overlay" onClick={() => setDeleteModalState({ isOpen: false, studentId: null, studentName: '' })}>
                    <div className="qs-delete-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="delete-modal-icon-bg">
                            <Trash2 size={22} />
                        </div>
                        <h4 className="delete-modal-title">Delete Top Placed Student</h4>
                        <p className="delete-modal-desc">
                            Are you sure you want to delete the entry for <strong>{deleteModalState.studentName || 'this student'}</strong>? This action cannot be undone.
                        </p>
                        <div className="delete-modal-actions">
                            <button
                                type="button"
                                className="btn-delete-cancel"
                                onClick={() => setDeleteModalState({ isOpen: false, studentId: null, studentName: '' })}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-delete-confirm"
                                onClick={handleConfirmDeleteStudent}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {showToast && (
                <div className={`toast-notification ${toastType}`}>
                    <div className="toast-icon-bg" style={{ backgroundColor: toastType === 'error' ? '#fee2e2' : '#dcfce7', color: toastType === 'error' ? '#ef4444' : '#22c55e' }}>
                        {toastType === 'error' ? <X size={16} /> : <Check size={16} />}
                    </div>
                    <span className="toast-text">{toastMessage}</span>
                    <button type="button" className="toast-close-btn" onClick={() => setShowToast(false)}>
                        <X size={14} />
                    </button>
                </div>
            )}

        </div>
    );
}
