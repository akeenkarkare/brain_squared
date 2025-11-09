import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const auth0 = new Auth0Client({
  authorizationParameters: {
    // Only include audience if the API exists in Auth0 dashboard
    ...(process.env.AUTH0_AUDIENCE ? { audience: process.env.AUTH0_AUDIENCE } : {}),
    scope: process.env.AUTH0_SCOPE || 'openid profile email offline_access',
  },
});
