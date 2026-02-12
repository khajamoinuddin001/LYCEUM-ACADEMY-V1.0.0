

import React, { useState, useEffect } from 'react';
import type { User, UserRole } from '@/types';
import { Mail, Lock, UserPlus, ArrowLeft, Eye, EyeOff } from '@/components/common/icons';
import { GoogleLogin } from '@react-oauth/google';
import * as api from '@/utils/api';

interface LoginViewProps {
    onLogin: (email: string, password: string, rememberMe: boolean) => Promise<void>;
    users: User[];
    onRegister: (name: string, email: string, password: string, adminKey?: string) => Promise<{ success: boolean, message: string }>;
    onForgotPassword?: () => void;
    onBackToLanding?: () => void;
    initialIsRegister?: boolean;
    onLoginWithGoogle: (token: string) => Promise<void>;
}

const GoogleIcon = () => (
    <svg className="w-8 h-8" aria-hidden="true" viewBox="0 0 488 512" xmlns="http://www.w3.org/2000/svg">
        <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 398.2 0 256S111.8 0 244 0c71.2 0 133 28.1 176.2 72.9l-63.7 61.9C333.6 112.5 292.5 96 244 96c-82.6 0-149.8 66.8-149.8 148.8s67.2 148.8 149.8 148.8c94.2 0 135.2-71.2 138.8-106.9H244v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
    </svg>
);

const AppleIcon = () => (
    <svg className="w-8 h-8" aria-hidden="true" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
        <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C39.2 141.6 0 184.2 0 241.2c0 61.6 47.7 101.9 83.4 101.9 34.2 0 54.5-21.5 83.4-21.5 29.7 0 57.5 21.5 87.9 21.5 31.7 0 56.5-17.6 78.8-43.9-21.5-16.1-34.2-36.6-34.2-56.6zM224 480c-18.4 0-39.7-12.8-54.8-12.8-15.6 0-39.7 12.8-56.8 12.8-22.5 0-42.3-11.8-56.8-31.5-15.6-20.7-33.2-50-33.2-82.5 0-41.9 23.4-68.5 45.8-68.5 21.5 0 34.2 16.6 55.8 16.6 22.5 0 42.8-16.6 63.7-16.6 21.5 0 44.8 16.6 63.7 16.6s35.5-18.8 55.8-18.8c22.5 0 44.8 26.6 44.8 68.5 0 32.5-17.6 61.8-33.2 82.5-14.5 19.7-34.2 31.5-56.8 31.5z"></path>
    </svg>
);


const LoginView: React.FC<LoginViewProps> = ({ onLogin, users, onRegister, onForgotPassword, onBackToLanding, initialIsRegister, onLoginWithGoogle }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegisterView, setIsRegisterView] = useState(initialIsRegister || false);
    const [rememberMe, setRememberMe] = useState(false);
    const [registerAsAdmin, setRegisterAsAdmin] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showAdminKey, setShowAdminKey] = useState(false);
    const [adminKey, setAdminKey] = useState('');

    // Verification UI State
    const [verificationSent, setVerificationSent] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        if (initialIsRegister !== undefined) {
            setIsRegisterView(initialIsRegister);
        }
    }, [initialIsRegister]);

    // Countdown Timer Effect
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (resendCountdown > 0) {
            timer = setInterval(() => {
                setResendCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [resendCountdown]);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await onLogin(email, password);
        } catch (error: any) {
            setError(error.message || 'Invalid email or password.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name || !email || !password) {
            setError('All fields are required for registration.');
            return;
        }
        setIsLoading(true);
        const result = await onRegister(name, email, password, registerAsAdmin ? adminKey : undefined);
        if (!result.success) {
            setError(result.message);
        } else {
            // Registration successful - show verification UI
            setRegisteredEmail(email);
            setVerificationSent(true);
            setResendCountdown(30);
            setError(''); // Clear any previous errors
        }
        setIsLoading(false);
    };

    const handleResendVerification = async () => {
        if (!registeredEmail) return;
        setIsResending(true);
        try {
            await api.resendVerificationEmail(registeredEmail);
            setResendCountdown(30);
            alert('Verification email sent successfully!');
        } catch (error: any) {
            setError(error.message || 'Failed to resend verification email.');
        } finally {
            setIsResending(false);
        }
    };

    const toggleView = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsRegisterView(!isRegisterView);
        setError('');
        setEmail('');
        setPassword('');
        setName('');
        setRegisterAsAdmin(false);
        setAdminKey('');
        setVerificationSent(false); // Reset verification state
    };
    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (credentialResponse.credential) {
            setError('');
            setIsLoading(true);
            try {
                await onLoginWithGoogle(credentialResponse.credential);
            } catch (err: any) {
                setError(err.message || 'Google login failed');
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232A6F97' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}>
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl relative">
                {onBackToLanding && (
                    <button
                        type="button"
                        onClick={onBackToLanding}
                        className="absolute top-4 left-4 p-2 z-50 text-gray-500 hover:text-lyceum-blue bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-full transition-all duration-200"
                        title="Back to Landing Page"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-600 shadow-lg mb-4 hover:rotate-6 transition-transform">
                        <img src="/academy logo.png" alt="Logo" className="w-full h-full object-contain p-2" />
                    </div>
                    <h1 className="text-3xl font-black text-center text-lyceum-blue tracking-tighter">lyceum</h1>
                    <h2 className="mt-2 text-xl font-semibold text-center text-gray-800 dark:text-gray-100">
                        {verificationSent ? 'Account Created' : isRegisterView ? 'Create Student Account' : 'Welcome Back!'}
                    </h2>
                    <p className="mt-1 text-sm text-center text-gray-500 dark:text-gray-400">
                        {verificationSent ? 'Please verify your email' : isRegisterView ? 'Register to start your journey' : 'Sign in to continue'}
                    </p>
                </div>

                {isRegisterView && !verificationSent ? (
                    <form className="mt-8 space-y-6" onSubmit={handleRegisterSubmit}>
                        <div>
                            <label htmlFor="name" className="sr-only">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserPlus className="h-5 w-5 text-gray-400" />
                                </div>
                                <input id="name" name="name" type="text" autoComplete="name" required
                                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="email-address-register" className="sr-only">Email address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input id="email-address-register" name="email" type="email" autoComplete="email" required
                                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="password-register" className="sr-only">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input id="password-register" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required
                                    className="appearance-none block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <input id="register-as-admin" name="register-as-admin" type="checkbox"
                                checked={registerAsAdmin}
                                onChange={(e) => setRegisterAsAdmin(e.target.checked)}
                                className="h-4 w-4 text-lyceum-blue focus:ring-lyceum-blue border-gray-300 rounded" />
                            <label htmlFor="register-as-admin" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Register as Admin</label>
                        </div>
                        {registerAsAdmin && (
                            <div>
                                <label htmlFor="admin-key" className="sr-only">Admin Key</label>
                                <div className="relative">
                                    <input id="admin-key" name="admin-key" type={showAdminKey ? "text" : "password"} required
                                        className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Admin Registration Key" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} />
                                    <button
                                        type="button"
                                        onClick={() => setShowAdminKey(!showAdminKey)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showAdminKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        )}
                        {error && <p className="text-sm text-center text-red-500">{error}</p>}
                        <div>
                            <button type="submit" disabled={isLoading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-lyceum-blue hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lyceum-blue disabled:bg-lyceum-blue/50">
                                {isLoading ? 'Registering...' : 'Register'}
                            </button>
                        </div>
                        <div className="text-sm text-center">
                            <a href="#" onClick={toggleView} className="font-medium text-lyceum-blue hover:text-lyceum-blue-dark">
                                Already have an account? Sign in
                            </a>
                        </div>
                    </form>
                ) : verificationSent ? (
                    <div className="mt-8 space-y-6">
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                                <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Check your email
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                We've sent a verification link to <strong>{registeredEmail}</strong>. Please check your inbox to activate your account.
                            </p>

                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={handleResendVerification}
                                    disabled={resendCountdown > 0 || isResending}
                                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-lyceum-blue hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lyceum-blue disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isResending ? 'Sending...' : resendCountdown > 0 ? `Resend email in ${resendCountdown}s` : 'Resend Verification Email'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setVerificationSent(false);
                                        setIsRegisterView(false);
                                        setError('');
                                    }}
                                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lyceum-blue dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                                >
                                    Back to Login
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input id="email-address" name="email" type="email" autoComplete="email" required
                                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required
                                    className="appearance-none block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input id="remember-me" name="remember-me" type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-lyceum-blue focus:ring-lyceum-blue border-gray-300 rounded" />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Remember me</label>
                            </div>
                            <div className="text-sm">
                                <a href="#" onClick={(e) => { e.preventDefault(); onForgotPassword?.(); }} className="font-medium text-lyceum-blue hover:text-lyceum-blue-dark">Forgot your password?</a>
                            </div>
                        </div>

                        {error && <p className="text-sm text-center text-red-500">{error}</p>}

                        <div>
                            <button type="submit" disabled={isLoading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-lyceum-blue hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lyceum-blue disabled:bg-lyceum-blue/50">
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>
                        <div className="text-sm text-center">
                            <a href="#" onClick={toggleView} className="font-medium text-lyceum-blue hover:text-lyceum-blue-dark">
                                Don't have an account? Register now
                            </a>
                        </div>
                    </form>
                )}

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            Or continue with
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Authentication Failed')}
                            useOneTap
                            theme="filled_blue"
                            shape="pill"
                            text="continue_with"
                        />
                    </div>
                    <button
                        type="button"
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                        <AppleIcon />
                        <span>Continue with Apple</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginView;