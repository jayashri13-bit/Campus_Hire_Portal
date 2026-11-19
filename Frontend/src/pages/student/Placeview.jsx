import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Users, TrendingUp, Trophy, Wallet, Search, X, Building2, ArrowUpDown, ArrowUp, ArrowDown, Plus, ChevronDown, CheckCircle } from 'lucide-react';
import {
    getStudentPlaceviewDashboard,
    getStudentPlaceviewDepartment,
    getStudentPlaceviewPlacementCgpa,
    getStudentPlaceviewTopSkills,
    getStudentPlaceviewTopPlaced,
    addTopPlacedStudent
} from '../../auth/authService';
import './Placeview.css';
import placeviewBannerImg from '../../assets/placeview_banner.png';

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
    Instagram: (
        <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '8px', flexShrink: 0 }}>
            <rect width="24" height="24" rx="6" fill="#e1306c" />
            <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0 8a3 3 0 110-6 3 3 0 010 6zm5.25-8.5a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" fill="#ffffff" />
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
    ),
    TCS: (
        <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '8px', flexShrink: 0 }}>
            <rect width="24" height="24" rx="5" fill="#003366" />
            <text x="12" y="16.5" fontSize="9.5" fontWeight="900" fill="#ffffff" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">TCS</text>
        </svg>
    ),
    Wipro: (
        <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '8px', flexShrink: 0 }}>
            <rect width="24" height="24" rx="5" fill="#5c2d91" />
            <text x="12" y="17" fontSize="13" fontWeight="900" fill="#ffffff" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">W</text>
        </svg>
    ),
    Cognizant: (
        <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '8px', flexShrink: 0 }}>
            <rect width="24" height="24" rx="5" fill="#0033a0" />
            <text x="12" y="17" fontSize="13" fontWeight="900" fill="#ffffff" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">C</text>
        </svg>
    ),
    Accenture: (
        <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '8px', flexShrink: 0 }}>
            <rect width="24" height="24" rx="5" fill="#a100ff" />
            <path d="M9 7l6 5-6 5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    ),
    Meta: (
        <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '8px', flexShrink: 0 }}>
            <rect width="24" height="24" rx="5" fill="#0081fb" />
            <path d="M12 14c-1.5 2-3 2-4 1-1.3-1.3-.9-4 1-4 1.5 0 2.5 2 3 3zm0 0c1.5 2 3 2 4 1 1.3-1.3.9-4-1-4-1.5 0-2.5 2-3 3z" stroke="#ffffff" strokeWidth="1.6" fill="none" />
        </svg>
    ),
    Netflix: (
        <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '8px', flexShrink: 0 }}>
            <rect width="24" height="24" rx="5" fill="#141414" />
            <path d="M8 5v14l4-8v8l4-14" stroke="#e50914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    ),
    Deloitte: (
        <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '8px', flexShrink: 0 }}>
            <rect width="24" height="24" rx="6" fill="#000000" />
            <text x="8" y="16.5" fontSize="13" fontWeight="bold" fill="#ffffff" fontFamily="sans-serif">D.</text>
        </svg>
    )
};

function getCompanyBadgeColor(name) {
    if (!name) return '#2563eb';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0284c7', '#be185d', '#4f46e5', '#0891b2', '#0d9488'];
    return colors[Math.abs(hash) % colors.length];
}

function CompanyLogo({ companyName }) {
    if (!companyName) {
        return <Building2 size={16} color="#2563eb" style={{ marginRight: '8px', flexShrink: 0 }} />;
    }

    const trimmed = String(companyName).trim();
    const normalized = trimmed.toLowerCase();
    const svgKey = Object.keys(COMPANY_LOGOS).find(k => k.toLowerCase() === normalized);

    if (svgKey && COMPANY_LOGOS[svgKey]) {
        return COMPANY_LOGOS[svgKey];
    }

    const initialLetter = trimmed.charAt(0).toUpperCase() || '?';
    const badgeColor = getCompanyBadgeColor(trimmed);

    return (
        <div style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            backgroundColor: badgeColor,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: '700',
            marginRight: 8,
            flexShrink: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {initialLetter}
        </div>
    );
}

// Calculates the SVG arc path for each segment of the donut chart
function getDonutSegments(data, cx = 50, cy = 50, r = 38, innerR = 24) {
    let cumulativePercent = 0;
    const gap = 1.5;

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

// Fallback initial data matching exact reference UI
const defaultDeptData = [
    { label: 'Computer Science', count: 11, percentage: 45.83, color: '#1e3a6e' },
    { label: 'Computer Science and Applications', count: 6, percentage: 25.00, color: '#4a7ff7' },
    { label: 'Computer Applications', count: 5, percentage: 20.83, color: '#06b6d4' },
    { label: 'Bsc IT', count: 1, percentage: 4.17, color: '#a5b4fc' },
    { label: 'CS', count: 1, percentage: 4.17, color: '#cbd5e1' }
];

const defaultCgpaData = [
    { range: '<6', students: 0 },
    { range: '6-7', students: 0 },
    { range: '7-8', students: 0 },
    { range: '8-9', students: 4 },
    { range: '9-10', students: 10 }
];

const defaultSkillsData = [
    { skill: 'Java', percentage: 21, color: '#1e3a6e' },
    { skill: 'Html', percentage: 8, color: '#3b82f6' },
    { skill: 'Golang', percentage: 7, color: '#8b5cf6' },
    { skill: 'Python', percentage: 6, color: '#06b6d4' },
    { skill: 'Spring boot', percentage: 4, color: '#f59e0b' },
    { skill: 'Css', percentage: 2, color: '#10b981' },
    { skill: 'Php', percentage: 2, color: '#f43f5e' }
];

export default function Placeview() {
    const [analyticsStats, setAnalyticsStats] = useState({
        placedStudents: 0,
        placementRate: 0,
        highestPackage: 0,
        averagePackage: 0
    });

    const [departmentData, setDepartmentData] = useState([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [cgpaData, setCgpaData] = useState([]);
    const [maxStudents, setMaxStudents] = useState(20);
    const [skillsData, setSkillsData] = useState([]);

    const [studentsList, setStudentsList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [formData, setFormData] = useState({
        name: '',
        branch: 'CS',
        passingYear: '2026',
        cgpa: '',
        lpa: '',
        skill: '',
        company: ''
    });
    const [currentPage, setCurrentPage] = useState(1);

    const fetchStats = async () => {
        try {
            const response = await getStudentPlaceviewDashboard();
            if (response && response.data) {
                setAnalyticsStats(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch student placeview stats:", error);
        }
    };

    const fetchDepartmentData = async () => {
        try {
            const res = await getStudentPlaceviewDepartment();
            if (res && res.data && res.data.departments && res.data.departments.length > 0) {
                setTotalStudents(res.data.totalStudents || 0);
                const colors = ['#1e3a6e', '#4a7ff7', '#06b6d4', '#a5b4fc', '#cbd5e1', '#f59e0b', '#10b981'];
                const mapped = res.data.departments.map((d, index) => ({
                    label: d.department && d.department.trim() !== '' ? d.department : 'Unspecified',
                    count: d.count,
                    percentage: res.data.totalStudents ? (d.count / res.data.totalStudents) * 100 : 0,
                    color: colors[index % colors.length]
                }));
                setDepartmentData(mapped);
            }
        } catch (e) {
            console.error("Failed to fetch department analytics", e);
        }
    };

    const fetchCgpaData = async () => {
        try {
            const res = await getStudentPlaceviewPlacementCgpa();
            if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
                const mapped = res.data.map(c => ({
                    range: c.range,
                    students: c.count
                }));
                setCgpaData(mapped);
                const maxCount = Math.max(...mapped.map(d => d.students), 0);
                setMaxStudents(Math.max(20, Math.ceil((maxCount + 10) / 10) * 10));
            }
        } catch (e) {
            console.error("Failed to fetch CGPA analytics", e);
        }
    };

    const fetchSkillsData = async () => {
        try {
            const res = await getStudentPlaceviewTopSkills();
            if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
                const colors = ['#1e3a6e', '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6', '#6366f1'];
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

    const fetchTopStudents = async () => {
        try {
            let apiData = [];
            try {
                const response = await getStudentPlaceviewTopPlaced();
                if (response && response.data && Array.isArray(response.data)) {
                    apiData = response.data;
                }
            } catch (apiErr) {
                console.warn("API fetch for top placed students fallback to local storage", apiErr);
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
                const skillName = s.skills || s.skill || storedExtra.skill || 'Software Engineer';
                const companyName = s.companyName || s.company || 'Company';

                return {
                    id: studentId,
                    rank: index + 1,
                    name: sName,
                    initials: initials,
                    branch: branch,
                    passingYear: String(passingYear),
                    cgpa: s.cgpa || '9.0',
                    lpa: s.packageLpa || s.lpa || 0,
                    skill: skillName,
                    skillColor: '#fae8ff',
                    skillTextColor: '#c026d3',
                    company: companyName
                };
            });
            setStudentsList(mapped);
        } catch (e) {
            console.error("Failed to fetch top placed students:", e);
            setStudentsList([]);
        }
    };

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

        try {
            await addTopPlacedStudent(payload);
        } catch (apiErr) {
            console.warn("Backend addTopPlacedStudent fallback or restricted for student role:", apiErr);
        }

        const storedExtras = JSON.parse(localStorage.getItem("top_placed_students_extra") || "{}");
        storedExtras[(formData.name || '').trim().toLowerCase()] = {
            branch: formData.branch || 'CS',
            passingYear: formData.passingYear || '2026',
            skill: formData.skill || 'Full Stack'
        };
        localStorage.setItem("top_placed_students_extra", JSON.stringify(storedExtras));

        const localList = JSON.parse(localStorage.getItem("top_placed_students_local") || "[]");
        const newStudentObj = {
            id: `local-${Date.now()}`,
            name: formData.name,
            studentName: formData.name,
            company: formData.company,
            companyName: formData.company,
            packageLpa: Number.parseFloat(formData.lpa) || 12,
            lpa: String(formData.lpa || 12),
            cgpa: Number.parseFloat(formData.cgpa) || 9.0,
            skills: formData.skill || 'Full Stack',
            skill: formData.skill || 'Full Stack',
            branch: formData.branch || 'CS',
            passingYear: formData.passingYear || '2026'
        };
        const filteredLocal = localList.filter(s => (s.studentName || s.name || '').trim().toLowerCase() !== (formData.name || '').trim().toLowerCase());
        filteredLocal.unshift(newStudentObj);
        localStorage.setItem("top_placed_students_local", JSON.stringify(filteredLocal));

        await fetchTopStudents();

        const studentName = formData.name;
        setFormData({
            name: '',
            branch: 'CS',
            passingYear: '2026',
            cgpa: '',
            lpa: '',
            skill: '',
            company: ''
        });
        setIsModalOpen(false);
        setToastMessage(`Student '${studentName}' added to Leaderboard successfully!`);
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3500);
    };

    useEffect(() => {
        fetchStats();
        fetchDepartmentData();
        fetchCgpaData();
        fetchSkillsData();
        fetchTopStudents();

        let pollInterval;
        if (import.meta.env.MODE !== 'test') {
            pollInterval = setInterval(() => {
                if (document.hidden) return;
                fetchStats();
                fetchDepartmentData();
                fetchCgpaData();
                fetchSkillsData();
                fetchTopStudents();
            }, 10000);
        }

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                if (isAdmin) {
                    fetchStats();
                    fetchDepartmentData();
                    fetchCgpaData();
                    fetchSkillsData();
                }
                fetchTopStudents();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('focus', handleVisibility);

        const handleStorageChange = () => {
            fetchTopStudents();
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
            if (pollInterval) clearInterval(pollInterval);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('focus', handleVisibility);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const segments = getDonutSegments(departmentData);

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

    useEffect(() => {
        const timer = setTimeout(() => setCurrentPage(1), 0);
        return () => clearTimeout(timer);
    }, [searchQuery, sortConfig, itemsPerPage]);

    const numericItemsPerPage = itemsPerPage === 'all' ? Math.max(sortedStudents.length, 1) : Number(itemsPerPage);
    const totalPages = Math.ceil(sortedStudents.length / numericItemsPerPage) || 1;
    const startIndex = (currentPage - 1) * numericItemsPerPage;
    const paginatedStudents = sortedStudents.slice(startIndex, startIndex + numericItemsPerPage);

    return (
        <div className="placeview-container">
            <div className="placeview-wrapper">
                {/* Placeview Hero Banner */}
                <motion.div
                    className="placeview-banner"
                    initial={{ opacity: 0, y: -15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="placeview-banner-text">
                        <span className="placeview-banner-badge">STUDENT INSIGHTS</span>
                        <h1 className="placeview-page-title">Students Placeview</h1>
                        <p className="placeview-page-subtitle">
                            Explore campus placement insights, average packages, branch-wise statistics, top hiring companies, and key skill trends.
                        </p>
                    </div>
                    <div className="placeview-banner-icons">
                        <motion.img
                            src={placeviewBannerImg}
                            alt="Students Placeview Floating 3D Artwork"
                            className="placeview-banner-illustration"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
                            transition={{
                                opacity: { duration: 0.5 },
                                scale: { duration: 0.5 },
                                y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                            }}
                        />
                    </div>
                </motion.div>

                {/* 4 Key Placement Statistics Cards */}
                <section className="placeview-stats-grid">
                    <motion.div
                        className="placeview-stat-card placeview-theme-blue"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0 }}
                    >
                        <div className="placeview-stat-text-group">
                            <span className="placeview-stat-label">Placed Students</span>
                            <h3 className="placeview-stat-value">{analyticsStats.placedStudents}</h3>
                            <span className="placeview-stat-subtext">Total placed this year</span>
                        </div>
                        <div className="placeview-stat-icon-container placeview-bg-light-blue">
                            <Users size={22} />
                        </div>
                    </motion.div>

                    <motion.div
                        className="placeview-stat-card placeview-theme-green"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <div className="placeview-stat-text-group">
                            <span className="placeview-stat-label">Placement Rate</span>
                            <h3 className="placeview-stat-value">{analyticsStats.placementRate}%</h3>
                            <span className="placeview-stat-subtext">% of eligible students placed</span>
                        </div>
                        <div className="placeview-stat-icon-container placeview-bg-light-green">
                            <TrendingUp size={22} />
                        </div>
                    </motion.div>

                    <motion.div
                        className="placeview-stat-card placeview-theme-orange"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        <div className="placeview-stat-text-group">
                            <span className="placeview-stat-label">Highest Package</span>
                            <h3 className="placeview-stat-value">{analyticsStats.highestPackage.toLocaleString()}</h3>
                            <span className="placeview-stat-subtext">Top package offered</span>
                        </div>
                        <div className="placeview-stat-icon-container placeview-bg-light-orange">
                            <Trophy size={22} />
                        </div>
                    </motion.div>

                    <motion.div
                        className="placeview-stat-card placeview-theme-purple"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                    >
                        <div className="placeview-stat-text-group">
                            <span className="placeview-stat-label">Average Package</span>
                            <h3 className="placeview-stat-value">{analyticsStats.averagePackage.toLocaleString()}</h3>
                            <span className="placeview-stat-subtext">Average package offered</span>
                        </div>
                        <div className="placeview-stat-icon-container placeview-bg-light-purple">
                            <Wallet size={22} />
                        </div>
                    </motion.div>
                </section>

                {/* 3 Key Analytics Charts Row */}
                <section className="placeview-charts-row">
                    {/* 1. Department Wise Distribution Donut Chart */}
                    <motion.div
                        className="placeview-chart-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                    >
                        <div className="placeview-chart-card-header">
                            <h3 className="placeview-chart-title">Department Wise Distribution</h3>
                        </div>

                        <div className="placeview-dept-chart-body">
                            {/* SVG Donut Chart */}
                            <div className="placeview-donut-wrapper">
                                <svg viewBox="0 0 100 100" className="placeview-donut-svg">
                                    {segments.map((seg, i) => (
                                        <path
                                            key={seg.label || seg.color || i}
                                            d={seg.d}
                                            fill={seg.color}
                                            className="placeview-donut-segment"
                                        />
                                    ))}
                                    {/* Center Label */}
                                    <text x="50" y="46" textAnchor="middle" className="placeview-donut-center-number">
                                        {totalStudents}
                                    </text>
                                    <text x="50" y="55" textAnchor="middle" className="placeview-donut-center-label">
                                        Students
                                    </text>
                                </svg>
                            </div>

                            {/* Legend */}
                            <div className="placeview-dept-legend">
                                {departmentData.map((dept, i) => (
                                    <div key={dept.label || dept.color || i} className="placeview-legend-item">
                                        <span
                                            className="placeview-legend-dot"
                                            style={{ backgroundColor: dept.color }}
                                        ></span>
                                        <span className="placeview-legend-label">{dept.label}</span>
                                        <span className="placeview-legend-count">
                                            {dept.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* 2. Placement by CGPA Bar Chart */}
                    <motion.div
                        className="placeview-chart-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                    >
                        <div className="placeview-chart-card-header">
                            <h3 className="placeview-chart-title">Placement by CGPA</h3>
                        </div>

                        <div className="placeview-bar-chart-wrapper">
                            <svg viewBox="0 0 280 180" className="placeview-bar-chart-svg">
                                {/* y-axis labels */}
                                {Array.from({ length: Math.floor(maxStudents / 10) + 1 }, (_, i) => i * 10).map((val) => {
                                    const y = 20 + ((maxStudents - val) / (maxStudents || 1)) * 120;
                                    return (
                                        <g key={val}>
                                            <text x="30" y={y + 4} textAnchor="end" className="placeview-bar-axis-text">
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
                                                className="placeview-bar-rect"
                                            />
                                            <text
                                                x={x + barWidth / 2} y={barHeight === 0 ? 134 : y - 5}
                                                textAnchor="middle"
                                                className="placeview-bar-value-text"
                                            >
                                                {item.students}
                                            </text>
                                            <text
                                                x={x + barWidth / 2} y="158"
                                                textAnchor="middle"
                                                className="placeview-bar-axis-text"
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
                                    className="placeview-bar-axis-title"
                                >
                                    No. of Students
                                </text>

                                {/* x-axis title */}
                                <text x="153" y="175" textAnchor="middle" className="placeview-bar-axis-title">
                                    CGPA Range
                                </text>
                            </svg>
                        </div>
                    </motion.div>

                    {/* 3. Top Skills in Demand Progress Bars Card */}
                    <motion.div
                        className="placeview-chart-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 }}
                    >
                        <div className="placeview-chart-card-header">
                            <h3 className="placeview-chart-title">Top Skills in Demand</h3>
                        </div>

                        <div className="placeview-skills-chart-body">
                            <div className="placeview-skills-rows">
                                {skillsData.slice(0, 10).map((item, i) => (
                                    <div key={item.skill || i} className="placeview-skill-row">
                                        <span className="placeview-skill-name">{item.skill}</span>
                                        <div className="placeview-skill-bar-track">
                                            <div
                                                className="placeview-skill-bar-fill"
                                                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                                            ></div>
                                        </div>
                                        <span className="placeview-skill-percentage" style={{ color: item.color }}>{item.percentage}%</span>
                                    </div>
                                ))}
                            </div>

                            {/* x-axis percentage markers */}
                            <div className="placeview-skills-x-axis">
                                <span>0%</span>
                                <span>25%</span>
                                <span>50%</span>
                                <span>75%</span>
                                <span>100%</span>
                            </div>

                            {/* x-axis title */}
                            <p className="placeview-skills-x-title">Demand Percentage</p>
                        </div>
                    </motion.div>
                </section>

                {/* Top Placed Students Leaderboard Table Section (View-Only for Students) */}
                <motion.div
                    className="placeview-students-table-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                >
                    <div className="placeview-table-card-header">
                        <div className="placeview-table-title-group">
                            <h3 className="placeview-table-card-title">All Placed Students</h3>
                            <span className="placeview-table-title-badge">Leaderboard</span>
                        </div>
                        <div className="placeview-table-header-actions">
                            {!isSearchOpen ? (
                                <button
                                    type="button"
                                    className="placeview-table-search-toggle-btn"
                                    onClick={() => setIsSearchOpen(true)}
                                    title="Search"
                                >
                                    <Search size={18} />
                                </button>
                            ) : (
                                <div className="placeview-table-search-expanded">
                                    <Search size={16} className="placeview-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search student..."
                                        className="placeview-table-search-input-expanded"
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
                                        className="placeview-search-clear-btn"
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
                                className="placeview-add-student-btn"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <Plus size={16} /> Add Placed Student
                            </button>
                        </div>
                    </div>

                    <div className="placeview-table-responsive">
                        <table className="placeview-students-table">
                            <thead>
                                <tr>
                                    <th>STUDENT NAME</th>
                                    <th>BRANCH</th>
                                    <th onClick={() => handleSort('passingYear')} className={`placeview-sortable-th${sortConfig.key === 'passingYear' ? ' placeview-th-sorted' : ''}`} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                        <div className="placeview-th-sort-wrapper">
                                            <span>PASSING YEAR</span>
                                            <span className={sortConfig.key === 'passingYear' ? 'placeview-sort-arrow-active' : 'placeview-sort-arrow-idle'}>
                                                {sortConfig.key === 'passingYear' ? (sortConfig.direction === 'asc' ? '↑ Old→New' : '↓ New→Old') : '↕'}
                                            </span>
                                        </div>
                                    </th>
                                    <th onClick={() => handleSort('cgpa')} className={`placeview-sortable-th${sortConfig.key === 'cgpa' ? ' placeview-th-sorted' : ''}`} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                        <div className="placeview-th-sort-wrapper">
                                            <span>CGPA</span>
                                            <span className={sortConfig.key === 'cgpa' ? 'placeview-sort-arrow-active' : 'placeview-sort-arrow-idle'}>
                                                {sortConfig.key === 'cgpa' ? (sortConfig.direction === 'asc' ? '↑ Low→High' : '↓ High→Low') : '↕'}
                                            </span>
                                        </div>
                                    </th>
                                    <th onClick={() => handleSort('lpa')} className={`placeview-sortable-th${sortConfig.key === 'lpa' ? ' placeview-th-sorted' : ''}`} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                        <div className="placeview-th-sort-wrapper">
                                            <span>LPA</span>
                                            <span className={sortConfig.key === 'lpa' ? 'placeview-sort-arrow-active' : 'placeview-sort-arrow-idle'}>
                                                {sortConfig.key === 'lpa' ? (sortConfig.direction === 'asc' ? '↑ Low→High' : '↓ High→Low') : '↕'}
                                            </span>
                                        </div>
                                    </th>
                                    <th>SKILLS</th>
                                    <th>COMPANY</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedStudents.length > 0 ? (
                                    paginatedStudents.map((student) => (
                                        <tr key={student.id || student.rank}>
                                            <td>
                                                <div className="placeview-student-profile-cell">
                                                    <div className="placeview-student-avatar">{student.initials}</div>
                                                    <span className="placeview-student-name">{student.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="placeview-branch-pill">{student.branch}</span>
                                            </td>
                                            <td>
                                                <span className="placeview-year-pill">{student.passingYear}</span>
                                            </td>
                                            <td>
                                                <span className="placeview-cgpa-text">
                                                    {!Number.isNaN(Number(student.cgpa))
                                                        ? parseFloat(student.cgpa).toFixed(2)
                                                        : student.cgpa}
                                                </span>
                                                <span className="placeview-cgpa-max">/10</span>
                                            </td>
                                            <td className="placeview-lpa-text">
                                                {student.lpa} LPA
                                            </td>
                                            <td>
                                                <span
                                                    className="placeview-skill-pill"
                                                    style={{
                                                        backgroundColor: student.skillColor || '#fae8ff',
                                                        color: student.skillTextColor || '#c026d3'
                                                    }}
                                                >
                                                    {student.skill}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="placeview-company-logo-cell">
                                                    <CompanyLogo companyName={student.company} />
                                                    <span
                                                        className="placeview-company-text"
                                                        style={{ color: student.companyColor || '#1e293b' }}
                                                    >
                                                        {student.company}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                                            {searchQuery ? 'No placed students match your search criteria.' : 'No top placed students added yet.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="placeview-table-card-footer">
                        {totalPages > 1 && (
                            <div className="placeview-table-pagination">
                                <button
                                    type="button"
                                    className="placeview-pagination-btn placeview-arrow-btn"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    &larr;
                                </button>
                                {new Array(totalPages).fill(0).map((_, i) => (
                                    <button
                                        key={`page-${i + 1}`}
                                        type="button"
                                        className={`placeview-pagination-btn placeview-num-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    className="placeview-pagination-btn placeview-arrow-btn"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage >= totalPages}
                                >
                                    &rarr;
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>

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
                                    <label htmlFor="placeview-student-name" className="form-label">
                                        Student Full Name <span className="required-star">*</span>
                                    </label>
                                    <div className="name-input-wrapper">
                                        <input
                                            id="placeview-student-name"
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
                                        <label htmlFor="placeview-student-branch" className="form-label">
                                            Branch <span className="required-star">*</span>
                                        </label>
                                        <div className="select-wrapper">
                                            <select
                                                id="placeview-student-branch"
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
                                        <label htmlFor="placeview-student-passing-year" className="form-label">
                                            Passing Year <span className="required-star">*</span>
                                        </label>
                                        <div className="select-wrapper">
                                            <select
                                                id="placeview-student-passing-year"
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
                                        <label htmlFor="placeview-student-cgpa" className="form-label">
                                            CGPA (out of 10) <span className="required-star">*</span>
                                        </label>
                                        <input
                                            id="placeview-student-cgpa"
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. 9.4"
                                            value={formData.cgpa}
                                            onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="placeview-student-lpa" className="form-label">
                                            Package (LPA) <span className="required-star">*</span>
                                        </label>
                                        <input
                                            id="placeview-student-lpa"
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
                                        <label htmlFor="placeview-student-skill" className="form-label">Primary Skill</label>
                                        <input
                                            id="placeview-student-skill"
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. Full Stack, Data Science, Cloud"
                                            value={formData.skill}
                                            onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="placeview-student-company" className="form-label">
                                            Company Name <span className="required-star">*</span>
                                        </label>
                                        <input
                                            id="placeview-student-company"
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. Amazon, Microsoft, Apple, Google"
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

                {/* Toast Notification */}
                {showToast && (
                    <div style={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: 9999,
                        backgroundColor: toastType === 'error' ? '#ef4444' : '#10b981',
                        color: '#ffffff',
                        padding: '12px 20px',
                        borderRadius: 8,
                        boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 500,
                        fontSize: 14
                    }}>
                        <CheckCircle size={18} />
                        {toastMessage}
                    </div>
                )}
            </div>
        </div>
    );
}
