import { ArrowLeftRight } from 'lucide-react';
import type { SessionUser } from '../../shared/types';

export type StudentTab = 'discover' | 'registered';
export type OrganiserTab = 'dashboard' | 'create';

interface TopNavProps {
  user: SessionUser | null;
  studentTab: StudentTab;
  organiserTab: OrganiserTab;
  registeredCount: number;
  onSelectStudentTab: (tab: StudentTab) => void;
  onSelectOrganiserTab: (tab: OrganiserTab) => void;
  onOpenPickForMe: () => void;
  onOpenRoleModal: () => void;
}

export function TopNav({
  user,
  studentTab,
  organiserTab,
  registeredCount,
  onSelectStudentTab,
  onSelectOrganiserTab,
  onOpenPickForMe,
  onOpenRoleModal,
}: TopNavProps) {
  const isOrganiser = user?.role === 'organiser';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => (isOrganiser ? onSelectOrganiserTab('dashboard') : onSelectStudentTab('discover'))}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-sm"
        >
          Campus<span className="text-indigo-700">Pulse</span>
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-5 sm:gap-7 overflow-x-auto no-scrollbar"
        >
          {isOrganiser ? (
            <>
              <button
                type="button"
                onClick={() => onSelectOrganiserTab('dashboard')}
                className={`py-1.5 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                  organiserTab === 'dashboard'
                    ? 'border-indigo-700 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Live Dashboard
              </button>
              <button
                type="button"
                onClick={() => onSelectOrganiserTab('create')}
                className={`py-1.5 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                  organiserTab === 'create'
                    ? 'border-indigo-700 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Publish Event
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onSelectStudentTab('discover')}
                className={`py-1.5 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                  studentTab === 'discover'
                    ? 'border-indigo-700 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Discover
              </button>
              <button
                type="button"
                onClick={() => onSelectStudentTab('registered')}
                className={`py-1.5 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer tabular-nums ${
                  studentTab === 'registered'
                    ? 'border-indigo-700 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                My Events ({registeredCount})
              </button>
              <button
                type="button"
                onClick={onOpenPickForMe}
                className="py-1.5 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 border-transparent text-indigo-700 hover:text-indigo-900 transition-colors cursor-pointer"
              >
                Pick for Me
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Single Primary Role / Account Action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onOpenRoleModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-800 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
            <span>{user ? `${user.role === 'organiser' ? 'Organiser' : 'Student'} · Switch` : 'Sign In'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
