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
        this.bubbles = evt.bubbles;
        this.currentTarget = target;
    };

    DelegateEvent.prototype.preventDefault = function () {
        this.originalEvent.preventDefault();
    };

    DelegateEvent.prototype.stopPropagation = function () {
        this.bubbles = false;
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
        var evt2, remains;

        while (target.parentNode) {
            evt2 = new DelegateEvent(evt, target);
            remains = [];

            forEach(subscribers, (function (_t, _e, _r) {
                return function (sub) {
                    if (sub.selector) {
                        if (matches(_t, sub.selector)) {
                            sub.handler.call(_t, _e);
                        } else {
                            _r[_r.length] = sub;
                        }
                    }
                };
            }(target, evt2, remains)));
            if (!remains.length || !evt2.bubbles) {
                return;
            }
            subscribers = remains;
            target = target.parentNode;
        }
        target = evt.currentTarget;
        forEach(subscribers, function (sub) {
            if (!sub.selector) {
                sub.handler.call(target, new DelegateEvent(evt, target));
            }
        });
    };

    Delegate.prototype.on = function (eventName, selector, handler) {
        var listener2;

        if (typeof selector === 'function') {
            handler = selector;
            selector = null;
        }
        if (!~Object.keys(this._eventCache).indexOf(eventName)) {
            listener2 = this.listener.bind(this);
            this._baseEventTarget.addEventListener(eventName, listener2, { capture: true, passive: false });
            this._eventCache[eventName] = listener2;
        }
        this._subscribers[eventName] = this._subscribers[eventName] || [];
        this._subscribers[eventName].push({ selector: selector, handler: handler });
        return this;
    };

    Delegate.prototype.off = function (eventName, selector, handler) {
        var remains = [];

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
        return this;
    };

    global.delegate = function (baseEventTarget) {
        if (!baseEventTarget.addEventListener) {
            throw new TypeError(baseEventTarget + ' is not an EventTarget');
        }
        for (var i = 0, len = delegateCache.length; i < len; i++) {
            if (baseEventTarget === delegateCache[i].baseEventTarget) {
                return delegateCache[i].object;
            }
        }
        var obj = new Delegate(baseEventTarget);
        delegateCache.push({ baseEventTarget: baseEventTarget, object: obj });
        return obj;
    };

}(this));
