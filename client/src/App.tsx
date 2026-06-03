import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PublicRoute from './components/PublicRoute';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPassword from './pages/ResetPassword.tsx';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Todos from './pages/Todos';
import Blogs from './pages/Blogs';
import CreateBlog from './pages/CreateBlog';
import BlogDetail from './pages/BlogDetail';
import PublicBlogs from './pages/PublicBlogs';
import PublicBlogDetail from './pages/PublicBlogDetail';
import MyBlogs from './pages/MyBlogs';
import LandingPage from './pages/LandingPage';
import UserProfile from './pages/UserProfile';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing Page Route */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Public Explore Routes */}
            <Route path="/explore" element={<PublicBlogs />} />
            <Route path="/explore/:blogId" element={<PublicBlogDetail />} />

            {/* Public Routes - Auto-redirect to dashboard if logged in */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* Protected Routes - accessible only if logged in */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Note: /dashboard is now an absolute path */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/todos" element={<Todos />} />
              <Route path="/blogs">
                <Route index element={<Blogs />} />
                <Route path="create" element={<CreateBlog />} />
                <Route path=":blogId" element={<BlogDetail />} />
                <Route path="my-blogs" element={<MyBlogs />} />
              </Route>
              <Route path="/profile/:userId" element={<UserProfile />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
