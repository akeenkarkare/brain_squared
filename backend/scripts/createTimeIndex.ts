import { qdrantClient, COLLECTION_NAME } from '../src/config/qdrant.js';

async function createTimeIndex() {
  try {
    console.log('Creating index for lastVisitTime field...');

    // Delete the old integer index first
    try {
      await qdrantClient.deletePayloadIndex(COLLECTION_NAME, 'lastVisitTime');
      console.log('Deleted old integer index');
    } catch (e: any) {
      console.log('No existing index to delete (or error deleting):', e.message);
    }

    // Create new float index to handle Chrome's microsecond timestamps
    await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'lastVisitTime',
      field_schema: 'float',
    });

    console.log('✅ Index created successfully for lastVisitTime!');
    console.log('Time Machine queries should now work properly.');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating index:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createTimeIndex();
