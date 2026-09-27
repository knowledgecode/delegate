import { DelegateEvent, isDetailObject } from './event.ts';

export type DelegateEventListener<T extends Event = Event> = (ev: DelegateEvent<T>) => void;

export interface Subscriber {
  selectors: string[] | undefined;
  handler: DelegateEventListener;
}

/**
 * Checks if the target element matches the provided CSS selectors.
 * @param target - The element to check against the selectors.
 * @param selectors - An array of CSS selector strings to match against the target element.
 * @returns True if the target matches the selectors, false otherwise.
 */
const matches = (target: Element, selectors: string[]) => {
  let current = target;

  if (!current.matches(selectors[0])) {
    return false;
  }
  if (selectors.length > 1) {
    for (const selector of selectors.slice(1)) {
      do {
        const root = current.getRootNode();

        if (root instanceof ShadowRoot) {
          current = root.host;
        } else if (current.closest(selector)) {
          break;
        } else {
          return false;
        }
      } while (!current.closest(selector));
    }
  }
  return true;
};

/**
 * Gets the next event target up the tree.
 * @param target - The event target to get the parent of.
 * @returns The host of a shadow root, the window of a document, the parent of any other node, or null if none exists.
 */
const getParentNode = (target: EventTarget) => {
  return target instanceof ShadowRoot
    ? target.host
    : target instanceof Document
      ? window
      : target instanceof Node
        ? target.parentNode
        : null;
};

/**
 * Returns the target element of the event.
 * @param ev - The event object to extract the target from.
 * @returns The target element of the event, or null if not available.
 */
export const getTarget = (ev: Event) => {
  // If the event is a CustomEvent with a detail object, return the target from the detail.
  return ev instanceof CustomEvent && isDetailObject(ev.detail) ? ev.detail.target : ev.composedPath()[0];
};

/**
 * Handles event delegation by processing subscribers based on target matching and event propagation.
 * @param ev - The event object that was triggered.
 * @param target - The event target element on which the event was originally triggered.
 * @param baseTarget - The base EventTarget for event delegation.
 * @param subscribers - An array of subscriber objects containing event listener information.
 */
export const handleEvent = (ev: Event, target: EventTarget, baseTarget: EventTarget, subscribers: Subscriber[]) => {
  const delegateEvent = new DelegateEvent(ev, target);
  const subsc: Subscriber[] = [];

  for (const subscriber of subscribers) {
    // If propagation has been aborted, skip further processing.
    if (delegateEvent.abort) {
      break;
    }
    // At the baseTarget only handlers without selectors run, and no subscriber is kept, so traversal ends there.
    if (target === baseTarget) {
      if (!subscriber.selectors) {
        subscriber.handler.call(target, delegateEvent);
      }
    } else if (subscriber.selectors && target instanceof Element && matches(target, subscriber.selectors)) {
      subscriber.handler.call(target, delegateEvent);
    } else {
      // Keep the subscriber for the ancestors.
      subsc.push(subscriber);
    }
  }

  // If propagation is not stopped and there are remaining subscribers, continue up the DOM tree.
  if (subsc.length > 0 && !delegateEvent.stop) {
    const parentNode = getParentNode(target);

    if (parentNode) {
      handleEvent(ev, parentNode, baseTarget, subsc);
    }
  }
};

/**
 * Parses a CSS selector string into an array of selectors.
 * @param selector - A CSS selector string that may contain multiple selectors separated by '>>'.
 * @returns An array of selectors in reverse order.
 */
export const parseSelector = (selector: string) => {
  return selector.split(' >> ').map(s => s.trim()).reverse();
};

/**
 * Splits an event name into the native event type and whether it has the ':passive' suffix.
 * @param eventName - An event name that may end with ':passive'.
 * @returns A tuple of the native event type and the passive flag.
 */
export const parseEventName = (eventName: string) => {
  const passive = eventName.endsWith(':passive');

  return [passive ? eventName.slice(0, -':passive'.length) : eventName, passive] as const;
};

/**
 * Validates the provided CSS selectors.
 * @param selectors - An array of CSS selector strings to validate.
 * @returns An error message if any selector is invalid, otherwise undefined.
 */
export const validateSelectors = (selectors: string[] | undefined) => {
  const fragment = document.createDocumentFragment();

  for (const selector of selectors ?? []) {
    try {
      fragment.querySelector(selector);
    } catch (e) {
      return `'${selector}' is not a valid selector.`;
    }
  }
  return undefined;
};

/**
 * Compares two arrays of selectors for equality.
 * @param a - First array of selectors.
 * @param b - Second array of selectors.
 * @returns True if both arrays are equal, false otherwise.
 */
export const compareSelectors = (a: string[] | undefined, b: string[] | undefined) => {
  if (a === undefined || b === undefined) {
    return a === b;
  }
  if (a.length !== b.length) {
    return false;
  }
  return a.every((val, i) => val === b[i]);
};
