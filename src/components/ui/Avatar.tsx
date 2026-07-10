import React from 'react';
import { cn } from '@/lib/utils';
import { initials } from '@/lib/utils';

// ─── Avatar Props ─────────────────────────────────────────────────────────────

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

// ─── Size Styles ──────────────────────────────────────────────────────────────

const sizeStyles = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
  xl: 'h-14 w-14 text-lg',
};

// ─── Color Map (deterministic from name) ─────────────────────────────────────

const AVATAR_COLORS = [
  'bg-primary/20 text-primary-300',
  'bg-success/20 text-success',
  'bg-warning/20 text-warning',
  'bg-info/20 text-info-500',
  'bg-danger/20 text-danger',
  'bg-purple-500/20 text-purple-400',
  'bg-pink-500/20 text-pink-400',
  'bg-cyan-500/20 text-cyan-400',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Avatar Component ─────────────────────────────────────────────────────────

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  className,
  onClick,
}) => {
  const [imgError, setImgError] = React.useState(false);
  const showImage = src && !imgError;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
      aria-label={name}
      className={cn(
        'relative flex items-center justify-center rounded-full overflow-hidden',
        'flex-shrink-0 select-none',
        sizeStyles[size],
        !showImage && avatarColor(name),
        onClick && 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all',
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="font-semibold leading-none">
          {initials(name)}
        </span>
      )}
    </div>
  );
};

// ─── Avatar Group ─────────────────────────────────────────────────────────────

export interface AvatarGroupProps {
  users: Array<{ name: string; src?: string | null }>;
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  users,
  max = 4,
  size = 'sm',
  className,
}) => {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className={cn('flex items-center', className)}>
      {visible.map((user, i) => (
        <div
          key={i}
          className={cn(
            '-ml-2 first:ml-0 ring-2 ring-surface-1 rounded-full'
          )}
        >
          <Avatar src={user.src} name={user.name} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            '-ml-2 flex items-center justify-center rounded-full',
            'ring-2 ring-surface-1 bg-surface-3 text-text-muted font-medium',
            sizeStyles[size]
          )}
        >
          <span className="text-[10px]">+{overflow}</span>
        </div>
      )}
    </div>
  );
};
