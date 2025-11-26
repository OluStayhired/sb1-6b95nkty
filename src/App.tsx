import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import LinkedInAuthRedirect from './components/LinkedInAuthRedirect'; 
import { ThemeProvider } from './context/ThemeContext';
import { HooksProvider } from './context/HooksContext';
import { BlogListPage } from './components/BlogListPage'; 
import { BlogPostPage } from './components/BlogPostPage';
import AccountantPage from './pages/AccountantPage';
import CoachesPage from './pages/CoachesPage';
import RecruitersPage from './pages/RecruitersPage';
import { PoetiqPage } from './pages/PoetiqLandingPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  //const { isAuthenticated } = useAuth();
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  //if (isLoading) {
    //return <div>Loading...</div>;
  //}

  // **Show loading state while authentication status is being determined**
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }


  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/" state={{ from: location }} replace />
  );
}

// AppRoutes component
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/blog" element={<BlogListPage />} />
      <Route path="blog/:slug" element={<BlogPostPage />} /> 
      <Route path="/linkedin" element={<AccountantPage />} />
      <Route path="/poetiq" element={<AccountantPage />} />
      <Route path="linkedin/linkedin-for-accountants" element={<AccountantPage />} />
      <Route path="linkedin/linkedin-for-coaches" element={<CoachesPage />} />
      <Route path="linkedin/linkedin-for-recruiters" element={<RecruitersPage />} />
      <Route path="poetiq/home" element={<PoetiqPage />} />
      <Route
        path="/dashboard/*"
        element={
          <PrivateRoute>
            {/*
              Wrap Dashboard with HooksProvider here.
              Dashboard and its children (like ContentCalendarModal)
              will now have access to hooksData via useHooks().
            */}
            <HooksProvider>
              <Dashboard />
            </HooksProvider>
          </PrivateRoute>
        }
      />
      {/*<Route path="/linkedin-auth" element={<LinkedInAuthRedirect />} />  If you still need this route */}
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;