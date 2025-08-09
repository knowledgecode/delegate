import type { DelegateEventListener } from './delegate.ts';
import type { DelegateEvent } from './event.ts';

/**
 * Debounce function to limit the rate at which a function can fire.
 * @param handler - The function to be debounced, typically an EventListener or DelegateEventListener.
 * @param delay - The time in milliseconds to wait before executing the function after the last call.
 * @returns A debounced function that can be called with an Event object.
 */
export const debounce = (handler: EventListener | DelegateEventListener, delay: number) => {
  let timerId = 0;

  return (evt: Event | DelegateEvent) => {
    if (timerId) {
      self.clearTimeout(timerId);
    }
    timerId = self.setTimeout(() => {
      timerId = 0;
      if (evt instanceof Event) {
        (handler as EventListener).call(evt.target, evt);
      } else {
        (handler as DelegateEventListener).call(evt.target, evt);
      }
    }, delay);
  };
};

/**
 * Throttle function to limit the execution of a function to once every specified interval.
 * @param handler - The function to be throttled, typically an EventListener or DelegateEventListener.
 * @param interval - The time in milliseconds to wait before allowing the function to be called again.
 * @returns A throttled function that can be called with an Event object.
 */
export const throttle = (handler: EventListener | DelegateEventListener, interval: number) => {
  let timerId = 0;

  return (evt: Event | DelegateEvent) => {
    if (!timerId) {
      timerId = self.setTimeout(() => (timerId = 0), interval);
      if (evt instanceof Event) {
        (handler as EventListener).call(evt.target, evt);
      } else {
        (handler as DelegateEventListener).call(evt.target, evt);
      }
    }
  };
};
