import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(req: Request) {
  try {
    // Get the session
    const session = await auth0.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get access token from session
    const accessToken = session.tokenSet.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }

    return NextResponse.json({ accessToken });
  } catch (error: any) {
    console.error('Token error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get access token' },
      { status: error.status || 500 }
    );
  }
}
