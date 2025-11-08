"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="text-center px-4">
        <h1 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
          Welcome to Brain Squared
          {isAuthenticated && user && (
            <span className="block text-2xl mt-4 text-blue-600 dark:text-blue-400">
              Hello, {user.name}!
            </span>
          )}
        </h1>
        <p className="text-xl mb-12 text-gray-700 dark:text-gray-300 max-w-2xl">
          {isAuthenticated
            ? "Ready to chat with your AI assistant?"
            : "Your intelligent conversation platform"}
        </p>

        <div className="flex gap-6 justify-center flex-wrap">
          {isAuthenticated ? (
            <>
              <Link
                href="/chat"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                Go to Chat
              </Link>
              <button
                onClick={logout}
                className="px-8 py-4 bg-white text-red-600 border-2 border-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors shadow-lg"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                Get Started
              </Link>
              <Link
                href="/auth"
                className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
