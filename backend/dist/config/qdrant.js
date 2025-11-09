import { QdrantClient } from '@qdrant/qdrant-js';
import dotenv from 'dotenv';
dotenv.config();
const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'browsing_history';
// Initialize Qdrant client
export const qdrantClient = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
});
// Collection configuration
export const VECTOR_SIZE = 384; // For all-MiniLM-L6-v2 embeddings
export const DISTANCE = 'Cosine';
// Initialize collection if it doesn't exist
export async function initializeCollection() {
    try {
        // Check if collection exists
        const collections = await qdrantClient.getCollections();
        const collectionExists = collections.collections.some((col) => col.name === COLLECTION_NAME);
        if (!collectionExists) {
            console.log(`Creating collection: ${COLLECTION_NAME}`);
            await qdrantClient.createCollection(COLLECTION_NAME, {
                vectors: {
                    size: VECTOR_SIZE,
                    distance: DISTANCE,
                },
            });
            console.log(`Collection ${COLLECTION_NAME} created successfully`);
        }
        else {
            console.log(`Collection ${COLLECTION_NAME} already exists`);
        }
    }
    catch (error) {
        console.error('Error initializing collection:', error);
        throw error;
    }
}
export { COLLECTION_NAME };
