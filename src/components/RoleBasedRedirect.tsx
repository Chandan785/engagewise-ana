import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const RoleBasedRedirect = () => {
  const { isAdmin, isHost, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    // Redirect based on role priority: admin > host > participant
    if (isAdmin) {
      navigate('/admin', { replace: true });
    } else if (isHost) {
      navigate('/host-dashboard', { replace: true });
    } else {
      navigate('/participant-dashboard', { replace: true });
    }
  }, [isAdmin, isHost, loading, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default RoleBasedRedirect;
