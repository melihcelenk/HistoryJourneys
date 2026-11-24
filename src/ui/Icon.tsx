/** Original line icons on a 24x24 grid, drawn as single paths. */
const ICON_PATHS = {
  play: 'M7 4l13 8-13 8z',
  pause: 'M6 4h4v16H6zm8 0h4v16h-4z',
  swap: 'M7 4l-5 5 5 5v-3.500h9v-3H7zm10 6v3.500H8v3h9V20l5-5z',
  close: 'M5.600 4.200 12 10.600l6.400-6.400 1.400 1.400L13.400 12l6.400 6.400-1.400 1.400L12 13.400l-6.400 6.400-1.400-1.400L10.600 12 4.200 5.600z',
  back: 'M11 5l-7 7 7 7v-4.500h9v-5h-9z',
  forward: 'M13 5l7 7-7 7v-4.500H4v-5h9z',
  up: 'M12 5l7 8h-4.500v6h-5v-6H5z',
  down: 'M12 19l-7-8h4.500V5h5v6H19z',
  cause: 'M4 12l7-7v4.500c5 0 8 2.500 9 9.500-2.500-3.500-5-5-9-5V19z',
  consequence: 'M20 12l-7-7v4.500c-5 0-8 2.500-9 9.500 2.500-3.500 5-5 9-5V19z',
  depth: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 2a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm-1 3h2v2h-2zm0 3.500h2V17h-2z',
  details: 'M4 5h16v2H4zm0 6h16v2H4zm0 6h10v2H4z',
  game: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3 3.500a1.500 1.500 0 1 0 0 3 1.500 1.500 0 0 0 0-3zm8 0a1.500 1.500 0 1 0 0 3 1.500 1.500 0 0 0 0-3zm-4 4a1.500 1.500 0 1 0 0 3 1.500 1.500 0 0 0 0-3zm-4 4a1.500 1.500 0 1 0 0 3 1.500 1.500 0 0 0 0-3zm8 0a1.500 1.500 0 1 0 0 3 1.500 1.500 0 0 0 0-3z',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 5h2v2h-2zm0 4h2v6h-2z',
  compass: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm4 4-2.500 5.500L8 16l2.500-5.500z',
  check: 'M9.500 16.200 5.300 12l-1.400 1.400 5.600 5.600 11-11-1.400-1.400z',
  plus: 'M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z',
  crest:
    'M12 1l9 3v7c0 5.500-3.800 9.700-9 12-5.200-2.300-9-6.500-9-12V4zm0 2.100L5 5.400V11c0 4.300 2.900 7.800 7 9.800 4.100-2 7-5.500 7-9.800V5.400zM12 6l1.500 3.500 3.500.300-2.700 2.400.900 3.600L12 13.900l-3.200 1.900.900-3.600L7 9.800l3.500-.300z',
  map: 'M9 3l6 2 6-2v16l-6 2-6-2-6 2V5zm0 2.200V17l6 2V7.200z',
} as const;

export type IconName = keyof typeof ICON_PATHS;

interface IconProps {
  name: IconName;
  className?: string;
}

/** Decorative icon; the surrounding control carries the accessible name. */
export function Icon({ name, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path fill="currentColor" d={ICON_PATHS[name]} />
    </svg>
  );
}
