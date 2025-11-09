import { qdrantClient, COLLECTION_NAME } from '../config/qdrant';
import { generateEmbedding, createEmbeddingText } from './embeddings';
import { HistoryItem, SearchResult } from '../types';
import crypto from 'crypto';

// Generate a unique ID from URL and userId
function generateIdFromUrl(url: string, userId: string): string {
  return crypto.createHash('md5').update(`${userId}:${url}`).digest('hex');
}

// Create payload index for user_id (idempotent - safe to call multiple times)
async function ensureUserIdIndex() {
  try {
    await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'user_id',
      field_schema: 'keyword',
    });
    console.log('User ID payload index ensured');
  } catch (error: any) {
    // Index might already exist, ignore error
    if (!error.message?.includes('already exists')) {
      console.error('Error creating user_id index:', error);
    }
  }
}

// Upload history items to Qdrant
export async function uploadHistoryItems(items: HistoryItem[], userId: string): Promise<number> {
  // Ensure user_id index exists
  await ensureUserIdIndex();

  const points = [];

  for (const item of items) {
    try {
      // Create embedding text
      const embeddingText = createEmbeddingText(item.url, item.title);

      // Generate embedding
      const vector = await generateEmbedding(embeddingText);

      // Create point with user_id in payload
      const point = {
        id: generateIdFromUrl(item.url, userId),
        vector: vector,
        payload: {
          user_id: userId, // Add user_id to payload
          url: item.url,
          title: item.title,
          lastVisitTime: item.lastVisitTime,
          visitCount: item.visitCount || 0,
          typedCount: item.typedCount || 0,
          embeddingText: embeddingText,
          syncedAt: Date.now(), // Server-side timestamp for when item was synced
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

// Search history items (filtered by userId)
export async function searchHistory(
  query: string,
  userId: string,
  limit: number = 10,
  minScore: number = 0.3
): Promise<SearchResult[]> {
  try {
    // Generate embedding for the query
    const queryVector = await generateEmbedding(query);

    // Search Qdrant with user_id filter
    const searchResult = await qdrantClient.search(COLLECTION_NAME, {
      vector: queryVector,
      limit: limit,
      score_threshold: minScore,
      with_payload: true,
      filter: {
        must: [
          {
            key: 'user_id',
            match: { value: userId },
          },
        ],
      },
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

// Get last sync time for a user
export async function getLastSyncTime(userId: string): Promise<number> {
  try {
    // Scroll through user's items sorted by syncedAt descending
    const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: 'user_id',
            match: { value: userId },
          },
        ],
      },
      limit: 1,
      with_payload: true,
      with_vector: false,
      // Note: Qdrant doesn't have native sorting in scroll, so we'll get all and find max
    });

    if (scrollResult.points.length === 0) {
      return 0; // No sync history found
    }

    // For better performance, we'd need to maintain a separate "last_sync" metadata
    // For now, return the most recent syncedAt from the first result
    const syncedAt = scrollResult.points[0]?.payload?.syncedAt as number || 0;
    return syncedAt;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return 0; // Return 0 on error to trigger full sync
  }
}

// Get collection stats (filtered by userId)
export async function getStats(userId: string) {
  try {
    // Get user-specific count using scroll with filter
    const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: 'user_id',
            match: { value: userId },
          },
        ],
      },
      limit: 1, // We only need count, not actual results
      with_payload: false,
      with_vector: false,
    });

    // For accurate count, we'd need to paginate through all results
    // For now, get collection info and note it's total across all users
    const collectionInfo = await qdrantClient.getCollection(COLLECTION_NAME);

    return {
      totalItems: collectionInfo.points_count, // Total across all users
      status: collectionInfo.status,
      userId: userId,
      note: 'totalItems is collection-wide. For user-specific count, use search results.',
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
}
