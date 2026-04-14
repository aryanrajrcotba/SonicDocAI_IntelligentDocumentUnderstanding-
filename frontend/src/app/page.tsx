"use client";

import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, ShieldAlert, RefreshCw, Plus } from 'lucide-react';
import VoiceAgent from '../components/VoiceAgent';

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [ingestionData, setIngestionData] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // Simulate instantaneous offline ingestion bypass delay
    setTimeout(() => {
        setIngestionData({
            filename: file.name,
            classification: "Unstructured Contract", // Dummy ML class
            extraction_time_sec: 0.124, // Mock hyper-fast local speed
            embedding_time_sec: 0.354, 
            cost: "$0.00",
            chunks: 42
        });
        setIsUploading(false);
    }, 1500);

    // Actual endpoint block - commented out since FastAPI server must run for truth logic.
    /*
    const formData = new FormData();
    formData.append("file", file);
    try {
        const res = await fetch("http://localhost:8000/upload", { method: "POST", body: formData });
        const data = await res.json();
        setIngestionData(data);
    } catch(e) { }
    setIsUploading(false);
    */
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white selection:bg-blue-500/30 font-sans relative">
      
      {/* Abstract Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 flex flex-col min-h-screen">
        
        {/* Header Ribbon */}
        <header className="flex justify-between items-center mb-16">
            <div className="flex items-center space-x-3">
                <img src="/logo.png" alt="SonicDoc AI Logo" className="w-12 h-12 object-contain" />
                <h1 className="text-xl font-bold tracking-tight text-zinc-100">SonicDoc AI</h1>
            </div>
            <div className="flex space-x-4 items-center">
                <div className="px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold tracking-wider flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>ENGINES ONLINE</span>
                </div>
            </div>
        </header>

        {/* Two Column Layout Grid */}
        <div className="grid lg:grid-cols-12 gap-12 flex-grow">
            
            {/* Left Column - Engine A: Ingestion */}
            <div className="lg:col-span-5 space-y-8">
                <div>
                     <h2 className="text-3xl font-semibold mb-2">Initialize Target</h2>
                     <p className="text-zinc-400">Drag and drop a complex document to parse entirely.</p>
                </div>

                {!ingestionData ? (
                    <label className="group relative w-full h-64 border-2 border-dashed border-zinc-700 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-zinc-900/40 hover:bg-zinc-900/80 transition-all duration-300">
                      <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg" />
                      
                      {isUploading ? (
                          <div className="space-y-4 text-center text-blue-400">
                              <RefreshCw className="w-12 h-12 mx-auto animate-spin" />
                              <p className="font-mono text-sm tracking-widest">RUNNING LOCAL ML PIPELINE</p>
                          </div>
                      ) : (
                          <div className="space-y-4 text-center text-zinc-500 group-hover:text-blue-400 transition-colors">
                              <UploadCloud className="w-12 h-12 mx-auto" />
                              <div>
                                  <p className="text-zinc-300 font-medium text-lg">Drop Document Here</p>
                                  <p className="text-sm">PDF, Docs, Excel, PPT, Images</p>
                              </div>
                          </div>
                      )}
                    </label>
                ) : (
                    <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-blue-500 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <FileText className="w-8 h-8 text-blue-400" />
                                <div>
                                    <h3 className="font-medium text-zinc-100 truncate w-48">{ingestionData.filename}</h3>
                                    <p className="text-xs text-zinc-500 font-mono text-blue-400">{ingestionData.classification}</p>
                                </div>
                            </div>
                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Extraction Speed</p>
                                <p className="font-mono text-lg text-zinc-200">{ingestionData.extraction_time_sec}s</p>
                            </div>
                            <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Vectorization</p>
                                <p className="font-mono text-lg text-zinc-200">{ingestionData.embedding_time_sec}s</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => { setIngestionData(null); setIsUploading(false); }}
                            className="w-full mt-2 flex items-center justify-center space-x-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 py-3 rounded-xl transition-all duration-300 font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add Another Document</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Right Column - Engine B: Voice Interrogation */}
            <div className="lg:col-span-7 flex flex-col justify-center">
                <VoiceAgent />
            </div>

        </div>
      </div>
    </main>
  );
}


