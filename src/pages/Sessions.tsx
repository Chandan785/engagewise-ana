import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AppHeader } from '@/components/AppHeader';
import {
  Plus,
  Video,
  Calendar,
  Clock,
  Users,
  ChevronRight,
  Search,
  Filter,
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Session = Database['public']['Tables']['sessions']['Row'];
type SessionStatus = Database['public']['Enums']['session_status'];

const Sessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | SessionStatus>('all');

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setSessions(data);
      }
      setLoading(false);
    };

    fetchSessions();
  }, [user]);

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = activeTab === 'all' || session.status === activeTab;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success border-success/20';
      case 'scheduled':
        return 'bg-info/10 text-info border-info/20';
      case 'completed':
        return 'bg-muted text-muted-foreground border-border';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIcon = (status: SessionStatus) => {
    switch (status) {
      case 'active':
        return <span className="h-2 w-2 rounded-full bg-success animate-pulse" />;
      case 'scheduled':
        return <Calendar className="h-3 w-3" />;
      case 'completed':
        return <Clock className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const sessionCounts = {
    all: sessions.length,
    scheduled: sessions.filter(s => s.status === 'scheduled').length,
    active: sessions.filter(s => s.status === 'active').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    cancelled: sessions.filter(s => s.status === 'cancelled').length,
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <AppHeader 
        backTo="/dashboard" 
        backLabel="Dashboard"
        rightContent={
          <Link to="/session/new">
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">New Session</span>
            </Button>
          </Link>
        }
      />

      <main className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-1">Sessions</h1>
            <p className="text-muted-foreground">Manage your engagement tracking sessions.</p>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="glass mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>{filteredSessions.length} sessions</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="all" className="gap-2">
              All
              <span className="hidden sm:inline text-xs bg-secondary px-1.5 py-0.5 rounded-md">
                {sessionCounts.all}
              </span>
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="gap-2">
              Scheduled
              <span className="hidden sm:inline text-xs bg-secondary px-1.5 py-0.5 rounded-md">
                {sessionCounts.scheduled}
              </span>
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              Active
              <span className="hidden sm:inline text-xs bg-secondary px-1.5 py-0.5 rounded-md">
                {sessionCounts.active}
              </span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              Completed
              <span className="hidden sm:inline text-xs bg-secondary px-1.5 py-0.5 rounded-md">
                {sessionCounts.completed}
              </span>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="gap-2">
              Cancelled
              <span className="hidden sm:inline text-xs bg-secondary px-1.5 py-0.5 rounded-md">
                {sessionCounts.cancelled}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredSessions.length > 0 ? (
              <div className="space-y-4">
                {filteredSessions.map((session) => (
                  <Link key={session.id} to={`/session/${session.id}`}>
                    <Card className="glass hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                              <Video className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-display font-semibold text-foreground truncate">
                                  {session.title}
                                </h3>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize border flex items-center gap-1.5 ${getStatusColor(session.status)}`}>
                                  {getStatusIcon(session.status)}
                                  {session.status}
                                </span>
                              </div>
                              {session.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                  {session.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDate(session.scheduled_at || session.created_at)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Users className="h-3.5 w-3.5" />
                                  0 participants
                                </span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="glass">
                <CardContent className="py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">
                    {searchQuery ? 'No sessions found' : 'No sessions yet'}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Create your first session to start tracking engagement.'}
                  </p>
                  {!searchQuery && (
                    <Link to="/session/new">
                      <Button className="bg-gradient-primary hover:opacity-90">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Session
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Sessions;
