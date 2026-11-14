import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, homeFor } from '../context/AuthContext.jsx';
import Layout from './Layout.jsx';

export default function ProtectedRoute({ role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
