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

export function MapPinIcon({
  filled,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <Svg {...props}>
      <path
        d="M12 21.5s7.5-6.9 7.5-12.7a7.5 7.5 0 10-15 0c0 5.8 7.5 12.7 7.5 12.7z"
        fill={filled ? "currentColor" : "none"}
      />
      <circle cx="12" cy="9" r="2.8" fill={filled ? "white" : "none"} />
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
        d="M3.5 5.5h17v11h-10l-5.5 4v-15z"
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
      <circle
        cx="12"
        cy="8.5"
        r="3.9"
        fill={filled ? "currentColor" : "none"}
      />
      <path
        d="M4.9 20.8c0-4.3 3.1-6.9 7.1-6.9s7.1 2.6 7.1 6.9"
        fill={filled ? "currentColor" : "none"}
      />
    </Svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <Svg size={20} strokeWidth={2.2} {...props}>
      <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
    </Svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Svg size={17} {...props}>
      <path d="M12 2.8l7.5 3.2v5.9c0 5.3-3.4 8.9-7.5 10.2-4.1-1.3-7.5-4.9-7.5-10.2V6l7.5-3.2z" />
    </Svg>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <Svg size={22} {...props}>
      <path d="M3 6h18M7 12h10M10.5 18h3" />
      <circle cx="8.5" cy="6" r="1.9" fill="white" />
      <circle cx="15.5" cy="12" r="1.9" fill="white" />
    </Svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Svg size={18} strokeWidth={2.2} {...props}>
      <path d="M4.4 12a7.6 7.6 0 0113-5.4M19.6 12a7.6 7.6 0 01-13 5.4" />
      <path d="M17.5 3.5v3.3h-3.3M6.5 20.5v-3.3h3.3" />
    </Svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Svg size={14} strokeWidth={2} {...props}>
      <path d="M12 21s6.5-5.8 6.5-11a6.5 6.5 0 10-13 0c0 5.2 6.5 11 6.5 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </Svg>
  );
}
