import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const returnTo = process.env.APP_BASE_URL || 'http://45.32.221.76:3000';

  // Get all cookies to find and delete auth-related ones
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Build Auth0 logout URL
  const logoutUrl = `https://${process.env.AUTH0_DOMAIN}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(returnTo)}`;

  // Create response redirecting to Auth0 logout
  const response = NextResponse.redirect(logoutUrl);

  // Delete all auth-related cookies
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('appSession') || cookie.name.startsWith('auth0') || cookie.name === '__session') {
      response.cookies.set(cookie.name, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
    }
  }

  return response;
}
