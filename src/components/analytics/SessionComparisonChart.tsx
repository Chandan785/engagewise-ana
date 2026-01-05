import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Database } from '@/integrations/supabase/types';

type Session = Database['public']['Tables']['sessions']['Row'];

interface SessionComparisonChartProps {
  sessions: Session[];
}

export const SessionComparisonChart = ({ sessions }: SessionComparisonChartProps) => {
  // Calculate duration for each session
  const data = sessions.slice(0, 6).map((session) => {
    let durationMinutes = 0;
    
    if (session.started_at && session.ended_at) {
      const start = new Date(session.started_at).getTime();
      const end = new Date(session.ended_at).getTime();
      durationMinutes = Math.round((end - start) / 60000);
    }

    return {
      name: session.title.length > 15 ? session.title.slice(0, 15) + '...' : session.title,
      duration: durationMinutes,
      status: session.status,
    };
  }).reverse();

  // If no real data, show demo
  const chartData = data.length > 0 && data.some(d => d.duration > 0) ? data : [
    { name: 'Team Sync', duration: 45, status: 'completed' },
    { name: 'Sprint Review', duration: 60, status: 'completed' },
    { name: 'Training', duration: 90, status: 'completed' },
    { name: 'Workshop', duration: 120, status: 'completed' },
    { name: 'Standup', duration: 15, status: 'completed' },
  ];

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <CardTitle className="font-display flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-info" />
          Session Duration Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={11}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickFormatter={(value) => `${value}m`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value} minutes`, 'Duration']}
            />
            <Bar 
              dataKey="duration" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]}
              name="Duration"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
