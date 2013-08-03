/**
 * @fileOverview tests.js Gives testing code for the new page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("ZeroBin New Suite", function() {
  
  it("initializes properly", function() {
    var domain = privlyNetworkService.contentServerDomain();
    expect(domain).toBe($(".home_domain").attr("href"));
    expect(domain.split("/")[2]).toBe($(".home_domain").text());
  });
  
});

(function() {
  
  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 2500;
  var consoleReporter = new jasmine.ConsoleReporter();
  jasmineEnv.addReporter(consoleReporter);
  jasmineEnv.execute();
  
})();
