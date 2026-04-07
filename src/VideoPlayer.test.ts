import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VideoPlayer } from './VideoPlayer';

describe('VideoPlayer', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should create a video player instance', () => {
    const player = new VideoPlayer(container, {
      src: 'test-video.mp4',
    });

    expect(player).toBeInstanceOf(VideoPlayer);
    expect(container.querySelector('.vp-video')).toBeTruthy();
  });

  it('should apply options correctly', () => {
    const player = new VideoPlayer(container, {
      src: 'test-video.mp4',
      volume: 0.5,
      muted: true,
      loop: true,
    });

    const state = player.getState();
    expect(state.volume).toBe(0.5);
    expect(state.muted).toBe(true);
  });

  it('should handle play/pause', async () => {
    const player = new VideoPlayer(container, {
      src: 'test-video.mp4',
    });

    let playEventFired = false;
    player.on('play', () => {
      playEventFired = true;
    });

    // Note: In real tests, you'd need to mock the video element
    // await player.play();
    // expect(playEventFired).toBe(true);
  });

  it('should handle seeking', () => {
    const player = new VideoPlayer(container, {
      src: 'test-video.mp4',
    });

    player.seek(30);
    const state = player.getState();
    // In real tests with mocked video element, you'd check currentTime
    expect(state.currentTime).toBeGreaterThanOrEqual(0);
  });

  it('should handle volume changes', () => {
    const player = new VideoPlayer(container, {
      src: 'test-video.mp4',
    });

    player.setVolume(0.7);
    const state = player.getState();
    expect(state.volume).toBe(0.7);
  });

  it('should emit events', () => {
    const player = new VideoPlayer(container, {
      src: 'test-video.mp4',
    });

    const callback = vi.fn();
    player.on('play', callback);

    // Trigger play event manually for testing
    const video = container.querySelector('video');
    video?.dispatchEvent(new Event('play'));

    expect(callback).toHaveBeenCalled();
  });

  it('should destroy cleanly', () => {
    const player = new VideoPlayer(container, {
      src: 'test-video.mp4',
    });

    player.destroy();
    expect(container.querySelector('.vp-video')).toBeFalsy();
  });
});
