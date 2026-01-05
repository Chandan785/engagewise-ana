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

  const hasData = data.length > 0 && data.some(d => d.duration > 0);

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <CardTitle className="font-display flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-info" />
          Session Duration Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No completed sessions yet</p>
            <p className="text-sm">Complete sessions to see duration comparison</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
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
        )}
      </CardContent>
    </Card>
  );
};
