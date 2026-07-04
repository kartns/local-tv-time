import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-me'
);

const TOKEN_NAME = 'tvtime-token';

export interface JWTPayload {
  userId: number;
  username: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getAuthUserFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get(TOKEN_NAME)?.value;
  if (!token) return Promise.resolve(null);
  return verifyToken(token);
}

export function createAuthCookie(token: string): string {
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  return `${TOKEN_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearAuthCookie(): string {
  return `${TOKEN_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
