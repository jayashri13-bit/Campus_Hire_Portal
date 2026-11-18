import React, { useState, useEffect } from 'react';
import {
    Users,
    TrendingUp,
    Trophy,
    Wallet,
    Coffee,
    Plus,
    Search,
    X,
    CheckCircle,
    Trash2
} from 'lucide-react';
import './StudentAnalytics.css';
import bannerIcons from '../../assets/banner_icons.png';
import { getAnalytics, addTopStudent, deleteTopStudent } from '../../api/adminApi';

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
};

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

    // Department Wise Distribution Initial Data
    const initialDepartmentData = [
        { label: 'Computer Science', count: 180, percentage: 36, color: '#1e3a6e' }, // Dark Navy
        { label: 'Information Technology', count: 110, percentage: 22, color: '#6c8dd6' }, // Periwinkle Blue
        { label: 'BCA', count: 60, percentage: 12, color: '#06b6d4' }, // Cyan
        { label: 'MCA', count: 40, percentage: 8, color: '#a5b4fc' }, // Soft Blue
        { label: 'Others', count: 110, percentage: 22, color: '#e2e8f0' }, // Light grey
    ];

    // Placement by CGPA Initial Data
    const initialCgpaData = [
        { range: '<6', students: 7 },
        { range: '6 - 7', students: 15 },
        { range: '7 - 8', students: 23 },
        { range: '8 - 9', students: 28 },
        { range: '9 - 10', students: 32 },
    ];

    // Top Skills Initial Data
    const initialSkillsData = [
        { skill: 'Java', percentage: 62, color: '#1e3a6e' }, // dark navy
        { skill: 'Python', percentage: 58, color: '#3b82f6' }, // blue
        { skill: 'SQL', percentage: 40, color: '#8b5cf6' }, // purple
        { skill: 'PHP', percentage: 32, color: '#06b6d4' }, // cyan
        { skill: 'React', percentage: 16, color: '#f59e0b' }, // orange
        { skill: 'C++', percentage: 13, color: '#10b981' }, // green
        { skill: 'C', percentage: 8, color: '#f43f5e' }, // rose
    ];

    // Reactive State for all 2nd Page charts and analytics
    const [departmentData, setDepartmentData] = useState(initialDepartmentData);
    const [totalStudents, setTotalStudents] = useState(500);
    const [cgpaData, setCgpaData] = useState(initialCgpaData);
    const [skillsData, setSkillsData] = useState(initialSkillsData);

    const segments = getDonutSegments(departmentData);
    const maxStudents = 40; // y-axis max round number above 32

    //Top Placed Students initial data
    const initialStudentsData = [
        {
            rank: 1, name: 'Priya Sharma', initials: 'PS', branch: 'CS', passingYear: '2026', cgpa: '9.4',
            lpa: '28', skill: 'Full Stack', skillColor: '#f3e8ff',
            skillTextColor: '#a855f7', company: 'Amazon',
            companyColor: '#c2410c'
        },

        {
            rank: 2, name: 'Rahul Desai', initials: 'RD', branch: 'IT', passingYear: '2025',
            cgpa: '9.1', lpa: '22', skill: 'Data Science',
            skillColor: '#dbeafe', skillTextColor: '#2563eb',
            company: 'Microsoft', companyColor: '#4f5e7b'
        },

        {
            rank: 3, name: 'Sneha Kulkarni', initials: 'SK', branch: 'BCA', passingYear: '2026',
            cgpa: '8.8', lpa: '18', skill: 'Backend',
            skillColor: '#dcfce7',
            skillTextColor: '#16a34a', company: 'Apple',
            companyColor: '#1e293b'
        },

        {
            rank: 4, name: 'Aarav Mehta', initials: 'AM', branch: 'CS', passingYear: '2025',
            cgpa: '8.5', lpa: '14', skill: 'Cooking',
            skillColor: '#ecfeff', skillTextColor: '#0891b2',
            company: 'Suresh Tea House', companyColor: '#475569'
        },

        {
            rank: 5, name: 'Diya Jadav', initials: 'DJ', branch: 'IT', passingYear: '2026',
            cgpa: '8.4', lpa: '12', skill: 'React Native',
            skillColor: '#f3e8ff', skillTextColor: '#a855f7',
            company: 'Microsoft', companyColor: '#4f5e7b'
        },

        {
            rank: 6, name: 'Harsh Patil', initials: 'HP', branch: 'BCA', passingYear: '2025',
            cgpa: '8.2', lpa: '10', skill: 'Backend',
            skillColor: '#dcfce7', skillTextColor: '#16a34a',
            company: 'Amazon', companyColor: '#c2410c'
        },

        {
            rank: 7, name: 'Neha Shah', initials: 'NS', branch: 'CS', passingYear: '2026',
            cgpa: '8.0', lpa: '8', skill: 'Data Science',
            skillColor: '#dbeafe', skillTextColor: '#2563eb',
            company: 'Apple', companyColor: '#1e293b'
        },

        {
            rank: 8, name: 'Karan Malhotra', initials: 'KM', branch: 'IT', passingYear: '2025',
            cgpa: '7.8', lpa: '7', skill: 'Cloud',
            skillColor: '#ecfeff', skillTextColor: '#0891b2',
            company: 'Suresh Tea House', companyColor: '#475569'
        },
    ];

    const [topStudentsList, setTopStudentsList] = useState(initialStudentsData);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [newStudent, setNewStudent] = useState({
        name: '',
        branch: 'CS',
        passingYear: '2026',
        cgpa: '',
        lpa: '',
        skill: '',
        company: ''
    });

    const [summaryCards, setSummaryCards] = useState({
        placedStudents: '3',
        placementRate: '75%',
        highestPackage: '10,00,000',
        averagePackage: '2,00,000'
    });

    // Load live analytics data from Python backend on mount
    useEffect(() => {
        let isMounted = true;
        const loadAnalytics = async () => {
            try {
                const data = await getAnalytics();
                if (isMounted && data) {
                    if (data.summary) {
                        setSummaryCards({
                            placedStudents: String(data.summary.placedStudents || '3'),
                            placementRate: String(data.summary.placementRate || '75%'),
                            highestPackage: String(data.summary.highestPackage || '10,00,000'),
                            averagePackage: String(data.summary.averagePackage || '2,00,000')
                        });
                    }
                    if (Array.isArray(data.departmentData) && data.departmentData.length > 0) {
                        setDepartmentData(data.departmentData);
                    }
                    if (data.totalStudents) {
                        setTotalStudents(data.totalStudents);
                    }
                    if (Array.isArray(data.cgpaData) && data.cgpaData.length > 0) {
                        setCgpaData(data.cgpaData);
                    }
                    if (Array.isArray(data.skillsData) && data.skillsData.length > 0) {
                        setSkillsData(data.skillsData);
                    }
                    if (Array.isArray(data.topStudents) && data.topStudents.length > 0) {
                        setTopStudentsList(data.topStudents);
                    }
                }
            } catch (err) {
                console.log("[StudentAnalytics] Using offline fallback:", err);
            }
        };
        loadAnalytics();
        return () => { isMounted = false; };
    }, []);

    const handleDeleteStudent = async (rank) => {
        try {
            await deleteTopStudent(rank);
        } catch (err) {
            console.log("Local student remove:", err);
        }
        setTopStudentsList(prev => prev.filter(st => st.rank !== rank).map((st, idx) => ({ ...st, rank: idx + 1 })));
        setToastMessage(`Student removed from Leaderboard.`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleAddStudentSubmit = async (e) => {
        e.preventDefault();
        if (!newStudent.name.trim() || !newStudent.cgpa || !newStudent.lpa || !newStudent.company.trim()) {
            return;
        }

        const nameParts = newStudent.name.trim().split(' ');
        const initials = nameParts.length > 1
            ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
            : nameParts[0].substring(0, 2).toUpperCase();

        const skillColorMap = {
            'Full Stack': { bg: '#f3e8ff', text: '#a855f7' },
            'Data Science': { bg: '#dbeafe', text: '#2563eb' },
            'Backend': { bg: '#dcfce7', text: '#16a34a' },
            'React Native': { bg: '#f3e8ff', text: '#a855f7' },
            'Cloud': { bg: '#ecfeff', text: '#0891b2' },
            'Java': { bg: '#e0e7ff', text: '#4338ca' },
            'Python': { bg: '#fef3c7', text: '#d97706' }
        };

        const selectedSkillTheme = skillColorMap[newStudent.skill] || { bg: '#f1f5f9', text: '#475569' };

        const studentRecord = {
            rank: topStudentsList.length + 1,
            name: newStudent.name.trim(),
            initials: initials,
            branch: newStudent.branch,
            passingYear: newStudent.passingYear,
            cgpa: newStudent.cgpa,
            lpa: newStudent.lpa,
            skill: newStudent.skill || 'Software Eng',
            skillColor: selectedSkillTheme.bg,
            skillTextColor: selectedSkillTheme.text,
            company: newStudent.company.trim(),
            companyColor: '#1e293b'
        };

        try {
            await addTopStudent(studentRecord);
        } catch (err) {
            console.log("Locally saved student:", err);
        }

        setTopStudentsList(prev => [studentRecord, ...prev].map((item, idx) => ({ ...item, rank: idx + 1 })));
        setNewStudent({
            name: '',
            branch: 'CS',
            passingYear: '2026',
            cgpa: '',
            lpa: '',
            skill: '',
            company: ''
        });
        setIsAddModalOpen(false);

        // Show Success Toast Notification
        setToastMessage(`Student "${studentRecord.name}" added to Leaderboard successfully!`);
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
        }, 3500);
    };

    const filteredStudents = topStudentsList.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.passingYear.includes(searchQuery)
    );

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Reset to page 1 whenever search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

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
                <div className="stat-card theme-blue">
                    <div className="stat-text-group">
                        <span className="stat-label">Placed Students</span>
                        <h3 className="stat-value">{summaryCards.placedStudents}</h3>
                        <span className="stat-subtext">Total placed this year</span>
                    </div>
                    <div className="stat-icon-container bg-light-blue">
                        <Users size={22} />
                    </div>
                </div>

                <div className="stat-card theme-green">
                    <div className="stat-text-group">
                        <span className="stat-label">Placement Rate</span>
                        <h3 className="stat-value">{summaryCards.placementRate}</h3>
                        <span className="stat-subtext">% of eligible students placed</span>
                    </div>
                    <div className="stat-icon-container bg-light-green">
                        <TrendingUp size={22} />
                    </div>
                </div>

                <div className="stat-card theme-orange">
                    <div className="stat-text-group">
                        <span className="stat-label">Highest Package</span>
                        <h3 className="stat-value">{summaryCards.highestPackage}</h3>
                        <span className="stat-subtext">Top package offered</span>
                    </div>
                    <div className="stat-icon-container bg-light-orange">
                        <Trophy size={22} />
                    </div>
                </div>

                <div className="stat-card theme-purple">
                    <div className="stat-text-group">
                        <span className="stat-label">Average Package</span>
                        <h3 className="stat-value">{summaryCards.averagePackage}</h3>
                        <span className="stat-subtext">Average package offered</span>
                    </div>
                    <div className="stat-icon-container bg-light-purple">
                        <Wallet size={22} />
                    </div>
                </div>
            </section>

            {/* department wise distribution section */}
            <section className="charts-row">
                <div className="chart-card">
                    <div className="chart-card-header">
                        <h3 className="chart-title">Department Wise Distribution</h3>
                    </div>

                    <div className="dept-chart-body">

                        {/* SVG Donut Chart */}
                        <div className="donut-wrapper">
                            <svg viewBox="0 0 100 100" className="donut-svg">
                                {segments.map((seg, i) => (
                                    <path
                                        key={i}
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
                                <div key={i} className="legend-item">
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
                </div>

                {/*Placement by cgpa bar chart card*/}
                <div className='chart-card'>
                    <div className='chart-card-header'>
                        <h3 className='chart-title'>
                            Placement by CGPA
                        </h3>
                    </div>

                    <div className='bar-chart-wrapper'>
                        <svg viewBox="0 0 280 180" className="bar-chart-svg">

                            {/* y-axis grid lines and labels */}
                            {[0, 10, 20, 30, 40].map((val) => {
                                const y = 20 + ((maxStudents - val) / maxStudents) * 120;
                                return (
                                    <g key={val}>
                                        <line
                                            x1="36" y1={y}
                                            x2="270" y2={y}
                                            stroke="#f1f5f9" strokeWidth="1"
                                        />
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
                                    <g key={i}>
                                        <rect
                                            x={x} y={y}
                                            width={barWidth} height={barHeight}
                                            rx="4" ry="4"
                                            className="bar-rect"
                                        />
                                        <text
                                            x={x + barWidth / 2} y={y - 5}
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

                </div>

                {/* top skills in demand card */}
                <div className="chart-card">
                    <div className="chart-card-header">
                        <h3 className="chart-title">Top Skills in Demand</h3>
                    </div>

                    <div className="skills-chart-body">

                        {/* skill rows */}
                        <div className="skills-rows">
                            {skillsData.map((item, i) => (
                                <div key={i} className="skill-row">
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
                </div>
            </section>

            {/* Top Placed Students Section */}
            <div className="students-table-card">
                <div className="table-card-header">
                    <div className="table-title-group">
                        <h3 className="table-card-title">Top Placed Students</h3>
                        <span className="table-title-badge">Leaderboard</span>
                    </div>
                    <div className="table-header-actions">
                        {!isSearchOpen && !searchQuery ? (
                            <button
                                type="button"
                                className="search-toggle-circle-btn"
                                onClick={() => setIsSearchOpen(true)}
                                title="Search students"
                            >
                                <Search size={16} />
                            </button>
                        ) : (
                            <div className="single-search-input-box">
                                <Search size={15} className="single-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search student..."
                                    className="single-search-field"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="single-search-close-btn"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setIsSearchOpen(false);
                                    }}
                                    title="Close search"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                        <button
                            className="btn-add-top-student"
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            <Plus size={16} /> Add Top Placed Student
                        </button>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="students-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>STUDENT NAME</th>
                                <th>BRANCH</th>
                                <th>PASSING YEAR</th>
                                <th>CGPA</th>
                                <th>LPA</th>
                                <th>SKILLS</th>
                                <th>COMPANY</th>
                                <th style={{ textAlign: 'center' }}>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedStudents.map((student) => (
                                <tr key={student.rank}>
                                    <td>
                                        <span className={`rank-badge rank-${student.rank}`}>
                                            {student.rank}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="student-profile-cell">
                                            <div className="student-avatar">{student.initials}</div>
                                            <span className="student-name">{student.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="branch-badge">{student.branch}</span>
                                    </td>
                                    <td>
                                        <span className="passing-year-text">{student.passingYear}</span>
                                    </td>
                                    <td>
                                        <span className="cgpa-text">{student.cgpa}</span>
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
                                            {COMPANY_LOGOS[student.company] || <Coffee size={16} color="#86efac" style={{ marginRight: '8px', fill: '#86efac', flexShrink: 0 }} />}
                                            <span
                                                className="company-text"
                                                style={{ color: student.companyColor }}
                                            >
                                                {student.company}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteStudent(student.rank)}
                                            title="Remove from Leaderboard"
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', display: 'inline-flex', alignItems: 'center', transition: 'color 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
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
                                className="pagination-btn arrow-btn"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                &larr;
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    className={`pagination-btn num-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
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

            {/* Modal Popup for Adding Top Placed Student */}
            {isAddModalOpen && (
                <div className="analytics-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
                    <div className="analytics-modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="analytics-modal-header">
                            <div>
                                <h3 className="analytics-modal-title">Add Top Placed Student</h3>
                                <p className="analytics-modal-subtitle">Enter details to feature student on the Leaderboard</p>
                            </div>
                            <button className="analytics-modal-close" onClick={() => setIsAddModalOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleAddStudentSubmit} className="analytics-modal-form">
                            <div className="analytics-modal-grid">
                                <div className="modal-group full-span">
                                    <label>Student Full Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Priya Sharma"
                                        value={newStudent.name}
                                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="modal-group">
                                    <label>Branch *</label>
                                    <select
                                        value={newStudent.branch}
                                        onChange={(e) => setNewStudent({ ...newStudent, branch: e.target.value })}
                                        required
                                    >
                                        <option value="CS">CS</option>
                                        <option value="IT">IT</option>
                                        <option value="BCA">BCA</option>
                                    </select>
                                </div>
                                <div className="modal-group">
                                    <label>Passing Year *</label>
                                    <select
                                        value={newStudent.passingYear}
                                        onChange={(e) => setNewStudent({ ...newStudent, passingYear: e.target.value })}
                                        required
                                    >
                                        <option value="2026">2026</option>
                                        <option value="2025">2025</option>
                                        <option value="2024">2024</option>
                                    </select>
                                </div>
                                <div className="modal-group">
                                    <label>CGPA (out of 10) *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        placeholder="e.g. 9.4"
                                        value={newStudent.cgpa}
                                        onChange={(e) => setNewStudent({ ...newStudent, cgpa: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="modal-group">
                                    <label>Package (LPA) *</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        placeholder="e.g. 28"
                                        value={newStudent.lpa}
                                        onChange={(e) => setNewStudent({ ...newStudent, lpa: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="modal-group">
                                    <label>Primary Skill</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Full Stack, Data Science, Backend"
                                        value={newStudent.skill}
                                        onChange={(e) => setNewStudent({ ...newStudent, skill: e.target.value })}
                                    />
                                </div>
                                <div className="modal-group">
                                    <label>Company Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Amazon, Microsoft, Apple"
                                        value={newStudent.company}
                                        onChange={(e) => setNewStudent({ ...newStudent, company: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="analytics-modal-footer">
                                <button type="button" className="btn-modal-cancel" onClick={() => setIsAddModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-modal-submit">
                                    <Plus size={16} /> Add to Leaderboard
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {showToast && (
                <div className="sa-toast-notification success">
                    <div className="sa-toast-content">
                        <CheckCircle className="sa-toast-icon" size={18} />
                        <span>{toastMessage}</span>
                    </div>
                    <div className="sa-toast-progress-bar"></div>
                </div>
            )}

        </div>
    );
}
