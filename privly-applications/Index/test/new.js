/**
 * @fileOverview tests.js Gives testing code for the new page.
 * This spec is managed by the Jasmine testing library.
 *
 * More information on testing:
 * https://github.com/privly/privly-organization/wiki/Testing
 *
 **/

/**
 * Helper function for resetting the state of the application to the initial
 * state of the app. Since the application first checks its status with the
 * remote server, this function blocks execution until it knows the app is
 * intialized or there was likely an error. 
 *
 * @param {boolean} loggedOut Indicates whether the user should be logged out
 * of the app (true) or logged into the app
 */
function initializeApp(loggedOut) {
  
  // used to check if asynchronous calls completed
  var initializationFlag = false;
  
  //clear the table
  var table = $.fn.dataTable.fnTables(true);
  if( table.length > 0 )
    $(table[0]).dataTable().fnDestroy(false);
  $("#table_body").children().remove();
  
  if(loggedOut) {
  
    //log the user out
    var domain = privlyNetworkService.contentServerDomain();
    privlyNetworkService.authToken = "auth_token=pE8dHprCJ79QENLedELx";
    $.post(domain + "/users/sign_out", "_method=delete", function(data) {
      privlyNetworkService.authToken = "";
      callbacks.pendingLogin();
    });
  } else {
  
    // Log the user in using the auth token for the user
    // danger.dont.use.bork.bork.bork@privly.org
    // You must create this user and assign it the auth token as
    // below
    privlyNetworkService.authToken = "auth_token=pE8dHprCJ79QENLedELx";
    callbacks.pendingLogin();
  }
  
  // The runs function allows the testing library to complete the asynchronous
  // calls before executing this testing code
  runs(function() {
    setTimeout(function() {
      if($('#loadingDiv').is(":hidden")) initializationFlag = true;
    }, 900);
  });
  
  // Waits for the initialization to complete or fails
  waitsFor(function() {
    return initializationFlag;
  }, "The app was not initialized", 1000);
}

// WARNING: These tests require the existence of an authentication_token
// equal to: "pE8dHprCJ79QENLedELx"
describe ("Index Logged In New Suite", function() {
  
  beforeEach(function(){initializeApp(false);});
  
  it("initializes properly", function() {
    runs(function() {
      var domain = privlyNetworkService.contentServerDomain();
      expect(domain).toBe($(".home_domain").attr("href"));
      expect(domain.split("/")[2]).toBe($(".home_domain").text());
      expect($(".logged_in_nav").is(':visible')).toBe(true);
      expect($(".logged_out_nav").is(':hidden')).toBe(true);
    });
  });
  
  it("does not result in an error", function() {
    runs(function() {
      resizeIframePostedMessage({origin: "sham"});
      expect(true).toBe(true);
    });
  });
  
});

describe ("Index Logged out New Suite", function() {
  
  beforeEach(function(){initializeApp(true);});
  
  it("initializes properly", function() {
    runs(function() {
      var domain = privlyNetworkService.contentServerDomain();
      expect(domain).toBe($(".home_domain").attr("href"));
      expect(domain.split("/")[2]).toBe($(".home_domain").text());
      expect($(".logged_in_nav").is(':hidden')).toBe(true);
      expect($(".logged_out_nav").is(':visible')).toBe(true);
    });
  });
  
  it("does not result in an error", function() {
    runs(function() {
      resizeIframePostedMessage({origin: "sham"});
      expect(true).toBe(true);
    });
  });
  
});

