# VideoPlayer Architecture

This document describes the refactored architecture of the VideoPlayer component.

## Overview

The VideoPlayer has been refactored from a single 1500+ line file into a modular, maintainable architecture using the **Manager Pattern**. Each manager handles a specific concern, making the codebase easier to understand, test, and extend.

## Structure

```
src/
├── VideoPlayer.ts          # Main orchestrator class (600 lines)
├── types.ts                # TypeScript type definitions
├── theme.ts                # Theme utilities
├── index.ts                # Public exports
│
├── events/
│   └── EventManager.ts     # Event listening and emission
│
├── ui/
│   └── UIManager.ts        # UI updates (progress, volume, duration)
│
├── controls/
│   └── ControlsManager.ts  # Controls creation and lifecycle
│
├── menu/
│   └── MenuManager.ts      # Dropdown menus (quality, speed, subtitles)
│
├── quality/
│   └── QualityManager.ts   # Quality selection and auto-quality
│
├── thumbnail/
│   └── ThumbnailManager.ts # Thumbnail generation and preview
│
└── utils/
    └── helpers.ts          # Utility functions
```

## Managers

### EventManager (`events/EventManager.ts`)
**Responsibility:** Centralized event management

- Stores event listeners by type
- Emits events to registered callbacks
- Provides clean on/off API

### UIManager (`ui/UIManager.ts`)
**Responsibility:** UI state updates

- Updates progress bar and time displays
- Updates volume slider and icons
- Updates play/pause button state
- Shows play/pause animations
- Updates buffer bar

### ControlsManager (`controls/ControlsManager.ts`)
**Responsibility:** Controls creation and lifecycle

- Generates controls HTML dynamically
- Creates quality, speed, subtitle menus
- Manages auto-hide behavior
- Creates animation icon overlay

### MenuManager (`menu/MenuManager.ts`)
**Responsibility:** Dropdown menu management

- Toggles menu visibility
- Updates active menu items
- Synchronizes menu state with player state
- Handles quality, speed, and subtitle menus

### QualityManager (`quality/QualityManager.ts`)
**Responsibility:** Video quality management

- Manual quality switching
- Auto-quality based on network speed
- Network speed detection
- Quality monitoring interval

### ThumbnailManager (`thumbnail/ThumbnailManager.ts`)
**Responsibility:** Thumbnail preview on progress bar

- Captures video frames on-demand
- Caches thumbnails for performance
- Shows preview on hover
- Positions preview tooltip

## Benefits of This Architecture

### 1. **Separation of Concerns**
Each manager has a single, well-defined responsibility, making it easier to understand and modify.

### 2. **Testability**
Managers can be tested independently with mocked dependencies.

### 3. **Maintainability**
- Smaller files (< 300 lines each)
- Clear module boundaries
- Easy to locate functionality

### 4. **Extensibility**
New features can be added by:
- Creating a new manager
- Extending existing managers
- Without touching unrelated code

### 5. **Reusability**
Managers can potentially be reused in other video player implementations.

## Main VideoPlayer Class

The `VideoPlayer.ts` class now acts as an **orchestrator**:

1. **Initializes** all managers with appropriate dependencies
2. **Coordinates** communication between managers
3. **Exposes** the public API
4. **Delegates** specific tasks to specialized managers

Example flow for playing video:
```
User clicks play button
→ VideoPlayer.play()
→ videoElement.play()
→ UIManager.updatePlayPause()
→ UIManager.showPlayPauseAnimation()
→ EventManager.emit('play')
```

## Migration Notes

### Old Code
```typescript
// Everything in one class
class VideoPlayer {
  private updateProgress() { }
  private updateVolume() { }
  private toggleSpeedMenu() { }
  private setQuality() { }
  // ... 50+ methods
}
```

### New Code
```typescript
// Delegated to managers
class VideoPlayer {
  private eventManager: EventManager;
  private uiManager: UIManager;
  private menuManager: MenuManager;
  private qualityManager: QualityManager;
  // ...

  public play() {
    await this.videoElement.play();
    this.uiManager.updatePlayPause();
    this.eventManager.emit('play', this.getState());
  }
}
```

## Future Enhancements

This architecture makes it easier to add:

1. **Playlist Manager** - Handle multiple videos
2. **Analytics Manager** - Track playback metrics
3. **Ads Manager** - Video advertisements
4. **Cast Manager** - Chromecast/AirPlay support
5. **Effects Manager** - Filters and video effects

## Backward Compatibility

The public API remains **100% compatible**. All existing code using the VideoPlayer will continue to work without changes:

```typescript
// This still works exactly the same
const player = new VideoPlayer('#player', {
  src: 'video.mp4',
  controls: true,
  customStyles: { primaryColor: '#ff6b6b' }
});

player.play();
player.on('timeupdate', (state) => console.log(state));
```

## File Sizes

| File | Lines | Responsibility |
|------|-------|----------------|
| VideoPlayer.ts (old) | ~1550 | Everything |
| VideoPlayer.ts (new) | ~600 | Orchestration |
| EventManager.ts | ~50 | Events |
| UIManager.ts | ~130 | UI updates |
| ControlsManager.ts | ~270 | Controls |
| MenuManager.ts | ~180 | Menus |
| QualityManager.ts | ~200 | Quality |
| ThumbnailManager.ts | ~200 | Thumbnails |
| helpers.ts | ~30 | Utilities |

**Total:** Similar line count but much better organized!
