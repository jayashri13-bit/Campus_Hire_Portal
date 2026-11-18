import { easeOut, motion } from 'framer-motion';
import './LandingPage.css';
import { useState, useEffect } from 'react';
import {
    getLandingPublicStats,
    getLandingRecentActivity
} from '../../auth/authService';
import {
    GraduationCap,
    ArrowRight,
    ChevronRight,
    Users,
    Award,
    Building2,
    TrendingUp,
    Upload,
    Briefcase,
    CheckCircle2,
    Bell,
    BarChart3,
    ShieldCheck,
    UserPlus,
    LogIn
} from 'lucide-react';

function LandingPage({ onNavigate }) {
    const chartData = [
        { month: 'Sep', placements: 28, left: '2%', top: '78%' },
        { month: 'Oct', placements: 45, left: '18.5%', top: '63%' },
        { month: 'Nov', placements: 38, left: '35%', top: '67%' },
        { month: 'Dec', placements: 40, left: '51.5%', top: '63%' },
        { month: 'Jan', placements: 52, left: '68%', top: '50%' },
        { month: 'Feb', placements: 60, left: '84.5%', top: '42%' },
        { month: 'Mar', placements: 72, left: '98%', top: '28%' }
    ];

    const [activePoint, setActivePoint] = useState(chartData[1]);

    const [stats, setStats] = useState({
        totalStudents: 39,
        totalPlacements: 18,
        totalCompanies: 18,
        placementRate: 46.15
    });

    const [recentActivity, setRecentActivity] = useState([
        { companyName: "Amazon", jobRoleOverview: "Full Stack Developer", location: "Pune", tag: "Now Hiring" },
        { companyName: "Accenture", jobRoleOverview: "Web Developer", location: "Dehradun ", tag: "Now Hiring" },
        { companyName: "Infosys", jobRoleOverview: "Backend developer", location: "Bangalore, India", tag: "Now Hiring" }
    ]);

    useEffect(() => {
        // Fetch Public Stats
        getLandingPublicStats()
            .then((res) => {
                if (res?.data) {
                    setStats({
                        totalStudents: res.data.totalStudents ?? 0,
                        totalPlacements: res.data.totalPlacements ?? 0,
                        totalCompanies: res.data.totalCompanies ?? 0,
                        placementRate: res.data.placementRate ?? 0
                    });
                }
            })
            .catch((err) => console.error("Error fetching landing public stats:", err));

        // Fetch Recent Activity
        getLandingRecentActivity()
            .then((res) => {
                if (Array.isArray(res?.data) && res.data.length > 0) {
                    setRecentActivity(res.data);
                }
            })
            .catch((err) => console.error("Error fetching landing recent activity:", err));
    }, []);

    return (
        <div className='landing-page'>
            <header className='navbar'>
                <div className='nav-container'>
                    <div className='logo-section'>
                        <GraduationCap className='logo-icon' size={28} style={{ color: '#2563eb' }} />
                        <span className='college-name' style={{ fontSize: '1.25rem', fontWeight: '800', color: '#2563eb' }}>Campus_Hire</span>
                    </div>
                    <nav className='nav-menu'>
                        <a href="#home">Home</a>
                        <a href="#features">Features</a>
                        <a href="#about">About</a>
                    </nav>
                </div>
            </header>
            <main className='hero-section'>
                <div className='hero-container'>
                    <motion.div
                        className='hero-left'
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className='hero-badge'>Campus Recruitment Platform</div>
                        <h1>College <span className='text-highlight'>Placement</span> Portal</h1>
                        <h2>Connecting Students with Placement Opportunities</h2>
                        <p>Manage placements, upload resumes, and track your placement journey from one centralized platform  -  built for students and the placement cell.</p>

                        <div className='hero-buttons'>
                            <button type="button" className='btn-register' onClick={() => onNavigate('register')}>Register Now <ArrowRight size={18} />
                            </button>
                            <button type="button" className='btn-login' onClick={() => onNavigate('login')}>Login <ChevronRight size={18} />
                            </button>
                        </div>
                    </motion.div>

                    <motion.div className='hero-right'
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: easeOut }}>
                        <div className='dashboard-card'>
                            <div className='card-header'>
                                <div className='header-left'>
                                    <div className='window-dots'>
                                        <span className='dot red'></span>
                                        <span className='dot yellow'></span>
                                        <span className='dot green'></span>
                                    </div>
                                    <span className='card-title'>Placement Dashboard</span>
                                </div>
                            </div>
                            <div className='stats-grid'>
                                <div className='stat-box'>
                                    <span className='stat-label'>Total Students</span>
                                    <div className='stat-row'>
                                        <span className='stat-value'>{stats.totalStudents}</span>
                                        <span className='stat-change'>Live</span>
                                    </div>
                                </div>
                                <div className='stat-box'>
                                    <span className='stat-label'>Placements</span>
                                    <div className='stat-row'>
                                        <span className='stat-value'>{stats.totalPlacements}</span>
                                        <span className='stat-change'>Live</span>
                                    </div>
                                </div>
                                <div className='stat-box'>
                                    <span className='stat-label'>Companies</span>
                                    <div className='stat-row'>
                                        <span className='stat-value'>{stats.totalCompanies}</span>
                                        <span className='stat-change'>Live</span>
                                    </div>
                                </div>
                            </div>
                            <div className="chart-section">
                                <div className="chart-header">
                                    <span className="chart-title">Placement Trend</span>
                                    <span className="chart-year">AY 2025-26</span>
                                </div>
                                <div className='chart-wrapper'>
                                    <svg viewBox="0 0 400 100" className="trend-chart" preserveAspectRatio='none'>
                                        <defs>
                                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M 0 80 C 4 79, 6 78, 8 78 C 40 73, 50 63, 74 63 C 98 63, 110 68, 140 67 C 170 66, 180 63, 206 63 C 232 63, 250 53, 272 50 C 294 47, 310 44, 338 42 C 366 40, 380 30, 392 28 C 394 28, 396 27, 400 26 L 400 100 L 0 100 Z" fill="url(#chartGradient)" />
                                        <path d="M 0 80 C 4 79, 6 78, 8 78 C 40 73, 50 63, 74 63 C 98 63, 110 68, 140 67 C 170 66, 180 63, 206 63 C 232 63, 250 53, 272 50 C 294 47, 310 44, 338 42 C 366 40, 380 30, 392 28 C 394 28, 396 27, 400 26" fill="none" stroke="#63A8FF" strokeWidth="3" />
                                    </svg>
                                    {activePoint && (
                                        <>
                                            <div className='chart-tooltip' style={{ left: activePoint.left, top: activePoint.top }}>
                                                <span className='tooltip-month'>{activePoint.month}</span>
                                                <span className='tooltip-value'>placements : {activePoint.placements}</span>
                                            </div>
                                            <div className='chart-tooltip-dot' style={{ left: activePoint.left, top: activePoint.top }}></div>
                                            <div className='chart-tooltip-line' style={{ left: activePoint.left }}></div>
                                        </>
                                    )}
                                    <div className="hover-zones">
                                        {chartData.map((point) => (
                                            <div
                                                key={point.month}
                                                className="hover-zone"
                                                onMouseEnter={() => setActivePoint(point)}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="chart-months">
                                    <span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span>
                                </div>
                            </div>
                            <div className='activity-list'>
                                {recentActivity.map((item, index) => {
                                    const badgeTag = item.tag || item.location || 'Now Hiring';
                                    const lowerTag = badgeTag.toLowerCase();
                                    let badgeClass = 'applied';
                                    if (lowerTag.includes('offer')) badgeClass = 'offer';
                                    else if (lowerTag.includes('interview')) badgeClass = 'interview';
                                    else if (lowerTag.includes('hiring') || lowerTag.includes('now')) badgeClass = 'applied';

                                    return (
                                        <div key={index} className='activity-item'>
                                            <div className='company-info'>
                                                <span className='company-name'>{item.companyName}</span>
                                                <span className='job-role'>{item.jobRoleOverview || item.location}</span>
                                            </div>
                                            <span className={`status-badge ${badgeClass}`}>
                                                {badgeTag}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    </motion.div>
                </div>
                <div className="wave-container">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0,50 C360,95 720,30 1080,85 C1260,110 1440,95 1440,95 L1440,120 L0,120 Z" fill="#ffffff" />
                    </svg>
                </div>
            </main >

            <section className='stats-section'>
                <div className='stats-container'>
                    <div className='stats-card'>
                        <div className='stat-icon-wrapper gray-theme'>
                            <Users className='stat-icon' size={20} />
                        </div>
                        <h3>{stats.totalStudents}+</h3>
                        <p>Students</p>
                    </div>
                    <div className='stats-card'>
                        <div className='stat-icon-wrapper blue-theme'>
                            <Award className='stat-icon' size={20} />
                        </div>
                        <h3>{stats.totalPlacements}+</h3>
                        <p>Placements</p>
                    </div>
                    <div className='stats-card'>
                        <div className='stat-icon-wrapper gray-theme'>
                            <Building2 className='stat-icon' size={20} />
                        </div>
                        <h3>{stats.totalCompanies}+</h3>
                        <p>Companies</p>
                    </div>
                    <div className='stats-card'>
                        <div className='stat-icon-wrapper blue-theme'>
                            <TrendingUp className='stat-icon' size={20} />
                        </div>
                        <h3>{typeof stats.placementRate === 'number' ? stats.placementRate.toFixed(2) : stats.placementRate}%</h3>
                        <p>Placement Rate</p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className='features-container'>
                    <div className='features-header'>
                        <span className='features-badge'>PLATFORM FEATURES</span>
                        <h2>Everything You Need For Campus Placements</h2>
                        <p>
                            For resume management to real-time selection tracking - College Placement Portal covers every step of the placement journey.
                        </p>
                    </div>
                    <div className='features-grid'>
                        {/* Upload Resume */}
                        <div className='feature-card'>
                            <div className='feature-icon-wrapper'>
                                <Upload size={20} className='feature-icon' />
                            </div>
                            <h3>Upload Resume</h3>
                            <p>Easily upload and manage your resume. Keep it updated and share it with recruiters with a single click.</p>
                        </div>

                        {/* Placement Opportunities */}
                        <div className='feature-card'>
                            <div className='feature-icon-wrapper'>
                                <Briefcase size={20} className='feature-icon' />
                            </div>
                            <h3>Placement Opportunities</h3>
                            <p>
                                Browse curated job listings from top companies visiting campus for placement drives.
                            </p>
                        </div>

                        {/* Selection Status */}
                        <div className='feature-card'>
                            <div className='feature-icon-wrapper'>
                                <CheckCircle2 size={20} className='feature-icon' />
                            </div>
                            <h3>Selection Status</h3>
                            <p>Track your application status in real-time — from shortlisting to offer letter.</p>
                        </div>

                        {/* Smart Notifications */}
                        <div className='feature-card'>
                            <div className='feature-icon-wrapper'>
                                <Bell size={20} className='feature-icon' />
                            </div>
                            <h3>Smart Notifications</h3>
                            <p>
                                Get instant alerts for new drives, interview schedules, and important announcements.
                            </p>
                        </div>

                        {/* Analytics Dashboard */}
                        <div className='feature-card'>
                            <div className='feature-icon-wrapper'>
                                <BarChart3 size={20} className='feature-icon' />
                            </div>
                            <h3>Analytics Dashboard</h3>
                            <p>
                                Visualize placement trends, company-wise data, and your personal performance metrics.
                            </p>
                        </div>

                        {/* Secure Authentication */}
                        <div className='feature-card'>
                            <div className='feature-icon-wrapper'>
                                <ShieldCheck size={20} className='feature-icon' />
                            </div>
                            <h3>Secure Authentication</h3>
                            <p>
                                Role-based access control ensures students, coordinators, and admins see only what they need.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section id='about' className='about-section'>
                <div className='about-container'>
                    <div className='about-left'>
                        <span className='about-badge'>About the Portal</span>
                        <h2>Built For Students and Placement Coordinators</h2>
                        <p> The College Placement Portal is a centralized platform that helps students and the
                            placement cell manage placement activities efficiently — from drive announcements
                            to final offer letters.</p>
                        <p>
                            Designed in collaboration with placement officers, the portal eliminates paperwork,
                            reduces communication gaps, and gives every stakeholder a clear, real-time view of
                            the placement pipeline.
                        </p>
                    </div>
                    <div className='about-right'>
                        {/* Card 1 Automated Workflows */}
                        <div className='about-card'>
                            <h3>Automated Workflows</h3>
                            <p>Eliminate manual paperwork by digitizing resume submissions, job drive registrations, and coordinator approvals.</p>
                        </div>

                        {/* Card 2 Real Time Tracking */}
                        <div className='about-card'>
                            <h3>Real-Time Tracking</h3>
                            <p>Get instant notifications on application status changes, shortlist announcements, and selection results.</p>
                        </div>

                        {/* Card 3 Student Dashboard */}
                        <div className='about-card'>
                            <h3>Student Dashboard</h3>
                            <p>Apply to drives, upload documents, track application progress, and view interview timelines from a single page.</p>
                        </div>

                        {/* Card 4 Admin Dashboard */}
                        <div className='about-card'>
                            <h3>Admin Dashboard</h3>
                            <p>Gain full visibility into campus placement statistics, drive coordination, and user role management.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* White Spacer Section */}
            <div className="white-spacer-section"></div>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-container">
                    <h2>Ready to Start Your Placement Journey?</h2>
                    <p>Join 500+ students already using <strong>College Placement Portal</strong> to land their dream jobs.</p>
                    <div className="cta-buttons">
                        <button type="button" className="btn-create-account" onClick={() => onNavigate('register')}>
                            <UserPlus size={16} />
                            Register Now
                        </button>
                        <button type="button" className="btn-sign-in" onClick={() => onNavigate('login')}>
                            <LogIn size={16} />
                            Sign In
                        </button>
                    </div>
                </div>
            </section>

        </div>
    );
}

export default LandingPage;
