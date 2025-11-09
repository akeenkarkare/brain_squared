import { NextResponse } from 'next/server';

export async function GET() {
  const returnTo = process.env.APP_BASE_URL || 'http://45.32.221.76:3000';

  // Build Auth0 logout URL that will clear the session and redirect back
  const logoutUrl = `https://${process.env.AUTH0_DOMAIN}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(returnTo)}`;

  // Create response that redirects to Auth0 logout
  const response = NextResponse.redirect(logoutUrl);

  // Delete the session cookie
  response.cookies.delete('appSession');

  return response;
}
