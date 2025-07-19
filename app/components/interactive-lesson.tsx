"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useUser } from "../contexts/UserContext"
import {
  BookOpen,
  CheckCircle,
  Clock,
  Play,
  ArrowRight,
  ArrowLeft,
  Target,
  Brain,
  Award,
  Sparkles,
  Loader2,
  RotateCcw,
  ArrowUp,
  Star,
  Lightbulb,
  Users,
} from "lucide-react"
import { AIFeedback } from "./ai-feedback"
import { PointsDisplay } from "./PointsDisplay"

// Points configuration
const MODULE_POINTS = {
  fundamentals: 15,
  argumentation: 20,
  rebuttals: 25,
  fallacies: 30,
  advanced: 35,
} as const;

type ModuleId = keyof typeof MODULE_POINTS;

interface StepData {
  id: number;
  type: 'introduction' | 'lesson' | 'exercise' | 'quiz';
  title: string;
  content: string;
  question?: string;
  sampleAnswer?: string;
}

interface ModuleData {
  title: string;
  description: string;
  totalSteps: number;
  estimatedTime: number;
  steps: StepData[];
}

// Move modules outside component to prevent recreation
const LESSON_MODULES: Record<ModuleId, ModuleData> = {
  fundamentals: {
    title: "Debate Fundamentals",
    description: "Master the core principles of effective debating",
    totalSteps: 6,
    estimatedTime: 45,
    steps: [
      {
        id: 1,
        type: "introduction",
        title: "Introduction to Debate",
        content: `
          <div class="bg-blue-50 p-6 rounded-lg">
            <h2 class="text-2xl font-bold text-blue-800 mb-4">What is Debate?</h2>
            <p class="mb-4">Debate is a structured argument where two sides present opposing viewpoints on a specific topic. It's not just about winning - it's about:</p>
            <ul class="space-y-2 mb-6">
              <li class="flex items-start"><span class="text-blue-600 mr-2">•</span> <strong>Critical thinking:</strong> Analyzing issues from multiple perspectives</li>
              <li class="flex items-start"><span class="text-blue-600 mr-2">•</span> <strong>Communication:</strong> Expressing ideas clearly and persuasively</li>
              <li class="flex items-start"><span class="text-blue-600 mr-2">•</span> <strong>Research:</strong> Finding and evaluating evidence</li>
              <li class="flex items-start"><span class="text-blue-600 mr-2">•</span> <strong>Listening:</strong> Understanding and responding to opposing arguments</li>
            </ul>
            <div class="bg-white p-4 rounded border-l-4 border-blue-500">
              <p class="font-medium">Did you know?</p>
              <p>Debate has been used as a teaching method since ancient Greece, with famous philosophers like Socrates and Aristotle using it to explore complex ideas.</p>
            </div>
          </div>
        `,
      },
      {
        id: 2,
        type: "lesson",
        title: "Structuring Your Arguments",
        content: `
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">The P.E.E.L. Method</h2>
            <p>Learn how to structure your arguments effectively using the P.E.E.L. method:</p>
            <div class="grid md:grid-cols-2 gap-4 mt-4">
              <div class="bg-green-50 p-4 rounded-lg">
                <h3 class="font-bold text-green-800">P - Point</h3>
                <p>Make your main argument or claim</p>
              </div>
              <div class="bg-yellow-50 p-4 rounded-lg">
                <h3 class="font-bold text-yellow-800">E - Evidence</h3>
                <p>Provide facts, examples, or statistics</p>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <h3 class="font-bold text-blue-800">E - Explanation</h3>
                <p>Explain how the evidence supports your point</p>
              </div>
              <div class="bg-purple-50 p-4 rounded-lg">
                <h3 class="font-bold text-purple-800">L - Link</h3>
                <p>Connect back to your main argument</p>
              </div>
            </div>
          </div>
        `,
      },
      {
        id: 3,
        type: "exercise",
        title: "Practice: Constructing an Argument",
        content: `
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Practice Activity</h2>
            <p>Let's practice constructing an argument using the P.E.E.L. method.</p>
            <div class="bg-blue-50 p-4 rounded-lg">
              <h3 class="font-bold text-blue-800">Topic: Should school uniforms be mandatory?</h3>
              <p class="mt-2">Choose a position (for or against) and construct your argument below.</p>
            </div>
          </div>
        `,
        question: "Using the P.E.E.L. method, construct an argument about school uniforms. Make sure to include a clear point, evidence, explanation, and link.",
        sampleAnswer: "School uniforms should be mandatory (Point). Research from the National Association of Elementary School Principals shows that schools with uniform policies report 37% fewer disciplinary referrals (Evidence). This suggests that uniforms help create a more focused learning environment by reducing distractions and social pressures (Explanation). Therefore, implementing school uniforms would likely improve overall student behavior and academic performance (Link)."
      },
      {
        id: 4,
        type: "lesson",
        title: "Rebuttal Techniques",
        content: `
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">How to Rebut Effectively</h2>
            <p>Rebuttal is the process of countering your opponent's arguments. Here are some effective techniques:</p>
            <div class="space-y-3 mt-4">
              <div class="flex items-start">
                <div class="bg-red-100 text-red-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1 mr-2">1</div>
                <div>
                  <h3 class="font-semibold">Direct Refutation</h3>
                  <p class="text-sm text-gray-600">Point out flaws in their evidence or logic</p>
                </div>
              </div>
              <div class="flex items-start">
                <div class="bg-yellow-100 text-yellow-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1 mr-2">2</div>
                <div>
                  <h3 class="font-semibold">Counter-Example</h3>
                  <p class="text-sm text-gray-600">Provide examples that contradict their point</p>
                </div>
              </div>
              <div class="flex items-start">
                <div class="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1 mr-2">3</div>
                <div>
                  <h3 class="font-semibold">Turn the Tables</h3>
                  <p class="text-sm text-gray-600">Show how their point actually supports your side</p>
                </div>
              </div>
            </div>
          </div>
        `,
      },
      {
        id: 5,
        type: "exercise",
        title: "Practice: Rebuttal Exercise",
        content: `
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Rebuttal Practice</h2>
            <p>Let's practice creating rebuttals. Read the following argument and craft a response.</p>
            <div class="bg-red-50 p-4 rounded-lg">
              <h3 class="font-bold text-red-800">Opposing Argument:</h3>
              <p class="mt-2">"Social media should be banned for teenagers because it causes mental health issues and decreases productivity."</p>
            </div>
          </div>
        `,
        question: "How would you rebut the argument that social media should be banned for teenagers? Use one of the rebuttal techniques we've learned.",
        sampleAnswer: "While it's true that excessive social media use can have negative effects, banning it entirely would be an overreach. Many educational resources and support networks exist primarily on social media platforms. Instead of banning, we should focus on teaching responsible usage and digital literacy skills, which would be more effective in the long run."
      },
      {
        id: 6,
        type: "quiz",
        title: "Knowledge Check",
        content: `
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Test Your Understanding</h2>
            <p>Let's review what you've learned about debate fundamentals.</p>
          </div>
        `,
        question: "Explain the P.E.E.L. method and why it's important in debate. Provide a brief example.",
        sampleAnswer: "The P.E.E.L. method is a structured approach to constructing arguments. It stands for Point, Evidence, Explanation, and Link. This method is important because it ensures arguments are clear, well-supported, and logically connected. For example, when arguing that exercise is beneficial (Point), one might cite a Harvard study showing 30 minutes of daily exercise reduces heart disease risk by 40% (Evidence). This demonstrates the direct health benefits of regular physical activity (Explanation), making a strong case for incorporating exercise into daily routines (Link)."
      },
    ],
  },
  argumentation: {
    title: "Advanced Argumentation",
    description: "Master sophisticated argument techniques and logical reasoning",
    totalSteps: 6,
    estimatedTime: 50,
    steps: [
      {
        id: 1,
        type: "introduction",
        title: "Advanced Argument Structures",
        content: `
          <div class="bg-purple-50 p-6 rounded-lg">
            <h2 class="text-2xl font-bold text-purple-800 mb-4">Beyond Basic Arguments</h2>
            <p class="mb-4">In advanced debate, we move beyond simple arguments to complex structures that can handle nuanced topics and sophisticated opposition.</p>
            <div class="grid md:grid-cols-2 gap-4 mt-6">
              <div class="bg-white p-4 rounded-lg border border-purple-200">
                <h3 class="font-bold text-purple-700 mb-2">Deductive Reasoning</h3>
                <p class="text-sm text-gray-600">From general principles to specific conclusions</p>
              </div>
              <div class="bg-white p-4 rounded-lg border border-purple-200">
                <h3 class="font-bold text-purple-700 mb-2">Inductive Reasoning</h3>
                <p class="text-sm text-gray-600">From specific observations to general conclusions</p>
              </div>
            </div>
          </div>
        `,
      },
      {
        id: 2,
        type: "lesson",
        title: "Toulmin Model of Argument",
        content: `
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">The Toulmin Model</h2>
            <p>This model breaks down arguments into six key components for deeper analysis:</p>
            <div class="mt-6 space-y-4">
              <div class="flex items-start">
                <div class="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1 mr-3">1</div>
                <div>
                  <h3 class="font-semibold">Claim</h3>
                  <p class="text-sm text-gray-600">The main argument or thesis</p>
                </div>
              </div>
              <div class="flex items-start">
                <div class="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1 mr-3">2</div>
                <div>
                  <h3 class="font-semibold">Grounds</h3>
                  <p class="text-sm text-gray-600">Evidence and facts supporting the claim</p>
                </div>
              </div>
              <div class="flex items-start">
                <div class="bg-yellow-100 text-yellow-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1 mr-3">3</div>
                <div>
                  <h3 class="font-semibold">Warrant</h3>
                  <p class="text-sm text-gray-600">The logical connection between grounds and claim</p>
                </div>
              </div>
              <div class="flex items-start">
                <div class="bg-red-100 text-red-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1 mr-3">4</div>
                <div>
                  <h3 class="font-semibold">Backing</h3>
                  <p class="text-sm text-gray-600">Additional support for the warrant</p>
                </div>
              </div>
              <div class="flex items-start">
                <div class="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1 mr-3">5</div>
                <div>
                  <h3 class="font-semibold">Qualifier</h3>
                  <p class="text-sm text-gray-600">Limitations or conditions of the claim</p>
                </div>
              </div>
              <div class="flex items-start">
                <div class="bg-indigo-100 text-indigo-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1 mr-3">6</div>
                <div>
                  <h3 class="font-semibold">Rebuttal</h3>
                  <p class="text-sm text-gray-600">Addressing counter-arguments</p>
                </div>
              </div>
            </div>
          </div>
        `,
      },
      {
        id: 3,
        type: "exercise",
        title: "Apply the Toulmin Model",
        content: `
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Practice Activity</h2>
            <p>Let's analyze an argument using the Toulmin Model.</p>
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h3 class="font-bold text-yellow-800">Example Argument:</h3>
              <p class="mt-2">"The city should ban plastic bags because they harm marine life. Studies show that over 100,000 marine animals die each year from plastic pollution, and single-use bags are a major contributor. While some argue this would be inconvenient for shoppers, reusable bags are an easy alternative that most people already own."</p>
            </div>
          </div>
        `,
        question: "Identify each component of the Toulmin Model in the provided argument. For each component you identify, explain why it fits that part of the model.",
        sampleAnswer: "Claim: 'The city should ban plastic bags' - This is the main argument being made. Grounds: 'Studies show that over 100,000 marine animals die each year from plastic pollution' - This is the evidence supporting the claim. Warrant: The unstated assumption that protecting marine life is important enough to justify a ban. Backing: 'Single-use bags are a major contributor' - This provides additional support for the warrant. Qualifier: The argument doesn't explicitly state limitations, but implies the ban is specifically about single-use plastic bags. Rebuttal: 'While some argue this would be inconvenient...' - This addresses and counters potential objections to the claim."
      },
      {
        id: 4,
        type: "lesson",
        title: "Logical Fallacies to Avoid",
        content: `
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Common Logical Fallacies</h2>
            <p>Advanced debaters must recognize and avoid these common logical fallacies:</p>
            <div class="grid md:grid-cols-2 gap-4 mt-4">
              <div class="bg-red-50 p-4 rounded-lg">
                <h3 class="font-bold text-red-700">Straw Man</h3>
                <p class="text-sm text-gray-600">Misrepresenting someone's argument to make it easier to attack</p>
              </div>
              <div class="bg-yellow-50 p-4 rounded-lg">
                <h3 class="font-bold text-yellow-700">Ad Hominem</h3>
                <p class="text-sm text-gray-600">Attacking the person instead of their argument</p>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <h3 class="font-bold text-blue-700">False Dilemma</h3>
                <p class="text-sm text-gray-600">Presenting only two options when more exist</p>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <h3 class="font-bold text-green-700">Circular Reasoning</h3>
                <p class="text-sm text-gray-600">When the conclusion is assumed in the premise</p>
              </div>
            </div>
          </div>
        `,
      },
      {
        id: 5,
        type: "exercise",
        title: "Identify the Fallacy",
        content: `
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Fallacy Identification</h2>
            <p>For each statement, identify which logical fallacy is being used.</p>
          </div>
        `,
        question: "1. 'You can't trust John's opinion on climate change because he's not a scientist.'\n2. 'We must either ban all cars or accept that our cities will become uninhabitable.'\n3. 'The Bible is true because it says so in the Bible.'\n4. 'My opponent wants to let criminals run free on our streets.'",
        sampleAnswer: "1. Ad Hominem - Attacking the person (John) rather than his argument. 2. False Dilemma - Presenting only two extreme options when others exist. 3. Circular Reasoning - The conclusion (Bible is true) is assumed in the premise. 4. Straw Man - Misrepresenting the opponent's position to make it easier to attack."
      },
      {
        id: 6,
        type: "quiz",
        title: "Advanced Argumentation Quiz",
        content: `
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Knowledge Check</h2>
            <p>Let's test your understanding of advanced argumentation techniques.</p>
          </div>
        `,
        question: "Explain the difference between deductive and inductive reasoning, and provide an example of each that would be effective in a debate about renewable energy.",
        sampleAnswer: "Deductive reasoning moves from general principles to specific conclusions, while inductive reasoning moves from specific observations to general conclusions. For renewable energy: Deductive example - 'All forms of energy that reduce carbon emissions help combat climate change (major premise). Solar energy reduces carbon emissions (minor premise). Therefore, solar energy helps combat climate change (conclusion).' Inductive example - 'In Germany, solar power has reduced carbon emissions by 25% in the last decade (observation 1). In California, solar adoption has led to a 30% decrease in fossil fuel usage (observation 2). Therefore, increasing solar energy adoption worldwide would likely reduce global carbon emissions (general conclusion).'"
      },
    ],
  },
  rebuttals: {
    title: "Mastering Rebuttals",
    description: "Learn how to effectively counter arguments and defend your position",
    totalSteps: 6,
    estimatedTime: 45,
    steps: [
      {
        id: 1,
        type: "introduction",
        title: "The Art of Effective Rebuttals",
        content: `
          <div class="bg-blue-50 p-6 rounded-lg">
            <h2 class="text-2xl font-bold text-blue-800 mb-4">Mastering the Art of Rebuttal</h2>
            <p class="mb-4">A strong rebuttal doesn't just disagree with the opposition—it systematically dismantles their arguments while reinforcing your position.</p>
            <div class="grid md:grid-cols-3 gap-4 mt-6">
              <div class="bg-white p-4 rounded-lg border border-blue-200">
                <h3 class="font-bold text-blue-700 mb-2">Direct Refutation</h3>
                <p class="text-sm text-gray-600">Directly challenge the opponent's evidence or logic</p>
              </div>
              <div class="bg-white p-4 rounded-lg border border-blue-200">
                <h3 class="font-bold text-blue-700 mb-2">Undermine Assumptions</h3>
                <p class="text-sm text-gray-600">Challenge the unstated premises of their argument</p>
              </div>
              <div class="bg-white p-4 rounded-lg border border-blue-200">
                <h3 class="font-bold text-blue-700 mb-2">Counter-Example</h3>
                <p class="text-sm text-gray-600">Provide examples that contradict their claims</p>
              </div>
            </div>
          </div>
        `,
      },
      {
        id: 2,
        type: "lesson",
        title: "The Four-Step Rebuttal Method",
        content: `
          <div class="space-y-6">
            <h2 class="text-2xl font-bold">Systematic Rebuttal Approach</h2>
            <p>Use this four-step method to structure your rebuttals effectively:</p>
            
            <div class="relative pl-8 border-l-4 border-blue-200 space-y-8">
              <div class="relative">
                <div class="absolute -left-11 w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center">1</div>
                <h3 class="text-lg font-semibold text-blue-800">Restate</h3>
                <p class="mt-1 text-gray-700">Accurately summarize the opponent's argument in your own words.</p>
                <p class="mt-2 text-sm text-blue-600 italic">Example: "You're arguing that social media is harmful because it reduces face-to-face interactions..."</p>
              </div>
              
              <div class="relative">
                <div class="absolute -left-11 w-8 h-8 rounded-full bg-green-100 text-green-800 font-bold flex items-center justify-center">2</div>
                <h3 class="text-lg font-semibold text-green-800">Refute</h3>
                <p class="mt-1 text-gray-700">Explain why their argument is flawed or incomplete.</p>
                <p class="mt-2 text-sm text-green-600 italic">Example: "However, this overlooks how social media enables connections that wouldn't exist otherwise..."</p>
              </div>
              
              <div class="relative">
                <div class="absolute -left-11 w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 font-bold flex items-center justify-center">3</div>
                <h3 class="text-lg font-semibold text-yellow-800">Replace</h3>
                <p class="mt-1 text-gray-700">Provide your counter-argument with supporting evidence.</p>
                <p class="mt-2 text-sm text-yellow-600 italic">Example: "Studies show that 78% of users report feeling more connected to friends and family through social media..."</p>
              </div>
              
              <div class="relative">
                <div class="absolute -left-11 w-8 h-8 rounded-full bg-red-100 text-red-800 font-bold flex items-center justify-center">4</div>
                <h3 class="text-lg font-semibold text-red-800">Reinforce</h3>
                <p class="mt-1 text-gray-700">Tie your rebuttal back to your main argument.</p>
                <p class="mt-2 text-sm text-red-600 italic">Example: "This demonstrates that rather than isolating people, social media can actually enhance relationships when used mindfully."</p>
              </div>
            </div>
          </div>
        `,
      },
      {
        id: 3,
        type: "exercise",
        title: "Practice the Four-Step Rebuttal",
        content: `
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Rebuttal Practice</h2>
            <p>Let's practice the four-step rebuttal method with this argument:</p>
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h3 class="font-bold text-yellow-800">Opposing Argument:</h3>
              <p class="mt-2">"Online learning is inferior to traditional classroom education because it lacks personal interaction between students and teachers. Students need face-to-face instruction to truly understand complex concepts."</p>
            </div>
          </div>
        `,
        question: "Using the four-step rebuttal method, craft a response to the argument about online learning. Make sure to include all four steps: Restate, Refute, Replace, and Reinforce.",
        sampleAnswer: "Restate: You're arguing that online learning is less effective than traditional classrooms because it lacks personal interaction, which you believe is essential for understanding complex concepts. Refute: While personal interaction is valuable, this perspective underestimates the various ways meaningful connections can be made in digital environments. Replace: Modern online learning platforms offer live video discussions, breakout rooms, and one-on-one virtual office hours that facilitate personal connections. Studies from Stanford University show that students in well-designed online courses perform as well as or better than their in-person counterparts, with the added benefit of flexible scheduling. Reinforce: This demonstrates that when implemented effectively, online learning can match or even surpass traditional methods in educational outcomes while offering greater accessibility and flexibility."
      },
      {
        id: 4,
        type: "lesson",
        title: "Advanced Rebuttal Techniques",
        content: `
          <div class="space-y-6">
            <h2 class="text-2xl font-bold">Sophisticated Rebuttal Strategies</h2>
            <p>Elevate your rebuttals with these advanced techniques:</p>
            
            <div class="grid md:grid-cols-2 gap-4 mt-4">
              <div class="bg-white p-4 rounded-lg border border-purple-200">
                <h3 class="font-bold text-purple-700">Turn the Tables</h3>
                <p class="text-sm text-gray-600 mt-1">Show how the opponent's evidence actually supports your position.</p>
                <div class="mt-2 p-2 bg-purple-50 text-sm rounded">
                  <p class="font-medium">They say:</p>
                  <p class="text-xs italic">"The high cost of renewable energy makes it impractical."</p>
                  <p class="font-medium mt-1">You respond:</p>
                  <p class="text-xs italic">"Actually, the decreasing costs you mention prove my point—solar prices have dropped 89% in the last decade, making it increasingly affordable."</p>
                </div>
              </div>
              
              <div class="bg-white p-4 rounded-lg border border-green-200">
                <h3 class="font-bold text-green-700">Expose False Dilemmas</h3>
                <p class="text-sm text-gray-600 mt-1">Reveal when the opposition presents a false either/or choice.</p>
                <div class="mt-2 p-2 bg-green-50 text-sm rounded">
                  <p class="font-medium">They say:</p>
                  <p class="text-xs italic">"We must either cut social programs or go into massive debt."</p>
                  <p class="font-medium mt-1">You respond:</p>
                  <p class="text-xs italic">"That's a false choice. We could also increase taxes on corporations or reduce military spending to fund social programs responsibly."</p>
                </div>
              </div>
              
              <div class="bg-white p-4 rounded-lg border border-blue-200">
                <h3 class="font-bold text-blue-700">Pre-emptive Strike</h3>
                <p class="text-sm text-gray-600 mt-1">Address potential counter-arguments before they're raised.</p>
                <div class="mt-2 p-2 bg-blue-50 text-sm rounded">
                  <p class="font-medium">You say:</p>
                  <p class="text-xs italic">"Some might argue that this policy would be too expensive, but consider that the long-term savings from reduced healthcare costs would actually save money."</p>
                </div>
              </div>
              
              <div class="bg-white p-4 rounded-lg border border-yellow-200">
                <h3 class="font-bold text-yellow-700">Reductio ad Absurdum</h3>
                <p class="text-sm text-gray-600 mt-1">Show how the opponent's logic leads to absurd conclusions.</p>
                <div class="mt-2 p-2 bg-yellow-50 text-sm rounded">
                  <p class="font-medium">They say:</p>
                  <p class="text-xs italic">"If we allow same-sex marriage, next people will want to marry animals."</p>
                  <p class="font-medium mt-1">You respond:</p>
                  <p class="text-xs italic">"That's a slippery slope. By that logic, allowing interracial marriage would lead to people marrying their cars. Consent and legal capacity are the real issues at stake."</p>
                </div>
              </div>
            </div>
          </div>
        `,
      },
      {
        id: 5,
        type: "exercise",
        title: "Apply Advanced Rebuttal Techniques",
        content: `
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Practice Advanced Rebuttals</h2>
            <p>Let's practice some advanced rebuttal techniques with these common arguments.</p>
          </div>
        `,
        question: "For each of these arguments, choose an appropriate advanced rebuttal technique and craft a response. Be prepared to explain why you chose that technique.\n\n1. 'If we raise the minimum wage, businesses will have to lay off workers or raise prices, which will hurt the economy.'\n2. 'The government shouldn't regulate social media because that would be censorship, and censorship is always wrong.'\n3. 'We can't trust climate change predictions because scientists have been wrong before.'",
        sampleAnswer: "1. (False Dilemma) 'That's a false choice. Studies of minimum wage increases show that many businesses absorb costs through reduced turnover and increased productivity. For example, after Seattle raised its minimum wage, employment actually increased in the food service industry.'\n\n2. (Redefining Terms) 'Equating all regulation with censorship oversimplifies the issue. Traffic laws regulate driving but don't prevent people from driving entirely. Similarly, reasonable content moderation can prevent harm without infringing on free speech, just as we prohibit false advertising or incitement to violence.'\n\n3. (Turning the Tables) 'The fact that scientific understanding evolves actually supports the credibility of climate science. Early climate models from the 1970s were relatively crude, yet many of their predictions about global temperature rise have proven remarkably accurate. The scientific method is designed to be self-correcting, which is why the overwhelming consensus among climate scientists has only grown stronger with more data.'"
      },
      {
        id: 6,
        type: "quiz",
        title: "Rebuttal Mastery Quiz",
        content: `
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Knowledge Check</h2>
            <p>Let's test your understanding of effective rebuttal techniques.</p>
          </div>
        `,
        question: "Explain the difference between a direct refutation and a strategic concession in debate. Provide an example of when you might use each approach, and explain why you would choose one over the other in those situations.",
        sampleAnswer: "A direct refutation challenges the opponent's argument head-on, while a strategic concession acknowledges a point to focus on more important aspects of the debate.\n\nDirect Refutation Example: When an opponent makes a factually incorrect statement that's central to their case. For instance, if they claim 'Renewable energy can't meet baseload power demands,' you would directly refute with current data showing countries like Iceland and Costa Rica already running on nearly 100% renewable energy.\n\nStrategic Concession Example: When the opponent makes a minor point that doesn't significantly impact your overall argument. For example, 'While it's true that installing solar panels has upfront costs (concession), the long-term savings and environmental benefits far outweigh these initial investments (pivot to stronger argument).'\n\nYou would choose direct refutation when the opponent's point is factually wrong and central to their case, as allowing it to stand would undermine your position. Strategic concession is better when the point is relatively minor or when acknowledging it builds your credibility while allowing you to pivot to stronger arguments that better serve your position."
      },
    ],
  },
  fallacies: {
    title: "Logical Fallacies",
    description: "Identify and avoid common logical fallacies in arguments",
    totalSteps: 6,
    estimatedTime: 45,
    steps: [
      {
        id: 1,
        type: "introduction",
        title: "Introduction to Logical Fallacies",
        content: `
          <div class="bg-red-50 p-6 rounded-lg">
            <h2 class="text-2xl font-bold text-red-800 mb-4">The Danger of Faulty Logic</h2>
            <p class="mb-4">Logical fallacies are errors in reasoning that undermine the logic of an argument. They're often persuasive because they appeal to emotions rather than intellect, making them particularly dangerous in debates.</p>
            <div class="grid md:grid-cols-3 gap-4 mt-6">
              <div class="bg-white p-4 rounded-lg border border-red-200">
                <h3 class="font-bold text-red-700 mb-2">Spot</h3>
                <p class="text-sm text-gray-600">Learn to recognize fallacies in others' arguments</p>
              </div>
              <div class="bg-white p-4 rounded-lg border border-red-200">
                <h3 class="font-bold text-red-700 mb-2">Avoid</h3>
                <p class="text-sm text-gray-600">Prevent fallacies in your own reasoning</p>
              </div>
              <div class="bg-white p-4 rounded-lg border border-red-200">
                <h3 class="font-bold text-red-700 mb-2">Counter</h3>
                <p class="text-sm text-gray-600">Effectively respond to fallacious arguments</p>
              </div>
            </div>
          </div>
        `,
      },
      {
        id: 2,
        type: "lesson",
        title: "Common Informal Fallacies",
        content: `
          <div class="space-y-6">
            <h2 class="text-2xl font-bold">Everyday Errors in Reasoning</h2>
            <p>These fallacies are common in everyday arguments and can be particularly persuasive if not recognized.</p>
            
            <div class="space-y-6 mt-6">
              <div class="border-l-4 border-blue-500 pl-4">
                <h3 class="font-bold text-lg text-blue-700">Ad Hominem</h3>
                <p class="text-gray-700">Attacking the person instead of their argument.</p>
                <div class="mt-2 p-3 bg-blue-50 rounded">
                  <p class="text-sm font-medium text-blue-800">Example:</p>
                  <p class="text-sm italic">"We shouldn't listen to her opinion on climate change because she's not a scientist."</p>
                </div>
              </div>
              
              <div class="border-l-4 border-green-500 pl-4">
                <h3 class="font-bold text-lg text-green-700">Straw Man</h3>
                <p class="text-gray-700">Misrepresenting someone's argument to make it easier to attack.</p>
                <div class="mt-2 p-3 bg-green-50 rounded">
                  <p class="text-sm font-medium text-green-800">Example:</p>
                  <p class="text-sm italic">"My opponent wants to ban all cars and force everyone to ride bicycles, which is completely impractical."</p>
                </div>
              </div>
              
              <div class="border-l-4 border-purple-500 pl-4">
                <h3 class="font-bold text-lg text-purple-700">False Dilemma</h3>
                <p class="text-gray-700">Presenting only two options when more exist.</p>
                <div class="mt-2 p-3 bg-purple-50 rounded">
                  <p class="text-sm font-medium text-purple-800">Example:</p>
                  <p class="text-sm italic">"You're either with us, or you're against us."</p>
                </div>
              </div>
              
              <div class="border-l-4 border-yellow-500 pl-4">
                <h3 class="font-bold text-lg text-yellow-700">Slippery Slope</h3>
                <p class="text-gray-700">Arguing that a relatively small first step will lead to a chain of related events resulting in a significant impact.</p>
                <div class="mt-2 p-3 bg-yellow-50 rounded">
                  <p class="text-sm font-medium text-yellow-800">Example:</p>
                  <p class="text-sm italic">"If we allow students to redo this test, soon they'll want to redo every assignment, and then no one will take deadlines seriously."</p>
                </div>
              </div>
            </div>
          </div>
        `,
      },
      {
        id: 3,
        type: "exercise",
        title: "Identify the Fallacy",
        content: `
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Spot the Flaw</h2>
            <p>Read each statement and identify which logical fallacy is being used.</p>
          </div>
        `,
        question: "For each statement, identify the logical fallacy and explain why it's problematic:\n\n1. 'My political opponent claims to care about education, but he doesn't even have children of his own.'\n2. 'If we allow students to use calculators in math class, soon they won't be able to do basic arithmetic without technology.'\n3. 'You can either support our new security measures, or you can put our country at risk of terrorist attacks.'\n4. 'The mayor's plan to reduce traffic is ridiculous. He wants to ban all cars and make everyone walk or ride bikes everywhere.'",
        sampleAnswer: "1. Ad Hominem - Attacking the politician's personal life rather than addressing their policies on education.\n\n2. Slippery Slope - Suggesting that one small change will lead to an extreme and unlikely outcome without sufficient evidence.\n\n3. False Dilemma - Presenting only two extreme options when many other possibilities exist.\n\n4. Straw Man - Misrepresenting the mayor's plan to make it easier to attack. The actual proposal likely has more nuance than a complete ban on cars."
      },
      {
        id: 4,
        type: "lesson",
        title: "More Sophisticated Fallacies",
        content: `
          <div class="space-y-6">
            <h2 class="text-2xl font-bold">Advanced Fallacies</h2>
            <p>These fallacies are more subtle but equally problematic in arguments.</p>
            
            <div class="grid md:grid-cols-2 gap-6 mt-6">
              <div class="border rounded-lg p-4 bg-white shadow-sm">
                <h3 class="font-bold text-indigo-700">Begging the Question</h3>
                <p class="text-sm text-gray-600 mt-1">When an argument's premises assume the truth of the conclusion.</p>
                <div class="mt-2 p-2 bg-indigo-50 rounded text-sm">
                  <p class="font-medium text-indigo-800">Example:</p>
                  <p class="italic">"The death penalty is wrong because it's immoral."</p>
                </div>
              </div>
              
              <div class="border rounded-lg p-4 bg-white shadow-sm">
                <h3 class="font-bold text-pink-700">Appeal to Authority</h3>
                <p class="text-sm text-gray-600 mt-1">Using an authority figure's opinion as evidence when they're not a reliable source.</p>
                <div class="mt-2 p-2 bg-pink-50 rounded text-sm">
                  <p class="font-medium text-pink-800">Example:</p>
                  <p class="italic">"This diet must work because a famous actor endorses it."</p>
                </div>
              </div>
              
              <div class="border rounded-lg p-4 bg-white shadow-sm">
                <h3 class="font-bold text-teal-700">Hasty Generalization</h3>
                <p class="text-sm text-gray-600 mt-1">Making a broad conclusion based on insufficient evidence.</p>
                <div class="mt-2 p-2 bg-teal-50 rounded text-sm">
                  <p class="font-medium text-teal-800">Example:</p>
                  <p class="italic">"I met two people from that city and they were both rude. Everyone from there must be unfriendly."</p>
                </div>
              </div>
              
              <div class="border rounded-lg p-4 bg-white shadow-sm">
                <h3 class="font-bold text-amber-700">Post Hoc Ergo Propter Hoc</h3>
                <p class="text-sm text-gray-600 mt-1">Assuming that because one event followed another, the first caused the second.</p>
                <div class="mt-2 p-2 bg-amber-50 rounded text-sm">
                  <p class="font-medium text-amber-800">Example:</p>
                  <p class="italic">"I wore my lucky socks and then aced the test. My socks must be lucky!"</p>
                </div>
              </div>
            </div>
          </div>
        `,
      },
      {
        id: 5,
        type: "exercise",
        title: "Analyze Real-World Fallacies",
        content: `
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Real-World Application</h2>
            <p>Let's analyze some real-world arguments for logical fallacies.</p>
          </div>
        `,
        question: "Find a recent news article, opinion piece, or social media post and identify at least two different logical fallacies in the arguments presented. For each fallacy:\n\n1. Quote the exact text containing the fallacy\n2. Name the specific type of fallacy\n3. Explain why it's a fallacy\n4. Suggest how the argument could be improved",
        sampleAnswer: "Example from a political debate:\n\n1. 'My opponent's economic plan is just like what was tried in Venezuela, and we all know how that turned out.'\n   - Fallacy: False Analogy\n   - Why it's a fallacy: The comparison is overly simplistic and ignores important differences between the two situations.\n   - Improvement: 'My opponent's plan includes policies X and Y. Here's why I believe these specific policies would be ineffective...'\n\n2. 'The senator wants to raise taxes, but she owns three homes! How can she claim to care about the working class?'\n   - Fallacy: Ad Hominem\n   - Why it's a fallacy: Attacking the senator's personal wealth doesn't address the merits of her tax policy.\n   - Improvement: 'The senator's tax proposal would have these specific negative effects on working families...'"
      },
      {
        id: 6,
        type: "quiz",
        title: "Fallacy Mastery Quiz",
        content: `
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Knowledge Check</h2>
            <p>Let's test your understanding of logical fallacies.</p>
          </div>
        `,
        question: "Explain why it's important to be able to identify logical fallacies in both your own arguments and those of others. Provide a specific example of how recognizing a fallacy could change the outcome of a debate or discussion.",
        sampleAnswer: "Recognizing logical fallacies is crucial for several reasons. First, it helps maintain the integrity of debates by focusing on substantive arguments rather than rhetorical tricks. Second, it allows us to identify and correct weaknesses in our own reasoning. Third, it helps us make better decisions by evaluating arguments based on their merits rather than being swayed by fallacious reasoning.\n\nFor example, in a workplace discussion about implementing a four-day workweek, someone might argue: 'If we reduce the workweek, soon people will want to work just two days, and then no one will want to work at all!' Recognizing this as a slippery slope fallacy would allow the team to address the actual impacts of the proposed change rather than getting sidetracked by an unrealistic worst-case scenario. The discussion could then focus on concrete data about productivity, employee satisfaction, and business needs, leading to a more informed decision."
      },
    ],
  },
  advanced: {
    title: "Advanced Debate Techniques",
    description: "Master advanced debate strategies and techniques",
    totalSteps: 8,
    estimatedTime: 50,
    steps: [
      // Add steps here
    ],
  },
} as const;

interface InteractiveLessonProps {
  moduleId: ModuleId;
  onBack: () => void;
  onComplete: () => void;
  modulePoints?: number;
}

export function InteractiveLesson({ 
  moduleId, 
  onBack, 
  onComplete, 
  modulePoints = MODULE_POINTS[moduleId as keyof typeof MODULE_POINTS] || 15 
}: InteractiveLessonProps) {
  // State management
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [moduleProgress, setModuleProgress] = useState<number>(0);
  const [moduleSummary, setModuleSummary] = useState<string>('');
  const [aiEquation, setAiEquation] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // AI Evaluation state
  const [evaluation, setEvaluation] = useState<{
    score: number;
    feedback: string;
    improvements: string[];
    isEvaluating: boolean;
  }>({
    score: 0,
    feedback: '',
    improvements: [],
    isEvaluating: false
  });
  
  const { addPoints, completedModules, markModuleAsCompleted } = useUser();
  
  // Ensure module exists, fallback to fundamentals if not found
  const module = LESSON_MODULES[moduleId] || LESSON_MODULES.fundamentals;

  const currentStepData = useMemo(() => module.steps[currentStep], [module, currentStep]);
  const allStepsCompleted = completedSteps.size === module.totalSteps;

  useEffect(() => {
    if (currentStepData?.type === "introduction") {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    }
  }, [currentStep, currentStepData?.type]);

  useEffect(() => {
    const progress = (completedSteps.size / module.totalSteps) * 100;
    setModuleProgress(progress);
  }, [completedSteps, module.totalSteps]);

  // Evaluate user's answer with AI
  const evaluateAnswer = async (userAnswer: string, question: string) => {
    setEvaluation(prev => ({ ...prev, isEvaluating: true }));
    
    try {
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock AI evaluation
      const mockEvaluation = {
        score: Math.floor(Math.random() * 5) + 6, // Random score between 6-10
        feedback: "Good effort! Your answer shows understanding of the topic.",
        improvements: [
          "Provide more specific examples to support your points",
          "Consider addressing potential counterarguments",
          "Work on structuring your response more clearly"
        ]
      };
      
      setEvaluation({
        ...mockEvaluation,
        isEvaluating: false
      });
      
    } catch (error) {
      console.error('Error evaluating answer:', error);
      setEvaluation({
        score: 0,
        feedback: 'Sorry, there was an error evaluating your answer.',
        improvements: ['Please try again later.'],
        isEvaluating: false
      });
    }
  };

  // Handle answer submission
  const handleAnswerSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) {
      toast.error('Please enter your answer before submitting');
      return;
    }
    
    await evaluateAnswer(userAnswer, currentStepData?.question || '');
    setShowFeedback(true);
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    
    // Auto-scroll to feedback
    setTimeout(() => {
      const feedbackElement = document.getElementById('feedback-section');
      feedbackElement?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleNextStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (currentStep < module.totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      setUserAnswer("");
      setShowFeedback(false);
    }
  };

  const handlePreviousStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setUserAnswer("");
      setShowFeedback(false);
    }
  };

  // Generate module summary and equation using AI
  const generateModuleSummary = async () => {
    // Check if this is the last step
    const currentIsLastStep = currentStep === module.totalSteps - 1;
    if (!currentIsLastStep) return;
    
    setIsGenerating(true);
    try {
      // In a real app, you would call an AI API here
      // For now, we'll use mock data
      const mockSummary = `You've completed the ${module.title} module! Here's a quick recap of what you've learned.`;
      
      // Generate a simple equation based on module content
      const equations = {
        fundamentals: 'Knowledge + Practice = Debate Success',
        argumentation: 'Claim + Evidence + Reasoning = Strong Argument',
        rebuttals: 'Listen + Analyze + Counter = Effective Rebuttal',
        fallacies: 'Critical Thinking - Logical Fallacies = Better Arguments',
        advanced: '(Research + Preparation) × Confidence = Winning Debate'
      };
      
      setModuleSummary(mockSummary);
      setAiEquation(equations[moduleId] || 'Learning + Practice = Mastery');
    } catch (error) {
      console.error('Error generating summary:', error);
      setModuleSummary('Thank you for completing this module!');
      setAiEquation('Knowledge + Practice = Success');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Generate summary when reaching the last step
  useEffect(() => {
    if (currentStep === module.totalSteps - 1 && !moduleSummary) {
      generateModuleSummary();
    }
  }, [currentStep, moduleSummary, module.totalSteps]);

  const handleCompleteModule = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (allStepsCompleted) {
      if (!completedModules.includes(moduleId)) {
        // Add points and mark module as completed
        addPoints(modulePoints);
        markModuleAsCompleted(moduleId);
        
        // Show success message
        toast.success(
          <div className="space-y-1">
            <p className="font-semibold">Module Completed! 🎉</p>
            <p>You've earned {modulePoints} points!</p>
          </div>,
          { duration: 5000 }
        );
        
        // Small delay to show the toast before navigating away
        setTimeout(() => {
          onComplete();
        }, 1000);
      } else {
        // Module was already completed
        toast.info('You have already completed this module.');
        onComplete();
      }
    } else {
      // Show remaining steps
      const remainingSteps = module.totalSteps - completedSteps.size;
      toast.warning(`Complete ${remainingSteps} more step${remainingSteps !== 1 ? 's' : ''} to finish the module.`);
    }
  };

  // Derived state
  const isLoading = !currentStepData;
  const isStepCompleted = completedSteps.has(currentStep);
  const isLastStep = currentStep === module.totalSteps - 1;
  const canProceed = isStepCompleted || !currentStepData?.question;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 p-4 relative">
      <PointsDisplay />
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <CardTitle className="text-2xl lg:text-3xl">{module.title}</CardTitle>
                <CardDescription className="text-blue-100">{module.description}</CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm">{module.estimatedTime} min</span>
                </div>
                <Button 
                  variant="outline" 
                  className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
                  onClick={onBack}
                >
                  Back to Modules
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Lesson Content */}
          <div className="xl:col-span-3 space-y-6">
            <Card>
              {isLoading ? (
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              ) : (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <h2 className="text-xl font-semibold">{currentStepData?.title || 'Loading...'}</h2>
                      </div>
                      <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                        Step {currentStep + 1} of {module.totalSteps}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {currentStepData?.content && (
                      <div 
                        className="prose max-w-none" 
                        dangerouslySetInnerHTML={{ __html: currentStepData.content }} 
                      />
                    )}

                    {currentStepData?.question && (
                      <div className="space-y-4">
                        <div className="font-medium">{currentStepData.question}</div>
                        <Textarea
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="Type your answer here..."
                          className="min-h-[100px]"
                          disabled={isStepCompleted}
                        />
                        
                        {!isStepCompleted && (
                          <Button onClick={handleAnswerSubmit}>
                            Submit Answer
                          </Button>
                        )}
                      </div>
                    )}

                    {showFeedback && currentStepData?.question && (
                      <div id="feedback-section" className="mt-6 space-y-4">
                        <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">Your Answer:</h4>
                          <p className="text-gray-700">{userAnswer}</p>
                        </div>
                        
                        {evaluation.isEvaluating ? (
                          <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="ml-2">Analyzing your answer...</span>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Your Score:</h4>
                              <div className="text-2xl font-bold text-blue-600">
                                {evaluation.score}/10
                              </div>
                            </div>
                            
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                              <h4 className="font-medium text-blue-800 mb-2">Feedback:</h4>
                              <p className="text-gray-700">{evaluation.feedback}</p>
                            </div>
                            
                            {evaluation.improvements.length > 0 && (
                              <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                                <h4 className="font-medium text-amber-800 mb-2">Suggestions for Improvement:</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                  {evaluation.improvements.map((improvement, index) => (
                                    <li key={index} className="text-gray-700">{improvement}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                  
                  {/* Module Summary Section */}
                  {isLastStep && (
                    <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                      <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                        Module Summary
                      </h3>
                      
                      {isGenerating ? (
                        <div className="space-y-4">
                          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                          <div className="h-24 bg-gray-100 rounded-lg mt-4 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <p className="text-gray-700">{moduleSummary}</p>
                          
                          <div className="p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                            <div className="text-center text-2xl font-mono text-purple-700 py-4">
                              {aiEquation}
                            </div>
                            <p className="text-sm text-gray-500 text-center mt-2">
                              This equation represents the key takeaway from this module
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 justify-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setCurrentStep(0)}
                              className="flex items-center gap-1"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Restart Module
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                              className="flex items-center gap-1"
                            >
                              <ArrowUp className="w-4 h-4" />
                              Back to Top
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handlePreviousStep}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              {currentStep < module.totalSteps - 1 ? (
                <Button 
                  onClick={handleNextStep}
                  disabled={!canProceed}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleCompleteModule}
                  disabled={!allStepsCompleted}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Complete Module
                  <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Target className="w-4 h-4" />
                  <span>Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Module Progress</span>
                    <span>{Math.round(moduleProgress)}%</span>
                  </div>
                  <Progress value={moduleProgress} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed Steps</span>
                    <span>
                      {completedSteps.size}/{module.totalSteps}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Current Step</span>
                    <span>{currentStep + 1}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: module.totalSteps }).map((_, i) => (
                      <div 
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          completedSteps.has(i)
                            ? 'bg-green-500'
                            : i === currentStep
                            ? 'bg-blue-500'
                            : 'bg-gray-200'
                        }`}
                        title={`Step ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Module Completion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Award className="w-4 h-4" />
                  <span>Completion</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Star className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Earn {modulePoints} points</p>
                      <p className="text-xs text-gray-500">Complete all steps to earn points</p>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={handleCompleteModule}
                    disabled={!allStepsCompleted}
                  >
                    {allStepsCompleted ? 'Complete Module' : 'Complete All Steps to Finish'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

}
