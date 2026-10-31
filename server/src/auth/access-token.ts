import { SignJWT, jwtVerify } from 'jose';

import { AppError } from '../lib/errors.js';

export interface AccessTokenClaims {
  userId: string;
  sessionId: string;
}

export interface AccessTokenService {
  issue(claims: AccessTokenClaims): Promise<string>;
  verify(token: string): Promise<AccessTokenClaims>;
}

export class JoseAccessTokenService implements AccessTokenService {
  private readonly key: Uint8Array;

  public constructor(
    secret: string,
    private readonly issuer: string,
    private readonly audience: string,
  ) {
    this.key = new TextEncoder().encode(secret);
    if (this.key.byteLength < 32) {
      throw new Error('ACCESS_TOKEN_SECRET must contain at least 32 UTF-8 bytes.');
    }
  }

  public async issue(claims: AccessTokenClaims): Promise<string> {
    return new SignJWT({ sid: claims.sessionId })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(claims.userId)
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(this.key);
  }

  public async verify(token: string): Promise<AccessTokenClaims> {
    try {
      const result = await jwtVerify(token, this.key, {
        algorithms: ['HS256'],
        issuer: this.issuer,
        audience: this.audience,
      });
      const sessionId = result.payload.sid;
      if (typeof result.payload.sub !== 'string' || typeof sessionId !== 'string') {
        throw new Error('Required token claims are missing.');
      }
      return { userId: result.payload.sub, sessionId };
    } catch {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    }
  }
}
