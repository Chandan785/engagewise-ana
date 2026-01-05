import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Eye, Focus, UserCheck, Gauge, Brain, Zap } from 'lucide-react';
import { DetectionResult } from '@/hooks/useFaceDetection';

interface EngagementMetricsProps {
  detection: DetectionResult | null;
  isActive: boolean;
}

export const EngagementMetrics = ({ detection, isActive }: EngagementMetricsProps) => {
  const getEngagementLevel = () => {
    if (!detection || !detection.faceDetected) return 'away';
    if (detection.attentionScore >= 0.7) return 'fully_engaged';
    if (detection.attentionScore >= 0.4) return 'partially_engaged';
    return 'passively_present';
  };

  const engagementLevel = getEngagementLevel();
  const attentionPercent = detection ? Math.round(detection.attentionScore * 100) : 0;

  const getLevelConfig = () => {
    switch (engagementLevel) {
      case 'fully_engaged':
        return { 
          label: 'Fully Engaged', 
          color: 'text-success', 
          bg: 'bg-success/10',
          progressColor: 'bg-success'
        };
      case 'partially_engaged':
        return { 
          label: 'Partially Engaged', 
          color: 'text-warning', 
          bg: 'bg-warning/10',
          progressColor: 'bg-warning'
        };
      case 'passively_present':
        return { 
          label: 'Passively Present', 
          color: 'text-accent', 
          bg: 'bg-accent/10',
          progressColor: 'bg-accent'
        };
      default:
        return { 
          label: 'Away', 
          color: 'text-muted-foreground', 
          bg: 'bg-muted',
          progressColor: 'bg-muted-foreground'
        };
    }
  };

  const levelConfig = getLevelConfig();

  const metrics = [
    {
      icon: UserCheck,
      label: 'Face Detection',
      value: detection?.faceDetected ? 'Detected' : 'Not Detected',
      active: detection?.faceDetected || false,
    },
    {
      icon: Eye,
      label: 'Eye Gaze',
      value: detection?.eyeGazeFocused ? 'Focused' : 'Not Focused',
      active: detection?.eyeGazeFocused || false,
    },
    {
      icon: Focus,
      label: 'Head Pose',
      value: detection?.headPoseEngaged ? 'Engaged' : 'Not Engaged',
      active: detection?.headPoseEngaged || false,
    },
  ];

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="font-display flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Engagement Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main engagement score */}
        <div className={`p-4 rounded-xl ${levelConfig.bg} transition-colors duration-300`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className={`h-5 w-5 ${levelConfig.color}`} />
              <span className="font-medium text-foreground">Attention Score</span>
            </div>
            <span className={`text-2xl font-display font-bold ${levelConfig.color}`}>
              {isActive ? `${attentionPercent}%` : '—'}
            </span>
          </div>
          <Progress 
            value={isActive ? attentionPercent : 0} 
            className="h-2"
          />
          <p className={`mt-2 text-sm ${levelConfig.color}`}>
            {isActive ? levelConfig.label : 'Camera inactive'}
          </p>
        </div>

        {/* Individual metrics */}
        <div className="space-y-3">
          {metrics.map((metric) => (
            <div 
              key={metric.label}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
            >
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  metric.active ? 'bg-success/10' : 'bg-muted'
                }`}>
                  <metric.icon className={`h-4 w-4 ${
                    metric.active ? 'text-success' : 'text-muted-foreground'
                  }`} />
                </div>
                <span className="text-sm font-medium text-foreground">{metric.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${
                  metric.active ? 'text-success' : 'text-muted-foreground'
                }`}>
                  {isActive ? metric.value : '—'}
                </span>
                <div className={`h-2 w-2 rounded-full ${
                  metric.active ? 'bg-success' : 'bg-muted-foreground'
                }`} />
              </div>
            </div>
          ))}
        </div>

        {/* Real-time indicator */}
        {isActive && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            Updating in real-time
          </div>
        )}
      </CardContent>
    </Card>
  );
};
