import { auth } from 'express-oauth2-jwt-bearer';
import dotenv from 'dotenv';

dotenv.config();

// Auth0 JWT verification middleware
export const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: 'RS256'
});
