# 🎬 Modern Video Player

A modern, feature-rich HTML5 video player library built with TypeScript, Tailwind CSS, and the latest web technologies.

## ✨ Features

- 🎯 **TypeScript** - Full type safety and IntelliSense support
- � **Tailwind CSS** - Modern utility-first styling
- 🎨 **Custom Controls** - Beautiful, customizable player controls
- ⌨️ **Keyboard Shortcuts** - YouTube-style keyboard navigation
- 📱 **Responsive** - Works perfectly on all devices
- 🎭 **Themes** - Built-in light, dark, and auto themes
- 🖼️ **Picture-in-Picture** - Native PiP support
- ⛶ **Fullscreen** - Full native fullscreen support
- ⚡ **Playback Speed** - Adjustable playback rates
- 🎚️ **Volume Control** - Fine-grained volume control
- 📊 **Progress Bar** - Interactive seeking with buffer display
- 🎯 **Multiple Qualities** - Support for quality switching
- 🔄 **Event System** - Rich event system for all player actions
- 📦 **Zero Runtime Dependencies** - Pure TypeScript, minimal dependencies
- 🚀 **Modern Build** - Built with Vite for optimal performance

## 📦 Installation

```bash
npm install @videoplayer/core
```

## 🚀 Quick Start

```typescript
import { VideoPlayer } from '@videoplayer/core';
import '@videoplayer/core/style.css';

const player = new VideoPlayer('#player', {
  src: 'https://example.com/video.mp4',
  poster: 'https://example.com/poster.jpg',
  controls: true,
  autoplay: false,
  volume: 1,
  theme: 'dark',
});

// Listen to events
player.on('play', (state) => {
  console.log('Video playing!', state);
});

// Control playback
player.play();
player.pause();
player.seek(120);
```

## 🎮 API Reference

### Constructor

```typescript
new VideoPlayer(container: HTMLElement | string, options: VideoPlayerOptions)
```

### Options

```typescript
interface VideoPlayerOptions {
  src: string | VideoSource[];           // Video source(s)
  controls?: boolean;                     // Show controls (default: true)
  autoplay?: boolean;                     // Autoplay (default: false)
  loop?: boolean;                         // Loop playback (default: false)
  muted?: boolean;                        // Start muted (default: false)
  volume?: number;                        // Initial volume 0-1 (default: 1)
  poster?: string;                        // Poster image URL
  playbackRate?: number;                  // Initial playback rate (default: 1)
  enablePIP?: boolean;                    // Enable PiP (default: true)
  enableFullscreen?: boolean;             // Enable fullscreen (default: true)
  theme?: 'light' | 'dark' | 'auto';     // Theme (default: 'dark')
  showQualitySelector?: boolean;          // Show quality selector (default: false)
  keyboardShortcuts?: boolean;            // Enable shortcuts (default: true)
}
```

### Methods

#### Playback Control

- `play(): Promise<void>` - Play the video
- `pause(): void` - Pause the video
- `togglePlay(): void` - Toggle play/pause
- `seek(time: number): void` - Seek to specific time in seconds

#### Volume Control

- `setVolume(volume: number): void` - Set volume (0-1)
- `toggleMute(): void` - Toggle mute

#### Playback Speed

- `setPlaybackRate(rate: number): void` - Set playback rate
- `cyclePlaybackRate(): void` - Cycle through common rates

#### Display

- `toggleFullscreen(): Promise<void>` - Toggle fullscreen mode
- `togglePIP(): Promise<void>` - Toggle Picture-in-Picture

#### Quality

- `setQuality(quality: string): void` - Change video quality

#### State & Events

- `getState(): PlayerState` - Get current player state
- `on(event: PlayerEventType, callback: EventCallback): void` - Add event listener
- `off(event: PlayerEventType, callback: EventCallback): void` - Remove event listener

#### Lifecycle

- `destroy(): void` - Destroy the player instance

### Events

```typescript
type PlayerEventType =
  | 'play'              // Video started playing
  | 'pause'             // Video paused
  | 'ended'             // Video ended
  | 'timeupdate'        // Playback time changed
  | 'volumechange'      // Volume changed
  | 'ratechange'        // Playback rate changed
  | 'seeking'           // Seeking started
  | 'seeked'            // Seeking completed
  | 'waiting'           // Waiting for data
  | 'canplay'           // Can start playing
  | 'error'             // Error occurred
  | 'fullscreenchange'  // Fullscreen toggled
  | 'pipchange'         // PiP toggled
  | 'qualitychange';    // Quality changed
```

## ⌨️ Keyboard Shortcuts

- `Space` / `K` - Play/Pause
- `←` - Seek backward 5 seconds
- `→` - Seek forward 5 seconds
- `↑` - Increase volume
- `↓` - Decrease volume
- `M` - Toggle mute
- `F` - Toggle fullscreen
- `P` - Toggle Picture-in-Picture

## 🎨 Theming

The player supports a fully customizable color system with automatic dark mode support using CSS custom properties:

### Color Palette

The player uses a purple-based color palette with 11 shades (50-950):

```css
--color-primary-50: #fbf4ff;
--color-primary-100: #f7e9fe;
--color-primary-200: #eed2fc;
--color-primary-300: #e3aef9;
--color-primary-400: #d47df5;
--color-primary-500: #be4ce9;
--color-primary-600: #a52ccd; /* Primary accent */
--color-primary-700: #8b21ab;
--color-primary-800: #731d8b;
--color-primary-900: #611d72;
--color-primary-950: #3e064c;
```

### Theme Switching

Toggle between light and dark mode programmatically:

```typescript
import { initTheme, setTheme, toggleTheme, getCurrentTheme } from '@videoplayer/core';

// Initialize theme from localStorage or system preference
initTheme();

// Set a specific theme
setTheme('dark'); // or 'light'

// Toggle between themes
toggleTheme();

// Get current theme
const theme = getCurrentTheme(); // returns 'light' or 'dark'

// Watch for system theme changes
const unwatch = watchSystemTheme((theme) => {
  console.log('System theme changed to:', theme);
});

// Cleanup when done
unwatch();
```

### Customizing Colors

Override CSS variables in your own stylesheet:

```css
:root {
  /* Change primary color to blue */
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  
  /* Custom text colors */
  --color-primary_txt: #1a1a1a;
  --color-secondary_txt: #666666;
}

[data-theme="dark"] {
  /* Dark mode overrides */
  --color-primary_txt: #ffffff;
  --color-card_bg: #1a1a1a;
}
```

### Available CSS Variables

#### Colors
- `--color-primary-{50-950}` - Primary color palette
- `--color-link_txt` - Link text color
- `--color-primary_txt` - Primary text color
- `--color-secondary_txt` - Secondary text color
- `--color-tertiary_txt` - Tertiary text color

#### Backgrounds
- `--color-primary_bg` - Primary background
- `--color-card_bg` - Card background
- `--color-surface` - Surface background
- `--color-hover_bg` - Hover state background
- `--color-primary_active_bg` - Active state background

#### Borders
- `--color-primary_border` - Primary border
- `--color-secondary_border` - Secondary border
- `--color-tertiary_border` - Tertiary border
- `--color-primary_active_border` - Active state border

### Tailwind Integration

The color system is integrated with Tailwind CSS:

```javascript
// tailwind.config.js
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          600: 'var(--color-primary-600)',
          // ... etc
        },
      },
      backgroundColor: {
        'surface': 'var(--color-surface)',
        'card': 'var(--color-card_bg)',
      },
    },
  },
}
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build library
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

## 📝 Examples

### Multiple Quality Sources

```typescript
const player = new VideoPlayer('#player', {
  src: [
    { src: 'video-1080p.mp4', quality: '1080p', label: 'Full HD' },
    { src: 'video-720p.mp4', quality: '720p', label: 'HD' },
    { src: 'video-480p.mp4', quality: '480p', label: 'SD' },
  ],
  showQualitySelector: true,
});
```

### Event Handling

```typescript
player.on('play', (state) => {
  console.log('Playing at', state.currentTime);
});

player.on('ended', (state) => {
  console.log('Video ended');
  // Auto-play next video
});

player.on('error', (state) => {
  console.error('Playback error');
});
```

### Programmatic Control

```typescript
// Play from specific time
player.seek(60);
await player.play();

// Set to 2x speed
player.setPlaybackRate(2);

// Enter fullscreen
await player.toggleFullscreen();

// Get current state
- [Tailwind CSS](https://tailwindcss.com/)
- [PostCSS](https://postcss.org/)
const state = player.getState();
console.log(`Playing: ${state.playing}`);
console.log(`Time: ${state.currentTime}/${state.duration}`);
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this in your projects!

## 🙏 Credits

Built with modern web technologies:
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Vitest](https://vitest.dev/)

---

Made with ❤️ by the community
