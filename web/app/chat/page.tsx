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
  isTimeMachine?: boolean;
  timeRange?: {
    start: number;
    end: number;
    description: string;
  };
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
      content: "SYSTEM_READY. Neural search interface initialized.\n\nType any query to search your browsing history:\n\n📚 SEMANTIC SEARCH:\n• \"python tutorials\"\n• \"github repositories\"\n• \"machine learning articles\"\n\n⏰ TIME MACHINE:\n• \"What was I reading about robotics 4 weeks ago?\"\n• \"Show me React resources from last month\"\n• \"What did I research yesterday?\"\n\nMake sure you've synced your history via the Brain² extension first!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Detect manual scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Only auto-scroll if user hasn't manually scrolled up
  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

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

    // Create placeholder assistant message for streaming
    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      searchResults: [],
      isSearchQuery: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Call streaming search API
      const response = await fetch('/api/history/search/stream', {
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
        throw new Error('Search failed');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let results: SearchResult[] = [];
      let isTimeMachine = false;
      let timeRange = undefined;
      let buffer = ''; // Buffer for partial lines

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Split by newlines, keeping incomplete line in buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;

            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'results') {
                  results = data.results || [];
                  isTimeMachine = data.isTimeMachine || false;
                  timeRange = data.timeRange || undefined;
                } else if (data.type === 'token') {
                  accumulatedContent += data.content;

                  // Update message with streaming content
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? {
                            ...msg,
                            content: accumulatedContent,
                            searchResults: results,
                          }
                        : msg
                    )
                  );
                } else if (data.type === 'done') {
                  // Streaming complete
                  break;
                }
              } catch (e) {
                // Skip malformed JSON (partial chunk)
                console.error('Failed to parse SSE line:', e);
              }
            }
          }
        }
      }

      // Final update with complete message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: accumulatedContent || (results.length > 0
                  ? `Found ${results.length} ${results.length === 1 ? 'result' : 'results'} in your browsing history:`
                  : `No results found for "${userInput}". Try different keywords or sync your browsing history via the extension.`),
                searchResults: results,
                isTimeMachine,
                timeRange,
              }
            : msg
        )
      );

    } catch (error: any) {
      console.error('Search error:', error);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: `ERROR: ${error.message || 'Failed to search. Please ensure you are logged in and have synced your browsing history.'}`,
              }
            : msg
        )
      );
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
              onClick={() => router.push('/timeline')}
              className="px-4 py-2 text-sm font-mono font-bold text-[#38ef7d] border-2 border-[#38ef7d] hover:bg-[#38ef7d] hover:text-[#0a0a0a] transition-all duration-300 uppercase tracking-wider"
            >
              &gt; TIMELINE
            </button>
            <button
              onClick={() => router.push('/insights')}
              className="px-4 py-2 text-sm font-mono font-bold text-[#00b4d8] border-2 border-[#00b4d8] hover:bg-[#00b4d8] hover:text-[#0a0a0a] transition-all duration-300 uppercase tracking-wider"
            >
              &gt; INSIGHTS
            </button>
            <button
              onClick={handleClearChat}
              className="px-4 py-2 text-sm font-mono font-bold text-[#ff9e00] border-2 border-[#ff9e00] hover:bg-[#ff9e00] hover:text-[#0a0a0a] transition-all duration-300 uppercase tracking-wider"
            >
              &gt; CLEAR
            </button>
            <a
              href="/api/auth/logout"
              className="px-4 py-2 text-sm font-mono font-bold text-[#ff0055] border-2 border-[#ff0055] hover:bg-[#ff0055] hover:text-[#0a0a0a] transition-all duration-300 uppercase tracking-wider"
            >
              &gt; LOGOUT
            </a>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <main ref={messagesContainerRef} className="relative z-10 flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-[#ff6b35] scrollbar-track-[#1a1a1a]">
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
                {/* Time Machine Badge */}
                {message.isTimeMachine && message.timeRange && (
                  <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 bg-[#9d4edd] bg-opacity-20 border-2 border-[#9d4edd] font-mono text-xs text-[#9d4edd]">
                    <span>⏰ TIME MACHINE</span>
                    <span className="text-[#a0a0a0]">|</span>
                    <span className="uppercase">{message.timeRange.description}</span>
                  </div>
                )}

                <div
                  className={`px-5 py-4 font-mono text-sm border-2 ${
                    message.role === "user"
                      ? "bg-[#ff6b35] bg-opacity-10 border-[#ff6b35] text-white"
                      : message.isTimeMachine
                      ? "bg-[#9d4edd] bg-opacity-5 border-[#9d4edd] text-[#ffffff] shadow-[0_0_20px_rgba(157,78,221,0.3)]"
                      : "bg-[#1a1a1a] border-[#ff9e00] text-[#ffffff]"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {message.content}
                    {message.role === "assistant" && isLoading && message.content && !message.content.includes("ERROR") && (
                      <span className="inline-block w-2 h-4 bg-[#ff6b35] ml-1 animate-pulse"></span>
                    )}
                  </p>
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

          {isLoading && !messages.some(m => m.id === (Date.now() + 1).toString() && m.content === "") && (
            <div className="flex gap-4 justify-start">
              <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-[#ff6b35] to-[#ff9e00] flex items-center justify-center border-2 border-[#ff6b35] font-bold text-[#0a0a0a] animate-pulse">
                AI
              </div>
              <div className="bg-[#1a1a1a] border-2 border-[#ff9e00] px-5 py-4 max-w-[70%]">
                <div className="flex gap-2 items-center font-mono text-[#ff9e00]">
                  <div className="w-2 h-2 bg-[#ff9e00] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-[#ff9e00] rounded-full animate-pulse delay-150"></div>
                  <div className="w-2 h-2 bg-[#ff9e00] rounded-full animate-pulse delay-300"></div>
                  <span className="ml-2">SEARCHING...</span>
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
