function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var delegate = function () {
  'use strict';
  /**
   * @preserve delegate (c) KNOWLEDGECODE | MIT
   */

  var delegateCache = [];

  var findIndex = function findIndex(array, cb) {
    for (var i = 0, len = array.length; i < len; i++) {
      if (cb(array[i])) {
        return i;
      }
    }

    return -1;
  };

  var find = function find(array, cb) {
    return array[findIndex(array, cb)];
  };

  var split = function split(array, cb) {
    var match = [];
    var unmatch = [];

    for (var i = 0, len = array.length; i < len; i++) {
      if (cb(array[i])) {
        match.push(array[i]);
      } else {
        unmatch.push(array[i]);
      }
    }

    return [match, unmatch];
  };

  var each = function each(array, cb) {
    for (var i = 0, len = array.length; i < len; i++) {
      cb(array[i]);
    }
  };

  var DelegateEvent = /*#__PURE__*/function () {
    function DelegateEvent(evt, target) {
      _classCallCheck(this, DelegateEvent);

      this.originalEvent = evt;
      this.stop = !evt.bubbles;
      this.abort = false;
      this.currentTarget = target;
    }

    _createClass(DelegateEvent, [{
      key: "preventDefault",
      value: function preventDefault() {
        this.originalEvent.preventDefault();
      }
    }, {
      key: "stopPropagation",
      value: function stopPropagation() {
        this.stop = true;
      }
    }, {
      key: "stopImmediatePropagation",
      value: function stopImmediatePropagation() {
        this.abort = this.stop = true;
      }
    }]);

    return DelegateEvent;
  }();

  var Delegate = /*#__PURE__*/function () {
    function Delegate(baseEventTarget) {
      _classCallCheck(this, Delegate);

      this._baseEventTarget = baseEventTarget;
      this._handlerCache = {};
      this._subscribers = {};
      this._eventCache = [];
      return this;
    }

    _createClass(Delegate, [{
      key: "listener",
      value: function listener(evt) {
        var subscribers = this._subscribers[evt.type] || [];
        var target = evt.target || {};

        while (target.parentNode) {
          var evt2 = new DelegateEvent(evt, target);

          var _split = split(subscribers, function (t) {
            return function (s) {
              return t.matches(s.selector);
            };
          }(target)),
              _split2 = _slicedToArray(_split, 2),
              match = _split2[0],
              unmatch = _split2[1];

          for (var i = 0, len = match.length; i < len; i++) {
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

    }, {
      key: "on",
      value: function on(eventName, selector, handler) {
        if (typeof selector === 'function') {
          handler = selector;
          selector = null;
        }

        if (selector) {
          var subscribers = this._subscribers[eventName] = this._subscribers[eventName] || [];

          if (!find(subscribers, function (s) {
            return s.selector === selector && s.handler === handler;
          })) {
            subscribers.push({
              selector: selector,
              handler: handler
            });

            if (!this._handlerCache[eventName]) {
              var listener2 = this.listener.bind(this);
              this._handlerCache[eventName] = listener2;

              this._baseEventTarget.addEventListener(eventName, listener2, true);
            }
          }
        } else if (!find(this._eventCache, function (cache) {
          return cache.eventName === eventName && cache.handler === handler;
        })) {
          this._eventCache.push({
            eventName: eventName,
            handler: handler
          });

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

    }, {
      key: "off",
      value: function off(eventName, selector, handler) {
        var _this2 = this;

        if (typeof selector === 'function') {
          handler = selector;
          selector = null;
        }

        if (!eventName) {
          // Delete all the listeners.
          this._subscribers = {};
          each(this._eventCache, function (cache) {
            return _this2._baseEventTarget.removeEventListener(cache.eventName, cache.handler, true);
          });
          this._eventCache = [];
        } else if (!selector && !handler) {
          // Delete all the listeners corresponded to the eventName.
          delete this._subscribers[eventName];

          var _split3 = split(this._eventCache, function (cache) {
            return cache.eventName === eventName;
          }),
              _split4 = _slicedToArray(_split3, 2),
              match = _split4[0],
              unmatch = _split4[1];

          each(match, function (cache) {
            return _this2._baseEventTarget.removeEventListener(eventName, cache.handler, true);
          });
          this._eventCache = unmatch;
        } else if (selector) {
          // Delete all the subscribers corresponded to the eventName and the selector.
          this._subscribers[eventName] = (this._subscribers[eventName] || []).filter(function (s) {
            return s.selector === selector && (!handler || s.handler === handler);
          });

          if (!this._subscribers[eventName].length) {
            delete this._subscribers[eventName];
          }
        } else {
          var index = findIndex(this._eventCache, function (cache) {
            return cache.eventName === eventName && cache.handler === handler;
          });

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

    }, {
      key: "one",
      value: function one(eventName, selector, handler) {
        var _this = this;

        var handler2 = function handler2(evt) {
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

    }, {
      key: "clear",
      value: function clear() {
        var _this3 = this;

        this.off();
        each(Object.keys(this._handlerCache), function (key) {
          return _this3._baseEventTarget.removeEventListener(key, _this3._handlerCache[key], true);
        });
        this._handlerCache = {};
        delegateCache = delegateCache.filter(function (cache) {
          return _this3._baseEventTarget !== cache.baseEventTarget;
        });
      }
    }]);

    return Delegate;
  }();

  var delegate = function delegate(baseEventTarget) {
    if (!baseEventTarget instanceof EventTarget) {
      throw new TypeError("".concat(baseEventTarget, " is not an EventTarget"));
    }

    return (find(delegateCache, function (cache) {
      return baseEventTarget === cache.baseEventTarget;
    }) || function () {
      delegateCache.push({
        baseEventTarget: baseEventTarget,
        delegator: new Delegate(baseEventTarget)
      });
      return delegateCache.slice(-1)[0];
    }()).delegator;
  };

  return delegate;
}();
