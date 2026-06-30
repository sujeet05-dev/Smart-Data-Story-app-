import React, { useState, useEffect, useRef } from 'react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

export default function Login({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
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
          
          float wave1 = sin(uv.x * 3.0 + u_time * 0.5) * 0.1;
          float wave2 = sin(uv.x * 5.0 - u_time * 0.8) * 0.05;
          float wave3 = cos(uv.x * 2.0 + u_time * 0.3) * 0.08;
          
          float waves = wave1 + wave2 + wave3;
          float line = smoothstep(0.015, 0.0, abs(uv.y - 0.5 - waves));
          
          float wave4 = sin(uv.x * 4.0 + u_time * 0.4 + 1.0) * 0.12;
          float line2 = smoothstep(0.01, 0.0, abs(uv.y - 0.55 - wave4));
          
          float wave5 = cos(uv.x * 6.0 - u_time * 0.6 + 2.0) * 0.07;
          float line3 = smoothstep(0.012, 0.0, abs(uv.y - 0.45 - wave5));
          
          vec3 color = vec3(1.0);
          float alpha = (line * 0.4) + (line2 * 0.2) + (line3 * 0.15);
          
          alpha *= (1.0 - abs(uv.x - 0.5) * 1.5);
          alpha = clamp(alpha, 0.0, 0.6);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || (!isLogin && !email)) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      let data;
      if (isLogin) {
        data = await authService.login(username, password);
        toast.success(`Logged in as ${data.user.username}`);
      } else {
        data = await authService.signup(username, email, password);
        toast.success('Registration successful!');
      }
      onAuthSuccess(data.user);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden select-none">
      {/* Background WebGL wave animation */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-45">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Top Bar Logo */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="flex justify-between items-center max-w-[1440px] mx-auto px-8 h-16">
          <div className="font-bold text-xl text-white tracking-wider font-mono">
            DataStoryAi
          </div>
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-sm font-semibold text-white/70 hover:text-white transition-all cursor-pointer"
          >
            {isLogin ? 'Create Account' : 'Sign In'}
          </button>
        </div>
      </nav>

      {/* Auth Card */}
      <main className="relative z-10 w-full max-w-[440px] p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="glass-card rounded-2xl p-8 precise-shadow">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-black font-bold text-3xl">analytics</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h1>
            <p className="text-sm text-white/50 text-center mt-1">
              {isLogin 
                ? 'Enter your credentials to access your data stories' 
                : 'Create an account to start analyzing your datasets'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=""
                className="w-full px-4 py-3 bg-[#161618] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#ffb0c8]/20 focus:border-[#ffb0c8] transition-all outline-none"
                disabled={loading}
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-4 py-3 bg-[#161618] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#ffb0c8]/20 focus:border-[#ffb0c8] transition-all outline-none"
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#161618] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#ffb0c8]/20 focus:border-[#ffb0c8] transition-all outline-none"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#ffb0c8] text-[#5e1133] hover:bg-[#ffa0bd] py-3 rounded-xl font-bold active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#ffb0c8]/10 cursor-pointer mt-4 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-[#5e1133] border-t-transparent rounded-full animate-spin"></span>
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/50">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#ffb0c8] hover:underline font-semibold cursor-pointer"
              disabled={loading}
            >
              {isLogin ? 'Sign up for free' : 'Sign in'}
            </button>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full py-4 bg-black/60 backdrop-blur-sm border-t border-white/10 z-50">
        <div className="max-w-[1440px] mx-auto px-8 flex justify-between items-center text-[10px] text-white/45">
          <p>© 2026 DataStoryAi. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-white transition-colors">Privacy Policy</span>
            <span className="cursor-pointer hover:text-white transition-colors">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
