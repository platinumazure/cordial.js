/**
 * cordial.js: A JavaScript library allowing different sections of code to
 * cooperatively work together and thus make destructive operations safer.
 */

(function () {
    var root = this;

    var previousCordial = root.Cordial;

    var _array = [];
    var slice = _array.slice;

    // Data about currently registered waiters and the current request.
    var registeredWaiters = {};
    var numberOfWaiters = 0;

    var registeredRequest = null;

    var Cordial;
    if (typeof exports !== 'undefined') {
        Cordial = exports;
    } else {
        Cordial = root.Cordial = {};
    }

    Cordial.VERSION = '0.1.0';

    /**
     * Resets the global Cordial object to its previous value. Returns this
     * module for storage in a different variable.
     *
     * @return {Object} The Cordial module.
     */
    Cordial.noConflict = function () {
        root.Cordial = previousCordial;
        return this;
    };

    /**
     * Register to be notified of an incoming request. If a request comes in
     * through `Cordial.mayI()`, callback will be invoked.
     *
     * When calling this method, the caller may optionally include a calling
     * context and arguments, which will be passed to the callback when it is
     * invoked.
     *
     * @param {string} key The key used to track this registration.
     * @param {function} callback The callback function to be invoked when a
     * request comes in.
     * @param {object} context The calling context with which to invoke the
     * callback.
     * @param {...mixed} args The arguments with which to invoke the callback.
     * @throws {TypeError} If key is not a string
     * @throws {TypeError} If callback is not a function
     */
    Cordial.pleaseWait = function (key, callback, context) {
        if (typeof callback !== 'function') {
            throw new TypeError("Callback is not a function");
        }

        _validateKey(key);

        var args = slice.call(arguments, 3);

        var callbackInfo = {
            'callback': callback,
            'context': context,
            'args': args
        };
        _addWaiter(key, callbackInfo);
    };

    /**
     * Signal that the caller wishes to allow the current request and future
     * requests and removes the caller from the notification registry.
     *
     * Has no effect if the key had not previously been registered via
     * Cordial.pleaseWait().
     *
     * @param {string} key The key used to register a callback earlier.
     * @throws {TypeError} If the key is not a string.
     */
    Cordial.yes = function (key) {
        _validateKey(key);
        _removeWaiter(key);
    };

    /**
     * Signal that the caller wishes to deny the current request but allow
     * future requests and removes the caller from the notification registry.
     *
     * Has no effect if the key had not previously been registered via
     * Cordial.pleaseWait().
     *
     * @param {string} key The key used to register a callback earlier.
     * @throws {TypeError} If the key is not a string.
     */
    Cordial.yesButNotNow = function (key) {
        _validateKey(key);

        if (key in registeredWaiters) {
            _removeRequest();
            _removeWaiter(key);
        }
    };

    /**
     * Signal that the caller wishes to deny the current request and remain
     * registered for future requests.
     *
     * Has no effect if the key had not previously been registered via
     * Cordial.pleaseWait().
     *
     * @param {string} key The key used to register a callback earlier.
     * @throws {TypeError} If the key is not a string.
     */
    Cordial.no = function (key) {
        _validateKey(key);

        if (key in registeredWaiters) {
            _removeRequest();
        }
    };

    /**
     * Registers a request. If no one is waiting on requests, the callback is
     * invoked immediately and synchronously; otherwise, waiters are notified
     * and callback is stored, possibly to be invoked later.
     *
     * @param {function} callback The request callback, to be invoked when all
     * waiters have allowed it.
     * @param {object} context The calling context with which the request
     * callback will be invoked.
     * @param {...mixed} args The arguments with which the request callback will
     * be invoked.
     * @returns {mixed} If the callback can be invoked immediately, its return
     * value is returned from this function. If callback must be deferred,
     * false is returned instead.
     */
    Cordial.mayI = function (callback, context) {
        if (typeof callback !== 'function') {
            throw new TypeError("Callback was not a function");
        }

        var args = slice.call(arguments, 2);

        if (!numberOfWaiters) {
            return callback.apply(context, args);
        } else {
            if (registeredRequest) {
                throw new Error("A request is already being considered");
            }

            registeredRequest = {
                callback: callback,
                context: context,
                args: args
            };

            _notifyWaiters();

            return false;
        }
    };

    /**
     * Resets the module state. Cancels any pending request and removes all
     * waiters.
     */
    Cordial.reset = function () {
        _removeRequest();
        registeredWaiters = {};
        numberOfWaiters = 0;
    };

    function _validateKey(key) {
        // TODO: Expand to allow multiple types of keys
        if (typeof key !== 'string') {
            throw new TypeError("Key must be a string");
        }
    }

    function _addWaiter(key, callbackInfo) {
        registeredWaiters[key] = callbackInfo;
        ++numberOfWaiters;
    }

    function _removeWaiter(key) {
        if (key in registeredWaiters) {
            delete registeredWaiters[key];
            --numberOfWaiters;
        }

        if (numberOfWaiters === 0) {
            _grantRequest();
        }
    }

    function _notifyWaiters() {
        for (var key in registeredWaiters) {
            if (!registeredWaiters.hasOwnProperty(key)) {
                continue;
            }

            var waiter = registeredWaiters[key];
            try {
                waiter.callback.apply(waiter.context, waiter.args);
            }
            catch (e) {
                // do nothing
            }
        }
    }

    function _grantRequest() {
        if (registeredRequest) {
            var callback = registeredRequest.callback;
            var context = registeredRequest.context;
            var args = registeredRequest.args;

            callback.apply(context, args);

            _removeRequest();
        }
    }

    function _removeRequest() {
        registeredRequest = null;
    }

}).call(this);
