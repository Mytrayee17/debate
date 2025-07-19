"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Trophy,
  Target,
  Clock,
  Star,
  Zap,
  Users,
  TrendingUp,
  Play,
  Pause,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  RotateCcw,
  MessageSquare,
  Brain,
  Timer,
} from "lucide-react"

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: "Easy" | "Medium" | "Hard"
  points: number
  timeLimit: number
  type: "argument" | "rebuttal" | "fallacy" | "analysis"
  prompt: string
  motion: string
  completed: boolean
  keyArguments: {
    government: string[]
    opposition: string[]
  }
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  progress: number
  maxProgress: number
}

interface DebateMessage {
  id: string
  speaker: "user" | "ai"
  content: string
  timestamp: number
  isProcessing?: boolean
}

export function GameifiedChallenge() {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [userResponse, setUserResponse] = useState("")
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [userScore, setUserScore] = useState(1250)
  const [userLevel, setUserLevel] = useState(8)

  // Voice features
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [aiVoiceEnabled, setAiVoiceEnabled] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [debateMessages, setDebateMessages] = useState<DebateMessage[]>([])
  const [currentRound, setCurrentRound] = useState(1)
  const [maxRounds] = useState(4)
  const [debatePhase, setDebatePhase] = useState<"prep" | "debate" | "results">("prep")

  // Refs for voice functionality
  const recognitionRef = useRef<any>(null)
  const speechSynthRef = useRef<SpeechSynthesis | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const challenges: Challenge[] = [
    {
      id: "daily-argument",
      title: "Daily Argument Builder",
      description: "Construct a compelling argument using the PEEL framework",
      difficulty: "Medium",
      points: 50,
      timeLimit: 300,
      type: "argument",
      prompt: "Build an argument for: 'Schools should start later in the day to improve student performance'",
      motion: "This house believes that schools should start later in the day",
      completed: false,
      keyArguments: {
        government: [
          "Later start times align with teenage circadian rhythms, improving sleep quality",
          "Better sleep leads to improved academic performance and concentration",
          "Reduced tardiness and absenteeism when school schedules match natural sleep patterns",
        ],
        opposition: [
          "Later start times conflict with parents' work schedules and childcare needs",
          "After-school activities and sports would be pushed to very late hours",
          "Transportation costs would increase with staggered school schedules",
        ],
      },
    },
    {
      id: "fallacy-hunter",
      title: "Fallacy Hunter",
      description: "Identify and explain logical fallacies in given statements",
      difficulty: "Hard",
      points: 75,
      timeLimit: 240,
      type: "fallacy",
      prompt: "Identify the fallacy: 'Everyone I know loves this restaurant, so it must be the best in the city.'",
      motion: "This statement contains a logical fallacy",
      completed: true,
      keyArguments: {
        government: [
          "This is an example of hasty generalization fallacy",
          "Small sample size cannot represent the entire population",
          "Personal experience doesn't equal objective quality measurement",
        ],
        opposition: [
          "Personal recommendations can be valuable indicators of quality",
          "Word-of-mouth is a legitimate form of social proof",
          "Individual experiences, while limited, still provide useful data points",
        ],
      },
    },
    {
      id: "quick-rebuttal",
      title: "Quick Rebuttal Challenge",
      description: "Respond to an opponent's argument using the DARE method",
      difficulty: "Easy",
      points: 25,
      timeLimit: 180,
      type: "rebuttal",
      prompt: "Rebut this argument: 'Video games should be banned because they cause violence in children.'",
      motion: "This house would ban violent video games for children",
      completed: false,
      keyArguments: {
        government: [
          "Exposure to violent content can desensitize children to real violence",
          "Some studies suggest correlation between violent games and aggressive behavior",
          "Children may struggle to distinguish between virtual and real consequences",
        ],
        opposition: [
          "Multiple studies show no causal link between games and real-world violence",
          "Video games can improve problem-solving skills and hand-eye coordination",
          "Parental guidance and age ratings already provide adequate protection",
        ],
      },
    },
    {
      id: "motion-analysis",
      title: "Motion Analysis Master",
      description: "Analyze a complex debate motion and identify key clash areas",
      difficulty: "Hard",
      points: 100,
      timeLimit: 420,
      type: "analysis",
      prompt: "Analyze: 'This House believes that developed nations should accept unlimited climate refugees'",
      motion: "This House believes that developed nations should accept unlimited climate refugees",
      completed: false,
      keyArguments: {
        government: [
          "Developed nations have historical responsibility for climate change",
          "Moral obligation to help those displaced by environmental disasters",
          "Economic benefits from increased immigration and workforce diversity",
        ],
        opposition: [
          "Unlimited immigration could strain public services and infrastructure",
          "Need for controlled immigration to maintain social cohesion",
          "Other solutions like climate adaptation funding may be more effective",
        ],
      },
    },
  ]

  const achievements: Achievement[] = [
    {
      id: "first-steps",
      title: "First Steps",
      description: "Complete your first challenge",
      icon: "🎯",
      unlocked: true,
      progress: 1,
      maxProgress: 1,
    },
    {
      id: "argument-master",
      title: "Argument Master",
      description: "Build 10 strong arguments",
      icon: "🏗️",
      unlocked: false,
      progress: 7,
      maxProgress: 10,
    },
    {
      id: "fallacy-detective",
      title: "Fallacy Detective",
      description: "Identify 25 logical fallacies",
      icon: "🔍",
      unlocked: false,
      progress: 18,
      maxProgress: 25,
    },
    {
      id: "speed-debater",
      title: "Speed Debater",
      description: "Complete 5 challenges under time pressure",
      icon: "⚡",
      unlocked: false,
      progress: 3,
      maxProgress: 5,
    },
    {
      id: "consistency-king",
      title: "Consistency King",
      description: "Complete daily challenges for 7 days straight",
      icon: "👑",
      unlocked: false,
      progress: 4,
      maxProgress: 7,
    },
  ]

  const leaderboard = [
    { rank: 1, name: "Sarah Chen", score: 2450, level: 12 },
    { rank: 2, name: "Marcus Johnson", score: 2380, level: 11 },
    { rank: 3, name: "Elena Rodriguez", score: 2290, level: 11 },
    { rank: 4, name: "You", score: userScore, level: userLevel },
    { rank: 5, name: "David Kim", score: 1180, level: 7 },
  ]

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Initialize Speech Recognition
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "en-US"

        recognitionRef.current.onstart = () => {
          setIsProcessingVoice(true)
        }

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ""
          let interimTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          setCurrentTranscript(interimTranscript)

          if (finalTranscript.trim()) {
            handleUserSpeech(finalTranscript.trim())
            setCurrentTranscript("")
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error)
          setIsRecording(false)
          setIsProcessingVoice(false)
        }

        recognitionRef.current.onend = () => {
          setIsRecording(false)
          setIsProcessingVoice(false)
        }
      }

      // Initialize Speech Synthesis
      speechSynthRef.current = window.speechSynthesis
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (recognitionRef.current) recognitionRef.current.stop()
      if (speechSynthRef.current) speechSynthRef.current.cancel()
    }
  }, [])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [debateMessages])

  // Timer logic
  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            if (debatePhase === "debate") {
              setDebatePhase("results")
              setShowResults(true)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isTimerRunning, timeRemaining, debatePhase])

  const handleUserSpeech = useCallback(
    (transcript: string) => {
      if (debatePhase !== "debate" || transcript.length < 10) return

      const userMessage: DebateMessage = {
        id: `user-${Date.now()}`,
        speaker: "user",
        content: transcript,
        timestamp: Date.now(),
      }

      setDebateMessages((prev) => [...prev, userMessage])
      setUserResponse(transcript)
      setIsProcessingVoice(false)

      // Generate AI response after a brief delay
      setTimeout(() => {
        generateAiResponse(transcript)
      }, 1500)
    },
    [debatePhase],
  )

  const generateAiResponse = useCallback(
    async (userInput: string) => {
      if (!selectedChallenge) return

      const processingMessage: DebateMessage = {
        id: `ai-processing-${Date.now()}`,
        speaker: "ai",
        content: "Thinking...",
        timestamp: Date.now(),
        isProcessing: true,
      }

      setDebateMessages((prev) => [...prev, processingMessage])

      // Simulate AI processing time
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const aiResponse = await generateContextualResponse(userInput, currentRound)

      setDebateMessages((prev) =>
        prev
          .filter((msg) => !msg.isProcessing)
          .concat({
            id: `ai-${Date.now()}`,
            speaker: "ai",
            content: aiResponse,
            timestamp: Date.now(),
          }),
      )

      if (aiVoiceEnabled) {
        speakText(aiResponse)
      }

      setCurrentRound((prev) => Math.min(prev + 1, maxRounds))
    },
    [selectedChallenge, currentRound, aiVoiceEnabled, maxRounds],
  )

  const generateContextualResponse = async (userInput: string, round: number): Promise<string> => {
    if (!selectedChallenge) return "I need more information to respond."

    const opposingArgs = selectedChallenge.keyArguments.opposition

    // Analyze user input for key themes
    const inputLower = userInput.toLowerCase()
    const hasEvidence = inputLower.includes("study") || inputLower.includes("research") || inputLower.includes("data")
    const hasExample = inputLower.includes("example") || inputLower.includes("instance")
    const isStrong = userInput.length > 100 && (hasEvidence || hasExample)

    let responseType = "counter"
    if (round <= 1) responseType = "opening"
    else if (round >= maxRounds - 1) responseType = "closing"
    else if (isStrong) responseType = "strong_counter"

    const responses = {
      opening: [
        `That's an interesting perspective, but I fundamentally disagree. ${opposingArgs[0]} This is crucial because it directly undermines the foundation of your argument.`,
        `I appreciate your opening, however, there are several critical flaws in that reasoning. ${opposingArgs[1]} This is particularly important when we consider the real-world implications.`,
      ],
      counter: [
        `While you make some valid points, your argument overlooks a fundamental issue: ${opposingArgs[Math.floor(Math.random() * opposingArgs.length)]} This significantly weakens your position.`,
        `I understand your perspective, but the evidence actually suggests otherwise. ${opposingArgs[Math.floor(Math.random() * opposingArgs.length)]} This contradicts your claims.`,
      ],
      strong_counter: [
        `You've presented a well-researched argument, and I respect the evidence you've provided. However, there's a critical counterpoint: ${opposingArgs[Math.floor(Math.random() * opposingArgs.length)]} Recent studies have shown that this correlation doesn't hold up under scrutiny.`,
        `I acknowledge the strength of your evidence, but there's a significant methodological flaw in that reasoning. ${opposingArgs[Math.floor(Math.random() * opposingArgs.length)]} Leading experts consistently argue that this approach creates more problems than it solves.`,
      ],
      closing: [
        `As we conclude this debate, I want to emphasize that while you've made some compelling points, the fundamental issues remain unresolved. ${opposingArgs[0]} The evidence clearly supports my position.`,
        `Thank you for this engaging debate. Throughout our discussion, it's become clear that ${opposingArgs[Math.floor(Math.random() * opposingArgs.length)]} The arguments I've presented demonstrate why this position is ultimately problematic.`,
      ],
    }

    return responses[responseType as keyof typeof responses][
      Math.floor(Math.random() * responses[responseType as keyof typeof responses].length)
    ]
  }

  const speakText = useCallback(
    (text: string) => {
      if (!speechSynthRef.current || !aiVoiceEnabled) return

      // Cancel any ongoing speech
      speechSynthRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8

      // Try to use a more natural voice
      const voices = speechSynthRef.current.getVoices()
      const preferredVoice = voices.find((voice) => voice.name.includes("Google") || voice.name.includes("Microsoft"))
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onstart = () => setIsAiSpeaking(true)
      utterance.onend = () => setIsAiSpeaking(false)
      utterance.onerror = () => setIsAiSpeaking(false)

      speechSynthRef.current.speak(utterance)
    },
    [aiVoiceEnabled],
  )

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser. Please use Chrome or Edge.")
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  const stopAiSpeaking = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel()
      setIsAiSpeaking(false)
    }
  }

  const handleTextSubmit = () => {
    if (!userResponse.trim() || debatePhase !== "debate") return

    const userMessage: DebateMessage = {
      id: `user-${Date.now()}`,
      speaker: "user",
      content: userResponse.trim(),
      timestamp: Date.now(),
    }

    setDebateMessages((prev) => [...prev, userMessage])
    const currentResponse = userResponse.trim()
    setUserResponse("")

    setTimeout(() => {
      generateAiResponse(currentResponse)
    }, 1500)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const startChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setDebatePhase("prep")
    setTimeRemaining(60) // 1 minute prep time
    setUserResponse("")
    setShowResults(false)
    setDebateMessages([])
    setCurrentRound(1)
    setIsTimerRunning(true)
  }

  const startDebatePhase = () => {
    if (!selectedChallenge) return

    setDebatePhase("debate")
    setTimeRemaining(selectedChallenge.timeLimit)
    setIsTimerRunning(true)

    // AI makes opening statement
    const aiOpening = `Welcome to this ${selectedChallenge.title}! I'll be challenging your arguments on: "${selectedChallenge.motion}". I believe there are significant issues with this position. Please present your opening argument, and I'll respond accordingly.`

    const aiMessage: DebateMessage = {
      id: `ai-opening-${Date.now()}`,
      speaker: "ai",
      content: aiOpening,
      timestamp: Date.now(),
    }

    setDebateMessages([aiMessage])

    if (aiVoiceEnabled) {
      speakText(aiOpening)
    }
  }

  const resetChallenge = () => {
    setDebatePhase("prep")
    setTimeRemaining(60)
    setIsTimerRunning(false)
    setDebateMessages([])
    setCurrentRound(1)
    setUserResponse("")
    setShowResults(false)
    if (speechSynthRef.current) speechSynthRef.current.cancel()
    if (recognitionRef.current) recognitionRef.current.stop()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getPhaseTitle = () => {
    switch (debatePhase) {
      case "prep":
        return "Preparation Time"
      case "debate":
        return "Live Debate Challenge"
      case "results":
        return "Challenge Complete"
      default:
        return ""
    }
  }

  if (!selectedChallenge) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Practice Challenges</h2>
          <p className="text-gray-600">Test your skills against our AI debate opponent with voice interaction</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                  <Badge className={getDifficultyColor(challenge.difficulty)}>{challenge.difficulty}</Badge>
                </div>
                <CardDescription>{challenge.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm text-gray-800">Motion:</p>
                  <p className="text-sm text-gray-600 italic">"{challenge.motion}"</p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{Math.floor(challenge.timeLimit / 60)} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Trophy className="w-4 h-4" />
                    <span>{challenge.points} XP</span>
                  </div>
                </div>

                <Button className="w-full" onClick={() => startChallenge(challenge)} disabled={challenge.completed}>
                  {challenge.completed ? "Completed" : "Start Challenge"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-900">{userScore}</h3>
                  <p className="text-blue-700">Total XP</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-purple-900">Level {userLevel}</h3>
                  <p className="text-purple-700">Current Level</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-900">4th</h3>
                  <p className="text-green-700">Leaderboard Rank</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={`${achievement.unlocked ? "bg-yellow-50 border-yellow-200" : "opacity-75"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{achievement.title}</h3>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>
                            {achievement.progress}/{achievement.maxProgress}
                          </span>
                        </div>
                        <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Leaderboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((player) => (
                <div
                  key={player.rank}
                  className={`flex items-center justify-between p-3 rounded-lg ${player.name === "You" ? "bg-blue-50 border border-blue-200" : "bg-gray-50"}`}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        player.rank === 1
                          ? "bg-yellow-500 text-white"
                          : player.rank === 2
                            ? "bg-gray-400 text-white"
                            : player.rank === 3
                              ? "bg-orange-500 text-white"
                              : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {player.rank}
                    </div>
                    <div>
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-sm text-gray-600">Level {player.level}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{player.score.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">XP</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Challenge Header */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedChallenge(null)}
                  className="text-white hover:bg-white/20 p-0 h-auto"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Back to Challenges
                </Button>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-white/20 text-white border-white/30">{getPhaseTitle()}</Badge>
                  <Badge className={getDifficultyColor(selectedChallenge.difficulty)}>
                    {selectedChallenge.difficulty}
                  </Badge>
                  <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                    Round {currentRound}/{maxRounds}
                  </Badge>
                </div>
                <CardTitle className="text-xl lg:text-2xl">{selectedChallenge.title}</CardTitle>
                <p className="text-white/90 text-sm">{selectedChallenge.description}</p>
              </div>

              {/* Timer and Controls */}
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold flex items-center">
                    <Timer className="w-8 h-8 mr-2" />
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      disabled={debatePhase === "results"}
                      className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                    >
                      {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={resetChallenge}
                      className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-white/80 mb-1">Points</div>
                  <div className="text-2xl font-bold">{selectedChallenge.points}</div>
                  <div className="text-xs text-white/70">XP Reward</div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {debatePhase === "prep" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Preparation Area */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Challenge Preparation</CardTitle>
                <CardDescription>Use this time to plan your arguments and strategy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Challenge Prompt:</h4>
                  <p className="text-blue-800">{selectedChallenge.prompt}</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-2">Motion:</h4>
                  <p className="text-purple-800 italic">"{selectedChallenge.motion}"</p>
                </div>

                <Textarea
                  placeholder="Write your preparation notes and key arguments here..."
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  rows={8}
                  className="resize-none"
                />

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{userResponse.length} characters</span>
                  <Button
                    onClick={startDebatePhase}
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={timeRemaining > 0}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {timeRemaining > 0 ? `Start in ${formatTime(timeRemaining)}` : "Start Debate"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Key Arguments Reference */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Key Arguments Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">Supporting Arguments</h4>
                    <div className="space-y-2">
                      {selectedChallenge.keyArguments.government.map((argument, index) => (
                        <div key={index} className="p-2 bg-green-50 rounded text-xs border border-green-200">
                          <Badge variant="secondary" className="mr-2 text-xs">
                            {index + 1}
                          </Badge>
                          {argument}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-red-800 mb-2">Opposing Arguments (AI will use)</h4>
                    <div className="space-y-2">
                      {selectedChallenge.keyArguments.opposition.slice(0, 2).map((argument, index) => (
                        <div key={index} className="p-2 bg-red-50 rounded text-xs border border-red-200">
                          <Badge variant="secondary" className="mr-2 text-xs">
                            {index + 1}
                          </Badge>
                          {argument}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {debatePhase === "debate" && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Debate Interface */}
            <div className="xl:col-span-3 space-y-6">
              {/* Voice Controls */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
                    <div className="flex flex-wrap items-center gap-4">
                      <Button
                        onClick={toggleRecording}
                        variant={isRecording ? "destructive" : "default"}
                        size="lg"
                        disabled={isAiSpeaking}
                        className="min-w-[140px]"
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="w-4 h-4 mr-2" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 mr-2" />
                            Start Recording
                          </>
                        )}
                      </Button>

                      {isAiSpeaking && (
                        <Button onClick={stopAiSpeaking} variant="outline" size="lg">
                          <Square className="w-4 h-4 mr-2" />
                          Stop AI
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <VolumeX className="w-4 h-4 text-gray-500" />
                        <Switch checked={aiVoiceEnabled} onCheckedChange={setAiVoiceEnabled} />
                        <Volume2 className="w-4 h-4 text-gray-700" />
                        <span className="text-sm text-gray-600">AI Voice</span>
                      </div>

                      <Badge
                        variant={
                          isRecording
                            ? "destructive"
                            : isProcessingVoice
                              ? "default"
                              : isAiSpeaking
                                ? "secondary"
                                : "outline"
                        }
                        className="min-w-[100px] justify-center"
                      >
                        {isRecording
                          ? "Recording..."
                          : isProcessingVoice
                            ? "Processing..."
                            : isAiSpeaking
                              ? "AI Speaking..."
                              : "Ready"}
                      </Badge>
                    </div>
                  </div>

                  {/* Live Transcript */}
                  {(currentTranscript || isProcessingVoice) && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-600 mb-1">Live Transcript:</div>
                      <div className="text-blue-800">
                        {currentTranscript || (isProcessingVoice && "Processing your speech...")}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Debate Messages */}
              <Card className="h-[400px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <span>Debate Conversation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {debateMessages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>The AI opponent will make an opening statement when the debate begins.</p>
                      </div>
                    ) : (
                      debateMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.speaker === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] p-4 rounded-lg ${
                              message.speaker === "user"
                                ? "bg-purple-600 text-white"
                                : message.isProcessing
                                  ? "bg-gray-100 text-gray-600 animate-pulse"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  message.speaker === "user" ? "bg-white/70" : "bg-purple-500"
                                }`}
                              />
                              <span className="text-xs opacity-70">
                                {message.speaker === "user" ? "You" : "AI Opponent"}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Text Input Alternative */}
                  <div className="border-t pt-4">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Type your response here (alternative to voice)..."
                        value={userResponse}
                        onChange={(e) => setUserResponse(e.target.value)}
                        rows={2}
                        className="flex-1 resize-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleTextSubmit()
                          }
                        }}
                      />
                      <Button
                        onClick={handleTextSubmit}
                        disabled={!userResponse.trim() || isAiSpeaking}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    <span>Challenge Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Rounds</span>
                        <span>
                          {currentRound}/{maxRounds}
                        </span>
                      </div>
                      <Progress value={(currentRound / maxRounds) * 100} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Time Used</span>
                        <span>
                          {Math.round(
                            ((selectedChallenge.timeLimit - timeRemaining) / selectedChallenge.timeLimit) * 100,
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={((selectedChallenge.timeLimit - timeRemaining) / selectedChallenge.timeLimit) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <Brain className="w-4 h-4 text-blue-600" />
                    <span>Live Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-blue-800">
                        <strong>Round {currentRound}:</strong>{" "}
                        {currentRound <= 1
                          ? "Present your strongest opening arguments"
                          : currentRound >= maxRounds - 1
                            ? "Summarize and reinforce your key points"
                            : "Address the AI's counterarguments directly"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="font-medium text-gray-700">Quick Reminders:</p>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Use evidence to support claims</li>
                        <li>• Address counterarguments</li>
                        <li>• Speak clearly and confidently</li>
                        <li>• Link back to the motion</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {debatePhase === "results" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-800">
                <Trophy className="w-6 h-6 text-yellow-600" />
                <span>Challenge Complete!</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold mb-2">Excellent Work!</h3>
                <p className="text-gray-600">You've completed the {selectedChallenge.title} challenge.</p>
              </div>

              {/* Results */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600">+{selectedChallenge.points}</div>
                  <div className="text-sm text-gray-600">XP Earned</div>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">{debateMessages.length}</div>
                  <div className="text-sm text-gray-600">Exchanges</div>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-600">
                    {formatTime(selectedChallenge.timeLimit - timeRemaining)}
                  </div>
                  <div className="text-sm text-gray-600">Time Used</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <Button onClick={() => setSelectedChallenge(null)} variant="outline" className="flex-1 bg-transparent">
                  Try Another Challenge
                </Button>
                <Button onClick={resetChallenge} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  Retry Challenge
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
