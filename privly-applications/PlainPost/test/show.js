/**
 * @fileOverview tests.js Gives testing code for the show page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("PlainPost Show Suite", function() {
  
  it("runs tests", function() {
    expect(true).toBe(true);
  });
  
});

describe ("Shared JS Parameters Test Suite", function() {
  
  it("Doesn't change the application URL", function() {
    var url = "http://localhost:3000/apps/PlainPost/show?privlyApp=PlainPost&privlyInject1=true&random_token=85f6951386&privlyDataURL=http%3A%2F%2Flocalhost%3A3000%2Fposts%2F221.json%3Frandom_token%3D85f6951386#";
    var applicationUrl = privlyParameters.getApplicationUrl(url);
    expect(url).toBe(applicationUrl);
  });
  
  it("Does change the application URL", function() {
    var url = "PLATOFRM_PROTOCOL://SPECIAL?privlyOriginalURL=http://localhost:3000/apps/PlainPost/show?privlyApp=PlainPost&privlyInject1=true&random_token=85f6951386&privlyDataURL=http%3A%2F%2Flocalhost%3A3000%2Fposts%2F221.json%3Frandom_token%3D85f6951386#";
    var applicationUrl = privlyParameters.getApplicationUrl(url);
    expect(url).not.toBe(applicationUrl);
  });
  
  it("Gets a URL parameter", function() {
    var url = "http://localhost:3000/apps/PlainPost/show?privlyApp=PlainPost&privlyInject1=true&random_token=85f6951386&privlyDataURL=http%3A%2F%2Flocalhost%3A3000%2Fposts%2F221.json%3Frandom_token%3D85f6951386#";
    var applicationUrl = privlyParameters.getApplicationUrl(url);
    var params = privlyParameters.getParameterHash(url);
    expect(params.privlyDataURL).toBe("http://localhost:3000/posts/221.json?random_token=85f6951386");
  });
  
  it("Gets a URL parameter from the hash", function() {
    var url = "http://localhost:3000/apps/PlainPost/show?privlyApp=PlainPost&privlyInject1=true&random_token=85f6951386#privlyDataURL=http%3A%2F%2Flocalhost%3A3000%2Fposts%2F221.json%3Frandom_token%3D85f6951386";
    var applicationUrl = privlyParameters.getApplicationUrl(url);
    var params = privlyParameters.getParameterHash(url);
    expect(params.privlyDataURL).toBe("http://localhost:3000/posts/221.json?random_token=85f6951386");
  });
  
  it("Preferentially overwrites parameters from the parameter string", function() {
    var url = "http://localhost:3000/apps/PlainPost/show?privlyApp=PlainPost&privlyDataURL=1&privlyInject1=true&random_token=85f6951386#privlyDataURL=http%3A%2F%2Flocalhost%3A3000%2Fposts%2F221.json%3Frandom_token%3D85f6951386";
    var applicationUrl = privlyParameters.getApplicationUrl(url);
    var params = privlyParameters.getParameterHash(url);
    expect(params.privlyDataURL).toBe("1");
  });
  
});

(function() {
  
  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 2500;
  var consoleReporter = new jasmine.ConsoleReporter();
  jasmineEnv.addReporter(consoleReporter);
  jasmineEnv.execute();
  
})();
