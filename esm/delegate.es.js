/**
 * @preserve delegate (c) KNOWLEDGECODE | MIT
 */
let delegateCache = [];

const findIndex = (array, cb) => {
    for (let i = 0, len = array.length; i < len; i++) {
        if (cb(array[i])) {
            return i;
        }
    }
    return -1;
};

const find = (array, cb) => array[findIndex(array, cb)];

const split = (array, cb) => {
    const match = [];
    const unmatch = [];

    for (let i = 0, len = array.length; i < len; i++) {
        if (cb(array[i])) {
            match.push(array[i]);
        } else {
            unmatch.push(array[i]);
        }
    }
    return [match, unmatch];
};

const each = (array, cb) => {
    for (let i = 0, len = array.length; i < len; i++) {
        cb(array[i]);
    }
};

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
        this._handlerCache = {};
        this._subscribers = {};
        this._eventCache = [];
        return this;
    }

    listener (evt) {
        let subscribers = this._subscribers[evt.type] || [];
        let target = evt.target || {};

        while (target.parentNode) {
            const evt2 = new DelegateEvent(evt, target);
            const [match, unmatch] = split(subscribers, (t => s => t.matches(s.selector))(target));

            for (let i = 0, len = match.length; i < len; i++) {
                match[i].handler.call(target, evt2);
                if (evt2.abort) {
                    break;
                }
            }
            if (!unmatch.length || evt2.stop) {
                break;
            }
            subscribers = unmatch;
            target = target.parentNode || {};
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
        if (selector) {
            const subscribers = this._subscribers[eventName] = this._subscribers[eventName] || [];

            if (!find(subscribers, s => s.selector === selector && s.handler === handler)) {
                subscribers.push({ selector, handler });
                if (!this._handlerCache[eventName]) {
                    const listener2 = this.listener.bind(this);

                    this._handlerCache[eventName] = listener2;
                    this._baseEventTarget.addEventListener(eventName, listener2, true);
                }
            }
        } else if (!find(this._eventCache, cache => cache.eventName === eventName && cache.handler === handler)) {
            this._eventCache.push({ eventName, handler });
            this._baseEventTarget.addEventListener(eventName, handler, true);
        }
        return this;
    }

    /**
     * off
     * @param {string} [eventName] - An event name. If omit it, all the listeners will be removed.
     * @param {string|Function} [selector] - A selector to match | An event listener
     * @param {Function} [handler] - An event listener. If omit it, all the listeners corresponded to the `eventName` will be removed.
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
            each(this._eventCache, cache => this._baseEventTarget.removeEventListener(cache.eventName, cache.handler, true));
            this._eventCache = [];
        } else if (!selector && !handler) {
            // Delete all the listeners corresponded to the eventName.
            delete this._subscribers[eventName];

            const [match, unmatch] = split(this._eventCache, cache => cache.eventName === eventName);

            each(match, cache => this._baseEventTarget.removeEventListener(eventName, cache.handler, true));
            this._eventCache = unmatch;
        } else if (selector) {
            // Delete all the subscribers corresponded to the eventName and the selector.
            this._subscribers[eventName] = (this._subscribers[eventName] || []).filter(s => s.selector === selector && (!handler || s.handler === handler));
            if (!this._subscribers[eventName].length) {
                delete this._subscribers[eventName];
            }
        } else {
            const index = findIndex(this._eventCache, cache => cache.eventName === eventName && cache.handler === handler);

            if (index > -1) {
                this._baseEventTarget.removeEventListener(eventName, handler, true);
                delete this._eventCache[index];
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
        each(Object.keys(this._handlerCache), key => this._baseEventTarget.removeEventListener(key, this._handlerCache[key], true));
        this._handlerCache = {};
        delegateCache = delegateCache.filter(cache => this._baseEventTarget !== cache.baseEventTarget);
    }
}

const delegate = baseEventTarget => {
    if (!baseEventTarget instanceof EventTarget) {
        throw new TypeError(`${baseEventTarget} is not an EventTarget`);
    }
    return (find(delegateCache, cache => baseEventTarget === cache.baseEventTarget) || (() => {
        delegateCache.push({ baseEventTarget, delegator: new Delegate(baseEventTarget) });
        return delegateCache.slice(-1)[0];
    })()).delegator;
};

export default delegate;
