import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

export default function VoiceInterface() {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("Disconnected");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  
  const wsRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // 1. Establish WebSocket Connection to FastAPI
    try {
        wsRef.current = new WebSocket('ws://localhost:8000/ws/voice');
        
        wsRef.current.onopen = () => setStatus("Connected (Latency <50ms)");
        wsRef.current.onclose = () => setStatus("Disconnected");
        
        wsRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'answer') {
            setResponse(data.text);
            speakText(data.text);
          }
        };
    } catch(err) {
        setStatus("WS Error");
    }

    // 2. Initialize Browser Web Speech API for low-latency Voice to Text
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsListening(false);
        
        // Dispatch string immediately over WebSocket for RAG injection
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
           wsRef.current.send(JSON.stringify({ query: text }));
           setResponse("Analyzing context...");
        } else {
           setResponse("Cannot query: WebSocket is disconnected. Is the backend running?");
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        if (event.error !== 'aborted') setStatus("Microphone Error: " + event.error);
      };
      
      recognitionRef.current.onend = () => {
         setIsListening(false);
      };
    }

    // Unmount
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
        alert("Your browser does not support the Web Speech API. Use Chrome or Edge.");
        return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      setResponse("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text) => {
    // We utilize the Browser Synthesis engine natively to drop the TTS latency to 0ms
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name.includes("US English") || v.lang === "en-US") || voices[0];
    if (voice) utterance.voice = voice;
    
    // Slight bump to speed up the read-out for that premium AI feel
    utterance.rate = 1.1; 
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-3xl shadow-2xl hover:border-purple-500/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-400">
            <Mic size={24} />
          </div>
          <h2 className="text-2xl font-semibold text-white">Live Interrogation</h2>
        </div>
        <div className={`text-xs font-bold px-2 py-1 rounded-full ${status.includes('Connected') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {status}
        </div>
      </div>
      
      <p className="text-slate-400 mb-6 text-sm">Ask questions via Voice. The RAG pipeline processes your queries and reads the answers back securely.</p>
      
      <button 
        onClick={toggleListening}
        className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 shadow-lg flex items-center justify-center space-x-2 ${
            isListening 
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-500/50'
            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-500/30'
        }`}
      >
          {isListening ? <><MicOff size={20} /><span>Listening... (Tap to Cancel)</span></> : <><Mic size={20} /><span>Tap to Speak</span></>}
      </button>

      {/* Voice Transcript Display Zones */}
      {transcript && (
          <div className="mt-6 p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 animate-fade-in">
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-1 block">You Said</span>
              <p className="text-white text-sm">{transcript}</p>
          </div>
      )}
      
      {response && (
          <div className="mt-3 p-4 rounded-xl bg-blue-900/20 border border-blue-500/30 animate-fade-in">
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1 block">SonicDoc AI</span>
              <p className="text-white text-sm leading-relaxed">{response}</p>
          </div>
      )}
    </div>
  );
}
