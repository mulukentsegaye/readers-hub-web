import React from 'react';
import { MessageSquare, Compass, BookOpen, Library, Users } from 'lucide-react';
import { NavigationTab } from './SidebarLeft';

interface MobileNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange }) => {
  const items: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'feed', label: 'Feed', icon: MessageSquare },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'reader', label: 'Reader', icon: BookOpen },
    { id: 'bookshelf', label: 'Shelf', icon: Library },
    { id: 'sanctuary', label: 'Sanctuary', icon: Users },
  ];

  const isTabActive = (id: NavigationTab) => {
    if (id === activeTab) return true;
    if (id === 'bookshelf' && activeTab === 'saved') return true;
    if (id === 'sanctuary' && activeTab === 'leaderboard') return true;
    return false;
  };

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-vibe-card/90 backdrop-blur-xl border-t border-vibe-border/70 px-2 pt-1 pb-[max(0.4rem,calc(env(safe-area-inset-bottom)+0.25rem))] flex items-center justify-around shadow-vibe-elevated transition-colors duration-300 select-none"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = isTabActive(item.id);

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            className="flex-1 min-w-0 h-12 flex flex-col items-center justify-center relative transition-transform duration-150 active:scale-90 cursor-pointer outline-none"
          >
            <div className="relative flex items-center justify-center">
              <Icon 
                className={`w-5 h-5 transition-all duration-200 ${
                  active 
                    ? 'text-vibe-accent stroke-[2.2] scale-105' 
                    : 'text-vibe-ink-muted/80 stroke-[1.6] hover:text-vibe-ink'
                }`} 
              />
            </div>
            <span 
              className={`text-[10px] leading-tight tracking-tight mt-0.5 truncate max-w-[62px] transition-colors duration-200 ${
                active 
                  ? 'text-vibe-accent font-semibold' 
                  : 'text-vibe-ink-muted/80 font-normal hover:text-vibe-ink'
              }`}
            >
              {item.label}
            </span>
            {active && (
              <span className="absolute bottom-0 w-1 h-1 rounded-full bg-vibe-accent animate-in fade-in zoom-in-75 duration-200" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
