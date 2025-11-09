interface SearchResultProps {
  url: string;
  title: string;
  visitCount: number;
  lastVisitTime: number;
  score: number;
  typedCount?: number;
}

export default function SearchResult({
  url,
  title,
  visitCount,
  lastVisitTime,
  score,
  typedCount,
}: SearchResultProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url;
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-[#38ef7d]'; // Green for high relevance
    if (score >= 0.6) return 'text-[#ff6b35]'; // Orange for medium
    return 'text-[#a0a0a0]'; // Gray for low
  };

  return (
    <div className="border-2 border-[#ff6b35] bg-[#1a1a1a] p-4 mb-3 hover:bg-[#2a2a2a] transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,107,53,0.3)] group">
      {/* Title and URL */}
      <div className="mb-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#ff6b35] font-mono text-base hover:text-white transition-colors duration-300 group-hover:underline"
        >
          &gt; {title || 'Untitled'}
        </a>
        <p className="text-[#6a6a6a] font-mono text-xs mt-1 truncate">
          {formatUrl(url)}
        </p>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-xs font-mono">
        <span className={`${getRelevanceColor(score)}`}>
          RELEVANCE: {(score * 100).toFixed(0)}%
        </span>
        <span className="text-[#a0a0a0]">
          VISITS: {visitCount}
        </span>
        {typedCount !== undefined && typedCount > 0 && (
          <span className="text-[#a0a0a0]">
            TYPED: {typedCount}
          </span>
        )}
        <span className="text-[#a0a0a0]">
          LAST: {formatDate(lastVisitTime)}
        </span>
      </div>
    </div>
  );
}
