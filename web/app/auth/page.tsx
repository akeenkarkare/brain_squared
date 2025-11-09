"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/chat");
    }
  }, [user, router]);

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
              &gt; ACCESS_TERMINAL
            </p>
          </div>

          {/* Main Card */}
          <div className="border-4 border-[#ff6b35] bg-[#1a1a1a] p-10 shadow-[0_0_60px_rgba(255,107,53,0.4)]">
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-block border-2 border-[#ff6b35] px-4 py-2 mb-6">
                  <span className="text-[#ff6b35] font-mono text-xs font-bold tracking-widest">
                    SECURE AUTHENTICATION
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Neural Link Protocol
                </h2>
                <p className="text-[#a0a0a0] font-mono text-sm">
                  &gt; Authenticate via Google OAuth
                </p>
              </div>

              <a
                href="/auth/login?connection=google-oauth2"
                className="group relative block w-full py-5 bg-gradient-to-r from-[#ff6b35] to-[#ff9e00] text-[#0a0a0a] border-4 border-[#ff6b35] font-mono font-bold text-lg uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,107,53,0.6)] hover:scale-[1.02] overflow-hidden"
              >
                <div className="absolute inset-0 bg-[#0a0a0a] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="relative z-10 flex items-center justify-center gap-3 group-hover:text-[#ff6b35] transition-colors duration-300">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </div>
              </a>

              <div className="space-y-3 pt-4 border-t-2 border-[#ff6b35]/30">
                <div className="flex items-center gap-2 text-[#a0a0a0] font-mono text-xs">
                  <svg className="w-4 h-4 text-[#ff6b35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>End-to-end encrypted connection</span>
                </div>
                <div className="flex items-center gap-2 text-[#a0a0a0] font-mono text-xs">
                  <svg className="w-4 h-4 text-[#ff6b35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Powered by Auth0 & Google OAuth</span>
                </div>
              </div>
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
