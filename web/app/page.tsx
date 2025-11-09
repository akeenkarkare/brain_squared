"use client";

import Link from "next/link";
import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect } from "react";
import { checkExtensionInstalled } from '@/lib/extensionDetection';

export default function Home() {
  const { user, isLoading } = useUser();
  const [latency, setLatency] = useState(0);
  const [extensionInstalled, setExtensionInstalled] = useState<boolean | null>(null);
  const [showExtensionModal, setShowExtensionModal] = useState(false);

  useEffect(() => {
    setLatency(Math.floor(Math.random() * 50));
  }, []);

  // Check for extension installation
  useEffect(() => {
    const detectExtension = async () => {
      try {
        const isInstalled = await checkExtensionInstalled();
        setExtensionInstalled(isInstalled);

        // Show modal only if extension is NOT installed and user IS authenticated
        if (!isInstalled && user) {
          setShowExtensionModal(true);
        } else {
          setShowExtensionModal(false);
        }
      } catch (error) {
        console.error('[Home Page] Error detecting extension:', error);
        setExtensionInstalled(false);
      }
    };

    detectExtension();

    // Listen for visibility changes to reload when user returns from another tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Home Page] User returned from another tab, checking extension again...');
        detectExtension();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a0a]">
      {/* Retro grid background */}
      <div className="absolute inset-0 retro-grid opacity-30"></div>

      {/* Scanlines overlay */}
      <div className="absolute inset-0 scanlines"></div>

      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-[#ff6b35] rounded-full blur-[120px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#9d4edd] rounded-full blur-[120px] opacity-20 animate-pulse delay-1000"></div>

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Logo/Header */}
        <div className="mb-12">
          <div className="inline-block border-4 border-[#ff6b35] px-6 py-2 mb-8 corner-cut">
            <span className="text-[#ff6b35] font-mono text-sm font-bold tracking-[0.3em]">
              SYSTEM_ONLINE
            </span>
          </div>

          <h1 className="text-7xl md:text-8xl font-bold mb-6 glow-text text-white tracking-tight">
            BRAIN<sup className="text-[#ff6b35] text-4xl">²</sup>
          </h1>

          {user && (
            <div className="border-2 border-[#ff6b35] bg-[#0a0a0a] px-6 py-3 inline-block">
              <span className="text-[#ff6b35] font-mono text-lg">
                &gt; USER: <span className="text-white font-bold">{(user.name || user.email || 'USER').toUpperCase()}</span>
              </span>
            </div>
          )}
        </div>

        {/* Tagline */}
        <p className="text-xl md:text-2xl mb-16 text-[#a0a0a0] max-w-2xl text-center font-mono">
          {user ? (
            <span className="text-[#ff6b35]">&gt; NEURAL_LINK_ESTABLISHED</span>
          ) : (
            <span>&gt; Next-Gen AI Interface</span>
          )}
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-6 justify-center flex-wrap">
          {user ? (
            <>
              <Link
                href="/chat"
                className="group relative px-10 py-5 bg-[#ff6b35] text-[#0a0a0a] font-bold text-lg uppercase tracking-wider transition-all duration-300 hover:bg-transparent hover:text-[#ff6b35] border-4 border-[#ff6b35] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] overflow-hidden"
              >
                <span className="relative z-10">&gt; ACCESS_TERMINAL</span>
              </Link>
              <a
                href="/auth/logout"
                className="px-10 py-5 bg-transparent text-[#ff0055] border-4 border-[#ff0055] font-bold text-lg uppercase tracking-wider transition-all duration-300 hover:bg-[#ff0055] hover:text-[#0a0a0a] hover:shadow-[0_0_30px_rgba(255,0,85,0.5)]"
              >
                &gt; DISCONNECT
              </a>
            </>
          ) : (
            <>
              <a
                href="/auth/login"
                className="px-10 py-5 bg-[#ff6b35] text-[#0a0a0a] font-bold text-lg uppercase tracking-wider transition-all duration-300 hover:bg-transparent hover:text-[#ff6b35] border-4 border-[#ff6b35] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)]"
              >
                &gt; INITIALIZE
              </a>
              <a
                href="/auth/login"
                className="px-10 py-5 bg-transparent text-[#ff6b35] border-4 border-[#ff6b35] font-bold text-lg uppercase tracking-wider transition-all duration-300 hover:bg-[#ff6b35] hover:text-[#0a0a0a] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)]"
              >
                &gt; LOGIN
              </a>
            </>
          )}
        </div>

        {/* Status bar */}
        <div className="mt-20 border-t-2 border-[#ff6b35] pt-6 max-w-4xl w-full">
          <div className="flex justify-between items-center text-[#ff6b35] font-mono text-sm">
            <span>&gt; STATUS: OPERATIONAL</span>
            <span className="hidden md:block">&gt; LATENCY: {latency}ms</span>
            <span>&gt; UPTIME: 99.9%</span>
          </div>
        </div>
      </main>

      {/* Extension Modal */}
      {showExtensionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border-4 border-[#ff6b35] p-8 max-w-md w-full mx-4 shadow-[0_0_40px_rgba(255,107,53,0.5)]">
            <h2 className="text-2xl font-bold text-white mb-4 font-mono">
              &gt; EXTENSION_REQUIRED
            </h2>
            <p className="text-[#a0a0a0] mb-6 font-mono">
              Install the Brain Squared Chrome Extension to unlock full functionality.
            </p>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/api/download-extension';
                link.download = 'brain-squared-extension.zip';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="w-full px-6 py-3 bg-[#ff6b35] text-[#0a0a0a] font-bold uppercase tracking-wider border-2 border-[#ff6b35] hover:bg-transparent hover:text-[#ff6b35] transition-all duration-300 font-mono"
            >
              &gt; INSTALL_EXTENSION
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
