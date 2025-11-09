import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://45.32.221.76:3001';

export async function GET(req: NextRequest) {
  try {
    const session = await auth0.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const accessToken = session.tokenSet?.accessToken || session.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found in session' },
        { status: 401 }
      );
    }

    // Get days parameter
    const { searchParams } = new URL(req.url);
    const days = searchParams.get('days') || '30';

    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/api/history/timeline?days=${days}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Backend request failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Timeline API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
