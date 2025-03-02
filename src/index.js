/**
 * @preserve delegate (c) KNOWLEDGECODE | MIT
 */

// @ts-check

/**
 * @type {WeakMap<EventTarget, Delegate>}
 */
const delegatorCache = new WeakMap();

class DelegateEvent {
  /**
   * Creates a new delegate event wrapper.
   * @param {Event} evt - The original event object
   * @param {EventTarget} target - The current target for this event
   */
  constructor (evt, target) {
    this.originalEvent = evt;
    this.stop = !evt.bubbles;
    this.abort = false;
    this.currentTarget = target;
  }

  /**
   * Prevents the default action of the event.
   */
  preventDefault () {
    this.originalEvent.preventDefault();
  }

  /**
   * Stops the propagation of the event.
   */
  stopPropagation () {
    this.stop = true;
  }

  /**
   * Stops the immediate propagation of the event and prevents any further event handlers from being called.
   */
  stopImmediatePropagation () {
    this.abort = this.stop = true;
  }
}

/**
 * @typedef {Object} Subscriber
 * @property {string} selector - CSS selector to match target elements
 * @property {EventListener} handler - Event handler function to be executed when the selector matches
 */

class Delegate {
  /**
   * Creates a new delegate instance for the specified event target.
   * @param {EventTarget} baseEventTarget - The base event target to attach event listeners to
   */
  constructor (baseEventTarget) {
    /**
     * @type {EventTarget}
     */
    this._baseEventTarget = baseEventTarget;

    /**
     * @type {Map<string, EventListener>}
     */
    this._listenerCache = new Map();

    /**
     * @type {Map<string, Subscriber[]>}
     */
    this._subscriberCache = new Map();
  }

  /**
   * Internal event listener function that handles event delegation.
   * @param {boolean} passive - Whether the event is using passive mode
   * @param {Event} evt - The original event object
   */
  _listener (passive, evt) {
    /**
     * Recursive function to traverse up the DOM tree and call matching event handlers.
     * @param {EventTarget} target - Current event target in the traversal
     * @param {Subscriber[]} subsc - List of subscribers to check against
     */
    const fn = (target, subsc) => {
      const evt2 = new DelegateEvent(evt, target);
      const subsc2 = subsc.filter(s => {
        if (evt2.abort) {
          return false;
        }
        if (target === evt.currentTarget) {
          if (!s.selector) {
            s.handler.call(target, evt2);
          }
          return false;
        }
        if (s.selector && /** @type {Element} */ (target).matches(s.selector)) {
          s.handler.call(target, evt2);
          return false;
        }
        return true;
      });

      if (/** @type {Element} */ (target).parentNode && subsc2.length && !evt2.stop) {
        fn(/** @type {Element} */ (target).parentNode, subsc2);
      }
    };

    fn(
      /** @type {EventTarget} */ (evt.currentTarget === self ? self : evt.target),
      this._subscriberCache.get(`${evt.type}${passive ? ':passive' : ''}`) || []
    );
  }

  /**
   * Adds an event listener to the specified event with optional selector for delegation.
   * @overload
   * @param {string} eventName - Name of the event to listen for
   * @param {string} selector - CSS selector to match target elements
   * @param {EventListener} handler - Event handler function to be executed
   * @returns {Delegate} Current delegate instance for chaining
   *
   * @overload
   * @param {string} eventName - Name of the event to listen for
   * @param {EventListener} handler - Event handler function to be executed
   * @returns {Delegate} Current delegate instance for chaining
   *
   * @param {string} eventName - Name of the event to listen for
   * @param {string | EventListener} selector - CSS selector or event handler function
   * @param {EventListener} [handler] - Event handler function to be executed
   * @returns {Delegate} Current delegate instance for chaining
   */
  on (eventName, selector, handler) {
    if (typeof selector === 'function') {
      handler = selector;
      selector = '';
    }

    const subsc = this._subscriberCache.get(eventName) || [];

    if (handler && subsc.findIndex(s => s.selector === selector && s.handler === handler) < 0) {
      subsc.push({ selector, handler });
      if (!this._listenerCache.has(eventName)) {
        const [eventName2, passive] = eventName.split(':');
        const listener2 = this._listener.bind(this, passive === 'passive');

        this._listenerCache.set(eventName, listener2);
        this._baseEventTarget.addEventListener(
          eventName2, listener2, { capture: true, passive: passive === 'passive' }
        );
      }
    }
    this._subscriberCache.set(eventName, subsc);
    return this;
  }

  /**
   * Removes event listeners based on the specified parameters.
   * @overload
   * @returns {Delegate} Current delegate instance for chaining
   *
   * @overload
   * @param {string} eventName - Name of the event to remove
   * @returns {Delegate} Current delegate instance for chaining
   *
   * @overload
   * @param {string} eventName - Name of the event to remove
   * @param {string} selector - CSS selector to match target elements
   * @returns {Delegate} Current delegate instance for chaining
   *
   * @overload
   * @param {string} eventName - Name of the event to remove
   * @param {string} selector - CSS selector to match target elements
   * @param {EventListener} handler - Event handler function to remove
   * @returns {Delegate} Current delegate instance for chaining
   *
   * @param {string} [eventName] - Name of the event to remove
   * @param {string | EventListener} [selector] - CSS selector or event handler function
   * @param {EventListener} [handler] - Event handler function to remove
   * @returns {Delegate} Current delegate instance for chaining
   */
  off (eventName, selector, handler) {
    if (typeof selector === 'function') {
      handler = selector;
      selector = '';
    }

    /**
     * Helper function to remove an event listener from the base event target.
     * @param {EventListener} _listener - The listener function to remove
     * @param {string} _eventName - The event name to remove the listener from
     */
    const removeEventListener = (_listener, _eventName) => {
      const [eventName2] = _eventName.split(':');

      this._baseEventTarget.removeEventListener(
        eventName2, _listener, { capture: true }
      );
    };

    if (eventName) {
      const subsc = (this._subscriberCache.get(eventName) || [])
        .filter(s => selector !== undefined && s.selector !== selector || handler && s.handler !== handler);

      if (subsc.length) {
        this._subscriberCache.set(eventName, subsc);
      } else {
        this._subscriberCache.delete(eventName);

        const listener = this._listenerCache.get(eventName);

        if (listener) {
          this._listenerCache.delete(eventName);
          removeEventListener(listener, eventName);
        }
      }
    } else {
      this._subscriberCache.clear();
      this._listenerCache.forEach(removeEventListener);
      this._listenerCache.clear();
    }
    return this;
  }

  /**
   * Adds a one-time event listener that will be automatically removed after execution.
   * @overload
   * @param {string} eventName - Name of the event to listen for
   * @param {string} selector - CSS selector to match target elements
   * @param {EventListener} handler - Event handler function to be executed once
   * @returns {Delegate} Current delegate instance for chaining
   *
   * @overload
   * @param {string} eventName - Name of the event to listen for
   * @param {EventListener} handler - Event handler function to be executed once
   * @returns {Delegate} Current delegate instance for chaining
   *
   * @param {string} eventName - Name of the event to listen for
   * @param {string | EventListener} selector - CSS selector or event handler function
   * @param {EventListener} [handler] - Event handler function to be executed once
   * @returns {Delegate} Current delegate instance for chaining
   */
  one (eventName, selector, handler) {
    if (typeof selector === 'function') {
      handler = selector;
      selector = '';
    }

    /**
     * @type {EventListener}
     */
    const handler2 = evt => {
      this.off(eventName, selector, handler2);
      handler?.call(evt.currentTarget, evt);
    };

    return this.on(eventName, selector, handler2);
  }

  /**
   * Clears all event listeners and removes the delegator from cache.
   * @returns {void}
   */
  clear () {
    this.off();
    delegatorCache.delete(this._baseEventTarget);
  }
}

/**
 * Creates or retrieves a delegate instance for the specified event target.
 * @param {EventTarget} baseEventTarget - The base event target to attach event listeners to
 * @returns {Delegate} A delegate instance for the specified event target
 * @throws {TypeError} If the baseEventTarget is not an instance of EventTarget
 */
const delegate = baseEventTarget => {
  if (!(baseEventTarget instanceof EventTarget)) {
    throw new TypeError(`${baseEventTarget} is not an EventTarget`);
  }
  return delegatorCache.get(baseEventTarget) || (() => {
    const delegator = new Delegate(baseEventTarget);
    delegatorCache.set(baseEventTarget, delegator);
    return delegator;
  })();
};

export default delegate;
