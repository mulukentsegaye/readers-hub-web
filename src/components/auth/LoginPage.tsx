import React, { useState } from 'react';
import { LireadLogo } from '../ui/LireadLogo';
import { 
  BookOpen, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Flame,
  Clock,
  ShieldCheck,
  Bookmark,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNoticeStore } from '../../stores/noticeStore';
import { supabase } from '../../lib/supabase';
import { describeAuthError } from '../../lib/authErrors';

interface LoginPageProps {
  onSuccess: () => void;
  onGoBack: () => void;
  onGuest?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onGoBack, onGuest }) => {
  const { 
    signIn, 
    signUp, 
    signInAsGuest, 
    pendingConfirmationEmail, 
    clearPendingConfirmation,
    resendConfirmationEmail
  } = useAuthStore();
  const { openInfoModal, showToast } = useNoticeStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleResendConfirmation = async (targetEmail: string) => {
    if (!targetEmail.trim()) {
      setErrorMsg('Please enter your email address so we can send the confirmation link.');
      return;
    }
    setIsResending(true);
    setErrorMsg(null);
    try {
      await resendConfirmationEmail(targetEmail.trim());
      setSuccessMsg(`Confirmation email sent to ${targetEmail}! Please check your inbox and spam folder.`);
      showToast({
        type: 'success',
        title: 'Confirmation Email Sent',
        message: `A fresh activation link was sent to ${targetEmail}.`,
      });
    } catch (err: any) {
      const msg = describeAuthError(err);
      setErrorMsg(msg);
      showToast({
        type: 'error',
        title: 'Unable to Send Email',
        message: msg,
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    if (mode === 'signup' && (!fullName || !username)) {
      setErrorMsg('Please provide your full name and a unique username.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUp(email, password, username, fullName);
        // Read the fresh value from the store (the closure value is stale here)
        if (useAuthStore.getState().pendingConfirmationEmail) {
          // Account created but email confirmation is required — stay on this page
          setSuccessMsg(null);
          showToast({
            type: 'info',
            title: 'Confirmation Link Dispatched',
            message: `Check your inbox at ${email} to activate your reader account.`,
            duration: 8000,
          });
          return;
        }
        setSuccessMsg('Account created successfully! Welcome to Liread.');
        showToast({
          type: 'success',
          title: 'Welcome to Liread',
          message: 'Your account was created successfully!',
        });
        setTimeout(() => onSuccess(), 800);
      } else {
        await signIn(email, password);
        setSuccessMsg('Signed in successfully! Opening your library...');
        showToast({
          type: 'success',
          title: 'Welcome Back',
          message: 'Opening your personal library...',
        });
        setTimeout(() => onSuccess(), 600);
      }
    } catch (err: any) {
      const msg = describeAuthError(err);
      setErrorMsg(msg);
      showToast({
        type: 'error',
        title: 'Authentication Notice',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    signInAsGuest();
    onGuest ? onGuest() : onSuccess();
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(resetEmail);
    } catch (_e) {
      // Fallback gracefully
    }
    setTimeout(() => {
      setLoading(false);
      setResetSent(true);
    }, 500);
  };

  return (
    <div 
      data-theme="light"
      className="min-h-screen w-full flex flex-col justify-between transition-colors duration-500 overflow-x-clip bg-vibe-bg"
      style={{
        backgroundColor: 'var(--vibe-bg)',
        color: 'var(--vibe-ink)',
      }}
    >
      {/* 1. Sleek Top Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onGoBack}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle transition-all border border-vibe-border shadow-xs active:scale-95"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onGoBack}
            className="flex items-center gap-2 sm:hidden cursor-pointer"
            title="Return to Landing"
          >
            <LireadLogo size="sm" />
            <span className="font-display text-lg font-bold tracking-tight text-vibe-ink">
              Liread
            </span>
          </button>
        </div>
      </header>

      {/* 2. Main Authentication Shell */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-white border border-vibe-border shadow-vibe-elevated overflow-hidden transition-all duration-500">
          
          {/* Left Column: Bookish Atmosphere Showcase (Desktop only: lg+) */}
          <div className="hidden lg:flex lg:col-span-5 p-8 xl:p-10 flex-col justify-between relative bg-[#F9FAFB] border-r border-vibe-border overflow-hidden">
            {/* Top Brand Block */}
            <div className="relative z-10 space-y-3">
              <button
                type="button"
                onClick={onGoBack}
                className="flex items-center gap-2.5 text-left cursor-pointer group"
                title="Return to Landing"
              >
                <LireadLogo size="md" className="group-hover:scale-105 transition-transform" />
                <span className="font-display text-2xl font-bold tracking-tight text-vibe-ink group-hover:text-vibe-accent transition-colors">
                  Liread
                </span>
              </button>
              <p className="text-xs text-vibe-ink-secondary leading-relaxed">
                Your dedicated space for active reading sessions, inspiring passages, and mindful habits.
              </p>
            </div>

            {/* Center Editorial Quote Card */}
            <div className="relative z-10 my-8 p-5 rounded-2xl bg-vibe-card/90 backdrop-blur-md border border-vibe-border shadow-soft space-y-3">
              <div className="flex items-center gap-2 text-vibe-accent text-xs font-semibold">
                <Bookmark className="w-3.5 h-3.5 fill-current" />
                <span className="font-mono text-[10px] uppercase tracking-wider font-bold">Passage of the Day</span>
              </div>
              <blockquote className="font-display italic font-normal text-sm sm:text-base text-vibe-ink leading-relaxed">
                "A reader lives a thousand lives before he dies. The man who never reads lives only one."
              </blockquote>
              <div className="flex items-center justify-between pt-2 border-t border-vibe-border-subtle text-[11px] text-vibe-ink-muted">
                <span>George R.R. Martin</span>
                <span className="font-mono">A Dance with Dragons</span>
              </div>
            </div>

            {/* Bottom Quick Feature Highlights */}
            <div className="relative z-10 space-y-2 text-xs text-vibe-ink-secondary">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center flex-shrink-0">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                </div>
                <span>Keep your daily streak alive with persistent web timers</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center flex-shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span>Track active minutes and celebrate consistency in the Sanctuary</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Clean, distraction-free environment for deep focus</span>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="col-span-1 lg:col-span-7 p-6 sm:p-10 xl:p-12 flex flex-col justify-center bg-white">
            
            {/* Header Titles */}
            <div className="mb-6 sm:mb-8 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-vibe-accent-subtle text-vibe-accent text-[11px] font-semibold mb-2 shadow-xs">
                <Sparkles className="w-3 h-3" />
                <span className="font-mono text-[10px] font-bold tracking-wider uppercase">Reader Account</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-vibe-ink tracking-tight">
                {mode === 'signin' ? 'Welcome Back, Reader' : 'Begin Your Reading Journey'}
              </h1>
              <p className="text-xs sm:text-sm text-vibe-ink-secondary mt-1">
                {mode === 'signin' 
                  ? 'Sign in to sync your active sessions, streak stats, and saved passages.' 
                  : 'Create your personalized library account in seconds.'}
              </p>
            </div>

            {/* Mode Switcher Tabs (Sign In / Sign Up) */}
            <div className="flex items-center p-1 rounded-full bg-[#F3F4F6] border border-vibe-border mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all text-center ${
                  mode === 'signin'
                    ? 'bg-white text-vibe-accent shadow-xs border border-vibe-border'
                    : 'text-vibe-ink-muted hover:text-vibe-ink'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all text-center ${
                  mode === 'signup'
                    ? 'bg-white text-vibe-accent shadow-xs border border-vibe-border'
                    : 'text-vibe-ink-muted hover:text-vibe-ink'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Alert Notifications */}
            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex flex-col gap-2.5 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed flex-1">{errorMsg}</span>
                </div>

                {mode === 'signup' && (errorMsg.includes('Sign In') || errorMsg.includes('already')) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMsg(null);
                    }}
                    className="self-start ml-6 px-3 py-1 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 font-semibold text-[11px] transition-colors"
                  >
                    Switch to Sign In →
                  </button>
                )}

                {/* When email is unconfirmed, offer resend */}
                {(errorMsg.toLowerCase().includes('not confirmed') || errorMsg.toLowerCase().includes('confirmation')) && (
                  <div className="ml-6 pt-2.5 border-t border-rose-500/20">
                    <button
                      type="button"
                      disabled={isResending || !email}
                      onClick={() => handleResendConfirmation(email)}
                      className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-vibe-accent text-white font-semibold text-xs hover:bg-vibe-accent-hover disabled:opacity-50 transition-colors shadow-xs"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending link...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5" />
                          <span>Resend confirmation email</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="leading-relaxed flex-1 font-medium">{successMsg}</span>
              </div>
            )}

            {/* Awaiting email confirmation */}
            {pendingConfirmationEmail && (
              <div className="mb-5 p-4 rounded-2xl bg-vibe-accent-subtle border border-vibe-accent/30 text-xs space-y-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 flex-shrink-0 mt-0.5 text-vibe-accent" />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-vibe-ink">Check your inbox to confirm your account</p>
                    <p className="leading-relaxed text-vibe-ink-secondary">
                      We sent a confirmation link to <strong className="text-vibe-ink">{pendingConfirmationEmail}</strong>.
                      Click it to activate your account, then sign in.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      clearPendingConfirmation();
                      setMode('signin');
                      setEmail(pendingConfirmationEmail);
                      setErrorMsg(null);
                    }}
                    className="flex-1 min-h-[38px] py-2 px-3 rounded-xl border border-vibe-border bg-vibe-card text-vibe-ink text-xs font-semibold hover:bg-vibe-card-subtle transition-colors text-center"
                  >
                    I have confirmed — go to sign in
                  </button>
                  <button
                    type="button"
                    disabled={isResending}
                    onClick={() => handleResendConfirmation(pendingConfirmationEmail)}
                    className="flex-1 min-h-[38px] py-2 px-3 rounded-xl bg-vibe-accent text-white text-xs font-semibold hover:bg-vibe-accent-hover transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {isResending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Resend email</span>
                  </button>
                </div>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {mode === 'signup' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-vibe-ink">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-vibe-ink-muted" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Doe"
                        required={mode === 'signup'}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-vibe-card-subtle border border-vibe-border text-xs sm:text-sm text-vibe-ink placeholder:text-vibe-ink-muted focus:outline-none focus:border-vibe-accent focus:ring-2 focus:ring-vibe-accent/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-vibe-ink">
                      Username
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-vibe-ink-muted">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="janedoe"
                        required={mode === 'signup'}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-vibe-card-subtle border border-vibe-border text-xs sm:text-sm text-vibe-ink placeholder:text-vibe-ink-muted focus:outline-none focus:border-vibe-accent focus:ring-2 focus:ring-vibe-accent/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-vibe-ink">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-vibe-ink-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="reader@liread.app"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-vibe-card-subtle border border-vibe-border text-xs sm:text-sm text-vibe-ink placeholder:text-vibe-ink-muted focus:outline-none focus:border-vibe-accent focus:ring-2 focus:ring-vibe-accent/20 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-vibe-ink">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email);
                        setForgotPasswordOpen(true);
                      }}
                      className="text-[11px] font-medium text-vibe-accent hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-vibe-ink-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-vibe-card-subtle border border-vibe-border text-xs sm:text-sm text-vibe-ink placeholder:text-vibe-ink-muted focus:outline-none focus:border-vibe-accent focus:ring-2 focus:ring-vibe-accent/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-vibe-ink-muted hover:text-vibe-ink transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              {mode === 'signin' && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-vibe-border text-vibe-accent accent-vibe-accent focus:ring-0"
                    />
                    <span className="text-xs text-vibe-ink-secondary">Remember my active device</span>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] py-3 px-6 rounded-full bg-vibe-accent hover:bg-vibe-accent-hover text-white text-xs sm:text-sm font-semibold shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In' : 'Complete Registration'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-vibe-border" />
                <span className="text-[11px] text-vibe-ink-muted">or</span>
                <div className="flex-1 h-px bg-vibe-border" />
              </div>

              {/* Guest Button */}
              <button
                type="button"
                onClick={handleGuest}
                className="w-full min-h-[44px] py-3 px-6 rounded-full bg-white hover:bg-vibe-card-subtle text-vibe-ink text-xs sm:text-sm font-semibold border border-vibe-border shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>Continue as Guest</span>
                <span className="text-[11px] font-normal text-vibe-ink-muted">(explore without account)</span>
              </button>
              <p className="text-center text-[11px] text-vibe-ink-muted">
                Guest mode is read-only — create an account to post, save, and track reading.
              </p>
            </form>

            {/* Footer Notice */}
            <p className="mt-6 text-center text-[11px] text-vibe-ink-muted leading-relaxed">
              By continuing, you agree to Liread's{' '}
              <a href="#terms" onClick={(e) => { e.preventDefault(); openInfoModal('terms'); }} className="text-vibe-accent underline hover:opacity-80 transition-opacity">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" onClick={(e) => { e.preventDefault(); openInfoModal('privacy'); }} className="text-vibe-accent underline hover:opacity-80 transition-opacity">
                Privacy Policy
              </a>.
            </p>

          </div>
        </div>
      </main>

      {/* 3. Sleek Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-vibe-ink-muted">
        <span>© 2026 Liread · Crafted for book lovers and quiet focus</span>
      </footer>

      {/* 4. Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={() => setForgotPasswordOpen(false)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-white border border-vibe-border shadow-2xl p-6 text-vibe-ink animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-vibe-ink mb-1">
              Reset Your Password
            </h3>
            <p className="text-xs text-vibe-ink-muted mb-4">
              Enter your email address to receive password reset instructions.
            </p>

            {resetSent ? (
              <div className="space-y-4 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs text-vibe-ink-secondary">
                  Password reset link sent to <strong>{resetEmail}</strong>. Please check your inbox.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordOpen(false);
                    setResetSent(false);
                  }}
                  className="w-full py-2.5 rounded-full bg-vibe-accent text-white text-xs font-semibold hover:bg-vibe-accent-hover transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-vibe-card-subtle border border-vibe-border text-xs text-vibe-ink placeholder:text-vibe-ink-muted focus:outline-none focus:border-vibe-accent"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(false)}
                    className="flex-1 py-2 rounded-full border border-vibe-border text-xs font-semibold text-vibe-ink-muted hover:text-vibe-ink transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 rounded-full bg-vibe-accent text-white text-xs font-semibold hover:bg-vibe-accent-hover transition-colors"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
