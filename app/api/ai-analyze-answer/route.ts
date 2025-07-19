import { NextRequest, NextResponse } from "next/server";
import { genAI } from "../../../lib/geminiClient";

export async function POST(req: NextRequest) {
  try {
    const { question, answer } = await req.json();
    const prompt = `
You are an expert debate coach. Analyze the following student's answer to the question. 
Give a JSON response with: 
- overallScore (0-100)
- summaryLabel (one word, e.g. 'Good', 'Excellent', 'Needs Work')
- keyStrengths (array)
- areasForGrowth (array)
Question: """${question}"""
Answer: """${answer}"""
Respond ONLY with valid JSON.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text() || "{}";
    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch {
      analysis = { overallScore: null, summaryLabel: "Error", keyStrengths: [], areasForGrowth: ["Could not parse AI response."] };
    }
    return NextResponse.json(analysis);
  } catch (error: any) {
    return NextResponse.json({ overallScore: null, summaryLabel: "Error", keyStrengths: [], areasForGrowth: [error.message || "AI error."] }, { status: 500 });
  }
} 