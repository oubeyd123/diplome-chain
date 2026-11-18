import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
const Landing = lazy(() => import('./pages/Landing'));
const RecruiterVerify = lazy(() => import('./pages/RecruiterVerify'));
const UniversityDashboard = lazy(() => import('./pages/UniversityDashboard'));
const UniversityLogin = lazy(() => import('./pages/UniversityLogin'));
const NotFound = lazy(() => import('./pages/NotFound'));
function PublicLayout({ children }) { return <><Navbar /><main id="main" tabIndex={-1} className="wrap page">{children}</main><Footer /></>; }
function RoutedApp() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); document.getElementById('main')?.focus(); }, [pathname]);
  return <><a className="skip-link" href="#main" onClick={e => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Aller au contenu</a>
    <Suspense fallback={<p className="wrap page" role="status">Chargement de la page…</p>}>
      <Routes>
        <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
        <Route path="/recruteur/connexion" element={<Navigate to="/recruteur/verifier" replace />} />
        <Route path="/recruteur/verifier" element={<PublicLayout><RecruiterVerify /></PublicLayout>} />
        <Route path="/universite/connexion" element={<PublicLayout><UniversityLogin /></PublicLayout>} />
        <Route element={<ProtectedRoute role="university" />}><Route path="/universite" element={<UniversityDashboard />} /></Route>
        <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
      </Routes>
    </Suspense></>;
}
export default function App() { return <HashRouter><AuthProvider><RoutedApp /></AuthProvider></HashRouter>; }
