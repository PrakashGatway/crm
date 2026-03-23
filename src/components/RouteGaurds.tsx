import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/UserContext';
import FullScreenLoader from './fullScreeLoader';

// Protected Route - only for authenticated users
export const ProtectedRoute = ({ roles }: any) => {
  const { user, loading } = useAuth() as any;

  if (loading) return <FullScreenLoader />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (!user) return <Navigate to="/signin" replace />;

  return <Outlet />;
};

// Auth Route - only for non-authenticated users
export const AuthRoute = () => {
  const { user } = useAuth() as any;

  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
};