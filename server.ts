import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import {
  attachUser,
  authenticateDemoRole,
  authenticateWithCredentials,
  requireAuth,
  requireRole,
  revokeSession,
  type AuthenticatedRequest,
} from './server/auth.ts';
import { generateEventDraft, recommendEvents } from './server/gemini.ts';
import {
  createEvent,
  deleteEvent,
  listEvents,
  toggleEventRegistration,
  validateCreateEventInput,
} from './server/store.ts';
import type { UserRole } from './shared/types.ts';

// Load local env files if present without overriding platform-injected secrets
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer(): Promise<void> {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  // Baseline security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(attachUser);

  // --- Auth & Role Switching Routes ---

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const email = typeof req.body?.email === 'string' ? req.body.email : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email.trim() || !password) {
      res.status(400).json({ error: 'Please enter both email and password.' });
      return;
    }

    const session = authenticateWithCredentials(email, password);
    if (!session) {
      res.status(401).json({
        error: 'Invalid credentials. Try student@campus.demo or organiser@campus.demo with demo123.',
      });
      return;
    }

    res.json(session);
  });

  app.post('/api/auth/demo', (req: Request, res: Response) => {
    const role = req.body?.role;
    if (role !== 'student' && role !== 'organiser') {
      res.status(400).json({ error: 'Demo role must be either "student" or "organiser".' });
      return;
    }

    const session = authenticateDemoRole(role as UserRole);
    if (!session) {
      res.status(500).json({ error: 'Unable to initialize demo session.' });
      return;
    }

    res.json(session);
  });

  app.post('/api/auth/logout', (req: AuthenticatedRequest, res: Response) => {
    revokeSession(req.sessionToken);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: req.user ?? null });
  });

  // --- Events CRUD & Registration Routes ---

  app.get('/api/events', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const events = await listEvents(req.user);
      res.json({ events });
    } catch (err) {
      console.error('Failed to list events:', err);
      res.status(500).json({ error: 'Unable to load campus events right now.' });
    }
  });

  app.post('/api/events', requireRole('organiser'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validated = validateCreateEventInput(req.body);
      if (!validated.ok) {
        res.status(400).json({ error: validated.error });
        return;
      }

      const event = await createEvent(validated.data, req.user!);
      res.status(201).json({ event });
    } catch (err) {
      console.error('Failed to create event:', err);
      res.status(500).json({ error: 'Failed to publish event.' });
    }
  });

  app.delete('/api/events/:id', requireRole('organiser'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const eventId = String(req.params.id || '').trim();
      if (!eventId || eventId.length > 64) {
        res.status(400).json({ error: 'Invalid event ID.' });
        return;
      }

      const result = await deleteEvent(eventId, req.user!);
      if (!result.ok) {
        res.status(result.status).json({ error: result.error });
        return;
      }

      res.json({ ok: true });
    } catch (err) {
      console.error('Failed to delete event:', err);
      res.status(500).json({ error: 'Failed to remove event.' });
    }
  });

  app.post('/api/events/:id/register', requireRole('student'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const eventId = String(req.params.id || '').trim();
      if (!eventId || eventId.length > 64) {
        res.status(400).json({ error: 'Invalid event ID.' });
        return;
      }

      const result = await toggleEventRegistration(eventId, req.user!);
      if (!result.ok) {
        res.status(result.status).json({ error: result.error });
        return;
      }

      res.json({ event: result.event, action: result.action });
    } catch (err) {
      console.error('Failed to update registration:', err);
      res.status(500).json({ error: 'Failed to update your registration.' });
    }
  });

  // --- Server-Side AI Routes ---

  app.post(
    '/api/ai/generate-event',
    requireRole('organiser'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const idea = typeof req.body?.idea === 'string' ? req.body.idea.trim() : '';
        if (idea.length < 5 || idea.length > 300) {
          res.status(400).json({
            error: 'Please enter a short event idea between 5 and 300 characters.',
          });
          return;
        }

        const draft = await generateEventDraft(idea);
        res.json(draft);
      } catch (err) {
        console.error('AI generate-event error:', err);
        const message =
          err instanceof Error && err.message
            ? `AI generation failed: ${err.message}`
            : 'Unable to generate event details right now. Please try again.';
        res.status(502).json({ error: message });
      }
    }
  );

  app.post('/api/ai/recommend', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const rawInterests = req.body?.interests;
      if (!Array.isArray(rawInterests)) {
        res.status(400).json({ error: 'Please select 1 or 2 interests.' });
        return;
      }

      const interests = rawInterests
        .filter((item): item is string => typeof item === 'string')
        .map((s) => s.trim())
        .filter((s) => s.length >= 2 && s.length <= 50)
        .slice(0, 2);

      if (interests.length === 0) {
        res.status(400).json({ error: 'Select at least 1 interest to get recommendations.' });
        return;
      }

      const allEvents = await listEvents(req.user);
      const openUpcoming = allEvents.filter((e) => !e.isEnded && !e.isFull);

      if (openUpcoming.length === 0) {
        res.json({
          recommendations: [],
          source: 'local-fallback',
          notice: 'No upcoming events with open spots are currently available.',
        });
        return;
      }

      const result = await recommendEvents(interests, openUpcoming);
      res.json(result);
    } catch (err) {
      console.error('AI recommend error:', err);
      const message =
        err instanceof Error && err.message
          ? `AI recommendation failed: ${err.message}`
          : 'Unable to fetch AI recommendations right now. Please try again.';
      res.status(502).json({ error: message });
    }
  });

  // Catch-all 404 for unknown API paths
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // --- Frontend Vite Middleware (Dev) or Static Assets (Prod) ---
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusPulse server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
