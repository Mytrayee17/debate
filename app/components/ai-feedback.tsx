"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, TrendingUp, CheckCircle, Lightbulb, Target, ChevronDown, ChevronUp, Star, Award } from "lucide-react"

interface Feedback {
  score: number
  strengths: string[]
  areasForGrowth: string[]
  suggestion: string
  explanation: string
}

interface AIFeedbackProps {
  userAnswer: string
  sampleAnswer: string
  lessonType?: "lesson" | "challenge" | "simulation"
  questionType?: "multiple-choice" | "essay" | "debate" | "analysis"
  topic?: string
  expectedElements?: string[]
  question?: string
}

export function AIFeedback({
  userAnswer,
  sampleAnswer,
  lessonType,
  questionType = "essay",
  topic = "debate topic",
  expectedElements = [],
  question = "",
}: AIFeedbackProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userAnswer || !sampleAnswer) return;
    
    const generateFeedback = () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const userWords = new Set(userAnswer.toLowerCase().split(/\s+/));
        const sampleWords = new Set(sampleAnswer.toLowerCase().split(/\s+/));
        const commonWords = [...userWords].filter(word => sampleWords.has(word));
        const score = Math.min(10, Math.floor((commonWords.length / sampleWords.size) * 10));
        
        const mockFeedback: Feedback = {
          score,
          strengths: [
            "Good use of relevant terminology",
            "Clear structure in your response",
            "Relevant examples provided"
          ].slice(0, 1 + Math.floor(Math.random() * 2)),
          areasForGrowth: [
            "Could expand on your points further",
            "Consider adding more specific examples",
            "Try to be more concise in your explanations"
          ].slice(0, 1 + Math.floor(Math.random())),
          suggestion: sampleAnswer.split('.').slice(0, 2).join('.') + '.',
          explanation: "Your response shows understanding but could benefit from more depth and specific examples to strengthen your argument."
        };
        
        setFeedback(mockFeedback);
      } catch (err) {
        setError("Failed to generate feedback. Please try again.");
        console.error("Error generating feedback:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    const timer = setTimeout(generateFeedback, 1000);
    return () => clearTimeout(timer);
  }, [userAnswer, sampleAnswer]);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
            <span>Analyzing your response...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-blue-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "60%" }}></div>
                </div>
                <p className="text-sm text-blue-600 mt-1">Generating feedback...</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!feedback) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-6 text-center text-gray-500">
          <p>Submit your answer to receive feedback</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span>AI Feedback & Analysis</span>
            </div>
            <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
              Score: {feedback.score}/10
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
            {/* Score Circle */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-20 h-20" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="18" fill="none" stroke="#e0e7ff" strokeWidth="4" />
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="4"
                    strokeDasharray={113}
                    strokeDashoffset={113 - (feedback.score * 11.3)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-2xl font-bold text-blue-700">{feedback.score}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Overall Score</div>
            </div>
            <div className="flex-1">
              <div className="mb-2">
                <span className="font-semibold text-green-700">Strengths</span>
                <ul className="list-disc ml-5 text-green-800 space-y-1">
                  {feedback.strengths.map((s, i) => (
                    <li key={i} className="text-sm">{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mt-3">
                  <span className="font-semibold text-blue-700">Areas for Growth</span>
                  <ul className="list-disc ml-5 text-blue-800 space-y-1">
                    {feedback.areasForGrowth.map((s, i) => (
                      <li key={i} className="text-sm">{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="font-medium text-blue-800">Suggestion:</p>
                  <p className="text-sm text-blue-700 mt-1">{feedback.suggestion}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
