import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { SessionUser, User } from '@/lib/types';

const encoder = new TextEncoder();

function secretKey() {
  return encoder.encode(process.env.APP_JWT_SECRET || 'dev-secret-change-me');
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function validatePassword(password: string) {
  return password.length >= 6 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

export function toSessionUser(user: User): SessionUser {
  return { id: user.id, username: user.username, role: user.role, admin: user.admin };
}

export async function issueSessionToken(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey());
  return payload as unknown as SessionUser;
}