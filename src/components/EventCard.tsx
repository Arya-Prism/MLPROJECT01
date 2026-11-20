import { useState } from 'react';
import { Calendar, Check, Clock, MapPin } from 'lucide-react';
import type { CampusEventDTO } from '../../shared/types';
import { CATEGORY_MEDIA } from '../lib/categoryMedia';
import { formatEventDate, formatEventTime } from '../lib/formatters';

interface EventCardProps {
  event: CampusEventDTO;
  isBusy: boolean;
  canRegister: boolean;
  onToggleRegister: (event: CampusEventDTO) => void;
  onInspect: (event: CampusEventDTO) => void;
}

export function EventCard({
  event,
  isBusy,
  canRegister,
  onToggleRegister,
  onInspect,
}: EventCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const media = CATEGORY_MEDIA[event.category];
  const fillPercent = Math.min(100, Math.round((event.registeredCount / Math.max(1, event.capacity)) * 100));
  const isAlmostFull = !event.isEnded && !event.isFull && fillPercent >= 80;

  const isDisabled = event.isEnded || (!event.isRegistered && event.isFull) || isBusy;

  return (
    <article
      className={`group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden transition-colors duration-150 ${
        event.isEnded
          ? 'opacity-65 grayscale-[25%]'
          : 'hover:border-slate-300'
      }`}
    >
      {/* 4:3 Editorial Cover with Zero-Broken-Image Fallback */}
      <button
        type="button"
        onClick={() => onInspect(event)}
        className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600"
      >
        {!imgFailed ? (
          <img
            src={media.imageSrc}
            alt={media.imageAlt}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${media.fallbackGradient} flex flex-col justify-end p-4`}
          >
            <span className="text-xs font-medium text-white/75">{event.category}</span>
            <span className="font-display text-sm font-semibold text-white line-clamp-2 mt-0.5">
              {event.title}
            </span>
          </div>
        )}

        {/* Measured Scrim + Edge-Case Status Banner only when Ended or Full */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between gap-2 text-xs text-white">
          <span className="font-mono tabular-nums font-medium drop-shadow-sm">
            {formatEventDate(event.date)} · {formatEventTime(event.time)}
          </span>
          {event.isEnded ? (
            <span className="px-2 py-0.5 bg-slate-950/85 text-slate-200 font-medium rounded">
              Event Ended
            </span>
          ) : event.isFull ? (
            <span className="px-2 py-0.5 bg-rose-700/95 text-white font-medium rounded">
              Full
            </span>
          ) : event.isToday ? (
            <span className="px-2 py-0.5 bg-indigo-700/95 text-white font-medium rounded">
              Today
            </span>
          ) : null}
        </div>
      </button>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-5">
        {/* Clean Unboxed Metadata Line */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`font-semibold shrink-0 ${media.accentText}`}>{event.category}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{event.club}</span>
          </div>
          {isAlmostFull && (
            <span className="text-amber-700 font-medium whitespace-nowrap shrink-0">
              {event.spotsRemaining} left
            </span>
          )}
        </div>

        {/* Title */}
        <button
          type="button"
          onClick={() => onInspect(event)}
          className="text-left mt-2 cursor-pointer focus-visible:outline-none focus-visible:underline"
        >
          <h3 className="font-display text-base font-bold text-slate-900 leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2">
            {event.title}
          </h3>
        </button>

        {/* Description */}
        <p className="text-sm text-slate-600 leading-relaxed mt-2 line-clamp-2">
          {event.description}
        </p>

        {/* Logistics */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center gap-2 font-mono tabular-nums text-[12px] text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{formatEventDate(event.date)}</span>
            <span aria-hidden="true">·</span>
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{formatEventTime(event.time)}</span>
          </div>
        </div>

        {/* Capacity + 1-Tap Registration CTA */}
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-mono tabular-nums text-slate-700 font-medium">
              {event.registeredCount} / {event.capacity} spots filled
            </span>
            <span
              className={`font-medium ${
                event.isEnded
                  ? 'text-slate-500'
                  : event.isFull
                    ? 'text-rose-700'
                    : isAlmostFull
                      ? 'text-amber-700'
                      : 'text-emerald-700'
              }`}
            >
              {event.isEnded
                ? 'Closed'
                : event.isFull
                  ? 'Full'
                  : `${event.spotsRemaining} open`}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full transition-all duration-200 ${
                event.isEnded
                  ? 'bg-slate-400'
                  : event.isFull
                    ? 'bg-rose-600'
                    : isAlmostFull
                      ? 'bg-amber-500'
                      : 'bg-indigo-600'
              }`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>

          <div className="flex items-center gap-2">
            {canRegister ? (
              <button
                type="button"
                disabled={isDisabled}
                onClick={() => onToggleRegister(event)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                  event.isEnded
                    ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed'
                    : event.isRegistered
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100/80'
                      : event.isFull
                        ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed'
                        : 'bg-indigo-700 text-white hover:bg-indigo-800'
                }`}
              >
                {event.isEnded ? (
                  <span>Event Ended</span>
                ) : event.isRegistered ? (
                  <>
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{isBusy ? 'Updating...' : "I'm Going"}</span>
                  </>
                ) : event.isFull ? (
                  <span>Full</span>
                ) : (
                  <span>{isBusy ? 'Saving...' : "I'm Going"}</span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onInspect(event)}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
