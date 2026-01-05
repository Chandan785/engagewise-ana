import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppHeader } from '@/components/AppHeader';
import {
  Video,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  ChevronRight,
} from 'lucide-react';

interface PastSession {
  id: string;
  session_id: string;
  joined_at: string | null;
  left_at: string | null;
  consent_given: boolean;
  session: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    started_at: string | null;
    ended_at: string | null;
  } | null;
}

const SessionHistory = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<PastSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionHistory = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('participants')
        .select(`
          id,
          session_id,
          joined_at,
          left_at,
          consent_given,
          session:sessions (
            id,
            title,
            description,
            status,
            started_at,
            ended_at
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (data) {
        // Filter only completed sessions
        const completed = (data as unknown as PastSession[]).filter(
          p => p.session?.status === 'completed'
        );
        setSessions(completed);
      }
      setLoading(false);
    };

    if (user) {
      fetchSessionHistory();
    }
  }, [user]);

  const formatDuration = (startedAt: string | null, endedAt: string | null) => {
    if (!startedAt || !endedAt) return 'Unknown duration';
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <AppHeader />

      <main className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/participant-dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Session History
            </h1>
            <p className="text-muted-foreground">
              View all your past completed sessions
            </p>
          </div>
        </div>

        {/* Session List */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Completed Sessions
            </CardTitle>
            <CardDescription>
              Sessions you participated in that have ended
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((participation) => (
                  <Link
                    key={participation.id}
                    to={`/session/${participation.session_id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors border border-border/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Video className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {participation.session?.title || 'Untitled Session'}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {participation.session?.started_at
                              ? new Date(participation.session.started_at).toLocaleDateString()
                              : 'Unknown date'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDuration(
                              participation.session?.started_at || null,
                              participation.session?.ended_at || null
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-20 w-20 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  No Past Sessions
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  You haven't completed any sessions yet. Once you participate in a session that ends, it will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SessionHistory;
