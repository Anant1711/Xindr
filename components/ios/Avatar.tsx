import { AVATAR_COLORS } from "@/lib/constants";

export function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type AvatarProps = {
  id: string;
  firstName: string;
  lastInitial?: string;
  size?: number;
};

export function Avatar({
  id,
  firstName,
  lastInitial = "",
  size = 40,
}: AvatarProps) {
  const initials = (firstName.charAt(0) + lastInitial.charAt(0)).toUpperCase();
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display text-white select-none"
      style={{
        width: size,
        height: size,
        backgroundColor: avatarColor(id),
        fontSize: Math.round(size * 0.38),
      }}
    >
      {initials}
    </span>
  );
}
