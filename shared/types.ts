export const EVENT_CATEGORIES = [
  'Hackathon',
  'Workshop',
  'Club Meetup',
  'Sports',
  'Cultural',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export type UserRole = 'student' | 'organiser';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

export interface AttendeeRecord {
  userId: string;
  name: string;
  email: string;
  registeredAt: string;
}

export interface CampusEventRecord {
  id: string;
  title: string;
  club: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24-hour)
  venue: string;
  capacity: number;
  category: EventCategory;
  description: string;
  createdBy: string;
  createdAt: string;
  attendees: AttendeeRecord[];
}

export interface CampusEventDTO {
  id: string;
  title: string;
  club: string;
  date: string;
  time: string;
  venue: string;
  capacity: number;
  category: EventCategory;
  description: string;
  createdBy: string;
  createdAt: string;
  registeredCount: number;
  spotsRemaining: number;
  isFull: boolean;
  isEnded: boolean;
  isToday: boolean;
  isThisWeek: boolean;
  isRegistered: boolean;
  attendees?: AttendeeRecord[];
}

export interface CreateEventInput {
  title: string;
  club: string;
  date: string;
  time: string;
  venue: string;
  capacity: number;
  category: EventCategory;
  description: string;
}

export interface AIEventDraft {
  title: string;
  category: EventCategory;
  description: string;
  suggestedClub: string;
  suggestedVenue: string;
  suggestedCapacity: number;
  suggestedTime: string;
  source: 'gemini' | 'local-fallback';
  notice?: string;
}

export interface AIRecommendationItem {
  eventId: string;
  reason: string;
}

export interface AIRecommendationResponse {
  recommendations: AIRecommendationItem[];
  source: 'gemini' | 'local-fallback';
  notice?: string;
}
