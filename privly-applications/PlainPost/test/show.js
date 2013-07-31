/**
 * @fileOverview tests.js Gives testing code for the options page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("PlainPost Show Suite", function() {
  
  it("runs tests", function() {
    expect(true).toBe(true);
  });
  
});

(function() {
  
  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 2500;
  var consoleReporter = new jasmine.ConsoleReporter();
  jasmineEnv.addReporter(consoleReporter);
  jasmineEnv.execute();
  
})();
