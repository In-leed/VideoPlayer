/**
 * Custom style options for colors and button appearance
 */
export interface CustomStyleOptions {
  /** Primary color (used for accents and highlights) */
  primaryColor?: string;
  /** Button background color */
  buttonBackground?: string;
  /** Button background color on hover */
  buttonBackgroundHover?: string;
  /** Button text/icon color */
  buttonColor?: string;
  /** Button border color */
  buttonBorder?: string;
  /** Button border radius */
  buttonBorderRadius?: string;
  /** Progress bar color */
  progressColor?: string;
  /** Progress bar background color */
  progressBackground?: string;
  /** Controls background gradient */
  controlsBackground?: string;
  /** Volume slider color */
  volumeColor?: string;
  /** Menu background color */
  menuBackground?: string;
  /** Menu text color */
  menuColor?: string;
  /** Menu item hover background */
  menuItemHoverBackground?: string;
  /** Active menu item color */
  activeMenuItemColor?: string;
}

/**
 * Video player configuration options
 */
export interface VideoPlayerOptions {
  /** The video source URL or array of sources */
  src: string | VideoSource[];
  /** Enable/disable controls (default: true) */
  controls?: boolean;
  /** Autoplay video (default: false) */
  autoplay?: boolean;
  /** Loop video (default: false) */
  loop?: boolean;
  /** Muted by default (default: false) */
  muted?: boolean;
  /** Initial volume (0-1, default: 1) */
  volume?: number;
  /** Poster image URL */
  poster?: string;
  /** Playback rate (default: 1) */
  playbackRate?: number;
  /** Enable picture-in-picture (default: true) */
  enablePIP?: boolean;
  /** Enable fullscreen (default: true) */
  enableFullscreen?: boolean;
  /** Custom theme */
  theme?: 'light' | 'dark' | 'auto';
  /** Show quality selector */
  showQualitySelector?: boolean;
  /** Keyboard shortcuts enabled (default: true) */
  keyboardShortcuts?: boolean;
  /** Subtitle tracks */
  subtitles?: SubtitleTrack[];
  /** Enable thumbnail preview (default: false) */
  enableThumbnails?: boolean;
  /** Thumbnail capture interval in seconds (default: 5) */
  thumbnailInterval?: number;
  /** Custom style options for colors and buttons */
  customStyles?: CustomStyleOptions;
}

/**
 * Video source with quality options
 */
export interface VideoSource {
  src: string;
  type?: string;
  quality?: string;
  label?: string;
}

/**
 * Subtitle track
 */
export interface SubtitleTrack {
  src: string;
  label: string;
  srclang: string;
  kind?: 'subtitles' | 'captions';
  default?: boolean;
}

/**
 * Player state
 */
export interface PlayerState {
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  buffered: TimeRanges | null;
  ended: boolean;
  fullscreen: boolean;
  pip: boolean;
  quality?: string;
}

/**
 * Event types emitted by the player
 */
export type PlayerEventType =
  | 'play'
  | 'pause'
  | 'ended'
  | 'timeupdate'
  | 'volumechange'
  | 'ratechange'
  | 'seeking'
  | 'seeked'
  | 'waiting'
  | 'canplay'
  | 'error'
  | 'fullscreenchange'
  | 'pipchange'
  | 'qualitychange'
  | 'subtitlechange';

/**
 * Event callback function
 */
export type EventCallback = (state: PlayerState) => void;

/**
 * Error event details
 */
export interface PlayerError {
  code: number;
  message: string;
  details?: unknown;
}
