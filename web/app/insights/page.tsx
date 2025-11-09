"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from '@auth0/nextjs-auth0/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface InsightsData {
  timeDistribution: {
    category: string;
    percentage: number;
    count: number;
  }[];
  topDomains: {
    domain: string;
    count: number;
    percentage: number;
  }[];
  topTechnologies: string[];
  productiveHours: {
    hour: number;
    count: number;
  }[];
  totalPages: number;
  averageDaily: number;
  weekOverWeek: number;
}

const COLORS = ['#ff6b35', '#38ef7d', '#00b4d8', '#9d4edd', '#f77f00', '#06ffa5'];

export default function InsightsPage() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user) {
      fetchInsights();
    }
  }, [user]);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/history/insights');

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      setInsights(data.insights);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${period}`;
  };

  if (userLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#38ef7d] font-mono text-xl animate-pulse">
          LOADING...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#38ef7d] p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="border-2 border-[#ff6b35] bg-black p-6">
          <h1 className="text-4xl font-mono text-[#ff6b35] mb-2">
            &gt; SMART_INSIGHTS.AI
          </h1>
          <p className="text-[#a0a0a0] font-mono">
            AI-powered analysis of your browsing patterns and learning journey
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="border-2 border-[#38ef7d] bg-black p-12 text-center">
            <div className="text-2xl font-mono animate-pulse">
              ANALYZING YOUR BROWSING PATTERNS...
            </div>
          </div>
        ) : error ? (
          <div className="border-2 border-[#ff6b35] bg-black p-8">
            <p className="text-[#ff6b35] font-mono">ERROR: {error}</p>
            <button
              onClick={fetchInsights}
              className="mt-4 px-4 py-2 border-2 border-[#38ef7d] text-[#38ef7d] font-mono hover:bg-[#38ef7d]/10"
            >
              RETRY
            </button>
          </div>
        ) : insights ? (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border-2 border-[#ff6b35] bg-black p-6">
                <div className="text-[#a0a0a0] font-mono text-sm">TOTAL PAGES</div>
                <div className="text-[#ff6b35] font-mono text-4xl mt-2">
                  {insights.totalPages}
                </div>
              </div>
              <div className="border-2 border-[#38ef7d] bg-black p-6">
                <div className="text-[#a0a0a0] font-mono text-sm">AVG/DAY</div>
                <div className="text-[#38ef7d] font-mono text-4xl mt-2">
                  {insights.averageDaily}
                </div>
              </div>
              <div className="border-2 border-[#00b4d8] bg-black p-6">
                <div className="text-[#a0a0a0] font-mono text-sm">WEEK/WEEK</div>
                <div className="text-[#00b4d8] font-mono text-4xl mt-2">
                  {insights.weekOverWeek >= 0 ? '+' : ''}{insights.weekOverWeek}%
                </div>
              </div>
              <div className="border-2 border-[#9d4edd] bg-black p-6">
                <div className="text-[#a0a0a0] font-mono text-sm">CATEGORIES</div>
                <div className="text-[#9d4edd] font-mono text-4xl mt-2">
                  {insights.timeDistribution.length}
                </div>
              </div>
            </div>

            {/* Time Distribution */}
            <div className="border-2 border-[#ff6b35] bg-black p-8">
              <h2 className="text-2xl font-mono text-[#ff6b35] mb-6">
                &gt; TIME_DISTRIBUTION
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={insights.timeDistribution}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry: any) => `${entry.category.toUpperCase()}: ${entry.percentage}%`}
                      >
                        {insights.timeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#000',
                          border: '2px solid #ff6b35',
                          fontFamily: 'monospace',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {insights.timeDistribution.map((cat, index) => (
                    <div key={cat.category} className="border-2 border-[#38ef7d] p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-mono text-[#38ef7d] uppercase">
                          {cat.category}
                        </span>
                        <span className="font-mono text-[#ff6b35]">
                          {cat.percentage}%
                        </span>
                      </div>
                      <div className="bg-[#1a1a1a] h-2 rounded">
                        <div
                          className="h-2 rounded transition-all"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                      <div className="text-[#a0a0a0] font-mono text-xs mt-1">
                        {cat.count} pages
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Productive Hours */}
            <div className="border-2 border-[#38ef7d] bg-black p-8">
              <h2 className="text-2xl font-mono text-[#38ef7d] mb-6">
                &gt; MOST_PRODUCTIVE_HOURS
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={insights.productiveHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="hour"
                    stroke="#a0a0a0"
                    style={{ fontSize: '12px', fontFamily: 'monospace' }}
                    tickFormatter={formatHour}
                  />
                  <YAxis
                    stroke="#a0a0a0"
                    style={{ fontSize: '12px', fontFamily: 'monospace' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#000',
                      border: '2px solid #38ef7d',
                      fontFamily: 'monospace',
                    }}
                    labelFormatter={formatHour}
                  />
                  <Bar dataKey="count" fill="#38ef7d" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[#a0a0a0] font-mono text-sm mt-4">
                Your peak browsing hour:{' '}
                <span className="text-[#38ef7d]">
                  {formatHour(insights.productiveHours[0]?.hour)} with {insights.productiveHours[0]?.count} pages
                </span>
              </p>
            </div>

            {/* Top Technologies */}
            <div className="border-2 border-[#00b4d8] bg-black p-8">
              <h2 className="text-2xl font-mono text-[#00b4d8] mb-6">
                &gt; TOP_TECHNOLOGIES_LEARNING
              </h2>
              <div className="flex flex-wrap gap-3">
                {insights.topTechnologies.map((tech, index) => (
                  <div
                    key={tech}
                    className="border-2 border-[#00b4d8] px-4 py-2 font-mono text-[#00b4d8] uppercase"
                  >
                    {tech}
                  </div>
                ))}
              </div>
              {insights.topTechnologies.length === 0 && (
                <p className="text-[#a0a0a0] font-mono">
                  No specific technologies detected. Keep browsing!
                </p>
              )}
            </div>

            {/* Top Domains */}
            <div className="border-2 border-[#9d4edd] bg-black p-8">
              <h2 className="text-2xl font-mono text-[#9d4edd] mb-6">
                &gt; TOP_DOMAINS_VISITED
              </h2>
              <div className="space-y-3">
                {insights.topDomains.slice(0, 10).map((domain, index) => (
                  <div key={domain.domain} className="flex items-center gap-4">
                    <div className="text-[#9d4edd] font-mono w-8 text-right">
                      {index + 1}.
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-[#38ef7d]">
                          {domain.domain}
                        </span>
                        <span className="font-mono text-[#ff6b35]">
                          {domain.count} visits ({domain.percentage}%)
                        </span>
                      </div>
                      <div className="bg-[#1a1a1a] h-1 rounded">
                        <div
                          className="bg-[#9d4edd] h-1 rounded transition-all"
                          style={{ width: `${domain.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/chat')}
            className="px-6 py-3 border-2 border-[#38ef7d] text-[#38ef7d] font-mono hover:bg-[#38ef7d]/10 transition-colors"
          >
            &lt; BACK_TO_SEARCH
          </button>
        </div>
      </div>
    </div>
  );
}
