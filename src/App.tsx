import React, { useState } from 'react';
import axios from 'axios';
import { CourseProvider } from './contexts/CourseContext';
import { Layout } from './components/Layout';
import { HomePage } from './components/HomePage';
import { LogIn } from './components/LogIn';
import { SignUp } from './components/SignUp';
import { CoursesPage } from './components/CoursesPage';
import { CourseViewer } from './components/CourseViewer';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));
  const [showLoginToast, setShowLoginToast] = useState(false);

  const handleNavigate = async (page: string) => {
    if (page === 'logout') {
      try {
        await axios.post('https://ailearning-atyu.onrender.com', {}, { withCredentials: true });

        console.log('Logout successful');
      } catch (error) {
        console.error('Logout error:', error);
      }
      localStorage.removeItem('authToken');
      setIsAuthenticated(false);
      setCurrentPage('home');
    } else {
      setCurrentPage(page);
      if (page !== 'home' || !showLoginToast) {
        setShowLoginToast(false);
      }
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} showLoginToast={showLoginToast} isAuthenticated={isAuthenticated} />;
      case 'courses':
        return <CoursesPage onNavigate={handleNavigate} />;
      case 'course':
        return <CourseViewer onNavigate={handleNavigate} />;
      case 'profile':
        return (
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Profile</h2>
            <p className="text-gray-600">Profile page coming soon!</p>
          </div>
        );
      case 'LogIn':
        return (
          <LogIn
      onNavigate={handleNavigate}
      setAuthenticated={setIsAuthenticated}
    />
        );
        case 'SignUp':
  return (
    <SignUp
      onNavigate={handleNavigate}
      setAuthenticated={setIsAuthenticated}
    />
  );
      case 'settings':
        return (
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Settings</h2>
            <p className="text-gray-600">Settings page coming soon!</p>
          </div>
        );
      default:
        return <HomePage onNavigate={handleNavigate} showLoginToast={showLoginToast} />;
    }
  };

    return (
  <CourseProvider onNavigate={handleNavigate} isAuthenticated={isAuthenticated}>
    <Layout currentPage={currentPage} onNavigate={handleNavigate} isAuthenticated={isAuthenticated}>
      {renderPage()}
    </Layout>
  </CourseProvider>
);
}

export default App;