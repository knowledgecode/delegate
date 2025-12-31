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
        } else {
          return !!current.closest(selector);
        }
      } while (!current.closest(selector));
    }
  }
  return true;
};

/**
 * Gets the parent node of the target element.
 * @param target - The target element to get the parent node of.
 * @returns The parent node of the target element, or null if no parent exists.
 */
const getParentNode = (target: EventTarget) => {
  return target instanceof Element || target instanceof DocumentFragment
    ? target.parentNode
    : target instanceof Document
      ? window
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
    // If there are no selectors, it's a direct event listener on the baseTarget.
    if (!subscriber.selectors) {
      // If the target is the baseTarget, invoke the handler.
      if (target === baseTarget) {
        subscriber.handler.call(target, delegateEvent);
        continue;
      }
      // Otherwise, keep the subscriber for further processing.
      subsc.push(subscriber);
      continue;
    }
    // If selectors are present, check if the target matches the selectors.
    if (target instanceof Element && matches(target, subscriber.selectors)) {
      // If it matches, invoke the handler.
      subscriber.handler.call(target, delegateEvent);
      continue;
    }
    // If it doesn't match, keep the subscriber for further processing.
    subsc.push(subscriber);
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
