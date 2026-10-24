import React from 'react';

interface LireadLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  useJpg?: boolean;
}

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string> = {
  xs: 'w-6 h-6',
  sm: 'w-7 h-7',
  md: 'w-8 h-8 sm:w-9 sm:h-9',
  lg: 'w-10 h-10 sm:w-11 sm:h-11',
  xl: 'w-12 h-12 sm:w-14 sm:h-14',
};

/**
 * Official Liread Brand Logo component.
 * Displays the emerald/teal open-book motif derived from `liread_logo.jpg`.
 * Uses optimized transparent PNG with automatic fallback to the original JPG.
 */
export const LireadLogo: React.FC<LireadLogoProps> = ({
  className = '',
  size = 'md',
  useJpg = false,
}) => {
  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${sizeClasses} ${className}`}
    >
      <img
        src={useJpg ? '/liread_logo.jpg' : '/liread_logo.png'}
        alt="Liread Logo"
        loading="eager"
        decoding="async"
        className="w-full h-full object-contain filter drop-shadow-xs"
        onError={(e) => {
          if (!useJpg) {
            (e.currentTarget as HTMLImageElement).src = '/liread_logo.jpg';
          }
        }}
      />
    </div>
  );
};
