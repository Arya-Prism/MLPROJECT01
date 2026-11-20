import { useState, type FormEvent } from 'react';
import { GraduationCap, Megaphone, X, ArrowRight, Check } from 'lucide-react';
import type { SessionUser, UserRole } from '../../shared/types';

interface RoleAuthModalProps {
  isOpen: boolean;
  currentUser: SessionUser | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onDemoSwitch: (role: UserRole) => Promise<void>;
  onCredentialLogin: (email: string, password: string) => Promise<void>;
}

export function RoleAuthModal({
  isOpen,
  currentUser,
  isLoading,
  error,
  onClose,
  onDemoSwitch,
  onCredentialLogin,
}: RoleAuthModalProps) {
  const [email, setEmail] = useState('student@campus.demo');
  const [password, setPassword] = useState('demo123');

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onCredentialLogin(email, password);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
    >
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 id="role-modal-title" className="font-display text-lg font-bold text-slate-900">
              Sign In or Switch Role
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Switch instantly between Student discovery and Organiser publishing.
            </p>
          </div>
          {currentUser && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close role dialog"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* 1-Click Demo Role Switchers */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-3">
              Instant 1-Click Demo Access
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => onDemoSwitch('student')}
                className={`text-left p-4 rounded-lg border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                  currentUser?.role === 'student'
                    ? 'border-indigo-600 bg-indigo-50/50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <GraduationCap className="w-5 h-5 text-indigo-700" />
                  {currentUser?.role === 'student' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700">
                      <Check className="w-3.5 h-3.5" /> Active
                    </span>
                  )}
                </div>
                <div className="font-display font-semibold text-slate-900 text-sm">
                  Demo Student Login
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Discover events, filter categories, RSVP in 1 tap, and get AI picks.
                </div>
                <div className="font-mono text-[11px] text-slate-400 mt-2.5">
                  student@campus.demo
                </div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => onDemoSwitch('organiser')}
                className={`text-left p-4 rounded-lg border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                  currentUser?.role === 'organiser'
                    ? 'border-indigo-600 bg-indigo-50/50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Megaphone className="w-5 h-5 text-indigo-700" />
                  {currentUser?.role === 'organiser' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700">
                      <Check className="w-3.5 h-3.5" /> Active
                    </span>
                  )}
                </div>
                <div className="font-display font-semibold text-slate-900 text-sm">
                  Demo Organiser Login
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Publish events in 60 seconds with AI quick-fill and track live sign-ups.
                </div>
                <div className="font-mono text-[11px] text-slate-400 mt-2.5">
                  organiser@campus.demo
                </div>
              </button>
            </div>
          </div>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="px-3 text-xs text-slate-400 bg-white">or sign in with demo credentials</span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Manual Demo Credential Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="auth-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Campus Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@campus.demo"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>
              <div>
                <label htmlFor="auth-password" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="demo123"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('student@campus.demo');
                    setPassword('demo123');
                  }}
                  className="text-indigo-700 hover:underline cursor-pointer"
                >
                  Fill Student
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('organiser@campus.demo');
                    setPassword('demo123');
                  }}
                  className="text-indigo-700 hover:underline cursor-pointer"
                >
                  Fill Organiser
                </button>
              </div>
              <span className="font-mono text-[11px] text-slate-400">Pass: demo123</span>
            </div>

            {error && (
              <div className="px-3.5 py-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign In with Credentials'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
