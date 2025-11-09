import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET() {
  try {
    const session = await auth0.getSession();

    if (!session) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const accessToken = session.tokenSet?.accessToken || session.accessToken;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 });
    }

    // Decode the JWT to see what's in it (don't do this in production!)
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    return NextResponse.json({
      tokenPreview: accessToken.substring(0, 50) + '...',
      payload: {
        iss: payload.iss,
        sub: payload.sub,
        aud: payload.aud,
        azp: payload.azp,
        exp: payload.exp,
        iat: payload.iat,
        scope: payload.scope,
      },
      hasAudience: !!payload.aud,
      audienceMatches: payload.aud === 'https://api.brainsquared.com' ||
                       (Array.isArray(payload.aud) && payload.aud.includes('https://api.brainsquared.com')),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
