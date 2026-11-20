import { useMemo, useState, type FormEvent } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Sparkles,
  Trash2,
  Users,
  ArrowRight,
} from 'lucide-react';
import {
  EVENT_CATEGORIES,
  type CampusEventDTO,
  type CreateEventInput,
  type EventCategory,
  type SessionUser,
} from '../../shared/types';
import { api } from '../lib/api';
import {
  formatEventDate,
  formatEventTime,
  formatRelativeTimestamp,
  getDefaultUpcomingDate,
} from '../lib/formatters';
import type { OrganiserTab } from './TopNav';

interface OrganiserViewProps {
  activeTab: OrganiserTab;
  user: SessionUser;
  token: string;
  events: CampusEventDTO[];
  isLoading: boolean;
  onSelectTab: (tab: OrganiserTab) => void;
  onEventCreated: (event: CampusEventDTO) => void;
  onEventDeleted: (eventId: string) => void;
  onQuickSwitchToStudent: () => Promise<void>;
}

export function OrganiserView({
  activeTab,
  user,
  token,
  events,
  isLoading,
  onSelectTab,
  onEventCreated,
  onEventDeleted,
  onQuickSwitchToStudent,
}: OrganiserViewProps) {
  // Quick-Create Form State
  const [aiIdea, setAiIdea] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ type: 'info' | 'error'; text: string } | null>(
    null
  );

  const [title, setTitle] = useState('');
  const [club, setClub] = useState(user.department || 'Northgate CS Collective');
  const [date, setDate] = useState(getDefaultUpcomingDate(2));
  const [time, setTime] = useState('17:30');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState('50');
  const [category, setCategory] = useState<EventCategory>('Hackathon');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Dashboard Roster State
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const organiserEvents = useMemo(
    () => events.filter((e) => e.createdBy === user.id),
    [events, user.id]
  );

  const metrics = useMemo(() => {
    const totalEvents = organiserEvents.length;
    const totalRegistrations = organiserEvents.reduce((sum, e) => sum + e.registeredCount, 0);
    const totalCapacity = organiserEvents.reduce((sum, e) => sum + e.capacity, 0);
    const avgFill = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;
    const fullCount = organiserEvents.filter((e) => e.isFull && !e.isEnded).length;
    return { totalEvents, totalRegistrations, avgFill, fullCount };
  }, [organiserEvents]);

  const handleGenerateWithAI = async () => {
    const trimmed = aiIdea.trim();
    if (trimmed.length < 5) {
      setAiFeedback({
        type: 'error',
        text: 'Type a short 1-line idea first (e.g., "24-hour AI coding hackathon on Saturday at Main Auditorium").',
      });
      return;
    }

    setAiLoading(true);
    setAiFeedback(null);

    try {
      const draft = await api.generateEventDraft(trimmed, token);
      setTitle(draft.title);
      setCategory(draft.category);
      setDescription(draft.description);
      if (draft.suggestedClub) setClub(draft.suggestedClub);
      if (draft.suggestedVenue) setVenue(draft.suggestedVenue);
      if (draft.suggestedCapacity) setCapacity(String(draft.suggestedCapacity));
      if (draft.suggestedTime) setTime(draft.suggestedTime);

      setAiFeedback({
        type: 'info',
        text:
          draft.notice ||
          `Drafted "${draft.title}" as ${draft.category}. Review details and click Publish Event.`,
      });
    } catch (err) {
      setAiFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to generate event copy right now.',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const payload: CreateEventInput = {
      title: title.trim(),
      club: club.trim(),
      date,
      time,
      venue: venue.trim(),
      capacity: Number.parseInt(capacity, 10),
      category,
      description: description.trim(),
    };

    try {
      const { event } = await api.createEvent(payload, token);
      onEventCreated(event);
      setAiIdea('');
      setTitle('');
      setVenue('');
      setDescription('');
      setCapacity('50');
      setAiFeedback(null);
      setExpandedEventId(event.id);
      onSelectTab('dashboard');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to publish event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    setDeletingId(eventId);
    try {
      await api.deleteEvent(eventId, token);
      onEventDeleted(eventId);
      setConfirmDeleteId(null);
    } catch {
      // Keep UI clean; error toast handled or user can retry
    } finally {
      setDeletingId(null);
    }
  };

  if (activeTab === 'create') {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Publish a Campus Event
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Go live on the student discovery feed in under a minute.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>

        {/* AI Quick-Fill Panel */}
        <section className="p-5 sm:p-6 bg-indigo-50/60 border border-indigo-200/80 rounded-xl space-y-3">
          <div>
            <h2 className="font-display text-sm font-bold text-indigo-950">
              AI Quick-Fill
            </h2>
            <p className="text-xs sm:text-sm text-indigo-900/80 mt-0.5">
              Enter a 1-line idea and let Gemini draft the title, description, category, and venue automatically.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={aiIdea}
              onChange={(e) => setAiIdea(e.target.value)}
              placeholder='e.g. "24-hour AI coding hackathon on Saturday at Main Auditorium"'
              aria-label="One-line event idea for AI quick-fill"
              className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-indigo-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <button
              type="button"
              disabled={aiLoading}
              onClick={handleGenerateWithAI}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{aiLoading ? 'Generating...' : 'Generate with AI'}</span>
            </button>
          </div>

          {aiFeedback && (
            <p
              className={`text-xs ${
                aiFeedback.type === 'error' ? 'text-rose-700 font-medium' : 'text-indigo-900'
              }`}
            >
              {aiFeedback.text}
            </p>
          )}
        </section>

        {/* Event Form */}
        <form
          onSubmit={handleCreateSubmit}
          className="p-6 sm:p-8 bg-white border border-slate-200 rounded-xl space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label htmlFor="ev-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Event Title
              </label>
              <input
                id="ev-title"
                type="text"
                required
                minLength={3}
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Spring Civic AI Hackathon"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>

            <div>
              <label htmlFor="ev-club" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Club / Department
              </label>
              <input
                id="ev-club"
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={club}
                onChange={(e) => setClub(e.target.value)}
                placeholder="Northgate CS Collective"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>

            <div>
              <label htmlFor="ev-category" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <select
                id="ev-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              >
                {EVENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ev-date" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Date
              </label>
              <input
                id="ev-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>

            <div>
              <label htmlFor="ev-time" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Start Time
              </label>
              <input
                id="ev-time"
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>

            <div>
              <label htmlFor="ev-venue" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Venue
              </label>
              <input
                id="ev-venue"
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Main Auditorium, Hall A"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>

            <div>
              <label htmlFor="ev-capacity" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Capacity (Seats)
              </label>
              <input
                id="ev-capacity"
                type="number"
                required
                min={1}
                max={5000}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="ev-description" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Event Description
              </label>
              <textarea
                id="ev-description"
                required
                minLength={10}
                maxLength={1000}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share what students will build, learn, or experience—plus what to bring."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>
          </div>

          {formError && (
            <div className="px-4 py-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {formError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Publishing...' : 'Publish Event Live'}</span>
            </button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Organiser Workspace · {user.name}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Live Registration Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onQuickSwitchToStudent}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <span>Test as Student</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('create')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Published Events</div>
          <div className="font-mono text-2xl font-bold tabular-nums text-slate-900 mt-1.5">
            {metrics.totalEvents}
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Total Registrations</div>
          <div className="font-mono text-2xl font-bold tabular-nums text-slate-900 mt-1.5">
            {metrics.totalRegistrations}
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Average Fill Rate</div>
          <div className="font-mono text-2xl font-bold tabular-nums text-indigo-700 mt-1.5">
            {metrics.avgFill}%
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Upcoming Full Events</div>
          <div className="font-mono text-2xl font-bold tabular-nums text-slate-900 mt-1.5">
            {metrics.fullCount}
          </div>
        </div>
      </section>

      {/* Organiser Events Table / List */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <h2 className="font-display text-base font-bold text-slate-900">
            Your Campus Listings
          </h2>
          <span className="text-xs text-slate-500">
            Click any event to inspect registered students
          </span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4 animate-pulse">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-lg" />
            ))}
          </div>
        ) : organiserEvents.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <h3 className="font-display text-base font-semibold text-slate-900">
              No events published yet
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Use AI Quick-Fill to publish your club&apos;s first event in under a minute.
            </p>
            <button
              type="button"
              onClick={() => onSelectTab('create')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish First Event</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {organiserEvents.map((ev) => {
              const pct = Math.min(100, Math.round((ev.registeredCount / Math.max(1, ev.capacity)) * 100));
              const isExpanded = expandedEventId === ev.id;
              const attendees = ev.attendees ?? [];

              return (
                <div key={ev.id} className="transition-colors hover:bg-slate-50/70">
                  <div className="px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                        <span className="font-semibold text-indigo-700">{ev.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ev.club}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatEventDate(ev.date)} at {formatEventTime(ev.time)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{ev.venue}</span>
                      </div>

                      <div className="flex items-center gap-2.5 mt-1">
                        <h3 className="font-display text-base font-bold text-slate-900 truncate">
                          {ev.title}
                        </h3>
                        <span
                          className={`text-xs font-semibold whitespace-nowrap ${
                            ev.isEnded
                              ? 'text-slate-500'
                              : ev.isFull
                                ? 'text-rose-700'
                                : pct >= 80
                                  ? 'text-amber-700'
                                  : 'text-emerald-700'
                          }`}
                        >
                          {ev.isEnded ? 'Event Ended' : ev.isFull ? 'Full' : 'Live'}
                        </span>
                      </div>
                    </div>

                    {/* Capacity progress */}
                    <div className="w-full lg:w-56 shrink-0">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-mono tabular-nums font-semibold text-slate-800">
                          {ev.registeredCount} / {ev.capacity}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500">{pct}% filled</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            ev.isEnded
                              ? 'bg-slate-400'
                              : ev.isFull
                                ? 'bg-rose-600'
                                : pct >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-indigo-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Row Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span className="tabular-nums">Attendees ({ev.registeredCount})</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {confirmDeleteId === ev.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={deletingId === ev.id}
                            onClick={() => handleDelete(ev.id)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                          >
                            {deletingId === ev.id ? '...' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(ev.id)}
                          aria-label={`Delete ${ev.title}`}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Registered Students Roster */}
                  {isExpanded && (
                    <div className="px-6 pb-5 pt-2 bg-slate-50/90 border-t border-slate-100">
                      <div className="text-xs font-semibold text-slate-600 mb-2.5">
                        Registered Students ({attendees.length})
                      </div>
                      {attendees.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No student registrations yet. Switch to the Student view and tap &ldquo;I&apos;m Going&rdquo; to see live updates here.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {attendees.map((att) => (
                            <div
                              key={att.userId}
                              className="px-3 py-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="font-medium text-slate-900 truncate">{att.name}</div>
                                <div className="font-mono text-[11px] text-slate-400 truncate">
                                  {att.email}
                                </div>
                              </div>
                              <span className="font-mono text-[11px] tabular-nums text-slate-400 shrink-0">
                                {formatRelativeTimestamp(att.registeredAt)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
