import { qdrantClient, COLLECTION_NAME } from '../src/config/qdrant';
import dotenv from 'dotenv';

dotenv.config();

async function inspectQdrantData() {
  try {
    console.log(`Inspecting collection: ${COLLECTION_NAME}\n`);

    // Get collection info
    const info = await qdrantClient.getCollection(COLLECTION_NAME);
    console.log(`Total points: ${info.points_count}`);
    console.log(`Status: ${info.status}\n`);

    // Scroll through some points to see the data
    const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
      limit: 5,
      with_payload: true,
      with_vector: false, // Don't need the vectors for inspection
    });

    console.log(`Showing first ${scrollResult.points.length} points:\n`);

    scrollResult.points.forEach((point, index) => {
      console.log(`${index + 1}. ID: ${point.id}`);
      console.log(`   User ID: ${point.payload?.user_id}`);
      console.log(`   URL: ${point.payload?.url}`);
      console.log(`   Title: ${point.payload?.title}`);
      console.log(`   Visit Count: ${point.payload?.visitCount}`);
      console.log('');
    });

    // Get unique user IDs
    const allPoints = await qdrantClient.scroll(COLLECTION_NAME, {
      limit: 1000,
      with_payload: true,
      with_vector: false,
    });

    const userIds = new Set<string>();
    allPoints.points.forEach((point) => {
      if (point.payload?.user_id) {
        userIds.add(point.payload.user_id as string);
      }
    });

    console.log(`\nUnique user IDs in collection: ${userIds.size}`);
    userIds.forEach((userId) => {
      console.log(`  - ${userId}`);
    });

    console.log('\n✅ Inspection complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error inspecting collection:', error);
    process.exit(1);
  }
}

inspectQdrantData();
