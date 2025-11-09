import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://45.32.221.76:3001';

export async function POST(req: NextRequest) {
  try {
    // Get the user's session
    const session = await auth0.getSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to search' },
        { status: 401 }
      );
    }

    // Get access token from session - check tokenSet first (Auth0 Next.js SDK stores it there)
    let accessToken = session.tokenSet?.accessToken || session.accessToken;

    if (!accessToken) {
      console.error('Search: Session exists but no access token found:', {
        hasTokenSet: !!session.tokenSet,
        sessionKeys: Object.keys(session)
      });
      return NextResponse.json(
        {
          error: 'No access token',
          message: 'Access token not found in session. Please log out and log in again after setting AUTH0_AUDIENCE.'
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { query, limit = 20, minScore = 0.3 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid query', message: 'Query parameter is required and must be a string' },
        { status: 400 }
      );
    }

    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/api/history/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query, limit, minScore }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: 'Backend error',
          message: errorData.message || `Backend returned ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Also support GET for simple queries
export async function GET(req: NextRequest) {
  try {
    const session = await auth0.getSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '20');
    const minScore = parseFloat(searchParams.get('minScore') || '0.3');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter required' },
        { status: 400 }
      );
    }

    const accessToken = session.tokenSet?.accessToken || session.accessToken;

    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json(
        { error: 'Access token not found in session' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/history/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query, limit, minScore }),
    });

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
