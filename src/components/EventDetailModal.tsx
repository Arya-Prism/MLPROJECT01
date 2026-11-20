import { useState } from 'react';
import { Calendar, Check, Clock, MapPin, Users, X } from 'lucide-react';
import type { CampusEventDTO } from '../../shared/types';
import { CATEGORY_MEDIA } from '../lib/categoryMedia';
import { formatEventDate, formatEventTime } from '../lib/formatters';

interface EventDetailModalProps {
  event: CampusEventDTO | null;
  isBusy: boolean;
  canRegister: boolean;
  onClose: () => void;
  onToggleRegister: (event: CampusEventDTO) => void;
}

export function EventDetailModal({
  event,
  isBusy,
  canRegister,
  onClose,
  onToggleRegister,
}: EventDetailModalProps) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!event) return null;

  const media = CATEGORY_MEDIA[event.category];
  const isDisabled = event.isEnded || (!event.isRegistered && event.isFull) || isBusy;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-detail-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-56 sm:h-64 bg-slate-900 shrink-0">
          {!imgFailed ? (
            <img
              src={media.imageSrc}
              alt={media.imageAlt}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${media.fallbackGradient}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close event details"
            className="absolute top-4 right-4 p-2 rounded-lg bg-slate-950/65 text-white hover:bg-slate-950/85 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 text-white">
            <div className="flex items-center gap-2 text-xs text-slate-200 mb-1.5">
              <span className="font-semibold">{event.category}</span>
              <span aria-hidden="true">·</span>
              <span>{event.club}</span>
              {event.isEnded && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-300 font-medium">Event Ended</span>
                </>
              )}
              {!event.isEnded && event.isFull && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-rose-200 font-semibold">Full Capacity</span>
                </>
              )}
            </div>
            <h2 id="event-detail-title" className="font-display text-2xl font-bold leading-tight text-balance">
              {event.title}
            </h2>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-slate-200 text-sm">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Calendar className="w-3.5 h-3.5" /> Date & Time
              </div>
              <div className="font-mono tabular-nums font-medium text-slate-900">
                {formatEventDate(event.date)}
              </div>
              <div className="font-mono tabular-nums text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> {formatEventTime(event.time)}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <MapPin className="w-3.5 h-3.5" /> Venue
              </div>
              <div className="font-medium text-slate-900">{event.venue}</div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Users className="w-3.5 h-3.5" /> Capacity
              </div>
              <div className="font-mono tabular-nums font-medium text-slate-900">
                {event.registeredCount} / {event.capacity} spots filled
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {event.isEnded
                  ? 'Registration closed'
                  : event.isFull
                    ? 'No spots remaining'
                    : `${event.spotsRemaining} spot${event.spotsRemaining === 1 ? '' : 's'} remaining`}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-500 mb-2">About this event</h3>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{event.description}</p>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>

          {canRegister && (
            <button
              type="button"
              disabled={isDisabled}
              onClick={() => onToggleRegister(event)}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                event.isEnded
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : event.isRegistered
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : event.isFull
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-700 text-white hover:bg-indigo-800'
              }`}
            >
              {event.isEnded ? (
                <span>Event Ended</span>
              ) : event.isRegistered ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isBusy ? 'Updating...' : "You're Going · Tap to Cancel"}</span>
                </>
              ) : event.isFull ? (
                <span>Event Full</span>
              ) : (
                <span>{isBusy ? 'Saving...' : "I'm Going"}</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
