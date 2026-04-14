import React from 'react';
import DocumentUploader from './components/DocumentUploader';
import VoiceInterface from './components/VoiceInterface';

function App() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-900 flex flex-col items-center justify-center p-6 lg:p-12">
      {/* Background blobs for premium aesthetic */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob" style={{animationDelay: '1.5s'}}></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob" style={{animationDelay: '3s'}}></div>

      <div className="relative z-10 max-w-5xl w-full">
         <header className="text-center mb-16 animate-fade-in">
           <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight mb-4 drop-shadow-lg">
             SonicDoc AI
           </h1>
           <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
             Intelligent Document Understanding via Postgres pgvector & Ultra-Low Latency Voice Commands
           </p>
         </header>

         {/* Grid layout for features */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
           <DocumentUploader />
           <VoiceInterface />
         </div>
      </div>
    </div>
  );
}

export default App;
