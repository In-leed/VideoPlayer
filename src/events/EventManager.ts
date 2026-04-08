import type { PlayerEventType, EventCallback, PlayerState } from '../types';

/**
 * Manages event listeners and event emission for the video player
 */
export class EventManager {
  private eventListeners: Map<PlayerEventType, Set<EventCallback>>;

  constructor() {
    this.eventListeners = new Map();
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
   * Emit event to all listeners
   */
  public emit(eventType: PlayerEventType, state: PlayerState): void {
    const listeners = this.eventListeners.get(eventType);
    if (!listeners) return;

    listeners.forEach((callback) => callback(state));
  }

  /**
   * Clear all event listeners
   */
  public clear(): void {
    this.eventListeners.clear();
  }
}
