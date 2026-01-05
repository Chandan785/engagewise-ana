import { RefObject, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, CameraOff, AlertCircle, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DetectionResult } from '@/hooks/useFaceDetection';

interface VideoFeedProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  detection: DetectionResult | null;
  onStart: () => void;
  onStop: () => void;
}

export const VideoFeed = ({
  videoRef,
  canvasRef,
  isActive,
  isLoading,
  error,
  detection,
  onStart,
  onStop,
}: VideoFeedProps) => {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Draw face detection overlay
  useEffect(() => {
    if (!overlayCanvasRef.current || !videoRef.current || !isActive) return;

    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detection?.faceDetected && detection.boundingBox) {
      const box = detection.boundingBox;
      
      // Draw bounding box
      ctx.strokeStyle = detection.attentionScore >= 0.7 ? '#22c55e' : 
                        detection.attentionScore >= 0.4 ? '#f59e0b' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      
      // Draw rounded rectangle
      const radius = 12;
      ctx.beginPath();
      ctx.moveTo(box.xMin + radius, box.yMin);
      ctx.lineTo(box.xMin + box.width - radius, box.yMin);
      ctx.quadraticCurveTo(box.xMin + box.width, box.yMin, box.xMin + box.width, box.yMin + radius);
      ctx.lineTo(box.xMin + box.width, box.yMin + box.height - radius);
      ctx.quadraticCurveTo(box.xMin + box.width, box.yMin + box.height, box.xMin + box.width - radius, box.yMin + box.height);
      ctx.lineTo(box.xMin + radius, box.yMin + box.height);
      ctx.quadraticCurveTo(box.xMin, box.yMin + box.height, box.xMin, box.yMin + box.height - radius);
      ctx.lineTo(box.xMin, box.yMin + radius);
      ctx.quadraticCurveTo(box.xMin, box.yMin, box.xMin + radius, box.yMin);
      ctx.closePath();
      ctx.stroke();

      // Draw corner accents
      const cornerLength = 20;
      ctx.lineWidth = 4;
      ctx.setLineDash([]);
      
      // Top-left
      ctx.beginPath();
      ctx.moveTo(box.xMin, box.yMin + cornerLength);
      ctx.lineTo(box.xMin, box.yMin);
      ctx.lineTo(box.xMin + cornerLength, box.yMin);
      ctx.stroke();
      
      // Top-right
      ctx.beginPath();
      ctx.moveTo(box.xMin + box.width - cornerLength, box.yMin);
      ctx.lineTo(box.xMin + box.width, box.yMin);
      ctx.lineTo(box.xMin + box.width, box.yMin + cornerLength);
      ctx.stroke();
      
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(box.xMin, box.yMin + box.height - cornerLength);
      ctx.lineTo(box.xMin, box.yMin + box.height);
      ctx.lineTo(box.xMin + cornerLength, box.yMin + box.height);
      ctx.stroke();
      
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(box.xMin + box.width - cornerLength, box.yMin + box.height);
      ctx.lineTo(box.xMin + box.width, box.yMin + box.height);
      ctx.lineTo(box.xMin + box.width, box.yMin + box.height - cornerLength);
      ctx.stroke();
    }
  }, [detection, isActive, videoRef]);

  const getEngagementColor = () => {
    if (!detection || !detection.faceDetected) return 'border-muted';
    if (detection.attentionScore >= 0.7) return 'border-success';
    if (detection.attentionScore >= 0.4) return 'border-warning';
    return 'border-destructive';
  };

  return (
    <Card className={`glass overflow-hidden transition-colors duration-300 ${getEngagementColor()}`}>
      <CardContent className="p-0 relative">
        {/* Hidden canvas for frame analysis */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Video feed */}
        <div className="relative aspect-video bg-secondary/50">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isActive ? 'block' : 'hidden'}`}
          />
          
          {/* Detection overlay canvas */}
          {isActive && (
            <canvas 
              ref={overlayCanvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
          )}
          
          {/* Overlay when not active */}
          {!isActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              {error ? (
                <>
                  <AlertCircle className="h-12 w-12 text-destructive" />
                  <p className="text-destructive text-center px-4">{error}</p>
                  <Button onClick={onStart} variant="outline">
                    Retry
                  </Button>
                </>
              ) : (
                <>
                  <CameraOff className="h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground text-center">
                    Camera is off
                  </p>
                  <Button onClick={onStart} disabled={isLoading}>
                    <Camera className="mr-2 h-4 w-4" />
                    {isLoading ? 'Loading AI Model...' : 'Start Camera'}
                  </Button>
                </>
              )}
            </div>
          )}
          
          {/* Detection overlay */}
          {isActive && detection && (
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                  detection.faceDetected 
                    ? 'bg-success/20 text-success border border-success/30' 
                    : 'bg-warning/20 text-warning border border-warning/30'
                }`}>
                  {detection.faceDetected ? '● Face Detected' : '○ No Face'}
                </div>
                <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30 flex items-center gap-1.5">
                  <Brain className="h-3 w-3" />
                  AI Detection
                </div>
              </div>
              
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={onStop}
                className="backdrop-blur-sm bg-secondary/80"
              >
                <CameraOff className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Live indicator */}
          {isActive && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/90 text-destructive-foreground text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
              LIVE
            </div>
          )}
          
          {/* Attention score badge */}
          {isActive && detection?.faceDetected && (
            <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm text-foreground text-xs font-medium border border-border">
              Attention: {Math.round(detection.attentionScore * 100)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
