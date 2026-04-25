'use client';

import { UserInfo } from '@/lib/live-client';
import Avatar from '@/components/ui/Avatar';
import { clsx } from 'clsx';

interface PresenceBarProps {
  participants: UserInfo[];
  connected: boolean;
  className?: string;
}

export default function PresenceBar({ participants, connected, className }: PresenceBarProps) {
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      {/* Connection status dot */}
      <span className={clsx(
        'inline-block w-2 h-2 rounded-full',
        connected ? 'bg-[#2ea043]' : 'bg-[#da3633]',
      )} />
      <span className="text-xs text-fg-muted">
        {connected ? 'Connected' : 'Reconnecting…'}
      </span>

      {/* Participant stack */}
      {participants.length > 0 && (
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {participants.slice(0, 8).map((u) => (
              <div
                key={u.id}
                title={u.username}
                className="ring-2 ring-canvas-default rounded-full"
              >
                <Avatar name={u.username} src={u.avatar} size={24} />
              </div>
            ))}
          </div>
          {participants.length > 8 && (
            <span className="ml-2 text-xs text-fg-muted">
              +{participants.length - 8} more
            </span>
          )}
          <span className="ml-2 text-xs text-fg-muted">
            {participants.length} reviewer{participants.length !== 1 ? 's' : ''} in lobby
          </span>
        </div>
      )}
    </div>
  );
}
