import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { SessionUser, UserRole } from '../shared/types.ts';

interface StoredDemoAccount {
  user: SessionUser;
  salt: string;
  passwordHash: Buffer;
}

interface SessionEntry {
  user: SessionUser;
  expiresAt: number;
}

function hashPassword(password: string, salt: string): Buffer {
  return crypto.scryptSync(password, salt, 64);
}

function createDemoAccount(user: SessionUser, demoPasscode: string): StoredDemoAccount {
  const salt = crypto.randomBytes(16).toString('hex');
  return {
    user,
    salt,
    passwordHash: hashPassword(demoPasscode, salt),
  };
}

// Clearly fictional demo accounts specified for instant CampusPulse hackathon testing
const DEMO_ACCOUNTS: StoredDemoAccount[] = [
  createDemoAccount(
    {
      id: 'user-student-1',
      name: 'Alex Rivera (Demo Student)',
      email: 'student@campus.demo',
      role: 'student',
      department: 'Computer Science · Junior',
    },
    'demo123'
  ),
  createDemoAccount(
    {
      id: 'user-organiser-1',
      name: 'Jordan Lee (Demo Organiser)',
      email: 'organiser@campus.demo',
      role: 'organiser',
      department: 'Northgate CS Collective',
    },
    'demo123'
  ),
];

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const sessions = new Map<string, SessionEntry>();

export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
  sessionToken?: string;
}

function issueSession(user: SessionUser): { token: string; user: SessionUser } {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    user,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return { token, user };
}

export function authenticateWithCredentials(
  email: string,
  password: string
): { token: string; user: SessionUser } | null {
  const normalizedEmail = email.trim().toLowerCase();
  const account = DEMO_ACCOUNTS.find((a) => a.user.email.toLowerCase() === normalizedEmail);
  if (!account) {
    return null;
  }

  const candidateHash = hashPassword(password, account.salt);
  if (
    candidateHash.length !== account.passwordHash.length ||
    !crypto.timingSafeEqual(candidateHash, account.passwordHash)
  ) {
    return null;
  }

  return issueSession(account.user);
}

export function authenticateDemoRole(role: UserRole): { token: string; user: SessionUser } | null {
  const account = DEMO_ACCOUNTS.find((a) => a.user.role === role);
  if (!account) {
    return null;
  }
  return issueSession(account.user);
}

export function revokeSession(token: string | undefined): void {
  if (token) {
    sessions.delete(token);
  }
}

function extractBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') {
    return undefined;
  }
  const match = header.match(/^Bearer\s+([a-f0-9]{64})$/i);
  return match ? match[1] : undefined;
}

export function attachUser(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    next();
    return;
  }

  const entry = sessions.get(token);
  if (!entry) {
    next();
    return;
  }

  if (Date.now() > entry.expiresAt) {
    sessions.delete(token);
    next();
    return;
  }

  req.user = entry.user;
  req.sessionToken = token;
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please sign in or pick a demo role.' });
    return;
  }
  next();
}

export function requireRole(role: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({
        error: `This action requires the ${role} role. Switch roles to continue.`,
      });
      return;
    }
    next();
  };
}
