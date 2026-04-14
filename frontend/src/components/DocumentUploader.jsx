import React, { useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';

export default function DocumentUploader() {
  const [isHovering, setIsHovering] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsHovering(false);
    const file = e.dataTransfer?.files[0] || e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Upload failed:', error);
      setResult({ status: 'error', message: 'Upload communication failed.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      className={`bg-slate-800/50 backdrop-blur-xl border-2 ${isHovering ? 'border-blue-500' : 'border-slate-700/50'} p-6 rounded-3xl shadow-2xl transition-all duration-300 relative`}
      onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
      onDragLeave={() => setIsHovering(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
          <FileUp size={24} />
        </div>
        <h2 className="text-2xl font-semibold text-white">Document Triage</h2>
      </div>
      <p className="text-slate-400 mb-6 text-sm">Upload PDF, DOCX, or Images for automatic OCR and vector embedding extraction.</p>
      
      <div className="relative">
        <input 
          type="file" 
          id="file-upload" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          onChange={handleDrop}
        />
        <button className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2">
            {uploading ? <Loader2 className="animate-spin text-blue-400" size={20} /> : <span>Drop files to upload</span>}
        </button>
      </div>

      {result && (
        <div className="mt-4 p-3 bg-slate-900/50 rounded-lg text-sm border border-slate-700">
          {result.status === 'success' 
            ? <span className="text-green-400 font-semibold">Success! Indexed {result.chunks_embedded} semantic chunks from {result.filename}.</span>
            : <span className="text-red-400 italic">Error: {result.message}</span>}
        </div>
      )}
    </div>
  );
}
