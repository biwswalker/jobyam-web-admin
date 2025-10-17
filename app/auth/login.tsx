import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingOverlay from '../components/LoadingOverlay';
import { motion } from 'framer-motion';
import api from '../services/api';

// Import language context
type Language = 'th' | 'en';

// Particle component for the background
function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);

    // Create particles
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      opacity: number;
      pulse: boolean;
    }> = [];

    const createParticles = () => {
      const particleCount = Math.floor(window.innerWidth / 15); // Responsive particle count

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          color: ['#0038A8'][Math.floor(Math.random() * 1)],
          opacity: Math.random() * 0.5 + 0.2,
          pulse: Math.random() > 0.5
        });
      }
    };

    createParticles();

    // Draw and animate particles
    let animationFrameId: number;
    let angle = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      angle += 0.002;

      // Draw connections between nearby particles
      ctx.lineWidth = 0.3;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 56, 168, ${0.18 * (1 - distance / 100)})`;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      particles.forEach(particle => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Pulse effect
        if (particle.pulse) {
          particle.opacity = 0.2 + Math.abs(Math.sin(angle * 5)) * 0.3;
          particle.size = 0.5 + Math.abs(Math.sin(angle * 5)) * 1.5;
        }

        // Boundary check
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace(')', `, ${particle.opacity})`);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0"></canvas>;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('th');

  // Blue color palette
  const blue = '#0038A8'; // Israeli flag blue
  const blueLight = '#1A4CA8';
  const blueDark = '#002060';

  // Initialize language from localStorage, but only in browser environment
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('jobyamLanguage');
      if (savedLanguage === 'en') {
        setLanguage('en');
      }
    }
  }, []);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Get the current URL path
      const currentPath = window.location.pathname;

      // Only redirect if we're actually on the login page
      // This prevents redirect loops
      if (currentPath.includes('/login') || currentPath === '/') {
        const userData = localStorage.getItem('jobyamUserAdmin');
        if (userData) {
          if (JSON.parse(userData).role?.name.toLowerCase() === 'agent') {
            navigate('/applicants');
          } else {
            navigate('/dashboard');
          }
        }
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!email || !password) {
      setError('Please enter your username and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await api.post('users/login/admin', {
        userName: email,
        password: password
      });

      if (data.code === 200) {
        // Store user data in localStorage (only in browser environment)
        if (typeof window !== 'undefined') {
          localStorage.setItem('jobyamUserAdmin', JSON.stringify(data.data));
          sessionStorage.clear(); // Clear all session storage after successful login
        }
        if ((data.data as any).role?.name.toLowerCase() === 'agent') {
          navigate('/applicants');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError('The user or password is incorrect.');
      }
    } catch (error: any) {
      console.error('Login error:', error);

      // Handle authentication errors specifically
      if (error.code === 401) {
        setError(language === 'en' ? 'Invalid username or password.' : 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setError(language === 'en' ? 'An error occurred during login. Please try again.' : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองอีกครั้ง');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle language function
  const toggleLanguage = () => {
    const newLanguage = language === 'th' ? 'en' : 'th';
    setLanguage(newLanguage);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', newLanguage);
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isLoading} />

      <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 bg-gradient-to-b from-[#002060] to-[#0038A8]">
        {/* Language Toggle Button */}
        <button 
          onClick={toggleLanguage}
          className="absolute cursor-pointer top-4 right-4 z-50 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 text-white text-sm font-medium flex items-center gap-2 hover:bg-white/30 transition-colors duration-200 border border-white/20"
        >
          {language === 'th' ? (
            <>
              <span className="fi fi-gb"></span>
              ไทย
            </>
          ) : (
            <>
              <span className="fi fi-th"></span>
              English
            </>
          )}
        </button>
        {/* High-tech animated background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0038A8]/20 via-[#002060]/40 to-black/80"></div>

          {/* Digital grid lines */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
            linear-gradient(to right, rgba(0, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 255, 255, 0.05) 1px, transparent 1px)
          `,
            backgroundSize: '50px 50px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'center bottom',
            height: '200%',
            top: '-50%'
          }}></div>

          {/* Animated particles */}
          <ParticlesBackground />

          {/* Glowing orbs */}
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#0038A8]/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 -right-20 w-72 h-72 bg-[#1A4CA8]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-[#002060]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

          {/* Digital noise overlay */}
          <div className="absolute inset-0 bg-noise opacity-5"></div>
        </div>
        <motion.div
          className="relative w-full max-w-md z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo Circle - Positioned above the card */}
          <motion.div
            className="absolute top-12 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.8,
              type: "spring",
              bounce: 0.4
            }}
          >
            <motion.div
              className="w-48 h-48 rounded-full bg-white shadow-lg flex items-center justify-center"
              whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <motion.img
                src="/Logo2Colour.png"
                alt="JobYam Logo"
                className="w-37 h-37"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              />
            </motion.div>
          </motion.div>

          {/* Main Card */}
          <motion.div
            className="w-full bg-white/80 rounded-3xl shadow-2xl overflow-hidden mt-14 backdrop-blur-md border border-white/30 relative"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
          >
            {/* Holographic edge effect */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#0038A8]/20 via-transparent to-[#1A4CA8]/20 opacity-50 animate-pulse"></div>
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-[#002060]/30 via-transparent to-[#0038A8]/30 opacity-30 blur-sm"></div>
            </div>

            {/* Digital scan line effect */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <div className="w-full h-full bg-[linear-gradient(transparent_0%,_transparent_calc(50%_-_1px),_rgba(0, 56, 168, 0.2)_50%,_transparent_calc(50%_+_1px),_transparent_100%)] bg-[length:100%_8px] animate-scanline"></div>
            </div>

            <div className="pt-6 px-8 pb-8 relative z-10">
              <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <motion.h1
                  className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0038A8] to-[#1A4CA8] mt-18"
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.7 }}
                >
                  {language === 'en' ? 'JobYam' : 'จ็อบยัม'}
                </motion.h1>
                <motion.p
                  className="text-gray-600 mt-2"
                  initial={{ y: -10 }}
                  animate={{ y: 0 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.8 }}
                >
                  {language === 'en' ? 'Management system for administrators' : 'ระบบจัดการสำหรับผู้ดูแลระบบ'}
                </motion.p>
              </motion.div>

              {error && (
                <motion.div
                  className="relative overflow-hidden bg-gradient-to-r from-[#002060]/10 to-[#0038A8]/20 border border-[#002060]/30 text-[#002060]/600 p-4 pl-12 rounded-lg mb-6 shadow-lg backdrop-blur-sm"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.4, type: "spring", stiffness: 120 }}
                >
                  {/* Animated warning icon */}
                  <motion.div
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#002060]"
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 10 }}
                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.5 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  </motion.div>

                  {/* Pulsing border effect */}
                  <motion.div
                    className="absolute inset-0 rounded-lg border border-[#002060]/50"
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
                  />

                  {/* Diagonal stripes background */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0, 56, 168, 0.1) 10px, rgba(0, 56, 168, 0.1) 20px)`
                  }}></div>

                  <div className="relative z-10 font-medium">{error}</div>
                </motion.div>
              )}

              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <motion.div
                  className="mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                >
                  <label htmlFor="email" className="block text-transparent bg-clip-text bg-gradient-to-r from-[#0038A8] to-[#1A4CA8] font-semibold mb-2 text-sm uppercase tracking-wider">
                    {language === 'en' ? 'Username' : 'ชื่อผู้ใช้'}
                  </label>
                  <div className="relative group">
                    {/* Input highlight effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0038A8] to-[#1A4CA8] rounded-lg blur opacity-0 group-hover:opacity-30 group-focus-within:opacity-70 transition duration-300"></div>

                    {/* Animated corner accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#0038A8] opacity-0 group-focus-within:opacity-100 transition-all duration-300"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#0038A8] opacity-0 group-focus-within:opacity-100 transition-all duration-300"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#0038A8] opacity-0 group-focus-within:opacity-100 transition-all duration-300"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#0038A8] opacity-0 group-focus-within:opacity-100 transition-all duration-300"></div>

                    <motion.input
                      type="text"
                      id="email"
                      className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-300/50 rounded-lg focus:outline-none focus:border-[#0038A8] shadow-sm relative z-10 transition-all duration-300 placeholder-gray-400"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      whileFocus={{ boxShadow: "0 0 15px 2px rgba(0, 56, 168, 0.3)" }}
                      placeholder={language === 'en' ? 'Enter your username' : 'กรอกชื่อผู้ใช้ของคุณ'}
                      autoComplete="username"
                    />

                    {/* Animated icon */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0038A8] transition-colors duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="mb-8"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.1 }}
                >
                  <label htmlFor="password" className="block text-transparent bg-clip-text bg-gradient-to-r from-[#0038A8] to-[#1A4CA8] font-semibold mb-2 text-sm uppercase tracking-wider">
                    {language === 'en' ? 'Password' : 'รหัสผ่าน'}
                  </label>
                  <div className="relative group">
                    {/* Input highlight effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0038A8] to-[#1A4CA8] rounded-lg blur opacity-0 group-hover:opacity-30 group-focus-within:opacity-70 transition duration-300"></div>

                    {/* Animated corner accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#0038A8] opacity-0 group-focus-within:opacity-100 transition-all duration-300"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#0038A8] opacity-0 group-focus-within:opacity-100 transition-all duration-300"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#0038A8] opacity-0 group-focus-within:opacity-100 transition-all duration-300"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#0038A8] opacity-0 group-focus-within:opacity-100 transition-all duration-300"></div>

                    <motion.input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className="w-full px-4 py-3 pr-12 bg-white/70 backdrop-blur-sm border border-gray-300/50 rounded-lg focus:outline-none focus:border-[#0038A8] shadow-sm relative z-10 transition-all duration-300 placeholder-gray-400"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      whileFocus={{ boxShadow: "0 0 15px 2px rgba(0, 56, 168, 0.3)" }}
                      placeholder={language === 'en' ? 'Enter your password' : 'กรอกรหัสผ่านของคุณ'}
                      autoComplete="current-password"
                    />
                    
                    {/* Password visibility toggle */}
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#0038A8] transition-colors duration-200 focus:outline-none z-10"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full cursor-pointer bg-gradient-to-r from-[#0038A8] to-[#1A4CA8] text-white py-3 px-4 rounded-lg hover:from-[#002060] hover:to-[#0038A8] transition-all duration-300 mt-6 uppercase font-medium relative overflow-hidden group ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}`}
                  whileHover={{ scale: isLoading ? 1 : 1.02, backgroundColor: blue }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    y: { duration: 0.5, delay: 1.2 },
                    opacity: { duration: 0.5, delay: 1.2 },
                    scale: { duration: 0.1 }
                  }}
                >
                  <div className="flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {language === 'en' ? 'LOGGING IN...' : 'กำลังเข้าสู่ระบบ...'}
                      </>
                    ) : (
                      language === 'en' ? 'LOGIN' : 'เข้าสู่ระบบ'
                    )}
                  </div>
                </motion.button>
              </motion.form>

              <motion.div
                className="mt-6 text-right"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.3 }}
              >
                <motion.div
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link to="/forgot-password" className="text-[#0038A8] hover:text-[#1A4CA8] text-sm transition-all duration-300 inline-flex items-center group">
                    {language === 'en' ? 'Forgot Password?' : 'ลืมรหัสผ่าน?'}
                    <motion.span
                      className="ml-1"
                      initial={{ x: 0 }}
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.2 }}
                    >
                      →
                    </motion.span>
                  </Link>
                </motion.div>
              </motion.div>
            </div>

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#0038A8]/60 rounded-tl-3xl"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#0038A8]/60 rounded-tr-3xl"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#0038A8]/60 rounded-bl-3xl"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#0038A8]/60 rounded-br-3xl"></div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
