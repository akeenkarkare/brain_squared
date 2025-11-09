import { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://45.32.221.76:3001';

export async function POST(req: NextRequest) {
  try {
    const session = await auth0.getSession();

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const accessToken = session.tokenSet?.accessToken || session.accessToken;

    if (!accessToken) {
      console.error('Stream: No access token found in session:', {
        hasTokenSet: !!session.tokenSet,
        sessionKeys: Object.keys(session)
      });
      return new Response(
        JSON.stringify({ error: 'Access token not found in session' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Stream: Sending request to backend:', BACKEND_URL);
    console.log('Stream: Token preview:', accessToken.substring(0, 50) + '...');

    const body = await req.json();

    // Forward streaming request to backend
    const response = await fetch(`${BACKEND_URL}/api/history/search/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorMessage = 'Backend request failed';
      const contentType = response.headers.get('content-type');

      try {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          // HTML error page or other content
          const text = await response.text();
          errorMessage = `Backend error (${response.status}). Make sure backend is running and configured correctly.`;
          console.error('Backend returned non-JSON response:', text.substring(0, 200));
        }
      } catch (parseError) {
        errorMessage = `Backend error (${response.status}): ${response.statusText}`;
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Return the streaming response
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Stream API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
