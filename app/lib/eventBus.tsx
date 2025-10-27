type Listener<T = any> = (payload: T) => void;

const listeners: Record<string, Set<Listener>> = {};

export function on<T = any>(event: string, cb: Listener<T>) {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(cb as Listener);
  return () => off(event, cb);
}

export function off<T = any>(event: string, cb: Listener<T>) {
  listeners[event]?.delete(cb as Listener);
}

export function emit<T = any>(event: string, payload: T) {
  listeners[event]?.forEach((cb) => {
    try {
      cb(payload);
    } catch (e) {
      // no-op
    }
  });
}

export type CoachEventPayload = {
  event?: "NEW_BLOCK" | "NEW_SESSION" | string;
  route?: string;
  [k: string]: any;
};

