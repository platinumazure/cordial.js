/**
 * cordial.js: A JavaScript library allowing different sections of code to
 * cooperatively work together and thus make destructive operations safer.
 */

(function () {
    var root = this;

    var previousCordial = root.Cordial;

    var _array = [];
    var slice = _array.slice;

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
}).call(this);
