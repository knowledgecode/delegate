import { DelegateEvent } from './event.ts';
import type { DetailObject } from './event.ts';

/**
 * @deprecated Use `pierce` instead.
 * Dispatches a custom event to the specified destination.
 * @param destination - The target to dispatch the event to.
 * @param eventName - The name of the event to be dispatched.
 * @param ev - The native event or DelegateEvent instance that triggered the dispatch.
 * @param [data] - Optional data to be included in the event detail.
 */
export const dispatch = (
  destination: EventTarget,
  eventName: string,
  ev: Event | DelegateEvent,
  data?: unknown
) => {
  const nativeEvent = ev instanceof DelegateEvent ? ev.nativeEvent : ev;

  destination.dispatchEvent(new CustomEvent<DetailObject>(eventName, {
    bubbles: true,
    composed: true,
    detail: {
      nativeEvent,
      target: nativeEvent.target,
      data
    }
  }));
};

/**
 * Pierces an event through shadow DOM boundaries by dispatching a custom event to the specified destination.
 * @param destination - The target to pierce the event to.
 * @param ev - The native event or DelegateEvent instance to be pierced.
 * @param [data] - Optional data to be included in the event detail.
 */
export const pierce = (
  destination: HTMLElement,
  ev: Event | DelegateEvent,
  data?: unknown
) => {
  const nativeEvent = ev instanceof DelegateEvent ? ev.nativeEvent : ev;
  const eventName = nativeEvent.type;

  destination.dispatchEvent(new CustomEvent<DetailObject>(eventName, {
    bubbles: true,
    composed: true,
    detail: {
      nativeEvent,
      target: nativeEvent.target,
      data
    }
  }));
};

/**
 * Debounce function to limit the rate at which a function can fire.
 * @param handler - The function to be debounced, typically an EventListener or DelegateEventListener.
 * @param delay - The time in milliseconds to wait before executing the function after the last call.
 * @returns A debounced function that can be called with an Event object.
 */
export const debounce = <This, Arg extends Event | DelegateEvent>(handler: (this: This, ev: Arg) => void, delay: number) => {
  let timerId = 0;

  return function (this: This, ev: Arg) {
    if (timerId) {
      self.clearTimeout(timerId);
    }
    timerId = self.setTimeout(() => {
      timerId = 0;
      handler.call(this, ev);
    }, delay);
  };
};

/**
 * Throttle function to limit the execution of a function to once every specified interval.
 * @param handler - The function to be throttled, typically an EventListener or DelegateEventListener.
 * @param interval - The time in milliseconds to wait before allowing the function to be called again.
 * @returns A throttled function that can be called with an Event object.
 */
export const throttle = <This, Arg extends Event | DelegateEvent>(handler: (this: This, ev: Arg) => void, interval: number) => {
  let timerId = 0;

  return function (this: This, ev: Arg) {
    if (!timerId) {
      timerId = self.setTimeout(() => (timerId = 0), interval);
      handler.call(this, ev);
    }
  };
};
