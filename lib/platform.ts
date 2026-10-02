type Env = {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  /** Already running from the Home Screen. */
  standalone: boolean;
};

/** iPhone/iPad Safari that is not already installed: the only place the Add to Home Screen hint applies. */
export function shouldShowIosInstallHint({
  userAgent,
  platform,
  maxTouchPoints,
  standalone,
}: Env) {
  // iPadOS reports itself as a Mac with touch.
  const iOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1);
  const safari =
    /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
  return iOS && safari && !standalone;
}
