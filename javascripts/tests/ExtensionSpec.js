/**
 * @fileOverview tests.js Gives testing code for the Chrome Extension.
 * It is currently being used to develope new functionality, but test
 * cases will be added for complete code coverage. It recently changed
 * to the Jasmine JS testing library, but full integration is not complete.
 * Notably, the testing style is not following Jasmine's conventions on
 * "wait."
 **/

describe("Extension", function() {

  /**
  * Tests modal button functionality. This is a naively implemented
  * test case. Future versions should more gracefully handle Chrome's
  * callbacks. This example indicates that every function may need to
  * support a callback parameter in order to support asynchronous testing.
  *
  * todo: move this test to the popup.html tests. It still works here but it
  * is no longer the proper location for the test.
  *
  */
  it("should change the modal button", function() {

    //Get all the windows so we can get a tab
    chrome.windows.getAll({"populate" : true},
      function(windows){

        // Get a valid Tab
        var tab = null;
        for (var i = 0; i < windows.length; i++) {
          if(windows[i].tabs.length > 0) {
            tab = windows[i].tabs[0];
          }
        }

        // Get the current setting of the badge text
        // so we can flip it.
        chrome.browserAction.getBadgeText({},
          function(currentText) {
            // We define a callback for the function we are testing so we can
            // check the results without needing to use setTimeout
            function testingCallback() {
              if (currentText === "off") {
                chrome.browserAction.getBadgeText({},
                  function(currentText) {
                  expect(currentText).toEqual("on");
                  }
                );
              } else if(currentText === "on") {
                chrome.browserAction.getBadgeText({},
                  function(currentText) {
                  expect(currentText).toEqual("off");
                  }
                );
              } else {
                expect("false").toEqual("true");
              }
              // Attempt to toggle the modal button back to its prior state
              modalButton.modeChange({request: {handler: "modeChange"}});
            }

            // Now that we have setup the test, it is time to check
            // whether we can change the mode
            modalButton.modeChange({request: {handler: "modeChange"}}, testingCallback);
          }
        );
      }
    );
  });
});


/**
 * Make sure the first run window appears appropriately.
 */
describe ("First Run Suite", function() {
  var page = "/privly-applications/Pages/ChromeFirstRun.html";

  function close_page(page){
    var url = chrome.extension.getURL(page);
    chrome.tabs.query({url:url},function(tabs){
      if(tabs.length > 1){
        console.log("There should not be more than one tab open on the First Run page.");
      }

      // if there is a first_run.html open
      if(tabs[0]){
          chrome.tabs.remove(tabs[0].id); //close it
      }
    });
  }

  /*
   * Test the function that gets the running privly version.
   */
  it("tests get_privly_version", function() {
    var output = firstRun.getPrivlyVersion();
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });

  /*
   * Test the function that gets the version in local storage.
   */
  it("tests getStoredVersion", function() {
    var output = firstRun.getStoredVersion();
    expect(output).toEqual(localStorage["version"]);
  });

  /*
   * Test the function that updates local storage with the running version.
   */
  it("tests update_version", function() {
    var existing = firstRun.getStoredVersion();
    var modified = existing + "99";
    firstRun.updateVersion(modified);
    expect(firstRun.getStoredVersion()).toEqual(modified);
    firstRun.updateVersion(existing);
  });


  /*
   * Test the function that launches the first_run.html page.
   */
  it("tests firstrun function", function(){
    var flag = false;
    var count = null;
    runs(function(){
      firstRun.updateVersion("-1");
      firstRun.runFirstRun();
      var url = chrome.extension.getURL("/privly-applications/Pages/ChromeFirstRun.html");
      chrome.tabs.query({url:url},function(tabs){
        count = tabs.length;
        close_page(page);
        flag = true;
      });
    });
    waitsFor(function(){
      return flag;
    },"Should have been done", 1000);
    runs(function(){
      expect(count).toEqual(1);
      firstRun.updateVersion(firstRun.getPrivlyVersion());
    });
  });

});

(function() {
  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 2500;
  var consoleReporter = new jasmine.ConsoleReporter();
  jasmineEnv.addReporter(consoleReporter);
  jasmineEnv.execute();
})();
