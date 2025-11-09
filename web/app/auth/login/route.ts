import { auth0 } from '@/lib/auth0';
import { NextRequest } from 'next/server';

export const GET = async (req: NextRequest) => {
  return auth0.startInteractiveLogin({
    authorizationParameters: {
      audience: process.env.AUTH0_AUDIENCE || 'https://api.brainsquared.com',
      scope: process.env.AUTH0_SCOPE || 'openid profile email offline_access',
    },
  });
};
