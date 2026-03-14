import Image from 'next/image';
import { getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  className?: string;
}

const COLORS = [
  'bg-blue-700', 'bg-purple-700', 'bg-green-700', 'bg-yellow-700',
  'bg-red-700', 'bg-pink-700', 'bg-indigo-700', 'bg-teal-700',
];

function pickColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({ src, name, size = 32, className = '' }: AvatarProps) {
  const px = `${size}px`;
  const initials = getInitials(name || '?');

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold select-none ${pickColor(name)} ${className}`}
      style={{ width: px, height: px, fontSize: size * 0.4 }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
