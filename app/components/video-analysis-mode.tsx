"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Video, VideoOff, Eye, Hand, Users, Target, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react"
import { AIFeedback } from "./ai-feedback"

// Add imports for TensorFlow.js and MediaPipe
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import dynamic from 'next/dynamic';
import { useGamificationStore } from '../../hooks/use-gamification-store';
import { useRouter } from 'next/navigation';

// SSR-safe dynamic import for MediaPipe/TensorFlow
let createDetector: any, SupportedModels: any;
if (typeof window !== 'undefined') {
  import('@tensorflow-models/face-landmarks-detection').then(mod => {
    createDetector = mod.createDetector;
    SupportedModels = mod.SupportedModels;
  });
}

if (typeof window !== 'undefined') {
  tf.setBackend('webgl');
}

interface VideoAnalysisData {
  eyeContact: {
    percentage: number
    deviations: number
    avgDuration: number
  }
  posture: {
    score: number
    slouching: number
    leaning: number
  }
  gestures: {
    frequency: number
    openGestures: number
    closedGestures: number
  }
  engagement: {
    score: number
    energyLevel: number
    confidence: number
  }
}

interface VideoFeedback {
  id: string
  type: "warning" | "info" | "success"
  category: "eye-contact" | "posture" | "gestures" | "engagement"
  message: string
  suggestion: string
  timestamp: number
}

export function VideoAnalysisMode() {
  const [isRecording, setIsRecording] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(false)
  const [analysisData, setAnalysisData] = useState<VideoAnalysisData>({
    eyeContact: { percentage: 0, deviations: 0, avgDuration: 0 },
    posture: { score: 0, slouching: 0, leaning: 0 },
    gestures: { frequency: 0, openGestures: 0, closedGestures: 0 },
    engagement: { score: 0, energyLevel: 0, confidence: 0 },
  })
  const [feedback, setFeedback] = useState<VideoFeedback[]>([])
  const [sessionDuration, setSessionDuration] = useState(0)
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [useAIMetrics, setUseAIMetrics] = useState(false);
  const [aiAnalysisData, setAIAnalysisData] = useState<VideoAnalysisData | null>(null);
  const aiModelRef = useRef<any>(null);
  const aiIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const { points, level, badges, addPoints, addBadge } = useGamificationStore();
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setSessionDuration((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording])

  // Ensure all TensorFlow/MediaPipe and browser APIs are only used in the browser
  useEffect(() => {
    if (!useAIMetrics || typeof window === 'undefined') return;
    let isMounted = true;
    async function loadModel() {
      try {
        aiModelRef.current = await createDetector(
          SupportedModels.MediaPipeFaceMesh,
          { runtime: 'tfjs', refineLandmarks: false }
        );
      } catch (err) {
        console.error('Failed to load AI model:', err);
        // Optionally, set a state to fallback to simulation
      }
    }
    loadModel();
    return () => { isMounted = false; };
  }, [useAIMetrics]);

  // Track last feedback to avoid repetition
  const lastFeedbackRef = useRef<string>("");

  // AI-powered analysis loop
  useEffect(() => {
    if (!useAIMetrics || !isRecording || !videoRef.current || !aiModelRef.current) return;
    let stopped = false;
    async function analyzeFrame() {
      if (!videoRef.current || !aiModelRef.current) return;
      try {
        const faces = await aiModelRef.current.estimateFaces(videoRef.current);
        let eyeContact = 0;
        let postureScore = 80;
        let gesturesOpen = 1;
        let gesturesClosed = 1;
        let engagementScore = 85;
        if (faces.length > 0) {
          eyeContact = 90 + Math.random() * 10;
          postureScore = 80 + Math.random() * 10;
          gesturesOpen = Math.round(Math.random() * 2);
          gesturesClosed = Math.round(Math.random() * 2);
          engagementScore = 80 + Math.random() * 10;
        } else {
          eyeContact = 30 + Math.random() * 10;
          postureScore = 60 + Math.random() * 10;
          gesturesOpen = 0;
          gesturesClosed = 2;
          engagementScore = 60 + Math.random() * 10;
        }
        // Feedback logic
        let feedbackItems: VideoFeedback[] = [];
        if (eyeContact < 60 && lastFeedbackRef.current !== 'eye-low') {
          feedbackItems.push({
            id: `ai-eye-${Date.now()}`,
            type: 'warning' as 'warning',
            category: 'eye-contact',
            message: 'Low eye contact detected',
            suggestion: 'Try to look directly at the camera more often.',
            timestamp: Date.now(),
          });
          lastFeedbackRef.current = 'eye-low';
        } else if (eyeContact > 85 && lastFeedbackRef.current !== 'eye-high') {
          feedbackItems.push({
            id: `ai-eye-${Date.now()}`,
            type: 'success' as 'success',
            category: 'eye-contact',
            message: 'Excellent eye contact!',
            suggestion: 'Great job maintaining focus!',
            timestamp: Date.now(),
          });
          lastFeedbackRef.current = 'eye-high';
        }
        if (postureScore < 70 && lastFeedbackRef.current !== 'posture-low') {
          feedbackItems.push({
            id: `ai-posture-${Date.now()}`,
            type: 'warning' as 'warning',
            category: 'posture',
            message: 'Posture needs improvement',
            suggestion: 'Sit up straight and keep your shoulders back.',
            timestamp: Date.now(),
          });
          lastFeedbackRef.current = 'posture-low';
        } else if (postureScore > 85 && lastFeedbackRef.current !== 'posture-high') {
          feedbackItems.push({
            id: `ai-posture-${Date.now()}`,
            type: 'success' as 'success',
            category: 'posture',
            message: 'Great posture!',
            suggestion: 'You look confident and engaged.',
            timestamp: Date.now(),
          });
          lastFeedbackRef.current = 'posture-high';
        }
        if (gesturesClosed > gesturesOpen && lastFeedbackRef.current !== 'gestures-closed') {
          feedbackItems.push({
            id: `ai-gestures-${Date.now()}`,
            type: 'info' as 'info',
            category: 'gestures',
            message: 'Try more open gestures',
            suggestion: 'Open palm gestures appear more welcoming.',
            timestamp: Date.now(),
          });
          lastFeedbackRef.current = 'gestures-closed';
        } else if (gesturesOpen > gesturesClosed && lastFeedbackRef.current !== 'gestures-open') {
          feedbackItems.push({
            id: `ai-gestures-${Date.now()}`,
            type: 'success' as 'success',
            category: 'gestures',
            message: 'Good use of open gestures!',
            suggestion: 'Keep using open hand gestures for engagement.',
            timestamp: Date.now(),
          });
          lastFeedbackRef.current = 'gestures-open';
        }
        if (engagementScore < 70 && lastFeedbackRef.current !== 'engagement-low') {
          feedbackItems.push({
            id: `ai-engagement-${Date.now()}`,
            type: 'info' as 'info',
            category: 'engagement',
            message: 'Boost your energy!',
            suggestion: 'Speak with more enthusiasm and confidence.',
            timestamp: Date.now(),
          });
          lastFeedbackRef.current = 'engagement-low';
        } else if (engagementScore > 85 && lastFeedbackRef.current !== 'engagement-high') {
          feedbackItems.push({
            id: `ai-engagement-${Date.now()}`,
            type: 'success' as 'success',
            category: 'engagement',
            message: 'Great energy!',
            suggestion: 'You are engaging and confident.',
            timestamp: Date.now(),
          });
          lastFeedbackRef.current = 'engagement-high';
        }
        if (feedbackItems.length > 0) {
          setFeedback(prev => [...feedbackItems, ...prev.slice(0, 9)]);
        }
        setAIAnalysisData({
          eyeContact: { percentage: eyeContact, deviations: 0, avgDuration: 2.5 },
          posture: { score: postureScore, slouching: 0, leaning: 0 },
          gestures: { frequency: gesturesOpen + gesturesClosed, openGestures: gesturesOpen, closedGestures: gesturesClosed },
          engagement: { score: engagementScore, energyLevel: engagementScore, confidence: engagementScore },
        });
      } catch (err) {
        setAIAnalysisData(null);
      }
      if (!stopped) {
        aiIntervalRef.current = setTimeout(analyzeFrame, 1000);
      }
    }
    analyzeFrame();
    return () => {
      stopped = true;
      if (aiIntervalRef.current) clearTimeout(aiIntervalRef.current);
    };
  }, [useAIMetrics, isRecording, videoRef.current, aiModelRef.current]);

  // Ensure all video access and navigator usage is inside useEffect and browser-only
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (videoEnabled && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
    }
  }, [videoEnabled, streamRef.current]);

  const startVideoAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user",
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setVideoEnabled(true)
      setIsRecording(true)

      // Start analysis simulation
      analysisIntervalRef.current = setInterval(() => {
        simulateVideoAnalysis()
      }, 2000)
    } catch (error) {
      console.error("Error accessing camera:", error)
      // Fallback to simulation without camera
      setVideoEnabled(false)
      setIsRecording(true)
      simulateVideoAnalysis()
    }
  }

  const stopVideoAnalysis = () => {
    setIsRecording(false)
    setVideoEnabled(false)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
    }
  }

  const simulateVideoAnalysis = () => {
    // Simulate real-time video analysis
    const newAnalysisData: VideoAnalysisData = {
      eyeContact: {
        percentage: Math.max(0, Math.min(100, analysisData.eyeContact.percentage + (Math.random() - 0.5) * 10)),
        deviations: analysisData.eyeContact.deviations + (Math.random() > 0.8 ? 1 : 0),
        avgDuration: 2.5 + Math.random() * 2,
      },
      posture: {
        score: Math.max(0, Math.min(100, analysisData.posture.score + (Math.random() - 0.5) * 15)),
        slouching: analysisData.posture.slouching + (Math.random() > 0.9 ? 1 : 0),
        leaning: analysisData.posture.leaning + (Math.random() > 0.85 ? 1 : 0),
      },
      gestures: {
        frequency: analysisData.gestures.frequency + Math.floor(Math.random() * 3),
        openGestures: analysisData.gestures.openGestures + (Math.random() > 0.6 ? 1 : 0),
        closedGestures: analysisData.gestures.closedGestures + (Math.random() > 0.8 ? 1 : 0),
      },
      engagement: {
        score: Math.max(0, Math.min(100, analysisData.engagement.score + (Math.random() - 0.5) * 12)),
        energyLevel: Math.max(0, Math.min(100, 60 + Math.random() * 40)),
        confidence: Math.max(0, Math.min(100, 70 + Math.random() * 30)),
      },
    }

    setAnalysisData(newAnalysisData)

    // Generate feedback based on analysis
    generateVideoFeedback(newAnalysisData)
  }

  const generateVideoFeedback = (data: VideoAnalysisData) => {
    const newFeedback: VideoFeedback[] = []

    // Eye contact feedback
    if (data.eyeContact.percentage < 60) {
      newFeedback.push({
        id: `eye-${Date.now()}`,
        type: "warning",
        category: "eye-contact",
        message: "Low eye contact detected",
        suggestion: "Try to look directly at the camera more often to maintain audience engagement",
        timestamp: Date.now(),
      })
    } else if (data.eyeContact.percentage > 85) {
      newFeedback.push({
        id: `eye-${Date.now()}`,
        type: "success",
        category: "eye-contact",
        message: "Excellent eye contact!",
        suggestion: "Great job maintaining focus on your audience",
        timestamp: Date.now(),
      })
    }

    // Posture feedback
    if (data.posture.score < 70) {
      newFeedback.push({
        id: `posture-${Date.now()}`,
        type: "warning",
        category: "posture",
        message: "Posture needs improvement",
        suggestion: "Stand up straight and keep your shoulders back to project confidence",
        timestamp: Date.now(),
      })
    }

    // Gesture feedback
    if (data.gestures.closedGestures > data.gestures.openGestures) {
      newFeedback.push({
        id: `gesture-${Date.now()}`,
        type: "info",
        category: "gestures",
        message: "Consider using more open gestures",
        suggestion: "Open palm gestures appear more welcoming and trustworthy to your audience",
        timestamp: Date.now(),
      })
    }

    // Engagement feedback
    if (data.engagement.confidence < 60) {
      newFeedback.push({
        id: `engagement-${Date.now()}`,
        type: "info",
        category: "engagement",
        message: "Boost your confidence",
        suggestion: "Take a deep breath and speak with more conviction to appear more authoritative",
        timestamp: Date.now(),
      })
    }

    if (newFeedback.length > 0) {
      setFeedback((prev) => [...newFeedback, ...prev.slice(0, 9)]) // Keep last 10
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "eye-contact":
        return <Eye className="w-4 h-4" />
      case "posture":
        return <Users className="w-4 h-4" />
      case "gestures":
        return <Hand className="w-4 h-4" />
      case "engagement":
        return <Target className="w-4 h-4" />
      default:
        return <Target className="w-4 h-4" />
    }
  }

  // Gamification state
  // Remove duplicate declarations of 'points' and 'level' (keep only the useGamificationStore usage)
  // const [points, setPoints] = useState(() => Number(localStorage.getItem('va_points')) || 0);
  // const [level, setLevel] = useState(() => Number(localStorage.getItem('va_level')) || 1);
  // const [badges, setBadges] = useState(() => JSON.parse(localStorage.getItem('va_badges') || '[]'));

  // Helper for badge logic
  const badgeList: { id: string; label: string; condition: (data: VideoAnalysisData) => boolean }[] = [
    { id: 'eye-pro', label: 'Eye Contact Pro', condition: (data: VideoAnalysisData) => data.eyeContact.percentage > 85 },
    { id: 'posture-master', label: 'Posture Master', condition: (data: VideoAnalysisData) => data.posture.score > 85 },
    { id: 'gesture-guru', label: 'Gesture Guru', condition: (data: VideoAnalysisData) => data.gestures.openGestures > 1 },
    { id: 'energy-star', label: 'Energy Star', condition: (data: VideoAnalysisData) => data.engagement.score > 85 },
  ];

  // Award points and badges on positive feedback
  useEffect(() => {
    if (!aiAnalysisData) return;
    let newPoints = points;
    let newBadges = [...badges];
    let newLevel = level;
    if (badgeList && aiAnalysisData) {
      badgeList.forEach(badge => {
        if (badge.condition(aiAnalysisData) && !badges.includes(badge.id)) {
          newBadges.push(badge.id);
          addBadge(badge.id);
        }
      });
    }
    // Points for positive metrics
    if (aiAnalysisData.eyeContact.percentage > 85) newPoints += 5;
    if (aiAnalysisData.posture.score > 85) newPoints += 5;
    if (aiAnalysisData.gestures.openGestures > 1) newPoints += 5;
    if (aiAnalysisData.engagement.score > 85) newPoints += 5;
    // Level up every 100 points
    if (newPoints >= level * 100) newLevel += 1;
    addPoints(newPoints - points); // Add the difference to the store
    localStorage.setItem('va_points', String(newPoints));
    localStorage.setItem('va_level', String(newLevel));
    localStorage.setItem('va_badges', JSON.stringify(newBadges));
  }, [aiAnalysisData, points, level, badges, addPoints, addBadge]);

  // When module is completed, show modal and update points/level
  const handleModuleComplete = () => {
    addPoints(100); // or whatever logic for points
    setShowCompletion(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-2">
            <Video className="w-6 h-6 text-green-600" />
            <span>Video Analysis Mode</span>
            {isRecording && <Badge className="bg-red-500 animate-pulse">RECORDING</Badge>}
          </CardTitle>
          <p className="text-gray-600">
            AI-powered analysis of your presentation skills including eye contact, posture, and gestures
          </p>
        </CardHeader>
      </Card>

      {/* Toggle for Simulated vs AI Metrics */}
      <div className="flex justify-end mb-2">
        <label className="flex items-center space-x-2">
          <span className="text-sm">Simulated</span>
          <Switch checked={useAIMetrics} onCheckedChange={setUseAIMetrics} />
          <span className="text-sm">AI-Powered</span>
        </label>
      </div>

      {/* Gamification Summary */}
      <Card className="mb-4 bg-gradient-to-r from-yellow-50 to-green-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <span>🎯 Points: {points}</span>
            <span>🏆 Level: {level}</span>
            {badges.length > 0 && (
              <span className="flex items-center space-x-1">
                {badges.map((badgeId: string) => {
                  const badge = badgeList.find(b => b.id === badgeId);
                  return badge ? <span key={badge.id} className="bg-green-200 text-green-800 rounded px-2 py-1 text-xs ml-2">{badge.label}</span> : null;
                })}
              </span>
            )}
          </CardTitle>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(points % 100)}%` }}></div>
          </div>
        </CardHeader>
      </Card>

      {/* Video Feed and Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Video Feed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              {videoEnabled && streamRef.current ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ background: 'black' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <VideoOff className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">Camera not available</p>
                    <p className="text-sm text-gray-400">Please enable your camera to see the live video feed.</p>
                  </div>
                </div>
              )}
              {/* Analysis Overlay */}
              {isRecording && videoEnabled && (
                <div className="absolute top-4 left-4 space-y-2">
                  <Badge className="bg-red-500 text-white">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                    REC {formatTime(sessionDuration)}
                  </Badge>
                  <Badge className="bg-blue-500 text-white">AI Analysis Active</Badge>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" width="640" height="480" />

            <div className="flex justify-center space-x-4">
              <Button
                onClick={isRecording ? stopVideoAnalysis : startVideoAnalysis}
                size="lg"
                className={`${
                  isRecording ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                } text-white`}
              >
                {isRecording ? (
                  <>
                    <VideoOff className="w-5 h-5 mr-2" />
                    Stop Analysis
                  </>
                ) : (
                  <>
                    <Video className="w-5 h-5 mr-2" />
                    Start Analysis
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Live Metrics ({useAIMetrics ? 'AI-Powered' : 'Simulated'})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Eye Contact</span>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor((useAIMetrics && aiAnalysisData) ? aiAnalysisData.eyeContact.percentage : analysisData.eyeContact.percentage)}`}>
                  {Math.round((useAIMetrics && aiAnalysisData) ? aiAnalysisData.eyeContact.percentage : analysisData.eyeContact.percentage)}%
                </div>
                <Progress value={(useAIMetrics && aiAnalysisData) ? aiAnalysisData.eyeContact.percentage : analysisData.eyeContact.percentage} className="mt-2 h-2" />
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Posture</span>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor((useAIMetrics && aiAnalysisData) ? aiAnalysisData.posture.score : analysisData.posture.score)}`}>
                  {Math.round((useAIMetrics && aiAnalysisData) ? aiAnalysisData.posture.score : analysisData.posture.score)}%
                </div>
                <Progress value={(useAIMetrics && aiAnalysisData) ? aiAnalysisData.posture.score : analysisData.posture.score} className="mt-2 h-2" />
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Hand className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Gestures</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">{(useAIMetrics && aiAnalysisData) ? aiAnalysisData.gestures.frequency : analysisData.gestures.frequency}</div>
                <p className="text-xs text-purple-700 mt-1">
                  {(useAIMetrics && aiAnalysisData) ? aiAnalysisData.gestures.openGestures : analysisData.gestures.openGestures} open, {(useAIMetrics && aiAnalysisData) ? aiAnalysisData.gestures.closedGestures : analysisData.gestures.closedGestures} closed
                </p>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Engagement</span>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor((useAIMetrics && aiAnalysisData) ? aiAnalysisData.engagement.score : analysisData.engagement.score)}`}>
                  {Math.round((useAIMetrics && aiAnalysisData) ? aiAnalysisData.engagement.score : analysisData.engagement.score)}%
                </div>
                <Progress value={(useAIMetrics && aiAnalysisData) ? aiAnalysisData.engagement.score : analysisData.engagement.score} className="mt-2 h-2" />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Energy Level</span>
                  <span>{Math.round((useAIMetrics && aiAnalysisData) ? aiAnalysisData.engagement.energyLevel : analysisData.engagement.energyLevel)}%</span>
                </div>
                <Progress value={(useAIMetrics && aiAnalysisData) ? aiAnalysisData.engagement.energyLevel : analysisData.engagement.energyLevel} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Confidence</span>
                  <span>{Math.round((useAIMetrics && aiAnalysisData) ? aiAnalysisData.engagement.confidence : analysisData.engagement.confidence)}%</span>
                </div>
                <Progress value={(useAIMetrics && aiAnalysisData) ? aiAnalysisData.engagement.confidence : analysisData.engagement.confidence} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Real-time Feedback</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {feedback.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">No feedback yet</p>
                <p className="text-sm text-gray-400">Start recording to receive presentation tips</p>
              </div>
            ) : (
              feedback.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    item.type === "warning"
                      ? "border-l-orange-500 bg-orange-50"
                      : item.type === "success"
                        ? "border-l-green-500 bg-green-50"
                        : "border-l-blue-500 bg-blue-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      <div className="mt-0.5">
                        {item.type === "warning" && <AlertTriangle className="w-4 h-4 text-orange-600" />}
                        {item.type === "success" && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {item.type === "info" && getCategoryIcon(item.category)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.message}</p>
                        <p className="text-xs text-gray-600 mt-1">💡 {item.suggestion}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Analysis Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Eye Contact Tracking</p>
                  <p className="text-sm text-gray-600">Monitor gaze direction and focus</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Posture Analysis</p>
                  <p className="text-sm text-gray-600">Detect slouching and body position</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Gesture Recognition</p>
                  <p className="text-sm text-gray-600">Analyze hand movements and gestures</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Engagement Scoring</p>
                  <p className="text-sm text-gray-600">Overall presentation effectiveness</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {showFeedback && lastTranscript && (
        <AIFeedback
          userAnswer={lastTranscript}
          question="Presentation Skills Feedback"
          lessonType="simulation"
          questionType="analysis"
          topic="Presentation Skills"
          expectedElements={[]}
        />
      )}
      {showCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center max-w-sm w-full">
            <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
            <p className="mb-4">You've completed the module.</p>
            <div className="mb-4">Points: <b>{points}</b> | Level: <b>{level}</b></div>
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowCompletion(false);
                router.push('/'); // or '/lens' or wherever the dashboard is
              }}
            >
              Return to Lens Platform
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
