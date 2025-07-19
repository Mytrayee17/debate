"use client";
import React, { useState } from "react";

export default function LearnAIChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { role: "user", content: input }]);
    setLoading(true);
    setInput("");
    const res = await fetch("/api/ai-learn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });
    const data = await res.json();
    setMessages((msgs) => [...msgs, { role: "ai", content: data.reply }]);
    setLoading(false);
  };

  return (
    <div className="mt-8 border-t pt-4">
      <h3 className="font-bold mb-2">Ask the AI Tutor</h3>
      <div className="max-h-48 overflow-y-auto mb-2 bg-gray-50 p-2 rounded">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <span className={m.role === "user" ? "text-blue-700" : "text-purple-700"}>
              <b>{m.role === "user" ? "You" : "AI"}:</b> {m.content}
            </span>
          </div>
        ))}
        {loading && <div className="text-purple-500">AI is typing...</div>}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Ask a question or paste your argument..."
        />
        <button className="bg-blue-600 text-white px-4 py-1 rounded" onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
} 