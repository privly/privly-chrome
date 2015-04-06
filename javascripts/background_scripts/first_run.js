/**
 * @fileOverview This file opens a tab with the first run html doc under
 * appropriate conditions when the extension is loaded on extension install.
 **/

/*global chrome:false, ls:true */

// Automatically open the first-run page when the extension is newly installed
chrome.runtime.onInstalled.addListener(function(details){
  if ( details.previousVersion === undefined ) {

    // Wait for firstRun.initializeApplication() to complete
    setTimeout(
      function(){
        var page = chrome.extension.getURL("privly-applications/Pages/ChromeFirstRun.html");
        chrome.tabs.create({
          url: page,
          active: true
        });
      },
      200
    );
  }
});

/**
 * @namespace for the firstRun functionality.
 */
var firstRun = {

  /**
   * Initialize the content server selection and the anti-spoofing
   * glyph.
   */
  initializeApplication: function() {

    // Open the first run page only on new installations.
    var postingDomain = ls.getItem("posting_content_server_url");

    if (postingDomain === undefined || postingDomain === null) {
      ls.setItem("posting_content_server_url", "https://privlyalpha.org");
    }

    // Initialize the spoofing glyph
    // The generated string is not cryptographically secure and should not be used
    // for anything other than the glyph.
    if (ls.getItem("glyph_cells") === undefined) {

      // Dissable the posting button by default if the user already has
      // the extension installed.
      if ( ls.getItem("posting_content_server_url") !== undefined ) {
        ls.setItem("Options:DissableButton", "true");
      }

      ls.setItem("glyph_color", Math.floor(Math.random()*16777215).toString(16));
      var glyph_cells = ((Math.random() < 0.5) ? "false" : "true");
      for(var i = 0; i < 14; i++) {
        glyph_cells += "," + ((Math.random() < 0.5) ? "false" : "true");
      }
      ls.setItem("glyph_cells", glyph_cells);
    }

  }
};

// Run this script
firstRun.initializeApplication();
