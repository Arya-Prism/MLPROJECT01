import type {
  AIEventDraft,
  AIRecommendationResponse,
  CampusEventDTO,
  CreateEventInput,
  SessionUser,
  UserRole,
} from '../../shared/types';

export interface AuthResponse {
  token: string;
  user: SessionUser;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data?.error === 'string'
        ? data.error
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const api = {
  login(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  demoLogin(role: UserRole): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/demo', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  },

  logout(token: string | null): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }, token);
  },

  getEvents(token: string | null): Promise<{ events: CampusEventDTO[] }> {
    return request<{ events: CampusEventDTO[] }>('/api/events', {}, token);
  },

  createEvent(input: CreateEventInput, token: string): Promise<{ event: CampusEventDTO }> {
    return request<{ event: CampusEventDTO }>(
      '/api/events',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      token
    );
  },

  deleteEvent(eventId: string, token: string): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(
      `/api/events/${encodeURIComponent(eventId)}`,
      { method: 'DELETE' },
      token
    );
  },

  toggleRegistration(
    eventId: string,
    token: string
  ): Promise<{ event: CampusEventDTO; action: 'registered' | 'unregistered' }> {
    return request<{ event: CampusEventDTO; action: 'registered' | 'unregistered' }>(
      `/api/events/${encodeURIComponent(eventId)}/register`,
      { method: 'POST' },
      token
    );
  },

  generateEventDraft(idea: string, token: string): Promise<AIEventDraft> {
    return request<AIEventDraft>(
      '/api/ai/generate-event',
      {
        method: 'POST',
        body: JSON.stringify({ idea }),
      },
      token
    );
  },

  recommendEvents(interests: string[], token: string): Promise<AIRecommendationResponse> {
    return request<AIRecommendationResponse>(
      '/api/ai/recommend',
      {
        method: 'POST',
        body: JSON.stringify({ interests }),
      },
      token
    );
  },
};
