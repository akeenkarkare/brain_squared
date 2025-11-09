import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(req: Request) {
  try {
    // Get the session
    const session = await auth0.getSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get access token from session - check tokenSet first (Auth0 Next.js SDK stores it there)
    let accessToken = session.tokenSet?.accessToken || session.accessToken;

    if (!accessToken) {
      console.error('Session exists but no access token found:', {
        hasTokenSet: !!session.tokenSet,
        sessionKeys: Object.keys(session)
      });
      return NextResponse.json(
        {
          error: 'No access token available',
          message: 'The session exists but does not contain an access token. Make sure AUTH0_AUDIENCE is configured and you have logged in after setting it.'
        },
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
