import React, { useState, useRef } from "react";

// TypeScript type for SpeechRecognition
interface SpeechRecognitionType extends EventTarget {
  lang: string;
  interimResults: boolean;
  // @ts-ignore: Suppress TS error for SpeechRecognitionEvent
  onresult: ((event: any) => void) | null;
  // @ts-ignore: Suppress TS error for SpeechRecognitionErrorEvent
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

// @ts-ignore: Suppress TS error for window.SpeechRecognition
const SpeechRecognitionCtor = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

interface VoiceTranscriberProps {
  debateTask: string;
  onPointsAwarded?: (points: number) => void;
}

export default function VoiceTranscriber({ debateTask, onPointsAwarded }: VoiceTranscriberProps) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [aiReply, setAiReply] = useState("");
  const [transcriberPoints, setTranscriberPoints] = useState<number | null>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  const startListening = () => {
    if (!SpeechRecognitionCtor) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }
    // @ts-ignore: Suppress TS error for SpeechRecognitionCtor
    const recognition: SpeechRecognitionType = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    // @ts-ignore: Suppress TS error for SpeechRecognitionEvent
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      if (startTime !== null) {
        setDuration((Date.now() - startTime) / 1000); // seconds
      }
      setWordCount(text.trim().split(/\s+/).length);
    };
    // @ts-ignore: Suppress TS error for SpeechRecognitionErrorEvent
    recognition.onerror = (event: any) => {
      alert("Speech recognition error: " + event.error);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setStartTime(Date.now());
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const sendToBackend = async () => {
    const data = {
      transcript,
      speechMetrics: {
        duration,
        wordCount,
      },
      debateTask,
    };
    const response = await fetch("/api/debate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    setAiReply(result.aiOpponentReply);
    setTranscriberPoints(result.pointsAwarded);
    if (onPointsAwarded && typeof result.pointsAwarded === "number") {
      onPointsAwarded(result.pointsAwarded);
    }
  };

  return (
    <div>
      <button onClick={listening ? stopListening : startListening}>
        {listening ? "Stop Listening" : "Start Listening"}
      </button>
      <div>
        <strong>Transcript:</strong> {transcript}
      </div>
      <div>
        <strong>Duration:</strong> {duration.toFixed(2)} seconds
      </div>
      <div>
        <strong>Word Count:</strong> {wordCount}
      </div>
      <button onClick={sendToBackend} disabled={!transcript}>
        Submit for AI Feedback
      </button>
      {aiReply && (
        <div style={{ marginTop: "1em" }}>
          <strong>AI Opponent:</strong> {aiReply}
        </div>
      )}
      {transcriberPoints !== null && (
        <div>
          <strong>Points Awarded:</strong> {transcriberPoints}
        </div>
      )}
    </div>
  );
} 