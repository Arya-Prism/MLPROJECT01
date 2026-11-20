import type { EventCategory } from '../../shared/types';

export interface CategoryMediaMeta {
  imageSrc: string;
  imageAlt: string;
  fallbackGradient: string;
  accentText: string;
}

export const CATEGORY_MEDIA: Record<EventCategory, CategoryMediaMeta> = {
  Hackathon: {
    imageSrc: '/src/assets/images/event_hackathon_1795211577365.jpg',
    imageAlt: 'University students collaborating around laptops during a campus hackathon',
    fallbackGradient: 'from-indigo-900 via-slate-800 to-slate-900',
    accentText: 'text-indigo-700',
  },
  Workshop: {
    imageSrc: '/src/assets/images/event_workshop_1795211577969.jpg',
    imageAlt: 'Students building electronics and hardware prototypes in a university maker lab',
    fallbackGradient: 'from-slate-800 via-indigo-950 to-slate-900',
    accentText: 'text-slate-700',
  },
  'Club Meetup': {
    imageSrc: '/src/assets/images/event_meetup_1795211576703.jpg',
    imageAlt: 'Student club members discussing projects around a wooden table in campus commons',
    fallbackGradient: 'from-slate-700 via-slate-800 to-indigo-950',
    accentText: 'text-slate-700',
  },
  Sports: {
    imageSrc: '/src/assets/images/event_sports_1795211575922.jpg',
    imageAlt: 'University students competing in an evening intramural field match',
    fallbackGradient: 'from-emerald-950 via-slate-800 to-slate-900',
    accentText: 'text-emerald-700',
  },
  Cultural: {
    imageSrc: '/src/assets/images/event_cultural_1795211576345.jpg',
    imageAlt: 'Student musicians performing on an evening campus courtyard stage',
    fallbackGradient: 'from-amber-950 via-slate-800 to-slate-900',
    accentText: 'text-amber-700',
  },
};
