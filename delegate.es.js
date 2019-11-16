/**
 * @preserve delegate (c) KNOWLEDGECODE | MIT
 */
class DelegateEvent {
    constructor (evt, target) {
        this.originalEvent = evt;
        this.bubbles = evt.bubbles;
        this.currentTarget = target;
    }

    preventDefault () {
        this.originalEvent.preventDefault();
    }

    stopPropagation () {
        this.bubbles = false;
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
                if (sub.selector && target.matches(sub.selector)) {
                    sub.handler.call(target, evt2);
                } else {
                    remains[remains.length] = sub;
                }
            }
            if (!remains.length || !evt2.bubbles) {
                return;
            }
            subscribers = remains;
            target = target.parentNode;
        }
        target = evt.currentTarget;
        for (const sub of subscribers) {
            if (!sub.selector) {
                sub.handler.call(target, new DelegateEvent(evt, target));
            }
        }
    }

    /**
     * on
     * @param {string} eventName - An event name
     * @param {string|Function} selector - A selector which you want to match | An event listener.
     * @param {Function} [handler] - An event listener
     * @returns {Object} etageled
     */
    on (eventName, selector, handler) {
        if (typeof selector === 'function') {
            handler = selector;
            selector = null;
        }
        if (!~Object.keys(this._eventCache).indexOf(eventName)) {
            const listener2 = this.listener.bind(this);
            this._baseEventTarget.addEventListener(eventName, listener2, { capture: true, passive: false });
            this._eventCache[eventName] = listener2;
        }
        this._subscribers[eventName] = this._subscribers[eventName] || [];
        this._subscribers[eventName].push({ selector, handler });
        return this;
    }

    /**
     * off
     * @param {string} [eventName] - An event name. If omit it, all the listeners will be removed.
     * @param {string|Function} [selector] - A selector which you want to match | An event listener.
     * @param {Function} [handler] - An event listener. If omit it, all the listeners that are related with the `eventName` will be removed.
     * @returns {Object} etageled
     */
    off (eventName, selector, handler) {
        if (typeof selector === 'function') {
            handler = selector;
            selector = null;
        }
        if (!eventName) {
            // Clear all listener.
            this._subscribers = {};
        } else if (!selector && !handler) {
            // Clear all listener about the eventName.
            delete this._subscribers[eventName];
        } else {
            const remains = [];

            for (const sub of this._subscribers[eventName]) {
                if (sub.selector !== selector || sub.handler !== handler) {
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
     * @param {string} selector - A selector which you want to match.
     * @param {Function} handler - An event listener, which is fired only once.
     * @returns {Object} etageled
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
     * @returns {Object} etageled
     */
    clear () {
        this.off();
        for (const key of Object.keys(this._eventCache)) {
            this._baseEventTarget.removeEventListener(key, this._eventCache[key], { capture: true });
        }
        this._eventCache = {};
        for (let i = 0, len = delegateCache.length; i < len; i++) {
            if (this._baseEventTarget === delegateCache[i].baseEventTarget) {
                delegateCache.splice(i, 1);
                break;
            }
        }
        return this;
    }
}

export default baseEventTarget => {
    if (!baseEventTarget instanceof EventTarget) {
        throw new TypeError(`${baseEventTarget} is not an EventTarget`);
    }
    for (const cache of delegateCache) {
        if (baseEventTarget === cache.baseEventTarget) {
            return cache.object;
        }
    }
    const obj = new Delegate(baseEventTarget);
    delegateCache.push({ baseEventTarget, object: obj });
    return obj;
};
