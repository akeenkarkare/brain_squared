// Example React/Next.js component for searching Brain Squared history
// Place this in your Next.js app and customize as needed

'use client'; // If using Next.js 13+ App Router

import { useState } from 'react';

// Types
interface SearchResult {
  id: string;
  url: string;
  title: string;
  lastVisitTime: number;
  visitCount?: number;
  typedCount?: number;
  score: number;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

// Configuration
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export default function BrainSquaredSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/history/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          limit: 20,
          minScore: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number) => {
    if (score > 0.7) return 'text-green-600';
    if (score > 0.5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Brain Squared</h1>
        <p className="text-gray-600">Search your browsing history semantically</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your memory... (e.g., 'React tutorials', 'AI tools')"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Error: {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <div className="mb-4 text-sm text-gray-600">
            Found {results.length} result{results.length !== 1 ? 's' : ''}
          </div>

          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-blue-600 hover:underline block truncate"
                    >
                      {result.title}
                    </a>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {result.url}
                    </p>
                  </div>

                  <div className={`ml-4 text-sm font-semibold ${getScoreColor(result.score)}`}>
                    {(result.score * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="mt-3 flex gap-4 text-xs text-gray-500">
                  <span>Last visited: {formatDate(result.lastVisitTime)}</span>
                  {result.visitCount && result.visitCount > 0 && (
                    <span>Visits: {result.visitCount}</span>
                  )}
                  {result.typedCount && result.typedCount > 0 && (
                    <span>Typed: {result.typedCount}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && query && !error && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No results found</div>
          <div className="text-gray-500 text-sm">
            Try a different search query or sync more history from the Chrome extension
          </div>
        </div>
      )}

      {/* Initial State */}
      {!query && results.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-4">
            Try searching for something you've researched
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {['React tutorials', 'AI tools', 'Python documentation', 'Machine learning'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setQuery(suggestion)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Alternative: API Route Handler (if you want to proxy through Next.js)
// app/api/search/route.ts

/*
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/history/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
*/

// Environment variable setup
// Add to .env.local:
// NEXT_PUBLIC_BACKEND_URL=http://localhost:3000

// For production deployment:
// NEXT_PUBLIC_BACKEND_URL=https://your-backend.vercel.app
