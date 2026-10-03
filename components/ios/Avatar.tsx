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
  /** Signed URL of the person's main photo; initials are shown when absent. */
  src?: string | null;
};

export function Avatar({
  id,
  firstName,
  lastInitial = "",
  size = 40,
  src,
}: AvatarProps) {
  const initials = (firstName.charAt(0) + lastInitial.charAt(0)).toUpperCase();
  if (src) {
    return (
      // Plain <img>: the photo is already resized on upload, and signed URLs change hourly,
      // which would defeat the image optimizer's cache.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size, backgroundColor: avatarColor(id) }}
      />
    );
  }
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
