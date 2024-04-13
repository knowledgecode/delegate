/**
 * @preserve delegate (c) KNOWLEDGECODE | MIT
 */
const delegatorCache = new WeakMap();

class DelegateEvent {
  constructor (evt, target) {
    this.originalEvent = evt;
    this.stop = !evt.bubbles;
    this.abort = false;
    this.currentTarget = target;
  }

  preventDefault () {
    this.originalEvent.preventDefault();
  }

  stopPropagation () {
    this.stop = true;
  }

  stopImmediatePropagation () {
    this.abort = this.stop = true;
  }
}

class Delegate {
  constructor (baseEventTarget) {
    this._baseEventTarget = baseEventTarget;
    this._listenerCache = new Map();
    this._subscriberCache = new Map();
  }

  _listener (passive, evt) {
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
        if (s.selector && target.matches(s.selector)) {
          s.handler.call(target, evt2);
          return false;
        }
        return true;
      });

      if (target.parentNode && subsc2.length && !evt2.stop) {
        fn(target.parentNode, subsc2);
      }
    };

    fn(
      evt.currentTarget === self ? self : evt.target,
      this._subscriberCache.get(`${evt.type}${passive ? ':passive' : ''}`) || []
    );
  }

  /**
   * on
   * @param {string} eventName - An event name
   * @param {string|Function} selector - A selector to match | An event listener
   * @param {Function} [handler] - An event listener
   * @returns {Object} delegator
   */
  on (eventName, selector, handler) {
    if (typeof selector === 'function') {
      handler = selector;
      selector = null;
    }

    const subsc = this._subscriberCache.get(eventName) || [];

    if (subsc.findIndex(s => s.selector === selector && s.handler === handler) < 0) {
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
   * off
   * @param {string} [eventName] - An event name
   * @param {string} [selector] - A selector to match | An event listener
   * @param {Function} [handler] - An event listener
   * @returns {Object} delegator
   */
  off (eventName, selector, handler) {
    if (typeof selector === 'function') {
      handler = selector;
      selector = null;
    }

    const removeEventListener = (_listener, _eventName) => {
      const [eventName2, passive] = _eventName.split(':');

      this._baseEventTarget.removeEventListener(
        eventName2, _listener, { capture: true, passive: passive === 'passive' }
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
   * one
   * @param {string} eventName - An event name
   * @param {string|Function} selector - A selector to match | An event listener, which is fired only once.
   * @param {Function} [handler] - An event listener, which is fired only once.
   * @returns {Object} delegator
   */
  one (eventName, selector, handler) {
    const handler2 = evt => {
      this.off(eventName, selector || null, handler2);
      handler.call(handler, evt);
    };
    return this.on(eventName, selector || null, handler2);
  }

  /**
   * clear
   * @returns {void}
   */
  clear () {
    this.off();
    delegatorCache.delete(this._baseEventTarget);
  }
}

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
