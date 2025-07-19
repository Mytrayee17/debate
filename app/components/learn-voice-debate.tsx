import React, { useState, useRef } from "react";

export default function LearnVoiceDebate() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [volume, setVolume] = useState<number | null>(null);
  const [error, setError] = useState("");
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const volumeSamples = useRef<number[]>([]);

  // Start recording and transcription
  const startRecording = async () => {
    setError("");
    setTranscript("");
    setAiReply("");
    setVolume(null);
    volumeSamples.current = [];

    // Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };
    recognition.onerror = (event: any) => {
      setError("Speech recognition error: " + event.error);
      setIsRecording(false);
    };
    recognitionRef.current = recognition;
    recognition.start();

    // Web Audio API for volume
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.fftSize);
      const getVolume = () => {
        if (!isRecording) return;
        analyser.getByteTimeDomainData(dataArray);
        // Calculate RMS volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const db = 20 * Math.log10(rms);
        if (!isNaN(db)) {
          volumeSamples.current.push(db);
          setVolume(db);
        }
        if (isRecording) requestAnimationFrame(getVolume);
      };
      getVolume();
    } catch (err) {
      setError("Microphone access denied or unavailable.");
      recognition.stop();
      setIsRecording(false);
      return;
    }
    setIsRecording(true);
  };

  // Stop recording and process
  const stopRecording = async () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    // Calculate average volume
    const avgVolume =
      volumeSamples.current.length > 0
        ? volumeSamples.current.reduce((a, b) => a + b, 0) / volumeSamples.current.length
        : null;
    setVolume(avgVolume);
    // Send to AI backend
    if (transcript.trim()) {
      setAiReply("Thinking...");
      try {
        const res = await fetch("/api/taskmaster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestType: "debate-reply",
            transcript,
            avgVolume,
          }),
        });
        const data = await res.json();
        if (data.reply) {
          setAiReply(data.reply);
          // Speak the reply
          if (window.speechSynthesis) {
            const utter = new window.SpeechSynthesisUtterance(data.reply);
            window.speechSynthesis.speak(utter);
          }
        } else {
          setAiReply("No reply from AI.");
        }
      } catch (err) {
        setAiReply("Error contacting AI backend.");
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow space-y-6">
      <h2 className="text-2xl font-bold">Learn: Voice Debate Practice</h2>
      <div className="space-y-2">
        <button
          className={`px-4 py-2 rounded text-white ${isRecording ? "bg-red-600" : "bg-blue-600"}`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>
        {error && <div className="text-red-600">{error}</div>}
      </div>
      <div>
        <h3 className="font-semibold">Your Speech (Transcribed):</h3>
        <div className="p-3 bg-gray-100 rounded min-h-[60px]">{transcript || <span className="text-gray-400">(Speak to see text...)</span>}</div>
        {volume !== null && (
          <div className="text-sm text-gray-600 mt-2">Avg. Volume: {volume.toFixed(2)} dB</div>
        )}
      </div>
      <div>
        <h3 className="font-semibold">AI's Debate Reply:</h3>
        <div className="p-3 bg-green-50 rounded min-h-[60px]">{aiReply || <span className="text-gray-400">(AI reply will appear here)</span>}</div>
      </div>
      <div className="text-xs text-gray-400 pt-4">
        Powered by Web Speech API, Web Audio API, and AI backend.
      </div>
    </div>
  );
} 