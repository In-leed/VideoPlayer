import { formatTime } from '../utils/helpers';

/**
 * Manages UI updates for the video player controls
 */
export class UIManager {
  private controlsContainer: HTMLElement;
  private videoElement: HTMLVideoElement;

  constructor(controlsContainer: HTMLElement, videoElement: HTMLVideoElement) {
    this.controlsContainer = controlsContainer;
    this.videoElement = videoElement;
  }

  /**
   * Update progress bar and current time display
   */
  public updateProgress(): void {
    const progressBar = this.controlsContainer.querySelector('.vp-progress') as HTMLInputElement;
    const currentTimeSpan = this.controlsContainer.querySelector('.vp-current-time');

    if (progressBar && !isNaN(this.videoElement.duration)) {
      const progress = (this.videoElement.currentTime / this.videoElement.duration) * 100;
      progressBar.value = progress.toString();
      progressBar.style.setProperty('--progress', `${progress}%`);
    }

    if (currentTimeSpan) {
      currentTimeSpan.textContent = formatTime(this.videoElement.currentTime);
    }
  }

  /**
   * Update buffer bar
   */
  public updateBuffer(): void {
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
  public updateDuration(): void {
    const durationSpan = this.controlsContainer.querySelector('.vp-duration');
    if (durationSpan) {
      durationSpan.textContent = formatTime(this.videoElement.duration);
    }
  }

  /**
   * Update volume UI (slider and icon)
   */
  public updateVolume(): void {
    const volumeSlider = this.controlsContainer.querySelector('.vp-volume-slider') as HTMLInputElement;
    const volumeHighIcon = this.controlsContainer.querySelector('.vp-icon-volume-high') as HTMLElement;
    const volumeLowIcon = this.controlsContainer.querySelector('.vp-icon-volume-low') as HTMLElement;
    const volumeMutedIcon = this.controlsContainer.querySelector('.vp-icon-volume-muted') as HTMLElement;

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
   * Update play/pause button
   */
  public updatePlayPause(): void {
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
   * Show play/pause animation overlay
   */
  public showPlayPauseAnimation(container: HTMLElement, isPlaying: boolean): void {
    const animationIcon = container.querySelector('.vp-animation-icon') as HTMLElement;
    const iconContent = container.querySelector(
      '.vp-animation-icon-content .material-symbols-outlined'
    ) as HTMLElement;

    if (!animationIcon || !iconContent) return;

    iconContent.textContent = isPlaying ? 'play_arrow' : 'pause';
    animationIcon.classList.remove('vp-animation-show');
    void animationIcon.offsetWidth; // Trigger reflow
    animationIcon.classList.add('vp-animation-show');

    setTimeout(() => {
      animationIcon.classList.remove('vp-animation-show');
    }, 500);
  }
}
