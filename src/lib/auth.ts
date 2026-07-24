import { cookies } from 'next/headers';
import crypto from 'crypto';

const ADMIN_COOKIE_NAME = 'ragforge_admin_session';
const CLIENT_COOKIE_NAME = 'ragforge_client_session';

/**
 * Checks if the request is from an authenticated admin session.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    return false;
  }

  const expectedToken = process.env.ADMIN_PASSWORD
    ? Buffer.from(`${process.env.ADMIN_EMAIL || 'admin'}:${process.env.ADMIN_PASSWORD}`).toString('base64')
    : 'default-admin-token';

  return sessionCookie.value === expectedToken;
}

export function getAdminToken(): string {
  const email = process.env.ADMIN_EMAIL || 'admin@ragforge.local';
  const password = process.env.ADMIN_PASSWORD || 'change-me-in-production';
  return Buffer.from(`${email}:${password}`).toString('base64');
}

/**
 * Client Portal Auth Session Helper
 */
export async function getClientSession(): Promise<{ clientId: string; slug: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(CLIENT_COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  try {
    const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    const [clientId, slug] = decoded.split(':');
    if (clientId && slug) {
      return { clientId, slug };
    }
  } catch {
    return null;
  }

  return null;
}

export function createClientToken(clientId: string, slug: string): string {
  return Buffer.from(`${clientId}:${slug}`).toString('base64');
}

/**
 * Password Hashing utilities using crypto SHA256 with salt
 */
export function hashClientPassword(password: string): string {
  const salt = 'ragforge-client-salt-2026';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

export function verifyClientPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  const hash = hashClientPassword(password);
  return hash === storedHash;
}

export { ADMIN_COOKIE_NAME, CLIENT_COOKIE_NAME };
