/**
 * @fileOverview tests.js Gives testing code for the Chrome Extension.
 * It is currently being used to develope new functionality, but test
 * cases will be added for complete code coverage. It recently changed 
 * to the Jasmine JS testing library, but full integration is not complete.
 * Notably, the testing style is not following Jasmine's conventions on
 * "wait."
 **/
 
describe ("Options Suite", function() {
  console.log("In the tests");
  it("temporarily tests if tests load", function() {
      expect(true).toEqual(true);
  });
});


(function() {
  jasmine.getEnv().addReporter(new jasmine.ConsoleReporter());
  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.execute();
})();
