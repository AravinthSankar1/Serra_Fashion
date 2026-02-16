import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedAdminRoute = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) return <div>Loading...</div>;

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedAdminRoute;
