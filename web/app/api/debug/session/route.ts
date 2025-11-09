import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET() {
  try {
    const session = await auth0.getSession();

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: 'No session found'
      });
    }

    // Return session info (without sensitive data)
    return NextResponse.json({
      authenticated: true,
      user: {
        sub: session.user?.sub,
        email: session.user?.email,
        name: session.user?.name,
      },
      hasAccessToken: !!session.accessToken,
      hasTokenSet: !!session.tokenSet,
      tokenSetHasAccessToken: !!(session.tokenSet?.accessToken),
      sessionKeys: Object.keys(session),
      tokenSetKeys: session.tokenSet ? Object.keys(session.tokenSet) : [],
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
