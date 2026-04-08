/**
 * Modern Video Player Library
 * @packageDocumentation
 */

export { VideoPlayer } from './VideoPlayer';
export type {
  VideoPlayerOptions,
  VideoSource,
  PlayerState,
  PlayerEventType,
  EventCallback,
  PlayerError,
  CustomStyleOptions,
  SubtitleTrack,
} from './types';
export { initTheme, setTheme, toggleTheme, getCurrentTheme, watchSystemTheme } from './theme';
export type { Theme } from './theme';

// Import styles
import './styles.css';

// Default export
export { VideoPlayer as default } from './VideoPlayer';
