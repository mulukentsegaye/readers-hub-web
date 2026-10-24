import React from 'react';
import {
  Compass,
  MessageSquare,
  Clock,
  BarChart3,
  Users,
  Library,
  Bookmark,
  BookOpen,
  Sparkles,
  HelpCircle,
  ChevronsUpDown,
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
    <aside className="hidden md:flex flex-col justify-between h-full py-5 pb-8 md:w-16 lg:w-60 xl:w-64 flex-shrink-0 md:px-1 lg:pr-3 lg:pl-1 overflow-y-auto overscroll-contain select-none transition-all duration-300">
      <div className="flex-shrink-0">
        {navSections.map((section, idx) => (
          <nav key={section.title} className={`${idx > 0 ? 'mt-6 pt-1' : ''} space-y-1`}>
            <p className="hidden lg:block px-3 text-[10.5px] font-mono font-medium tracking-widest uppercase text-vibe-ink-muted/60 mb-2">
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
                  className={`group relative w-full h-9 flex items-center justify-center lg:justify-between px-3 rounded-lg text-[13px] transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-vibe-accent/10 text-vibe-accent font-semibold dark:bg-vibe-accent/15'
                      : 'text-vibe-ink-secondary font-normal hover:text-vibe-ink hover:bg-vibe-ink/[0.04]'
                  }`}
                >
                  {isActive && (
                    <span className="hidden lg:block absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-vibe-accent" />
                  )}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" strokeWidth={isActive ? 2 : 1.6} />
                    </div>
                    <span className="hidden lg:inline truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`hidden lg:inline-flex items-center justify-center min-w-[18px] h-4.5 px-1 rounded-full font-mono text-[10px] font-medium transition-colors ${
                      isActive ? 'bg-vibe-accent text-white' : 'bg-vibe-card text-vibe-ink-muted border border-vibe-border'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        ))}

        {/* Subtle Daily Thought (Integrated, minimal) */}
        <div className="hidden lg:block mx-2 mt-7 pt-4 border-t border-vibe-border/50">
          <div className="flex items-center gap-1.5 text-vibe-accent mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-vibe-accent" strokeWidth={1.5} />
            <span className="text-[10px] font-mono uppercase tracking-wider text-vibe-ink-muted/70">Daily Thought</span>
          </div>
          <p className="font-display italic text-xs text-vibe-ink/80 leading-relaxed font-normal">
            "A few pages a day. A whole world within."
          </p>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="space-y-1 flex-shrink-0 border-t border-vibe-border pt-4 mt-6">
        {/* Help */}
        <button
          onClick={() => openInfoModal('help')}
          title="Help & community"
          aria-label="Help & community"
          className="w-full h-9 flex items-center justify-center lg:justify-start gap-2.5 px-3 text-[13px] font-normal text-vibe-ink-muted hover:text-vibe-ink hover:bg-vibe-ink/[0.04] rounded-lg transition-colors cursor-pointer"
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4" strokeWidth={1.6} />
          </div>
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
          className={`flex items-center justify-center lg:justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer group select-none mt-1 ${
            activeTab === 'profile'
              ? 'bg-vibe-accent/10 text-vibe-accent font-medium dark:bg-vibe-accent/15'
              : 'hover:bg-vibe-ink/[0.04]'
          }`}
          onKeyDown={(e) => e.key === 'Enter' && onTabChange('profile')}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={getUserAvatar(user)}
              alt={user?.fullName ?? 'Guest'}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-1 ring-vibe-border"
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
