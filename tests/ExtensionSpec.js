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
   */
  it("should change the modal button", function() {
    //Get all the windows so we can get a tab
    var tab = null;
    var originalBadgeText= null;
    var flag,flag1;

    runs(function(){
      flag = false;
      chrome.windows.getAll({"populate" : true},function(windows){
        // Get a valid Tab
        for (var i = 0; i < windows.length; i++) {
          if(windows[i].tabs.length > 0) {
            tab = windows[i].tabs[0];
            flag = true;
            break;
          }
        }
      });
    });
    waitsFor(function(){
      return flag;
    }, "The tab should be defined",1000);
    runs(function(){
      flag1 = false;
      // Get the current setting of the badge text
      // so we can flip it.
      chrome.browserAction.getBadgeText({}, function(currentText) {
        originalBadgeText = currentText;
        flag1 = true;
      });
    });
    waitsFor(function(){
      return flag1;
    }, "The originalBadgeText should be defined",1000);
    runs(function(){
      // We define a callback for the function we are testing so we can
      // check the results without needing to use setTimeout
      function testingCallback() {
        if (originalBadgeText === "off") {
          chrome.browserAction.getBadgeText({},
            function(currentText) {
              expect(currentText).toEqual("on");
            }
          );
        } else if(originalBadgeText === "on") {
          chrome.browserAction.getBadgeText({},
            function(currentText) {
              expect(currentText).toEqual("off");
            }
          );
        } else {
          expect("false").toEqual("true");
        }
        
        // Attempt to toggle the modal button back to its prior state
        modalButtonCallback(tab);
      }
      
      // Now that we have setup the test, it is time to check the
      modalButtonCallback(tab, testingCallback);
    });
  });
});

describe ("First Run Suite", function() {
  var page = chrome.extension.getURL("pages/first_run.html");

  function close_page(page){
    chrome.tabs.query({url:page},function(tabs){
      if(tabs.length > 1){
        console.log("Bad news bears");
      }
      if(tabs[0]){ // if there is a first_run.html open
        chrome.windows.remove(tabs[0].id); //close it
      }
    });
  }
  beforeEach(function(){
    close_page(page);
  });
  afterEach(function(){
    close_page(page);
  });

  /*
   * Test the function that gets the running privly version.
   */
  it("tests get_privly_version", function() {
    var output = get_privly_version();
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });

  /*
   * Test the function that gets the version in local storage.
   */
  it("tests get_stored_version", function() {
    var output = get_stored_version();
    expect(output).toEqual(localStorage["version"]);
  });

  /*
   * Test the function that updates local storage with the running version.
   */
  it("tests update_version", function() {
    var existing = get_stored_version();
    var modified = existing + "99";
    update_version(modified);
    expect(get_stored_version()).toEqual(modified);
    update_version(existing);
  });


  /*
   * Test the function that launches the first_run.html page.
   */
  it("tests firstrun function", function(){
    firstrun(); // launch first_run.html
    chrome.tabs.query({url:page},function(tabs){
      console.log(tabs.length);
      expect(tabs.length).toEqual(1);
    });
  });

  /*
   * Test the function that launches the first_run.html page when not new or
   * updated.
   */
  it("should not open firstrun.html when not new or updated", function(){
    var stored = get_stored_version();
    var running = get_privly_version();
    expect(stored).toEqual(running);

    run_firstrun(); // execute firstrun launch logic 
    chrome.tabs.query({url:page},function(tabs){
      console.log(tabs.length);
      expect(tabs.length).toEqual(0);
    });
  });
  
  /*
   * Test the function that launches the first_run.html page when new.
   */
  it("should open firstrun.html when new", function(){
    var stored = get_stored_version();
    update_version(null);
    run_firstrun(); // execute firstrun launch logic 
    update_version(stored);
    chrome.tabs.query({url:page},function(tabs){
      console.log(tabs.length);
      expect(tabs.length).toEqual(1);
    });
  });

  /*
   * Test the function that launches the first_run.html page when updated.
   */
  it("should open firstrun.html when updated", function(){
    var stored = get_stored_version();
    var running = get_privly_version();
    update_version(stored+"99");
    var modified = get_stored_version();
    expect(stored).not.toEqual(modified);
    run_firstrun(); // execute firstrun launch logic 
    update_version(stored); //restore starting version
    chrome.tabs.query({url:page},function(tabs){
      console.log(tabs.length);
      expect(tabs.length).toEqual(1);
    });
  });
});


(function() {
  jasmine.getEnv().addReporter(new jasmine.ConsoleReporter());
  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.execute();
})();
