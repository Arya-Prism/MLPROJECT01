import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  EVENT_CATEGORIES,
  type AIEventDraft,
  type AIRecommendationResponse,
  type CampusEventDTO,
  type EventCategory,
} from '../shared/types.ts';

const GEMINI_MODEL = 'gemini-4-hydrogen';

function getConfiguredApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key === 'MY_GEMINI_API_KEY' || key === 'YOUR_GEMINI_API_KEY_HERE') {
    return null;
  }
  return key;
}

function createGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function inferCategoryFromText(text: string): EventCategory {
  const lower = text.toLowerCase();
  if (/(hack|code|coding|sprint|ai challenge|buildathon|ctf)/.test(lower)) return 'Hackathon';
  if (/(workshop|lab|bootcamp|hands-on|clinic|tutorial|arduino|robot|figma)/.test(lower)) return 'Workshop';
  if (/(sport|soccer|basketball|run|tennis|tournament|cup|fitness|match|yoga)/.test(lower)) return 'Sports';
  if (/(music|concert|art|film|dance|cultural|poetry|theatre|acoustic|festival|showcase)/.test(lower))
    return 'Cultural';
  return 'Club Meetup';
}

function buildLocalEventDraftFallback(idea: string): AIEventDraft {
  const cleaned = idea.trim();
  const category = inferCategoryFromText(cleaned);

  const venueMatch = cleaned.match(/\bat\s+([A-Za-z0-9\s-]{3,45})/i);
  const suggestedVenue = venueMatch ? venueMatch[1].trim() : 'Student Innovation Center';

  const defaultClubs: Record<EventCategory, string> = {
    Hackathon: 'Northgate CS Collective',
    Workshop: 'Apex Maker Lab',
    'Club Meetup': 'Campus Student Guild',
    Sports: 'Campus Athletics Council',
    Cultural: 'Prism Arts Guild',
  };

  const titleCore = cleaned.replace(/\.$/, '');
  const title =
    titleCore.length > 64
      ? `${titleCore.slice(0, 61).trim()}...`
      : titleCore.charAt(0).toUpperCase() + titleCore.slice(1);

  return {
    title,
    category,
    description: `Join fellow students for ${titleCore}. This ${category.toLowerCase()} brings together curious builders and learners for an interactive campus session with practical takeaways, peer collaboration, and light refreshments. Open to all skill levels—bring your campus ID and reserve a spot early.`,
    suggestedClub: defaultClubs[category],
    suggestedVenue,
    suggestedCapacity: category === 'Hackathon' ? 80 : category === 'Workshop' ? 35 : 50,
    suggestedTime: category === 'Hackathon' ? '09:00' : category === 'Cultural' ? '18:30' : '17:00',
    source: 'local-fallback',
    notice: 'Local fallback draft generated because GEMINI_API_KEY is not configured in .env.local.',
  };
}

function buildLocalRecommendFallback(
  interests: string[],
  events: CampusEventDTO[]
): AIRecommendationResponse {
  const tokens = interests
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);

  const scored = events.map((ev) => {
    const haystack = `${ev.title} ${ev.category} ${ev.club} ${ev.description} ${ev.venue}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) score += 3;
    }
    if (ev.isToday) score += 1;
    if (ev.isThisWeek) score += 1;
    return { ev, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const picks = scored.slice(0, 2);

  return {
    recommendations: picks.map(({ ev }) => ({
      eventId: ev.id,
      reason: `Strong fit for ${interests.join(' & ')}—hosted by ${ev.club} at ${ev.venue} with ${ev.spotsRemaining} spot${ev.spotsRemaining === 1 ? '' : 's'} still open.`,
    })),
    source: 'local-fallback',
    notice: 'Local fallback matching used because GEMINI_API_KEY is not configured in .env.local.',
  };
}

export async function generateEventDraft(idea: string): Promise<AIEventDraft> {
  const apiKey = getConfiguredApiKey();
  if (!apiKey) {
    return buildLocalEventDraftFallback(idea);
  }

  const ai = createGeminiClient(apiKey);
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `Turn this short university event idea into a crisp, ready-to-publish campus event listing.\n\nIdea: "${idea}"`,
    config: {
      systemInstruction:
        'You write concise, energetic, authentic university campus event listings. Never invent real personal contact details. Keep descriptions to 2-3 clear sentences (45-80 words). Choose the best matching category strictly from the allowed enum.',
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Catchy, concise campus event title under 75 characters.' },
          category: {
            type: Type.STRING,
            enum: [...EVENT_CATEGORIES],
            description: 'Exact matching event category.',
          },
          description: {
            type: Type.STRING,
            description: 'Engaging 2-3 sentence student-friendly event description.',
          },
          suggestedClub: {
            type: Type.STRING,
            description: 'Plausible fictional campus club or department name.',
          },
          suggestedVenue: {
            type: Type.STRING,
            description: 'Campus venue extracted from the idea or a plausible campus room/hall.',
          },
          suggestedCapacity: {
            type: Type.INTEGER,
            description: 'Reasonable integer capacity between 15 and 300.',
          },
          suggestedTime: {
            type: Type.STRING,
            description: '24-hour HH:MM start time (e.g. 09:00 or 17:30).',
          },
        },
        required: [
          'title',
          'category',
          'description',
          'suggestedClub',
          'suggestedVenue',
          'suggestedCapacity',
          'suggestedTime',
        ],
      },
    },
  });

  const text = (response.text ?? '').trim();
  const parsed = JSON.parse(text) as Omit<AIEventDraft, 'source'>;

  const validCategory = EVENT_CATEGORIES.includes(parsed.category)
    ? parsed.category
    : inferCategoryFromText(idea);

  const validTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(parsed.suggestedTime)
    ? parsed.suggestedTime
    : '17:00';

  const validCapacity =
    Number.isInteger(parsed.suggestedCapacity) && parsed.suggestedCapacity >= 5 && parsed.suggestedCapacity <= 2000
      ? parsed.suggestedCapacity
      : 50;

  return {
    title: parsed.title.trim().slice(0, 120),
    category: validCategory,
    description: parsed.description.trim().slice(0, 950),
    suggestedClub: parsed.suggestedClub.trim().slice(0, 80) || 'Campus Student Collective',
    suggestedVenue: parsed.suggestedVenue.trim().slice(0, 100) || 'Main Campus Hall',
    suggestedCapacity: validCapacity,
    suggestedTime: validTime,
    source: 'gemini',
  };
}

export async function recommendEvents(
  interests: string[],
  upcomingEvents: CampusEventDTO[]
): Promise<AIRecommendationResponse> {
  if (upcomingEvents.length === 0) {
    return { recommendations: [], source: 'local-fallback' };
  }

  const apiKey = getConfiguredApiKey();
  if (!apiKey) {
    return buildLocalRecommendFallback(interests, upcomingEvents);
  }

  const ai = createGeminiClient(apiKey);
  const compactCatalog = upcomingEvents.map((ev) => ({
    id: ev.id,
    title: ev.title,
    category: ev.category,
    club: ev.club,
    date: ev.date,
    time: ev.time,
    venue: ev.venue,
    spotsRemaining: ev.spotsRemaining,
    description: ev.description,
  }));

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `Student interests: ${interests.join(', ')}\n\nUpcoming open campus events:\n${JSON.stringify(compactCatalog, null, 2)}\n\nSelect the top ${Math.min(2, compactCatalog.length)} best matching events and give a crisp 1-sentence reason why each matches the student's interests.`,
    config: {
      systemInstruction:
        'You are a concise university campus event advisor. Only select eventIds that exist verbatim in the provided JSON list. Write one natural, specific sentence per recommendation explaining why it fits the student interests.',
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                eventId: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ['eventId', 'reason'],
            },
          },
        },
        required: ['recommendations'],
      },
    },
  });

  const text = (response.text ?? '').trim();
  const parsed = JSON.parse(text) as { recommendations: { eventId: string; reason: string }[] };
  const validIds = new Set(upcomingEvents.map((e) => e.id));
  const deduped = new Set<string>();
  const filtered = (parsed.recommendations || []).filter((item) => {
    if (!item || !validIds.has(item.eventId) || deduped.has(item.eventId)) {
      return false;
    }
    deduped.add(item.eventId);
    return true;
  });

  return {
    recommendations: filtered.slice(0, 2).map((r) => ({
      eventId: r.eventId,
      reason: r.reason.trim(),
    })),
    source: 'gemini',
  };
}
