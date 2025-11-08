export interface HistoryItem {
  url: string;
  title: string;
  lastVisitTime: number;
  visitCount?: number;
  typedCount?: number;
}

export interface SearchQuery {
  query: string;
  limit?: number;
  minScore?: number;
}

export interface SearchResult {
  id: string;
  url: string;
  title: string;
  lastVisitTime: number;
  visitCount?: number;
  typedCount?: number;
  score: number;
}

export interface UploadResponse {
  success: boolean;
  itemsProcessed: number;
  message: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}
