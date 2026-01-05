import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppHeader } from '@/components/AppHeader';
import {
  Plus,
  Video,
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  Calendar,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Session {
  id: string;
  title: string;
  status: string;
  scheduled_at: string | null;
  started_at: string | null;
  created_at: string;
}

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        setSessions(data as Session[]);
      }
      setLoadingSessions(false);
    };

    if (user) {
      fetchSessions();
    }
  }, [user]);

  const stats = [
    { label: 'Total Sessions', value: sessions.length.toString(), icon: Video, trend: '+12%' },
    { label: 'Active Participants', value: '0', icon: Users, trend: '+8%' },
    { label: 'Avg. Engagement', value: '—', icon: TrendingUp, trend: '—' },
    { label: 'Hours Analyzed', value: '0', icon: Clock, trend: '—' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'scheduled':
        return 'bg-info text-info-foreground';
      case 'completed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <AppHeader />

      <main className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Host Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'Host'}. Monitor and analyze engagement.
              </p>
            </div>
          </div>
          <Link to="/session/new">
            <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              New Session
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="glass hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-display font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                {stat.trend !== '—' && (
                  <p className="text-sm text-success mt-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stat.trend} from last week
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Sessions */}
          <Card className="lg:col-span-2 glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display">Recent Sessions</CardTitle>
                <CardDescription>Your latest meeting sessions and their status.</CardDescription>
              </div>
              <Link to="/sessions">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loadingSessions ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <Link
                      key={session.id}
                      to={`/session/${session.id}`}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Video className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{session.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {session.scheduled_at
                              ? new Date(session.scheduled_at).toLocaleDateString()
                              : new Date(session.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${getStatusColor(
                            session.status
                          )}`}
                        >
                          {session.status}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">No sessions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first session to start analyzing engagement.
                  </p>
                  <Link to="/session/new">
                    <Button className="bg-gradient-primary hover:opacity-90">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Session
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="font-display">Quick Actions</CardTitle>
              <CardDescription>Common tasks and navigation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/session/new">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-3 h-4 w-4" />
                  Create New Session
                </Button>
              </Link>
              <Link to="/sessions">
                <Button variant="outline" className="w-full justify-start">
                  <Video className="mr-3 h-4 w-4" />
                  View All Sessions
                </Button>
              </Link>
              <Link to="/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-3 h-4 w-4" />
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
      </main>
    </div>
  );
};

export default Dashboard;
