/**
 * cordial.tests.js: QUnit tests for Cordial.js.
 */

test('Cordial.noConflict() resets Cordial object and returns itself', 2, function () {
    // arrange
    var currentCordial = Cordial;

    // act
    var result = Cordial.noConflict();

    // assert
    notEqual(result, Cordial, "window.Cordial no longer points to Cordial module");
    strictEqual(result, currentCordial, "Cordial.noConflict() returns the Cordial module instance");
});
