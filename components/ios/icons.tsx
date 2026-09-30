import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function ChevronRight(props: IconProps) {
  return (
    <Svg size={14} strokeWidth={2.4} {...props}>
      <path d="M9 5l7 7-7 7" />
    </Svg>
  );
}

export function ChevronLeft(props: IconProps) {
  return (
    <Svg size={22} strokeWidth={2.4} {...props}>
      <path d="M15 4l-8 8 8 8" />
    </Svg>
  );
}

export function Ellipsis(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function Checkmark(props: IconProps) {
  return (
    <Svg size={18} strokeWidth={2.4} {...props}>
      <path d="M4.5 12.5l5 5 10-11" />
    </Svg>
  );
}

export function PeopleIcon({
  filled,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3.5" fill={filled ? "currentColor" : "none"} />
      <path
        d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6z"
        fill={filled ? "currentColor" : "none"}
      />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M17 14c2.6 0 4.5 1.8 4.5 4.6" />
    </Svg>
  );
}

export function ChatIcon({
  filled,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <Svg {...props}>
      <path
        d="M12 4c5 0 9 3.2 9 7.3s-4 7.2-9 7.2c-.9 0-1.8-.1-2.6-.3L5 20.5l1.1-3.6C4.2 15.6 3 13.6 3 11.3 3 7.2 7 4 12 4z"
        fill={filled ? "currentColor" : "none"}
      />
    </Svg>
  );
}

export function PersonIcon({
  filled,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9.2" />
      <circle cx="12" cy="10" r="3.2" fill={filled ? "currentColor" : "none"} />
      <path d="M6.2 18.4c1.3-2 3.3-3.1 5.8-3.1s4.5 1.1 5.8 3.1" />
    </Svg>
  );
}
