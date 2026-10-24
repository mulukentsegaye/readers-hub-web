import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Camera, 
  Trash2, 
  Edit3, 
  MapPin, 
  Users, 
  Flame, 
  BookOpen, 
  Clock, 
  Settings, 
  Sun, 
  Moon, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Sparkles,
  UserPlus,
  LogIn,
  Sliders
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNoticeStore, toast } from '../../stores/noticeStore';
import { useTheme } from '../../context/ThemeContext';
import { getUserAvatar, isCustomAvatar } from '../../utils/avatar';

interface ProfileViewProps {
  onBack?: () => void;
  onStartTimer?: (book: { title: string; author: string; coverImageUrl?: string }) => void;
  onAdjustGoal?: () => void;
  onOpenAuthModal?: (tab: 'signin' | 'signup') => void;
}

const AVAILABLE_GENRES = [
  'Philosophy',
  'Classic Lit',
  'Science Fiction',
  'Essays & Criticism',
  'Psychology',
  'Design & Aesthetics',
  'Poetry',
  'History',
  'Memoir',
  'Mindfulness'
];

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  onBack, 
  onStartTimer,
  onAdjustGoal,
  onOpenAuthModal 
}) => {
  const { 
    user, 
    isAuthenticated, 
    isGuest,
    signOut, 
    updateUser 
  } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();

  // Active view inside profile: 'profile' vs 'settings'
  const [accountView, setAccountView] = useState<'profile' | 'settings'>('profile');
  const [isInlineEditingBio, setIsInlineEditingBio] = useState(false);

  // Profile editable form states
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBookTitle, setEditBookTitle] = useState('');
  const [editBookAuthor, setEditBookAuthor] = useState('');
  const [editBookProgress, setEditBookProgress] = useState<number>(68);
  const [editDailyGoal, setEditDailyGoal] = useState<number>(60);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isSharingActivity, setIsSharingActivity] = useState(true);

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Initialize editable fields whenever user profile loads
  useEffect(() => {
    if (user) {
      setEditFullName(user.fullName || '');
      setEditUsername(user.username || '');
      setEditBio(user.bio || user.subtitle || 'Cultivating intentional reading habits. Exploring philosophy, essays, and classic literature.');
      setEditLocation(user.location || 'Home Reading Nook');
      setEditBookTitle(user.currentlyReadingBook || 'The Creative Act: A Way of Being');
      setEditBookAuthor(user.currentlyReadingAuthor || 'Rick Rubin');
      setEditBookProgress(user.currentlyReadingProgress ?? 68);
      setEditDailyGoal(user.dailyGoalMinutes || 60);
      setSelectedGenres(user.favoriteGenres && user.favoriteGenres.length > 0 
        ? user.favoriteGenres 
        : ['Philosophy', 'Classic Lit', 'Essays & Criticism']
      );
      setIsSharingActivity(user.isPrivate !== true);
    }
  }, [user]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Please select an image file (PNG, JPG, WebP).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Please choose an image under 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

        updateUser({ avatarUrl: optimizedDataUrl });
        setStatusMessage({ type: 'success', text: 'Profile photo updated successfully!' });
        toast.success('Your new profile avatar is live.', 'Photo Updated');
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    updateUser({ avatarUrl: '' });
    setStatusMessage({ type: 'info', text: 'Profile photo removed. Showing your personalized initial icon.' });
    toast.info('Reverted to dynamic personalized monogram avatar.', 'Avatar Reset');
  };

  const handleToggleGenre = (genre: string) => {
    const next = selectedGenres.includes(genre)
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];
    setSelectedGenres(next);
    updateUser({ favoriteGenres: next });
  };

  const handleSaveProfileChanges = async () => {
    if (!user) return;
    try {
      await updateUser({
        fullName: editFullName.trim() || user.fullName,
        username: editUsername.trim().replace(/^@/, '') || user.username,
        bio: editBio.trim(),
        subtitle: editBio.trim(),
        location: editLocation.trim(),
        currentlyReadingBook: editBookTitle.trim(),
        currentlyReadingAuthor: editBookAuthor.trim(),
        currentlyReadingProgress: editBookProgress,
        dailyGoalMinutes: editDailyGoal,
        favoriteGenres: selectedGenres,
        isPrivate: !isSharingActivity,
      });
      setIsInlineEditingBio(false);
      setStatusMessage({ type: 'success', text: 'Profile & reading preferences saved!' });
      toast.success('Your social reader profile is updated.', 'Profile Saved');
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to update profile.' });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      if (onBack) onBack();
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to sign out. Please try again.' });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Page Header with Back button and Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-vibe-border pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-vibe-card border border-vibe-border text-xs font-medium text-vibe-ink-secondary hover:text-vibe-ink hover:border-vibe-border transition-colors group shadow-soft cursor-pointer"
              aria-label="Back to feed"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>
          )}

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-vibe-accent/15 text-vibe-accent flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-heading text-lg sm:text-xl font-bold text-vibe-ink leading-tight truncate">
                {isGuest ? 'Guest Explorer' : 'Reader Profile & Settings'}
              </h1>
              <p className="text-[11px] text-vibe-ink-muted">
                {isGuest ? 'Browsing mode with local storage' : 'Manage your reading identity and preferences'}
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher: Profile vs Settings */}
        {isAuthenticated && !isGuest && (
          <div className="flex items-center gap-1 p-1 rounded-full bg-vibe-card border border-vibe-border text-xs shadow-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setAccountView('profile')}
              className={`px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                accountView === 'profile'
                  ? 'bg-vibe-accent text-white font-semibold shadow-xs'
                  : 'text-vibe-ink-muted hover:text-vibe-ink'
              }`}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => setAccountView('settings')}
              className={`px-4 py-1.5 rounded-full font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                accountView === 'settings'
                  ? 'bg-vibe-accent text-white font-semibold shadow-xs'
                  : 'text-vibe-ink-muted hover:text-vibe-ink'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>
        )}
      </div>

      {/* Status Message Banner */}
      {statusMessage && (
        <div 
          className={`p-3.5 rounded-2xl text-xs flex flex-col gap-2 border shadow-soft ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
              : statusMessage.type === 'error'
              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
              : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30'
          }`}
        >
          <div className="flex items-start gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <span className="leading-snug flex-1">{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* VIEW 1: AUTHENTICATED MEMBER SOCIAL PROFILE & SETTINGS */}
      {isAuthenticated && !isGuest && user && (
        <div className="space-y-6">
          
          {/* SUB-VIEW A: SOCIAL READER PROFILE */}
          {accountView === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Visual Profile Hero Banner Card */}
              <div className="rounded-3xl border border-vibe-border bg-vibe-card shadow-soft overflow-hidden">
                {/* Decorative Archival Header Pattern */}
                <div className="h-20 sm:h-24 w-full bg-vibe-card-subtle relative p-4 flex items-center justify-between border-b border-vibe-border">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-vibe-ink-muted font-medium">
                    ✦ {user.rankTier || 'Reader'} Member
                  </span>
                  <span className="text-[11px] font-mono text-vibe-ink-muted">
                    {user.joinedDate || 'Member since 2026'}
                  </span>
                </div>

                <div className="p-5 sm:p-7 -mt-10 space-y-5">
                  {/* Avatar, Identity and Photo actions */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="flex items-end gap-4">
                      <div className="relative group flex-shrink-0">
                        <img
                          src={getUserAvatar(user)}
                          alt={user.fullName}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-vibe-card flex-shrink-0 bg-vibe-card shadow-md"
                        />
                        <label
                          htmlFor="page-avatar-file-input"
                          className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity"
                          title="Upload profile photo"
                        >
                          <Camera className="w-5 h-5" />
                          <span className="text-[9px] font-semibold mt-0.5">Edit</span>
                        </label>
                        <input
                          id="page-avatar-file-input"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-lg sm:text-xl font-bold text-vibe-ink truncate">
                            {user.fullName}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-vibe-accent/10 text-vibe-accent border border-vibe-accent/20 flex-shrink-0">
                            {user.rankTier || 'Novice'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-vibe-ink-muted truncate mt-0.5">
                          @{user.username}
                        </p>
                        {user.location && (
                          <p className="text-xs text-vibe-ink-secondary flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-vibe-ink-muted" />
                            <span>{user.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick edit photo buttons */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <label
                        htmlFor="page-avatar-file-input"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-vibe-card border border-vibe-border hover:bg-vibe-card-subtle text-vibe-ink transition-colors cursor-pointer shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5 text-vibe-accent" />
                        <span>{isCustomAvatar(user.avatarUrl) ? 'Change Photo' : 'Upload Photo'}</span>
                      </label>

                      {isCustomAvatar(user.avatarUrl) && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="p-1.5 rounded-full border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Remove custom photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bio Section */}
                  <div className="pt-3 border-t border-vibe-border/60 space-y-2">
                    <div className="flex items-center justify-between text-xs font-heading font-semibold text-vibe-ink">
                      <span>Reader Bio</span>
                      <button
                        type="button"
                        onClick={() => setIsInlineEditingBio(!isInlineEditingBio)}
                        className="text-xs font-sans font-medium text-vibe-accent hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isInlineEditingBio ? 'Cancel' : 'Edit Bio'}</span>
                      </button>
                    </div>

                    {isInlineEditingBio ? (
                      <div className="space-y-2">
                        <textarea
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value.slice(0, 240))}
                          rows={3}
                          className="w-full text-xs sm:text-sm p-3 rounded-xl bg-vibe-card border border-vibe-border text-vibe-ink focus:ring-1 focus:ring-vibe-accent focus:outline-hidden resize-none leading-relaxed"
                          placeholder="Write a few lines about what you love to read, favorite authors, or your reading routine..."
                        />
                        <div className="flex items-center justify-between text-xs text-vibe-ink-muted">
                          <span>{editBio.length} / 240 characters</span>
                          <button
                            type="button"
                            onClick={handleSaveProfileChanges}
                            className="px-4 py-1.5 rounded-full bg-vibe-accent text-white font-semibold text-xs hover:bg-vibe-accent-hover transition-colors shadow-xs cursor-pointer"
                          >
                            Save Bio
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-vibe-ink-secondary leading-relaxed font-sans italic">
                        “{user.bio || user.subtitle || 'Cultivating daily reading rituals. Exploring philosophy, essays, and timeless classics.'}”
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Followers & Habit Progress Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-vibe-card border border-vibe-border shadow-soft text-center flex flex-col justify-between">
                  <div className="flex items-center justify-center gap-1.5 text-vibe-accent mb-2">
                    <Users className="w-4 h-4" />
                    <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Followers</span>
                  </div>
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-vibe-ink">
                    {user.followersCount ?? 128}
                  </span>
                  <span className="block text-xs text-vibe-ink-muted mt-1">readers</span>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-vibe-card border border-vibe-border shadow-soft text-center flex flex-col justify-between">
                  <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-2">
                    <Flame className="w-4 h-4 fill-current" />
                    <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Streak</span>
                  </div>
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-vibe-ink">
                    {user.currentStreak ?? 0}
                  </span>
                  <span className="block text-xs text-vibe-ink-muted mt-1">days</span>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-vibe-card border border-vibe-border shadow-soft text-center flex flex-col justify-between">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-2">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Shelf</span>
                  </div>
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-vibe-ink">
                    {user.bookshelfCount ?? 0}
                  </span>
                  <span className="block text-xs text-vibe-ink-muted mt-1">books</span>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-vibe-card border border-vibe-border shadow-soft text-center flex flex-col justify-between">
                  <div className="flex items-center justify-center gap-1.5 text-sky-500 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Time</span>
                  </div>
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-vibe-ink">
                    {user.totalMinutesRead ?? 0}
                  </span>
                  <span className="block text-xs text-vibe-ink-muted mt-1">mins</span>
                </div>
              </div>

              {/* Currently Reading Book Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-vibe-card border border-vibe-border shadow-soft space-y-3">
                <div className="flex items-center justify-between text-xs font-heading font-semibold text-vibe-ink">
                  <div className="flex items-center gap-2 text-vibe-accent">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm font-bold">Currently Reading</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-vibe-accent">
                    {editBookProgress}% Complete
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs sm:text-sm">
                  <div className="min-w-0 pr-2">
                    <h4 className="font-bold text-base text-vibe-ink truncate">{editBookTitle}</h4>
                    <p className="text-xs text-vibe-ink-muted truncate mt-0.5">{editBookAuthor}</p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {onStartTimer && (
                      <button
                        type="button"
                        onClick={() => onStartTimer({ title: editBookTitle, author: editBookAuthor })}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-vibe-accent/10 text-vibe-accent hover:bg-vibe-accent/20 transition-colors"
                      >
                        Read Now
                      </button>
                    )}
                    <span className="text-xs font-mono text-vibe-ink-muted">
                      Goal: {user.dailyGoalMinutes || 60}m / day
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-vibe-card-subtle border border-vibe-border overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-vibe-accent rounded-full transition-all duration-500"
                    style={{ width: `${editBookProgress}%` }}
                  />
                </div>
              </div>

              {/* Favorite Genres & Reading Taste Chips */}
              <div className="p-5 sm:p-6 rounded-2xl bg-vibe-card border border-vibe-border shadow-soft space-y-3">
                <div className="flex items-center justify-between text-xs font-heading font-semibold text-vibe-ink">
                  <span className="text-sm font-bold">Favorite Genres & Curations</span>
                  <span className="text-xs font-mono text-vibe-ink-muted">Tap to toggle</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {AVAILABLE_GENRES.map((genre) => {
                    const isSelected = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => handleToggleGenre(genre)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-vibe-accent text-white shadow-xs font-semibold'
                            : 'bg-vibe-card-subtle text-vibe-ink-secondary border border-vibe-border hover:bg-vibe-card hover:text-vibe-ink'
                        }`}
                      >
                        <span>{genre}</span>
                        {isSelected && <span className="ml-1 text-[10px]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* SUB-VIEW B: SETTINGS, HABIT GOALS & PREFERENCES */}
          {accountView === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Daily Reading Goal Preference */}
              <div className="p-5 sm:p-6 rounded-2xl bg-vibe-card border border-vibe-border shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-vibe-accent" />
                    <h4 className="font-heading font-bold text-sm sm:text-base text-vibe-ink">
                      Daily Reading Target
                    </h4>
                  </div>
                  <span className="font-mono text-xs font-bold text-vibe-accent">
                    {editDailyGoal} min / day
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[15, 25, 30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setEditDailyGoal(mins);
                        updateUser({ dailyGoalMinutes: mins });
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                        editDailyGoal === mins
                          ? 'bg-vibe-accent text-white font-bold shadow-xs'
                          : 'bg-vibe-card-subtle border border-vibe-border text-vibe-ink hover:border-vibe-accent'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile Metadata Inputs */}
              <div className="space-y-4 p-5 sm:p-6 rounded-2xl bg-vibe-card border border-vibe-border shadow-soft">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-vibe-ink">
                  Public Identity Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-vibe-ink-muted">Display Name</label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-vibe-card-subtle border border-vibe-border text-vibe-ink focus:ring-1 focus:ring-vibe-accent focus:outline-hidden"
                      placeholder="Your Full Name"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-vibe-ink-muted">Username Handle</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-vibe-card-subtle border border-vibe-border text-vibe-ink focus:ring-1 focus:ring-vibe-accent focus:outline-hidden"
                      placeholder="@username"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-vibe-ink-muted">Reading Nook / Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-vibe-card-subtle border border-vibe-border text-vibe-ink focus:ring-1 focus:ring-vibe-accent focus:outline-hidden"
                    placeholder="e.g. Quiet Home Library, Kyoto"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-vibe-ink-muted">Currently Reading Title</label>
                    <input
                      type="text"
                      value={editBookTitle}
                      onChange={(e) => setEditBookTitle(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-vibe-card-subtle border border-vibe-border text-vibe-ink focus:ring-1 focus:ring-vibe-accent focus:outline-hidden"
                      placeholder="Book Title"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-vibe-ink-muted">Author</label>
                    <input
                      type="text"
                      value={editBookAuthor}
                      onChange={(e) => setEditBookAuthor(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-vibe-card-subtle border border-vibe-border text-vibe-ink focus:ring-1 focus:ring-vibe-accent focus:outline-hidden"
                      placeholder="Author Name"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveProfileChanges}
                  className="w-full py-2.5 rounded-xl bg-vibe-accent text-white font-semibold text-xs hover:bg-vibe-accent-hover transition-colors shadow-xs cursor-pointer"
                >
                  Save Profile Updates
                </button>
              </div>

              {/* Social Privacy Toggles & Theme */}
              <div className="p-5 sm:p-6 rounded-2xl bg-vibe-card border border-vibe-border shadow-soft space-y-4">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-vibe-ink">
                  Preferences & Privacy
                </h4>

                {/* Quick Theme Switcher */}
                <div className="flex items-center justify-between pt-1">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-vibe-ink">Appearance Mode</p>
                    <p className="text-[11px] text-vibe-ink-muted">Switch between light and dark sanctuary</p>
                  </div>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-vibe-border bg-vibe-card-subtle text-xs font-medium text-vibe-ink hover:border-vibe-accent transition-colors cursor-pointer"
                  >
                    {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
                    <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                  </button>
                </div>

                {/* Social Activity Toggle */}
                <div className="flex items-center justify-between pt-3 border-t border-vibe-border/60">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-vibe-ink">Share Reading in Community</p>
                    <p className="text-[11px] text-vibe-ink-muted">Display your completed goals in Consistent Readers Circle</p>
                  </div>

                  <input
                    type="checkbox"
                    checked={isSharingActivity}
                    onChange={(e) => {
                      setIsSharingActivity(e.target.checked);
                      updateUser({ isPrivate: !e.target.checked });
                    }}
                    className="w-4 h-4 accent-vibe-accent cursor-pointer"
                  />
                </div>
              </div>

              {/* Danger Zone: Sign Out Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Account</span>
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* VIEW 2: GUEST ACCOUNT VIEW */}
      {isGuest && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Guest Explorer Card */}
          <div className="p-6 rounded-3xl bg-vibe-card border border-vibe-border shadow-soft space-y-4">
            <div className="flex items-center gap-3.5">
              <img
                src={getUserAvatar(null)}
                alt="Guest"
                className="w-14 h-14 rounded-full object-cover ring-2 ring-vibe-border flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-base font-bold text-vibe-ink truncate">Guest Explorer</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Guest Mode
                  </span>
                </div>
                <p className="text-xs text-vibe-ink-muted truncate mt-0.5">Read-only browsing session</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-vibe-ink-secondary leading-relaxed">
              Your reading timer history, custom ambience, and shelf items are stored locally in this browser. Create an account to permanently sync your reading progress and unlock community features.
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenAuthModal?.('signup')}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-vibe-accent hover:bg-vibe-accent-hover text-white text-xs font-semibold shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Free Account</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAuthModal?.('signin')}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-vibe-border text-vibe-ink hover:bg-vibe-card-subtle text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Existing Account</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};