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
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.length > 40 ? urlObj.pathname.slice(0, 40) + '...' : urlObj.pathname;
      return urlObj.hostname + path;
    } catch {
      return url.length > 60 ? url.slice(0, 60) + '...' : url;
    }
  };

  const getFavicon = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch {
      return null;
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-[#38ef7d]'; // Green for high relevance
    if (score >= 0.6) return 'text-[#ff6b35]'; // Orange for medium
    return 'text-[#a0a0a0]'; // Gray for low
  };

  const favicon = getFavicon(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border-2 border-[#ff6b35] bg-[#1a1a1a] p-4 mb-3 hover:bg-[#2a2a2a] transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,107,53,0.3)] hover:border-[#ff9e00] group cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Favicon */}
        {favicon && (
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center border-2 border-[#ff6b35] bg-[#0a0a0a] group-hover:border-[#ff9e00] transition-colors">
            <img
              src={favicon}
              alt=""
              className="w-4 h-4"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Title and URL */}
          <div className="mb-2">
            <h3 className="text-[#ff6b35] font-mono text-base group-hover:text-white transition-colors duration-300 mb-1">
              &gt; {title || 'Untitled'}
            </h3>
            <p className="text-[#6a6a6a] font-mono text-xs truncate group-hover:text-[#a0a0a0] transition-colors">
              {formatUrl(url)}
            </p>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-3 text-xs font-mono">
            <span className={`flex items-center gap-1 ${getRelevanceColor(score)} font-bold`}>
              <span className="opacity-60">RELEVANCE:</span>
              {(score * 100).toFixed(0)}%
            </span>
            <span className="text-[#a0a0a0] flex items-center gap-1">
              <span className="opacity-60">VISITS:</span>
              {visitCount}
            </span>
            {typedCount !== undefined && typedCount > 0 && (
              <span className="text-[#a0a0a0] flex items-center gap-1">
                <span className="opacity-60">TYPED:</span>
                {typedCount}
              </span>
            )}
            <span className="text-[#a0a0a0] flex items-center gap-1">
              <span className="opacity-60">📅</span>
              {formatDate(lastVisitTime)}
            </span>
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="flex-shrink-0 text-[#ff6b35] group-hover:text-[#ff9e00] transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </a>
  );
}
