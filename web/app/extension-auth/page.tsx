'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';

export default function ExtensionAuthPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'sending' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function sendTokenToExtension() {
      // If not logged in, redirect to login
      if (!isLoading && !user) {
        router.push('/auth/login?returnTo=/extension-auth');
        return;
      }

      // If logged in, get access token and send to extension
      if (user) {
        try {
          setStatus('sending');
          setMessage('Getting access token...');

          // Get access token from API route
          const response = await fetch('/api/auth/token');

          if (!response.ok) {
            throw new Error('Failed to get access token');
          }

          const { accessToken } = await response.json();

          setMessage('Sending token to extension...');

          // Try to send message to extension
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            // Get the extension ID from the page URL or use a known ID
            // The extension will need to be listed in manifest's externally_connectable
            const extensionId = new URLSearchParams(window.location.search).get('extensionId');

            if (extensionId) {
              chrome.runtime.sendMessage(
                extensionId,
                {
                  action: 'setAuthToken',
                  token: accessToken,
                  userId: user.sub,
                  userEmail: user.email,
                },
                (response) => {
                  if (chrome.runtime.lastError) {
                    setStatus('error');
                    setMessage(`Error: ${chrome.runtime.lastError.message}`);
                  } else {
                    setStatus('success');
                    setMessage('Successfully authenticated! You can close this tab.');
                  }
                }
              );
            } else {
              // Fallback: use postMessage to parent window (if opened by extension)
              window.opener?.postMessage(
                {
                  type: 'BRAIN_SQUARED_AUTH',
                  token: accessToken,
                  userId: user.sub,
                  userEmail: user.email,
                },
                '*'
              );
              setStatus('success');
              setMessage('Authentication successful! You can close this tab.');
            }
          } else {
            setStatus('success');
            setMessage('Token ready. Copy and use in extension if needed.');
          }
        } catch (error: any) {
          setStatus('error');
          setMessage(`Error: ${error.message}`);
        }
      }
    }

    sendTokenToExtension();
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a0a]">
      {/* Background effects */}
      <div className="absolute inset-0 retro-grid opacity-20"></div>
      <div className="absolute inset-0 scanlines"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff6b35] rounded-full blur-[150px] opacity-10"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 text-white glow-text">
              BRAIN<sup className="text-[#ff6b35] text-2xl">²</sup>
            </h1>
            <p className="text-[#ff6b35] font-mono text-sm">
              &gt; EXTENSION_AUTHENTICATION
            </p>
          </div>

          {/* Status Card */}
          <div className="border-4 border-[#ff6b35] bg-[#1a1a1a] p-8 shadow-[0_0_50px_rgba(255,107,53,0.3)]">
            <div className="text-center space-y-6">
              {status === 'loading' && (
                <>
                  <div className="flex justify-center">
                    <div className="w-12 h-12 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-[#a0a0a0] font-mono text-sm">
                    &gt; VERIFYING_SESSION...
                  </p>
                </>
              )}

              {status === 'sending' && (
                <>
                  <div className="flex justify-center">
                    <div className="w-12 h-12 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-[#ff6b35] font-mono text-sm">
                    &gt; {message.toUpperCase()}
                  </p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-[#38ef7d] rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[#38ef7d] font-mono text-lg font-bold">
                    &gt; AUTHENTICATION_SUCCESS
                  </p>
                  <p className="text-[#a0a0a0] font-mono text-sm">
                    {message}
                  </p>
                  <button
                    onClick={() => window.close()}
                    className="mt-4 px-6 py-3 bg-[#ff6b35] text-[#0a0a0a] border-4 border-[#ff6b35] font-mono font-bold uppercase tracking-wider transition-all duration-300 hover:bg-transparent hover:text-[#ff6b35]"
                  >
                    &gt; CLOSE_TAB
                  </button>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-[#ff0055] rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[#ff0055] font-mono text-lg font-bold">
                    &gt; AUTHENTICATION_ERROR
                  </p>
                  <p className="text-[#a0a0a0] font-mono text-sm">
                    {message}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-3 bg-[#ff0055] text-[#0a0a0a] border-4 border-[#ff0055] font-mono font-bold uppercase tracking-wider transition-all duration-300 hover:bg-transparent hover:text-[#ff0055]"
                  >
                    &gt; RETRY
                  </button>
                </>
              )}

              {user && (
                <div className="mt-6 pt-6 border-t-2 border-[#ff6b35]">
                  <p className="text-[#a0a0a0] font-mono text-xs">
                    Logged in as: <span className="text-[#ff6b35]">{user.email}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
