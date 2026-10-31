import 'fastify';

import type { AccessTokenClaims } from '../auth/access-token.js';

declare module 'fastify' {
  interface FastifyRequest {
    auth: AccessTokenClaims | null;
  }
}
