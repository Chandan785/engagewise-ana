import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Gauge, Eye, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SessionStatsProps {
  sessionId: string;
  startedAt: string | null;
}

export const SessionStats = ({ sessionId, startedAt }: SessionStatsProps) => {
  const [stats, setStats] = useState({
    participantCount: 0,
    avgEngagement: 0,
    avgAttention: 0,
    lowEngagementAlerts: 0,
  });
  const [duration, setDuration] = useState('00:00:00');

  useEffect(() => {
    const fetchStats = async () => {
      // Get participant count
      const { count: participantCount } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .is('left_at', null);

      // Get latest metrics
      const { data: metrics } = await supabase
        .from('engagement_metrics')
        .select('attention_score, engagement_level')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (metrics && metrics.length > 0) {
        const avgAttention = metrics.reduce((sum, m) => sum + (m.attention_score || 0), 0) / metrics.length;
        const lowEngagement = metrics.filter(m => 
          m.engagement_level === 'passively_present' || m.engagement_level === 'away'
        ).length;

        setStats({
          participantCount: participantCount || 0,
          avgEngagement: Math.round(avgAttention * 100),
          avgAttention: Math.round(avgAttention * 100),
          lowEngagementAlerts: lowEngagement,
        });
      } else {
        setStats({
          participantCount: participantCount || 0,
          avgEngagement: 0,
          avgAttention: 0,
          lowEngagementAlerts: 0,
        });
      }
    };

    fetchStats();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`session-stats-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'engagement_metrics',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Update duration timer
  useEffect(() => {
    if (!startedAt) return;

    const updateDuration = () => {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      const diff = now - start;

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setDuration(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  const statItems = [
    {
      icon: Users,
      label: 'Participants',
      value: stats.participantCount.toString(),
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: Gauge,
      label: 'Avg. Engagement',
      value: stats.avgEngagement > 0 ? `${stats.avgEngagement}%` : '—',
      color: stats.avgEngagement >= 70 ? 'text-success' : stats.avgEngagement >= 40 ? 'text-warning' : 'text-muted-foreground',
      bg: stats.avgEngagement >= 70 ? 'bg-success/10' : stats.avgEngagement >= 40 ? 'bg-warning/10' : 'bg-muted',
    },
    {
      icon: Eye,
      label: 'Avg. Attention',
      value: stats.avgAttention > 0 ? `${stats.avgAttention}%` : '—',
      color: stats.avgAttention >= 70 ? 'text-success' : stats.avgAttention >= 40 ? 'text-warning' : 'text-muted-foreground',
      bg: stats.avgAttention >= 70 ? 'bg-success/10' : stats.avgAttention >= 40 ? 'bg-warning/10' : 'bg-muted',
    },
    {
      icon: Clock,
      label: 'Duration',
      value: startedAt ? duration : '—',
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat) => (
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

      {stats.lowEngagementAlerts > 0 && (
        <Card className="glass border-warning/30 col-span-2 lg:col-span-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Low Engagement Alert</p>
                <p className="text-sm text-muted-foreground">
                  {stats.lowEngagementAlerts} participants showing reduced attention
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
