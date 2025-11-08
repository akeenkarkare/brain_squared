import { qdrantClient, COLLECTION_NAME } from '../config/qdrant';
import { generateEmbedding, createEmbeddingText } from './embeddings';
import { HistoryItem, SearchResult } from '../types';
import crypto from 'crypto';

// Generate a unique ID from URL
function generateIdFromUrl(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

// Upload history items to Qdrant
export async function uploadHistoryItems(items: HistoryItem[]): Promise<number> {
  const points = [];

  for (const item of items) {
    try {
      // Create embedding text
      const embeddingText = createEmbeddingText(item.url, item.title);

      // Generate embedding
      const vector = await generateEmbedding(embeddingText);

      // Create point
      const point = {
        id: generateIdFromUrl(item.url),
        vector: vector,
        payload: {
          url: item.url,
          title: item.title,
          lastVisitTime: item.lastVisitTime,
          visitCount: item.visitCount || 0,
          typedCount: item.typedCount || 0,
          embeddingText: embeddingText,
        },
      };

      points.push(point);
    } catch (error) {
      console.error(`Error processing item ${item.url}:`, error);
    }
  }

  // Upsert points to Qdrant (upsert will update if exists, insert if new)
  if (points.length > 0) {
    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points: points,
    });
  }

  return points.length;
}

// Search history items
export async function searchHistory(
  query: string,
  limit: number = 10,
  minScore: number = 0.3
): Promise<SearchResult[]> {
  try {
    // Generate embedding for the query
    const queryVector = await generateEmbedding(query);

    // Search Qdrant
    const searchResult = await qdrantClient.search(COLLECTION_NAME, {
      vector: queryVector,
      limit: limit,
      score_threshold: minScore,
      with_payload: true,
    });

    // Map results to SearchResult format
    const results: SearchResult[] = searchResult.map((result) => ({
      id: result.id.toString(),
      url: result.payload?.url as string,
      title: result.payload?.title as string,
      lastVisitTime: result.payload?.lastVisitTime as number,
      visitCount: result.payload?.visitCount as number,
      typedCount: result.payload?.typedCount as number,
      score: result.score,
    }));

    return results;
  } catch (error) {
    console.error('Error searching history:', error);
    throw error;
  }
}

// Get collection stats
export async function getStats() {
  try {
    const collectionInfo = await qdrantClient.getCollection(COLLECTION_NAME);
    return {
      totalItems: collectionInfo.points_count,
      vectorsCount: collectionInfo.vectors_count,
      status: collectionInfo.status,
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
}
