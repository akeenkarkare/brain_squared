import { qdrantClient, COLLECTION_NAME, initializeCollection } from '../src/config/qdrant';
import dotenv from 'dotenv';

dotenv.config();

async function clearQdrantCollection() {
  try {
    console.log(`Clearing all points from collection: ${COLLECTION_NAME}`);

    // Get current count before clearing
    const infoBefore = await qdrantClient.getCollection(COLLECTION_NAME);
    console.log(`Current points: ${infoBefore.points_count}`);

    // Delete all points by scrolling through and collecting IDs
    let allPointIds: (string | number)[] = [];
    let offset: any = undefined;

    // Paginate through all points to get their IDs
    while (true) {
      const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
        limit: 100,
        offset: offset,
        with_payload: false,
        with_vector: false,
      });

      if (scrollResult.points.length === 0) break;

      allPointIds = allPointIds.concat(scrollResult.points.map((point) => point.id));
      offset = scrollResult.next_page_offset;

      if (!offset) break;
    }

    console.log(`Found ${allPointIds.length} points to delete`);

    // Delete all points in batches of 100
    if (allPointIds.length > 0) {
      for (let i = 0; i < allPointIds.length; i += 100) {
        const batch = allPointIds.slice(i, i + 100);
        await qdrantClient.delete(COLLECTION_NAME, {
          points: batch,
        });
        console.log(`Deleted batch ${Math.floor(i / 100) + 1} (${batch.length} points)`);
      }
    }

    // Verify it's empty
    const infoAfter = await qdrantClient.getCollection(COLLECTION_NAME);
    console.log(`Collection now has ${infoAfter.points_count} points`);

    console.log('\n✅ Qdrant collection cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing collection:', error);
    process.exit(1);
  }
}

clearQdrantCollection();
