import { qdrantClient, COLLECTION_NAME } from '../config/qdrant.js';
import { generateEmbedding, createEmbeddingText } from './embeddings.js';
import crypto from 'crypto';
// Generate a unique ID from URL and userId
function generateIdFromUrl(url, userId) {
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
    }
    catch (error) {
        // Index might already exist, ignore error
        if (!error.message?.includes('already exists')) {
            console.error('Error creating user_id index:', error);
        }
    }
}
// Upload history items to Qdrant
export async function uploadHistoryItems(items, userId) {
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
                },
            };
            points.push(point);
        }
        catch (error) {
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
export async function searchHistory(query, userId, limit = 10, minScore = 0.3) {
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
        const results = searchResult.map((result) => ({
            id: result.id.toString(),
            url: result.payload?.url,
            title: result.payload?.title,
            lastVisitTime: result.payload?.lastVisitTime,
            visitCount: result.payload?.visitCount,
            typedCount: result.payload?.typedCount,
            score: result.score,
        }));
        return results;
    }
    catch (error) {
        console.error('Error searching history:', error);
        throw error;
    }
}
// Get collection stats (filtered by userId)
export async function getStats(userId) {
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
    }
    catch (error) {
        console.error('Error getting stats:', error);
        throw error;
    }
}
