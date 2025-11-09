"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from '@auth0/nextjs-auth0/client';
import SearchResults from "@/components/SearchResults";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  searchResults?: SearchResult[];
  isSearchQuery?: boolean;
}

interface SearchResult {
  url: string;
  title: string;
  visitCount: number;
  lastVisitTime: number;
  score: number;
  typedCount?: number;
}

export default function ChatPage() {
  const { user } = useUser();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "SYSTEM_READY. Neural search interface initialized.\n\nType any query to search your browsing history. Examples:\n• \"python tutorials\"\n• \"github repositories\"\n• \"machine learning articles\"\n\nMake sure you've synced your history via the Brain² extension first!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userInput = input.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Check if this is a search query (users can just type naturally)
    // All queries will trigger a search
    try {
      // Call our search API
      const response = await fetch('/api/history/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userInput,
          limit: 20,
          minScore: 0.3
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Search failed');
      }

      const data = await response.json();
      const results = data.results || [];
      const aiResponse = data.aiResponse || '';

      // Create assistant message with AI-synthesized response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse || (results.length > 0
          ? `Found ${results.length} ${results.length === 1 ? 'result' : 'results'} in your browsing history:`
          : `No results found for "${userInput}". Try different keywords or sync your browsing history via the extension.`),
        timestamp: new Date(),
        searchResults: results,
        isSearchQuery: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Search error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `ERROR: ${error.message || 'Failed to search. Please ensure you are logged in and have synced your browsing history.'}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: "SYSTEM_RESET. All previous searches cleared. Ready for new queries.",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 retro-grid opacity-10"></div>
      <div className="absolute inset-0 scanlines pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-20 border-b-4 border-[#ff6b35] bg-[#1a1a1a] px-4 py-4 shadow-[0_0_30px_rgba(255,107,53,0.2)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#ff6b35] to-[#ff9e00] flex items-center justify-center font-bold text-2xl text-[#0a0a0a] border-2 border-[#ff6b35]">
              B²
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-mono tracking-wider">
                BRAIN<sup className="text-[#ff6b35] text-sm">²</sup> TERMINAL
              </h1>
              <p className="text-[#ff6b35] font-mono text-xs">
                &gt; USER: {user?.name?.toUpperCase() || user?.email?.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClearChat}
              className="px-4 py-2 text-sm font-mono font-bold text-[#ff9e00] border-2 border-[#ff9e00] hover:bg-[#ff9e00] hover:text-[#0a0a0a] transition-all duration-300 uppercase tracking-wider"
            >
              &gt; CLEAR
            </button>
            <a
              href="/auth/logout"
              className="px-4 py-2 text-sm font-mono font-bold text-[#ff0055] border-2 border-[#ff0055] hover:bg-[#ff0055] hover:text-[#0a0a0a] transition-all duration-300 uppercase tracking-wider"
            >
              &gt; LOGOUT
            </a>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-[#ff6b35] scrollbar-track-[#1a1a1a]">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-[#ff6b35] to-[#ff9e00] flex items-center justify-center border-2 border-[#ff6b35] font-bold text-[#0a0a0a]">
                  AI
                </div>
              )}

              <div
                className={`max-w-[70%] ${
                  message.role === "user" ? "order-2" : ""
                } ${message.isSearchQuery && message.searchResults ? "max-w-full" : ""}`}
              >
                <div
                  className={`px-5 py-4 font-mono text-sm border-2 ${
                    message.role === "user"
                      ? "bg-[#ff6b35] bg-opacity-10 border-[#ff6b35] text-white"
                      : "bg-[#1a1a1a] border-[#ff9e00] text-[#ffffff]"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Show search results if available */}
                {message.isSearchQuery && message.searchResults && message.searchResults.length > 0 && (
                  <div className="mt-4">
                    <SearchResults
                      results={message.searchResults}
                      query={messages.find(m => m.id === (parseInt(message.id) - 1).toString())?.content || ""}
                      isLoading={false}
                    />
                  </div>
                )}

                <p className="text-xs text-[#a0a0a0] mt-2 px-1 font-mono">
                  &gt; {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>

              {message.role === "user" && (
                <div className="w-10 h-10 flex-shrink-0 bg-[#ff6b35] border-2 border-[#ff6b35] flex items-center justify-center font-bold text-[#0a0a0a] order-3">
                  U
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-[#ff6b35] to-[#ff9e00] flex items-center justify-center border-2 border-[#ff6b35] font-bold text-[#0a0a0a] animate-pulse">
                AI
              </div>
              <div className="bg-[#1a1a1a] border-2 border-[#ff9e00] px-5 py-4 max-w-[70%]">
                <div className="flex gap-2 items-center font-mono text-[#ff9e00]">
                  <div className="w-2 h-2 bg-[#ff9e00] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-[#ff9e00] rounded-full animate-pulse delay-150"></div>
                  <div className="w-2 h-2 bg-[#ff9e00] rounded-full animate-pulse delay-300"></div>
                  <span className="ml-2">PROCESSING...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="relative z-20 border-t-4 border-[#ff6b35] bg-[#1a1a1a] px-4 py-4 shadow-[0_0_30px_rgba(255,107,53,0.2)]">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff6b35] font-mono font-bold">
                &gt;
              </span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter command..."
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-4 bg-[#0a0a0a] border-2 border-[#ff6b35] text-white font-mono focus:outline-none focus:border-[#ff9e00] focus:shadow-[0_0_20px_rgba(255,158,0,0.3)] transition-all duration-300 disabled:opacity-50 placeholder:text-[#a0a0a0]"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-8 py-4 bg-[#ff6b35] text-[#0a0a0a] border-4 border-[#ff6b35] font-mono font-bold uppercase tracking-wider transition-all duration-300 hover:bg-transparent hover:text-[#ff6b35] hover:shadow-[0_0_30px_rgba(255,107,53,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>&gt; SEND</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </form>

          {/* Status Bar */}
          <div className="mt-4 flex justify-between items-center border-t-2 border-[#ff6b35] pt-3">
            <p className="text-[#a0a0a0] font-mono text-xs">
              &gt; STATUS: <span className="text-[#ff6b35]">CONNECTED</span>
            </p>
            <p className="text-[#a0a0a0] font-mono text-xs hidden sm:block">
              &gt; MESSAGES: <span className="text-[#ff6b35]">{messages.length}</span>
            </p>
            <p className="text-[#a0a0a0] font-mono text-xs">
              &gt; LATENCY: <span className="text-[#ff6b35]">{Math.floor(Math.random() * 50)}ms</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
