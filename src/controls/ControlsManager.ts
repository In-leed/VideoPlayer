import type { VideoSource, SubtitleTrack, VideoPlayerOptions } from '../types';

/**
 * Manages the creation and lifecycle of video player controls
 */
export class ControlsManager {
  private container: HTMLElement;
  private videoElement: HTMLVideoElement;
  private controlsContainer: HTMLElement | null = null;
  private options: Required<VideoPlayerOptions>;
  private sources: VideoSource[];
  private subtitles: SubtitleTrack[];
  private hideControlsTimeout: number | null = null;

  constructor(
    container: HTMLElement,
    videoElement: HTMLVideoElement,
    options: Required<VideoPlayerOptions>,
    sources: VideoSource[],
    subtitles: SubtitleTrack[]
  ) {
    this.container = container;
    this.videoElement = videoElement;
    this.options = options;
    this.sources = sources;
    this.subtitles = subtitles;
  }

  /**
   * Create custom controls HTML
   */
  public createControls(): HTMLElement {
    this.controlsContainer = document.createElement('div');
    this.controlsContainer.className = 'vp-controls';
    this.controlsContainer.innerHTML = this.generateControlsHTML();
    return this.controlsContainer;
  }

  /**
   * Get controls container
   */
  public getControlsContainer(): HTMLElement | null {
    return this.controlsContainer;
  }

  /**
   * Generate controls HTML
   */
  private generateControlsHTML(): string {
    return `
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
          <span class="vp-current-time">0:00</span> <span class="vp-time-separator">/</span> <span class="vp-duration">0:00</span>
        </span>
        <div class="vp-spacer"></div>
        <div class="vp-right-controls">
        ${this.generateQualityMenuHTML()}
        ${this.generateSpeedMenuHTML()}
        ${this.generateSubtitleMenuHTML()}
        ${this.generatePIPButtonHTML()}
        ${this.generateFullscreenButtonHTML()}
        </div>
      </div>
    `;
  }

  /**
   * Generate quality menu HTML
   */
  private generateQualityMenuHTML(): string {
    if (!this.options.showQualitySelector || this.sources.length <= 1) {
      return '';
    }

    const qualityItems = this.sources
      .map(
        (s) =>
          `<button class="vp-settings-menu-item" data-quality="${s.quality ?? 'auto'}">${
            s.label ?? s.quality ?? 'Auto'
          }</button>`
      )
      .join('');

    return `
      <div class="vp-settings-container">
        <button class="vp-btn vp-settings" aria-label="Settings">
          <span class="material-symbols-outlined">settings</span>
        </button>
        <div class="vp-settings-menu" style="display: none;">
          <div class="vp-settings-menu-header">Quality</div>
          <button class="vp-settings-menu-item" data-quality="auto">Auto <span class="vp-auto-quality-display"></span></button>
          ${qualityItems}
        </div>
      </div>
    `;
  }

  /**
   * Generate speed menu HTML
   */
  private generateSpeedMenuHTML(): string {
    return `
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
    `;
  }

  /**
   * Generate subtitle menu HTML
   */
  private generateSubtitleMenuHTML(): string {
    if (this.subtitles.length === 0) {
      return '';
    }

    const subtitleItems = this.subtitles
      .map(
        (s) =>
          `<button class="vp-subtitle-menu-item" data-lang="${s.srclang}">${s.label}</button>`
      )
      .join('');

    return `
      <div class="vp-subtitle-container">
        <button class="vp-btn vp-subtitle" aria-label="Subtitles">
          <span class="material-symbols-outlined">closed_caption</span>
        </button>
        <div class="vp-subtitle-menu" style="display: none;">
          <div class="vp-subtitle-menu-header">Subtitles</div>
          <button class="vp-subtitle-menu-item" data-lang="off">Off</button>
          ${subtitleItems}
        </div>
      </div>
    `;
  }

  /**
   * Generate PIP button HTML
   */
  private generatePIPButtonHTML(): string {
    if (!this.options.enablePIP) {
      return '';
    }
    return '<button class="vp-btn vp-pip" aria-label="Picture in Picture"><span class="material-symbols-outlined">picture_in_picture_alt</span></button>';
  }

  /**
   * Generate fullscreen button HTML
   */
  private generateFullscreenButtonHTML(): string {
    if (!this.options.enableFullscreen) {
      return '';
    }
    return '<button class="vp-btn vp-fullscreen" aria-label="Fullscreen"><span class="material-symbols-outlined">fullscreen</span></button>';
  }

  /**
   * Setup auto-hide controls after inactivity
   */
  public setupAutoHide(
    showControls: () => void,
    hideControls: () => void
  ): void {
    showControls();

    const resetHideTimer = () => {
      showControls();
      this.startHideControlsTimer(hideControls);
    };

    this.container.addEventListener('mousemove', resetHideTimer);
    this.container.addEventListener('touchstart', resetHideTimer);
    this.container.addEventListener('click', resetHideTimer);

    this.controlsContainer?.addEventListener('mouseenter', () => {
      this.clearHideControlsTimer();
    });

    this.controlsContainer?.addEventListener('mouseleave', () => {
      this.startHideControlsTimer(hideControls);
    });

    this.videoElement.addEventListener('mouseleave', () => {
      hideControls();
    });
  }

  /**
   * Start timer to hide controls
   */
  private startHideControlsTimer(hideControls: () => void): void {
    this.clearHideControlsTimer();
    this.hideControlsTimeout = window.setTimeout(() => {
      hideControls();
    }, 2000);
  }

  /**
   * Clear hide controls timer
   */
  public clearHideControlsTimer(): void {
    if (this.hideControlsTimeout !== null) {
      clearTimeout(this.hideControlsTimeout);
      this.hideControlsTimeout = null;
    }
  }

  /**
   * Create animation icon
   */
  public createAnimationIcon(): HTMLElement {
    const animationIcon = document.createElement('div');
    animationIcon.className = 'vp-animation-icon';
    animationIcon.innerHTML =
      '<div class="vp-animation-icon-content"><span class="material-symbols-outlined"></span></div>';
    return animationIcon;
  }
}
