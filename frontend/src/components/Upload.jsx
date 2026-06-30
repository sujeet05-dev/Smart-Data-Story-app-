import React, { useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { dataService } from '../services/api';
import toast from 'react-hot-toast';

export default function Upload({ user, onUploadSuccess, onLogout }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [statusText, setStatusText] = useState('Scanning for dataset patterns...');
  
  const canvasRef = useRef(null);

  // WebGL shader waves animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      varying vec2 v_texCoord;

      void main() {
          vec2 uv = v_texCoord;
          
          float wave1 = sin(uv.x * 4.0 + u_time * 0.3) * 0.08;
          float wave2 = sin(uv.x * 6.0 - u_time * 0.5) * 0.04;
          float wave3 = cos(uv.x * 3.0 + u_time * 0.2) * 0.06;
          
          float waves = wave1 + wave2 + wave3;
          float line = smoothstep(0.015, 0.0, abs(uv.y - 0.5 - waves));
          
          float wave4 = sin(uv.x * 5.0 + u_time * 0.3 + 1.2) * 0.1;
          float line2 = smoothstep(0.01, 0.0, abs(uv.y - 0.52 - wave4));
          
          vec3 color = vec3(1.0);
          float alpha = (line * 0.3) + (line2 * 0.15);
          
          alpha *= (1.0 - abs(uv.x - 0.5) * 1.5);
          alpha = clamp(alpha, 0.0, 0.5);

          gl_FragColor = vec4(color * alpha, alpha);
      }
    `;

    function cs(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    function render(t) {
      if (!canvas) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleUpload = async (file) => {
    setUploading(true);
    setFileName(file.name);
    setProgress(10);
    setStatusText('Uploading file to server...');

    try {
      // Simulate file reading progress
      const uploadInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 60) {
            clearInterval(uploadInterval);
            return 60;
          }
          return prev + 10;
        });
      }, 200);

      // Make actual API call
      const data = await dataService.uploadDataset(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        // Map actual upload progress from 10% to 70%
        const scaledProgress = 10 + Math.round(percentCompleted * 0.6);
        setProgress(scaledProgress);
      });

      clearInterval(uploadInterval);
      setProgress(75);
      setStatusText('Parsing data and missing value scans...');
      
      const preprocessingInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(preprocessingInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 400);

      // Wait a little bit for processing completion feel
      setTimeout(() => {
        clearInterval(preprocessingInterval);
        setProgress(100);
        setStatusText('Analysis completed successfully!');
        toast.success('Dataset uploaded & analyzed!');
        setTimeout(() => {
          onUploadSuccess(data);
        }, 600);
      }, 1500);

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Analysis failed. Please check the file content.');
      setUploading(false);
      setProgress(0);
    }
  };

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      handleUpload(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="relative min-h-screen flex flex-col bg-black text-white overflow-hidden select-none">
      {/* Background WebGL wave animation */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-25">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Top Navigation */}
      <nav className="relative z-10 w-full bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="flex justify-between items-center max-w-[1440px] mx-auto px-8 h-16">
          <div className="font-bold text-xl text-white tracking-wider font-mono">
            DataStoryAi
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs text-white/50 font-mono">User: {user?.username}</span>
            <button 
              onClick={onLogout} 
              className="text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Upload Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-[720px] text-center">
          
          {/* Header */}
          <div className="mb-8 space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Upload your intelligence
            </h1>
            <p className="text-base text-white/60 max-w-lg mx-auto leading-relaxed">
              Transform raw metrics into narrative-driven insights. Connect your source and let AI tell the story.
            </p>
          </div>

          {/* Drag & Drop Container */}
          <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            {!uploading ? (
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer bg-white/2 hover:bg-white/5 ${
                  isDragActive ? 'border-[#ffb0c8] drag-over' : 'border-white/10'
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white mb-2 shadow-inner">
                  <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white">
                    {isDragActive ? 'Drop your file here' : 'Drag & drop dataset'}
                  </h3>
                  <p className="text-sm text-white/55">
                    or click to browse your local storage
                  </p>
                </div>
                <button 
                  type="button"
                  className="mt-2 bg-white text-black px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-white/90 active:scale-95 transition-all shadow-lg cursor-pointer"
                >
                  Browse File
                </button>
              </div>
            ) : (
              /* Progress View */
              <div className="py-8 px-4 space-y-6">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2 max-w-[70%]">
                    <span className="material-symbols-outlined text-[#ffb0c8] animate-pulse">insert_drive_file</span>
                    <span className="font-mono text-xs truncate font-medium">{fileName}</span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-[#ffb0c8]">{progress}%</span>
                </div>
                
                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-[#ffb0c8] to-[#efbc94] transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(255,176,200,0.5)]" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center gap-2.5 justify-center text-white/70">
                  <span className="w-4 h-4 border-2 border-[#ffb0c8] border-t-transparent rounded-full animate-spin"></span>
                  <p className="font-mono text-[11px] uppercase tracking-wider">{statusText}</p>
                </div>
              </div>
            )}
          </div>

          {/* Details / Features Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-5 rounded-2xl bg-white/2 border border-white/8 backdrop-blur-sm">
              <span className="material-symbols-outlined text-white mb-2 bg-white/5 p-2 rounded-lg">description</span>
              <h4 className="text-xs font-semibold text-white mb-1 uppercase tracking-wider">Formats</h4>
              <p className="text-xs text-white/50 leading-relaxed">CSV, XLSX, and XLS spreadsheet formats are supported.</p>
            </div>
            <div className="p-5 rounded-2xl bg-white/2 border border-white/8 backdrop-blur-sm">
              <span className="material-symbols-outlined text-white mb-2 bg-white/5 p-2 rounded-lg">hard_drive</span>
              <h4 className="text-xs font-semibold text-white mb-1 uppercase tracking-wider">Capacity</h4>
              <p className="text-xs text-white/50 leading-relaxed">Upload datasets up to 200MB. Auto-sampled for performant rendering.</p>
            </div>
            <div className="p-5 rounded-2xl bg-white/2 border border-white/8 backdrop-blur-sm">
              <span className="material-symbols-outlined text-white mb-2 bg-white/5 p-2 rounded-lg">security</span>
              <h4 className="text-xs font-semibold text-white mb-1 uppercase tracking-wider">Privacy</h4>
              <p className="text-xs text-white/50 leading-relaxed">Runs in secure memory. No persistence of raw dataset outside of sessions.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 border-t border-white/10 bg-black text-[10px] text-white/45 z-50">
        <div className="max-w-[1440px] mx-auto px-8 flex justify-between items-center">
          <p>© 2026 DataStoryAi. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
