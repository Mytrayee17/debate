import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a friendly debate tutor. Explain concepts clearly and give helpful feedback." },
        { role: "user", content: message },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });
    const reply = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a reply.";
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ reply: "Sorry, something went wrong." }, { status: 500 });
  }
} 