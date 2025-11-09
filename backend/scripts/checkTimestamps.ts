import { qdrantClient, COLLECTION_NAME } from '../dist/config/qdrant.js';

async function checkTimestamps() {
  try {
    console.log('Checking timestamps in Qdrant...\n');

    // Get sample points to see timestamp distribution
    const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
      limit: 20,
      with_payload: true,
      with_vector: false,
    });

    if (scrollResult.points.length === 0) {
      console.log('No points found in collection');
      return;
    }

    console.log(`Found ${scrollResult.points.length} sample points:\n`);

    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    scrollResult.points.forEach((point, i) => {
      const lastVisitTime = point.payload?.lastVisitTime as number;
      const title = point.payload?.title as string;
      const url = point.payload?.url as string;
      const date = new Date(lastVisitTime);
      const daysAgo = Math.floor((now - lastVisitTime) / (24 * 60 * 60 * 1000));

      console.log(`${i + 1}. ${title?.substring(0, 60) || 'Untitled'}`);
      console.log(`   URL: ${url?.substring(0, 80)}`);
      console.log(`   Date: ${date.toLocaleString()}`);
      console.log(`   Days ago: ${daysAgo}`);
      console.log(`   Timestamp: ${lastVisitTime}`);

      if (lastVisitTime >= oneWeekAgo && lastVisitTime <= now) {
        console.log(`   ✅ WITHIN ONE WEEK RANGE`);
      }
      console.log('');
    });

    console.log(`\nCurrent time: ${new Date(now).toLocaleString()}`);
    console.log(`One week ago: ${new Date(oneWeekAgo).toLocaleString()}`);
    console.log(`Timestamp range: ${oneWeekAgo} - ${now}`);

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTimestamps();
