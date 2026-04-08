import type {
  VideoPlayerOptions,
  VideoSource,
  PlayerState,
  PlayerEventType,
  EventCallback,
  PlayerError,
  SubtitleTrack,
} from './types';
import { EventManager } from './events/EventManager';
import { UIManager } from './ui/UIManager';
import { MenuManager } from './menu/MenuManager';
import { QualityManager } from './quality/QualityManager';
import { ThumbnailManager } from './thumbnail/ThumbnailManager';
import { ControlsManager } from './controls/ControlsManager';
import { clamp } from './utils/helpers';

/**
 * Modern HTML5 Video Player with custom controls
 */
export class VideoPlayer {
  private container: HTMLElement;
  private videoElement: HTMLVideoElement;
  private options: Required<VideoPlayerOptions>;
  private sources: VideoSource[];
  private subtitles: SubtitleTrack[];
  private currentSubtitle: string | null = null;
  private clickTimeout: number | null = null;

  // Managers
  private eventManager: EventManager;
  private uiManager: UIManager | null = null;
  private menuManager: MenuManager | null = null;
  private qualityManager: QualityManager;
  private thumbnailManager: ThumbnailManager | null = null;
  private controlsManager: ControlsManager | null = null;

  constructor(container: HTMLElement | string, options: VideoPlayerOptions) {
    // Get container element
    this.container = this.resolveContainer(container);

    // Set default options
    this.options = this.setDefaultOptions(options);

    // Initialize sources and subtitles
    this.sources = Array.isArray(this.options.src) ? this.options.src : [{ src: this.options.src }];
    this.subtitles = this.options.subtitles ?? [];

    // Initialize event manager
    this.eventManager = new EventManager();

    // Create video element
    this.videoElement = this.createVideoElement();
    this.container.appendChild(this.videoElement);

    // Initialize quality manager
    const currentQuality = this.sources[0]?.quality ?? null;
    this.qualityManager = new QualityManager(
      this.videoElement,
      this.sources,
      currentQuality,
      () => this.handleQualityChange()
    );

    // Create controls if enabled
    if (this.options.controls) {
      this.initializeControls();
    }

    // Attach event listeners
    this.attachVideoEventListeners();
    this.setupKeyboardShortcuts();
    this.applyTheme();

    // Enable auto quality by default if multiple sources available
    if (this.sources.length > 1) {
      this.qualityManager.setQuality('auto');
    }
  }

  /**
   * Resolve container from string or element
   */
  private resolveContainer(container: HTMLElement | string): HTMLElement {
    if (typeof container === 'string') {
      const element = document.querySelector(container);
      if (!element) {
        throw new Error(`Container not found: ${container}`);
      }
      return element as HTMLElement;
    }
    return container;
  }

  /**
   * Set default options
   */
  private setDefaultOptions(options: VideoPlayerOptions): Required<VideoPlayerOptions> {
    return {
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
      customStyles: options.customStyles,
    } as Required<VideoPlayerOptions>;
  }

  /**
   * Create the video element
   */
  private createVideoElement(): HTMLVideoElement {
    const video = document.createElement('video');
    video.className = 'vp-video';

    if (this.options.enableThumbnails) {
      video.crossOrigin = 'anonymous';
    }

    const initialSource = this.sources[0];
    if (initialSource) {
      video.src = initialSource.src;
      if (initialSource.type) {
        video.setAttribute('type', initialSource.type);
      }
    }

    if (this.options.poster) {
      video.poster = this.options.poster;
    }

    video.autoplay = this.options.autoplay;
    video.loop = this.options.loop;
    video.muted = this.options.muted;
    video.volume = this.options.volume;
    video.playbackRate = this.options.playbackRate;

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
   * Initialize controls and managers
   */
  private initializeControls(): void {
    this.controlsManager = new ControlsManager(
      this.container,
      this.videoElement,
      this.options,
      this.sources,
      this.subtitles
    );

    const controlsElement = this.controlsManager.createControls();
    this.container.appendChild(controlsElement);

    const animationIcon = this.controlsManager.createAnimationIcon();
    this.container.appendChild(animationIcon);

    const controlsContainer = this.controlsManager.getControlsContainer()!;

    // Initialize UI Manager
    this.uiManager = new UIManager(controlsContainer, this.videoElement);

    // Initialize Menu Manager
    this.menuManager = new MenuManager(
      controlsContainer,
      this.videoElement,
      this.sources,
      this.qualityManager.getCurrentQuality(),
      this.currentSubtitle,
      this.qualityManager.isAuto()
    );

    // Initialize Thumbnail Manager
    this.thumbnailManager = new ThumbnailManager(
      this.videoElement,
      controlsContainer,
      this.options.enableThumbnails,
      this.options.thumbnailInterval
    );
    this.thumbnailManager.initialize();

    // Attach control event listeners
    this.attachControlsListeners();

    // Setup auto-hide
    this.controlsManager.setupAutoHide(
      () => this.showControls(),
      () => this.hideControls()
    );

    // Update initial menu states
    this.menuManager.updateQualityMenu();
    this.menuManager.updateSpeedMenu();
    this.menuManager.updateSubtitleMenu();
  }

  /**
   * Attach event listeners to controls
   */
  private attachControlsListeners(): void {
    const controlsContainer = this.controlsManager?.getControlsContainer();
    if (!controlsContainer) return;

    // Play/Pause
    controlsContainer.querySelector('.vp-play-pause')?.addEventListener('click', () => this.togglePlay());

    // Progress
    const progressBar = controlsContainer.querySelector('.vp-progress') as HTMLInputElement;
    progressBar?.addEventListener('input', (e) => {
      const time = (parseFloat((e.target as HTMLInputElement).value) / 100) * this.videoElement.duration;
      this.seek(time);
    });

    // Progress hover
    const progressContainer = controlsContainer.querySelector('.vp-progress-container') as HTMLElement;
    progressContainer?.addEventListener('mousemove', (e) => this.thumbnailManager?.handleProgressHover(e));
    progressContainer?.addEventListener('mouseleave', () => this.thumbnailManager?.hideProgressPreview());

    // Volume
    controlsContainer.querySelector('.vp-volume')?.addEventListener('click', () => this.toggleMute());
    
    const volumeSlider = controlsContainer.querySelector('.vp-volume-slider') as HTMLInputElement;
    volumeSlider?.addEventListener('input', (e) => {
      this.setVolume(parseFloat((e.target as HTMLInputElement).value));
    });

    // Settings menu
    controlsContainer.querySelector('.vp-settings')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.menuManager?.toggleSettingsMenu();
    });

    // Quality selection
    controlsContainer.querySelectorAll('.vp-settings-menu-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        const quality = (e.target as HTMLElement).getAttribute('data-quality');
        if (quality) {
          this.qualityManager.setQuality(quality);
          this.menuManager?.toggleSettingsMenu();
        }
      });
    });

    // Speed menu
    controlsContainer.querySelector('.vp-speed')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.menuManager?.toggleSpeedMenu();
    });

    // Speed selection
    controlsContainer.querySelectorAll('.vp-speed-menu-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        const rate = (e.target as HTMLElement).getAttribute('data-rate');
        if (rate) {
          this.setPlaybackRate(parseFloat(rate));
          this.menuManager?.toggleSpeedMenu();
        }
      });
    });

    // Subtitle menu
    controlsContainer.querySelector('.vp-subtitle')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.menuManager?.toggleSubtitleMenu();
    });

    // Subtitle selection
    controlsContainer.querySelectorAll('.vp-subtitle-menu-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        const lang = (e.target as HTMLElement).getAttribute('data-lang');
        if (lang) {
          lang === 'off' ? this.disableSubtitles() : this.setSubtitle(lang);
          this.menuManager?.toggleSubtitleMenu();
        }
      });
    });

    // PIP
    controlsContainer.querySelector('.vp-pip')?.addEventListener('click', () => void this.togglePIP());

    // Fullscreen
    controlsContainer.querySelector('.vp-fullscreen')?.addEventListener('click', () => void this.toggleFullscreen());

    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.vp-settings-container') && 
          !target.closest('.vp-speed-container') && 
          !target.closest('.vp-subtitle-container')) {
        this.menuManager?.closeAll();
      }
    });
  }

  /**
   * Attach video element event listeners
   */
  private attachVideoEventListeners(): void {
    this.videoElement.addEventListener('play', () => this.emitEvent('play'));
    this.videoElement.addEventListener('pause', () => this.emitEvent('pause'));
    this.videoElement.addEventListener('ended', () => this.emitEvent('ended'));
    this.videoElement.addEventListener('timeupdate', () => {
      this.uiManager?.updateProgress();
      this.emitEvent('timeupdate');
    });
    this.videoElement.addEventListener('volumechange', () => {
      this.uiManager?.updateVolume();
      this.emitEvent('volumechange');
    });
    this.videoElement.addEventListener('ratechange', () => {
      this.menuManager?.updateSpeedMenu();
      this.emitEvent('ratechange');
    });
    this.videoElement.addEventListener('seeking', () => this.emitEvent('seeking'));
    this.videoElement.addEventListener('seeked', () => this.emitEvent('seeked'));
    this.videoElement.addEventListener('waiting', () => this.emitEvent('waiting'));
    this.videoElement.addEventListener('canplay', () => this.emitEvent('canplay'));
    this.videoElement.addEventListener('error', () => this.handleError());
    this.videoElement.addEventListener('progress', () => this.uiManager?.updateBuffer());
    this.videoElement.addEventListener('loadedmetadata', () => {
      this.uiManager?.updateDuration();
    });

    // Text tracks
    this.videoElement.textTracks.addEventListener('change', () => {
      const controlsVisible = this.container.classList.contains('vp-controls-visible');
      this.adjustSubtitlePosition(controlsVisible);
    });

    // Fullscreen and PIP
    document.addEventListener('fullscreenchange', () => this.emitEvent('fullscreenchange'));
    this.videoElement.addEventListener('enterpictureinpicture', () => this.emitEvent('pipchange'));
    this.videoElement.addEventListener('leavepictureinpicture', () => this.emitEvent('pipchange'));

    // Click handlers
    this.videoElement.addEventListener('click', () => {
      if (this.clickTimeout !== null) {
        clearTimeout(this.clickTimeout);
        this.clickTimeout = null;
        return;
      }

      this.clickTimeout = window.setTimeout(() => {
        this.clickTimeout = null;
        const willPlay = this.videoElement.paused;
        this.uiManager?.showPlayPauseAnimation(this.container, willPlay);
        this.togglePlay();
      }, 250);
    });

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
          this.uiManager?.showPlayPauseAnimation(this.container, this.videoElement.paused);
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
            cue.line = controlsVisible ? -5 : -1;
          }
        }
      }
    }
  }

  /**
   * Apply theme and custom styles
   */
  private applyTheme(): void {
    this.container.classList.add('vp-container');
    this.applyCustomStyles();
  }

  /**
   * Apply custom styles from options
   */
  private applyCustomStyles(): void {
    if (!this.options.customStyles) return;

    const styles = this.options.customStyles;
    const styleMap: Record<string, string | undefined> = {
      '--vp-primary-color': styles.primaryColor,
      '--vp-button-bg': styles.buttonBackground,
      '--vp-button-bg-hover': styles.buttonBackgroundHover,
      '--vp-button-color': styles.buttonColor,
      '--vp-button-border': styles.buttonBorder,
      '--vp-button-border-radius': styles.buttonBorderRadius,
      '--vp-progress-color': styles.progressColor,
      '--vp-progress-bg': styles.progressBackground,
      '--vp-controls-bg': styles.controlsBackground,
      '--vp-volume-color': styles.volumeColor,
      '--vp-menu-bg': styles.menuBackground,
      '--vp-menu-color': styles.menuColor,
      '--vp-menu-item-hover-bg': styles.menuItemHoverBackground,
      '--vp-active-menu-item-color': styles.activeMenuItemColor,
    };

    Object.entries(styleMap).forEach(([property, value]) => {
      if (value) {
        this.container.style.setProperty(property, value);
      }
    });
  }

  /**
   * Handle quality change event
   */
  private handleQualityChange(): void {
    this.menuManager?.updateState(
      this.qualityManager.getCurrentQuality(),
      this.currentSubtitle,
      this.qualityManager.isAuto()
    );
    this.menuManager?.updateQualityMenu();
    this.emitEvent('qualitychange');
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
    this.eventManager.emit(eventType, this.getState());
  }

  // Public API

  /**
   * Play the video
   */
  public async play(): Promise<void> {
    try {
      await this.videoElement.play();
      this.uiManager?.updatePlayPause();
      this.uiManager?.showPlayPauseAnimation(this.container, true);
      this.controlsManager?.clearHideControlsTimer();
    } catch (error) {
      console.error('Play error:', error);
    }
  }

  /**
   * Pause the video
   */
  public pause(): void {
    this.videoElement.pause();
    this.uiManager?.updatePlayPause();
    this.uiManager?.showPlayPauseAnimation(this.container, false);
    this.controlsManager?.clearHideControlsTimer();
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
    this.videoElement.currentTime = clamp(time, 0, this.videoElement.duration);
  }

  /**
   * Set volume (0-1)
   */
  public setVolume(volume: number): void {
    this.videoElement.volume = clamp(volume, 0, 1);
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
    this.qualityManager.setQuality(quality);
  }

  /**
   * Set subtitle track
   */
  public setSubtitle(lang: string): void {
    const tracks = this.videoElement.textTracks;

    for (let i = 0; i < tracks.length; i++) {
      tracks[i]!.mode = 'hidden';
    }

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i]!;
      if (track.language === lang) {
        track.mode = 'showing';
        this.currentSubtitle = lang;
        this.menuManager?.updateState(
          this.qualityManager.getCurrentQuality(),
          this.currentSubtitle,
          this.qualityManager.isAuto()
        );
        this.menuManager?.updateSubtitleMenu();
        this.emitEvent('subtitlechange');
        this.adjustSubtitlePosition(this.container.classList.contains('vp-controls-visible'));
        break;
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
    this.menuManager?.updateState(
      this.qualityManager.getCurrentQuality(),
      this.currentSubtitle,
      this.qualityManager.isAuto()
    );
    this.menuManager?.updateSubtitleMenu();
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
      quality: this.qualityManager.getCurrentQuality() ?? undefined,
    };
  }

  /**
   * Add event listener
   */
  public on(eventType: PlayerEventType, callback: EventCallback): void {
    this.eventManager.on(eventType, callback);
  }

  /**
   * Remove event listener
   */
  public off(eventType: PlayerEventType, callback: EventCallback): void {
    this.eventManager.off(eventType, callback);
  }

  /**
   * Destroy the player
   */
  public destroy(): void {
    this.controlsManager?.clearHideControlsTimer();
    this.qualityManager.destroy();
    this.thumbnailManager?.clearCache();
    this.videoElement.pause();
    this.videoElement.src = '';
    this.eventManager.clear();
    this.container.innerHTML = '';
  }
}
