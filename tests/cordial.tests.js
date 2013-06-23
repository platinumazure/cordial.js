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
        Cordial.reset();
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
    // arrange: nothing to arrange

    // act/assert
    throws(function () {
        Cordial.pleaseWait("key", "not a function");
    }, TypeError, "TypeError was thrown");
});

test('Cordial.mayI() throws TypeError if callback is not a function', 1, function () {
    // arrange: nothing to arrange

    // act/assert
    throws(function () {
        Cordial.mayI("not a function");
    }, TypeError, "TypeError was thrown");
});

test('Cordial.mayI() executes callback immediately if no one is asking to wait', 1, function () {
    // arrange
    var callbackStub = sandbox.stub();

    // act
    Cordial.mayI(callbackStub);

    // assert
    ok(callbackStub.calledOnce, "Callback was called once");
});

test('Cordial.mayI() returns result of callback when executed immediately', 1, function () {
    // arrange
    var expected = "yay";
    var callbackStub = sandbox.stub().returns(expected);

    // act
    var result = Cordial.mayI(callbackStub);

    // assert
    strictEqual(result, expected, "Correct value was returned");
});

test('Cordial.mayI() executes callback with correct calling context and arguments', 3, function () {
    // arrange
    var callbackStub = sandbox.stub();
    var context = {};

    // act
    Cordial.mayI(callbackStub, context, "arg1", "arg2");

    // assert
    ok(callbackStub.calledOnce, "Callback was called once");
    ok(callbackStub.alwaysCalledOn(context), "Callback was called with correct context");
    deepEqual(callbackStub.args[0], ["arg1", "arg2"], "Callback was called with correct arguments");
});

test('Cordial.mayI() does not execute callback if one or more waiters are waiting', 1, function () {
    // arrange
    var callbackStub = sandbox.stub();

    Cordial.pleaseWait("key", sandbox.stub());

    // act
    Cordial.mayI(callbackStub);

    // assert
    ok(!callbackStub.called, "Callback was not called");
});

test('Cordial.mayI() returns false if callback cannot be executed immediately', 1, function () {
    // arrange
    var callbackStub = sandbox.stub().returns("yay");

    Cordial.pleaseWait("key", sandbox.stub());

    // act
    var result = Cordial.mayI(callbackStub);

    // assert
    strictEqual(result, false, "False was returned");
});

test('Cordial.mayI() notifies waiters by invoking callbacks with correct context and arguments', 6, function () {
    // arrange
    var firstWaiter = sandbox.stub();
    var firstContext = {};

    var secondWaiter = sandbox.stub();
    var secondContext = {};

    Cordial.pleaseWait("key1", firstWaiter, firstContext);
    Cordial.pleaseWait("key2", secondWaiter, secondContext, "arg");

    // act
    Cordial.mayI(sandbox.stub());

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
    Cordial.pleaseWait("key", sandbox.stub());
    Cordial.mayI(sandbox.stub());

    // act/assert
    throws(function () {
        Cordial.mayI(sandbox.stub());
    }, Error, "Error was thrown");
});

test('Cordial.mayI() executes two requests if no waiters are waiting', 2, function () {
    // arrange
    var first = sandbox.stub();
    var second = sandbox.stub();

    // act
    Cordial.mayI(first);
    Cordial.mayI(second);

    // assert
    ok(first.calledOnce, "First callback was called once");
    ok(second.calledOnce, "Second callback was called once");
});

test('Cordial.mayI() does not throw Error if called twice with first request being resolved before the second call', 1, function () {
    // arrange
    Cordial.pleaseWait("key", sandbox.stub());
    Cordial.mayI(sandbox.stub());
    Cordial.no("key");

    // act
    Cordial.mayI(sandbox.stub());

    // assert
    ok(true, "No exception was thrown");
});

test('Cordial.yes() does not allow request to proceed if other waiters are still waiting', 1, function () {
    // arrange
    Cordial.pleaseWait("key1", sandbox.stub());
    Cordial.pleaseWait("key2", sandbox.stub());

    var requestCallback = sandbox.stub();
    Cordial.mayI(requestCallback);

    // act
    Cordial.yes("key1");

    // assert
    ok(!requestCallback.called, "Request has not proceeded");
});

test('Cordial.yes() allows request to proceed if no other waiters are still waiting', 1, function () {
    // arrange
    Cordial.pleaseWait("key1", sandbox.stub());
    Cordial.pleaseWait("key2", sandbox.stub());

    var requestCallback = sandbox.stub();
    Cordial.mayI(requestCallback);

    Cordial.yes("key1");

    // act
    Cordial.yes("key2");

    // assert
    ok(requestCallback.calledOnce, "Request has proceeded");
});

test('Cordial.yes() does nothing if Cordial.pleaseWait() was not called earlier', 2, function () {
    // arrange
    Cordial.pleaseWait("key1", sandbox.stub());

    var requestCallback = sandbox.stub();
    Cordial.mayI(requestCallback);

    // act
    Cordial.yes("bad key");

    // assert
    ok(true, "No exception was thrown");
    ok(!requestCallback.called, "Request has not proceeded");
});

test('Cordial.no() prevents current request and defers future request', 2, function () {
    // arrange
    Cordial.pleaseWait("key1", sandbox.stub());

    var firstRequestCallback = sandbox.stub();
    var secondRequestCallback = sandbox.stub();
    Cordial.mayI(firstRequestCallback);

    // act
    Cordial.no("key1");
    Cordial.mayI(secondRequestCallback);

    // assert
    ok(!firstRequestCallback.called, "First request has not proceeded");
    ok(!secondRequestCallback.called, "Second request has not proceeded");
});

test('Cordial.no() prevents request even if other waiters call Cordial.yes()', 1, function () {
    // arrange
    Cordial.pleaseWait("key1", sandbox.stub());
    Cordial.pleaseWait("key2", sandbox.stub());
    Cordial.pleaseWait("key3", sandbox.stub());

    var requestCallback = sandbox.stub();
    Cordial.mayI(requestCallback);

    // act
    Cordial.no("key1");
    Cordial.yes("key2");
    Cordial.yes("key3");

    // assert
    ok(!requestCallback.called, "Request has not proceeded");
});

test('Cordial.no() does nothing if Cordial.pleaseWait() was not called earlier', 1, function () {
    // arrange
    Cordial.pleaseWait("key", sandbox.stub());

    var requestCallback = sandbox.stub();
    Cordial.mayI(requestCallback);

    // act
    Cordial.no("bad key");
    Cordial.yes("key");

    // assert
    ok(requestCallback.calledOnce, "Request has proceeded");
});

test('Cordial.yesButNotNow() prevents current request but allows future request if no other waiters are waiting', 2, function () {
    // arrange
    Cordial.pleaseWait("key1", sandbox.stub());

    var firstRequestCallback = sandbox.stub();
    var secondRequestCallback = sandbox.stub();
    Cordial.mayI(firstRequestCallback);

    // act
    Cordial.yesButNotNow("key1");
    Cordial.mayI(secondRequestCallback);

    // assert
    ok(!firstRequestCallback.called, "First request has not proceeded");
    ok(secondRequestCallback.calledOnce, "Second request has proceeded");
});

test('Cordial.yesButNotNow() prevents request even if other waiters call Cordial.yes()', 1, function () {
    // arrange
    Cordial.pleaseWait("key1", sandbox.stub());
    Cordial.pleaseWait("key2", sandbox.stub());
    Cordial.pleaseWait("key3", sandbox.stub());

    var requestCallback = sandbox.stub();
    Cordial.mayI(requestCallback);

    // act
    Cordial.yesButNotNow("key1");
    Cordial.yes("key2");
    Cordial.yes("key3");

    // assert
    ok(!requestCallback.called, "Request has not proceeded");
});

test('Cordial.yesButNotNow() does nothing if Cordial.pleaseWait() was not called earlier', 1, function () {
    // arrange
    Cordial.pleaseWait("key", sandbox.stub());

    var requestCallback = sandbox.stub();
    Cordial.mayI(requestCallback);

    // act
    Cordial.yesButNotNow("bad key");
    Cordial.yes("key");

    // assert
    ok(requestCallback.calledOnce, "Request has proceeded");
});
