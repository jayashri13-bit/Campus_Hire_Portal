import { useState, useEffect } from "react";
import LandingPage from './pages/public/LandingPage';
import Registration from './pages/public/Registration';
import Login from "./pages/public/Login";
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDashboard from "./pages/student/StudentDashboard";

function resolvePage(path, search) {
  const token = localStorage.getItem("token");
  const storedRole = localStorage.getItem("role");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const role = (storedRole || storedUser?.role || "").toLowerCase();

  if (path.startsWith('/reset-password') || search.includes('token=') || search.includes('email=')) {
    return 'login';
  }

  if (path === '/admin') {
    if (token && role === 'admin') return 'admin';
    if (token && role === 'student') return 'student'; // Prevent student from accessing admin page
    return 'login'; // Redirect to login if not logged in
  }

  if (path === '/student') {
    if (token && role === 'student') return 'student';
    if (token && role === 'admin') return 'admin'; // Prevent admin from accessing student page
    return 'login'; // Redirect to login if not logged in
  }

  if (path === '/login') return 'login';
  if (path === '/register') return 'register';

  return 'landing';
}

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    return resolvePage(window.location.pathname, window.location.search);
  });

  useEffect(() => {
    const handlePopState = () => {
      const page = resolvePage(window.location.pathname, window.location.search);
      setCurrentPage(page);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync browser address bar URL when route guard resolves/redirects page
  useEffect(() => {
    const targetUrl = currentPage === 'admin' ? '/admin'
      : currentPage === 'student' ? '/student'
      : currentPage === 'login' ? '/login'
      : currentPage === 'register' ? '/register'
      : '/';

    if (window.location.pathname !== targetUrl) {
      window.history.replaceState(null, '', targetUrl);
    }
  }, [currentPage]);

  const navigateTo = (page) => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const role = (storedRole || storedUser?.role || "").toLowerCase();

    let targetPage = page;

    // Role Guard Check
    if (page === 'admin' && role !== 'admin') {
      targetPage = role === 'student' ? 'student' : 'login';
    } else if (page === 'student' && role !== 'student') {
      targetPage = role === 'admin' ? 'admin' : 'login';
    }

    setCurrentPage(targetPage);
    window.scrollTo(0, 0);

    // Sync browser URL bar dynamically
    if (targetPage === 'admin') window.history.pushState(null, '', '/admin');
    else if (targetPage === 'student') window.history.pushState(null, '', '/student');
    else if (targetPage === 'login') window.history.pushState(null, '', '/login');
    else if (targetPage === 'register') window.history.pushState(null, '', '/register');
    else window.history.pushState(null, '', '/');
  };

  return (
    <>
      {currentPage === 'landing' && (
        <LandingPage onNavigate={navigateTo} />
      )}

      {currentPage === 'register' && (
        <Registration onNavigate={navigateTo} />
      )}

      {currentPage === 'login' && (
        <Login 
          onNavigate={navigateTo} 
          initialView={
            window.location.pathname.startsWith('/reset-password') || 
            window.location.search.includes('token=') || 
            window.location.search.includes('email=') 
              ? 'reset' 
              : 'login'
          } 
        />
      )}

      {currentPage === 'admin' && (
        <AdminDashboard onNavigate={navigateTo} />
      )}

      {currentPage === 'student' && (
        <StudentDashboard onNavigate={navigateTo} />
      )}
    </>
  );
}

export default App;