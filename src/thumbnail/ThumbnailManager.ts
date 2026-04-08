import { formatTime } from '../utils/helpers';

/**
 * Manages thumbnail generation and preview for the progress bar
 */
export class ThumbnailManager {
  private videoElement: HTMLVideoElement;
  private controlsContainer: HTMLElement;
  private thumbnailCanvas: HTMLCanvasElement | null = null;
  private thumbnailCache: Map<number, string> = new Map();
  private enableThumbnails: boolean;
  private thumbnailInterval: number;

  constructor(
    videoElement: HTMLVideoElement,
    controlsContainer: HTMLElement,
    enableThumbnails: boolean,
    thumbnailInterval: number
  ) {
    this.videoElement = videoElement;
    this.controlsContainer = controlsContainer;
    this.enableThumbnails = enableThumbnails;
    this.thumbnailInterval = thumbnailInterval;
  }

  /**
   * Initialize thumbnail canvas
   */
  public initialize(): void {
    if (!this.enableThumbnails) return;

    if (!this.thumbnailCanvas) {
      this.thumbnailCanvas = document.createElement('canvas');
      this.thumbnailCanvas.width = 160;
      this.thumbnailCanvas.height = 90;
    }
  }

  /**
   * Handle progress bar hover to show preview
   */
  public handleProgressHover(e: MouseEvent): void {
    if (isNaN(this.videoElement.duration)) return;

    const progressContainer = e.currentTarget as HTMLElement;
    const preview = this.controlsContainer.querySelector('.vp-progress-preview') as HTMLElement;
    const previewTime = this.controlsContainer.querySelector(
      '.vp-progress-preview-time'
    ) as HTMLElement;
    
    if (!preview || !previewTime) return;

    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * this.videoElement.duration;

    previewTime.textContent = formatTime(time);

    if (this.enableThumbnails) {
      void this.updateThumbnailPreview(time);
    }

    const previewWidth = preview.offsetWidth;
    let leftPos = e.clientX - rect.left - previewWidth / 2;
    leftPos = Math.max(0, Math.min(leftPos, rect.width - previewWidth));

    preview.style.left = `${leftPos}px`;
    preview.style.display = 'block';
  }

  /**
   * Hide progress preview
   */
  public hideProgressPreview(): void {
    const preview = this.controlsContainer.querySelector('.vp-progress-preview') as HTMLElement;
    if (preview) {
      preview.style.display = 'none';
    }
  }

  /**
   * Update thumbnail in progress preview
   */
  private async updateThumbnailPreview(time: number): Promise<void> {
    if (!this.enableThumbnails) return;

    const thumbnail = this.controlsContainer.querySelector(
      '.vp-progress-preview-thumbnail'
    ) as HTMLElement;
    
    if (!thumbnail) return;

    const nearestTime = Math.floor(time / this.thumbnailInterval) * this.thumbnailInterval;
    let thumbnailUrl = this.thumbnailCache.get(nearestTime) || null;

    if (!thumbnailUrl) {
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
          ctx.drawImage(tempVideo, 0, 0, this.thumbnailCanvas!.width, this.thumbnailCanvas!.height);
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
   * Clear thumbnail cache
   */
  public clearCache(): void {
    this.thumbnailCache.clear();
    this.thumbnailCanvas = null;
  }
}
