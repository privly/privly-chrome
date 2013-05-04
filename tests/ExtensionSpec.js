/**
 * @fileOverview tests.js Gives testing code for the Chrome Extension.
 * It is currently being used to develope new functionality, but test
 * cases will be added for complete code coverage. It recently changed 
 * to the Jasmine JS testing library, but full integration is not complete.
 * Notably, the testing style is not following Jasmine's conventions on
 * "wait."
 **/
 
describe("Extension", function() {

  beforeEach(function() {
    //pass
  });
  
  /** 
   * Tests modal button functionality. This is a naively implemented
   * test case. Future versions should more gracefully handle Chrome's
   * callbacks. This example indicates that every function may need to 
   * support a callback parameter in order to support asynchronous testing.
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
              modalButtonCallback(tab);
            }
            
            // Now that we have setup the test, it is time to check the
            modalButtonCallback(tab, testingCallback);
          }
        );
      }
    );
  });
});
describe ("First Run Suite", function() {

    /*
     * Test the function that gets the running privly version
     */
    it("tests getPrivlyVersion", function() {
        var output = getPrivlyVersion();
        expect(output).toMatch(/\d+\.\d+\.\d+/);
    });

    /*
     * Test the function that gets the version in local storage
     */
    it("tests getStoredVersion", function() {
        var output = getStoredVersion();
        expect(output).toEqual(localStorage["version"]);
    });

    /*
     * Test the function that updates local storage with the running version
     */
    it("tests update_version", function() {
        var existing = getStoredVersion();
        var modified = existing + "99";
        update_version(modified);
        expect(getStoredVersion()).toEqual(modified);
        update_version(existing);
    });

    /*
     * Test the function that launches the first_run.html page
     */
    it("tests firstrun function", function(){
      //Get the url of the first_run.html
      var page = chrome.extension.getURL("pages/first_run.html");
      var Window = 0;
      //Look at all windows
      chrome.windows.getAll({populate:true},function(window_list){
        var count_before = 0;
        var nope = 0;
        for (var i = 0; i < window_list.length; i++){
          //return all tabs in each window that match the first_run url
          chrome.tabs.query({windowId:parseInt(window_list[i].id,10),url:page},function(tab){
            count_before+=1
          });
          waits(500);
          //if on the last window
         if (i === window_list.length-1){
            //load new window
            firstrun();
            var count_after = 0;
            //Look at all windows
            chrome.windows.getAll({populate:true},function(win_list){
              for(var i = 0; i < win_list.length; i++){
                //return all tabs in each window that match the first_run url
                chrome.tabs.query({windowId:parseInt(win_list[i].id,10),url:page},function(tab){
                  count_after+=1;
                });
                waits(500);
                if ( i === win_list.length-1){
                    expect(count_after).toEqual(count_before+1);
                }
              }
            });
          }
        }
      });
    });

    /*
     * Test the function that launches the first_run.html page when not updated or new
     */
    it("should not open firstrun html when not new or updated", function() {
      var page = chrome.extension.getURL("pages/first_run.html");
      var stored = getStoredVersion();
      var running = getPrivlyVersion();
      var tabs_before = 0;
      chrome.windows.getAll({populate:true},function(win_list){
        for(var i = 0; i < win_list.length; i++){
          chrome.tabs.query({windowId:parseInt(win_list[i].id,10),url:page},function(tab){
            tabs_before+= tab.length;
          });
          waits(500);
          if (i === win_list.length-1 && stored === running){
            run_firstrun();
            var tabs_after = 0;
            chrome.windows.getAll({populate:true},function(wind_list){
              for (var i = 0; i < wind_list.length; i++){
                chrome.tabs.query({windowId:parseInt(wind_list[i].id,10),url:page},function(tab){
                  tabs_after += tab.length;
                });
                waits(500);
                if (i === wind_list.length-1){
                  expect(tabs_after).toEqual(tabs_before);
                }
              }
            });
          } 
        }
      });
    });

    /*
     * Test the function that launches the first_run.html page when new
     */
    it("should open firstrun html when new", function() {
      var page = chrome.extension.getURL("pages/first_run.html");
      var stored = getStoredVersion();
      var running = getPrivlyVersion();
      var tabs_before = 0;
      chrome.windows.getAll({populate:true},function(win_list){
        for(var i = 0; i < win_list.length; i++){
          chrome.tabs.query({windowId:parseInt(win_list[i].id,10),url:page},function(tab){
            tabs_before+= tab.length;
          });
          waits(500);
          if (i === win_list.length-1){
            update_version(null);
            run_firstrun();
            update_version(stored);
            var tabs_after = 0;
            chrome.windows.getAll({populate:true},function(wind_list){
              for (var i = 0; i < wind_list.length; i++){
                chrome.tabs.query({windowId:parseInt(wind_list[i].id,10),url:page},function(tab){
                  tabs_after += tab.length;
                });
                waits(500);
                if (i === wind_list.length-1){
                  expect(tabs_after).toEqual(tabs_before+1);
                }
              }
            });
          }
        }
      });
    });

    /*
     * Test the function that launches the first_run.html page when updated
     */
    it("should open firstrun html when updated", function() {
      var page = chrome.extension.getURL("pages/first_run.html");
      var stored = getStoredVersion();
      var running = getPrivlyVersion();
      var tabs_before = 0;
      chrome.windows.getAll({populate:true},function(win_list){
        for(var i = 0; i < win_list.length; i++){
          chrome.tabs.query({windowId:parseInt(win_list[i].id,10),url:page},function(tab){
            tabs_before+= tab.length;
          });
          waits(500);
          if (i === win_list.length-1){
            //modify version in local storage
            update_version(stored+"99");
            run_firstrun();
            //reset version to original
            update_version(stored);
            var tabs_after = 0;
            chrome.windows.getAll({populate:true},function(wind_list){
              for (var i = 0; i < wind_list.length; i++){
                chrome.tabs.query({windowId:parseInt(wind_list[i].id,10),url:page},function(tab){
                  tabs_after += tab.length;
                });
                waits(500);
                if (i === wind_list.length-1){
                  expect(tabs_after).toEqual(tabs_before+1);
                }
              }
            });
          }
        }
      });
    });
});

(function() {
  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 1000;
  
  var htmlReporter = new jasmine.HtmlReporter();
  
  jasmineEnv.addReporter(htmlReporter);
  
  jasmineEnv.specFilter = function(spec) {
    return htmlReporter.specFilter(spec);
  };
  
  var currentWindowOnload = window.onload;
  
  window.onload = function() {
    if (currentWindowOnload) {
      currentWindowOnload();
    }
    execJasmine();
  };
  
  function execJasmine() {
    jasmineEnv.execute();
  }
})();
