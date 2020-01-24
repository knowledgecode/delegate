/**
 * @preserve delegate (c) KNOWLEDGECODE | MIT
 */
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

const delegateCache = [];

class Delegate {
    constructor (baseEventTarget) {
        this._baseEventTarget = baseEventTarget;
        this._eventCache = {};
        this._subscribers = {};
        return this;
    }

    listener (evt) {
        let subscribers = this._subscribers[evt.type] || [];
        let target = evt.target;

        while (target.parentNode) {
            const evt2 = new DelegateEvent(evt, target);
            const remains = [];

            for (const sub of subscribers) {
                if (sub.selector && target.matches(sub.selector)
                    || !sub.selector && target === evt.currentTarget) {
                    sub.handler.call(target, evt2);
                    if (evt2.abort) {
                        break;
                    }
                } else {
                    remains[remains.length] = sub;
                }
            }
            if (!remains.length || evt2.stop) {
                return;
            }
            subscribers = remains;
            target = target.parentNode;
        }
        target = evt.currentTarget;

        const evt2 = new DelegateEvent(evt, target);

        for (const sub of subscribers) {
            if (!sub.selector) {
                sub.handler.call(target, evt2);
                if (evt2.abort) {
                    break;
                }
            }
        }
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
        if (!~Object.keys(this._eventCache).indexOf(eventName)) {
            const listener2 = this.listener.bind(this);
            this._baseEventTarget.addEventListener(eventName, listener2, true);
            this._eventCache[eventName] = listener2;
        }
        this._subscribers[eventName] = this._subscribers[eventName] || [];
        this._subscribers[eventName].push({ selector, handler });
        return this;
    }

    /**
     * off
     * @param {string} [eventName] - An event name. If omit it, all the listeners will be removed.
     * @param {string|Function} [selector] - A selector to match | An event listener
     * @param {Function} [handler] - An event listener. If omit it, all the listeners that are related to the `eventName` will be removed.
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
            // Delete all the listeners related to the eventName.
            delete this._subscribers[eventName];
        } else {
            const remains = [];

            for (const sub of this._subscribers[eventName]) {
                if (sub.selector !== selector || handler && sub.handler !== handler) {
                    remains[remains.length] = sub;
                }
            }
            if (remains.length) {
                this._subscribers[eventName] = remains;
            } else {
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
        for (const key of Object.keys(this._eventCache)) {
            this._baseEventTarget.removeEventListener(key, this._eventCache[key], true);
        }
        this._eventCache = {};
        for (let i = 0, len = delegateCache.length; i < len; i++) {
            if (this._baseEventTarget === delegateCache[i].baseEventTarget) {
                delegateCache.splice(i, 1);
                break;
            }
        }
    }
}

export default baseEventTarget => {
    if (!baseEventTarget instanceof EventTarget) {
        throw new TypeError(`${baseEventTarget} is not an EventTarget`);
    }
    for (const cache of delegateCache) {
        if (baseEventTarget === cache.baseEventTarget) {
            return cache.delegator;
        }
    }
    const delegator = new Delegate(baseEventTarget);
    delegateCache.push({ baseEventTarget, delegator });
    return delegator;
};
