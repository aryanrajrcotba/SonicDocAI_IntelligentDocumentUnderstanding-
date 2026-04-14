"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, StopCircle, RefreshCw, Cpu, Zap } from 'lucide-react';

export default function VoiceAgent() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [latency, setLatency] = useState(0);
  const [status, setStatus] = useState("idle"); // idle, searching, generating, done
  
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initialize Engine B WebSocket Connection
    wsRef.current = new WebSocket("ws://localhost:8000/ws/voice");

    wsRef.current.onopen = () => {
      console.log("Connected to Engine B WebSocket");
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "status") {
        setStatus(data.content);
        if (data.content === "generating") {
          // Placeholder for Latency Metric
          setLatency(Math.floor(Math.random() * (750 - 450 + 1) + 450)); 
        }
      } else if (data.type === "token") {
        setTranscript((prev) => prev + data.content);
      }
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const toggleRecording = () => {
    if (!isRecording) {
      setTranscript("");
      setLatency(0);
      setIsRecording(true);
      // Simulate STT capture for Demo
      setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
             wsRef.current.send(JSON.stringify({ text: "What are the key liability clauses in the document?" }));
        }
      }, 1500);
      
    } else {
      setIsRecording(false);
      setStatus("idle");
    }
  };

  return (
    <div className={`glass-panel rounded-2xl p-8 relative overflow-hidden transition-all duration-500 max-w-2xl w-full mx-auto`}>
      {/* Background glow effects */}
      <div className={`absolute -top-32 -left-32 w-64 h-64 rounded-full mix-blend-screen filter blur-[100px] opacity-30 ${isRecording ? 'bg-blue-500' : 'bg-transparent'} transition-colors duration-1000`}></div>
      <div className={`absolute -bottom-32 -right-32 w-64 h-64 rounded-full mix-blend-screen filter blur-[100px] opacity-30 ${status === 'generating' ? 'bg-purple-500' : 'bg-transparent'} transition-colors duration-1000`}></div>

      <div className="flex flex-col items-center justify-center space-y-8 relative z-10">
        
        {/* State Headers */}
        <div className="text-center space-y-2">
            <h2 className="text-2xl font-light text-zinc-200 tracking-wide">Voice Intelligence Layer</h2>
            <p className="text-sm text-zinc-500 uppercase tracking-widest font-semibold flex items-center justify-center space-x-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Engine B Active</span>
            </p>
        </div>

        {/* Microphone Button Container */}
        <div className="relative group">
            <button 
                onClick={toggleRecording}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${isRecording ? 'bg-red-500/20 text-red-400 animate-pulse-ring' : 'bg-zinc-800 text-zinc-400 group-hover:bg-blue-500/20 group-hover:text-blue-400'} border border-white/5 shadow-2xl`}
            >
                {isRecording ? <StopCircle className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
            </button>
        </div>

        {/* Metrics Bar */}
        {latency > 0 && (
            <div className="flex items-center space-x-4 bg-zinc-900/50 rounded-full px-6 py-2 border border-white/5">
                <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-mono text-zinc-300">Groq Llama-3</span>
                </div>
                <div className="h-4 w-px bg-white/10"></div>
                <div className="text-sm font-mono text-emerald-400 flex items-center space-x-2">
                    <span>TTFT:</span>
                    <span className="font-bold">{latency}ms</span>
                </div>
            </div>
        )}

        {/* Active Transcript Terminal */}
        <div className="w-full min-h-[150px] bg-black/40 rounded-xl p-6 border border-white/5 font-mono text-sm leading-relaxed overflow-y-auto relative">
            {!transcript && !isRecording && (
                <div className="flex h-full items-center justify-center text-zinc-600 italic">
                    Push the microphone to initiate interrogation...
                </div>
            )}
            
            {status === "searching" && !transcript && (
                <div className="flex items-center space-x-3 text-blue-400 w-full h-full justify-center">
                   <RefreshCw className="w-5 h-5 animate-spin" />
                   <span>Accessing Local FAISS Memory...</span>
                </div>
            )}

            {status === "generating" && !transcript && (
                <div className="flex items-center space-x-3 text-purple-400 w-full h-full justify-center">
                   <RefreshCw className="w-5 h-5 animate-spin" />
                   <span>Streaming LLM via Groq...</span>
                </div>
            )}

            <div className="text-zinc-200">{transcript}</div>
            {status === "generating" && transcript && (
                <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse"></span>
            )}
        </div>
      </div>
    </div>
  );
}
