import { NextRequest, NextResponse } from 'next/server';

// Types
interface HistoryItem {
  url: string;
  title: string;
  lastVisitTime: number;
  visitCount?: number;
  typedCount?: number;
}

interface UploadRequest {
  items: HistoryItem[];
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401,  headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }}
      );
    }

    // TODO: Verify the token with Auth0 or your auth system
    // For now, we'll accept any token for local development
    console.log('Auth token received:', token.substring(0, 20) + '...');

    // Parse request body
    const body: UploadRequest = await request.json();
    const { items } = body;

    // Validate request
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid request: items array required' },
        { status: 400, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }}
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No items to upload' },
        { status: 400, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }}
      );
    }

    console.log(`📥 Received ${items.length} history items for upload`);

    // Process the items
    const processedItems = items.map(item => ({
      url: item.url,
      title: item.title || 'Untitled',
      visitTime: new Date(item.lastVisitTime).toISOString(),
      visitCount: item.visitCount || 0,
      typedCount: item.typedCount || 0,
      timestamp: new Date().toISOString(),
    }));

    // TODO: Store in your database (Qdrant/Vector DB)
    // For now, we'll just log them
    console.log('✅ Sample items:', processedItems.slice(0, 3));

    /*
    FUTURE IMPLEMENTATION:
    =====================

    1. Generate embeddings for each item (title + url)
       const embeddings = await generateEmbeddings(processedItems);

    2. Store in Qdrant vector database
       await qdrantClient.upsert('browsing_history', {
         points: processedItems.map((item, index) => ({
           id: generateId(),
           vector: embeddings[index],
           payload: item
         }))
       });

    3. Store metadata in your database
       await db.history.createMany({ data: processedItems });
    */

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${items.length} history items`,
      itemsProcessed: items.length,
      timestamp: new Date().toISOString(),
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    console.error('❌ Error uploading history:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
