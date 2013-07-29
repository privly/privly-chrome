/**
 * @fileOverview tests.js Gives testing code for the options page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Options Suite", function() {
  
  var value, flag;
  
  it("tests if tests load", function() {
    expect(true).toEqual(true);
  });
  
  it("tests localStorage bindings", function() {
    expect(localStorage["posting_content_server_url"].length).toBeGreaterThan(0);
    expect(localStorage["privly_glyph"].length).toBeGreaterThan(0);
    expect(localStorage["privly_glyph"].split(",").length).toBeGreaterThan(5);
  });
  
  it("tests reachability of content servers", function() {
    expect(validateContentServer("https://www.google.com")).toBe(true);
    expect(validateContentServer("https://privlyalpha.org")).toBe(true);
    expect(validateContentServer("com")).toBe(false);
  });
  
  it("tests writeability of glyph", function() {
    writeGlyph();
  });
  
  it("tests generation of new glyph", function() {
    
    var oldGlyph = localStorage["privly_glyph"];
    
    //todo, make regenerateGlyph() not reload the page. 
    //This kills the testing console.
    //regenerateGlyph()
    expect(true).toEqual(false);
    var newGlyph = localStorage["privly_glyph"];
    expect(oldGlyph).not.toEqual(newGlyph);
    localStorage["privly_glyph"] = oldGlyph;
  });
  
});

(function() {
  
  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 2500;
  var consoleReporter = new jasmine.ConsoleReporter();
  jasmineEnv.addReporter(consoleReporter);
  jasmineEnv.execute();
  
})();
