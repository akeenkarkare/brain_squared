"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/chat");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("ERROR: PASSWORD_MISMATCH");
      return;
    }

    if (formData.password.length < 6) {
      setError("ERROR: PASSWORD_LENGTH_INSUFFICIENT");
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(
        formData.email,
        formData.password,
        formData.name || undefined
      );

      if (success) {
        router.push("/chat");
      } else {
        setError("ERROR: AUTHENTICATION_FAILED");
      }
    } catch (err) {
      setError("ERROR: SYSTEM_FAILURE");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a0a]">
      {/* Background effects */}
      <div className="absolute inset-0 retro-grid opacity-20"></div>
      <div className="absolute inset-0 scanlines"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff6b35] rounded-full blur-[150px] opacity-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#9d4edd] rounded-full blur-[150px] opacity-10"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-12">
            <Link href="/" className="inline-block mb-6">
              <div className="border-4 border-[#ff6b35] px-4 py-2 inline-block hover:bg-[#ff6b35] hover:text-[#0a0a0a] transition-all duration-300">
                <span className="font-mono text-sm font-bold tracking-[0.3em]">← BACK</span>
              </div>
            </Link>

            <h1 className="text-5xl font-bold mb-4 text-white glow-text">
              BRAIN<sup className="text-[#ff6b35] text-2xl">²</sup>
            </h1>
            <p className="text-[#ff6b35] font-mono text-sm">
              &gt; {isLogin ? "ACCESS_TERMINAL" : "CREATE_ACCOUNT"}
            </p>
          </div>

          {/* Main Card */}
          <div className="border-4 border-[#ff6b35] bg-[#1a1a1a] p-8 shadow-[0_0_50px_rgba(0,255,136,0.3)]">
            {/* Mode Toggle */}
            <div className="flex mb-8 border-2 border-[#ff6b35]">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 font-mono font-bold uppercase tracking-wider transition-all duration-300 ${
                  isLogin
                    ? "bg-[#ff6b35] text-[#0a0a0a]"
                    : "bg-transparent text-[#ff6b35] hover:bg-[#ff6b35] hover:bg-opacity-20"
                }`}
              >
                &gt; LOGIN
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 font-mono font-bold uppercase tracking-wider transition-all duration-300 ${
                  !isLogin
                    ? "bg-[#ff6b35] text-[#0a0a0a]"
                    : "bg-transparent text-[#ff6b35] hover:bg-[#ff6b35] hover:bg-opacity-20"
                }`}
              >
                &gt; REGISTER
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 border-2 border-[#ff0055] bg-[#ff0055] bg-opacity-10 p-4">
                <p className="text-[#ff0055] font-mono text-sm font-bold">
                  &gt; {error}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div>
                  <label className="block text-[#ff6b35] font-mono text-sm font-bold mb-2 uppercase tracking-wider">
                    &gt; USERNAME
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-[#ff6b35] text-white font-mono focus:outline-none focus:border-[#ff9e00] focus:shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all duration-300"
                    placeholder="ENTER_USERNAME"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#ff6b35] font-mono text-sm font-bold mb-2 uppercase tracking-wider">
                  &gt; EMAIL
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-[#ff6b35] text-white font-mono focus:outline-none focus:border-[#ff9e00] focus:shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all duration-300"
                  placeholder="user@system.net"
                />
              </div>

              <div>
                <label className="block text-[#ff6b35] font-mono text-sm font-bold mb-2 uppercase tracking-wider">
                  &gt; PASSWORD
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-[#ff6b35] text-white font-mono focus:outline-none focus:border-[#ff9e00] focus:shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all duration-300"
                  placeholder="••••••••"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-[#ff6b35] font-mono text-sm font-bold mb-2 uppercase tracking-wider">
                    &gt; CONFIRM_PASSWORD
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-[#ff6b35] text-white font-mono focus:outline-none focus:border-[#ff9e00] focus:shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all duration-300"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#ff6b35] text-[#0a0a0a] border-4 border-[#ff6b35] font-mono font-bold text-lg uppercase tracking-wider transition-all duration-300 hover:bg-transparent hover:text-[#ff6b35] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>&gt; PROCESSING...</span>
                  </>
                ) : (
                  <span>&gt; {isLogin ? "AUTHENTICATE" : "CREATE_ACCOUNT"}</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 mb-8 flex items-center">
              <div className="flex-1 border-t-2 border-[#ff6b35] opacity-30"></div>
              <span className="px-4 text-[#a0a0a0] font-mono text-xs">
                ALTERNATIVE_AUTH
              </span>
              <div className="flex-1 border-t-2 border-[#ff6b35] opacity-30"></div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-4">
              <button className="w-full py-3 border-2 border-[#ff9e00] text-[#ff9e00] font-mono font-bold uppercase tracking-wider hover:bg-[#ff9e00] hover:text-[#0a0a0a] transition-all duration-300 flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                &gt; GOOGLE_AUTH
              </button>

              <button className="w-full py-3 border-2 border-[#9d4edd] text-[#9d4edd] font-mono font-bold uppercase tracking-wider hover:bg-[#9d4edd] hover:text-[#0a0a0a] transition-all duration-300 flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                &gt; GITHUB_AUTH
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[#a0a0a0] font-mono text-sm">
              &gt; STATUS: <span className="text-[#ff6b35]">SECURE_CONNECTION</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
