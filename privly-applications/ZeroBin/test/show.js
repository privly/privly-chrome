/**
 * @fileOverview tests.js Gives testing code for the show page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("ZeroBin Show Suite", function() {
  
  it("can decrypt", function() {
    var cleartext = zeroDecipher("Hl/mK4o5mr554ch4S+TToU+goZCf2GTFAuHI5Bj1JPU=", 
      {"iv":"zCD4WeR59app/TB9SLGsAA",
       "ct":"eKM0cw5ahPT0BncuaRX3Fg",
       "salt":"qlZ9NP065U8"});
    expect(cleartext).toEqual("test");
  });
  
  it("can encrypt then decrypt", function() {
    var key = "Hl/mK4o5mr554ch4S+TToU+goZCf2GTFAuHI5Bj1JPU=";
    var cipherdata = zeroCipher(key, "test");
    var cipher_json = JSON.parse(cipherdata);
    var cleartext = zeroDecipher(key, 
      cipher_json);
    expect(cleartext).toEqual("test");
  });
  
});

(function() {
  
  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 2500;
  var consoleReporter = new jasmine.ConsoleReporter();
  jasmineEnv.addReporter(consoleReporter);
  jasmineEnv.execute();
  
})();
