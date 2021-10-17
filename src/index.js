/**
 * @preserve delegate (c) KNOWLEDGECODE | MIT
 */
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.webkitMatchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector;
}

const delegateCache = new WeakMap();

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
        this._eventCache = {};
        this._subscribers = {};
    }

    listener (passive, evt) {
        let subscribers = this._subscribers[evt.type + passive] || [];
        let target = evt.currentTarget === window ? window : evt.target;

        do {
            const evt2 = new DelegateEvent(evt, target);

            subscribers = subscribers.filter((t => s => {
                if (evt2.abort) {
                    return false;
                }
                if (t === evt.currentTarget) {
                    if (!s.selector) {
                        s.handler.call(t, evt2);
                    }
                    return false;
                }
                if (s.selector && t.matches(s.selector)) {
                    s.handler.call(t, evt2);
                    return false;
                }
                return true;
            })(target));
            if (!subscribers.length || evt2.stop) {
                break;
            }
        } while ((target = target.parentNode));
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
        const subscribers = this._subscribers[eventName] = this._subscribers[eventName] || [];

        if (!subscribers.some(s => s.selector === selector && s.handler === handler)) {
            subscribers.push({ selector, handler });
            if (!this._eventCache[eventName]) {
                const [eventName2, passive] = eventName.split(':');
                const listener2 = this.listener.bind(this, passive === 'passive' ? ':passive' : '');

                this._eventCache[eventName] = listener2;
                this._baseEventTarget.addEventListener(eventName2, listener2, { capture: true, passive: passive === 'passive' });
            }
        }
        return this;
    }

    /**
     * off
     * @param {string} [eventName] - An event name. If omit it, all the listeners will be removed.
     * @param {string|Function} [selector] - A selector to match | An event listener
     * @param {Function} [handler] - An event listener. If omit it, all the listeners that are corresponded to the `eventName` will be removed.
     * @returns {Object} delegator
     */
    off (eventName, selector, handler) {
        if (typeof selector === 'function') {
            handler = selector;
            selector = null;
        }
        if (!eventName) {
            // Delete all the listeners.
            this._subscribers = {};
        } else if (!selector && !handler) {
            // Delete all the listeners corresponded to the eventName.
            delete this._subscribers[eventName];
        } else {
            // Delete all the subscribers corresponded to the eventName and the selector.
            this._subscribers[eventName] = (this._subscribers[eventName] || []).filter(
                s => s.selector !== selector || handler && s.handler !== handler
            );
            if (!this._subscribers[eventName].length) {
                delete this._subscribers[eventName];
            }
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
        const _this = this;
        const handler2 = function (evt) {
            _this.off(eventName, selector || handler2, handler2);
            handler.call(this, evt);
        };
        if (typeof selector === 'function') {
            handler = selector;
            selector = null;
            return this.on(eventName, handler2);
        }
        return this.on(eventName, selector, handler2);
    }

    /**
     * clear
     * @returns {void}
     */
    clear () {
        this.off();
        Object.keys(this._eventCache).forEach(eventName => {
            const [eventName2, passive] = eventName.split(':');
            this._baseEventTarget.removeEventListener(eventName2, this._eventCache[eventName], { capture: true, passive: passive === 'passive' });
        });
        this._eventCache = {};
        delegateCache.delete(this._baseEventTarget);
    }
}

const delegate = baseEventTarget => {
    if (!(typeof baseEventTarget.addEventListener === 'function')) {
        throw new TypeError(`${baseEventTarget} is not an EventTarget`);
    }
    return delegateCache.get(baseEventTarget) || (() => {
        const delegator = new Delegate(baseEventTarget);
        delegateCache.set(baseEventTarget, delegator);
        return delegator;
    })();
};

export default delegate;
