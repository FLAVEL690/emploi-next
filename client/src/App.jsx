import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import DashboardLayout from './components/layout/DashboardLayout';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import PostJob from './pages/recruiter/PostJob';
import MyJobs from './pages/recruiter/MyJobs';
import JobApplications from './pages/recruiter/JobApplications';
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import MyApplications from './pages/candidate/MyApplications';
import SavedJobs from './pages/candidate/SavedJobs';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminJobs from './pages/admin/AdminJobs';
import AdminAds from './pages/admin/AdminAds';
import './index.css';
import './App.css';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/jobs" element={<PublicLayout><Jobs /></PublicLayout>} />
          <Route path="/jobs/:id" element={<PublicLayout><JobDetail /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />

          <Route path="/recruiter" element={
            <ProtectedRoute roles={['recruiter', 'admin']}>
              <Navbar />
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<RecruiterDashboard />} />
            <Route path="jobs" element={<MyJobs />} />
            <Route path="jobs/:jobId" element={<JobApplications />} />
            <Route path="post-job" element={<PostJob />} />
          </Route>

          <Route path="/candidate" element={
            <ProtectedRoute roles={['candidate']}>
              <Navbar />
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<CandidateDashboard />} />
            <Route path="applications" element={<MyApplications />} />
            <Route path="saved" element={<SavedJobs />} />
          </Route>

          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <Navbar />
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="jobs" element={<AdminJobs />} />
            <Route path="ads" element={<AdminAds />} />
          </Route>

          <Route path="/profile" element={
            <ProtectedRoute roles={['admin', 'recruiter', 'candidate']}>
              <Navbar />
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Profile />} />
          </Route>

          <Route path="/notifications" element={
            <ProtectedRoute roles={['admin', 'recruiter', 'candidate']}>
              <Navbar />
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Notifications />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
