import type {
  VideoPlayerOptions,
  VideoSource,
  PlayerState,
  PlayerEventType,
  EventCallback,
  PlayerError,
  SubtitleTrack,
} from './types';

/**
 * Modern HTML5 Video Player with custom controls
 */
export class VideoPlayer {
  private container: HTMLElement;
  private videoElement: HTMLVideoElement;
  private controlsContainer: HTMLElement | null = null;
  private options: Required<VideoPlayerOptions>;
  private eventListeners: Map<PlayerEventType, Set<EventCallback>>;
  private sources: VideoSource[];
  private currentQuality: string | null = null;
  private hideControlsTimeout: number | null = null;
  private clickTimeout: number | null = null;
  private subtitles: SubtitleTrack[];
  private currentSubtitle: string | null = null;
  private thumbnailCache: Map<number, string> = new Map();
  private thumbnailCanvas: HTMLCanvasElement | null = null;

  constructor(container: HTMLElement | string, options: VideoPlayerOptions) {
    // Get container element
    if (typeof container === 'string') {
      const element = document.querySelector(container);
      if (!element) {
        throw new Error(`Container not found: ${container}`);
      }
      this.container = element as HTMLElement;
    } else {
      this.container = container;
    }

    // Set default options
    this.options = {
      src: options.src,
      controls: options.controls ?? true,
      autoplay: options.autoplay ?? false,
      loop: options.loop ?? false,
      muted: options.muted ?? false,
      volume: options.volume ?? 1,
      poster: options.poster ?? '',
      playbackRate: options.playbackRate ?? 1,
      enablePIP: options.enablePIP ?? true,
      enableFullscreen: options.enableFullscreen ?? true,
      showQualitySelector: options.showQualitySelector ?? false,
      keyboardShortcuts: options.keyboardShortcuts ?? true,
      subtitles: options.subtitles ?? [],
      enableThumbnails: options.enableThumbnails ?? false,
      thumbnailInterval: options.thumbnailInterval ?? 5,
    } as Required<VideoPlayerOptions>;

    this.eventListeners = new Map();
    this.sources = Array.isArray(this.options.src) ? this.options.src : [{ src: this.options.src }];
    this.subtitles = this.options.subtitles ?? [];

    // Initialize player
    this.videoElement = this.createVideoElement();
    this.container.appendChild(this.videoElement);

    if (this.options.controls) {
      this.createControls();
    }

    this.createAnimationIcon();
    this.attachEventListeners();
    this.setupKeyboardShortcuts();
    this.setupControlsAutoHide();
    this.applyTheme();
  }

  /**
   * Create the video element
   */
  private createVideoElement(): HTMLVideoElement {
    const video = document.createElement('video');
    video.className = 'vp-video';

    // Enable CORS for thumbnail capture
    if (this.options.enableThumbnails) {
      video.crossOrigin = 'anonymous';
    }

    // Set initial quality (first source or specified)
    const initialSource = this.sources[0];
    if (initialSource) {
      video.src = initialSource.src;
      if (initialSource.type) {
        video.setAttribute('type', initialSource.type);
      }
      this.currentQuality = initialSource.quality ?? null;
    }

    if (this.options.poster) {
      video.poster = this.options.poster;
    }

    video.autoplay = this.options.autoplay;
    video.loop = this.options.loop;
    video.muted = this.options.muted;
    video.volume = this.options.volume;
    video.playbackRate = this.options.playbackRate;

    // Add subtitle tracks
    this.subtitles.forEach((subtitle) => {
      const track = document.createElement('track');
      track.kind = subtitle.kind ?? 'subtitles';
      track.label = subtitle.label;
      track.srclang = subtitle.srclang;
      track.src = subtitle.src;
      if (subtitle.default) {
        track.default = true;
        this.currentSubtitle = subtitle.srclang;
      }
      video.appendChild(track);
    });

    return video;
  }

  /**
   * Create custom controls
   */
  private createControls(): void {
    this.controlsContainer = document.createElement('div');
    this.controlsContainer.className = 'vp-controls';
    this.controlsContainer.innerHTML = `
      <div class="vp-progress-container">
        <div class="vp-progress-preview" style="display: none;">
          ${this.options.enableThumbnails ? '<div class="vp-progress-preview-thumbnail"></div>' : ''}
          <div class="vp-progress-preview-time">0:00</div>
        </div>
        <input type="range" class="vp-progress" min="0" max="100" value="0" step="0.1">
        <div class="vp-buffer"></div>
      </div>
      <div class="vp-controls-bottom">
        <button class="vp-btn vp-play-pause" aria-label="Play/Pause">
          <span class="vp-icon-play material-symbols-outlined">play_arrow</span>
          <span class="vp-icon-pause material-symbols-outlined" style="display: none;">pause</span>
        </button>
        <div class="vp-volume-container">
          <button class="vp-btn vp-volume" aria-label="Volume">
            <span class="vp-icon-volume-high material-symbols-outlined">volume_up</span>
            <span class="vp-icon-volume-low material-symbols-outlined" style="display: none;">volume_down</span>
            <span class="vp-icon-volume-muted material-symbols-outlined" style="display: none;">volume_off</span>
          </button>
          <input type="range" class="vp-volume-slider" min="0" max="1" step="0.01" value="${this.options.volume}">
        </div>
        <span class="vp-time">
          <span class="vp-current-time">0:00</span> / <span class="vp-duration">0:00</span>
        </span>
        <div class="vp-spacer"></div>
        <div class="vp-right-controls">
        ${
          this.options.showQualitySelector && this.sources.length > 1
            ? `<div class="vp-settings-container">
                <button class="vp-btn vp-settings" aria-label="Settings">
                  <span class="material-symbols-outlined">settings</span>
                </button>
                <div class="vp-settings-menu" style="display: none;">
                  <div class="vp-settings-menu-header">Quality</div>
                  ${this.sources
                    .map(
                      (s) =>
                        `<button class="vp-settings-menu-item" data-quality="${s.quality ?? 'auto'}">${s.label ?? s.quality ?? 'Auto'}</button>`
                    )
                    .join('')}
                </div>
              </div>`
            : ''
        }
        <div class="vp-speed-container">
          <button class="vp-btn vp-speed" aria-label="Playback Speed">
            <span class="material-symbols-outlined">speed</span>
          </button>
          <div class="vp-speed-menu" style="display: none;">
            <div class="vp-speed-menu-header">Speed</div>
            <button class="vp-speed-menu-item" data-rate="0.25">0.25x</button>
            <button class="vp-speed-menu-item" data-rate="0.5">0.5x</button>
            <button class="vp-speed-menu-item" data-rate="0.75">0.75x</button>
            <button class="vp-speed-menu-item" data-rate="1">Normal</button>
            <button class="vp-speed-menu-item" data-rate="1.25">1.25x</button>
            <button class="vp-speed-menu-item" data-rate="1.5">1.5x</button>
            <button class="vp-speed-menu-item" data-rate="1.75">1.75x</button>
            <button class="vp-speed-menu-item" data-rate="2">2x</button>
          </div>
        </div>
        ${
          this.subtitles.length > 0
            ? `<div class="vp-subtitle-container">
                <button class="vp-btn vp-subtitle" aria-label="Subtitles">
                  <span class="material-symbols-outlined">closed_caption</span>
                </button>
                <div class="vp-subtitle-menu" style="display: none;">
                  <div class="vp-subtitle-menu-header">Subtitles</div>
                  <button class="vp-subtitle-menu-item" data-lang="off">Off</button>
                  ${this.subtitles
                    .map(
                      (s) =>
                        `<button class="vp-subtitle-menu-item" data-lang="${s.srclang}">${s.label}</button>`
                    )
                    .join('')}
                </div>
              </div>`
            : ''
        }
        ${
          this.options.enablePIP
            ? '<button class="vp-btn vp-pip" aria-label="Picture in Picture"><span class="material-symbols-outlined">picture_in_picture_alt</span></button>'
            : ''
        }
        ${
          this.options.enableFullscreen
            ? '<button class="vp-btn vp-fullscreen" aria-label="Fullscreen"><span class="material-symbols-outlined">fullscreen</span></button>'
            : ''
        }
        </div>
      </div>
    `;

    this.container.appendChild(this.controlsContainer);
    this.attachControlsListeners();
    this.updateQualityMenuUI();
    this.updateSpeedMenuUI();
    this.updateSubtitleMenuUI();
  }

  /**
   * Attach event listeners to controls
   */
  private attachControlsListeners(): void {
    if (!this.controlsContainer) return;

    // Play/Pause
    const playPauseBtn = this.controlsContainer.querySelector('.vp-play-pause');
    playPauseBtn?.addEventListener('click', () => this.togglePlay());

    // Progress
    const progressBar = this.controlsContainer.querySelector('.vp-progress') as HTMLInputElement;
    progressBar?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const time = (parseFloat(target.value) / 100) * this.videoElement.duration;
      this.seek(time);
    });

    // Progress hover preview
    const progressContainer = this.controlsContainer.querySelector('.vp-progress-container') as HTMLElement;
    progressContainer?.addEventListener('mousemove', (e) => this.handleProgressHover(e));
    progressContainer?.addEventListener('mouseleave', () => this.hideProgressPreview());

    // Volume
    const volumeBtn = this.controlsContainer.querySelector('.vp-volume');
    volumeBtn?.addEventListener('click', () => this.toggleMute());

    const volumeSlider = this.controlsContainer.querySelector(
      '.vp-volume-slider'
    ) as HTMLInputElement;
    volumeSlider?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.setVolume(parseFloat(target.value));
    });

    // Settings menu
    const settingsBtn = this.controlsContainer.querySelector('.vp-settings');
    settingsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSettingsMenu();
    });

    // Quality selection from menu
    const qualityItems = this.controlsContainer.querySelectorAll('.vp-settings-menu-item');
    qualityItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const quality = target.getAttribute('data-quality');
        if (quality) {
          this.setQuality(quality);
          this.toggleSettingsMenu();
        }
      });
    });

    // Close settings menu when clicking outside
    document.addEventListener('click', (e) => {
      const settingsMenu = this.controlsContainer?.querySelector(
        '.vp-settings-menu'
      ) as HTMLElement;
      if (settingsMenu && settingsMenu.style.display !== 'none') {
        const target = e.target as HTMLElement;
        if (!target.closest('.vp-settings-container')) {
          this.toggleSettingsMenu();
        }
      }
    });

    // Playback rate menu
    const speedBtn = this.controlsContainer.querySelector('.vp-speed');
    speedBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSpeedMenu();
    });

    // Speed selection from menu
    const speedItems = this.controlsContainer.querySelectorAll('.vp-speed-menu-item');
    speedItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const rate = target.getAttribute('data-rate');
        if (rate) {
          this.setPlaybackRate(parseFloat(rate));
          this.toggleSpeedMenu();
        }
      });
    });

    // Close speed menu when clicking outside
    document.addEventListener('click', (e) => {
      const speedMenu = this.controlsContainer?.querySelector('.vp-speed-menu') as HTMLElement;
      if (speedMenu && speedMenu.style.display !== 'none') {
        const target = e.target as HTMLElement;
        if (!target.closest('.vp-speed-container')) {
          this.toggleSpeedMenu();
        }
      }
    });

    // Subtitle menu
    const subtitleBtn = this.controlsContainer.querySelector('.vp-subtitle');
    subtitleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSubtitleMenu();
    });

    // Subtitle selection from menu
    const subtitleItems = this.controlsContainer.querySelectorAll('.vp-subtitle-menu-item');
    subtitleItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const lang = target.getAttribute('data-lang');
        if (lang) {
          if (lang === 'off') {
            this.disableSubtitles();
          } else {
            this.setSubtitle(lang);
          }
          this.toggleSubtitleMenu();
        }
      });
    });

    // Close subtitle menu when clicking outside
    document.addEventListener('click', (e) => {
      const subtitleMenu = this.controlsContainer?.querySelector(
        '.vp-subtitle-menu'
      ) as HTMLElement;
      if (subtitleMenu && subtitleMenu.style.display !== 'none') {
        const target = e.target as HTMLElement;
        if (!target.closest('.vp-subtitle-container')) {
          this.toggleSubtitleMenu();
        }
      }
    });

    // PIP
    const pipBtn = this.controlsContainer.querySelector('.vp-pip');
    pipBtn?.addEventListener('click', () => void this.togglePIP());

    // Fullscreen
    const fullscreenBtn = this.controlsContainer.querySelector('.vp-fullscreen');
    fullscreenBtn?.addEventListener('click', () => void this.toggleFullscreen());
  }

  /**
   * Attach video element event listeners
   */
  private attachEventListeners(): void {
    this.videoElement.addEventListener('play', () => this.emitEvent('play'));
    this.videoElement.addEventListener('pause', () => this.emitEvent('pause'));
    this.videoElement.addEventListener('ended', () => this.emitEvent('ended'));
    this.videoElement.addEventListener('timeupdate', () => {
      this.updateProgress();
      this.emitEvent('timeupdate');
    });
    this.videoElement.addEventListener('volumechange', () => {
      this.updateVolumeUI();
      this.emitEvent('volumechange');
    });
    this.videoElement.addEventListener('ratechange', () => {
      this.updateRateUI();
      this.emitEvent('ratechange');
    });
    this.videoElement.addEventListener('seeking', () => this.emitEvent('seeking'));
    this.videoElement.addEventListener('seeked', () => this.emitEvent('seeked'));
    this.videoElement.addEventListener('waiting', () => this.emitEvent('waiting'));
    this.videoElement.addEventListener('canplay', () => this.emitEvent('canplay'));
    this.videoElement.addEventListener('error', () => this.handleError());
    this.videoElement.addEventListener('progress', () => this.updateBuffer());
    this.videoElement.addEventListener('loadedmetadata', () => {
      this.updateDuration();
      if (this.options.enableThumbnails) {
        this.generateThumbnails();
      }
    });

    // Text track cue change - adjust subtitle position when new cues load
    this.videoElement.textTracks.addEventListener('change', () => {
      const controlsVisible = this.container.classList.contains('vp-controls-visible');
      this.adjustSubtitlePosition(controlsVisible);
    });

    // Fullscreen change
    document.addEventListener('fullscreenchange', () => this.emitEvent('fullscreenchange'));

    // PIP change
    this.videoElement.addEventListener('enterpictureinpicture', () => this.emitEvent('pipchange'));
    this.videoElement.addEventListener('leavepictureinpicture', () => this.emitEvent('pipchange'));

    // Click on video to play/pause (with double-click detection)
    this.videoElement.addEventListener('click', () => {
      if (this.clickTimeout !== null) {
        // This is part of a double-click, ignore
        clearTimeout(this.clickTimeout);
        this.clickTimeout = null;
        return;
      }

      // Wait to see if this is a double-click
      this.clickTimeout = window.setTimeout(() => {
        this.clickTimeout = null;
        const willPlay = this.videoElement.paused;
        this.showPlayPauseAnimation(willPlay);
        this.togglePlay();
      }, 250);
    });

    // Double-click on video to toggle fullscreen
    this.videoElement.addEventListener('dblclick', () => {
      if (this.clickTimeout !== null) {
        clearTimeout(this.clickTimeout);
        this.clickTimeout = null;
      }
      void this.toggleFullscreen();
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    if (!this.options.keyboardShortcuts) return;

    this.container.setAttribute('tabindex', '0');
    this.container.addEventListener('keydown', (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          this.showPlayPauseAnimation(this.videoElement.paused);
          this.togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.seek(this.videoElement.currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.seek(this.videoElement.currentTime + 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.setVolume(Math.min(1, this.videoElement.volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.setVolume(Math.max(0, this.videoElement.volume - 0.1));
          break;
        case 'm':
          e.preventDefault();
          this.toggleMute();
          break;
        case 'f':
          e.preventDefault();
          void this.toggleFullscreen();
          break;
        case 'p':
          e.preventDefault();
          void this.togglePIP();
          break;
      }
    });
  }

  /**
   * Setup auto-hide controls after inactivity
   */
  private setupControlsAutoHide(): void {
    if (!this.options.controls) return;

    // Show controls initially
    this.showControls();

    // Show controls and reset timer on mouse move or touch
    const resetHideTimer = () => {
      this.showControls();
      this.startHideControlsTimer();
    };

    this.container.addEventListener('mousemove', resetHideTimer);
    this.container.addEventListener('touchstart', resetHideTimer);
    this.container.addEventListener('click', resetHideTimer);

    // Don't hide controls when hovering over them
    this.controlsContainer?.addEventListener('mouseenter', () => {
      this.clearHideControlsTimer();
    });

    this.controlsContainer?.addEventListener('mouseleave', () => {
      this.startHideControlsTimer();
    });

    // Also hide controls when mouse leaves the video area
    this.videoElement.addEventListener('mouseleave', () => {
      this.hideControls();
    });
  }

  /**
   * Show controls
   */
  private showControls(): void {
    this.container.classList.add('vp-controls-visible');
    this.adjustSubtitlePosition(true);
  }

  /**
   * Hide controls
   */
  private hideControls(): void {
    if (!this.videoElement.paused) {
      this.container.classList.remove('vp-controls-visible');
      this.adjustSubtitlePosition(false);
    }
  }

  /**
   * Adjust subtitle position based on controls visibility
   */
  private adjustSubtitlePosition(controlsVisible: boolean): void {
    const tracks = this.videoElement.textTracks;
    
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      if (track && track.mode === 'showing' && track.cues) {
        for (let j = 0; j < track.cues.length; j++) {
          const cue = track.cues[j] as VTTCue;
          if (cue) {
            // Move subtitles up when controls are visible
            // -3 means 3 lines from bottom (above controls)
            // -1 is default (1 line from bottom)
            cue.line = controlsVisible ? -5 : -1;
          }
        }
      }
    }
  }

  /**
   * Start timer to hide controls
   */
  private startHideControlsTimer(): void {
    this.clearHideControlsTimer();
    this.hideControlsTimeout = window.setTimeout(() => {
      this.hideControls();
    }, 2000);
  }

  /**
   * Clear hide controls timer
   */
  private clearHideControlsTimer(): void {
    if (this.hideControlsTimeout !== null) {
      clearTimeout(this.hideControlsTimeout);
      this.hideControlsTimeout = null;
    }
  }

  /**
   * Apply theme
   */
  private applyTheme(): void {
    this.container.classList.add('vp-container');
  }

  /**
   * Create animation icon for play/pause feedback
   */
  private createAnimationIcon(): void {
    const animationIcon = document.createElement('div');
    animationIcon.className = 'vp-animation-icon';
    animationIcon.innerHTML =
      '<div class="vp-animation-icon-content"><span class="material-symbols-outlined"></span></div>';
    this.container.appendChild(animationIcon);
  }

  /**
   * Show play/pause animation
   */
  private showPlayPauseAnimation(isPlaying: boolean): void {
    const animationIcon = this.container.querySelector('.vp-animation-icon') as HTMLElement;
    const iconContent = this.container.querySelector(
      '.vp-animation-icon-content .material-symbols-outlined'
    ) as HTMLElement;

    if (!animationIcon || !iconContent) return;

    // Set icon based on new state
    iconContent.textContent = isPlaying ? 'play_arrow' : 'pause';

    // Remove any existing animation
    animationIcon.classList.remove('vp-animation-show');

    // Trigger reflow to restart animation
    void animationIcon.offsetWidth;

    // Add animation class
    animationIcon.classList.add('vp-animation-show');

    // Remove class after animation completes
    setTimeout(() => {
      animationIcon.classList.remove('vp-animation-show');
    }, 500);
  }

  /**
   * Update progress bar
   */
  private updateProgress(): void {
    if (!this.controlsContainer) return;

    const progressBar = this.controlsContainer.querySelector('.vp-progress') as HTMLInputElement;
    const currentTimeSpan = this.controlsContainer.querySelector('.vp-current-time');

    if (progressBar && !isNaN(this.videoElement.duration)) {
      const progress = (this.videoElement.currentTime / this.videoElement.duration) * 100;
      progressBar.value = progress.toString();
      progressBar.style.setProperty('--progress', `${progress}%`);
    }

    if (currentTimeSpan) {
      currentTimeSpan.textContent = this.formatTime(this.videoElement.currentTime);
    }
  }

  /**
   * Update buffer bar
   */
  private updateBuffer(): void {
    if (!this.controlsContainer) return;

    const bufferBar = this.controlsContainer.querySelector('.vp-buffer') as HTMLElement;
    if (!bufferBar || !this.videoElement.buffered.length) return;

    const bufferedEnd = this.videoElement.buffered.end(this.videoElement.buffered.length - 1);
    const duration = this.videoElement.duration;

    if (duration > 0) {
      const bufferedPercent = (bufferedEnd / duration) * 100;
      bufferBar.style.width = `${bufferedPercent}%`;
    }
  }

  /**
   * Update duration display
   */
  private updateDuration(): void {
    if (!this.controlsContainer) return;

    const durationSpan = this.controlsContainer.querySelector('.vp-duration');
    if (durationSpan) {
      durationSpan.textContent = this.formatTime(this.videoElement.duration);
    }
  }

  /**
   * Update volume UI
   */
  private updateVolumeUI(): void {
    if (!this.controlsContainer) return;

    const volumeSlider = this.controlsContainer.querySelector(
      '.vp-volume-slider'
    ) as HTMLInputElement;
    const volumeHighIcon = this.controlsContainer.querySelector(
      '.vp-icon-volume-high'
    ) as HTMLElement;
    const volumeLowIcon = this.controlsContainer.querySelector(
      '.vp-icon-volume-low'
    ) as HTMLElement;
    const volumeMutedIcon = this.controlsContainer.querySelector(
      '.vp-icon-volume-muted'
    ) as HTMLElement;

    if (volumeSlider) {
      volumeSlider.value = this.videoElement.volume.toString();
      const volumePercent = this.videoElement.volume * 100;
      volumeSlider.style.setProperty('--volume', `${volumePercent}%`);
    }

    // Update volume icon based on volume level
    if (this.videoElement.muted || this.videoElement.volume === 0) {
      volumeHighIcon.style.display = 'none';
      volumeLowIcon.style.display = 'none';
      volumeMutedIcon.style.display = 'inline';
    } else if (this.videoElement.volume <= 0.5) {
      volumeHighIcon.style.display = 'none';
      volumeLowIcon.style.display = 'inline';
      volumeMutedIcon.style.display = 'none';
    } else {
      volumeHighIcon.style.display = 'inline';
      volumeLowIcon.style.display = 'none';
      volumeMutedIcon.style.display = 'none';
    }
  }

  /**
   * Update playback rate UI
   */
  private updateRateUI(): void {
    if (!this.controlsContainer) return;

    this.updateSpeedMenuUI();
  }

  /**
   * Toggle speed menu
   */
  private toggleSpeedMenu(): void {
    if (!this.controlsContainer) return;

    const speedMenu = this.controlsContainer.querySelector('.vp-speed-menu') as HTMLElement;
    if (!speedMenu) return;

    const isVisible = speedMenu.style.display !== 'none';
    speedMenu.style.display = isVisible ? 'none' : 'block';

    // Update active speed item when opening
    if (!isVisible) {
      this.updateSpeedMenuUI();
    }
  }

  /**
   * Update speed menu UI to show active speed
   */
  private updateSpeedMenuUI(): void {
    if (!this.controlsContainer) return;

    const items = this.controlsContainer.querySelectorAll('.vp-speed-menu-item');
    items.forEach((item) => {
      const rate = parseFloat(item.getAttribute('data-rate') ?? '1');
      if (rate === this.videoElement.playbackRate) {
        item.classList.add('vp-active');
      } else {
        item.classList.remove('vp-active');
      }
    });
  }

  /**
   * Toggle subtitle menu
   */
  private toggleSubtitleMenu(): void {
    if (!this.controlsContainer) return;

    const subtitleMenu = this.controlsContainer.querySelector('.vp-subtitle-menu') as HTMLElement;
    if (!subtitleMenu) return;

    const isVisible = subtitleMenu.style.display !== 'none';
    subtitleMenu.style.display = isVisible ? 'none' : 'block';

    // Update active subtitle item when opening
    if (!isVisible) {
      this.updateSubtitleMenuUI();
    }
  }

  /**
   * Update subtitle menu UI to show active subtitle
   */
  private updateSubtitleMenuUI(): void {
    if (!this.controlsContainer) return;

    const items = this.controlsContainer.querySelectorAll('.vp-subtitle-menu-item');
    items.forEach((item) => {
      const lang = item.getAttribute('data-lang');
      if (lang === this.currentSubtitle || (lang === 'off' && !this.currentSubtitle)) {
        item.classList.add('vp-active');
      } else {
        item.classList.remove('vp-active');
      }
    });
  }

  /**
   * Handle progress bar hover to show preview
   */
  private handleProgressHover(e: MouseEvent): void {
    if (!this.controlsContainer || isNaN(this.videoElement.duration)) return;

    const progressContainer = e.currentTarget as HTMLElement;
    const preview = this.controlsContainer.querySelector('.vp-progress-preview') as HTMLElement;
    const previewTime = this.controlsContainer.querySelector('.vp-progress-preview-time') as HTMLElement;
    if (!preview || !previewTime) return;

    // Calculate position
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * this.videoElement.duration;

    // Update preview time
    previewTime.textContent = this.formatTime(time);

    // Update thumbnail if available
    if (this.options.enableThumbnails) {
      void this.updateThumbnailPreview(time);
    }

    // Position preview
    const previewWidth = preview.offsetWidth;
    let leftPos = (e.clientX - rect.left) - (previewWidth / 2);
    
    // Keep preview within bounds
    leftPos = Math.max(0, Math.min(leftPos, rect.width - previewWidth));
    
    preview.style.left = `${leftPos}px`;
    preview.style.display = 'block';
  }

  /**
   * Hide progress preview
   */
  private hideProgressPreview(): void {
    if (!this.controlsContainer) return;

    const preview = this.controlsContainer.querySelector('.vp-progress-preview') as HTMLElement;
    if (preview) {
      preview.style.display = 'none';
    }
  }

  /**
   * Generate thumbnails from video
   */
  private async generateThumbnails(): Promise<void> {
    // Initialize canvas for capturing frames
    if (!this.thumbnailCanvas) {
      this.thumbnailCanvas = document.createElement('canvas');
      this.thumbnailCanvas.width = 160;
      this.thumbnailCanvas.height = 90;
    }
  }

  /**
   * Capture thumbnail on-demand at specific time
   */
  private async captureThumbnailOnDemand(time: number): Promise<string | null> {
    if (!this.thumbnailCanvas) {
      this.thumbnailCanvas = document.createElement('canvas');
      this.thumbnailCanvas.width = 160;
      this.thumbnailCanvas.height = 90;
    }

    const ctx = this.thumbnailCanvas.getContext('2d');
    if (!ctx) return null;

    return new Promise((resolve) => {
      // Create a temporary video element for thumbnail capture
      const tempVideo = document.createElement('video');
      tempVideo.src = this.videoElement.src;
      tempVideo.crossOrigin = 'anonymous';
      tempVideo.muted = true;
      tempVideo.preload = 'metadata';
      
      let resolved = false;
      
      const cleanup = () => {
        tempVideo.removeEventListener('seeked', captureFrame);
        tempVideo.removeEventListener('loadedmetadata', onMetadataLoaded);
        tempVideo.removeEventListener('error', onError);
        tempVideo.src = '';
      };

      const captureFrame = () => {
        if (resolved) return;
        resolved = true;
        
        try {
          // Draw current frame to canvas
          ctx.drawImage(tempVideo, 0, 0, this.thumbnailCanvas!.width, this.thumbnailCanvas!.height);
          
          // Store as data URL
          const dataUrl = this.thumbnailCanvas!.toDataURL('image/jpeg', 0.7);
          
          cleanup();
          resolve(dataUrl);
        } catch (error) {
          console.error('Error capturing thumbnail:', error);
          cleanup();
          resolve(null);
        }
      };

      const onMetadataLoaded = () => {
        tempVideo.currentTime = time;
      };

      const onError = () => {
        if (resolved) return;
        resolved = true;
        console.error('Error loading video for thumbnail');
        cleanup();
        resolve(null);
      };

      // Set timeout to avoid hanging
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(null);
        }
      }, 3000);

      tempVideo.addEventListener('seeked', captureFrame);
      tempVideo.addEventListener('loadedmetadata', onMetadataLoaded);
      tempVideo.addEventListener('error', onError);
      tempVideo.load();
    });
  }

  /**
   * Update thumbnail in progress preview
   */
  private async updateThumbnailPreview(time: number): Promise<void> {
    if (!this.options.enableThumbnails || !this.controlsContainer) return;

    const thumbnail = this.controlsContainer.querySelector('.vp-progress-preview-thumbnail') as HTMLElement;
    if (!thumbnail) return;

    // Find nearest thumbnail time based on interval
    const interval = this.options.thumbnailInterval;
    const nearestTime = Math.floor(time / interval) * interval;
    
    // Check if we already have this thumbnail cached
    let thumbnailUrl = this.thumbnailCache.get(nearestTime) || null;
    
    if (!thumbnailUrl) {
      // Capture on-demand if not cached
      thumbnailUrl = await this.captureThumbnailOnDemand(nearestTime);
      if (thumbnailUrl) {
        this.thumbnailCache.set(nearestTime, thumbnailUrl);
      }
    }
    
    if (thumbnailUrl) {
      thumbnail.style.width = '160px';
      thumbnail.style.height = '90px';
      thumbnail.style.backgroundImage = `url(${thumbnailUrl})`;
      thumbnail.style.backgroundSize = 'cover';
      thumbnail.style.backgroundPosition = 'center';
    }
  }

  /**
   * Update play/pause button
   */
  private updatePlayPauseUI(): void {
    if (!this.controlsContainer) return;

    const playIcon = this.controlsContainer.querySelector('.vp-icon-play') as HTMLElement;
    const pauseIcon = this.controlsContainer.querySelector('.vp-icon-pause') as HTMLElement;

    if (this.videoElement.paused) {
      playIcon.style.display = 'inline';
      pauseIcon.style.display = 'none';
    } else {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'inline';
    }
  }

  /**
   * Toggle settings menu
   */
  private toggleSettingsMenu(): void {
    if (!this.controlsContainer) return;

    const settingsMenu = this.controlsContainer.querySelector('.vp-settings-menu') as HTMLElement;
    if (!settingsMenu) return;

    const isVisible = settingsMenu.style.display !== 'none';
    settingsMenu.style.display = isVisible ? 'none' : 'block';

    // Update active quality item when opening
    if (!isVisible) {
      this.updateQualityMenuUI();
    }
  }

  /**
   * Update quality menu UI to show active quality
   */
  private updateQualityMenuUI(): void {
    if (!this.controlsContainer) return;

    const items = this.controlsContainer.querySelectorAll('.vp-settings-menu-item');
    items.forEach((item) => {
      const quality = item.getAttribute('data-quality');
      if (quality === this.currentQuality) {
        item.classList.add('vp-active');
      } else {
        item.classList.remove('vp-active');
      }
    });
  }

  /**
   * Format time in MM:SS or HH:MM:SS
   */
  private formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Handle video errors
   */
  private handleError(): void {
    const error = this.videoElement.error;
    if (!error) return;

    const playerError: PlayerError = {
      code: error.code,
      message: error.message,
      details: error,
    };

    this.emitEvent('error');
    console.error('Video Player Error:', playerError);
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(eventType: PlayerEventType): void {
    const listeners = this.eventListeners.get(eventType);
    if (!listeners) return;

    const state = this.getState();
    listeners.forEach((callback) => callback(state));
  }

  // Public API

  /**
   * Play the video
   */
  public async play(): Promise<void> {
    try {
      await this.videoElement.play();
      this.updatePlayPauseUI();
      this.showPlayPauseAnimation(true);
      this.startHideControlsTimer();
    } catch (error) {
      console.error('Play error:', error);
    }
  }

  /**
   * Pause the video
   */
  public pause(): void {
    this.videoElement.pause();
    this.updatePlayPauseUI();
    this.showPlayPauseAnimation(false);
    this.clearHideControlsTimer();
    this.showControls();
  }

  /**
   * Toggle play/pause
   */
  public togglePlay(): void {
    if (this.videoElement.paused) {
      void this.play();
    } else {
      this.pause();
    }
  }

  /**
   * Seek to a specific time
   */
  public seek(time: number): void {
    this.videoElement.currentTime = Math.max(0, Math.min(time, this.videoElement.duration));
  }

  /**
   * Set volume (0-1)
   */
  public setVolume(volume: number): void {
    this.videoElement.volume = Math.max(0, Math.min(1, volume));
    if (volume > 0) {
      this.videoElement.muted = false;
    }
  }

  /**
   * Toggle mute
   */
  public toggleMute(): void {
    this.videoElement.muted = !this.videoElement.muted;
  }

  /**
   * Set playback rate
   */
  public setPlaybackRate(rate: number): void {
    this.videoElement.playbackRate = rate;
  }

  /**
   * Cycle through common playback rates
   */
  public cyclePlaybackRate(): void {
    const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const currentIndex = rates.indexOf(this.videoElement.playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    this.setPlaybackRate(rates[nextIndex] ?? 1);
  }

  /**
   * Set video quality
   */
  public setQuality(quality: string): void {
    const source = this.sources.find((s) => s.quality === quality);
    if (!source) return;

    const currentTime = this.videoElement.currentTime;
    const wasPlaying = !this.videoElement.paused;

    this.videoElement.src = source.src;
    this.videoElement.currentTime = currentTime;
    this.currentQuality = quality;

    if (wasPlaying) {
      void this.play();
    }

    this.updateQualityMenuUI();
    this.emitEvent('qualitychange');
  }

  /**
   * Set subtitle track
   */
  public setSubtitle(lang: string): void {
    const tracks = this.videoElement.textTracks;

    // Disable all tracks first
    for (let i = 0; i< tracks.length; i++) {
      tracks[i]!.mode = 'hidden';
    }

    // Enable the selected track
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i]!;
      if (track.language === lang) {
        track.mode = 'showing';
        this.currentSubtitle = lang;
        
        // Adjust position immediately if controls are visible
        const controlsVisible = this.container.classList.contains('vp-controls-visible');
        this.adjustSubtitlePosition(controlsVisible);
        
        this.updateSubtitleMenuUI();
        this.emitEvent('subtitlechange');
        return;
      }
    }
  }

  /**
   * Disable all subtitles
   */
  public disableSubtitles(): void {
    const tracks = this.videoElement.textTracks;

    for (let i = 0; i < tracks.length; i++) {
      tracks[i]!.mode = 'hidden';
    }

    this.currentSubtitle = null;
    this.updateSubtitleMenuUI();
    this.emitEvent('subtitlechange');
  }

  /**
   * Toggle fullscreen
   */
  public async toggleFullscreen(): Promise<void> {
    if (!this.options.enableFullscreen) return;

    try {
      if (!document.fullscreenElement) {
        await this.container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }

  /**
   * Toggle Picture-in-Picture
   */
  public async togglePIP(): Promise<void> {
    if (!this.options.enablePIP) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await this.videoElement.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PIP error:', error);
    }
  }

  /**
   * Get current player state
   */
  public getState(): PlayerState {
    return {
      playing: !this.videoElement.paused,
      currentTime: this.videoElement.currentTime,
      duration: this.videoElement.duration,
      volume: this.videoElement.volume,
      muted: this.videoElement.muted,
      playbackRate: this.videoElement.playbackRate,
      buffered: this.videoElement.buffered,
      ended: this.videoElement.ended,
      fullscreen: !!document.fullscreenElement,
      pip: !!document.pictureInPictureElement,
      quality: this.currentQuality ?? undefined,
    };
  }

  /**
   * Add event listener
   */
  public on(eventType: PlayerEventType, callback: EventCallback): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)?.add(callback);
    if (this.clickTimeout !== null) {
      clearTimeout(this.clickTimeout);
    }
  }

  /**
   * Remove event listener
   */
  public off(eventType: PlayerEventType, callback: EventCallback): void {
    this.eventListeners.get(eventType)?.delete(callback);
  }

  /**
   * Destroy the player
   */
  public destroy(): void {
    this.clearHideControlsTimer();
    this.videoElement.pause();
    this.videoElement.src = '';
    this.eventListeners.clear();
    this.thumbnailCache.clear();
    this.thumbnailCanvas = null;
    this.container.innerHTML = '';
  }
}
