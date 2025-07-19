"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Clock, BookOpen, Lightbulb, Play, Timer } from "lucide-react"
import { DebatePracticeInterface } from "./debate-practice-interface"

interface Topic {
  id: string
  title: string
  motion: string
  category: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  description: string
  context: string
  keyArguments: {
    government: string[]
    opposition: string[]
  }
  timeLimit: number
  preparationTime: number
}

export function TopicGenerator() {
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")
  const [customTopic, setCustomTopic] = useState("")
  const [showPractice, setShowPractice] = useState(false)
  const [userRole, setUserRole] = useState<"government" | "opposition">("government")

  const categories = [
    "Education",
    "Technology",
    "Environment",
    "Healthcare",
    "Politics",
    "Economics",
    "Social Issues",
    "Ethics",
    "Science",
    "Sports",
  ]

  const sampleTopics: Topic[] = [
    {
      id: "homework-ban",
      title: "Homework Ban in Primary Schools",
      motion: "This house would ban homework in primary schools",
      category: "Education",
      difficulty: "Beginner",
      description: "A debate about whether homework should be eliminated for young children",
      context:
        "Many educators argue that homework creates stress for young children and families, while others believe it reinforces learning and builds discipline.",
      keyArguments: {
        government: [
          "Homework creates unnecessary stress for young children",
          "Family time is more valuable than additional study time",
          "Children learn better through play and exploration",
          "Homework creates inequality between families with different resources",
        ],
        opposition: [
          "Homework reinforces classroom learning and improves retention",
          "It teaches children responsibility and time management",
          "Parents can be involved in their child's education",
          "It prepares children for more advanced academic work",
        ],
      },
      timeLimit: 480, // 8 minutes total
      preparationTime: 300, // 5 minutes prep
    },
    {
      id: "social-media-age",
      title: "Social Media Age Restrictions",
      motion: "This house would ban social media for users under 16",
      category: "Technology",
      difficulty: "Intermediate",
      description: "A debate about age restrictions on social media platforms",
      context:
        "Concerns about mental health, cyberbullying, and privacy have led to calls for stricter age limits on social media use.",
      keyArguments: {
        government: [
          "Social media negatively impacts mental health in teenagers",
          "Young people are vulnerable to cyberbullying and online predators",
          "It interferes with academic performance and real-world social skills",
          "Privacy concerns and data exploitation of minors",
        ],
        opposition: [
          "Social media provides valuable educational and creative opportunities",
          "It helps young people connect with peers and build communities",
          "Education about responsible use is better than prohibition",
          "Age verification would be difficult to implement and enforce",
        ],
      },
      timeLimit: 600, // 10 minutes total
      preparationTime: 420, // 7 minutes prep
    },
    {
      id: "universal-basic-income",
      title: "Universal Basic Income",
      motion: "This house would implement a universal basic income",
      category: "Economics",
      difficulty: "Advanced",
      description: "A debate about providing unconditional cash payments to all citizens",
      context:
        "As automation threatens jobs and inequality grows, some propose giving everyone a basic income regardless of employment status.",
      keyArguments: {
        government: [
          "UBI would reduce poverty and provide economic security",
          "It would simplify the welfare system and reduce bureaucracy",
          "People could pursue education, entrepreneurship, or care work",
          "It would help society adapt to automation and job displacement",
        ],
        opposition: [
          "UBI would be extremely expensive and require massive tax increases",
          "It might reduce incentives to work and be productive",
          "Targeted welfare programs are more efficient than universal payments",
          "It could lead to inflation and reduce the purchasing power of money",
        ],
      },
      timeLimit: 720, // 12 minutes total
      preparationTime: 600, // 10 minutes prep
    },
    {
      id: "climate-action",
      title: "Mandatory Climate Action",
      motion: "This house would make climate action mandatory for all corporations",
      category: "Environment",
      difficulty: "Advanced",
      description: "Should governments require all companies to meet strict climate targets?",
      context: "Climate change is a global crisis. Some argue only mandatory action will work; others say it will hurt the economy.",
      keyArguments: {
        government: [
          "Mandatory action is needed to prevent catastrophic climate change",
          "Voluntary measures have failed to deliver results",
          "Corporations are the largest polluters and must be held accountable",
          "Public health and future generations depend on strong action now",
        ],
        opposition: [
          "Mandatory rules will stifle innovation and economic growth",
          "Small businesses will be disproportionately harmed",
          "Market incentives are more effective than government mandates",
          "International cooperation is needed, not just national rules",
        ],
      },
      timeLimit: 900,
      preparationTime: 600,
    },
    {
      id: "ai-judges",
      title: "AI Judges in Courtrooms",
      motion: "This house would allow AI to serve as judges in courtrooms",
      category: "Technology",
      difficulty: "Advanced",
      description: "Should artificial intelligence be used to make legal decisions?",
      context: "AI is increasingly used in legal analysis. Some say it could reduce bias; others fear loss of human judgment.",
      keyArguments: {
        government: [
          "AI can process vast amounts of legal data quickly and accurately",
          "It could reduce human bias and inconsistency in rulings",
          "AI judges would be less susceptible to corruption",
          "Technology can make justice more accessible and efficient",
        ],
        opposition: [
          "AI lacks empathy and understanding of human context",
          "Errors in AI could lead to unjust outcomes",
          "Accountability is unclear when AI makes decisions",
          "Legal systems require human discretion and moral reasoning",
        ],
      },
      timeLimit: 900,
      preparationTime: 600,
    },
    {
      id: "sports-equality",
      title: "Equal Pay in Sports",
      motion: "This house would require equal pay for male and female athletes",
      category: "Sports",
      difficulty: "Intermediate",
      description: "Should all athletes receive equal pay regardless of gender?",
      context: "Gender pay gaps persist in sports. Some argue for equality; others cite revenue and viewership differences.",
      keyArguments: {
        government: [
          "Equal pay is a matter of fairness and justice",
          "Role models for young athletes should be valued equally",
          "Pay gaps perpetuate gender stereotypes",
          "Investment in women's sports will grow with equal pay",
        ],
        opposition: [
          "Pay should reflect revenue and market demand",
          "Forcing equal pay could hurt smaller leagues",
          "Viewership and sponsorship drive salaries",
          "Merit-based pay is more sustainable",
        ],
      },
      timeLimit: 600,
      preparationTime: 420,
    },
    {
      id: "animal-testing",
      title: "Ban Animal Testing",
      motion: "This house would ban all animal testing for scientific and commercial purposes",
      category: "Ethics",
      difficulty: "Intermediate",
      description: "Should animal testing be banned in all circumstances?",
      context: "Animal rights activists call for bans; others argue it's necessary for progress.",
      keyArguments: {
        government: [
          "Animal testing is cruel and inhumane",
          "Alternatives exist for most scientific research",
          "Ethical science should not harm sentient beings",
          "Public opinion is shifting against animal testing",
        ],
        opposition: [
          "Some medical advances require animal testing for safety",
          "Alternatives are not always reliable or available",
          "Banning could slow progress in medicine and science",
          "Strict regulation is better than an outright ban",
        ],
      },
      timeLimit: 600,
      preparationTime: 420,
    },
    {
      id: "space-colonization",
      title: "Colonize Mars",
      motion: "This house would prioritize colonizing Mars over solving Earth's problems",
      category: "Science",
      difficulty: "Advanced",
      description: "Should humanity focus on space colonization or fixing Earth first?",
      context: "Space exploration is exciting, but critics say we should fix our own planet first.",
      keyArguments: {
        government: [
          "Colonizing Mars is essential for long-term survival",
          "It will drive technological innovation",
          "Earth's problems may be unsolvable without a backup plan",
          "Space inspires the next generation of scientists",
        ],
        opposition: [
          "Resources should be spent on urgent problems here on Earth",
          "Space colonization is risky and expensive",
          "We have a moral duty to fix our own planet first",
          "Mars is inhospitable and not a realistic solution",
        ],
      },
      timeLimit: 900,
      preparationTime: 600,
    },
  ]

  const generateTopic = async () => {
    setIsGenerating(true)

    // Simulate AI generation delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Filter topics based on selection
    let filteredTopics = sampleTopics

    if (selectedCategory !== "all") {
      filteredTopics = filteredTopics.filter((topic) => topic.category === selectedCategory)
    }

    if (selectedDifficulty !== "all") {
      filteredTopics = filteredTopics.filter((topic) => topic.difficulty === selectedDifficulty)
    }

    // Select random topic
    const randomTopic = filteredTopics[Math.floor(Math.random() * filteredTopics.length)]
    setCurrentTopic(randomTopic)
    setIsGenerating(false)
  }

  const createCustomTopic = () => {
    if (!customTopic.trim()) return

    const newTopic: Topic = {
      id: `custom-${Date.now()}`,
      title: customTopic,
      motion: customTopic,
      category: "Custom",
      difficulty: "Intermediate",
      description: "Custom debate topic created by user",
      context: "This is a custom topic. Consider multiple perspectives and build strong arguments.",
      keyArguments: {
        government: [
          "Consider the benefits and positive outcomes",
          "Think about who would benefit from this change",
          "What problems would this solve?",
          "What evidence supports this position?",
        ],
        opposition: [
          "Consider the potential negative consequences",
          "Think about who might be harmed by this change",
          "What problems might this create?",
          "What evidence contradicts this position?",
        ],
      },
      timeLimit: 600,
      preparationTime: 420,
    }

    setCurrentTopic(newTopic)
    setCustomTopic("")
  }

  const startPractice = () => {
    if (currentTopic) {
      setShowPractice(true)
    }
  }

  // Add a Random Topic button that always picks from the full pool
  const handleRandomTopic = async () => {
    setIsGenerating(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const randomTopic = sampleTopics[Math.floor(Math.random() * sampleTopics.length)]
    setCurrentTopic(randomTopic)
    setIsGenerating(false)
  }

  if (showPractice && currentTopic) {
    return (
      <div>
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            onClick={() => {
              const randomTopic = sampleTopics[Math.floor(Math.random() * sampleTopics.length)];
              setCurrentTopic(randomTopic);
              setShowPractice(true); // Stay in practice mode
            }}
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Random Topic
          </Button>
        </div>
        <DebatePracticeInterface
          topic={currentTopic as any}
          userRole={userRole}
          onRoleChange={setUserRole}
          onBack={() => setShowPractice(false)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-2">
            <Lightbulb className="w-6 h-6 text-green-600" />
            <span>Debate Topic Generator</span>
          </CardTitle>
          <p className="text-gray-600">
            Generate AI-powered debate topics or create your own. Practice with realistic time limits and AI opponents.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Topic</TabsTrigger>
          <TabsTrigger value="custom">Custom Topic</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Topic Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <Button onClick={generateTopic} disabled={isGenerating} variant="default">
                  Generate Topic
                </Button>
                <Button onClick={handleRandomTopic} disabled={isGenerating} variant="secondary">
                  Random Topic
                </Button>
              </div>
              <div className="mt-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    setIsGenerating(true);
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    const randomTopic = sampleTopics[Math.floor(Math.random() * sampleTopics.length)];
                    setCurrentTopic(randomTopic);
                    setIsGenerating(false);
                  }}
                  disabled={isGenerating}
                >
                  <RefreshCw className="w-4 h-4 mr-1" /> Random Topic
                </Button>
                <div className="text-xs text-gray-500 mt-1 text-center">Get a completely random topic from the full pool, ignoring filters.</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create Custom Topic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Debate Motion</label>
                <Textarea
                  placeholder="Enter your debate motion (e.g., 'This house would ban single-use plastics')"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={createCustomTopic} disabled={!customTopic.trim()} className="w-full" size="lg">
                <BookOpen className="w-4 h-4 mr-2" />
                Create Topic
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generated Topic Display */}
      {currentTopic && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-100 text-blue-800">{currentTopic.category}</Badge>
                  <Badge variant="outline">{currentTopic.difficulty}</Badge>
                </div>
                <CardTitle className="text-xl text-blue-900">{currentTopic.motion}</CardTitle>
                <p className="text-blue-700">{currentTopic.description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Context */}
            <div className="p-4 bg-white/70 rounded-lg">
              <h4 className="font-medium mb-2">Context</h4>
              <p className="text-sm text-gray-700">{currentTopic.context}</p>
            </div>

            {/* Time Information */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Prep: {Math.floor(currentTopic.preparationTime / 60)} minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4 text-blue-600" />
                <span>Debate: {Math.floor(currentTopic.timeLimit / 60)} minutes</span>
              </div>
            </div>

            {/* Key Arguments Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Government Arguments</h4>
                <ul className="space-y-1 text-sm">
                  {currentTopic.keyArguments.government.slice(0, 2).map((arg, index) => (
                    <li key={index} className="text-green-700">
                      • {arg}
                    </li>
                  ))}
                  <li className="text-green-600 italic">+ {currentTopic.keyArguments.government.length - 2} more...</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">Opposition Arguments</h4>
                <ul className="space-y-1 text-sm">
                  {currentTopic.keyArguments.opposition.slice(0, 2).map((arg, index) => (
                    <li key={index} className="text-red-700">
                      • {arg}
                    </li>
                  ))}
                  <li className="text-red-600 italic">+ {currentTopic.keyArguments.opposition.length - 2} more...</li>
                </ul>
              </div>
            </div>

            {/* Role Selection and Start */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Choose Your Side</label>
                <div className="flex space-x-2">
                  <Button
                    variant={userRole === "government" ? "default" : "outline"}
                    onClick={() => setUserRole("government")}
                    className="flex-1"
                  >
                    Government (Pro)
                  </Button>
                  <Button
                    variant={userRole === "opposition" ? "default" : "outline"}
                    onClick={() => setUserRole("opposition")}
                    className="flex-1"
                  >
                    Opposition (Con)
                  </Button>
                </div>
              </div>

              <Button onClick={startPractice} size="lg" className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Start Practice Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
