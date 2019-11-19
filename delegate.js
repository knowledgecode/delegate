/**
 * @preserve delegate (c) KNOWLEDGECODE | MIT
 */
(function (global) {
    'use strict';

    var matches = (function () {
        var p = Element.prototype,
            m = p.matches || p.msMatchesSelector;

        return function (target, selector) {
            return m.call(target, selector);
        };
    }());

    var DelegateEvent = function (evt, target) {
        this.originalEvent = evt;
        this.stop = !evt.bubbles;
        this.abort = false;
        this.currentTarget = target;
    };

    DelegateEvent.prototype.preventDefault = function () {
        this.originalEvent.preventDefault();
    };

    DelegateEvent.prototype.stopPropagation = function () {
        this.stop = true;
    };

    DelegateEvent.prototype.stopImmediatePropagation = function () {
        this.abort = this.stop = true;
    };

    var delegateCache = [];

    var forEach = function (array, fn) {
        for (var i = 0, len = array.length; i < len; i++) {
            fn(array[i], i);
        }
    };

    var Delegate = function (baseEventTarget) {
        this._baseEventTarget = baseEventTarget;
        this._eventCache = {};
        this._subscribers = {};
        return this;
    };

    Delegate.prototype.listener = function (evt) {
        var subscribers = this._subscribers[evt.type] || [];
        var target = evt.target;
        var evt2, remains, i, len, sub;

        while (target.parentNode) {
            evt2 = new DelegateEvent(evt, target);
            remains = [];

            for (i = 0, len = subscribers.length; i < len; i++) {
                sub = subscribers[i];
                if (sub.selector && matches(target, sub.selector)) {
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

        evt2 = new DelegateEvent(evt, target);

        for (i = 0, len = subscribers.length; i < len; i++) {
            sub = subscribers[i];
            if (!sub.selector) {
                sub.handler.call(target, evt2);
                if (evt2.abort) {
                    break;
                }
            }
        }
    };

    /**
     * on
     * @param {string} eventName - An event name
     * @param {string|Function} selector - A selector to match | An event listener
     * @param {Function} [handler] - An event listener
     * @returns {Object} delegator
     */
    Delegate.prototype.on = function (eventName, selector, handler) {
        var listener2;

        if (typeof selector === 'function') {
            handler = selector;
            selector = null;
        }
        if (!~Object.keys(this._eventCache).indexOf(eventName)) {
            listener2 = this.listener.bind(this);
            this._baseEventTarget.addEventListener(eventName, listener2, true);
            this._eventCache[eventName] = listener2;
        }
        this._subscribers[eventName] = this._subscribers[eventName] || [];
        this._subscribers[eventName].push({ selector: selector, handler: handler });
        return this;
    };

    /**
     * off
     * @param {string} [eventName] - An event name. If omit it, all the listeners will be removed.
     * @param {string|Function} [selector] - A selector to match | An event listener
     * @param {Function} [handler] - An event listener. If omit it, all the listeners that are related to the `eventName` will be removed.
     * @returns {Object} delegator
     */
    Delegate.prototype.off = function (eventName, selector, handler) {
        var remains = [];

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
            forEach(this._subscribers[eventName], function (sub) {
                if (sub.selector !== selector || sub.handler !== handler) {
                    remains[remains.length] = sub;
                }
            });
            if (remains.length) {
                this._subscribers[eventName] = remains;
            } else {
                delete this._subscribers[eventName];
            }
        }
        return this;
    };

    /**
     * one
     * @param {string} eventName - An event name
     * @param {string|Function} selector - A selector to match | An event listener, which is fired only once.
     * @param {Function} [handler] - An event listener, which is fired only once.
     * @returns {Object} delegator
     */
    Delegate.prototype.one = function (eventName, selector, handler) {
        var _this = this;
        var handler2 = function (evt) {
            _this.off(eventName, selector || handler2, handler2);
            handler.call(this, evt);
        };

        if (typeof selector === 'function') {
            handler = selector;
            selector = null;
            return this.on(eventName, handler2);
        }
        return this.on(eventName, selector, handler2);
    };

    /**
     * clear
     * @returns {void}
     */
    Delegate.prototype.clear = function () {
        this.off();
        forEach(Object.keys(this._eventCache), function (key) {
            this._baseEventTarget.removeEventListener(key, this._eventCache[key], true);
        }.bind(this));
        this._eventCache = {};
        for (var i = 0, len = delegateCache.length; i < len; i++) {
            if (this._baseEventTarget === delegateCache[i].baseEventTarget) {
                delegateCache.splice(i, 1);
                break;
            }
        }
    };

    global.delegate = function (baseEventTarget) {
        if (!baseEventTarget.addEventListener) {
            throw new TypeError(baseEventTarget + ' is not an EventTarget');
        }
        for (var i = 0, len = delegateCache.length; i < len; i++) {
            if (baseEventTarget === delegateCache[i].baseEventTarget) {
                return delegateCache[i].delegator;
            }
        }
        var delegator = new Delegate(baseEventTarget);
        delegateCache.push({ baseEventTarget: baseEventTarget, delegator: delegator });
        return delegator;
    };

}(this));
