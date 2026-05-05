import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';

export default function FileUpload({ onUpload, isLoading }) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null);
    if (rejectedFiles.length > 0) {
      setError('Please upload a valid CSV or Excel file (max 200MB).');
      return;
    }
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0], setUploadProgress);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    maxSize: 200 * 1024 * 1024, // 200MB
    disabled: isLoading,
  });

  return (
    <div className="w-full">
      <div
        className={`group relative rounded-3xl p-[2px] transition-all duration-500 ease-out
          ${isDragActive ? 'scale-[1.02]' : 'hover:scale-[1.01]'}
        `}
        style={{
          background: isDragActive 
            ? 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)'
            : 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.2), rgba(99,102,241,0.1))',
          boxShadow: isDragActive 
            ? '0 0 50px rgba(99,102,241,0.5), inset 0 0 20px rgba(139,92,246,0.4)' 
            : '0 10px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div
          {...getRootProps()}
          className={`relative overflow-hidden cursor-pointer rounded-[22px] backdrop-blur-2xl flex flex-col items-center justify-center p-12 sm:p-20 text-center transition-all duration-500
            ${isLoading ? 'pointer-events-none opacity-95' : ''}
          `}
          style={{
            background: isDragActive
              ? 'rgba(10, 10, 26, 0.85)'
              : 'rgba(15, 15, 35, 0.75)',
          }}
        >
          <input {...getInputProps()} />

          {/* Decorative Background Elements inside Dropzone */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[22px]">
            <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[60px] transition-all duration-700 ${isDragActive ? 'bg-indigo-500/40 scale-110' : 'bg-indigo-500/20 group-hover:bg-indigo-500/30'}`} />
            <div className={`absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-[60px] transition-all duration-700 ${isDragActive ? 'bg-purple-500/40 scale-110' : 'bg-purple-500/20 group-hover:bg-purple-500/30'}`} />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center w-full">
            {isLoading ? (
              <div className="flex flex-col items-center w-full max-w-md mx-auto animate-fadeIn">
                <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500/20" />
                  <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500 border-t-transparent animate-spin" />
                  <div className="absolute inset-2 rounded-full border-[3px] border-purple-500/30 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  <Loader2 className="w-10 h-10 text-indigo-400 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Analyzing Dataset</h3>
                <p className="text-[var(--text-secondary)] text-center mb-8 font-medium leading-relaxed">
                  Extracting intelligence, running machine learning models, and generating narratives...
                </p>
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full">
                    <div className="flex justify-between text-sm font-bold text-indigo-300 mb-2 px-1">
                      <span className="uppercase tracking-wider text-xs">Uploading Data</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-3 w-full bg-indigo-950/50 rounded-full overflow-hidden border border-indigo-500/20 shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300 relative"
                        style={{ width: `${uploadProgress}%` }}
                      >
                        <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/30 blur-[2px] -skew-x-12 animate-[shimmer_1s_infinite]" />
                      </div>
                    </div>
                  </div>
                )}
                {uploadProgress >= 100 && (
                   <div className="flex items-center gap-3 text-indigo-300 bg-indigo-500/10 px-6 py-3 rounded-full border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                     <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                     <span className="font-semibold tracking-wide text-sm">Finalizing AI Story...</span>
                   </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full animate-fadeInUp text-center">
                <div className={`
                  w-32 h-32 mb-8 rounded-full flex items-center justify-center
                  transition-all duration-500 relative
                  ${isDragActive ? 'scale-110' : 'group-hover:-translate-y-2'}
                `}>
                  <div className={`absolute inset-0 rounded-full transition-all duration-500 ${isDragActive ? 'bg-indigo-500/30 blur-2xl' : 'bg-indigo-500/20 blur-xl group-hover:bg-indigo-500/30 group-hover:blur-2xl'}`} />
                  <div className={`absolute inset-0 rounded-full border backdrop-blur-md transition-all duration-500 ${isDragActive ? 'bg-gradient-to-br from-indigo-500/40 to-purple-600/40 border-indigo-400/50' : 'bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border-indigo-500/30'}`} />
                  {isDragActive ? (
                    <FileSpreadsheet className="w-14 h-14 text-white relative z-10 animate-bounce" />
                  ) : (
                    <UploadCloud className="w-14 h-14 text-indigo-300 relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:text-white" />
                  )}
                </div>

                <h2 className="flex flex-col items-center justify-center w-full text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300 mb-4 tracking-tight pb-1">
                  <span>{isDragActive ? 'Drop dataset to begin' : 'Upload your dataset'}</span>
                </h2>
                
                <p className="w-full text-center text-lg text-[var(--text-secondary)] mb-10 font-medium max-w-md mx-auto leading-relaxed">
                  Drag and drop your CSV or Excel file here, or click anywhere inside to browse your computer.
                </p>

                <div className="flex items-center justify-center gap-4 text-xs sm:text-sm font-semibold text-gray-300 bg-black/30 px-6 py-3 rounded-full border border-white/5 backdrop-blur-md shadow-xl">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" /> CSV</span>
                  <div className="w-px h-4 bg-gray-600" />
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" /> XLSX</span>
                  <div className="w-px h-4 bg-gray-600" />
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" /> XLS</span>
                  <div className="w-px h-4 bg-gray-600" />
                  <span className="text-gray-400">Max 200MB</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-5 rounded-2xl flex items-center justify-center gap-3 bg-red-500/10 border border-red-500/30 backdrop-blur-md animate-slideIn shadow-[0_4px_20px_rgba(239,68,68,0.15)]">
          <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
          <p className="text-base font-semibold text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}
