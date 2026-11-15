import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function ProtectedRoute({ role = 'recruiter' }) {
  const { currentUser } = useAuth();
  const loginPath = role === 'university' ? '/universite/connexion' : '/recruteur/connexion';
  return currentUser && (currentUser.role || 'recruiter') === role ? <Outlet /> : <Navigate to={loginPath} replace />;
}
