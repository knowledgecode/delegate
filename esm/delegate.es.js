/**
 * @preserve delegate (c) KNOWLEDGECODE | MIT
 */
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.webkitMatchesSelector || Element.prototype.msMatchesSelector;
}

const delegateCache = new WeakMap();

const find = (array, cb) => {
    for (let i = 0, len = array.length; i < len; i++) {
        if (cb(array[i])) {
            return array[i];
        }
    }
    return undefined;
};

const forEach = (array, cb) => {
    for (let i = 0, len = array.length; i < len; i++) {
        cb(array[i], i);
    }
};

const split = (array, cb) => {
    const result = [[], []];

    forEach(array, item => cb(item) ? result[0].push(item) : result[1].push(item));
    return result;
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
        this._eventCache = {};
        this._subscribers = {};
        return this;
    }

    listener (evt) {
        let subscribers = this._subscribers[evt.type] || [];
        let target = evt.target;
        let match;

        if (!subscribers.length) {
            return;
        }
        while ((target || {}).parentNode) {
            [match, subscribers] = split(subscribers,
                (t => s => t.matches(s.selector) || !s.selector && t === evt.currentTarget)(target)
            );

            if (match.length) {
                const evt2 = new DelegateEvent(evt, target);

                for (let i = 0, len = match.length; i < len; i++) {
                    match[i].handler.call(target, evt2);
                    if (evt2.abort) {
                        return;
                    }
                }
                if (!subscribers.length || evt2.stop) {
                    return;
                }
            }
            target = target.parentNode;
        }

        [match] = split(subscribers, s => !s.selector);

        if (match.length) {
            target = evt.currentTarget;
            const evt2 = new DelegateEvent(evt, target);

            for (let i = 0, len = match.length; i < len; i++) {
                match[i].handler.call(target, evt2);
                if (evt2.abort) {
                    return;
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
        const subscribers = this._subscribers[eventName] = this._subscribers[eventName] || [];

        if (!find(subscribers, s => s.selector === selector && s.handler === handler)) {
            subscribers.push({ selector, handler });
            if (!this._eventCache[eventName]) {
                const listener2 = this.listener.bind(this);
                this._eventCache[eventName] = listener2;
                this._baseEventTarget.addEventListener(eventName, listener2, true);
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
                s => s.selector === selector && (!handler || s.handler === handler)
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
        forEach(Object.keys(this._eventCache), eventName => {
            this._baseEventTarget.removeEventListener(eventName, this._eventCache[eventName], true);
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
