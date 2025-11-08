"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "SYSTEM_READY. Neural interface initialized. How may I assist you?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
    }
  }, [isAuthenticated, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateResponse(input),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const generateResponse = (userInput: string): string => {
    const responses = [
      "Processing your query through neural networks...",
      "Analyzing data patterns. Standby for response...",
      "System computed optimal solution. Transmitting...",
      "Query processed. Delivering results...",
      "Neural link established. Information retrieved...",
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];
    return `${randomResponse} Query: "${userInput}". [PLACEHOLDER_RESPONSE: Connect to actual AI service for real responses]`;
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: "SYSTEM_RESET. All previous data cleared. Ready for new session.",
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
      <header className="relative z-20 border-b-4 border-[#00ff88] bg-[#1a1a1a] px-4 py-4 shadow-[0_0_30px_rgba(0,255,136,0.2)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#00ff88] to-[#00d9ff] flex items-center justify-center font-bold text-2xl text-[#0a0a0a] border-2 border-[#00ff88]">
              B²
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-mono tracking-wider">
                BRAIN<sup className="text-[#00ff88] text-sm">²</sup> TERMINAL
              </h1>
              <p className="text-[#00ff88] font-mono text-xs">
                &gt; USER: {user?.name?.toUpperCase() || user?.email?.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClearChat}
              className="px-4 py-2 text-sm font-mono font-bold text-[#00d9ff] border-2 border-[#00d9ff] hover:bg-[#00d9ff] hover:text-[#0a0a0a] transition-all duration-300 uppercase tracking-wider"
            >
              &gt; CLEAR
            </button>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="px-4 py-2 text-sm font-mono font-bold text-[#ff0055] border-2 border-[#ff0055] hover:bg-[#ff0055] hover:text-[#0a0a0a] transition-all duration-300 uppercase tracking-wider"
            >
              &gt; LOGOUT
            </button>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-[#00ff88] scrollbar-track-[#1a1a1a]">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-[#00ff88] to-[#00d9ff] flex items-center justify-center border-2 border-[#00ff88] font-bold text-[#0a0a0a]">
                  AI
                </div>
              )}

              <div
                className={`max-w-[70%] ${
                  message.role === "user" ? "order-2" : ""
                }`}
              >
                <div
                  className={`px-5 py-4 font-mono text-sm border-2 ${
                    message.role === "user"
                      ? "bg-[#00ff88] bg-opacity-10 border-[#00ff88] text-white"
                      : "bg-[#1a1a1a] border-[#00d9ff] text-[#ffffff]"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className="text-xs text-[#a0a0a0] mt-2 px-1 font-mono">
                  &gt; {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>

              {message.role === "user" && (
                <div className="w-10 h-10 flex-shrink-0 bg-[#00ff88] border-2 border-[#00ff88] flex items-center justify-center font-bold text-[#0a0a0a] order-3">
                  U
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-[#00ff88] to-[#00d9ff] flex items-center justify-center border-2 border-[#00ff88] font-bold text-[#0a0a0a] animate-pulse">
                AI
              </div>
              <div className="bg-[#1a1a1a] border-2 border-[#00d9ff] px-5 py-4 max-w-[70%]">
                <div className="flex gap-2 items-center font-mono text-[#00d9ff]">
                  <div className="w-2 h-2 bg-[#00d9ff] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-[#00d9ff] rounded-full animate-pulse delay-150"></div>
                  <div className="w-2 h-2 bg-[#00d9ff] rounded-full animate-pulse delay-300"></div>
                  <span className="ml-2">PROCESSING...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="relative z-20 border-t-4 border-[#00ff88] bg-[#1a1a1a] px-4 py-4 shadow-[0_0_30px_rgba(0,255,136,0.2)]">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00ff88] font-mono font-bold">
                &gt;
              </span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter command..."
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-4 bg-[#0a0a0a] border-2 border-[#00ff88] text-white font-mono focus:outline-none focus:border-[#00d9ff] focus:shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all duration-300 disabled:opacity-50 placeholder:text-[#a0a0a0]"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-8 py-4 bg-[#00ff88] text-[#0a0a0a] border-4 border-[#00ff88] font-mono font-bold uppercase tracking-wider transition-all duration-300 hover:bg-transparent hover:text-[#00ff88] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
          <div className="mt-4 flex justify-between items-center border-t-2 border-[#00ff88] pt-3">
            <p className="text-[#a0a0a0] font-mono text-xs">
              &gt; STATUS: <span className="text-[#00ff88]">CONNECTED</span>
            </p>
            <p className="text-[#a0a0a0] font-mono text-xs hidden sm:block">
              &gt; MESSAGES: <span className="text-[#00ff88]">{messages.length}</span>
            </p>
            <p className="text-[#a0a0a0] font-mono text-xs">
              &gt; LATENCY: <span className="text-[#00ff88]">{Math.floor(Math.random() * 50)}ms</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
