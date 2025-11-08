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
          <div className="border-4 border-[#ff6b35] bg-[#1a1a1a] p-8 shadow-[0_0_50px_rgba(0,255,136,0.3)]">
            <div className="text-center space-y-6">
              <p className="text-[#a0a0a0] font-mono text-sm">
                &gt; REDIRECTING TO SECURE AUTH0 LOGIN
              </p>

              <a
                href="/auth/login"
                className="block w-full py-4 bg-[#ff6b35] text-[#0a0a0a] border-4 border-[#ff6b35] font-mono font-bold text-lg uppercase tracking-wider transition-all duration-300 hover:bg-transparent hover:text-[#ff6b35] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)]"
              >
                &gt; SIGN IN / REGISTER
              </a>

              <p className="text-[#a0a0a0] font-mono text-xs mt-4">
                Powered by Auth0 Universal Login
              </p>
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
