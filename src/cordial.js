/**
 * cordial.js: A JavaScript library allowing different sections of code to
 * cooperatively work together and thus make destructive operations safer.
 */

(function () {
    var root = this;

    var previousCordial = root.Cordial;

    var _array = [];
    var slice = _array.slice;

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

    Cordial.noConflict = function () {
        root.Cordial = previousCordial;
        return this;
    };

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

    Cordial.yes = function (key) {
        _validateKey(key);
        _removeWaiter(key);
    };

    Cordial.yesButNotNow = function (key) {
        _validateKey(key);

        if (key in registeredWaiters) {
            _removeRequest();
            _removeWaiter(key);
        }
    };

    Cordial.no = function (key) {
        _validateKey(key);

        if (key in registeredWaiters) {
            _removeRequest();
        }
    };

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
        }
    }

    function _removeRequest() {
        registeredRequest = null;
    }

}).call(this);
