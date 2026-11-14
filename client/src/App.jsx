import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, homeFor } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Companies from './pages/admin/Companies.jsx';
import CompanyDetail from './pages/admin/CompanyDetail.jsx';
import ProjectDetail from './pages/admin/ProjectDetail.jsx';
import MyProjects from './pages/customer/MyProjects.jsx';
import MyProjectDetail from './pages/customer/MyProjectDetail.jsx';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={homeFor(user.role)} replace /> : <Login />} />

      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<Companies />} />
        <Route path="/admin/companies/:id" element={<CompanyDetail />} />
        <Route path="/admin/projects/:id" element={<ProjectDetail />} />
      </Route>

      <Route element={<ProtectedRoute role="customer" />}>
        <Route path="/app" element={<MyProjects />} />
        <Route path="/app/projects/:id" element={<MyProjectDetail />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? homeFor(user.role) : '/login'} replace />} />
    </Routes>
  );
}
