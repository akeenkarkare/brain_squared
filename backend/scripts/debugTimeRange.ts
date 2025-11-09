import { qdrantClient, COLLECTION_NAME } from '../src/config/qdrant.js';

async function debugTimeRange() {
  try {
    const userId = 'google-oauth2|105415093270845562813';
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    console.log('\n=== DEBUG TIME RANGE ===');
    console.log(`Current time: ${new Date(now).toLocaleString()}`);
    console.log(`One week ago: ${new Date(oneWeekAgo).toLocaleString()}`);
    console.log(`Time range: ${oneWeekAgo} - ${now}\n`);

    // Search for LeetCode specifically
    console.log('🔍 Searching for LeetCode pages...\n');

    const allScroll = await qdrantClient.scroll(COLLECTION_NAME, {
      limit: 100,
      with_payload: true,
      with_vector: false,
      filter: {
        must: [
          {
            key: 'user_id',
            match: { value: userId },
          },
        ],
      },
    });

    console.log(`Found ${allScroll.points.length} total items for user\n`);

    // Filter for LeetCode
    const leetcodeItems = allScroll.points.filter(point => {
      const url = point.payload?.url as string || '';
      const title = point.payload?.title as string || '';
      return url.toLowerCase().includes('leetcode') || title.toLowerCase().includes('leetcode');
    });

    console.log(`Found ${leetcodeItems.length} LeetCode items:\n`);

    leetcodeItems.forEach((point, i) => {
      const lastVisitTime = point.payload?.lastVisitTime as number;
      const title = point.payload?.title as string;
      const url = point.payload?.url as string;
      const date = new Date(lastVisitTime);
      const daysAgo = Math.floor((now - lastVisitTime) / (24 * 60 * 60 * 1000));
      const inRange = lastVisitTime >= oneWeekAgo && lastVisitTime <= now;

      console.log(`${i + 1}. ${title}`);
      console.log(`   URL: ${url}`);
      console.log(`   Date: ${date.toLocaleString()}`);
      console.log(`   Days ago: ${daysAgo}`);
      console.log(`   Timestamp: ${lastVisitTime}`);
      console.log(`   ${inRange ? '✅ IN RANGE' : '❌ OUTSIDE RANGE'}`);
      console.log('');
    });

    // Now check what's in the one week range
    console.log('\n=== Items in one week range ===\n');

    const rangeScroll = await qdrantClient.scroll(COLLECTION_NAME, {
      limit: 100,
      with_payload: true,
      with_vector: false,
      filter: {
        must: [
          {
            key: 'user_id',
            match: { value: userId },
          },
          {
            key: 'lastVisitTime',
            range: {
              gte: oneWeekAgo,
              lte: now,
            },
          },
        ],
      },
    });

    console.log(`Found ${rangeScroll.points.length} items in time range:\n`);

    rangeScroll.points.forEach((point, i) => {
      const lastVisitTime = point.payload?.lastVisitTime as number;
      const title = point.payload?.title as string;
      const url = point.payload?.url as string;
      const date = new Date(lastVisitTime);

      console.log(`${i + 1}. ${title?.substring(0, 80)}`);
      console.log(`   URL: ${url?.substring(0, 100)}`);
      console.log(`   Date: ${date.toLocaleString()}`);
      console.log(`   Timestamp: ${lastVisitTime}`);
      console.log('');
    });

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debugTimeRange();
