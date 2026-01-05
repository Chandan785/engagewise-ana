import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppHeader } from '@/components/AppHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserRoleManagement from '@/components/admin/UserRoleManagement';
import {
  Shield,
  Users,
  Video,
  BarChart3,
  Settings,
  UserCog,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface UserWithRole {
  user_id: string;
  role: string;
  profile?: {
    full_name: string | null;
    email: string;
  };
}

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [activeSessions, setActiveSessions] = useState(0);
  const [recentUsers, setRecentUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
      });
      navigate('/dashboard');
      return;
    }

    fetchAdminStats();
  }, [isAdmin, navigate]);

  const fetchAdminStats = async () => {
    try {
      // Fetch user roles count
      const { count: userCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });

      setTotalUsers(userCount || 0);

      // Fetch sessions count
      const { count: sessionCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true });

      setTotalSessions(sessionCount || 0);

      // Fetch active sessions
      const { count: activeCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setActiveSessions(activeCount || 0);

      // Fetch recent user roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentUsers(roles as UserWithRole[] || []);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Total Users', value: totalUsers.toString(), icon: Users, color: 'bg-blue-500/10 text-blue-500' },
    { label: 'Total Sessions', value: totalSessions.toString(), icon: Video, color: 'bg-purple-500/10 text-purple-500' },
    { label: 'Active Sessions', value: activeSessions.toString(), icon: Activity, color: 'bg-green-500/10 text-green-500' },
    { label: 'System Status', value: 'Healthy', icon: Shield, color: 'bg-emerald-500/10 text-emerald-500' },
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-500/10 text-blue-500';
      case 'host':
        return 'bg-primary/10 text-primary';
      case 'participant':
        return 'bg-green-500/10 text-green-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <AppHeader />

      <main className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">System overview and user management.</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="glass hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    {loading ? (
                      <Skeleton className="h-9 w-16" />
                    ) : (
                      <p className="text-3xl font-display font-bold text-foreground">{stat.value}</p>
                    )}
                  </div>
                  <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs for Overview and User Management */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Users */}
              <Card className="lg:col-span-2 glass">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-display flex items-center gap-2">
                      <UserCog className="h-5 w-5" />
                      Recent User Roles
                    </CardTitle>
                    <CardDescription>Latest user role assignments.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                      ))}
                    </div>
                  ) : recentUsers.length > 0 ? (
                    <div className="space-y-3">
                      {recentUsers.map((user, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <Users className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground font-mono text-sm">
                                {user.user_id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No user roles found.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Admin Actions */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="font-display">Admin Actions</CardTitle>
                  <CardDescription>Manage system and users.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/host-dashboard">
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="mr-3 h-4 w-4" />
                      View Host Dashboard
                    </Button>
                  </Link>
                  <Link to="/sessions">
                    <Button variant="outline" className="w-full justify-start">
                      <Video className="mr-3 h-4 w-4" />
                      Manage Sessions
                    </Button>
                  </Link>
                  <Link to="/analytics">
                    <Button variant="outline" className="w-full justify-start">
                      <Activity className="mr-3 h-4 w-4" />
                      View Analytics
                    </Button>
                  </Link>
                  <Link to="/profile">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="mr-3 h-4 w-4" />
                      Settings
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <UserRoleManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
