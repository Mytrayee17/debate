import { NextRequest, NextResponse } from "next/server";
import { genAI } from "../../../lib/geminiClient";

export async function POST(req: NextRequest) {
  try {
    const { transcript, speechMetrics, debateTask } = await req.json();
    const prompt = `
You are an expert AI debate opponent. The debate topic is: "${debateTask}".
The user's argument: "${transcript}"
Their speaking metrics: ${JSON.stringify(speechMetrics)}
Reply with a strong, reasoned counter-argument, and suggest a points value (0-100) for the user's performance.
Respond in JSON: { "aiOpponentReply": "...", "pointsAwarded": ... }
`;
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let data;
    try {
      data = JSON.parse(response.text());
    } catch {
      data = { aiOpponentReply: "Sorry, I couldn't process that.", pointsAwarded: 0 };
    }
    return NextResponse.json({
      aiOpponentReply: data.aiOpponentReply,
      pointsAwarded: data.pointsAwarded,
      totalPoints: 100, // Replace with real user data if available
      level: 2,         // Replace with real user data if available
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate AI reply." }, { status: 500 });
  }
} 