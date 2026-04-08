import type { VideoSource } from '../types';

/**
 * Manages dropdown menus (quality, speed, subtitles) for the video player
 */
export class MenuManager {
  private controlsContainer: HTMLElement;
  private videoElement: HTMLVideoElement;
  private currentQuality: string | null;
  private currentSubtitle: string | null;
  private isAutoQuality: boolean;

  constructor(
    controlsContainer: HTMLElement,
    videoElement: HTMLVideoElement,
    _sources: VideoSource[],
    currentQuality: string | null,
    currentSubtitle: string | null,
    isAutoQuality: boolean
  ) {
    this.controlsContainer = controlsContainer;
    this.videoElement = videoElement;
    this.currentQuality = currentQuality;
    this.currentSubtitle = currentSubtitle;
    this.isAutoQuality = isAutoQuality;
  }

  /**
   * Update state references
   */
  public updateState(
    currentQuality: string | null,
    currentSubtitle: string | null,
    isAutoQuality: boolean
  ): void {
    this.currentQuality = currentQuality;
    this.currentSubtitle = currentSubtitle;
    this.isAutoQuality = isAutoQuality;
  }

  /**
   * Close all popup menus
   */
  public closeAll(): void {
    const speedMenu = this.controlsContainer.querySelector('.vp-speed-menu') as HTMLElement;
    const subtitleMenu = this.controlsContainer.querySelector('.vp-subtitle-menu') as HTMLElement;
    const settingsMenu = this.controlsContainer.querySelector('.vp-settings-menu') as HTMLElement;

    if (speedMenu) speedMenu.style.display = 'none';
    if (subtitleMenu) subtitleMenu.style.display = 'none';
    if (settingsMenu) settingsMenu.style.display = 'none';
  }

  /**
   * Toggle speed menu
   */
  public toggleSpeedMenu(): void {
    const speedMenu = this.controlsContainer.querySelector('.vp-speed-menu') as HTMLElement;
    if (!speedMenu) return;

    const isVisible = speedMenu.style.display !== 'none';

    if (!isVisible) {
      this.closeAll();
    }

    speedMenu.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
      this.updateSpeedMenu();
    }
  }

  /**
   * Update speed menu UI to show active speed
   */
  public updateSpeedMenu(): void {
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
  public toggleSubtitleMenu(): void {
    const subtitleMenu = this.controlsContainer.querySelector('.vp-subtitle-menu') as HTMLElement;
    if (!subtitleMenu) return;

    const isVisible = subtitleMenu.style.display !== 'none';

    if (!isVisible) {
      this.closeAll();
    }

    subtitleMenu.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
      this.updateSubtitleMenu();
    }
  }

  /**
   * Update subtitle menu UI to show active subtitle
   */
  public updateSubtitleMenu(): void {
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
   * Toggle settings menu
   */
  public toggleSettingsMenu(): void {
    const settingsMenu = this.controlsContainer.querySelector('.vp-settings-menu') as HTMLElement;
    if (!settingsMenu) return;

    const isVisible = settingsMenu.style.display !== 'none';

    if (!isVisible) {
      this.closeAll();
    }

    settingsMenu.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
      this.updateQualityMenu();
    }
  }

  /**
   * Update quality menu UI to show active quality
   */
  public updateQualityMenu(): void {
    const items = this.controlsContainer.querySelectorAll('.vp-settings-menu-item');
    const autoQualityDisplay = this.controlsContainer.querySelector('.vp-auto-quality-display');

    items.forEach((item) => {
      const quality = item.getAttribute('data-quality');

      if (this.isAutoQuality) {
        if (quality === 'auto') {
          item.classList.add('vp-active');
          if (autoQualityDisplay && this.currentQuality !== 'auto') {
            autoQualityDisplay.textContent = `(${this.currentQuality})`;
          }
        } else {
          item.classList.remove('vp-active');
        }
      } else {
        if (quality === this.currentQuality) {
          item.classList.add('vp-active');
        } else {
          item.classList.remove('vp-active');
        }
        if (autoQualityDisplay) {
          autoQualityDisplay.textContent = '';
        }
      }
    });
  }
}
