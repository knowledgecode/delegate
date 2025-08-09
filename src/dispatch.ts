import { DelegateEvent } from './event.ts';

/**
 * Dispatches a custom event to the specified destination.
 * @param destination - The target to dispatch the event to.
 * @param eventName - The name of the event to be dispatched.
 * @param event - The original event or DelegateEvent instance that triggered the dispatch.
 * @param [data] - Optional data to be included in the event detail.
 */
export const dispatch = (destination: EventTarget, eventName: string, event: Event | DelegateEvent, data?: unknown) => {
  destination.dispatchEvent(new CustomEvent(eventName, {
    bubbles: true,
    composed: true,
    detail: {
      originalEvent: event instanceof DelegateEvent ? event.originalEvent : event,
      target: event.target,
      data: data || null
    }
  }));
};
