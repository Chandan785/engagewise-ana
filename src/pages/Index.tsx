import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Activity,
  Video,
  BarChart3,
  Users,
  Eye,
  Shield,
  ArrowRight,
  CheckCircle2,
  Zap,
  Brain,
  LineChart,
  MonitorCheck,
  Gauge,
  FileText,
  Building2,
  GraduationCap,
  ChevronRight,
  Play,
  Camera,
  Hand,
  Laptop,
  LayoutDashboard,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import ImageLightbox from '@/components/ImageLightbox';

// Import feature images
import faceRecognitionImg from '@/assets/face-recognition.png';
import gestureDetectionImg from '@/assets/gesture-detection.png';
import windowActivityImg from '@/assets/window-activity.png';
import engagementScoringImg from '@/assets/engagement-scoring.png';
import participantAnalyticsImg from '@/assets/participant-analytics.png';
import reportGenerationImg from '@/assets/report-generation.png';

// Import demo video
import dashboardDemoVideo from '@/assets/dashboard-demo.mp4';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } }
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } }
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } }
};

const Index = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const problemStats = [
    { value: '67%', label: 'of virtual meeting participants admit to multitasking' },
    { value: '85%', label: 'of managers can\'t accurately assess remote participation' },
    { value: '42%', label: 'productivity loss due to disengaged meetings' },
  ];

  const features = [
    {
      icon: Camera,
      title: 'Real-Time Face Recognition',
      description: 'Advanced AI detects face presence, orientation, and attention signals in real-time without storing video footage.',
      details: ['Face detection & tracking', 'Head pose estimation', 'Gaze direction analysis', 'Expression recognition'],
      image: faceRecognitionImg,
    },
    {
      icon: Hand,
      title: 'Gesture & Attention Detection',
      description: 'Monitor behavioral signals like hand raises, gestures, and active participation indicators.',
      details: ['Hand raise detection', 'Gesture recognition', 'Active typing detection', 'Microphone engagement'],
      image: gestureDetectionImg,
    },
    {
      icon: MonitorCheck,
      title: 'Window Activity Monitoring',
      description: 'Detect when participants switch to other applications or lose focus on the meeting window.',
      details: ['Tab switching detection', 'Application focus tracking', 'Screen share engagement', 'Browser activity signals'],
      image: windowActivityImg,
    },
    {
      icon: Gauge,
      title: 'Intelligent Engagement Scoring',
      description: 'Multi-factor weighted algorithms combine all signals into objective, explainable engagement scores.',
      details: ['Configurable weights', 'Real-time scoring', 'Trend analysis', 'Anomaly detection'],
      image: engagementScoringImg,
    },
    {
      icon: BarChart3,
      title: 'Participant-Level Analytics',
      description: 'Individual engagement profiles with historical trends and comparative analysis.',
      details: ['Individual dashboards', 'Historical tracking', 'Peer comparison', 'Progress metrics'],
      image: participantAnalyticsImg,
    },
    {
      icon: FileText,
      title: 'Comprehensive Report Generation',
      description: 'Auto-generated reports with visualizations, insights, and actionable recommendations.',
      details: ['PDF export', 'Custom branding', 'Scheduled reports', 'API access'],
      image: reportGenerationImg,
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Host Creates Session',
      description: 'Set up your meeting with engagement tracking enabled. Configure consent options and privacy settings.',
    },
    {
      step: '02',
      title: 'Participants Join & Consent',
      description: 'Attendees opt-in to engagement tracking with clear, transparent privacy disclosures.',
    },
    {
      step: '03',
      title: 'AI Analyzes in Real-Time',
      description: 'Our privacy-first AI processes behavioral signals without recording or storing video.',
    },
    {
      step: '04',
      title: 'Review & Act on Insights',
      description: 'Access comprehensive reports with individual and aggregate engagement metrics.',
    },
  ];

  const useCases = [
    {
      icon: Building2,
      title: 'Corporate',
      stats: '40%',
      description: 'improvement in meeting effectiveness',
      features: ['Team standup analysis', 'Training engagement', 'Leadership meetings', 'Client presentations'],
    },
    {
      icon: GraduationCap,
      title: 'Academic',
      stats: '30%',
      description: 'increase in student participation',
      features: ['Lecture engagement', 'Student attention tracking', 'Participation grading', 'Remote proctoring'],
    },
    {
      icon: Users,
      title: 'Enterprise',
      stats: '600+',
      description: 'participants per session',
      features: ['Large-scale webinars', 'Town hall meetings', 'Cross-team collaboration', 'Executive briefings'],
    },
  ];

  const technologies = [
    { name: 'TensorFlow.js', description: 'In-browser ML' },
    { name: 'WebRTC', description: 'Real-time comm' },
    { name: 'MediaPipe', description: 'Face detection' },
    { name: 'React', description: 'Modern UI' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">
                Focus<span className="text-gradient">Track</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
              <a href="#use-cases" className="text-muted-foreground hover:text-foreground transition-colors">Use Cases</a>
              <a href="#dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/auth">
                <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-md">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.15)_0%,_transparent_60%)]" />
        
        <div className="container relative py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in border border-primary/20">
              <Zap className="h-4 w-4" />
              AI-Powered Engagement Analytics
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 animate-slide-up">
              Stop Guessing Who's{' '}
              <br className="hidden sm:block" />
              Actually <span className="text-gradient">Engaged</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Real-time AI analytics for virtual meetings. Measure attention, not just attendance. 
              Fair, objective, and privacy-first.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25 text-lg px-8 w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 group"
                onClick={() => setIsDemoOpen(true)}
              >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-success" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>GDPR Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-success" />
                <span>No Video Storage</span>
              </div>
            </div>
          </div>

          {/* Hero Dashboard Preview - Video Demo */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-3xl opacity-50" />
            <Card className="relative glass shadow-2xl overflow-hidden border-2 border-primary/10">
              <CardContent className="p-0">
                <div className="bg-secondary/80 px-4 py-3 flex items-center gap-2 border-b border-border">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-destructive" />
                    <div className="h-3 w-3 rounded-full bg-warning" />
                    <div className="h-3 w-3 rounded-full bg-success" />
                  </div>
                  <span className="text-sm text-muted-foreground ml-2">Live Engagement Dashboard</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs text-success font-medium">LIVE</span>
                  </div>
                </div>
                <div className="relative aspect-video bg-background">
                  <video
                    src={dashboardDemoVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 bg-secondary/30">
        <div className="container">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              The Virtual Meeting Engagement Gap
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Traditional video conferencing tells you who attended. It doesn't tell you who was actually paying attention.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {problemStats.map((stat, i) => (
              <motion.div 
                key={i} 
                className="text-center p-6 rounded-2xl bg-background border border-border hover:border-primary/30 transition-all hover:shadow-lg group"
                variants={scaleIn}
              >
                <p className="font-display text-5xl font-bold text-gradient mb-3">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="mt-12 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <p className="text-lg font-medium text-foreground mb-2">Why is Attendance Misleading?</p>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Being in a meeting doesn't mean being engaged. Studies show that up to 70% of virtual meeting time 
              is spent multitasking, checking emails, or browsing other content.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              <Brain className="h-4 w-4" />
              Powerful Analytics
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Powerful Features for Complete<br />Engagement Tracking
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From facial recognition to comprehensive reporting, every tool you need for objective engagement analysis.
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div 
                key={feature.title}
                className={`py-12 border-b border-border last:border-0 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeIn}
              >
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <motion.div 
                    className={index % 2 === 1 ? 'lg:order-2' : ''}
                    variants={index % 2 === 0 ? slideInLeft : slideInRight}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                  >
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-primary mb-6 shadow-glow">
                      <feature.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-foreground mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-lg mb-6">
                      {feature.description}
                    </p>
                    <motion.div 
                      className="grid grid-cols-2 gap-3"
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={staggerContainer}
                    >
                      {feature.details.map((detail) => (
                        <motion.div 
                          key={detail} 
                          className="flex items-center gap-2 text-sm"
                          variants={fadeInUp}
                        >
                          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                          <span className="text-foreground">{detail}</span>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                  <motion.div 
                    className={index % 2 === 1 ? 'lg:order-1' : ''}
                    variants={index % 2 === 0 ? slideInRight : slideInLeft}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                  >
                    <Card 
                      className="glass overflow-hidden border-2 border-border/50 hover:border-primary/30 transition-all group/card cursor-zoom-in"
                      onClick={() => setLightboxImage({ src: feature.image, alt: feature.title })}
                    >
                      <CardContent className="p-0">
                        <img 
                          src={feature.image} 
                          alt={feature.title}
                          className="w-full h-auto object-cover rounded-lg transition-transform duration-500 group-hover/card:scale-105"
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-secondary/30">
        <div className="container">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our seamless integration process.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {howItWorks.map((item, i) => (
              <motion.div key={item.step} className="relative group" variants={scaleIn}>
                <Card className="glass h-full border-2 border-border/50 hover:border-primary/30 transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="font-display text-5xl font-bold text-primary/20 mb-4">{item.step}</div>
                    <h3 className="font-display text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </CardContent>
                </Card>
                {i < howItWorks.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-primary/30 h-8 w-8" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-20">
        <div className="container">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Built for Corporate & Academic Excellence
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Trusted by educators, teams, and enterprises worldwide.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {useCases.map((useCase) => (
              <motion.div key={useCase.title} variants={scaleIn}>
                <Card className="glass border-2 border-border/50 hover:border-primary/30 transition-all hover:shadow-lg overflow-hidden group h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <useCase.icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-semibold text-foreground">{useCase.title}</h3>
                        <p className="text-xs text-muted-foreground">Excellence</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <span className="font-display text-4xl font-bold text-gradient">{useCase.stats}</span>
                      <p className="text-sm text-muted-foreground">{useCase.description}</p>
                    </div>
                    <ul className="space-y-2">
                      {useCase.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Complete Analytics Dashboard */}
      <section id="dashboard" className="py-20 bg-secondary/30">
        <div className="container">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Complete Analytics Dashboard
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to understand and improve engagement, in one powerful interface.
            </p>
          </motion.div>

          <motion.div 
            className="max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={scaleIn}
          >
            <Card className="glass shadow-2xl overflow-hidden border-2 border-primary/10">
              <CardContent className="p-0">
                <div className="bg-secondary/80 px-4 py-3 flex items-center justify-between border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-destructive" />
                      <div className="h-3 w-3 rounded-full bg-warning" />
                      <div className="h-3 w-3 rounded-full bg-success" />
                    </div>
                    <span className="text-sm text-muted-foreground ml-2">Analytics Dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="p-6 lg:p-8 min-h-[400px] flex items-center justify-center bg-gradient-to-b from-secondary/30 to-background">
                  <div className="text-center">
                    <BarChart3 className="h-20 w-20 text-primary/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Interactive Dashboard Preview</p>
                    <Link to="/dashboard" className="inline-block mt-4">
                      <Button variant="outline" size="sm">
                        Explore Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20">
        <div className="container">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Built on Industry-Leading Technology
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade AI processing with privacy-first architecture.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {technologies.map((tech) => (
              <motion.div key={tech.name} variants={scaleIn}>
                <Card className="glass text-center hover:border-primary/30 transition-all h-full">
                  <CardContent className="p-6">
                    <h4 className="font-display font-semibold text-foreground mb-1">{tech.name}</h4>
                    <p className="text-sm text-muted-foreground">{tech.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={scaleIn}
          >
            <Card className="bg-gradient-primary text-primary-foreground max-w-4xl mx-auto overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_50%)]" />
              <CardContent className="p-8 lg:p-12 text-center relative">
                <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                  Ready to Transform Your Meetings?
                </h2>
                <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                  Join educators and teams using AI-powered analytics to build more engaging, 
                  fair, and productive virtual sessions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/auth">
                    <Button size="lg" variant="secondary" className="text-lg px-8 shadow-lg w-full sm:w-auto">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    Schedule Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/20">
        <div className="container py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-display text-xl font-bold text-foreground">
                  Focus<span className="text-gradient">Track</span>
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                AI-powered engagement analytics for virtual meetings. Fair, objective, privacy-first.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="#use-cases" className="hover:text-foreground transition-colors">Use Cases</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 FocusTrack. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-success" />
                SOC 2 Type II
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-success" />
                GDPR Compliant
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        imageSrc={lightboxImage?.src || ''}
        imageAlt={lightboxImage?.alt || ''}
      />

      {/* Watch Demo Dialog */}
      <Dialog open={isDemoOpen} onOpenChange={setIsDemoOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              FocusTrack Demo
            </DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video bg-background">
            <video
              src={dashboardDemoVideo}
              autoPlay
              loop
              controls
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;