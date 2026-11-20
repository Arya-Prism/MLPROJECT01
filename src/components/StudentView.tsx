import { useMemo, useState } from 'react';
import { Calendar, Search, Sparkles, X, ArrowRight } from 'lucide-react';
import { EVENT_CATEGORIES, type CampusEventDTO, type EventCategory } from '../../shared/types';
import { formatEventDate, formatEventTime } from '../lib/formatters';
import { EventCard } from './EventCard';
import type { StudentTab } from './TopNav';

type CategoryFilter = 'All' | EventCategory;

interface StudentViewProps {
  activeTab: StudentTab;
  events: CampusEventDTO[];
  isLoading: boolean;
  busyEventId: string | null;
  onToggleRegister: (event: CampusEventDTO) => void;
  onInspectEvent: (event: CampusEventDTO) => void;
  onOpenPickForMe: () => void;
  onSwitchTab: (tab: StudentTab) => void;
}

export function StudentView({
  activeTab,
  events,
  isLoading,
  busyEventId,
  onToggleRegister,
  onInspectEvent,
  onOpenPickForMe,
  onSwitchTab,
}: StudentViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'today' | 'week'>('all');

  const todayEvents = useMemo(() => events.filter((e) => e.isToday), [events]);
  const thisWeekEvents = useMemo(() => events.filter((e) => e.isThisWeek), [events]);
  const registeredEvents = useMemo(() => events.filter((e) => e.isRegistered), [events]);

  const filteredEvents = useMemo(() => {
    const base = activeTab === 'registered' ? registeredEvents : events;
    const q = searchQuery.trim().toLowerCase();

    return base.filter((ev) => {
      if (activeTab === 'discover') {
        if (selectedCategory !== 'All' && ev.category !== selectedCategory) return false;
        if (timeframeFilter === 'today' && !ev.isToday) return false;
        if (timeframeFilter === 'week' && !ev.isThisWeek) return false;
      }

      if (!q) return true;
      const haystack = `${ev.title} ${ev.club} ${ev.venue} ${ev.category} ${ev.description}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [activeTab, events, registeredEvents, searchQuery, selectedCategory, timeframeFilter]);

  const nextTodayEvent = todayEvents[0];
  const nextWeekEvent = thisWeekEvents.find((e) => !e.isToday) ?? thisWeekEvents[0];

  if (activeTab === 'registered') {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              My Registered Events
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Every session you marked &ldquo;I&apos;m Going&rdquo; for, kept in sync with organiser counts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSwitchTab('discover')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:text-indigo-900 whitespace-nowrap cursor-pointer"
          >
            <span>Browse all events</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {registeredEvents.length === 0 ? (
          <div className="py-16 px-6 text-center bg-white border border-slate-200 rounded-xl">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h2 className="font-display text-lg font-semibold text-slate-900">
              No registered events yet
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
              Explore upcoming hackathons, workshops, and club sessions and tap &ldquo;I&apos;m Going&rdquo; to reserve your spot.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onSwitchTab('discover')}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors cursor-pointer"
              >
                Explore Campus Feed
              </button>
              <button
                type="button"
                onClick={onOpenPickForMe}
                className="px-4 py-2.5 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
              >
                Pick for Me
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {registeredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isBusy={busyEventId === event.id}
                canRegister
                onToggleRegister={onToggleRegister}
                onInspect={onInspectEvent}
              />
            ))}
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Hero + Quick Highlights */}
      <section className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
              Every campus event, one tap to join.
            </h1>
            <p className="text-base text-slate-600 mt-2.5 leading-relaxed">
              Hackathons, lab workshops, club meetups, sports, and cultural nights across campus—live seat counts, zero scattered links.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenPickForMe}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Pick for Me</span>
            </button>
          </div>
        </div>

        {/* Happening Today & This Week Highlight Banner Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTimeframeFilter((prev) => (prev === 'today' ? 'all' : 'today'))}
            className={`text-left p-5 rounded-xl border transition-colors cursor-pointer ${
              timeframeFilter === 'today'
                ? 'bg-indigo-50/70 border-indigo-600'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-display text-sm font-bold text-indigo-700">
                Happening Today
              </span>
              <span className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                {todayEvents.length}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-2 line-clamp-1">
              {nextTodayEvent
                ? `Next up: ${nextTodayEvent.title} · ${formatEventTime(nextTodayEvent.time)} at ${nextTodayEvent.venue}`
                : 'No live sessions scheduled for today — check This Week.'}
            </p>
            <div className="text-xs font-medium text-slate-500 mt-3">
              {timeframeFilter === 'today' ? 'Showing today only · Click to reset' : 'Filter feed to today'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTimeframeFilter((prev) => (prev === 'week' ? 'all' : 'week'))}
            className={`text-left p-5 rounded-xl border transition-colors cursor-pointer ${
              timeframeFilter === 'week'
                ? 'bg-indigo-50/70 border-indigo-600'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-display text-sm font-bold text-slate-900">
                This Week on Campus
              </span>
              <span className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                {thisWeekEvents.length}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-2 line-clamp-1">
              {nextWeekEvent
                ? `Featured: ${nextWeekEvent.title} · ${formatEventDate(nextWeekEvent.date)} (${nextWeekEvent.spotsRemaining} spots open)`
                : 'Upcoming events for the next 7 days appear here.'}
            </p>
            <div className="text-xs font-medium text-slate-500 mt-3">
              {timeframeFilter === 'week' ? 'Showing this week only · Click to reset' : 'Filter feed to next 7 days'}
            </div>
          </button>
        </div>
      </section>

      {/* Discovery Controls: Search + Category Filter Controls */}
      <section className="space-y-4 pt-2 border-t border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, club, venue, or keyword..."
              aria-label="Search campus events"
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="font-mono tabular-nums">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
            </span>
            <span aria-hidden="true">·</span>
            <span>Sorted: Upcoming first</span>
          </div>
        </div>

        {/* Interactive Category Filter Buttons */}
        <div
          role="group"
          aria-label="Filter events by category"
          className="flex items-center gap-1.5 overflow-x-auto pb-1"
        >
          {(['All', ...EVENT_CATEGORIES] as CategoryFilter[]).map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {category}
              </button>
            );
          })}
          {timeframeFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setTimeframeFilter('all')}
              className="ml-2 px-3 py-2 text-xs font-medium text-indigo-700 hover:text-indigo-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Clear date filter
            </button>
          )}
        </div>
      </section>

      {/* Event Grid */}
      <section>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse"
              >
                <div className="aspect-[16/10] bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-1/2 bg-slate-200 rounded" />
                  <div className="h-5 w-4/5 bg-slate-200 rounded" />
                  <div className="h-4 w-full bg-slate-100 rounded" />
                  <div className="h-9 w-full bg-slate-200 rounded-lg mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 px-6 text-center bg-white border border-slate-200 rounded-xl">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              No matching campus events
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Try clearing your search term or switching back to all categories.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setTimeframeFilter('all');
              }}
              className="mt-4 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isBusy={busyEventId === event.id}
                canRegister
                onToggleRegister={onToggleRegister}
                onInspect={onInspectEvent}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
