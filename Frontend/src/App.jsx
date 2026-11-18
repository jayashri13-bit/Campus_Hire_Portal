import { useState } from "react";
import { AnimatePresence, motion } from 'framer-motion';
import LandingPage from './pages/public/LandingPage';
import Registration from './pages/public/Registration';
import Login from "./pages/public/Login";
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDashboard from "./pages/student/StudentDashboard";
import ChatbotWidget from "./components/chatbot/ChatbotWidget";


function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    if (path.startsWith('/reset-password') || search.includes('token=') || search.includes('email=')) {
      return 'login';
    }
    if (path === '/student') {
      return 'student';
    }
    if (path === '/admin') {
      return 'admin';
    }
    return 'landing';
  });

  const navigateTo = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);

    // Sync browser URL bar dynamically
    if (page === 'admin') window.history.pushState(null, '', '/admin');
    else if (page === 'student') window.history.pushState(null, '', '/student');
    else if (page === 'login') window.history.pushState(null, '', '/login');
    else if (page === 'register') window.history.pushState(null, '', '/register');
    else window.history.pushState(null, '', '/');
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          style={{ minHeight: '100vh', width: '100%' }}
        >
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
        </motion.div>
      </AnimatePresence>

      {/* Chatbot — only visible on student and admin pages */}
      {(currentPage === 'student' || currentPage === 'admin') && (
        <ChatbotWidget />
      )}
    </>
  );
}

export default App;