/**
 * cordial.tests.js: QUnit tests for Cordial.js.
 */

var sandbox;
var oldCordial = Cordial;

module('Cordial', {
    setup: function () {
        sandbox = sinon.sandbox.create();
    },
    teardown: function () {
        sandbox.restore();
        Cordial = oldCordial;
    }
});

test('Cordial.noConflict() resets window.Cordial object and returns itself', 2, function () {
    // arrange
    var currentCordial = Cordial;

    // act
    var result = Cordial.noConflict();

    // assert
    notEqual(result, Cordial, "window.Cordial no longer points to Cordial module");
    strictEqual(result, currentCordial, "Cordial.noConflict() returns the Cordial module instance");
});

test('Cordial.pleaseWait() throws TypeError if callback is not a function', 1, function () {
    // arrange
    var cordial = new Cordial();

    // act/assert
    raises(function () {
        cordial.pleaseWait("key", "not a function");
    }, TypeError, "TypeError was thrown");
});

test('Cordial.mayI() throws TypeError if callback is not a function', 1, function () {
    // arrange
    var cordial = new Cordial();

    // act/assert
    raises(function () {
        cordial.mayI("not a function");
    }, TypeError, "TypeError was thrown");
});

test('Cordial.mayI() executes callback immediately if no one is asking to wait', 1, function () {
    // arrange
    var cordial = new Cordial();

    var callbackStub = sandbox.stub();

    // act
    cordial.mayI(callbackStub);

    // assert
    ok(callbackStub.calledOnce, "Callback was called once");
});

test('Cordial.mayI() returns result of callback when executed immediately', 1, function () {
    // arrange
    var cordial = new Cordial();

    var expected = "yay";
    var callbackStub = sandbox.stub().returns(expected);

    // act
    var result = cordial.mayI(callbackStub);

    // assert
    strictEqual(result, expected, "Correct value was returned");
});

test('Cordial.mayI() executes callback with correct calling context and arguments', 3, function () {
    // arrange
    var cordial = new Cordial();

    var callbackStub = sandbox.stub();
    var context = {};

    // act
    cordial.mayI(callbackStub, context, "arg1", "arg2");

    // assert
    ok(callbackStub.calledOnce, "Callback was called once");
    ok(callbackStub.alwaysCalledOn(context), "Callback was called with correct context");
    deepEqual(callbackStub.args[0], ["arg1", "arg2"], "Callback was called with correct arguments");
});

test('Cordial.mayI() does not execute callback if one or more waiters are waiting', 1, function () {
    // arrange
    var cordial = new Cordial();
    var callbackStub = sandbox.stub();

    cordial.pleaseWait("key", sandbox.stub());

    // act
    cordial.mayI(callbackStub);

    // assert
    ok(!callbackStub.called, "Callback was not called");
});

test('Cordial.mayI() returns false if callback cannot be executed immediately', 1, function () {
    // arrange
    var cordial = new Cordial();
    var callbackStub = sandbox.stub().returns("yay");

    cordial.pleaseWait("key", sandbox.stub());

    // act
    var result = cordial.mayI(callbackStub);

    // assert
    strictEqual(result, false, "False was returned");
});

test('Cordial.mayI() notifies waiters by invoking callbacks with correct context and arguments', 6, function () {
    // arrange
    var cordial = new Cordial();

    var firstWaiter = sandbox.stub();
    var firstContext = {};

    var secondWaiter = sandbox.stub();
    var secondContext = {};

    cordial.pleaseWait("key1", firstWaiter, firstContext);
    cordial.pleaseWait("key2", secondWaiter, secondContext, "arg");

    // act
    cordial.mayI(sandbox.stub());

    // assert
    ok(firstWaiter.calledOnce, "First waiter was called once");
    ok(firstWaiter.alwaysCalledOn(firstContext), "First waiter was called with correct context");
    deepEqual(firstWaiter.args[0], [], "First waiter was called with correct arguments");
    ok(secondWaiter.calledOnce, "Second waiter was called once");
    ok(secondWaiter.alwaysCalledOn(secondContext), "Second waiter was called with correct context");
    deepEqual(secondWaiter.args[0], ["arg"], "Second waiter was called with correct arguments");
});

test('Cordial.mayI() throws Error if called twice without the first request being resolved before the second call', 1, function () {
    // arrange
    var cordial = new Cordial();

    cordial.pleaseWait("key", sandbox.stub());
    cordial.mayI(sandbox.stub());

    // act/assert
    raises(function () {
        Cordial.mayI(sandbox.stub());
    }, Error, "Error was thrown");
});

test('Cordial.mayI() executes two requests if no waiters are waiting', 2, function () {
    // arrange
    var cordial = new Cordial();

    var first = sandbox.stub();
    var second = sandbox.stub();

    // act
    cordial.mayI(first);
    cordial.mayI(second);

    // assert
    ok(first.calledOnce, "First callback was called once");
    ok(second.calledOnce, "Second callback was called once");
});

test('Cordial.mayI() does not throw Error if called twice with first request being resolved before the second call', 1, function () {
    // arrange
    var cordial = new Cordial();

    cordial.pleaseWait("key", sandbox.stub());
    cordial.mayI(sandbox.stub());
    cordial.no("key");

    // act
    cordial.mayI(sandbox.stub());

    // assert
    ok(true, "No exception was thrown");
});

test('Cordial.yes() does not allow request to proceed if other waiters are still waiting', 1, function () {
    // arrange
    var cordial = new Cordial();

    cordial.pleaseWait("key1", sandbox.stub());
    cordial.pleaseWait("key2", sandbox.stub());

    var requestCallback = sandbox.stub();
    cordial.mayI(requestCallback);

    // act
    cordial.yes("key1");

    // assert
    ok(!requestCallback.called, "Request has not proceeded");
});

test('Cordial.yes() allows request to proceed if no other waiters are still waiting', 1, function () {
    // arrange
    var cordial = new Cordial();

    cordial.pleaseWait("key1", sandbox.stub());
    cordial.pleaseWait("key2", sandbox.stub());

    var requestCallback = sandbox.stub();
    cordial.mayI(requestCallback);

    cordial.yes("key1");

    // act
    cordial.yes("key2");

    // assert
    ok(requestCallback.calledOnce, "Request has proceeded");
});

test('Cordial.yes() does nothing if Cordial.pleaseWait() was not called earlier', 2, function () {
    // arrange
    var cordial = new Cordial();

    cordial.pleaseWait("key1", sandbox.stub());

    var requestCallback = sandbox.stub();
    cordial.mayI(requestCallback);

    // act
    cordial.yes("bad key");

    // assert
    ok(true, "No exception was thrown");
    ok(!requestCallback.called, "Request has not proceeded");
});

test('Cordial.no() prevents current request and defers future request', 2, function () {
    // arrange
    var cordial = new Cordial();

    cordial.pleaseWait("key1", sandbox.stub());

    var firstRequestCallback = sandbox.stub();
    var secondRequestCallback = sandbox.stub();
    cordial.mayI(firstRequestCallback);

    // act
    cordial.no("key1");
    cordial.mayI(secondRequestCallback);

    // assert
    ok(!firstRequestCallback.called, "First request has not proceeded");
    ok(!secondRequestCallback.called, "Second request has not proceeded");
});

test('Cordial.no() prevents request even if other waiters call Cordial.yes()', 1, function () {
    // arrange
    var cordial = new Cordial();

    cordial.pleaseWait("key1", sandbox.stub());
    cordial.pleaseWait("key2", sandbox.stub());
    cordial.pleaseWait("key3", sandbox.stub());

    var requestCallback = sandbox.stub();
    cordial.mayI(requestCallback);

    // act
    cordial.no("key1");
    cordial.yes("key2");
    cordial.yes("key3");

    // assert
    ok(!requestCallback.called, "Request has not proceeded");
});

test('Cordial.no() does nothing if Cordial.pleaseWait() was not called earlier', 1, function () {
    // arrange
    var cordial = new Cordial();

    cordial.pleaseWait("key", sandbox.stub());

    var requestCallback = sandbox.stub();
    cordial.mayI(requestCallback);

    // act
    cordial.no("bad key");
    cordial.yes("key");

    // assert
    ok(requestCallback.calledOnce, "Request has proceeded");
});

test('Cordial.yesButNotNow() prevents current request but allows future request if no other waiters are waiting', 2, function () {
    // arrange
    var cordial = new Cordial();

    cordial.pleaseWait("key1", sandbox.stub());

    var firstRequestCallback = sandbox.stub();
    var secondRequestCallback = sandbox.stub();
    cordial.mayI(firstRequestCallback);

    // act
    cordial.yesButNotNow("key1");
    cordial.mayI(secondRequestCallback);

    // assert
    ok(!firstRequestCallback.called, "First request has not proceeded");
    ok(secondRequestCallback.calledOnce, "Second request has proceeded");
});

test('Cordial.yesButNotNow() prevents request even if other waiters call Cordial.yes()', 1, function () {
    // arrange
    var cordial = new Cordial();

    cordial.pleaseWait("key1", sandbox.stub());
    cordial.pleaseWait("key2", sandbox.stub());
    cordial.pleaseWait("key3", sandbox.stub());

    var requestCallback = sandbox.stub();
    cordial.mayI(requestCallback);

    // act
    cordial.yesButNotNow("key1");
    cordial.yes("key2");
    cordial.yes("key3");

    // assert
    ok(!requestCallback.called, "Request has not proceeded");
});

test('Cordial.yesButNotNow() does nothing if Cordial.pleaseWait() was not called earlier', 1, function () {
    // arrange
    var cordial = new Cordial();

    cordial.pleaseWait("key", sandbox.stub());

    var requestCallback = sandbox.stub();
    cordial.mayI(requestCallback);

    // act
    cordial.yesButNotNow("bad key");
    cordial.yes("key");

    // assert
    ok(requestCallback.calledOnce, "Request has proceeded");
});

test('Multiple Cordial objects are independent of each other', 1, function () {
    // arrange
    var first = new Cordial();
    var second = new Cordial();

    var waiter = sandbox.stub();
    var request = sandbox.stub();

    first.pleaseWait("key", waiter);

    // act
    second.mayI(request);

    // assert
    ok(request.calledOnce, "Request was allowed from independent Cordial instance");
});
