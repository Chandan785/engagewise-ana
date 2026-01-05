import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppHeader } from '@/components/AppHeader';
import { toast } from 'sonner';
import {
  Video,
  ExternalLink,
  Calendar,
  Users,
  Loader2,
  Wifi,
} from 'lucide-react';

interface ActiveSession {
  id: string;
  session_id: string;
  joined_at: string | null;
  consent_given: boolean;
  session: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    started_at: string | null;
    meeting_link: string | null;
  } | null;
}

const ParticipantDashboard = () => {
  const { user, profile } = useAuth();
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveSessions = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('participants')
      .select(`
        id,
        session_id,
        joined_at,
        consent_given,
        session:sessions (
          id,
          title,
          description,
          status,
          started_at,
          meeting_link
        )
      `)
      .eq('user_id', user.id);

    if (data) {
      const active = (data as unknown as ActiveSession[]).filter(
        p => p.session?.status === 'active'
      );
      setActiveSessions(active);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchActiveSessions();
    }
  }, [user, fetchActiveSessions]);

  // Real-time subscription for session status changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('session-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
        },
        (payload) => {
          const updatedSession = payload.new as { id: string; status: string; title: string };
          
          // If a session became active, refresh and notify
          if (updatedSession.status === 'active') {
            fetchActiveSessions();
            toast.success('A session just went live!', {
              description: updatedSession.title,
              action: {
                label: 'View',
                onClick: () => window.location.reload(),
              },
            });
          }
          
          // If a session ended, remove it from the list
          if (updatedSession.status === 'completed' || updatedSession.status === 'cancelled') {
            setActiveSessions(prev => 
              prev.filter(s => s.session?.id !== updatedSession.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchActiveSessions]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <AppHeader />

      <main className="container py-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Welcome, {profile?.full_name?.split(' ')[0] || 'Participant'}
          </h1>
          <p className="text-muted-foreground max-w-md">
            Join live sessions you've been invited to. Active meetings will appear below.
          </p>
        </div>

        {/* Live Sessions */}
        <Card className="glass max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="font-display flex items-center justify-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Live Sessions
              <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground ml-2">
                <Wifi className="h-3 w-3 text-green-500" />
                Real-time
              </span>
            </CardTitle>
            <CardDescription>
              Sessions that are currently active and waiting for you to join.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : activeSessions.length > 0 ? (
              <div className="space-y-4">
                {activeSessions.map((participation) => (
                  <div
                    key={participation.id}
                    className="p-5 rounded-xl bg-secondary/50 border border-border/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                          </span>
                          <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                            Live Now
                          </span>
                        </div>
                        <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                          {participation.session?.title || 'Untitled Session'}
                        </h3>
                        {participation.session?.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {participation.session.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Started {participation.session?.started_at
                            ? new Date(participation.session.started_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                            : 'recently'}
                        </p>
                      </div>
                      <Link to={`/live/${participation.session_id}`}>
                        <Button className="bg-gradient-primary hover:opacity-90 gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Join Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-20 w-20 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  No Live Sessions
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  There are no active sessions right now. When a host starts a session you're invited to, it will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link to="/session-history">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Past Sessions
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Edit your profile →
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ParticipantDashboard;
