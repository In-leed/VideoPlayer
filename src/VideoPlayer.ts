import type {
  VideoPlayerOptions,
  VideoSource,
  PlayerState,
  PlayerEventType,
  EventCallback,
  PlayerError,
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
    } as Required<VideoPlayerOptions>;

    this.eventListeners = new Map();
    this.sources = Array.isArray(this.options.src)
      ? this.options.src
      : [{ src: this.options.src }];

    // Initialize player
    this.videoElement = this.createVideoElement();
    this.container.appendChild(this.videoElement);

    if (this.options.controls) {
      this.createControls();
    }

    this.createAnimationIcon();
    this.attachEventListeners();
    this.setupKeyboardShortcuts();
    this.applyTheme();
  }

  /**
   * Create the video element
   */
  private createVideoElement(): HTMLVideoElement {
    const video = document.createElement('video');
    video.className = 'vp-video';
    
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
        <input type="range" class="vp-progress" min="0" max="100" value="0" step="0.1">
        <div class="vp-buffer"></div>
      </div>
      <div class="vp-controls-bottom">
        <button class="vp-btn vp-play-pause" aria-label="Play/Pause">
          <span class="vp-icon-play material-symbols-outlined">play_arrow</span>
          <span class="vp-icon-pause material-symbols-outlined" style="display: none;">pause</span>
        </button>
        <button class="vp-btn vp-volume" aria-label="Volume">
          <span class="vp-icon-volume material-symbols-outlined">volume_up</span>
          <span class="vp-icon-muted material-symbols-outlined" style="display: none;">volume_off</span>
        </button>
        <input type="range" class="vp-volume-slider" min="0" max="1" step="0.01" value="${this.options.volume}">
        <span class="vp-time">
          <span class="vp-current-time">0:00</span> / <span class="vp-duration">0:00</span>
        </span>
        <div class="vp-spacer"></div>
        ${
          this.options.showQualitySelector && this.sources.length > 1
            ? `<select class="vp-quality-selector">
                ${this.sources
                  .map(
                    (s) =>
                      `<option value="${s.quality ?? 'auto'}">${s.label ?? s.quality ?? 'Auto'}</option>`
                  )
                  .join('')}
              </select>`
            : ''
        }
        <button class="vp-btn vp-playback-rate" aria-label="Playback Rate">1x</button>
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
    `;

    this.container.appendChild(this.controlsContainer);
    this.attachControlsListeners();
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

    // Volume
    const volumeBtn = this.controlsContainer.querySelector('.vp-volume');
    volumeBtn?.addEventListener('click', () => this.toggleMute());

    const volumeSlider = this.controlsContainer.querySelector('.vp-volume-slider') as HTMLInputElement;
    volumeSlider?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.setVolume(parseFloat(target.value));
    });

    // Quality selector
    const qualitySelector = this.controlsContainer.querySelector('.vp-quality-selector') as HTMLSelectElement;
    qualitySelector?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.setQuality(target.value);
    });

    // Playback rate
    const rateBtn = this.controlsContainer.querySelector('.vp-playback-rate');
    rateBtn?.addEventListener('click', () => this.cyclePlaybackRate());

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
    this.videoElement.addEventListener('loadedmetadata', () => this.updateDuration());

    // Fullscreen change
    document.addEventListener('fullscreenchange', () => this.emitEvent('fullscreenchange'));

    // PIP change
    this.videoElement.addEventListener('enterpictureinpicture', () => this.emitEvent('pipchange'));
    this.videoElement.addEventListener('leavepictureinpicture', () => this.emitEvent('pipchange'));

    // Click on video to play/pause
    this.videoElement.addEventListener('click', () => {
      const willPlay = this.videoElement.paused;
      this.showPlayPauseAnimation(willPlay);
      this.togglePlay();
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
    animationIcon.innerHTML = '<div class="vp-animation-icon-content"><span class="material-symbols-outlined"></span></div>';
    this.container.appendChild(animationIcon);
  }

  /**
   * Show play/pause animation
   */
  private showPlayPauseAnimation(isPlaying: boolean): void {
    const animationIcon = this.container.querySelector('.vp-animation-icon') as HTMLElement;
    const iconContent = this.container.querySelector('.vp-animation-icon-content .material-symbols-outlined') as HTMLElement;
    
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

    const volumeSlider = this.controlsContainer.querySelector('.vp-volume-slider') as HTMLInputElement;
    const volumeIcon = this.controlsContainer.querySelector('.vp-icon-volume') as HTMLElement;
    const mutedIcon = this.controlsContainer.querySelector('.vp-icon-muted') as HTMLElement;

    if (volumeSlider) {
      volumeSlider.value = this.videoElement.volume.toString();
      const volumePercent = this.videoElement.volume * 100;
      volumeSlider.style.setProperty('--volume', `${volumePercent}%`);
    }

    if (this.videoElement.muted || this.videoElement.volume === 0) {
      volumeIcon.style.display = 'none';
      mutedIcon.style.display = 'inline';
    } else {
      volumeIcon.style.display = 'inline';
      mutedIcon.style.display = 'none';
    }
  }

  /**
   * Update playback rate UI
   */
  private updateRateUI(): void {
    if (!this.controlsContainer) return;

    const rateBtn = this.controlsContainer.querySelector('.vp-playback-rate');
    if (rateBtn) {
      rateBtn.textContent = `${this.videoElement.playbackRate}x`;
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

    this.emitEvent('qualitychange');
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
    this.videoElement.pause();
    this.videoElement.src = '';
    this.eventListeners.clear();
    this.container.innerHTML = '';
  }
}
