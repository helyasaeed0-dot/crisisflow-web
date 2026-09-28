import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, homePathFor } from '../context/AuthContext';
import Spinner from './Spinner';

// Only lets users with one of the given roles through
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner fullScreen label="Checking session..." />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />;
  }

  return children;
}