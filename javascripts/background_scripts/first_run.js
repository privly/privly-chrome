/**
 * @fileOverview This file opens a tab with the first run html doc under
 * appropriate conditions when the extension is loaded on browser launch or
 * on extension install.
 *
 * Appropriate conditions fall under two circumstances:
 * 1. LocalStorage does not have a stored value for the version of privly
 *    installed. (Privly was just installed or localStorage was cleared)
 * 2. The version stored in the manifest differs from the version stored in
 *    localStorage. (Privly was updated)
 *
 **/

 /*global chrome:false, ls:true */

/**
 * @namespace for the firstRun functionality.
 */


chrome.runtime.onInstalled.addListener(function(details){
  
   // Open the first run page only on new installations.
    var postingDomain = ls.getItem("posting_content_server_url");
   
    if (postingDomain === undefined || postingDomain === null) {
      ls.setItem("posting_content_server_url", "https://privlyalpha.org");
    }

  
    if ( details.previousVersion === undefined ) {
    var page = chrome.extension.getURL("privly-applications/Pages/ChromeFirstRun.html");
     chrome.tabs.create({
          url: page,
         active: true
     });
    }
});


var firstRun = {

  runFirstRun: function() {

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
firstRun.runFirstRun();
