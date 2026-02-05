"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Mail, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email'); // Toggle between Email and Phone

    // Email State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Phone State
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [showOtpInput, setShowOtpInput] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    if (!isOpen) return null;

    // Reset state when switching modes
    const resetState = () => {
        setError(null);
        setSuccessMsg(null);
        setLoading(false);
        // Don't clear inputs to be friendly
    };

    // Password Validation Rules
    const checkPassword = (pwd: string) => {
        const hasMinLen = pwd.length >= 8;
        const hasUpper = /[A-Z]/.test(pwd);
        const hasLower = /[a-z]/.test(pwd);
        const hasNumber = /\d/.test(pwd);
        return {
            isValid: hasMinLen && hasUpper && hasLower && hasNumber,
            details: { hasMinLen, hasUpper, hasLower, hasNumber }
        };
    };

    const pwdCheck = checkPassword(password);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);

        // Initial basic validation
        if (!email || !password) {
            setError("請輸入 Email 和密碼");
            return;
        }

        if (!isLogin && !pwdCheck.isValid) {
            setError("密碼不符合安全強度要求");
            return;
        }

        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onClose(); // Close on success
                window.location.reload(); // Reload to refresh session state
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;

                if (data.user && !data.session) {
                    setSuccessMsg("註冊成功！請檢查您的信箱以驗證帳號。");
                } else {
                    setSuccessMsg("註冊成功！已為您自動登入。");
                    setTimeout(() => {
                        onClose();
                        window.location.reload();
                    }, 1500);
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "發生錯誤，請稍後再試");
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            if (!showOtpInput) {
                // Step 1: Send OTP
                const { error } = await supabase.auth.signInWithOtp({
                    phone: phone,
                });
                if (error) throw error;

                setShowOtpInput(true);
                setSuccessMsg("驗證碼已發送！請檢查您的手機簡訊。");
            } else {
                // Step 2: Verify OTP
                const { error } = await supabase.auth.verifyOtp({
                    phone: phone,
                    token: otp,
                    type: 'sms',
                });
                if (error) throw error;

                onClose();
                window.location.reload();
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "發生錯誤，請稍後再試");
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'facebook' | 'line') => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider as any,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`, // Make sure to handle this route or just root
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || "社群帳號登入失敗");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                {/* Modal Content */}
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-sm my-8 animate-in fade-in zoom-in-95 duration-200">

                    {/* Header Tabs (Only show for Email mode usually, or keep top tabs for Login/Register) */}
                    {/* Simplified: If using Phone, usually it's just 'Login/Register' in one flow. 
                        Let's keep the tabs but maybe hide them if Phone is selected? 
                        Or just keep them. Let's keep them primarily for Email Flow context. 
                    */}
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => { setIsLogin(true); resetState(); }}
                            className={cn(
                                "flex-1 py-4 text-sm tracking-widest font-medium transition-colors relative",
                                isLogin ? "text-gray-900 bg-white" : "text-gray-400 bg-gray-50 hover:bg-gray-100"
                            )}
                        >
                            登入
                            {isLogin && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
                        </button>
                        <button
                            onClick={() => { setIsLogin(false); resetState(); }}
                            className={cn(
                                "flex-1 py-4 text-sm tracking-widest font-medium transition-colors relative",
                                !isLogin ? "text-gray-900 bg-white" : "text-gray-400 bg-gray-50 hover:bg-gray-100"
                            )}
                        >
                            註冊
                            {!isLogin && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
                        </button>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-8">
                        <h2 className="text-xl font-medium text-gray-900 mb-2 tracking-wide text-center">
                            {authMethod === 'email'
                                ? (isLogin ? "歡迎回來" : "加入會員")
                                : "手機快速登入"}
                        </h2>
                        <p className="text-xs text-gray-500 mb-6 text-center tracking-wider">
                            {authMethod === 'email'
                                ? (isLogin ? "請輸入您的帳號密碼以繼續" : "建立帳戶以享有專屬優惠")
                                : "免註冊，輸入手機號碼即可登入"
                            }
                        </p>

                        {/* Toggle Auth Method (Email / Phone) */}
                        <div className="flex justify-center gap-4 mb-6 text-xs font-medium">
                            <button
                                onClick={() => { setAuthMethod('email'); resetState(); }}
                                className={cn(
                                    "px-3 py-1 rounded-full border transition-all",
                                    authMethod === 'email' ? "bg-gray-900 text-white border-gray-900" : "text-gray-500 border-gray-200 hover:border-gray-400"
                                )}
                            >
                                Email
                            </button>
                            <button
                                onClick={() => { setAuthMethod('phone'); resetState(); }}
                                className={cn(
                                    "px-3 py-1 rounded-full border transition-all",
                                    authMethod === 'phone' ? "bg-gray-900 text-white border-gray-900" : "text-gray-500 border-gray-200 hover:border-gray-400"
                                )}
                            >
                                手機號碼
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-sm flex items-start gap-2 text-red-600 text-xs">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {successMsg && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-sm flex items-start gap-2 text-green-700 text-xs">
                                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{successMsg}</span>
                            </div>
                        )}

                        {/* --- EMAIL FORM --- */}
                        {authMethod === 'email' && (
                            <form onSubmit={handleEmailSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700 ml-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                                            placeholder="name@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700 ml-1">密碼</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {/* Password Strength Meter (Only for Register) */}
                                    {!isLogin && (
                                        <div className="mt-2 space-y-1 px-1">
                                            <p className="text-[10px] text-gray-400 mb-1">密碼需包含：</p>
                                            <div className="grid grid-cols-2 gap-1">
                                                <span className={cn("text-[10px] flex items-center gap-1", pwdCheck.details.hasMinLen ? "text-green-600" : "text-gray-300")}>
                                                    <CheckCircle className="w-3 h-3" /> 8 個字元以上
                                                </span>
                                                <span className={cn("text-[10px] flex items-center gap-1", pwdCheck.details.hasUpper ? "text-green-600" : "text-gray-300")}>
                                                    <CheckCircle className="w-3 h-3" /> 大寫字母
                                                </span>
                                                <span className={cn("text-[10px] flex items-center gap-1", pwdCheck.details.hasLower ? "text-green-600" : "text-gray-300")}>
                                                    <CheckCircle className="w-3 h-3" /> 小寫字母
                                                </span>
                                                <span className={cn("text-[10px] flex items-center gap-1", pwdCheck.details.hasNumber ? "text-green-600" : "text-gray-300")}>
                                                    <CheckCircle className="w-3 h-3" /> 數字
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-gray-900 text-white text-sm tracking-widest hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-gray-200"
                                    >
                                        {loading ? "處理中..." : (isLogin ? "立即登入" : "註冊帳號")}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* --- PHONE FORM --- */}
                        {authMethod === 'phone' && (
                            <form onSubmit={handlePhoneSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700 ml-1">手機號碼</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                                        placeholder="+886 912 345 678"
                                        disabled={showOtpInput} // Disable phone input after sending OTP
                                        required
                                    />
                                    <p className="text-[10px] text-gray-400">請包含國碼，例如 +886</p>
                                </div>

                                {showOtpInput && (
                                    <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="text-xs font-medium text-gray-700 ml-1">驗證碼 (OTP)</label>
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                                            placeholder="123456"
                                            required
                                        />
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-gray-900 text-white text-sm tracking-widest hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-gray-200"
                                    >
                                        {loading
                                            ? "處理中..."
                                            : (showOtpInput ? "登入 / 驗證" : "發送驗證碼")
                                        }
                                    </button>

                                    {showOtpInput && (
                                        <button
                                            type="button"
                                            onClick={() => { setShowOtpInput(false); setOtp(""); }}
                                            className="w-full mt-2 py-2 text-xs text-gray-500 hover:text-gray-900"
                                        >
                                            重新發送
                                        </button>
                                    )}
                                </div>
                            </form>
                        )}

                        {/* Footer Text (Only valid for Email mode mostly, phone is simpler) */}
                        {authMethod === 'email' && (
                            <p className="mt-6 text-center text-[10px] text-gray-400">
                                {isLogin ? (
                                    <>
                                        還沒有帳號？
                                        <button onClick={() => { setIsLogin(false); resetState(); }} className="text-gray-900 underline ml-1 hover:text-gray-600">
                                            立即註冊
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        已經有帳號？
                                        <button onClick={() => { setIsLogin(true); resetState(); }} className="text-gray-900 underline ml-1 hover:text-gray-600">
                                            登入
                                        </button>
                                    </>
                                )}
                            </p>
                        )}

                        <div className="my-6 flex items-center gap-3">
                            <div className="h-px bg-gray-100 flex-1"></div>
                            <span className="text-[10px] text-gray-400 font-light tracking-wide">或使用社群帳號登入</span>
                            <div className="h-px bg-gray-100 flex-1"></div>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => handleSocialLogin('facebook')}
                                className="w-full py-2.5 bg-[#1877F2] text-white text-xs tracking-wide rounded-sm hover:bg-[#166fe5] transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                Facebook 登入
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSocialLogin('line')}
                                className="w-full py-2.5 bg-[#06C755] text-white text-xs tracking-wide rounded-sm hover:bg-[#05b34c] transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.3c0 3.249-2.687 5.797-6.22 6.516-.549.123-1.036.326-1.503.744-.121.114-.199.309-.158.502.046.216.325.856.376.994.062.164.053.303.015.421-.082.253-.356.325-.561.357-.344.027-2.919-.245-4.852-2.315C5.835 12.333 0 11.233 0 6.096 0 2.295 5.567 0 12 0s12 2.688 12 6.696" />
                                </svg>
                                LINE 登入
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
