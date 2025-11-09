"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from '@auth0/nextjs-auth0/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TimelineDataPoint {
  date: string;
  count: number;
  categories: Record<string, number>;
  code?: number;
  docs?: number;
  social?: number;
  entertainment?: number;
  shopping?: number;
  other?: number;
}

export default function TimelinePage() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [timeline, setTimeline] = useState<TimelineDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<TimelineDataPoint | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user) {
      fetchTimeline();
    }
  }, [user, days]);

  const fetchTimeline = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/history/timeline?days=${days}`);

      if (!response.ok) {
        throw new Error('Failed to fetch timeline');
      }

      const data = await response.json();

      // Transform data for Recharts
      const transformedData = data.timeline.map((point: TimelineDataPoint) => ({
        ...point,
        code: point.categories.code || 0,
        docs: point.categories.docs || 0,
        social: point.categories.social || 0,
        entertainment: point.categories.entertainment || 0,
        shopping: point.categories.shopping || 0,
        other: point.categories.other || 0,
      }));

      setTimeline(transformedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);

      return (
        <div className="bg-black border-2 border-[#ff6b35] p-4 font-mono">
          <p className="text-[#ff6b35] font-bold mb-2">{label}</p>
          <p className="text-[#38ef7d] mb-2">TOTAL: {total} pages</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-[#a0a0a0] text-sm" style={{ color: entry.color }}>
              {entry.name.toUpperCase()}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
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
            &gt; BROWSING_TIMELINE.SYS
          </h1>
          <p className="text-[#a0a0a0] font-mono">
            Visual analysis of your browsing patterns over time
          </p>

          {/* Time Range Selector */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setDays(7)}
              className={`px-4 py-2 font-mono border-2 transition-colors ${
                days === 7
                  ? 'border-[#ff6b35] text-[#ff6b35] bg-[#ff6b35]/10'
                  : 'border-[#38ef7d] text-[#38ef7d] hover:bg-[#38ef7d]/10'
              }`}
            >
              7 DAYS
            </button>
            <button
              onClick={() => setDays(30)}
              className={`px-4 py-2 font-mono border-2 transition-colors ${
                days === 30
                  ? 'border-[#ff6b35] text-[#ff6b35] bg-[#ff6b35]/10'
                  : 'border-[#38ef7d] text-[#38ef7d] hover:bg-[#38ef7d]/10'
              }`}
            >
              30 DAYS
            </button>
            <button
              onClick={() => setDays(90)}
              className={`px-4 py-2 font-mono border-2 transition-colors ${
                days === 90
                  ? 'border-[#ff6b35] text-[#ff6b35] bg-[#ff6b35]/10'
                  : 'border-[#38ef7d] text-[#38ef7d] hover:bg-[#38ef7d]/10'
              }`}
            >
              90 DAYS
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="border-2 border-[#38ef7d] bg-black p-12 text-center">
            <div className="text-2xl font-mono animate-pulse">
              PROCESSING TIMELINE DATA...
            </div>
          </div>
        ) : error ? (
          <div className="border-2 border-[#ff6b35] bg-black p-8">
            <p className="text-[#ff6b35] font-mono">ERROR: {error}</p>
            <button
              onClick={fetchTimeline}
              className="mt-4 px-4 py-2 border-2 border-[#38ef7d] text-[#38ef7d] font-mono hover:bg-[#38ef7d]/10"
            >
              RETRY
            </button>
          </div>
        ) : (
          <div className="border-2 border-[#ff6b35] bg-black p-8">
            {/* Chart */}
            <div className="mb-8">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="colorCode" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ff6b35" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38ef7d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#38ef7d" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSocial" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00b4d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00b4d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEntertainment" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9d4edd" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#9d4edd" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="date"
                    stroke="#a0a0a0"
                    style={{ fontSize: '12px', fontFamily: 'monospace' }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis
                    stroke="#a0a0a0"
                    style={{ fontSize: '12px', fontFamily: 'monospace' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="code"
                    stackId="1"
                    stroke="#ff6b35"
                    fillOpacity={1}
                    fill="url(#colorCode)"
                    name="Code"
                  />
                  <Area
                    type="monotone"
                    dataKey="docs"
                    stackId="1"
                    stroke="#38ef7d"
                    fillOpacity={1}
                    fill="url(#colorDocs)"
                    name="Docs"
                  />
                  <Area
                    type="monotone"
                    dataKey="social"
                    stackId="1"
                    stroke="#00b4d8"
                    fillOpacity={1}
                    fill="url(#colorSocial)"
                    name="Social"
                  />
                  <Area
                    type="monotone"
                    dataKey="entertainment"
                    stackId="1"
                    stroke="#9d4edd"
                    fillOpacity={1}
                    fill="url(#colorEntertainment)"
                    name="Entertainment"
                  />
                  <Area
                    type="monotone"
                    dataKey="other"
                    stackId="1"
                    stroke="#a0a0a0"
                    fillOpacity={1}
                    fill="#1a1a1a"
                    name="Other"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="border-2 border-[#38ef7d] p-4">
                <div className="text-[#a0a0a0] font-mono text-sm">TOTAL PAGES</div>
                <div className="text-[#38ef7d] font-mono text-3xl mt-2">
                  {timeline.reduce((sum, point) => sum + point.count, 0)}
                </div>
              </div>
              <div className="border-2 border-[#38ef7d] p-4">
                <div className="text-[#a0a0a0] font-mono text-sm">AVERAGE/DAY</div>
                <div className="text-[#38ef7d] font-mono text-3xl mt-2">
                  {Math.round(timeline.reduce((sum, point) => sum + point.count, 0) / timeline.length)}
                </div>
              </div>
              <div className="border-2 border-[#38ef7d] p-4">
                <div className="text-[#a0a0a0] font-mono text-sm">PEAK DAY</div>
                <div className="text-[#38ef7d] font-mono text-3xl mt-2">
                  {Math.max(...timeline.map(p => p.count))}
                </div>
              </div>
            </div>
          </div>
        )}

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
