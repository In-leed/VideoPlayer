// Mock HTMLVideoElement methods and properties not fully supported in jsdom

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
  } as Response)
);

// Mock textTracks
Object.defineProperty(window.HTMLMediaElement.prototype, 'textTracks', {
  get() {
    const tracks: any = [];
    tracks.addEventListener = jest.fn();
    tracks.removeEventListener = jest.fn();
    return tracks;
  },
});

// Mock play method
window.HTMLMediaElement.prototype.play = jest.fn().mockImplementation(() => {
  return Promise.resolve();
});

// Mock pause method
window.HTMLMediaElement.prototype.pause = jest.fn();

// Mock load method
window.HTMLMediaElement.prototype.load = jest.fn();

// Mock requestFullscreen
if (!Element.prototype.requestFullscreen) {
  Element.prototype.requestFullscreen = jest.fn().mockResolvedValue(undefined);
}

// Mock exitFullscreen
if (!document.exitFullscreen) {
  document.exitFullscreen = jest.fn().mockResolvedValue(undefined);
}

// Mock requestPictureInPicture
if (!HTMLVideoElement.prototype.requestPictureInPicture) {
  HTMLVideoElement.prototype.requestPictureInPicture = jest.fn().mockResolvedValue({} as any);
}

// Mock exitPictureInPicture
if (!document.exitPictureInPicture) {
  (document as any).exitPictureInPicture = jest.fn().mockResolvedValue(undefined);
}

// Mock buffered property
Object.defineProperty(window.HTMLMediaElement.prototype, 'buffered', {
  get() {
    return {
      length: 0,
      start: jest.fn(),
      end: jest.fn(),
    };
  },
});

// Mock duration property
Object.defineProperty(window.HTMLMediaElement.prototype, 'duration', {
  get() {
    return 100; // Default duration
  },
  configurable: true,
});

// Mock currentTime property
Object.defineProperty(window.HTMLMediaElement.prototype, 'currentTime', {
  get() {
    return this._currentTime || 0;
  },
  set(value) {
    this._currentTime = value;
  },
  configurable: true,
});

// Mock volume property
Object.defineProperty(window.HTMLMediaElement.prototype, 'volume', {
  get() {
    return this._volume !== undefined ? this._volume : 1;
  },
  set(value) {
    this._volume = value;
  },
  configurable: true,
});

// Mock muted property
Object.defineProperty(window.HTMLMediaElement.prototype, 'muted', {
  get() {
    return this._muted || false;
  },
  set(value) {
    this._muted = value;
  },
  configurable: true,
});

// Mock playbackRate property
Object.defineProperty(window.HTMLMediaElement.prototype, 'playbackRate', {
  get() {
    return this._playbackRate || 1;
  },
  set(value) {
    this._playbackRate = value;
  },
  configurable: true,
});

// Mock paused property
Object.defineProperty(window.HTMLMediaElement.prototype, 'paused', {
  get() {
    return this._paused !== undefined ? this._paused : true;
  },
  configurable: true,
});

// Mock ended property
Object.defineProperty(window.HTMLMediaElement.prototype, 'ended', {
  get() {
    return this._ended || false;
  },
  configurable: true,
});

// Mock error property
Object.defineProperty(window.HTMLMediaElement.prototype, 'error', {
  get() {
    return this._error || null;
  },
  configurable: true,
});

// Mock fullscreenElement
Object.defineProperty(document, 'fullscreenElement', {
  get() {
    return null;
  },
  configurable: true,
});

// Mock pictureInPictureElement
Object.defineProperty(document, 'pictureInPictureElement', {
  get() {
    return null;
  },
  configurable: true,
});
