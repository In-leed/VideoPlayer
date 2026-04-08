import type { VideoSource } from '../types';

/**
 * Manages video quality selection and auto-quality switching
 */
export class QualityManager {
  private videoElement: HTMLVideoElement;
  private sources: VideoSource[];
  private currentQuality: string | null;
  private isAutoQuality: boolean = false;
  // @ts-expect-error - stored for potential logging/debugging
  private networkSpeed: number = 0;
  private qualityMonitorInterval: number | null = null;
  private onQualityChange: () => void;

  constructor(
    videoElement: HTMLVideoElement,
    sources: VideoSource[],
    currentQuality: string | null,
    onQualityChange: () => void
  ) {
    this.videoElement = videoElement;
    this.sources = sources;
    this.currentQuality = currentQuality;
    this.onQualityChange = onQualityChange;
  }

  /**
   * Get current quality
   */
  public getCurrentQuality(): string | null {
    return this.currentQuality;
  }

  /**
   * Check if auto quality is enabled
   */
  public isAuto(): boolean {
    return this.isAutoQuality;
  }

  /**
   * Set video quality
   */
  public setQuality(quality: string): void {
    if (quality === 'auto') {
      this.enableAutoQuality();
      return;
    }

    this.disableAutoQuality();

    const source = this.sources.find((s) => s.quality === quality);
    if (!source) return;

    const currentTime = this.videoElement.currentTime;
    const wasPlaying = !this.videoElement.paused;

    this.videoElement.src = source.src;
    this.videoElement.currentTime = currentTime;
    this.currentQuality = quality;

    if (wasPlaying) {
      void this.videoElement.play();
    }

    this.onQualityChange();
  }

  /**
   * Enable auto quality selection based on network speed
   */
  private enableAutoQuality(): void {
    this.isAutoQuality = true;
    this.currentQuality = 'auto';
    this.onQualityChange();
    this.startQualityMonitoring();
  }

  /**
   * Disable auto quality selection
   */
  private disableAutoQuality(): void {
    this.isAutoQuality = false;
    this.stopQualityMonitoring();
  }

  /**
   * Start monitoring network conditions
   */
  private startQualityMonitoring(): void {
    void this.detectAndSetQuality();

    this.qualityMonitorInterval = window.setInterval(() => {
      void this.detectAndSetQuality();
    }, 10000);
  }

  /**
   * Stop monitoring network conditions
   */
  private stopQualityMonitoring(): void {
    if (this.qualityMonitorInterval !== null) {
      clearInterval(this.qualityMonitorInterval);
      this.qualityMonitorInterval = null;
    }
  }

  /**
   * Detect network speed and set appropriate quality
   */
  private async detectAndSetQuality(): Promise<void> {
    if (!this.isAutoQuality) return;

    const speed = await this.measureNetworkSpeed();
    this.networkSpeed = speed;

    let selectedQuality: string | null = null;

    if (speed >= 5) {
      selectedQuality = this.getQualityByPriority(['1080p', '720p', '480p', '360p']);
    } else if (speed >= 2.5) {
      selectedQuality = this.getQualityByPriority(['720p', '480p', '360p', '1080p']);
    } else if (speed >= 1) {
      selectedQuality = this.getQualityByPriority(['480p', '360p', '720p']);
    } else {
      selectedQuality = this.getQualityByPriority(['360p', '480p']);
    }

    if (selectedQuality && selectedQuality !== this.currentQuality) {
      const source = this.sources.find((s) => s.quality === selectedQuality);
      if (source) {
        const currentTime = this.videoElement.currentTime;
        const wasPlaying = !this.videoElement.paused;

        this.videoElement.src = source.src;
        this.videoElement.currentTime = currentTime;
        this.currentQuality = selectedQuality;

        if (wasPlaying) {
          void this.videoElement.play();
        }

        this.onQualityChange();
      }
    }
  }

  /**
   * Get quality by priority list
   */
  private getQualityByPriority(priorities: string[]): string | null {
    for (const quality of priorities) {
      if (this.sources.some((s) => s.quality === quality)) {
        return quality;
      }
    }
    return this.sources[0]?.quality ?? null;
  }

  /**
   * Measure network speed in Mbps
   */
  private async measureNetworkSpeed(): Promise<number> {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.downlink) {
        return connection.downlink;
      }
    }

    try {
      const startTime = Date.now();
      await fetch(this.videoElement.src, {
        method: 'HEAD',
        cache: 'no-cache',
      });
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      if (duration < 0.1) return 10;
      if (duration < 0.3) return 5;
      if (duration < 0.6) return 2.5;
      if (duration < 1) return 1;
      return 0.5;
    } catch (error) {
      console.warn('Could not measure network speed:', error);
      return 2.5;
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stopQualityMonitoring();
  }
}
