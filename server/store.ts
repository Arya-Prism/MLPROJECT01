import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  EVENT_CATEGORIES,
  type CampusEventDTO,
  type CampusEventRecord,
  type CreateEventInput,
  type EventCategory,
  type SessionUser,
} from '../shared/types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'events.json');

let writeQueue: Promise<void> = Promise.resolve();

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseEventDateTime(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
}

async function readEventsRaw(): Promise<CampusEventRecord[]> {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed: unknown = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as CampusEventRecord[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

async function writeEventsAtomic(events: CampusEventRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tempFile = path.resolve(DATA_DIR, `events.${crypto.randomBytes(6).toString('hex')}.tmp`);
  await fs.writeFile(tempFile, JSON.stringify(events, null, 2) + '\n', 'utf-8');
  await fs.rename(tempFile, DATA_FILE);
}

function enqueueMutation<T>(fn: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(fn, fn);
  writeQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

export function toEventDTO(
  record: CampusEventRecord,
  currentUser: SessionUser | undefined,
  now: Date = new Date()
): CampusEventDTO {
  const todayStr = formatLocalDate(now);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
  const eventDateStart = parseEventDateTime(record.date, '00:00');

  // Keep all same-day events discoverable under "Happening Today" throughout the day
  const isEnded = record.date < todayStr;

  const isToday = record.date === todayStr;
  const isThisWeek =
    !isEnded && eventDateStart.getTime() >= startOfToday.getTime() && eventDateStart.getTime() <= endOfWeek.getTime();

  const registeredCount = record.attendees.length;
  const spotsRemaining = Math.max(0, record.capacity - registeredCount);
  const isFull = registeredCount >= record.capacity;
  const isRegistered = Boolean(
    currentUser && record.attendees.some((a) => a.userId === currentUser.id)
  );

  const dto: CampusEventDTO = {
    id: record.id,
    title: record.title,
    club: record.club,
    date: record.date,
    time: record.time,
    venue: record.venue,
    capacity: record.capacity,
    category: record.category,
    description: record.description,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    registeredCount,
    spotsRemaining,
    isFull,
    isEnded,
    isToday,
    isThisWeek,
    isRegistered,
  };

  if (currentUser?.role === 'organiser') {
    dto.attendees = [...record.attendees].sort((a, b) =>
      b.registeredAt.localeCompare(a.registeredAt)
    );
  }

  return dto;
}

export async function listEvents(currentUser?: SessionUser): Promise<CampusEventDTO[]> {
  const records = await readEventsRaw();
  const now = new Date();
  const dtos = records.map((r) => toEventDTO(r, currentUser, now));

  // Default sort: upcoming events first (earliest first), followed by finished events (most recent first)
  dtos.sort((a, b) => {
    if (a.isEnded !== b.isEnded) {
      return a.isEnded ? 1 : -1;
    }
    const aKey = `${a.date}T${a.time}`;
    const bKey = `${b.date}T${b.time}`;
    return a.isEnded ? bKey.localeCompare(aKey) : aKey.localeCompare(bKey);
  });

  return dtos;
}

export function validateCreateEventInput(
  body: unknown
): { ok: true; data: CreateEventInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request body.' };
  }

  const raw = body as Record<string, unknown>;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const club = typeof raw.club === 'string' ? raw.club.trim() : '';
  const date = typeof raw.date === 'string' ? raw.date.trim() : '';
  const time = typeof raw.time === 'string' ? raw.time.trim() : '';
  const venue = typeof raw.venue === 'string' ? raw.venue.trim() : '';
  const description = typeof raw.description === 'string' ? raw.description.trim() : '';
  const category = typeof raw.category === 'string' ? raw.category.trim() : '';
  const capacityNum = Number(raw.capacity);

  if (title.length < 3 || title.length > 120) {
    return { ok: false, error: 'Event title must be between 3 and 120 characters.' };
  }
  if (club.length < 2 || club.length > 80) {
    return { ok: false, error: 'Club or department name must be between 2 and 80 characters.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: 'Date must be in YYYY-MM-DD format.' };
  }
  const [yr, mo, da] = date.split('-').map(Number);
  const parsedDate = new Date(yr, mo - 1, da);
  if (
    parsedDate.getFullYear() !== yr ||
    parsedDate.getMonth() !== mo - 1 ||
    parsedDate.getDate() !== da
  ) {
    return { ok: false, error: 'Please provide a valid calendar date.' };
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return { ok: false, error: 'Time must be in 24-hour HH:MM format.' };
  }
  if (venue.length < 2 || venue.length > 100) {
    return { ok: false, error: 'Venue must be between 2 and 100 characters.' };
  }
  if (!Number.isInteger(capacityNum) || capacityNum < 1 || capacityNum > 5000) {
    return { ok: false, error: 'Capacity must be a whole number between 1 and 5000.' };
  }
  if (!EVENT_CATEGORIES.includes(category as EventCategory)) {
    return {
      ok: false,
      error: `Category must be one of: ${EVENT_CATEGORIES.join(', ')}.`,
    };
  }
  if (description.length < 10 || description.length > 1000) {
    return { ok: false, error: 'Description must be between 10 and 1000 characters.' };
  }

  return {
    ok: true,
    data: {
      title,
      club,
      date,
      time,
      venue,
      capacity: capacityNum,
      category: category as EventCategory,
      description,
    },
  };
}

export async function createEvent(
  input: CreateEventInput,
  organiser: SessionUser
): Promise<CampusEventDTO> {
  return enqueueMutation(async () => {
    const records = await readEventsRaw();
    const newRecord: CampusEventRecord = {
      id: `evt-${crypto.randomBytes(5).toString('hex')}`,
      title: input.title,
      club: input.club,
      date: input.date,
      time: input.time,
      venue: input.venue,
      capacity: input.capacity,
      category: input.category,
      description: input.description,
      createdBy: organiser.id,
      createdAt: new Date().toISOString(),
      attendees: [],
    };
    records.unshift(newRecord);
    await writeEventsAtomic(records);
    return toEventDTO(newRecord, organiser);
  });
}

export async function deleteEvent(
  eventId: string,
  organiser: SessionUser
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  return enqueueMutation(async () => {
    const records = await readEventsRaw();
    const index = records.findIndex((r) => r.id === eventId);
    if (index === -1) {
      return { ok: false, status: 404, error: 'Event not found.' };
    }
    if (records[index].createdBy !== organiser.id) {
      return { ok: false, status: 403, error: 'You can only remove events created by your account.' };
    }
    records.splice(index, 1);
    await writeEventsAtomic(records);
    return { ok: true };
  });
}

export async function toggleEventRegistration(
  eventId: string,
  student: SessionUser
): Promise<
  { ok: true; event: CampusEventDTO; action: 'registered' | 'unregistered' } | { ok: false; status: number; error: string }
> {
  return enqueueMutation(async () => {
    const records = await readEventsRaw();
    const record = records.find((r) => r.id === eventId);
    if (!record) {
      return { ok: false, status: 404, error: 'Event not found.' };
    }

    const currentState = toEventDTO(record, student);
    if (currentState.isEnded) {
      return { ok: false, status: 400, error: 'Registration is closed because this event has already ended.' };
    }

    const existingIdx = record.attendees.findIndex((a) => a.userId === student.id);
    let action: 'registered' | 'unregistered';

    if (existingIdx !== -1) {
      record.attendees.splice(existingIdx, 1);
      action = 'unregistered';
    } else {
      if (record.attendees.length >= record.capacity) {
        return { ok: false, status: 409, error: 'This event has reached maximum capacity.' };
      }
      record.attendees.push({
        userId: student.id,
        name: student.name,
        email: student.email,
        registeredAt: new Date().toISOString(),
      });
      action = 'registered';
    }

    await writeEventsAtomic(records);
    return { ok: true, event: toEventDTO(record, student), action };
  });
}
