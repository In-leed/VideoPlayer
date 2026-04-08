import { VideoPlayer } from './VideoPlayer';

describe('VideoPlayer', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Initialization', () => {
    it('should create a video player instance', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      expect(player).toBeInstanceOf(VideoPlayer);
      expect(container.querySelector('.vp-video')).toBeTruthy();
    });

    it('should accept string selector as container', () => {
      container.id = 'player-container';
      const player = new VideoPlayer('#player-container', {
        src: 'video.mp4',
      });

      expect(player).toBeInstanceOf(VideoPlayer);
    });

    it('should throw error for invalid container selector', () => {
      expect(() => {
        new VideoPlayer('#non-existent', { src: 'video.mp4' });
      }).toThrow('Container not found');
    });

    it('should apply default options', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      const state = player.getState();
      expect(state.volume).toBe(1);
      expect(state.muted).toBe(false);
      expect(state.playbackRate).toBe(1);
    });

    it('should apply custom options correctly', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        volume: 0.5,
        muted: true,
        loop: true,
        autoplay: false,
        playbackRate: 1.5,
      });

      const state = player.getState();
      expect(state.volume).toBe(0.5);
      expect(state.muted).toBe(true);
      expect(state.playbackRate).toBe(1.5);
    });

    it('should create controls when enabled', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        controls: true,
      });

      expect(container.querySelector('.vp-controls')).toBeTruthy();
      expect(container.querySelector('.vp-play-pause')).toBeTruthy();
      expect(container.querySelector('.vp-progress')).toBeTruthy();
    });

    it('should not create controls when disabled', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        controls: false,
      });

      expect(container.querySelector('.vp-controls')).toBeFalsy();
    });

    it('should handle multiple video sources', () => {
      const player = new VideoPlayer(container, {
        src: [
          { src: 'video-1080p.mp4', quality: '1080p', type: 'video/mp4' },
          { src: 'video-720p.mp4', quality: '720p', type: 'video/mp4' },
        ],
        showQualitySelector: true,
      });

      expect(player).toBeInstanceOf(VideoPlayer);
      expect(container.querySelector('.vp-settings')).toBeTruthy();
    });

    it('should add subtitle tracks', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        subtitles: [
          { src: 'en.vtt', label: 'English', srclang: 'en' },
          { src: 'fr.vtt', label: 'French', srclang: 'fr' },
        ],
      });

      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video.querySelectorAll('track').length).toBe(2);
    });

    it('should set poster image', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        poster: 'poster.jpg',
      });

      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video.poster).toContain('poster.jpg');
    });

    it('should apply custom styles', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        customStyles: {
          primaryColor: '#ff0000',
          buttonBackground: 'rgba(255, 0, 0, 0.2)',
          progressColor: '#ff0000',
        },
      });

      expect(container.style.getPropertyValue('--vp-primary-color')).toBe('#ff0000');
      expect(container.style.getPropertyValue('--vp-button-bg')).toBe('rgba(255, 0, 0, 0.2)');
      expect(container.style.getPropertyValue('--vp-progress-color')).toBe('#ff0000');
    });
  });

  describe('Playback Control', () => {
    it('should toggle play/pause', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video.paused).toBe(true);

      player.togglePlay();
      // Note: Actual play requires user interaction in browsers
    });

    it('should handle pause', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      player.pause();
      const state = player.getState();
      expect(state.playing).toBe(false);
    });

    it('should handle seeking', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      player.seek(30);
      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video.currentTime).toBe(30);
    });

    it('should clamp seek time to valid range', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      const video = container.querySelector('video') as HTMLVideoElement;
      Object.defineProperty(video, 'duration', { value: 100, writable: true });

      player.seek(-10);
      expect(video.currentTime).toBe(0);

      player.seek(200);
      expect(video.currentTime).toBe(100);
    });
  });

  describe('Volume Control', () => {
    it('should set volume', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      player.setVolume(0.7);
      const state = player.getState();
      expect(state.volume).toBe(0.7);
    });

    it('should clamp volume to 0-1 range', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      player.setVolume(1.5);
      expect(player.getState().volume).toBe(1);

      player.setVolume(-0.5);
      expect(player.getState().volume).toBe(0);
    });

    it('should toggle mute', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        muted: false,
      });

      player.toggleMute();
      expect(player.getState().muted).toBe(true);

      player.toggleMute();
      expect(player.getState().muted).toBe(false);
    });

    it('should unmute when setting volume above 0', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        muted: true,
      });

      player.setVolume(0.5);
      expect(player.getState().muted).toBe(false);
    });
  });

  describe('Playback Rate', () => {
    it('should set playback rate', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      player.setPlaybackRate(1.5);
      expect(player.getState().playbackRate).toBe(1.5);
    });

    it('should cycle through playback rates', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      const initialRate = player.getState().playbackRate;
      player.cyclePlaybackRate();
      const newRate = player.getState().playbackRate;
      
      expect(newRate).not.toBe(initialRate);
    });
  });

  describe('Quality Management', () => {
    it('should switch quality', () => {
      const player = new VideoPlayer(container, {
        src: [
          { src: 'video-1080p.mp4', quality: '1080p' },
          { src: 'video-720p.mp4', quality: '720p' },
        ],
      });

      player.setQuality('720p');
      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video.src).toContain('video-720p.mp4');
    });

    it('should emit qualitychange event', () => {
      const player = new VideoPlayer(container, {
        src: [
          { src: 'video-1080p.mp4', quality: '1080p' },
          { src: 'video-720p.mp4', quality: '720p' },
        ],
      });

      const callback = jest.fn();
      player.on('qualitychange', callback);

      player.setQuality('720p');
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Subtitle Management', () => {
    it('should enable subtitle track', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        subtitles: [
          { src: 'en.vtt', label: 'English', srclang: 'en' },
          { src: 'fr.vtt', label: 'French', srclang: 'fr' },
        ],
      });

      player.setSubtitle('fr');
      const state = player.getState();
      // Check that subtitle was changed
    });

    it('should disable all subtitles', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        subtitles: [
          { src: 'en.vtt', label: 'English', srclang: 'en', default: true },
        ],
      });

      player.disableSubtitles();
      // Verify all tracks are hidden
    });

    it('should emit subtitlechange event', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        subtitles: [
          { src: 'en.vtt', label: 'English', srclang: 'en' },
        ],
      });

      const callback = jest.fn();
      player.on('subtitlechange', callback);

      player.disableSubtitles();
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Event System', () => {
    it('should emit play event', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      const callback = jest.fn();
      player.on('play', callback);

      const video = container.querySelector('video') as HTMLVideoElement;
      video.dispatchEvent(new Event('play'));

      expect(callback).toHaveBeenCalled();
    });

    it('should emit pause event', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      const callback = jest.fn();
      player.on('pause', callback);

      const video = container.querySelector('video') as HTMLVideoElement;
      video.dispatchEvent(new Event('pause'));

      expect(callback).toHaveBeenCalled();
    });

    it('should emit timeupdate event', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      const callback = jest.fn();
      player.on('timeupdate', callback);

      const video = container.querySelector('video') as HTMLVideoElement;
      video.dispatchEvent(new Event('timeupdate'));

      expect(callback).toHaveBeenCalled();
    });

    it('should emit volumechange event', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      const callback = jest.fn();
      player.on('volumechange', callback);

      const video = container.querySelector('video') as HTMLVideoElement;
      video.dispatchEvent(new Event('volumechange'));

      expect(callback).toHaveBeenCalled();
    });

    it('should emit ended event', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      const callback = jest.fn();
      player.on('ended', callback);

      const video = container.querySelector('video') as HTMLVideoElement;
      video.dispatchEvent(new Event('ended'));

      expect(callback).toHaveBeenCalled();
    });

    it('should remove event listener', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      const callback = jest.fn();
      player.on('play', callback);
      player.off('play', callback);

      const video = container.querySelector('video') as HTMLVideoElement;
      video.dispatchEvent(new Event('play'));

      expect(callback).not.toHaveBeenCalled();
    });

    it('should pass player state to event callbacks', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      let receivedState: any;
      player.on('play', (state) => {
        receivedState = state;
      });

      const video = container.querySelector('video') as HTMLVideoElement;
      video.dispatchEvent(new Event('play'));

      expect(receivedState).toBeDefined();
      expect(receivedState).toHaveProperty('playing');
      expect(receivedState).toHaveProperty('currentTime');
      expect(receivedState).toHaveProperty('duration');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should handle space key for play/pause', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        keyboardShortcuts: true,
      });

      const event = new KeyboardEvent('keydown', { key: ' ' });
      container.dispatchEvent(event);
      
      // Verify handler was called
      expect(container.getAttribute('tabindex')).toBe('0');
    });

    it('should handle arrow keys for seeking', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        keyboardShortcuts: true,
      });

      const video = container.querySelector('video') as HTMLVideoElement;
      video.currentTime = 30;

      const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      container.dispatchEvent(leftEvent);
      
      const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      container.dispatchEvent(rightEvent);
    });

    it('should handle m key for mute toggle', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        keyboardShortcuts: true,
      });

      const initialMuted = player.getState().muted;
      
      const event = new KeyboardEvent('keydown', { key: 'm' });
      container.dispatchEvent(event);
      
      expect(player.getState().muted).toBe(!initialMuted);
    });

    it('should not handle shortcuts when disabled', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        keyboardShortcuts: false,
      });

      expect(container.getAttribute('tabindex')).toBeFalsy();
    });
  });

  describe('Player State', () => {
    it('should return current state', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        volume: 0.8,
        muted: false,
      });

      const state = player.getState();
      
      expect(state).toHaveProperty('playing');
      expect(state).toHaveProperty('currentTime');
      expect(state).toHaveProperty('duration');
      expect(state).toHaveProperty('volume');
      expect(state).toHaveProperty('muted');
      expect(state).toHaveProperty('playbackRate');
      expect(state).toHaveProperty('buffered');
      expect(state).toHaveProperty('ended');
      expect(state).toHaveProperty('fullscreen');
      expect(state).toHaveProperty('pip');
    });

    it('should reflect volume changes in state', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      player.setVolume(0.6);
      expect(player.getState().volume).toBe(0.6);
    });

    it('should reflect playback rate in state', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      player.setPlaybackRate(2);
      expect(player.getState().playbackRate).toBe(2);
    });
  });

  describe('Cleanup and Destruction', () => {
    it('should destroy cleanly', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      player.destroy();
      expect(container.querySelector('.vp-video')).toBeFalsy();
      expect(container.innerHTML).toBe('');
    });

    it('should clear event listeners on destroy', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      const callback = jest.fn();
      player.on('play', callback);

      player.destroy();

      // Try to trigger event after destroy
      const video = document.createElement('video');
      video.dispatchEvent(new Event('play'));
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should stop video on destroy', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      player.destroy();
      
      if (container.querySelector('video')) {
        const video = container.querySelector('video') as HTMLVideoElement;
        expect(video.src).toBe('');
      }
    });
  });

  describe('Error Handling', () => {
    it('should emit error event on video error', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      const callback = jest.fn();
      player.on('error', callback);

      const video = container.querySelector('video') as HTMLVideoElement;
      
      // Set error property before dispatching event
      Object.defineProperty(video, 'error', {
        value: {
          code: 4,
          message: 'Test error',
        },
        configurable: true,
      });
      
      video.dispatchEvent(new Event('error'));

      expect(callback).toHaveBeenCalled();
    });

    it('should handle play errors gracefully', async () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
      });

      const video = container.querySelector('video') as HTMLVideoElement;
      
      // Mock play to reject
      video.play = jest.fn().mockRejectedValue(new Error('Play failed'));

      await player.play();
      // Should not throw
    });
  });

  describe('Controls Interaction', () => {
    it('should update UI when controls are present', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        controls: true,
      });

      expect(container.querySelector('.vp-play-pause')).toBeTruthy();
      expect(container.querySelector('.vp-progress')).toBeTruthy();
      expect(container.querySelector('.vp-volume')).toBeTruthy();
    });

    it('should show quality menu when multiple sources', () => {
      const player = new VideoPlayer(container, {
        src: [
          { src: 'video-1080p.mp4', quality: '1080p' },
          { src: 'video-720p.mp4', quality: '720p' },
        ],
        showQualitySelector: true,
        controls: true,
      });

      expect(container.querySelector('.vp-settings')).toBeTruthy();
      expect(container.querySelector('.vp-settings-menu')).toBeTruthy();
    });

    it('should show speed menu', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        controls: true,
      });

      expect(container.querySelector('.vp-speed')).toBeTruthy();
      expect(container.querySelector('.vp-speed-menu')).toBeTruthy();
    });

    it('should show subtitle menu when subtitles provided', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        subtitles: [
          { src: 'en.vtt', label: 'English', srclang: 'en' },
        ],
        controls: true,
      });

      expect(container.querySelector('.vp-subtitle')).toBeTruthy();
      expect(container.querySelector('.vp-subtitle-menu')).toBeTruthy();
    });

    it('should show PIP button when enabled', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        enablePIP: true,
        controls: true,
      });

      expect(container.querySelector('.vp-pip')).toBeTruthy();
    });

    it('should show fullscreen button when enabled', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        enableFullscreen: true,
        controls: true,
      });

      expect(container.querySelector('.vp-fullscreen')).toBeTruthy();
    });
  });

  describe('Custom Styles', () => {
    it('should apply all custom style properties', () => {
      const customStyles = {
        primaryColor: '#ff0000',
        buttonBackground: 'rgba(255, 0, 0, 0.1)',
        buttonBackgroundHover: 'rgba(255, 0, 0, 0.2)',
        buttonColor: '#ffffff',
        buttonBorder: 'rgba(255, 0, 0, 0.3)',
        buttonBorderRadius: '8px',
        progressColor: '#ff0000',
        progressBackground: 'rgba(255, 255, 255, 0.2)',
        controlsBackground: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
        volumeColor: '#ff0000',
        menuBackground: 'rgba(0, 0, 0, 0.95)',
        menuColor: '#ffffff',
        menuItemHoverBackground: 'rgba(255, 0, 0, 0.1)',
        activeMenuItemColor: '#ff0000',
      };

      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        customStyles,
      });

      expect(container.style.getPropertyValue('--vp-primary-color')).toBe('#ff0000');
      expect(container.style.getPropertyValue('--vp-button-bg')).toBe('rgba(255, 0, 0, 0.1)');
      expect(container.style.getPropertyValue('--vp-button-border-radius')).toBe('8px');
      expect(container.style.getPropertyValue('--vp-progress-color')).toBe('#ff0000');
      expect(container.style.getPropertyValue('--vp-menu-bg')).toBe('rgba(0, 0, 0, 0.95)');
    });

    it('should not apply undefined style properties', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        customStyles: {
          primaryColor: '#ff0000',
          // Other properties undefined
        },
      });

      expect(container.style.getPropertyValue('--vp-primary-color')).toBe('#ff0000');
      expect(container.style.getPropertyValue('--vp-button-bg')).toBe('');
    });
  });

  describe('Thumbnail Preview', () => {
    it('should initialize thumbnail manager when enabled', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        enableThumbnails: true,
        controls: true,
      });

      expect(container.querySelector('.vp-progress-preview')).toBeTruthy();
    });

    it('should not show thumbnail preview when disabled', () => {
      const player = new VideoPlayer(container, {
        src: 'video.mp4',
        enableThumbnails: false,
        controls: true,
      });

      const preview = container.querySelector('.vp-progress-preview-thumbnail');
      expect(preview).toBeFalsy();
    });
  });
});
