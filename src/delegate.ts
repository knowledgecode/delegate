import { DelegateEvent, isCustomEventDetail } from './event.ts';

export type DelegateEventListener = (evt: DelegateEvent) => void;

interface Subscriber {
  selector: string | string[];
  handler: DelegateEventListener;
}

const delegatorCache = new WeakMap<EventTarget, Delegate>();

/**
 * Returns the target element of the event.
 * @param evt - The event object to extract the target from.
 * @returns The target element of the event, or null if not available.
 */
const extractTarget = (evt: Event) => {
  // If the event is a CustomEvent with a detail object, use the target from the detail
  return evt instanceof CustomEvent && isCustomEventDetail(evt.detail) ? evt.detail.target : evt.composedPath()[0];
};

/**
 * Checks if the target element matches the provided CSS selector(s).
 * @param target - The element to check against the selector(s).
 * @param selector - A CSS selector string or an array of selector strings to match against the target element.
 * @returns True if the target matches the selector(s), false otherwise.
 */
const matches = (target: Element, selector: string | string[]) => {
  if (Array.isArray(selector)) {
    const lastSelector = selector[selector.length - 1];

    if (!lastSelector || !target.matches(lastSelector)) {
      return false;
    }
    for (let i = selector.length - 2; i >= 0; i--) {
      do {
        const root = target.getRootNode();

        if (root instanceof ShadowRoot) {
          target = root.host;
        } else if (target.closest(selector[i])) {
          break;
        } else {
          return false;
        }
      } while (!target.closest(selector[i]));
    }
    return true;
  }
  return selector ? target.matches(selector) : false;
};

/**
 * Parses a CSS selector string into an array of selectors.
 * @param selector - A CSS selector string that may contain multiple selectors separated by '>>'.
 * @returns An array of selectors if multiple selectors are found, or a single selector string if only one is present.
 */
const parseSelector = (selector: string) => {
  const array = selector.split('>>').map(s => s.trim());
  return array.length > 1 ? array : array[0];
};

/**
 * Gets the parent node of the target element.
 * @param target - The target element to get the parent node of.
 * @returns The parent node of the target element, or null if no parent exists.
 */
const getParentNode = (target: EventTarget | null): EventTarget | null => {
  return target instanceof Element
    ? target.parentNode instanceof ShadowRoot
      ? target.parentNode.host
      : target.parentNode
    : null;
};

export class Delegate {
  private readonly baseEventTarget: EventTarget;

  private readonly listenerCache: Map<string, EventListener>;

  private readonly subscriberCache: Map<string, Subscriber[]>;

  /**
   * Creates a new delegate instance for the specified event target.
   * @param baseEventTarget - The base event target to attach event listeners to
   */
  constructor (baseEventTarget: EventTarget) {
    this.baseEventTarget = baseEventTarget;
    this.listenerCache = new Map();
    this.subscriberCache = new Map();
  }

  /**
   * Internal event listener function that handles event delegation.
   * @param passive - Whether the event is using passive mode
   * @param evt - The native event object
   */
  private listener (passive: boolean, evt: Event) {
    /**
     * Recursive function to traverse up the DOM tree and call matching event handlers.
     * @param target - Current event target in the traversal
     * @param delegateTarget - The target element that the event was delegated to
     * @param subsc - List of subscribers to check against
     */
    const handle = (target: EventTarget | null, delegateTarget: EventTarget | null, subsc: Subscriber[]) => {
      const evt2 = new DelegateEvent(evt, delegateTarget);
      const subsc2 = subsc.filter(s => {
        if (evt2.abort) {
          return false;
        }
        if (delegateTarget === evt.currentTarget) {
          if (!s.selector) {
            s.handler.call(target, evt2);
          }
          return false;
        }
        if (target instanceof Element) {
          if (matches(target, s.selector)) {
            s.handler.call(target, evt2);
            return false;
          }
          return true;
        }
        return false;
      });

      if (!evt2.stop && subsc2.length) {
        const parentNode = getParentNode(target);

        if (parentNode) {
          handle(parentNode, parentNode, subsc2);
        }
      }
    };

    const subsc = this.subscriberCache.get(`${evt.type}${passive ? ':passive' : ''}`) ?? [];

    if (subsc.length) {
      const target = extractTarget(evt);

      handle(target, target instanceof Document ? evt.currentTarget : target, subsc);
    }
  }

  /**
   * Adds an event listener to the specified event with optional selector for delegation.
   * @param eventName - Name of the event to listen for
   * @param selector - CSS selector for delegation
   * @param handler - Event handler function to be executed
   * @returns Current delegate instance for chaining
   */
  on (eventName: string, selector: string, handler: DelegateEventListener): Delegate;

  /**
   * Adds an event listener to the specified event with optional selector for delegation.
   * @param eventName - Name of the event to listen for
   * @param handler - Event handler function to be executed
   * @returns Current delegate instance for chaining
   */
  on (eventName: string, handler: DelegateEventListener): Delegate;

  /**
   * Adds an event listener to the specified event with optional selector for delegation.
   * @param eventName - Name of the event to listen for
   * @param selector - CSS selector for delegation or event handler function
   * @param [handler] - Event handler function to be executed
   * @returns Current delegate instance for chaining
   */
  on (eventName: string, selector: string | DelegateEventListener, handler?: DelegateEventListener) {
    if (typeof selector === 'function') {
      handler = selector;
      selector = '';
    }

    const subsc = this.subscriberCache.get(eventName) ?? [];

    if (handler && subsc.findIndex(s => s.selector === selector && s.handler === handler) < 0) {
      subsc.push({ selector: parseSelector(selector), handler });
      if (!this.listenerCache.has(eventName)) {
        const [eventName2, passive] = eventName.split(':');
        const listener2 = this.listener.bind(this, passive === 'passive');

        this.listenerCache.set(eventName, listener2);
        this.baseEventTarget.addEventListener(
          passive === 'passive' ? eventName2 : eventName, listener2, { capture: true, passive: passive === 'passive' }
        );
      }
    }
    this.subscriberCache.set(eventName, subsc);
    return this;
  }

  /**
   * Adds a one-time event listener that will be automatically removed after execution.
   * @param eventName - Name of the event to listen for
   * @param selector - CSS selector for delegation
   * @param handler - Event handler function to be executed once
   * @returns Current delegate instance for chaining
   */
  one (eventName: string, selector: string, handler: DelegateEventListener): Delegate;

  /**
   * Adds a one-time event listener that will be automatically removed after execution.
   * @param eventName - Name of the event to listen for
   * @param handler - Event handler function to be executed once
   * @returns Current delegate instance for chaining
   */
  one (eventName: string, handler: DelegateEventListener): Delegate;

  /**
   * Adds a one-time event listener that will be automatically removed after execution.
   * @param eventName - Name of the event to listen for
   * @param selector - CSS selector for delegation or event handler function
   * @param [handler] - Event handler function to be executed once
   * @returns Current delegate instance for chaining
   */
  one (eventName: string, selector: string | DelegateEventListener, handler?: DelegateEventListener) {
    if (typeof selector === 'function') {
      handler = selector;
      selector = '';
    }

    const handler2 = (evt: DelegateEvent) => {
      this.off(eventName, selector, handler2);
      handler?.call(evt.target, evt);
    };

    return this.on(eventName, selector, handler2);
  }

  /**
   * Removes event listeners based on the specified parameters.
   * @param [eventName] - Name of the event to remove
   * @param [selector] - CSS selector for delegation
   * @param [handler] - Event handler function to remove
   * @returns Current delegate instance for chaining
   */
  off (eventName?: string, selector?: string, handler?: DelegateEventListener): Delegate;

  /**
   * Removes event listeners based on the specified parameters.
   * @param [eventName] - Name of the event to remove
   * @param [handler] - Event handler function to remove
   * @returns Current delegate instance for chaining
   */
  off (eventName?: string, handler?: DelegateEventListener): Delegate;

  /**
   * Removes event listeners based on the specified parameters.
   * @param [eventName] - Name of the event to remove
   * @param [selector] - CSS selector for delegation or event handler function
   * @param [handler] - Event handler function to remove
   * @returns Current delegate instance for chaining
   */
  off (eventName?: string, selector?: string | DelegateEventListener, handler?: DelegateEventListener) {
    if (typeof selector === 'function') {
      handler = selector;
      selector = '';
    }

    /**
     * Helper function to remove an event listener from the base event target.
     * @param _listener - The listener function to remove
     * @param _eventName - The event name to remove the listener from
     */
    const removeEventListener = (_listener: EventListener, _eventName: string) => {
      const [eventName2, passive] = _eventName.split(':');

      this.baseEventTarget.removeEventListener(
        passive === 'passive' ? eventName2 : _eventName, _listener, { capture: true }
      );
    };

    if (eventName) {
      // Keep subscribers that don't match the removal criteria:
      // - If selector is specified, keep subscribers with different selectors
      // - If handler is specified, keep subscribers with different handlers
      // - If both are specified, keep subscribers that differ in either selector or handler
      const subsc = (this.subscriberCache.get(eventName) ?? [])
        .filter(s => selector !== undefined && s.selector !== selector || handler && s.handler !== handler);

      if (subsc.length) {
        this.subscriberCache.set(eventName, subsc);
      } else {
        this.subscriberCache.delete(eventName);

        const listener = this.listenerCache.get(eventName);

        if (listener) {
          this.listenerCache.delete(eventName);
          removeEventListener(listener, eventName);
        }
      }
    } else {
      this.subscriberCache.clear();
      this.listenerCache.forEach(removeEventListener);
      this.listenerCache.clear();
    }
    return this;
  }

  /**
   * Clears all event listeners and removes the delegator from cache.
   */
  clear () {
    this.off();
    delegatorCache.delete(this.baseEventTarget);
  }
}

/**
 * Creates or retrieves a delegate instance for the specified event target.
 * @param baseEventTarget - The base event target to attach event listeners to
 * @returns A delegate instance for the specified event target
 * @throws If the baseEventTarget is not an instance of EventTarget
 */
export const delegate = (baseEventTarget: EventTarget) => {
  if (!(baseEventTarget instanceof EventTarget)) {
    throw new TypeError(`${baseEventTarget} is not an EventTarget`);
  }
  return delegatorCache.get(baseEventTarget) ?? (() => {
    const delegator = new Delegate(baseEventTarget);
    delegatorCache.set(baseEventTarget, delegator);
    return delegator;
  })();
};
