import { QdrantClient } from '@qdrant/qdrant-js';
import dotenv from 'dotenv';

dotenv.config();

async function directCheck() {
  const client = new QdrantClient({
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY!,
  });

  const collectionName = process.env.COLLECTION_NAME || 'browsing_history';

  try {
    console.log('Connecting to Qdrant...');
    console.log(`URL: ${process.env.QDRANT_URL}`);
    console.log(`Collection: ${collectionName}\n`);

    // Get collection info
    const info = await client.getCollection(collectionName);
    console.log(`Collection status: ${info.status}`);
    console.log(`Total points: ${info.points_count || 0}\n`);

    // Try to get some points
    if ((info.points_count || 0) > 0) {
      const points = await client.scroll(collectionName, {
        limit: 5,
        with_payload: true,
        with_vector: false,
      });

      console.log(`Retrieved ${points.points.length} points:\n`);
      points.points.forEach((point, i) => {
        console.log(`${i + 1}. ID: ${point.id}`);
        console.log(`   user_id: ${point.payload?.user_id}`);
        console.log(`   url: ${point.payload?.url}`);
        console.log(`   title: ${point.payload?.title}\n`);
      });
    } else {
      console.log('No points found in collection.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

directCheck();
