import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppHeader } from '@/components/AppHeader';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Download,
  Calendar,
} from 'lucide-react';
import { EngagementTrendChart } from '@/components/analytics/EngagementTrendChart';
import { ParticipantDistributionChart } from '@/components/analytics/ParticipantDistributionChart';
import { SessionComparisonChart } from '@/components/analytics/SessionComparisonChart';
import { EngagementBreakdownChart } from '@/components/analytics/EngagementBreakdownChart';
import type { Database } from '@/integrations/supabase/types';

type Session = Database['public']['Tables']['sessions']['Row'];
type SessionReport = Database['public']['Tables']['session_reports']['Row'];

const Analytics = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
  const [report, setReport] = useState<SessionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalParticipants: 0,
    avgEngagement: 0,
    totalDuration: 0,
  });

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('host_id', user.id)
        .in('status', ['completed', 'active'])
        .order('created_at', { ascending: false });

      if (data) {
        setSessions(data);
        if (data.length > 0) {
          setSelectedSessionId(data[0].id);
        }
      }
    };

    fetchSessions();
  }, [user]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;
      setLoading(true);

      // Fetch overall stats
      const { count: sessionCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('host_id', user.id)
        .in('status', ['completed', 'active']);

      const { data: participantData } = await supabase
        .from('participants')
        .select('session_id, sessions!inner(host_id)')
        .eq('sessions.host_id', user.id);

      const { data: metricsData } = await supabase
        .from('engagement_metrics')
        .select('attention_score, sessions!inner(host_id)')
        .eq('sessions.host_id', user.id);

      // Calculate stats
      const avgEngagement = metricsData && metricsData.length > 0
        ? metricsData.reduce((sum, m) => sum + (m.attention_score || 0), 0) / metricsData.length
        : 0;

      setStats({
        totalSessions: sessionCount || 0,
        totalParticipants: participantData?.length || 0,
        avgEngagement: Math.round(avgEngagement * 100),
        totalDuration: 0, // Would need to calculate from session durations
      });

      // Fetch specific session report if selected
      if (selectedSessionId !== 'all') {
        const { data: reportData } = await supabase
          .from('session_reports')
          .select('*')
          .eq('session_id', selectedSessionId)
          .maybeSingle();

        setReport(reportData);
      } else {
        setReport(null);
      }

      setLoading(false);
    };

    fetchAnalytics();
  }, [user, selectedSessionId]);

  const exportReport = () => {
    const data = {
      generatedAt: new Date().toISOString(),
      stats,
      selectedSession: selectedSessionId !== 'all' 
        ? sessions.find(s => s.id === selectedSessionId)
        : null,
      report,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engagement-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    {
      icon: BarChart3,
      label: 'Total Sessions',
      value: stats.totalSessions.toString(),
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: Users,
      label: 'Total Participants',
      value: stats.totalParticipants.toString(),
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      icon: TrendingUp,
      label: 'Avg. Engagement',
      value: stats.avgEngagement > 0 ? `${stats.avgEngagement}%` : '—',
      color: stats.avgEngagement >= 70 ? 'text-success' : stats.avgEngagement >= 40 ? 'text-warning' : 'text-muted-foreground',
      bg: stats.avgEngagement >= 70 ? 'bg-success/10' : stats.avgEngagement >= 40 ? 'bg-warning/10' : 'bg-muted',
    },
    {
      icon: Eye,
      label: 'Sessions This Month',
      value: sessions.filter(s => {
        const date = new Date(s.created_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length.toString(),
      color: 'text-info',
      bg: 'bg-info/10',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <AppHeader 
        backTo="/dashboard" 
        backLabel="Dashboard"
        rightContent={
          <Button onClick={exportReport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        }
      />

      <main className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track engagement trends and performance metrics
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
              <SelectTrigger className="w-[240px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat) => (
              <Card key={stat.label} className="glass">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className={`text-2xl font-display font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <EngagementTrendChart 
            sessionId={selectedSessionId !== 'all' ? selectedSessionId : undefined} 
          />
          <ParticipantDistributionChart 
            sessionId={selectedSessionId !== 'all' ? selectedSessionId : undefined}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <SessionComparisonChart sessions={sessions} />
          <EngagementBreakdownChart 
            sessionId={selectedSessionId !== 'all' ? selectedSessionId : undefined}
          />
        </div>
      </main>
    </div>
  );
};

export default Analytics;
