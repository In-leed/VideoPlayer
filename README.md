# 🎬 Modern Video Player

A modern, feature-rich HTML5 video player library built with TypeScript, Tailwind CSS, and the latest web technologies.

## ✨ Features

- 🎯 **TypeScript** - Full type safety and IntelliSense support
- � **Tailwind CSS** - Modern utility-first styling
- 🎨 **Custom Controls** - Beautiful, customizable player controls
- 📱 **Split Controls** - Top and bottom control bars for better mobile UX
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
  subtitles?: SubtitleTrack[];            // Subtitle tracks
  enableThumbnails?: boolean;             // Enable thumbnails (default: false)
  thumbnailInterval?: number;             // Thumbnail interval in seconds (default: 5)
  customStyles?: CustomStyleOptions;      // Custom colors and styling
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

## 🎨 Custom Styling

The video player supports extensive customization through the `customStyles` option, allowing you to change colors, button styles, and other visual elements without modifying CSS files.

### Basic Example

```typescript
const player = new VideoPlayer('#player', {
  src: 'video.mp4',
  controls: true,
  customStyles: {
    primaryColor: '#ff6b6b',
    buttonBackground: 'rgba(255, 107, 107, 0.2)',
    buttonBackgroundHover: 'rgba(255, 107, 107, 0.35)',
    buttonBorderRadius: '12px',
    progressColor: '#ff6b6b',
  }
});
```

### Available Custom Style Options

```typescript
interface CustomStyleOptions {
  // Primary accent color (used throughout the player)
  primaryColor?: string;
  
  // Button styling
  buttonBackground?: string;        // Button background color
  buttonBackgroundHover?: string;   // Button background on hover
  buttonColor?: string;             // Button icon/text color
  buttonBorder?: string;            // Button border color
  buttonBorderRadius?: string;      // Button corner radius (e.g., '8px', '50%')
  
  // Progress bar
  progressColor?: string;           // Progress bar fill color
  progressBackground?: string;      // Progress bar background
  
  // Volume slider
  volumeColor?: string;             // Volume slider color
  
  // Dropdown menus (quality, speed, subtitles)
  menuBackground?: string;          // Menu background color
  menuColor?: string;               // Menu text color
  menuItemHoverBackground?: string; // Menu item hover background
  activeMenuItemColor?: string;     // Active menu item color
  
  // Controls overlay
  controlsBackground?: string;      // Controls gradient background
}
```

### Complete Customization Example

```typescript
const player = new VideoPlayer('#player', {
  src: 'your-video.mp4',
  controls: true,
  customStyles: {
    // Brand color throughout
    primaryColor: '#00d4ff',
    
    // Glassmorphism buttons with cyan tint
    buttonBackground: 'rgba(0, 212, 255, 0.15)',
    buttonBackgroundHover: 'rgba(0, 212, 255, 0.25)',
    buttonColor: '#ffffff',
    buttonBorder: 'rgba(0, 212, 255, 0.3)',
    buttonBorderRadius: '16px',
    
    // Matching progress bar
    progressColor: '#00d4ff',
    progressBackground: 'rgba(255, 255, 255, 0.2)',
    
    // Volume slider to match
    volumeColor: '#00d4ff',
    
    // Dark menus with cyan accents
    menuBackground: 'rgba(10, 10, 15, 0.98)',
    menuColor: '#ffffff',
    menuItemHoverBackground: 'rgba(0, 212, 255, 0.2)',
    activeMenuItemColor: '#00d4ff',
    
    // Custom controls gradient
    controlsBackground: 'linear-gradient(to top, rgba(0, 20, 30, 0.95) 0%, rgba(0, 20, 30, 0.3) 50%, transparent 100%)'
  }
});
```

### Preset Examples

#### Netflix Style

```typescript
customStyles: {
  primaryColor: '#e50914',
  buttonBackground: 'rgba(229, 9, 20, 0.1)',
  buttonBackgroundHover: 'rgba(229, 9, 20, 0.2)',
  buttonBorderRadius: '4px',
  progressColor: '#e50914',
  menuBackground: 'rgba(0, 0, 0, 0.95)',
  activeMenuItemColor: '#e50914',
}
```

#### YouTube Style

```typescript
customStyles: {
  primaryColor: '#ff0000',
  buttonBackground: 'transparent',
  buttonBackgroundHover: 'rgba(255, 255, 255, 0.1)',
  buttonBorder: 'transparent',
  buttonBorderRadius: '50%',
  progressColor: '#ff0000',
  progressBackground: 'rgba(255, 255, 255, 0.4)',
  volumeColor: '#ffffff',
}
```

#### Modern Minimal

```typescript
customStyles: {
  primaryColor: '#6366f1',
  buttonBackground: 'rgba(99, 102, 241, 0.08)',
  buttonBackgroundHover: 'rgba(99, 102, 241, 0.15)',
  buttonBorder: 'rgba(99, 102, 241, 0.2)',
  buttonBorderRadius: '10px',
  progressColor: '#6366f1',
  menuBackground: 'rgba(255, 255, 255, 0.98)',
  menuColor: '#1f2937',
  activeMenuItemColor: '#6366f1',
}
```

### Tips

- Colors can be in any CSS format: hex (`#ff6b6b`), rgb (`rgb(255, 107, 107)`), rgba (`rgba(255, 107, 107, 0.5)`), or named colors
- Use CSS gradients for `controlsBackground` to create custom overlay effects
- Border radius accepts any CSS unit: `px`, `rem`, `%`
- All options are optional - only specify what you want to customize
- Custom styles work with both light and dark themes

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

## 📱 Responsive Design

The video player features a comprehensive responsive design system that provides optimal viewing experiences across all devices and screen sizes.

### Key Features

- **Multi-Breakpoint System**: Optimized layouts for phones, tablets, and desktops
- **Split Controls Layout**: Top and bottom control bars for better mobile accessibility
- **Touch-Optimized Interface**: Larger touch targets (44×44px) for touch devices
- **Orientation Support**: Adaptive layouts for portrait and landscape modes
- **Fullscreen Responsive**: Enhanced controls in fullscreen mode on mobile
- **High DPI Support**: Retina-optimized for crisp visuals on high-resolution displays
- **Accessibility**: Respects `prefers-reduced-motion` for users with motion sensitivity

### Split Controls Architecture

The player uses a responsive controls system that adapts to device size:

**Desktop (>768px) - Single Control Bar**
- All controls in one bottom bar for desktop familiarity
- Settings, playback, volume, and time in a single unified location
- Spacer element keeps settings grouped on the right

**Mobile (≤768px) - Split Layout**
- **Top Bar**: Settings, quality, speed, subtitles, PiP, and fullscreen buttons
- **Bottom Bar**: Playback controls (play/pause, volume), progress bar, time display
- Gradient overlays that don't obstruct video content
- Optimized for thumb reach on mobile devices

This adaptive design reduces clutter on mobile while maintaining desktop familiarity, matching modern video player patterns. The split automatically activates based on screen size with no configuration needed.

### Breakpoints

| Device | Screen Width | Optimizations |
|--------|--------------|---------------|
| Extra Small | ≤ 480px | Compact controls, hidden volume slider |
| Small | 481-640px | Touch-friendly sizing |
| Medium | 641-768px | Tablet-optimized layout |
| Large | 769-1024px | Desktop experience |
| XXL | ≥ 1921px | Enhanced for 4K displays |

### Touch Device Features

On touch-enabled devices, the player automatically:
- Increases minimum touch target size to 44×44px (WCAG AAA)
- Enlarges the progress bar for easier scrubbing
- Removes tap delay for instant response
- Prevents unwanted text selection

### Orientation Handling

**Portrait Mode (≤ 768px)**
- Optimized spacing and larger controls
- Full-width settings menu with bottom-sheet style
- Enhanced subtitle positioning

**Landscape Mode (height ≤ 600px)**
- Compact controls to maximize video viewing area
- Smaller subtitles to avoid obstruction
- Condensed settings menu

### Implementation

The responsive design is built-in and requires no additional configuration. Just ensure your HTML includes the viewport meta tag:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Responsive Container

For best results, wrap the player in a responsive container:

```css
.video-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

@media (max-width: 768px) {
  .video-wrapper {
    padding: 0.5rem;
  }
}
```

For detailed information about the responsive design system, see [RESPONSIVE_DESIGN.md](docs/RESPONSIVE_DESIGN.md).

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
