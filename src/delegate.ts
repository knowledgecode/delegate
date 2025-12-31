import { DelegateEvent } from './event.ts';
import { getTarget, handleEvent, parseSelector, validateSelectors, compareSelectors } from './common.ts';
import type { DelegateEventListener, Subscriber } from './common.ts';

export { DelegateEvent } from './event.ts';
export type { DelegateEventListener } from './common.ts';

type Target = Window | Document | Element | DocumentFragment;

type NativeEventName = keyof WindowEventMap | keyof DocumentEventMap;

type EventName = NativeEventName | (string & {});

type StripPassive<K extends string> = K extends `${infer Native}:passive` ? Native : K;

type EventType<K extends EventName> =
  StripPassive<K> extends keyof WindowEventMap
    ? WindowEventMap[StripPassive<K>]
    : StripPassive<K> extends keyof DocumentEventMap
      ? DocumentEventMap[StripPassive<K>]
      : StripPassive<K> extends keyof GlobalEventHandlersEventMap
        ? GlobalEventHandlersEventMap[StripPassive<K>]
        : Event;

const delegatorCache = new WeakMap<Target, Delegate>();

export class Delegate {
  private readonly baseTarget: Target;

  private readonly listenerCache: Map<string, EventListener>;

  private readonly subscriberCache: Map<string, Subscriber[]>;

  /**
   * Creates a new delegate instance for the specified event target.
   * @param baseTarget - The base event target for delegation.
   */
  constructor (baseTarget: Target) {
    this.baseTarget = baseTarget;
    this.listenerCache = new Map();
    this.subscriberCache = new Map();
  }

  /**
   * Internal event listener function that handles event delegation.
   * @param passive - Whether the event is using passive mode or not.
   * @param ev - The native event object that was triggered.
   */
  private listener (passive: boolean, ev: Event) {
    const subsc = this.subscriberCache.get(`${ev.type}${passive ? ':passive' : ''}`);
    // If there are subscribers for this event type, start handling from the event target.
    if (subsc && ev.currentTarget) {
      const target = getTarget(ev);

      if (target) {
        handleEvent(ev, target, ev.currentTarget, subsc);
      }
    }
  }

  /**
   * Adds an event listener to the specified event with optional selector for delegation.
   * @param eventName - Name of the event to listen for.
   * @param selector - CSS selector for delegation.
   * @param handler - Event handler function to be executed.
   * @returns Current delegate instance for chaining.
   */
  on <TEventName extends EventName>(
    eventName: TEventName,
    selector: string,
    handler: DelegateEventListener<EventType<TEventName>>
  ): Delegate;

  /**
   * Adds an event listener to the specified event with optional selector for delegation.
   * @param eventName - Name of the event to listen for.
   * @param handler - Event handler function to be executed.
   * @returns Current delegate instance for chaining.
   */
  on <TEventName extends EventName>(
    eventName: TEventName,
    handler: DelegateEventListener<EventType<TEventName>>
  ): Delegate;

  /**
   * Adds an event listener to the specified event with optional selector for delegation.
   * @param eventName - Name of the event to listen for.
   * @param arg1 - CSS selector for delegation or event handler function.
   * @param [arg2] - Event handler function to be executed.
   * @returns Current delegate instance for chaining.
   */
  on <TEventName extends EventName>(
    eventName: TEventName,
    arg1: string | DelegateEventListener<EventType<TEventName>>,
    arg2?: DelegateEventListener<EventType<TEventName>>
  ) {
    const selector = typeof arg1 === 'function' ? '' : arg1;
    const handler = typeof arg1 === 'function' ? arg1 : arg2;
    const subsc = this.subscriberCache.get(eventName) ?? [];
    const selectors = selector ? parseSelector(selector) : undefined;
    const error = validateSelectors(selectors);

    if (error) {
      throw new SyntaxError(error);
    }
    if (handler && subsc.findIndex(s => compareSelectors(s.selectors, selectors) && s.handler === handler) < 0) {
      subsc.push({ selectors, handler: handler as DelegateEventListener });
      if (!this.listenerCache.has(eventName)) {
        const [eventName2, passive] = eventName.split(':');
        const listener2 = this.listener.bind(this, passive === 'passive');

        this.listenerCache.set(eventName, listener2);
        this.baseTarget.addEventListener(
          passive === 'passive' ? eventName2 : eventName, listener2, { capture: true, passive: passive === 'passive' }
        );
      }
    }
    this.subscriberCache.set(eventName, subsc);
    return this;
  }

  /**
   * Adds a one-time event listener that will be automatically removed after execution.
   * @param eventName - Name of the event to listen for.
   * @param selector - CSS selector for delegation.
   * @param handler - Event handler function to be executed once.
   * @returns Current delegate instance for chaining.
   */
  one <TEventName extends EventName>(
    eventName: TEventName,
    selector: string,
    handler: DelegateEventListener<EventType<TEventName>>
  ): Delegate;

  /**
   * Adds a one-time event listener that will be automatically removed after execution.
   * @param eventName - Name of the event to listen for.
   * @param handler - Event handler function to be executed once.
   * @returns Current delegate instance for chaining.
   */
  one <TEventName extends EventName>(
    eventName: TEventName,
    handler: DelegateEventListener<EventType<TEventName>>
  ): Delegate;

  /**
   * Adds a one-time event listener that will be automatically removed after execution.
   * @param eventName - Name of the event to listen for.
   * @param arg1 - CSS selector for delegation or event handler function.
   * @param [arg2] - Event handler function to be executed once.
   * @returns Current delegate instance for chaining.
   */
  one <TEventName extends EventName>(
    eventName: TEventName,
    arg1: string | DelegateEventListener<EventType<TEventName>>,
    arg2?: DelegateEventListener<EventType<TEventName>>
  ) {
    const selector = typeof arg1 === 'function' ? '' : arg1;
    const handler = typeof arg1 === 'function' ? arg1 : arg2;
    const handler2 = (ev: DelegateEvent<EventType<TEventName>>) => {
      this.off(eventName, selector, handler2);
      handler?.call(ev.target, ev);
    };

    return this.on(eventName, selector, handler2);
  }

  /**
   * Removes event listeners based on the specified parameters.
   * @param [eventName] - Name of the event to remove.
   * @param [selector] - CSS selector for delegation.
   * @param [handler] - Event handler function to remove.
   * @returns Current delegate instance for chaining.
   */
  off <TEventName extends EventName>(
    eventName?: EventName,
    selector?: string,
    handler?: DelegateEventListener<EventType<TEventName>>
  ): Delegate;

  /**
   * Removes event listeners based on the specified parameters.
   * @param eventName - Name of the event to remove.
   * @param handler - Event handler function to remove.
   * @returns Current delegate instance for chaining.
   */
  off <TEventName extends EventName>(
    eventName: EventName,
    handler: DelegateEventListener<EventType<TEventName>>
  ): Delegate;

  /**
   * Removes event listeners based on the specified parameters.
   * @param [eventName] - Name of the event to remove.
   * @param [arg1] - CSS selector for delegation or event handler function.
   * @param [arg2] - Event handler function to remove.
   * @returns Current delegate instance for chaining.
   */
  off <TEventName extends EventName>(
    eventName?: EventName,
    arg1?: string | DelegateEventListener<EventType<TEventName>>,
    arg2?: DelegateEventListener<EventType<TEventName>>
  ) {
    const selector = typeof arg1 === 'function' ? '' : arg1;
    const handler = typeof arg1 === 'function' ? arg1 : arg2;

    /**
     * Helper function to remove an event listener from the base event target.
     * @param _listener - The listener function to remove.
     * @param _eventName - The event name to remove the listener from.
     */
    const removeEventListener = (_listener: EventListener, _eventName: EventName) => {
      const [eventName2, passive] = _eventName.split(':');

      this.baseTarget.removeEventListener(
        passive === 'passive' ? eventName2 : _eventName, _listener, { capture: true }
      );
    };

    if (eventName) {
      const selectors = selector ? parseSelector(selector) : undefined;
      const error = validateSelectors(selectors);

      if (error) {
        throw new SyntaxError(error);
      }

      const subsc: Subscriber[] = [];

      for (const subscriber of this.subscriberCache.get(eventName) ?? []) {
        // Keep subscriber if it doesn't match the removal criteria:
        // - If selector is specified and doesn't match
        // - If handler is specified and doesn't match
        if (selector !== undefined && !compareSelectors(subscriber.selectors, selectors)
          || handler && handler !== subscriber.handler) {
          subsc.push(subscriber);
        }
      }
      if (subsc.length > 0) {
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
    delegatorCache.delete(this.baseTarget);
  }
}

/**
 * Creates or retrieves a delegate instance for the specified event target.
 * @param baseTarget - The base event target for delegation.
 * @returns A delegate instance for the specified event target.
 * @throws TypeError if the baseTarget is not a valid event target.
 */
export const delegate = (baseTarget: Target) => {
  if (!(
    baseTarget instanceof Window
    || baseTarget instanceof Document
    || baseTarget instanceof Element
    || baseTarget instanceof DocumentFragment
  )) {
    throw new TypeError('baseTarget is not a valid event target.');
  }
  return delegatorCache.get(baseTarget) ?? (() => {
    const delegator = new Delegate(baseTarget);
    delegatorCache.set(baseTarget, delegator);
    return delegator;
  })();
};
