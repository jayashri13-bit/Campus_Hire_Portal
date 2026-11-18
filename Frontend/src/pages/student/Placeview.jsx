import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Users, TrendingUp, Trophy, Wallet, Search, X, Building2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
    getStudentPlaceviewDashboard,
    getStudentPlaceviewDepartment,
    getStudentPlaceviewPlacementCgpa,
    getStudentPlaceviewTopSkills,
    getStudentPlaceviewTopPlaced
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

    if (svgKey && COMPANY_LOGOS[svgKey]) {
        return COMPANY_LOGOS[svgKey];
    }

    const initialLetter = trimmed.charAt(0).toUpperCase() || '?';
    const badgeColor = getCompanyBadgeColor(trimmed);

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
            </div>
        </div>
    );
}
