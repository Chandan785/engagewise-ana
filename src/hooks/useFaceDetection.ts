import { useState, useEffect, useRef, useCallback } from 'react';

export interface DetectionResult {
  faceDetected: boolean;
  eyeGazeFocused: boolean;
  headPoseEngaged: boolean;
  attentionScore: number;
  boundingBox: {
    xMin: number;
    yMin: number;
    width: number;
    height: number;
  } | null;
}

export interface FaceDetectionState {
  isLoading: boolean;
  isActive: boolean;
  error: string | null;
  detection: DetectionResult | null;
  cameraStream: MediaStream | null;
}

export const useFaceDetection = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastDetectionRef = useRef<DetectionResult | null>(null);
  const frameCountRef = useRef(0);
  
  const [state, setState] = useState<FaceDetectionState>({
    isLoading: false,
    isActive: false,
    error: null,
    detection: null,
    cameraStream: null,
  });

  // Advanced face detection using canvas pixel analysis
  const analyzeFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.readyState !== 4) return lastDetectionRef.current;

    // Set canvas size to match video
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;
    
    // Draw current frame
    ctx.drawImage(video, 0, 0, width, height);
    
    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Analyze for skin tone regions (face detection proxy)
    let skinPixels: { x: number; y: number }[] = [];
    const step = 4; // Sample every 4th pixel for performance
    
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Enhanced skin tone detection (works for various skin tones)
        const isSkinTone = 
          r > 60 && g > 40 && b > 20 &&
          r > g && r > b &&
          Math.abs(r - g) > 10 &&
          r - b > 10 &&
          r < 250 && g < 230 && b < 210;
        
        if (isSkinTone) {
          skinPixels.push({ x, y });
        }
      }
    }
    
    const totalPixels = (width * height) / (step * step);
    const skinRatio = skinPixels.length / totalPixels;
    
    // Determine if face is likely present (significant skin tone region)
    const faceDetected = skinRatio > 0.08 && skinRatio < 0.5;
    
    let boundingBox = null;
    let eyeGazeFocused = false;
    let headPoseEngaged = false;
    
    if (faceDetected && skinPixels.length > 50) {
      // Calculate bounding box of skin region
      const xs = skinPixels.map(p => p.x);
      const ys = skinPixels.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      
      // Expand bounding box slightly
      const padding = 20;
      boundingBox = {
        xMin: Math.max(0, minX - padding),
        yMin: Math.max(0, minY - padding),
        width: Math.min(width - minX + padding * 2, maxX - minX + padding * 2),
        height: Math.min(height - minY + padding * 2, maxY - minY + padding * 2),
      };
      
      // Check if face is centered (head pose proxy)
      const faceCenterX = (minX + maxX) / 2;
      const faceCenterY = (minY + maxY) / 2;
      const centerThresholdX = width * 0.25;
      const centerThresholdY = height * 0.25;
      
      headPoseEngaged = 
        Math.abs(faceCenterX - width / 2) < centerThresholdX &&
        Math.abs(faceCenterY - height / 2) < centerThresholdY;
      
      // Eye gaze estimation based on face symmetry
      const leftSide = skinPixels.filter(p => p.x < faceCenterX).length;
      const rightSide = skinPixels.filter(p => p.x >= faceCenterX).length;
      const symmetryRatio = Math.min(leftSide, rightSide) / Math.max(leftSide, rightSide);
      eyeGazeFocused = symmetryRatio > 0.7;
    }
    
    // Calculate attention score
    let attentionScore = 0;
    if (faceDetected) attentionScore += 0.4;
    if (eyeGazeFocused) attentionScore += 0.35;
    if (headPoseEngaged) attentionScore += 0.25;
    
    const detection: DetectionResult = {
      faceDetected,
      eyeGazeFocused,
      headPoseEngaged,
      attentionScore: Math.min(1, attentionScore),
      boundingBox,
    };
    
    lastDetectionRef.current = detection;
    return detection;
  }, []);

  const detectLoop = useCallback(() => {
    frameCountRef.current++;
    
    // Analyze every 3rd frame for performance
    if (frameCountRef.current % 3 === 0) {
      const detection = analyzeFrame();
      if (detection) {
        setState(prev => ({ ...prev, detection }));
      }
    }
    
    animationRef.current = requestAnimationFrame(detectLoop);
  }, [analyzeFrame]);

  const startDetection = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isActive: true,
        cameraStream: stream,
      }));
      
      // Start detection loop
      frameCountRef.current = 0;
      animationRef.current = requestAnimationFrame(detectLoop);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [detectLoop]);

  const stopDetection = useCallback(() => {
    // Stop animation loop
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Stop camera stream
    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach(track => track.stop());
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setState({
      isLoading: false,
      isActive: false,
      error: null,
      detection: null,
      cameraStream: null,
    });
  }, [state.cameraStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (state.cameraStream) {
        state.cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    ...state,
    startDetection,
    stopDetection,
  };
};
