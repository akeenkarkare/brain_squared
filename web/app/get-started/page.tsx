"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export default function GetStartedPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/chat");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a0a]">
      {/* Background effects */}
      <div className="absolute inset-0 retro-grid opacity-20"></div>
      <div className="absolute inset-0 scanlines"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ff6b35] rounded-full blur-[150px] opacity-10"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#9d4edd] rounded-full blur-[150px] opacity-10"></div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b-2 border-[#ff6b35] bg-[#1a1a1a] px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff6b35] to-[#ff9e00] flex items-center justify-center font-bold text-xl text-[#0a0a0a] border-2 border-[#ff6b35]">
                B²
              </div>
              <span className="text-white font-bold text-xl font-mono">
                BRAIN<sup className="text-[#ff6b35] text-sm">²</sup>
              </span>
            </Link>
            <Link href="/">
              <button className="px-4 py-2 border-2 border-[#ff6b35] text-[#ff6b35] font-mono font-bold uppercase tracking-wider hover:bg-[#ff6b35] hover:text-[#0a0a0a] transition-all duration-300">
                &gt; BACK
              </button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="inline-block border-4 border-[#ff6b35] px-6 py-2 mb-8 corner-cut">
                <span className="text-[#ff6b35] font-mono text-sm font-bold tracking-[0.3em]">
                  GET_STARTED
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-8 text-white">
                Never Lose Your <span className="text-[#ff6b35]">Train of Thought</span> Again
              </h1>
            </div>

            {/* Problem Statement */}
            <div className="mb-16 border-4 border-[#ff6b35] bg-[#1a1a1a] p-8 md:p-12">
              <div className="space-y-6 text-white font-mono text-lg leading-relaxed">
                <p className="text-[#ff9e00]">
                  &gt; <span className="text-white">Ever find yourself searching across multiple platforms, bouncing between tabs, and then forgetting where you did your best work?</span>
                </p>

                <p className="text-[#ff6b35] font-bold text-2xl">
                  With Brain², you don't have to.
                </p>

                <p>
                  We use your <span className="text-[#ff6b35] font-bold">search history</span> to reconnect you with your past research, insights, and unfinished ideas — so you can pick up your train of thought instantly.
                </p>

                <p className="text-[#a0a0a0]">
                  No more wasted time, lost tabs, or endless re-searching.
                </p>

                <div className="pt-6 border-t-2 border-[#ff6b35] mt-8">
                  <p className="text-[#ff6b35] font-bold text-xl">
                    &gt; Stay in flow. Remember what matters. Build smarter with Brain².
                  </p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              <div className="border-2 border-[#ff6b35] bg-[#1a1a1a] p-6 hover:border-[#ff9e00] transition-all duration-300">
                <div className="text-[#ff6b35] text-4xl mb-4">⚡</div>
                <h3 className="text-white font-bold text-xl mb-3 font-mono uppercase">Instant Recall</h3>
                <p className="text-[#a0a0a0] font-mono text-sm">
                  Access your entire search history and research context in seconds
                </p>
              </div>

              <div className="border-2 border-[#ff6b35] bg-[#1a1a1a] p-6 hover:border-[#ff9e00] transition-all duration-300">
                <div className="text-[#ff9e00] text-4xl mb-4">🧠</div>
                <h3 className="text-white font-bold text-xl mb-3 font-mono uppercase">Smart Context</h3>
                <p className="text-[#a0a0a0] font-mono text-sm">
                  AI understands your past work and helps you continue where you left off
                </p>
              </div>

              <div className="border-2 border-[#ff6b35] bg-[#1a1a1a] p-6 hover:border-[#ff9e00] transition-all duration-300">
                <div className="text-[#9d4edd] text-4xl mb-4">🔗</div>
                <h3 className="text-white font-bold text-xl mb-3 font-mono uppercase">Connected Ideas</h3>
                <p className="text-[#a0a0a0] font-mono text-sm">
                  Link your research across platforms and discover hidden connections
                </p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center border-4 border-[#ff6b35] bg-[#1a1a1a] p-12 mb-8">
              <h2 className="text-3xl font-bold text-white mb-6 font-mono">
                READY TO <span className="text-[#ff6b35]">AMPLIFY</span> YOUR THINKING?
              </h2>

              <p className="text-[#a0a0a0] font-mono mb-8 text-lg">
                &gt; Create your account and start building your knowledge graph
              </p>

              <Link href="/auth">
                <button className="px-12 py-6 bg-[#ff6b35] text-[#0a0a0a] border-4 border-[#ff6b35] font-mono font-bold text-xl uppercase tracking-wider transition-all duration-300 hover:bg-transparent hover:text-[#ff6b35] hover:shadow-[0_0_30px_rgba(255,107,53,0.5)]">
                  &gt; INITIALIZE_ACCOUNT
                </button>
              </Link>

              <p className="text-[#a0a0a0] font-mono text-sm mt-6">
                Already have an account? <Link href="/auth" className="text-[#ff9e00] hover:text-[#ff6b35] transition-colors">&gt; LOGIN_HERE</Link>
              </p>
            </div>

            {/* Status Bar */}
            <div className="border-t-2 border-[#ff6b35] pt-6">
              <div className="flex justify-between items-center text-[#ff6b35] font-mono text-sm">
                <span>&gt; STATUS: READY_FOR_SIGNUP</span>
                <span className="hidden md:block">&gt; USERS: 1,337+</span>
                <span>&gt; SECURE: 100%</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
