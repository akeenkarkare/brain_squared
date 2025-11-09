import SearchResult from './SearchResult';

interface HistoryItem {
  url: string;
  title: string;
  visitCount: number;
  lastVisitTime: number;
  score: number;
  typedCount?: number;
}

interface SearchResultsProps {
  results: HistoryItem[];
  query: string;
  isLoading?: boolean;
}

export default function SearchResults({ results, query, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="border-4 border-[#ff6b35] bg-[#1a1a1a] p-8 mt-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#ff6b35] font-mono text-sm animate-pulse">
            &gt; SEARCHING_NEURAL_MEMORY...
          </p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="border-4 border-[#ff6b35] bg-[#1a1a1a] p-8 mt-4 text-center">
        <div className="text-[#6a6a6a] font-mono">
          <p className="text-lg mb-2">&gt; NO_RESULTS_FOUND</p>
          <p className="text-sm">
            No matching entries for query: &quot;{query}&quot;
          </p>
          <p className="text-xs mt-4 text-[#a0a0a0]">
            TIP: Try different keywords or sync your browsing history via the extension
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Header */}
      <div className="border-4 border-[#ff6b35] bg-[#1a1a1a] p-4 mb-4">
        <div className="font-mono">
          <p className="text-[#ff6b35] text-sm mb-1">
            &gt; SEARCH_RESULTS
          </p>
          <p className="text-[#a0a0a0] text-xs">
            Found {results.length} {results.length === 1 ? 'entry' : 'entries'} matching &quot;{query}&quot;
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-0">
        {results.map((result, index) => (
          <SearchResult
            key={`${result.url}-${index}`}
            url={result.url}
            title={result.title}
            visitCount={result.visitCount}
            lastVisitTime={result.lastVisitTime}
            score={result.score}
            typedCount={result.typedCount}
          />
        ))}
      </div>

      {/* Footer stats */}
      <div className="border-2 border-[#ff6b35] bg-[#1a1a1a] p-3 mt-4 text-center">
        <p className="text-[#a0a0a0] font-mono text-xs">
          &gt; END_OF_RESULTS | TOTAL: {results.length}
        </p>
      </div>
    </div>
  );
}
