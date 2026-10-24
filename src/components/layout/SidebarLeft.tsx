import React from 'react';
import {
  Compass,
  MessageSquare,
  Clock,
  BarChart3,
  Users,
  Trophy,
  Library,
  Bookmark,
  BookOpen,
  Sparkles,
  HelpCircle,
  ChevronsUpDown,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNoticeStore } from '../../stores/noticeStore';
import { getUserAvatar } from '../../utils/avatar';
import { VibeTriggerButton } from '../theme/VibeTriggerButton';

export type NavigationTab = 'feed' | 'explore' | 'timer' | 'analytics' | 'sanctuary' | 'leaderboard' | 'bookshelf' | 'saved' | 'book_details' | 'reader' | 'profile';

interface SidebarLeftProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onGoToLanding?: () => void;
  onGoToLogin?: () => void;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({ activeTab, onTabChange, onGoToLanding, onGoToLogin }) => {
  const { user, isGuest, isAuthenticated } = useAuthStore();
  const { openInfoModal } = useNoticeStore();

  const navSections = [
    {
      title: 'Discover',
      items: [
        { id: 'feed' as NavigationTab,    label: 'Feed',    icon: MessageSquare },
        { id: 'explore' as NavigationTab, label: 'Explore', icon: Compass },
      ],
    },
    {
      title: 'Library',
      items: [
        { id: 'bookshelf' as NavigationTab, label: 'Bookshelf', icon: Library,  badge: user?.bookshelfCount ?? 0 },
        { id: 'reader' as NavigationTab,    label: 'Reader',    icon: BookOpen },
        { id: 'saved' as NavigationTab,     label: 'Saved',     icon: Bookmark, badge: user?.savedPassagesCount ?? 0 },
      ],
    },
    {
      title: 'Habits',
      items: [
        { id: 'timer' as NavigationTab,     label: 'Timer',     icon: Clock },
        { id: 'analytics' as NavigationTab, label: 'Analytics', icon: BarChart3 },
        { id: 'sanctuary' as NavigationTab, label: 'Sanctuary', icon: Users },
      ],
    },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between h-full py-5 pb-8 md:w-16 lg:w-60 xl:w-64 flex-shrink-0 md:px-1 lg:pr-3 lg:pl-1 overflow-y-auto overscroll-contain select-none transition-all duration-500">
      <div className="space-y-4.5 flex-shrink-0">

        {navSections.map((section) => (
          <nav key={section.title} className="space-y-0.5">
            <p className="hidden lg:block px-3 text-[10px] font-sans font-semibold tracking-wider uppercase text-vibe-ink-muted/70 mb-1.5">
              {section.title}
            </p>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'sanctuary' && activeTab === 'leaderboard');
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  title={item.label}
                  aria-label={item.label}
                  className={`w-full h-9.5 flex items-center justify-center lg:justify-between px-3 rounded-xl text-[13.5px] transition-colors duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-vibe-accent text-white font-medium shadow-xs'
                      : 'text-vibe-ink-secondary font-normal hover:bg-vibe-card-subtle hover:text-vibe-ink'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4.5 h-4.5 flex-shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                    <span className="hidden lg:inline truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`hidden lg:inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md font-mono text-[10px] font-medium transition-colors ${
                      isActive ? 'bg-white/20 text-white' : 'bg-vibe-card text-vibe-ink-muted border border-vibe-border'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        ))}

        {/* Inspiration Quote Card (desktop only) */}
        <div className="hidden lg:block mx-1 p-3.5 rounded-2xl bg-vibe-card border border-vibe-border shadow-soft">
          <Sparkles className="w-3.5 h-3.5 text-vibe-accent mb-2" strokeWidth={1.75} />
          <p className="font-display italic text-xs text-vibe-ink leading-snug mb-1 font-normal">
            "A few pages a day. A whole world within."
          </p>
          <p className="text-[10.5px] text-vibe-ink-muted">
            Keep your story going.
          </p>
        </div>

      </div>

      {/* Sidebar Footer */}
      <div className="space-y-1 flex-shrink-0 border-t border-vibe-border pt-4 mt-4">

        {/* Help */}
        <button
          onClick={() => openInfoModal('help')}
          title="Help & community"
          aria-label="Help & community"
          className="w-full h-9.5 flex items-center justify-center lg:justify-start gap-3 px-3 text-[13.5px] font-normal text-vibe-ink-muted hover:text-vibe-ink hover:bg-vibe-card-subtle rounded-xl transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4.5 h-4.5 flex-shrink-0" strokeWidth={1.5} />
          <span className="hidden lg:inline">Help & community</span>
        </button>

        {/* Theme Toggle */}
        <VibeTriggerButton variant="sidebar" />

        {/* Profile Card */}
        <div
          onClick={() => onTabChange('profile')}
          role="button"
          tabIndex={0}
          title="Reader profile & settings"
          className={`flex items-center justify-center lg:justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer group select-none ${
            activeTab === 'profile'
              ? 'bg-vibe-card-subtle ring-1 ring-vibe-border shadow-xs'
              : 'hover:bg-vibe-card-subtle'
          }`}
          onKeyDown={(e) => e.key === 'Enter' && onTabChange('profile')}
        >
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={getUserAvatar(user)}
              alt={user?.fullName ?? 'Guest'}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-vibe-border"
            />
            <div className="hidden lg:block text-left min-w-0">
              <p className="text-xs font-medium text-vibe-ink leading-tight truncate">
                {user?.fullName ?? 'Guest Explorer'}
              </p>
              <p className="text-[11px] text-vibe-ink-muted mt-0.5 truncate">
                {(isGuest || !isAuthenticated || !user || user.id === 'guest-user') ? 'Browsing as guest' : (user.subtitle || (user.username ? `@${user.username}` : user.rankTier || 'Reader'))}
              </p>
            </div>
          </div>
          <ChevronsUpDown className="hidden lg:block w-3.5 h-3.5 text-vibe-ink-muted group-hover:text-vibe-ink transition-colors flex-shrink-0" strokeWidth={1.75} />
        </div>

      </div>
    </aside>
  );
};
