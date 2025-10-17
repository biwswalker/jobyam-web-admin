import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingOverlay from '../components/LoadingOverlay';
import { motion } from 'framer-motion';
import api from '../services/api';
import type { ApiResponse } from '../services/api'; // Type-only import

// Particle component for the background (same as login page)
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
            const particleCount = Math.floor(window.innerWidth / 15);

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
            if (!ctx || !canvas) return;

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
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = particle.opacity;
                ctx.fill();
                ctx.globalAlpha = 1;
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', setCanvasDimensions);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
        />
    );
}

interface OtpData {
    token: string;
}

interface OtpResponse {
    code: number;
    status: string;
    data: OtpData;
}

interface VerifyOtpResponse {
    code: number;
    status: string;
    data: {
        message: string;
        status: string;
    };
}

interface ResetPasswordResponse {
    userID: string;
    // Add other fields that might be in the response if needed
}

interface ResetPasswordData {
    userID: string;
    password: string;
}

interface ResetPasswordApiResponse {
    userID: string;
    // Add other fields from the reset password response if needed
}

export default function ForgotPassword() {
    const firstOtpInput = useRef<HTMLInputElement>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [userName, setUserName] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [otpToken, setOtpToken] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });
    const [resetData, setResetData] = useState<ResetPasswordData | null>(null);
    const [language, setLanguage] = useState<'th' | 'en'>('th');
    const navigate = useNavigate();
    const otpInputs = Array(4).fill(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Blue color palette
    const blue = '#0038A8';
    const blueLight = '#1A4CA8';
    const blueDark = '#002060';

    // Initialize language from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedLanguage = localStorage.getItem('jobyamLanguage');
            if (savedLanguage === 'en') {
                setLanguage('en');
            }
        }
    }, []);

    // Toggle language function
    const toggleLanguage = () => {
        const newLanguage = language === 'th' ? 'en' : 'th';
        setLanguage(newLanguage);
        if (typeof window !== 'undefined') {
            localStorage.setItem('language', newLanguage);
        }
    };

    const checkPhoneExists = async (phone: string): Promise<ResetPasswordData | null> => {
        try {
            const response = await api.get<ResetPasswordApiResponse>(`users/reset/password/admin?phone=${phone}&userName=${userName}`);
            if (response.data?.userID) {
                return { userID: response.data.userID, password: '' }; // Return with empty password for now
            }
            return null;
        } catch (error) {
            console.error('Error checking phone:', error);
            return null;
        }
    };

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous errors
        setError('');

        if (!userName) {
            setError(language === 'en' ? 'Please enter your user name' : 'กรุณากรอกชื่อผู้ใช้');
            return;
        }

        if (userName.length > 50) {
            setError(language === 'en' ? 'User name must be less than 50 characters' : 'ชื่อผู้ใช้ต้องน้อยกว่า 50 ตัวอักษร');
            return;
        }

        // Basic validation
        if (!phoneNumber) {
            setError(language === 'en' ? 'Please enter your phone number' : 'กรุณากรอกเบอร์โทรศัพท์');
            return;
        }

        // Check if phone number is exactly 10 digits
        if (phoneNumber.length !== 10) {
            setError(language === 'en'
                ? 'Phone number must be 10 digits'
                : 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก');
            return;
        }

        // Phone number validation (basic Thai phone number format)
        const phoneRegex = /^0[0-9]{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            setError(language === 'en'
                ? 'Please enter a valid phone number (starts with 0)'
                : 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (ขึ้นต้นด้วย 0)');
            return;
        }

        setIsLoading(true);
        try {
            // Check if phone exists in the system
            const resetData = await checkPhoneExists(phoneNumber);
            if (!resetData) {
                setError(language === 'en'
                    ? 'This phone number does not exist in the system.'
                    : 'ไม่มีเบอร์โทรนี้ในระบบ');
                setIsLoading(false);
                return;
            }

            // Store reset data for later use
            setResetData(resetData);

            // TODO: Call OTP API here
            // await requestOtp(phoneNumber);
            setShowOtp(true);
        } catch (error) {
            console.error('Error:', error);
            setError(language === 'en'
                ? 'An error occurred. Please try again.'
                : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsLoading(false);
        }

        setIsLoading(true);
        setError('');

        try {
            // Request OTP
            const response = await api.post<OtpResponse>('otp/request', {
                msisdn: phoneNumber
            });

            // Check if OTP token exists in response
            if (response.code === 200 && response.data) {
                setOtpToken((response.data as any).token);
                setShowOtp(true);
            } else {
                throw new Error('Failed to send OTP');
            }
        } catch (error: any) {
            console.error('OTP request error:', error);
            setError(
                language === 'en'
                    ? 'Failed to send OTP. Please try again.'
                    : 'ส่งรหัส OTP ไม่สำเร็จ กรุณาลองอีกครั้ง'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        // Only allow numbers
        if (value && !/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input if there's a value and not the last input
        if (value && index < 3) {
            const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement;
            if (nextInput) {
                nextInput.focus();
            }
        }

        // Auto submit if last digit is entered
        if (value && index === 3) {
            // Focus on the submit button
            const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (submitButton) {
                submitButton.focus();
            }
        }
    };

    // Update ref type for TypeScript
    const setInputRef = (element: HTMLInputElement | null, index: number) => {
        if (element) {
            inputRefs.current[index] = element;
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            // Move to previous input on backspace
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text/plain').trim();
        if (/^\d{4}$/.test(pasteData)) {
            const newOtp = pasteData.split('').slice(0, 4);
            setOtp([...newOtp, ...Array(4 - newOtp.length).fill('')]);
        }
    };

    const checkPasswordStrength = (password: string) => {
        // Simple password strength checker
        let score = 0;
        let feedback = '';

        if (password.length === 0) {
            return { score: 0, feedback: '' };
        }

        if (password.length < 8) {
            feedback = language === 'en' ? 'Too short' : 'สั้นเกินไป';
            return { score: 1, feedback };
        }

        // Check for lowercase, uppercase, numbers, special chars
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);

        let strength = 0;
        if (hasLower) strength++;
        if (hasUpper) strength++;
        if (hasNumber) strength++;
        if (hasSpecial) strength++;

        // Score 1-4 based on strength
        score = Math.min(4, Math.max(1, strength));

        // Provide feedback
        if (score === 1) {
            feedback = language === 'en' ? 'Very Weak' : 'อ่อนมาก';
        } else if (score === 2) {
            feedback = language === 'en' ? 'Weak' : 'อ่อน';
        } else if (score === 3) {
            feedback = language === 'en' ? 'Good' : 'ปานกลาง';
        } else {
            feedback = language === 'en' ? 'Strong' : 'แข็งแกร่ง';
        }

        return { score, feedback };
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewPassword(value);
        setPasswordStrength(checkPasswordStrength(value));
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpCode = otp.join('');

        if (otpCode.length !== 4) {
            setError(language === 'en' ? 'Please enter the 4-digit OTP' : 'กรุณากรอกรหัส OTP 4 หลัก');
            return;
        }

        if (!otpToken) {
            setError(language === 'en' ? 'Invalid session. Please try again.' : 'เซสชันไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
            return;
        }

        setIsLoading(true);
        try {
            // Call OTP verification API
            const response = await api.post<OtpResponse>('otp/verify', {
                pin: otpCode,
                token: otpToken
            });

            if (response.code === 200 && response.data?.status === 'success') {
                setShowOtp(false);
                setShowNewPassword(true);
                setError('');
            } else {
                const errorMessage = (language === 'en'
                    ? 'Invalid OTP. Please try again.'
                    : 'รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
                setError(errorMessage);
            }
        } catch (error: any) {
            console.error('OTP verification error:', error);
            const errorMessage = error.response?.data?.message || (language === 'en'
                ? 'Failed to verify OTP. Please try again.'
                : 'ไม่สามารถยืนยัน OTP ได้ กรุณาลองใหม่อีกครั้ง');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate passwords
        if (!newPassword || !confirmPassword) {
            setError(language === 'en'
                ? 'Please enter and confirm your new password'
                : 'กรุณากรอกรหัสผ่านใหม่และยืนยันรหัสผ่าน');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(language === 'en'
                ? 'Passwords do not match'
                : 'รหัสผ่านไม่ตรงกัน');
            return;
        }

        // if (passwordStrength.score < 2) {
        //     setError(language === 'en'
        //         ? 'Please choose a stronger password'
        //         : 'กรุณาใช้รหัสผ่านที่แข็งแกร่งขึ้น');
        //     return;
        // }

        if (!resetData) {
            setError(language === 'en'
                ? 'Session expired. Please start over.'
                : 'เซสชันหมดอายุ กรุณาเริ่มต้นใหม่');
            return;
        }

        setIsLoading(true);
        try {
            // Call change password API
            await api.put(`users/reset/password/${resetData.userID}`, {
                password: newPassword
            });

            // Show success message and redirect
            setIsSubmitted(true);
            setError("");
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2500);

        } catch (error) {
            console.error('Error changing password:', error);
            setError(language === 'en'
                ? 'Failed to update password. Please try again.'
                : 'ไม่สามารถอัปเดตรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 bg-gradient-to-b from-[#002060] to-[#0038A8]">
            <ParticlesBackground />

            <div className="relative z-10 w-full max-w-md px-6 py-8 mx-4 bg-white rounded-2xl shadow-xl">
                <div className="flex justify-center mb-8">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
                    {language === 'en' ? 'Reset Password' : 'รีเซ็ตรหัสผ่าน'}
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {isSubmitted ? (
                    <div className="text-center py-8">
                        <div className="text-green-500 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            {language === 'en' ? 'Password Changed!' : 'เปลี่ยนรหัสผ่านสำเร็จ!'}
                        </h3>
                        <p className="text-gray-600">
                            {language === 'en'
                                ? 'Redirecting to login page...'
                                : 'กำลังเปลี่ยนเส้นทางไปยังหน้าเข้าสู่ระบบ...'}
                        </p>
                    </div>
                ) : showNewPassword ? (
                    <form onSubmit={handleNewPasswordSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                {language === 'en' ? 'New Password' : 'รหัสผ่านใหม่'}
                            </label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={language === 'en' ? 'Enter new password' : 'กรอกรหัสผ่านใหม่'}
                                required
                            />
                            {passwordStrength.score > 0 && (
                                <div className="mt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`h-2 rounded-full flex-1 ${passwordStrength.score > 0 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                                        <div className={`h-2 rounded-full flex-1 ${passwordStrength.score > 1 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                                        <div className={`h-2 rounded-full flex-1 ${passwordStrength.score > 2 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        {language === 'en'
                                            ? `Strength: ${['Weak', 'Fair', 'Good', 'Strong'][passwordStrength.score]}`
                                            : `ความแข็งแกร่ง: ${['อ่อน', 'ปานกลาง', 'ดี', 'แข็งแกร่ง'][passwordStrength.score]}`}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                {language === 'en' ? 'Confirm New Password' : 'ยืนยันรหัสผ่านใหม่'}
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={language === 'en' ? 'Confirm new password' : 'ยืนยันรหัสผ่านใหม่'}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full cursor-pointer py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {isLoading
                                ? (language === 'en' ? 'Updating...' : 'กำลังอัปเดต...')
                                : (language === 'en' ? 'Update Password' : 'อัปเดตรหัสผ่าน')}
                        </button>
                    </form>
                ) : showOtp ? (
                    <form onSubmit={handleOtpSubmit} className="space-y-6">
                        <p className="text-sm text-gray-600 text-center">
                            {language === 'en'
                                ? `We've sent a 4-digit code to ${phoneNumber}`
                                : `เราได้ส่งรหัส 4 หลักไปยัง ${phoneNumber} แล้ว`}
                        </p>

                        <div className="flex justify-center space-x-3">
                            {[0, 1, 2, 3].map((i) => (
                                <input
                                    key={i}
                                    type="text"
                                    maxLength={1}
                                    value={otp[i] || ''}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                    className="w-16 h-16 text-2xl text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    ref={i === 0 ? firstOtpInput : null}
                                    data-index={i}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full cursor-pointer py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {isLoading
                                ? (language === 'en' ? 'Verifying...' : 'กำลังตรวจสอบ...')
                                : (language === 'en' ? 'Verify OTP' : 'ยืนยันรหัส OTP')}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowOtp(false);
                                    setOtp(['', '', '', '']);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                {language === 'en' ? 'Change phone number' : 'เปลี่ยนหมายเลขโทรศัพท์'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handlePhoneSubmit} className="space-y-6">
                        <motion.div className="space-y-2 group">
                        <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
                                {language === 'en' ? 'User Name' : 'ชื่อผู้ใช้'}
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="relative group flex-1">
                                    <motion.input
                                        type="text"
                                        id="userName"
                                        value={userName}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setUserName(value);
                                        }}
                                        maxLength={30}
                                        className="w-full pl-6 pr-12 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0038A8]/50 focus:border-transparent shadow-sm transition-all duration-200 placeholder-gray-400 text-gray-700"
                                        placeholder={language === 'en' ? 'Enter your user name' : 'กรุณากรอกชื่อผู้ใช้'}
                                        required
                                        whileFocus={{
                                            boxShadow: "0 0 0 3px rgba(0, 56, 168, 0.15)",
                                            scale: 1.01
                                        }}
                                    />
                                    {userName.length > 0 && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <span className="text-xs font-medium text-gray-400">
                                                {userName.length}/30
                                            </span>
                                        </div>
                                    )}
                                    {/* Animated border on focus */}
                                    <div className="absolute inset-0 rounded-xl pointer-events-none border-2 border-transparent group-focus-within:border-[#0038A8]/30 transition-all duration-200"></div>
                                </div>
                            </div>

                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                                {language === 'en' ? 'Phone Number' : 'หมายเลขโทรศัพท์'}
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="relative group flex-1">
                                    <motion.input
                                        type="tel"
                                        id="phoneNumber"
                                        value={phoneNumber}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            if (value.length <= 10) {
                                                setPhoneNumber(value);
                                            }
                                        }}
                                        maxLength={10}
                                        className="w-full pl-6 pr-12 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0038A8]/50 focus:border-transparent shadow-sm transition-all duration-200 placeholder-gray-400 text-gray-700"
                                        placeholder={language === 'en' ? 'Enter your phone number' : 'กรุณากรอกเบอร์โทรศัพท์'}
                                        required
                                        whileFocus={{
                                            boxShadow: "0 0 0 3px rgba(0, 56, 168, 0.15)",
                                            scale: 1.01
                                        }}
                                    />
                                    {phoneNumber.length > 0 && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <span className="text-xs font-medium text-gray-400">
                                                {phoneNumber.length}/10
                                            </span>
                                        </div>
                                    )}
                                    {/* Animated border on focus */}
                                    <div className="absolute inset-0 rounded-xl pointer-events-none border-2 border-transparent group-focus-within:border-[#0038A8]/30 transition-all duration-200"></div>
                                </div>
                            </div>
                        </motion.div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2 cursor-pointer px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {isLoading
                                ? (language === 'en' ? 'Sending...' : 'กำลังส่ง...')
                                : (language === 'en' ? 'Get Code OTP' : 'รับรหัส OTP')}
                        </button>

                        <div className="text-center">
                            <Link
                                to="/login"
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                {language === 'en' ? 'Back to Login' : 'กลับไปหน้าเข้าสู่ระบบ'}
                            </Link>
                        </div>
                    </form>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                        onClick={toggleLanguage}
                        className="text-sm font-medium cursor-pointer text-gray-600 hover:text-gray-800 flex items-center justify-center w-full"
                    >
                        {language === 'en' ? 'เปลี่ยนภาษาไทย' : 'Switch to English'}
                    </button>
                </div>
            </div>

            <LoadingOverlay isLoading={isLoading} />
        </div>
    );
}
