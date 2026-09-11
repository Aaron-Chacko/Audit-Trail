import { EventEmitter } from 'events';

class EventSubscriptionBus {
  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
  }

  subscribe(eventType, handler) {
    if (!eventType || typeof handler !== 'function') {
      throw new Error('eventType and handler function are required to subscribe.');
    }

    this.emitter.on(eventType, handler);

    return () => {
      this.emitter.off(eventType, handler);
    };
  }

  subscribeAll(handler) {
    if (typeof handler !== 'function') {
      throw new Error('handler function is required.');
    }

    const wildcardHandler = (event) => handler(event);
    this.emitter.on('*', wildcardHandler);

    return () => {
      this.emitter.off('*', wildcardHandler);
    };
  }

  async publish(event) {
    if (!event || typeof event !== 'object' || !event.eventType) {
      return;
    }

    try {
      this.emitter.emit(event.eventType, event);
      this.emitter.emit('*', event);
    } catch (err) {
      console.error(`[EventBus] Error publishing event ${event.eventType}:`, err);
    }
  }

  getSubscriberCount(eventType) {
    if (!eventType) {
      return this.emitter.listenerCount('*');
    }
    return this.emitter.listenerCount(eventType);
  }

  clearSubscribers() {
    this.emitter.removeAllListeners();
  }
}

export const eventBus = new EventSubscriptionBus();

export default eventBus;
