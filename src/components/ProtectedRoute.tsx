import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Activity } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireHost?: boolean;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireHost = false, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading, isHost, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center animate-pulse">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to auth page but save the attempted location
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireHost && !isHost) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
