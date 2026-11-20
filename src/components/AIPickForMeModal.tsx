import { useState } from 'react';
import { Check, Sparkles, X, Calendar, MapPin } from 'lucide-react';
import type { AIRecommendationItem, CampusEventDTO } from '../../shared/types';
import { api } from '../lib/api';
import { formatEventDate, formatEventTime } from '../lib/formatters';

const INTEREST_OPTIONS = [
  'AI & Coding',
  'Hardware & Robotics',
  'Design & Product',
  'Sports & Fitness',
  'Music & Arts',
  'Open Source & Clubs',
] as const;

interface AIPickForMeModalProps {
  isOpen: boolean;
  token: string | null;
  events: CampusEventDTO[];
  busyEventId: string | null;
  onClose: () => void;
  onToggleRegister: (event: CampusEventDTO) => void;
}

export function AIPickForMeModal({
  isOpen,
  token,
  events,
  busyEventId,
  onClose,
  onToggleRegister,
}: AIPickForMeModalProps) {
  const [selected, setSelected] = useState<string[]>(['AI & Coding']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [results, setResults] = useState<AIRecommendationItem[] | null>(null);

  if (!isOpen) return null;

  const toggleInterest = (label: string) => {
    setError(null);
    setSelected((prev) => {
      if (prev.includes(label)) {
        return prev.filter((item) => item !== label);
      }
      if (prev.length >= 2) {
        return [prev[1], label];
      }
      return [...prev, label];
    });
  };

  const handleRecommend = async () => {
    if (!token) {
      setError('Sign in to get personalized recommendations.');
      return;
    }
    if (selected.length === 0) {
      setError('Pick 1 or 2 interests first.');
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await api.recommendEvents(selected, token);
      setResults(response.recommendations);
      if (response.notice) {
        setNotice(response.notice);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate recommendations right now.');
    } finally {
      setLoading(false);
    }
  };

  const resolvedMatches = (results ?? [])
    .map((item) => ({
      ...item,
      event: events.find((e) => e.id === item.eventId),
    }))
    .filter((item): item is { eventId: string; reason: string; event: CampusEventDTO } => Boolean(item.event));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pick-for-me-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 id="pick-for-me-title" className="font-display text-lg font-bold text-slate-900">
              Pick for Me
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Choose 1–2 interests to get the top 2 matching upcoming campus events.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close recommendations"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Interest Selector */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-700">
                Select up to 2 interests
              </span>
              <span className="font-mono text-xs tabular-nums text-slate-400">
                {selected.length} / 2 selected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INTEREST_OPTIONS.map((interest) => {
                const active = selected.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-2.5 text-xs sm:text-sm font-medium rounded-lg border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-indigo-700 text-white border-indigo-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <button
                type="button"
                disabled={loading || selected.length === 0}
                onClick={handleRecommend}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Finding top matches...' : 'Find My Top 2 Events'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          {notice && (
            <div className="px-4 py-2.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg">
              {notice}
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-3" aria-busy="true">
              {[0, 1].map((idx) => (
                <div
                  key={idx}
                  className="p-4 border border-slate-200 rounded-lg animate-pulse space-y-2.5"
                >
                  <div className="h-3 w-36 bg-slate-200 rounded" />
                  <div className="h-5 w-2/3 bg-slate-200 rounded" />
                  <div className="h-4 w-full bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Recommendations Result */}
          {!loading && results !== null && (
            <div className="space-y-3">
              {resolvedMatches.length === 0 ? (
                <div className="p-6 text-center border border-slate-200 rounded-lg text-sm text-slate-500">
                  No open upcoming events match right now. Check back as clubs publish new sessions.
                </div>
              ) : (
                resolvedMatches.map(({ event, reason }, index) => {
                  const isBusy = busyEventId === event.id;
                  const disabled = event.isEnded || (!event.isRegistered && event.isFull) || isBusy;
                  return (
                    <div
                      key={event.id}
                      className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <span className="font-mono font-semibold text-indigo-700">
                              0{index + 1}.
                            </span>
                            <span>{event.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{event.club}</span>
                          </div>
                          <h3 className="font-display text-base font-bold text-slate-900 mt-1">
                            {event.title}
                          </h3>
                        </div>

                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onToggleRegister(event)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            event.isRegistered
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : disabled
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                : 'bg-indigo-700 text-white hover:bg-indigo-800'
                          }`}
                        >
                          {event.isRegistered ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>{isBusy ? 'Updating...' : "I'm Going"}</span>
                            </>
                          ) : (
                            <span>{isBusy ? 'Saving...' : "I'm Going"}</span>
                          )}
                        </button>
                      </div>

                      <p className="text-sm text-slate-700 leading-relaxed">{reason}</p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatEventDate(event.date)} · {formatEventTime(event.time)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {event.venue}
                        </span>
                        <span className="font-mono tabular-nums text-slate-600">
                          {event.spotsRemaining} spots left
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
