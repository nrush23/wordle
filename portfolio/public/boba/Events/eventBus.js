export default function createEventBus() {
  const listeners = new Map(); // eventName -> Set<callback>

  return {
    on(event, callback) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event).add(callback);

      // Return unsubscribe
      return () => {
        listeners.get(event)?.delete(callback);
      };
    },

    off(event, callback) {
      listeners.get(event)?.delete(callback);
    },

    emit(event, payload) {
      const set = listeners.get(event);
      if (!set) return;
      for (const cb of set) cb(payload);
    },
  };
}